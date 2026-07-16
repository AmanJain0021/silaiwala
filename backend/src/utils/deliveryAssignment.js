const Delivery = require("../models/Delivery.js");
const Tailor = require("../models/Tailor.js");
const Order = require("../models/Order.js");
const { sendNotification } = require("./notification.js");
const { getIO } = require("../config/socket.js");

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
      user: { $nin: order.rejectedBy || [] }
    };

    let startCoords = null; // [lng, lat]

    // Determine where the rider needs to go first
    if (cycle === "pickup") {
        const Customer = require("../models/Customer.js");
        let customerDoc = null;
        if (order.customer) {
            customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
        }
        if (customerDoc?.addresses?.length > 0) {
            const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
            if (defaultAddress.location?.coordinates?.length >= 2) {
                startCoords = defaultAddress.location.coordinates;
            }
        }
    } else {
        const tailorProfile = await Tailor.findOne({ user: order.tailor._id || order.tailor }).lean();
        if (tailorProfile?.location?.coordinates?.length >= 2) {
            startCoords = tailorProfile.location.coordinates;
        }
    }

    let candidateRiders = [];
    const searchRadius = order.currentSearchRadius || 15000;

    if (startCoords) {
        try {
            candidateRiders = await Delivery.find({
                ...query,
                currentLocation: {
                    $near: {
                       $geometry: { type: "Point", coordinates: startCoords },
                       $maxDistance: searchRadius
                    }
                }
            }).populate("user");
        } catch (geoError) {
            console.error("⚠️ Geospatial search failed:", geoError.message);
        }
    }

    if (candidateRiders.length === 0) {
        console.warn(`⚠️ [deliveryAssignment] No candidates found in search radius of ${searchRadius / 1000}km. Initiating fallback database-wide search...`);
        
        let allRiders = await Delivery.find(query).populate("user");
        if (allRiders.length > 0 && startCoords) {
            const { getDistanceFromLatLonInKm } = require("./haversine.js");
            const destLat = startCoords[1];
            const destLng = startCoords[0];

            const ridersWithDistance = allRiders.map(r => {
                let distance = Infinity;
                if (r.currentLocation?.coordinates?.length >= 2) {
                    distance = getDistanceFromLatLonInKm(
                        r.currentLocation.coordinates[1],
                        r.currentLocation.coordinates[0],
                        destLat,
                        destLng
                    );
                }
                return { rider: r, distance };
            });

            // Sort by distance ascending
            ridersWithDistance.sort((a, b) => a.distance - b.distance);

            // Map back to Delivery document structure, limited to top 5
            candidateRiders = ridersWithDistance.slice(0, 5).map(item => item.rider);
        } else {
            candidateRiders = allRiders.slice(0, 5);
        }
    }

    if (candidateRiders.length > 0) {
        console.log(`\n================================`);
        console.log(`🏍️  BROADCASTING TO ${candidateRiders.length} DELIVERY PARTNER(S)`);
        console.log(`Order ID: ${order.orderId}`);
        console.log(`Cycle: ${cycle}`);
        console.log(`Radius: ${searchRadius / 1000}km`);
        console.log(`================================\n`);

        const candidateIds = candidateRiders.map(r => r.user._id);

        order.pendingPartnerCandidates = candidateIds;
        order.requestSentAt = new Date();
        order.currentSearchRadius = searchRadius;

        // Clean any stale assignments from previous cycle/failure
        if (cycle === "pickup") {
          order.pickupPartner = undefined;
          order.pickupDeliveryStatus = "pending";
        } else {
          order.dropoffPartner = undefined;
          order.dropoffDeliveryStatus = "pending";
        }
        order.deliveryPartner = undefined;
        order.deliveryStatus = 'pending';

        order.trackingHistory.push({
           status: "searching-delivery-partner",
           message: `Broadcasted job request for ${cycle} to ${candidateRiders.length} nearby available partners within ${searchRadius / 1000}km.`,
           timestamp: new Date()
        });
        await order.save();

        // Notify assigned riders — they must accept or reject
        const title = cycle === "pickup" ? "New Fabric Pickup Request! 🛵" : "New Delivery Request! 🛵";
        const message = cycle === "pickup" 
           ? `New job: Fabric pickup for order ${order.orderId}. Please accept or reject.`
           : `New job: Final delivery for order ${order.orderId}. Please accept or reject.`;
           
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
              type: cycle === "pickup" ? "fabric-ready-for-pickup" : "ready-for-delivery", 
              taskType: cycle === "pickup" ? 'fabric-pickup' : 'final-delivery',
              requiresAcceptance: true,
              targetUrl: "/delivery/tasks",
              deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
              deliveryDistance: order.deliveryDistance
            }
          });
          
          // Emit socket notification directly to the partner
          const io = getIO();
          if (io) {
            io.to(`user_${partnerId}`).emit('new_notification', {
              type: 'NEW_DELIVERY_TASK',
              title,
              message,
              data: { 
                orderId: order._id,
                requiresAcceptance: true,
                taskType: cycle === "pickup" ? 'fabric-pickup' : 'final-delivery',
                targetUrl: "/delivery/tasks",
                deliveryEarnings: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0,
                deliveryDistance: order.deliveryDistance
              }
            });

            // Emit new_order to trigger the popup on Delivery Dashboard
            const defaultAddress = order.customer?.addresses?.find(a => a.isDefault) || order.customer?.addresses?.[0];
            io.to(`user_${partnerId}`).emit('new_order', {
               ...order.toObject(),
               id: order._id,
               vendorName: order.tailor?.shopName || order.tailor?.name,
               vendorAddress: order.tailor?.address,
               vendorLocation: order.tailor?.location,
               customerLocation: defaultAddress?.location,
               address: defaultAddress,
               customer: order.customer?.name,
               isReturn: false,
               deliveryFee: order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0
            });
          }
        }
        
        const io = getIO();
        if (io) {
          // Notify tailor panel to show "Searching" state
          io.to(`user_${order.tailor?._id || order.tailor}`).emit('order_status_updated', {
            orderId: order.orderId,
            _id: order._id,
            status: order.status,
            pickupDeliveryStatus: order.pickupDeliveryStatus,
            dropoffDeliveryStatus: order.dropoffDeliveryStatus
          });

          // Also notify customer tracking page
          io.to(`user_${order.customer?._id || order.customer}`).emit('order_status_updated', {
            orderId: order.orderId,
            _id: order._id,
            status: order.status
          });
        }
        
        return true;
    } else {
        console.log(`No delivery partner available in radius for order ${order.orderId} (${cycle})`);
        const io = getIO();
        if (io) {
            io.to('delivery_partners').emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                status: order.status,
                taskType: cycle === "pickup" ? 'fabric-pickup' : 'order-delivery'
            });
            console.log(`📡 Socket: Broadcasted pool task ${order.orderId} to general delivery_partners room`);
        }
        return false;
    }
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

    // Find orders that are in a delivery phase, have no assigned partner, and exceeded timeout
    const stuckOrders = await Order.find({
      status: { $in: ["pending", "fabric-ready-for-pickup", "ready", "ready-for-delivery", "ready-for-pickup"] },
      requestSentAt: { $lt: thresholdTime },
      $or: [
        { pickupPartner: null, status: { $in: ["pending", "fabric-ready-for-pickup"] } },
        { dropoffPartner: null, status: { $in: ["ready", "ready-for-delivery", "ready-for-pickup"] } }
      ]
    });

    if (stuckOrders.length === 0) return;

    console.log(`⏳ [Cron] Found ${stuckOrders.length} stuck delivery assignments. Processing expansion...`);

    for (const order of stuckOrders) {
      // Determine cycle
      const isFabricPhase = ["pending", "fabric-ready-for-pickup"].includes(order.status);
      const cycle = isFabricPhase ? "pickup" : "dropoff";

      // Expand radius: e.g. 15km -> 25km -> 35km...
      const currentRadius = order.currentSearchRadius || 15000;
      const nextRadius = currentRadius + 10000; // expand by 10km

      order.currentSearchRadius = nextRadius;
      order.trackingHistory.push({
        status: "searching-delivery-partner",
        message: `No partner accepted within timeout. Expanding search radius from ${currentRadius / 1000}km to ${nextRadius / 1000}km and rebroadcasting.`,
        timestamp: new Date()
      });
      await order.save();

      // Trigger autoAssignDelivery with the expanded radius
      await exports.autoAssignDelivery(order._id, cycle);
    }
  } catch (error) {
    console.error("❌ Error in checkStuckDeliveryAssignments:", error);
  }
};
