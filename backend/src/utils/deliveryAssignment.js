const Delivery = require("../models/Delivery.js");
const Tailor = require("../models/Tailor.js");
const Order = require("../models/Order.js");
const Customer = require("../models/Customer.js");
const { sendNotification } = require("./notification.js");
const { tryGetIO } = require("../config/socket.js");
const { getDistanceFromLatLonInKm } = require("./haversine.js");
const { coordsFromLocation, resolvePickupStartCoords, resolveDropoffStartCoords } = require("./resolveDeliveryCoords.js");

const DEFAULT_SEARCH_RADIUS_M = 15000; // 15km

/**
 * Broadcasts a delivery job request to all available, in-radius partners.
 * @param {ObjectId} orderId - The Order ID
 * @param {String} cycle - "pickup" (Customer -> Tailor) or "dropoff" (Tailor -> Customer)
 */
exports.autoAssignDelivery = async (orderId, cycle = "pickup") => {
  try {
    const order = await Order.findById(orderId).populate("tailor customer");
    if (!order) return false;

    const query = {
      isAvailable: true,
      cashBlocked: { $ne: true },
      user: { $nin: order.rejectedBy || [] },
    };

    let startCoords = null; // [lng, lat]
    let customerDoc = null;

    if (order.customer) {
      customerDoc = await Customer.findOne({
        user: order.customer._id || order.customer,
      }).lean();
    }

    if (cycle === "pickup") {
      startCoords = resolvePickupStartCoords(order, customerDoc);

      // If still no usable coords, try live geocode from address text
      if (!startCoords && order.deliveryAddress) {
        try {
          const axios = require("axios");
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;
          if (apiKey && apiKey !== "your_google_maps_api_key" && apiKey !== "your_backend_google_maps_api_key_here") {
            const a = order.deliveryAddress;
            const addressString = `${a.street || ""}, ${a.city || ""}, ${a.state || ""}, ${a.zipCode || ""}, India`;
            const geoResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
              params: { address: addressString, key: apiKey },
            });
            if (geoResponse.data.status === "OK" && geoResponse.data.results[0]) {
              const loc = geoResponse.data.results[0].geometry.location;
              startCoords = [loc.lng, loc.lat];
              console.log(`🗺️ [deliveryAssignment] Geocoded pickup start to [${loc.lat}, ${loc.lng}]`);
            }
          }
        } catch (geoErr) {
          console.warn("⚠️ [deliveryAssignment] Geocode fallback failed:", geoErr.message);
        }
      }

      // Persist corrected coords onto the order so later distance filters stay consistent
      if (startCoords) {
        if (!order.deliveryAddress) order.deliveryAddress = {};
        const existing = order.deliveryAddress.location?.coordinates;
        const needsCoordFix =
          !existing ||
          existing[0] !== startCoords[0] ||
          existing[1] !== startCoords[1];

        if (needsCoordFix) {
          order.deliveryAddress.location = {
            type: "Point",
            coordinates: startCoords,
          };
        }

        // Fix Unknown city/state from street text when possible
        const { inferCityFromText, normalizeCity } = require("./resolveDeliveryCoords.js");
        if (!normalizeCity(order.deliveryAddress.city)) {
          const inferred = inferCityFromText(
            order.deliveryAddress.street,
            order.deliveryAddress.state
          );
          if (inferred) {
            order.deliveryAddress.city =
              inferred.charAt(0).toUpperCase() + inferred.slice(1);
            if (!normalizeCity(order.deliveryAddress.state)) {
              order.deliveryAddress.state = "Madhya Pradesh";
            }
          }
        }
      }
    } else {
      const tailorProfile = await Tailor.findOne({
        user: order.tailor._id || order.tailor,
      }).lean();
      startCoords = resolveDropoffStartCoords(tailorProfile, order);
    }

    let candidateRiders = [];
    const searchRadius = order.currentSearchRadius || DEFAULT_SEARCH_RADIUS_M;

    if (startCoords) {
      try {
        candidateRiders = await Delivery.find({
          ...query,
          currentLocation: {
            $near: {
              $geometry: { type: "Point", coordinates: startCoords },
              $maxDistance: searchRadius,
            },
          },
        }).populate("user");
      } catch (geoError) {
        console.error("⚠️ Geospatial search failed:", geoError.message);
      }
    }

    // Find all available/online delivery partners
    const allRiders = await Delivery.find(query).populate("user");

    if (startCoords && candidateRiders.length > 0) {
      // Also include available riders who don't have location set yet so no online partner misses the broadcast
      const noLocRiders = allRiders.filter((r) => !r.currentLocation?.coordinates || r.currentLocation.coordinates.length < 2);
      const existingIds = new Set(candidateRiders.map((r) => r._id.toString()));
      for (const r of noLocRiders) {
        if (!existingIds.has(r._id.toString())) {
          candidateRiders.push(r);
        }
      }
    } else if (candidateRiders.length === 0) {
      console.warn(
        `⚠️ [deliveryAssignment] No geo candidates in ${searchRadius / 1000}km. Broadcasting to all ${allRiders.length} available partners...`
      );

      if (startCoords) {
        const destLat = startCoords[1];
        const destLng = startCoords[0];
        const maxKm = searchRadius / 1000;

        candidateRiders = allRiders
          .map((r) => {
            let distance = Infinity;
            const c = r.currentLocation?.coordinates;
            if (c?.length >= 2) {
              distance = getDistanceFromLatLonInKm(c[1], c[0], destLat, destLng);
            }
            return { rider: r, distance, hasNoLoc: !c || c.length < 2 };
          })
          .filter((item) => item.hasNoLoc || item.distance <= maxKm)
          .sort((a, b) => a.distance - b.distance)
          .map((item) => item.rider);
      }

      // Last resort: notify all available partners if no specific rider matched within radius
      if (candidateRiders.length === 0 && allRiders.length > 0) {
        console.warn(
          `⚠️ [deliveryAssignment] Broadcasting to all ${allRiders.length} available partners.`
        );
        candidateRiders = allRiders;
      }
    }

    if (candidateRiders.length > 0) {
      console.log(`\n================================`);
      console.log(`🏍️  BROADCASTING TO ${candidateRiders.length} DELIVERY PARTNER(S)`);
      console.log(`Order ID: ${order.orderId}`);
      console.log(`Cycle: ${cycle}`);
      console.log(`Radius: ${searchRadius / 1000}km`);
      if (startCoords) console.log(`Start: [${startCoords[1]}, ${startCoords[0]}]`);
      console.log(`================================\n`);

      const candidateIds = candidateRiders.map((r) => r.user._id);

      order.pendingPartnerCandidates = candidateIds;
      order.requestSentAt = new Date();
      order.currentSearchRadius = searchRadius;

      // Clean any stale assignments from previous cycle/failure (must $unset, not undefined)
      if (cycle === "pickup") {
        order.set("pickupPartner", undefined);
        order.pickupDeliveryStatus = "pending";
      } else {
        order.set("dropoffPartner", undefined);
        order.dropoffDeliveryStatus = "pending";
      }
      order.set("deliveryPartner", undefined);
      order.deliveryStatus = "pending";

      order.trackingHistory.push({
        status: "searching-delivery-partner",
        message: `Broadcasted job request for ${cycle} to ${candidateRiders.length} nearby available partners within ${searchRadius / 1000}km.`,
        timestamp: new Date(),
      });
      await order.save();

      const title =
        cycle === "pickup" ? "New Fabric Pickup Request! 🛵" : "New Delivery Request! 🛵";
      const message =
        cycle === "pickup"
          ? `New job: Fabric pickup for order ${order.orderId}. Please accept or reject.`
          : `New job: Final delivery for order ${order.orderId}. Please accept or reject.`;

      const taskType = cycle === "pickup" ? "fabric-pickup" : "final-delivery";
      const statusType =
        cycle === "pickup" ? "fabric-ready-for-pickup" : "ready-for-delivery";

      const io = tryGetIO();
      const defaultAddress =
        customerDoc?.addresses?.find((a) => a.isDefault) || customerDoc?.addresses?.[0];

      for (const rider of candidateRiders) {
        const partnerId = rider.user._id.toString();

        await sendNotification({
          recipient: partnerId,
          type: "NEW_DELIVERY_TASK",
          title,
          message,
          data: {
            orderId: order._id,
            orderId_str: order.orderId,
            type: statusType,
            taskType,
            requiresAcceptance: true,
            targetUrl: "/delivery/tasks",
            deliveryEarnings:
              order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
            deliveryDistance: order.deliveryDistance,
          },
        });

        if (io) {
          io.to(`user_${partnerId}`).emit("new_notification", {
            type: "NEW_DELIVERY_TASK",
            title,
            message,
            data: {
              orderId: order._id,
              orderId_str: order.orderId,
              requiresAcceptance: true,
              taskType,
              targetUrl: "/delivery/tasks",
              deliveryEarnings:
                order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
              deliveryDistance: order.deliveryDistance,
            },
          });

          io.to(`user_${partnerId}`).emit("new_order", {
            ...order.toObject(),
            id: order._id,
            _id: order._id,
            orderId: order.orderId,
            vendorName: order.tailor?.shopName || order.tailor?.name,
            vendorAddress: order.tailor?.address,
            vendorLocation: order.tailor?.location,
            customerLocation: defaultAddress?.location,
            address: defaultAddress,
            customer: order.customer?.name,
            isReturn: false,
            taskType,
            requiresAcceptance: true,
            deliveryFee:
              order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
          });

          io.to(`user_${partnerId}`).emit("new_task", {
            _id: order._id,
            orderId: order.orderId,
            taskType,
            requiresAcceptance: true,
          });
        }
      }

      if (io) {
        const sharedBroadcastPayload = {
          ...order.toObject(),
          id: order._id,
          _id: order._id,
          orderId: order.orderId,
          status: order.status,
          taskType: cycle === "pickup" ? "fabric-pickup" : "order-delivery",
          vendorName: order.tailor?.shopName || order.tailor?.name || "Tailor Workshop",
          vendorAddress: order.tailor?.address,
          address: defaultAddress,
          customer: order.customer?.name,
          requiresAcceptance: true,
          deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 20,
          deliveryDistance: order.deliveryDistance || 0,
        };

        // Broadcast rich payload to all online delivery partners
        io.to("delivery_partners").emit("receive_new_order", sharedBroadcastPayload);
        io.to("delivery_partners").emit("new_task", sharedBroadcastPayload);

        // Also trigger FCM Push Notification broadcast for all active delivery partners
        sendNotification({
          recipient: "delivery_partners",
          type: "NEW_DELIVERY_TASK",
          title: cycle === "pickup" ? "New Fabric Pickup Request! 🛵" : "New Delivery Request! 🛵",
          message: cycle === "pickup" 
            ? `New job: Fabric pickup for order ${order.orderId}. Please accept or reject.`
            : `New job: Final delivery for order ${order.orderId}. Please accept or reject.`,
          data: {
            orderId: order._id.toString(),
            orderId_str: order.orderId,
            type: statusType,
            taskType,
            requiresAcceptance: true,
            targetUrl: "/delivery/tasks",
            deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
            deliveryDistance: order.deliveryDistance,
          },
        }).catch(err => console.error("FCM broadcast error for delivery partners:", err));

        io.to(`user_${order.tailor?._id || order.tailor}`).emit("order_status_updated", {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          pickupDeliveryStatus: order.pickupDeliveryStatus,
          dropoffDeliveryStatus: order.dropoffDeliveryStatus,
        });

        io.to(`user_${order.customer?._id || order.customer}`).emit("order_status_updated", {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          pickupDeliveryStatus: order.pickupDeliveryStatus,
          dropoffDeliveryStatus: order.dropoffDeliveryStatus,
        });
      }

      return true;
    }

    console.log(`No delivery partner available in radius for order ${order.orderId} (${cycle})`);

    // Still mark as searching so UI stays consistent; leave candidates empty for open-pool polling
    order.pendingPartnerCandidates = [];
    order.requestSentAt = new Date();
    if (cycle === "pickup") {
      order.pickupDeliveryStatus = "pending";
    } else {
      order.dropoffDeliveryStatus = "pending";
    }
    order.trackingHistory.push({
      status: "searching-delivery-partner",
      message: `No partners found within ${searchRadius / 1000}km. Order left in open pool.`,
      timestamp: new Date(),
    });
    await order.save();

    const io = tryGetIO();
    if (io) {
      io.to("delivery_partners").emit("receive_new_order", {
        orderId: order.orderId,
        _id: order._id,
        status: order.status,
        taskType: cycle === "pickup" ? "fabric-pickup" : "order-delivery",
      });
      console.log(`📡 Socket: Broadcasted pool task ${order.orderId} to general delivery_partners room`);
    }
    return false;
  } catch (error) {
    console.error("Auto-assignment failed:", error.message);
    return false;
  }
};

