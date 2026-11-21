const MeasurementExecutive = require("../models/MeasurementExecutive.js");
const MeasurementRequest = require("../models/MeasurementRequest.js");
const Order = require("../models/Order.js");
const { sendNotification } = require("./notification.js");
const { getIO } = require("../config/socket.js");

const ACTIVE_REQUEST_STATUSES = ["accepted", "otp_sent", "otp_verified", "measurements_uploaded"];

const scheduleLabelFor = (request) =>
  request.scheduledDate
    ? `${request.scheduledDate}${request.scheduledTimeSlot ? " (" + request.scheduledTimeSlot + ")" : ""}`
    : request.scheduledTime
      ? new Date(request.scheduledTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
      : "As soon as possible";

/**
 * Broadcast a paid home-measurement request to every online, verified executive inside
 * the admin-set range (Settings → Partner Assignment). The first executive to accept
 * claims it (see acceptRequest). If nobody accepts within the escalation window — or
 * nobody is in range at all — admins are alerted to assign one manually.
 *
 * Kept under its historical name because payment verify / reject / createOrder call it.
 * @param {Object} order - Order document (needs _id, orderId, customer, tailor, payment fields)
 */
exports.autoAssignMeasurementExecutive = async (order) => {
  try {
    if (!order) return false;
    if (order.status === "cancelled") return false;

    // Dispatch only after the advance (or full amount) is paid
    const isAdvanceRequired =
      order.advancePaymentAmount > 0 &&
      order.advancePaymentStatus !== "paid" &&
      order.paymentStatus !== "paid";
    if (isAdvanceRequired) {
      console.log(`ℹ️ [measurementAssignment] Order #${order.orderId}: waiting for advance payment before broadcasting.`);
      return false;
    }

    const request = await MeasurementRequest.findOne({ order: order._id });
    if (!request) {
      console.error("❌ [measurementAssignment] No MeasurementRequest found for order:", order.orderId);
      return false;
    }

    // Already being handled (accepted by an executive, or assigned by admin)
    if (request.status === "completed" || ACTIVE_REQUEST_STATUSES.includes(request.status)) return true;
    if (request.status === "assigned" && request.executive) return true;

    const { getAssignmentConfig, escalateMeasurementNow } = require("./assignmentEscalation.js");
    const { measurementRadiusKm } = await getAssignmentConfig();

    // Executives already on a visit, or who declined this request, are skipped
    const busyExecs = await MeasurementRequest.find({
      status: { $in: ACTIVE_REQUEST_STATUSES },
      executive: { $ne: null },
    }).distinct("executive");
    const excludedUserIds = Array.from(
      new Set([...(request.rejectedBy || []).map(String), ...busyExecs.map(String)])
    );

    const baseQuery = {
      availabilityStatus: "online",
      verificationStatus: { $in: ["verified", "approved"] },
      user: { $nin: excludedUserIds },
    };

    const customerCoords = request.customerLocation?.coordinates;
    let candidates = [];
    if (customerCoords && customerCoords.length >= 2) {
      try {
        candidates = await MeasurementExecutive.find({
          ...baseQuery,
          currentLocation: {
            $near: {
              $geometry: { type: "Point", coordinates: customerCoords },
              $maxDistance: Math.round(measurementRadiusKm * 1000),
            },
          },
        }).select("user").lean();
      } catch (geoError) {
        console.error("⚠️ [measurementAssignment] Geospatial search failed:", geoError.message);
      }
    }
    // Online executives whose location isn't known yet still get the request
    const noLocation = await MeasurementExecutive.find({
      ...baseQuery,
      $or: [{ currentLocation: null }, { "currentLocation.coordinates": { $size: 0 } }, { currentLocation: { $exists: false } }],
    }).select("user").lean();
    const seen = new Set(candidates.map((c) => String(c.user)));
    for (const c of noLocation) {
      if (!seen.has(String(c.user))) {
        candidates.push(c);
        seen.add(String(c.user));
      }
    }
    const candidateIds = candidates.map((c) => c.user).filter(Boolean);

    // Open the request for claiming
    request.executive = null;
    request.status = "pending";
    request.broadcastAt = new Date();
    request.broadcastCandidates = candidateIds;
    request.adminEscalatedAt = null;
    await request.save();

    const orderDoc = await Order.findById(order._id);
    if (orderDoc && ["accepted", "measurement-requested", "measurement-assigned"].includes(orderDoc.status)) {
      orderDoc.status = "measurement-requested";
      orderDoc.trackingHistory.push({
        status: "measurement-requested",
        message: candidateIds.length
          ? `Measurement request sent to ${candidateIds.length} nearby executive(s).`
          : "No measurement executive nearby right now. Admin will assign one.",
        timestamp: new Date(),
      });
      await orderDoc.save();
    }

    if (!candidateIds.length) {
      console.log(`⚠️ [measurementAssignment] No executive within ${measurementRadiusKm} km for ${request.requestId}`);
      await escalateMeasurementNow(request._id, `no measurement executive online within ${measurementRadiusKm} km`);
      return false;
    }

    const scheduleLabel = scheduleLabelFor(request);
    const io = getIO();
    for (const execUserId of candidateIds) {
      await sendNotification({
        recipient: execUserId,
        type: "NEW_MEASUREMENT_REQUEST",
        title: "New Measurement Request! 📐",
        message: `Visit for order #${order.orderId} (${scheduleLabel}). First to accept gets it.`,
        data: {
          requestId: request._id,
          requestIdStr: request.requestId,
          orderId: order._id,
          orderIdStr: order.orderId,
          scheduledDate: request.scheduledDate,
          scheduledTimeSlot: request.scheduledTimeSlot,
          scheduledTime: request.scheduledTime,
          targetUrl: "/executive/requests",
        },
      });
      if (io) {
        io.to(`user_${execUserId}`).emit("new_measurement_request", {
          requestId: request._id,
          requestIdStr: request.requestId,
          orderId: order._id,
          orderIdStr: order.orderId,
          address: request.customerAddress,
          scheduledTime: request.scheduledTime,
          scheduledDate: request.scheduledDate,
          scheduledTimeSlot: request.scheduledTimeSlot,
          status: "pending",
        });
      }
    }

    if (io) {
      const payload = { orderId: order.orderId, _id: order._id, status: orderDoc?.status || order.status };
      io.to(`user_${order.customer}`).emit("order_status_updated", payload);
      io.to(`user_${order.tailor}`).emit("order_status_updated", payload);
    }

    console.log(`📐 [measurementAssignment] Broadcast ${request.requestId} to ${candidateIds.length} executive(s) within ${measurementRadiusKm} km`);
    return true;
  } catch (error) {
    console.error("❌ [measurementAssignment] Broadcast failed:", error.message);
    return false;
  }
};
