/**
 * Garment / ready-made product orders from a tailor's store (not stitching jobs).
 */
export function isGarmentStoreOrder(order) {
  if (!order?.items?.length) return false;

  const hasGarment = order.items.some(
    (item) =>
      !!item.product ||
      item.productType === 'store_item' ||
      (item.product && item.product.productType === 'store_item')
  );
  const hasStitchingWork = order.items.some(
    (item) => !!item.service || item.isAlteration || item.isCustomDesign
  );

  return hasGarment && !hasStitchingWork;
}
