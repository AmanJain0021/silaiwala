const MeasurementExecutive = require("../models/MeasurementExecutive");
const MeasurementRequest = require("../models/MeasurementRequest");
const Order = require("../models/Order");
const { sendNotification } = require("./notification");
const { getIO } = require("../config/socket");

/**
 * Auto-assign the nearest online Measurement Executive to a MeasurementRequest.
 * Follows the same geospatial pattern as deliveryAssignment.js.
 * @param {Object} order - The Order document (must have deliveryAddress with location)
 */
exports.autoAssignMeasurementExecutive = async (order) => {
  try {
    // 1. Build the MeasurementRequest
    const request = await MeasurementRequest.findOne({ order: order._id });
    if (!request) {
      console.error("❌ [measurementAssignment] No MeasurementRequest found for order:", order.orderId);
      return false;
    }

    const customerCoords = request.customerLocation?.coordinates;
    if (!customerCoords || customerCoords.length < 2) {
      console.warn("⚠️ [measurementAssignment] No customer coordinates for request:", request.requestId);
      // Still try to find any available executive
    }

    // 2. Find nearest available, verified executive not in rejectedBy
    const query = {
      availabilityStatus: "online",
      verificationStatus: "verified",
      user: { $nin: request.rejectedBy || [] },
    };

    let candidates = [];

    if (customerCoords && customerCoords.length >= 2) {
      try {
        candidates = await MeasurementExecutive.find({
          ...query,
          currentLocation: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: customerCoords,
              },
              $maxDistance: 15000, // 15km search radius
            },
          },
        })
          .populate("user", "name phoneNumber profileImage")
          .limit(10);
      } catch (geoError) {
        console.error("⚠️ [measurementAssignment] Geospatial search failed:", geoError.message);
      }
    }

    // Fallback: get any available executive
    if (!candidates.length) {
      candidates = await MeasurementExecutive.find(query)
        .populate("user", "name phoneNumber profileImage")
        .limit(5);
    }

    // 3. Assign the nearest (first result from $near query)
    const nearestExec = candidates[0];

    if (nearestExec && nearestExec.user) {
      const execUserId = nearestExec.user._id;

      console.log(`\n================================`);
      console.log(`📐 MEASUREMENT EXECUTIVE ASSIGNED`);
      console.log(`Name: ${nearestExec.user.name}`);
      console.log(`Request: ${request.requestId}`);
      console.log(`Order: ${order.orderId}`);
      console.log(`================================\n`);

      // Calculate approximate distance
      let distanceKm = 0;
      if (customerCoords && nearestExec.currentLocation?.coordinates?.length >= 2) {
        const [lng1, lat1] = customerCoords;
        const [lng2, lat2] = nearestExec.currentLocation.coordinates;
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Math.round(distanceKm * 10) / 10;
      }

      // Update request
      request.executive = execUserId;
      request.status = "assigned";
      request.distance = distanceKm;
      await request.save();

      // Update order status
      order.status = "measurement-assigned";
      order.trackingHistory.push({
        status: "measurement-assigned",
        message: `Measurement executive ${nearestExec.user.name} has been assigned.`,
        timestamp: new Date(),
      });
      await order.save();

      // Get customer and tailor info for notification
      const User = require("../models/User");
      const customer = await User.findById(order.customer).lean();
      const tailor = await User.findById(order.tailor).lean();

      // Build Google Maps URL
      const mapsUrl = customerCoords
        ? `https://www.google.com/maps?q=${customerCoords[1]},${customerCoords[0]}`
        : "";

      // Notify the assigned executive
      const notifTitle = "New Measurement Request! 📐";
      const notifMessage = `New measurement visit for order ${order.orderId}. Customer: ${customer?.name || "N/A"}. Please accept or reject.`;

      await sendNotification({
        recipient: execUserId,
        type: "NEW_MEASUREMENT_REQUEST",
        title: notifTitle,
        message: notifMessage,
        data: {
          requestId: request._id,
          requestIdStr: request.requestId,
          orderId: order._id,
          orderIdStr: order.orderId,
          targetUrl: "/executive/requests",
        },
      });

      // Socket.IO: emit to the executive
      const io = getIO();
      if (io) {
        io.to(`user_${execUserId}`).emit("new_measurement_request", {
          requestId: request._id,
          requestIdStr: request.requestId,
          orderId: order._id,
          orderIdStr: order.orderId,
          customerName: customer?.name || "N/A",
          customerPhone: customer?.phoneNumber || "N/A",
          tailorName: tailor?.name || "N/A",
          address: request.customerAddress,
          distance: distanceKm,
          mapsUrl,
          scheduledTime: request.scheduledTime,
          status: "assigned",
        });

        // Notify customer
        io.to(`user_${order.customer}`).emit("order_status_updated", {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          message: "Measurement executive assigned to your order.",
        });

        // Notify tailor
        io.to(`user_${order.tailor}`).emit("order_status_updated", {
          orderId: order.orderId,
          _id: order._id,
          status: order.status,
          message: "Measurement executive assigned.",
        });
      }

      return true;
    } else {
      // No executive found — keep as pending, notify admin
      console.log(`⚠️ No measurement executive available for request ${request.requestId}`);

      await sendNotification({
        recipient: "admins",
        type: "MEASUREMENT_NO_EXECUTIVE",
        title: "⚠️ No Measurement Executive Available",
        message: `No measurement executive is available for request ${request.requestId} (Order: ${order.orderId}). Manual assignment required.`,
        data: {
          requestId: request._id,
          orderId: order._id,
          targetUrl: "/admin/measurement-executives",
        },
      });

      return false;
    }
  } catch (error) {
    console.error("❌ [measurementAssignment] Auto-assignment failed:", error.message);
    return false;
  }
};
