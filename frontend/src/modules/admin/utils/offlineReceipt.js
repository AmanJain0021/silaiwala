/** Build public offline tracking URL for QR / WhatsApp */
export const getOfflineTrackUrl = (trackingToken) => {
  if (!trackingToken) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/track/offline/${trackingToken}`;
};

export const getOfflineTrackQrUrl = (trackingToken, size = 180) => {
  const trackUrl = getOfflineTrackUrl(trackingToken);
  if (!trackUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(trackUrl)}`;
};

export const normalizePhoneForWhatsApp = (phone = '') => {
  const digits = String(phone).replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return null;
  return `91${last10}`;
};

export const buildOfflineReceiptWhatsAppMessage = (order, trackUrl) => {
  const handoff =
    order.fulfillmentMethod === 'home_delivery' ? 'Home delivery' : 'Shop pickup';
  const lines = [
    `*Sewzella / Silaiwala — Shop Order*`,
    `Order: ${order.orderId}`,
    `Garment: ${order.garmentType}`,
    `Handoff: ${handoff}`,
    `Total: ₹${(order.totalAmount || 0).toLocaleString()}`,
    `Paid: ₹${(order.advancePaid || 0).toLocaleString()}`,
    `Balance: ₹${Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0)).toLocaleString()}`,
    `Status: ${(order.status || '').replace(/_/g, ' ')}`,
  ];
  if (trackUrl) {
    lines.push('', `Track your order: ${trackUrl}`);
  }
  return lines.join('\n');
};
