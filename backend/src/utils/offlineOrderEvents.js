const { tryGetIO } = require("../config/socket.js");
const { getOfflineStatusLabel } = require("./offlineOrderStatus.js");

const buildOfflineStatusPayload = (order) => ({
  trackingToken: order.trackingToken,
  orderId: order.orderId,
  status: order.status,
  statusLabel: getOfflineStatusLabel(order.status),
  updatedAt: order.updatedAt || new Date(),
});

/**
 * Broadcast offline production status to public track room, admin, and assigned tailor.
 */
function emitOfflineOrderStatusUpdate(order) {
  const io = tryGetIO();
  if (!io || !order?.trackingToken) return;

  const payload = buildOfflineStatusPayload(order);
  const offlineOrderId = order._id?.toString?.() || order._id;

  io.of("/offline-track")
    .to(`offline_track_${order.trackingToken}`)
    .emit("offline_order_status", payload);

  io.to("admin_room").emit("offline_order_status", { ...payload, offlineOrderId });

  const tailorId = order.shopTailor?._id || order.shopTailor;
  if (tailorId) {
    io.to(`user_${tailorId}`).emit("offline_order_status", { ...payload, offlineOrderId });
  }
}

module.exports = { emitOfflineOrderStatusUpdate, buildOfflineStatusPayload };
