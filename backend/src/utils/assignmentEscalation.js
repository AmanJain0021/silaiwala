/**
 * Partner broadcast settings + "nobody accepted in time → alert admin" escalation.
 *
 * Flow (both delivery partners and measurement executives):
 *   1. Request is broadcast to partners inside the admin-set range.
 *   2. If nobody accepts within `adminEscalationMinutes` (default 10), every admin gets
 *      a notification to assign someone manually from Admin → Orders.
 *   3. If there is nobody in range at all, admins are alerted immediately.
 * Each broadcast escalates at most once (deliveryEscalatedAt / adminEscalatedAt).
 */
const Order = require("../models/Order.js");
const MeasurementRequest = require("../models/MeasurementRequest.js");
const Settings = require("../models/Settings.js");
const { sendNotification } = require("./notification.js");

async function getAssignmentConfig() {
  const settings = await Settings.getSettings();
  const ac = settings?.assignmentConfig || {};
  const pos = (v, d) => (Number(v) > 0 ? Number(v) : d);
  return {
    deliveryRadiusKm: pos(ac.deliveryRadiusKm, 15),
    measurementRadiusKm: pos(ac.measurementRadiusKm, 25),
    adminEscalationMinutes: pos(ac.adminEscalationMinutes, 10),
  };
}

async function alertAdminsDelivery(order, cycle, reason) {
  const isPickup = cycle === "pickup";
  await sendNotification({
    recipient: "admins",
    type: "ASSIGN_DELIVERY_PARTNER",
    title: isPickup ? "Assign partner: fabric pickup 🛵" : "Assign partner: order delivery 🛵",
    message: `Order #${order.orderId}: ${reason}. Please assign a delivery partner.`,
    data: { orderId: order._id, cycle, targetUrl: "/admin/orders" },
  });
}

async function alertAdminsMeasurement(request, order, reason) {
  await sendNotification({
    recipient: "admins",
    type: "ASSIGN_MEASUREMENT_EXECUTIVE",
    title: "Assign measurement executive 📐",
    message: `Order #${order?.orderId || ""}: ${reason}. Please assign a measurement executive.`,
    data: { orderId: order?._id || request.order, requestId: request._id, targetUrl: "/admin/orders" },
  });
}

/** Called by the broadcast code when there is no partner in range at all. */
async function escalateDeliveryNow(orderId, cycle, reason) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, deliveryEscalatedAt: null },
    { $set: { deliveryEscalatedAt: new Date() } },
    { new: true }
  );
  if (order) await alertAdminsDelivery(order, cycle, reason);
}

async function escalateMeasurementNow(requestId, reason) {
  const request = await MeasurementRequest.findOneAndUpdate(
    { _id: requestId, adminEscalatedAt: null },
    { $set: { adminEscalatedAt: new Date() } },
    { new: true }
  );
  if (!request) return;
  const order = await Order.findById(request.order).select("orderId").lean();
  await alertAdminsMeasurement(request, order, reason);
}

/** Cron: alert admins about broadcasts nobody accepted within the configured minutes. */
async function runAssignmentEscalations() {
  const { adminEscalationMinutes } = await getAssignmentConfig();
  const cutoff = new Date(Date.now() - adminEscalationMinutes * 60 * 1000);

  // ── Delivery: pickup / drop broadcasts still unclaimed ──
  const stuckOrders = await Order.find({
    requestSentAt: { $lt: cutoff },
    deliveryEscalatedAt: null,
    $or: [
      { status: "fabric-ready-for-pickup", pickupPartner: null },
      { status: { $in: ["ready", "ready-for-delivery", "ready-for-pickup"] }, dropoffPartner: null },
    ],
  })
    .select("orderId status")
    .limit(50)
    .lean();

  for (const o of stuckOrders) {
    // Claim the escalation atomically so parallel servers don't double-notify
    const claimed = await Order.findOneAndUpdate(
      { _id: o._id, deliveryEscalatedAt: null },
      { $set: { deliveryEscalatedAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;
    const cycle = claimed.status === "fabric-ready-for-pickup" ? "pickup" : "dropoff";
    await alertAdminsDelivery(claimed, cycle, `no delivery partner accepted within ${adminEscalationMinutes} min`);
  }

  // ── Measurement: paid visit requests nobody accepted ──
  const stuckRequests = await MeasurementRequest.find({
    status: { $in: ["pending", "assigned"] },
    adminEscalatedAt: null,
    $or: [{ broadcastAt: { $lt: cutoff } }, { broadcastAt: null, updatedAt: { $lt: cutoff } }],
  })
    .populate("order", "orderId status advancePaymentAmount advancePaymentStatus paymentStatus")
    .limit(50);

  for (const r of stuckRequests) {
    const o = r.order;
    if (!o || o.status === "cancelled") continue;
    const advancePending = o.advancePaymentAmount > 0 && o.advancePaymentStatus !== "paid" && o.paymentStatus !== "paid";
    if (advancePending) continue; // not dispatched yet — waiting for customer payment
    const claimed = await MeasurementRequest.findOneAndUpdate(
      { _id: r._id, adminEscalatedAt: null },
      { $set: { adminEscalatedAt: new Date() } },
      { new: true }
    );
    if (!claimed) continue;
    await alertAdminsMeasurement(claimed, o, `no measurement executive accepted within ${adminEscalationMinutes} min`);
  }
}

module.exports = {
  getAssignmentConfig,
  escalateDeliveryNow,
  escalateMeasurementNow,
  runAssignmentEscalations,
};
