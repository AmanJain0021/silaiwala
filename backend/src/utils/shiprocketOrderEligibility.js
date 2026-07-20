/**
 * Shiprocket is for tailor-store garment orders (product line items),
 * not custom stitching / alteration / custom design.
 */
function isShiprocketEligibleOrder(order) {
  if (!order?.items?.length) return false;

  const hasGarmentProduct = order.items.some((item) => !!item.product);
  const hasNonGarmentWork = order.items.some(
    (item) => !!item.service || item.isAlteration || item.isCustomDesign
  );

  return hasGarmentProduct && !hasNonGarmentWork;
}

module.exports = { isShiprocketEligibleOrder };
