const {
  isAllowedOfflineStatus,
  getOfflineStatusLabel,
} = require("../utils/offlineOrderStatus.js");
const { emitOfflineOrderStatusUpdate } = require("../utils/offlineOrderEvents.js");

/**
 * @param {import("mongoose").Document} order OfflineOrder document
 */
async function applyOfflineOrderStatusChange(order, { status, message, updatedBy }) {
  if (!isAllowedOfflineStatus(status)) {
    const err = new Error(
      `status must be one of the allowed offline production values (got "${status}")`
    );
    err.statusCode = 400;
    throw err;
  }

  if (order.status === status) return order;

  order.status = status;
  order.history.push({
    status,
    message: message || `Status updated to ${getOfflineStatusLabel(status)}`,
    updatedBy,
  });
  await order.save();
  emitOfflineOrderStatusUpdate(order);
  return order;
}

module.exports = { applyOfflineOrderStatusChange };