/**
 * Checks for orders that have been awaiting delivery partner acceptance for too long,
 * expands their search radius, and triggers a new broadcast.
 */
exports.checkStuckDeliveryAssignments = async () => {
  try {
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout
    const thresholdTime = new Date(Date.now() - TIMEOUT_MS);

    const stuckOrders = await Order.find({
      status: {
        $in: ["pending", "fabric-ready-for-pickup", "ready", "ready-for-delivery", "ready-for-pickup"],
      },
      requestSentAt: { $lt: thresholdTime },
      $or: [
        { pickupPartner: null, status: { $in: ["pending", "fabric-ready-for-pickup"] } },
        {
          dropoffPartner: null,
          status: { $in: ["ready", "ready-for-delivery", "ready-for-pickup"] },
        },
      ],
    });

    if (stuckOrders.length === 0) return;

    console.log(
      `⏳ [Cron] Found ${stuckOrders.length} stuck delivery assignments. Processing expansion...`
    );

    for (const order of stuckOrders) {
      const isFabricPhase = ["pending", "fabric-ready-for-pickup"].includes(order.status);
      const cycle = isFabricPhase ? "pickup" : "dropoff";

      const currentRadius = order.currentSearchRadius || DEFAULT_SEARCH_RADIUS_M;
      const nextRadius = currentRadius + 10000;

      order.currentSearchRadius = nextRadius;
      order.trackingHistory.push({
        status: "searching-delivery-partner",
        message: `No partner accepted within timeout. Expanding search radius from ${currentRadius / 1000}km to ${nextRadius / 1000}km and rebroadcasting.`,
        timestamp: new Date(),
      });
      await order.save();

      await exports.autoAssignDelivery(order._id, cycle);
    }
  } catch (error) {
    console.error("❌ Error in checkStuckDeliveryAssignments:", error);
  }
};
