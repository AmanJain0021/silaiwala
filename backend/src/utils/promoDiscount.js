/**
 * Shared promo discount math — keep apply-promo API and createOrder identical.
 * Discount is applied on the grand total (post tax + delivery), capped at that total.
 */
function calculatePromoDiscount(orderAmount, promo) {
  const amount = Math.max(0, Math.round(Number(orderAmount) || 0));
  if (!promo || !amount) {
    return { ok: false, reason: "Invalid promo or amount", discount: 0, newTotal: amount };
  }

  const now = new Date();
  if (promo.isActive === false) {
    return { ok: false, reason: "Promo code is inactive", discount: 0, newTotal: amount };
  }
  if (promo.startDate && promo.startDate > now) {
    return { ok: false, reason: "Promo code is not active currently", discount: 0, newTotal: amount };
  }
  if (promo.endDate && promo.endDate < now) {
    return { ok: false, reason: "Promo code has expired", discount: 0, newTotal: amount };
  }
  if ((promo.usedCount || 0) >= (promo.usageLimit ?? 1000)) {
    return { ok: false, reason: "Promo code usage limit reached", discount: 0, newTotal: amount };
  }
  if (amount < (Number(promo.minOrderAmount) || 0)) {
    return {
      ok: false,
      reason: `Minimum order amount of ₹${promo.minOrderAmount} required for this coupon`,
      discount: 0,
      newTotal: amount,
    };
  }

  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = (amount * Number(promo.discountValue)) / 100;
    if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
      discount = Number(promo.maxDiscountAmount);
    }
  } else {
    discount = Number(promo.discountValue) || 0;
  }

  discount = Math.min(Math.round(discount), amount);
  if (discount <= 0) {
    return { ok: false, reason: "Coupon has no discount value", discount: 0, newTotal: amount };
  }

  return {
    ok: true,
    discount,
    newTotal: amount - discount,
    code: promo.code,
  };
}

module.exports = { calculatePromoDiscount };
