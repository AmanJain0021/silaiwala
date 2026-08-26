/**
 * Helpers for multi-item marketplace orders (Order.items[]).
 */

export function getItemLabel(item) {
  if (!item) return 'Custom Garment';
  return (
    item.service?.title ||
    item.service?.name ||
    item.product?.name ||
    item.serviceDetails?.title ||
    'Custom Garment'
  );
}

export function getItemImage(item) {
  if (!item) return null;
  return (
    item.service?.image ||
    item.product?.images?.[0] ||
    item.product?.image ||
    item.selectedFabric?.image ||
    item.selectedFabric?.images?.[0] ||
    null
  );
}

/**
 * Compact title for lists/banners.
 * 1 item → its name; 2 → "A + B"; 3+ → "A + N more"
 */
export function formatOrderItemsTitle(items, { fallback = 'Custom Garment Order', maxNamed = 2 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  const labels = items.map(getItemLabel);
  if (labels.length === 1) return labels[0];
  if (labels.length <= maxNamed) return labels.join(' + ');

  const named = labels.slice(0, 1).join('');
  const rest = labels.length - 1;
  return `${named} + ${rest} more`;
}

export function getOrderItemCount(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
}

export function orderHasTailorAtHome(items) {
  return Array.isArray(items) && items.some(
    (item) => item.measurements?.type === 'home' || item.measurements?.option === 'visit'
  );
}
