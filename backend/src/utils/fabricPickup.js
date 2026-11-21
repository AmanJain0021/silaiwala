const Order = require("../models/Order.js");

/**
 * Flow 2 (tailor-at-home): once the customer has approved the measurements, the customer's
 * fabric is picked up by a delivery partner automatically (no "self / partner" choice).
 * Orders with platform fabric need no pickup — the tailor starts work directly.
 *
 * Safe to call more than once: it only acts while the order is still `measurements-approved`
 * and no fabric hand-off has been chosen yet.
 *
 * @param {string|import('mongoose').Types.ObjectId} orderId
 * @returns {Promise<boolean>} true when a pickup broadcast was started
 */
async function startFabricPickupAfterMeasurement(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.status !== "measurements-approved") return false;

  const needsCustomerFabric =
    order.fabricPickupRequired ||
    (Array.isArray(order.items) && order.items.some((item) => item.fabricSource === "customer"));
  if (!needsCustomerFabric) return false;

  if (order.fabricDeliveryPreference && order.fabricDeliveryPreference !== "pending") return false;

  order.fabricDeliveryPreference = "partner";
  order.status = "fabric-ready-for-pickup";
  order.pickupDeliveryStatus = "pending";
  order.set("pickupPartner", undefined);
  order.pendingPartnerCandidates = [];
  order.trackingHistory.push({
    status: order.status,
    timestamp: new Date(),
    message: "Measurements approved. Searching for a delivery partner to pick up your fabric.",
  });
  await order.save();

  const { autoAssignDelivery } = require("./deliveryAssignment.js");
  await autoAssignDelivery(order._id, "pickup");
  return true;
}

module.exports = { startFabricPickupAfterMeasurement };
