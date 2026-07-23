const crypto = require("crypto");

/**
 * Ensure offline order has a public tracking token (lazy backfill for older orders).
 */
async function ensureTrackingToken(order) {
  if (!order) return order;
  if (order.trackingToken) return order;
  order.trackingToken = crypto.randomBytes(16).toString("hex");
  await order.save();
  return order;
}

module.exports = { ensureTrackingToken };
