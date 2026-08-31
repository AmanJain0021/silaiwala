/**
 * Shared promo discount math — keep apply-promo API and createOrder identical.
 * Discount is applied on the grand total (post tax + delivery), capped at that total.
 */

function normalizeCheckoutType(value) {
  const v = String(value || "").trim().toLowerCase();
  if (v === "store" || v === "cart") return "store";
  if (v === "service" || v === "stitching") return "service";
  return "all";
}

function isPromoApplicableToCheckout(promo, checkoutType) {
  const scope = promo?.applicableTo || "all";
  const type = normalizeCheckoutType(checkoutType);
  if (scope === "all" || type === "all") return true;
  return scope === type;
}

function normalizeCouponPayload(body = {}) {
  const code = String(body.code || "").trim().toUpperCase();
  const discountType = body.discountType === "fixed" ? "fixed" : "percentage";
  const discountValue = Number(body.discountValue);
  const minOrderAmount = Math.max(0, Number(body.minOrderAmount) || 0);
  const maxDiscountAmount =
    body.maxDiscountAmount != null && body.maxDiscountAmount !== ""
      ? Math.max(0, Number(body.maxDiscountAmount))
      : undefined;
  const usageLimit = Math.max(1, Number(body.usageLimit) || 1000);
  const applicableTo = ["all", "store", "service"].includes(body.applicableTo)
    ? body.applicableTo
    : "all";

  return {
    code,
    description: String(body.description || "").trim(),
    discountType,
    discountValue,
    minOrderAmount,
    maxDiscountAmount,
    usageLimit,
    applicableTo,
    isActive: body.isActive !== false && body.isActive !== "false",
    startDate: body.startDate ? new Date(body.startDate) : new Date(),
    endDate: body.endDate ? new Date(body.endDate) : undefined,
  };
}

function validateCouponPayload(payload) {
  if (!payload.code) {
    return "Coupon code is required";
  }
  if (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0) {
    return "Discount value must be greater than 0";
  }
  if (payload.discountType === "percentage" && payload.discountValue > 100) {
    return "Percentage discount cannot exceed 100%";
  }
  if (payload.endDate && payload.startDate && payload.endDate < payload.startDate) {
    return "End date must be after start date";
  }
  return null;
}

function calculatePromoDiscount(orderAmount, promo, checkoutType = "all") {
  const amount = Math.max(0, Math.round(Number(orderAmount) || 0));
  if (!promo || !amount) {
    return { ok: false, reason: "Invalid promo or amount", discount: 0, newTotal: amount };
  }

  const now = new Date();
  if (promo.isActive === false) {
    return { ok: false, reason: "Promo code is inactive", discount: 0, newTotal: amount };
  }
  if (!isPromoApplicableToCheckout(promo, checkoutType)) {
    return {
      ok: false,
      reason:
        normalizeCheckoutType(checkoutType) === "store"
          ? "This coupon is not valid for store orders"
          : "This coupon is not valid for stitching orders",
      discount: 0,
      newTotal: amount,
    };
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

module.exports = {
  calculatePromoDiscount,
  normalizeCouponPayload,
  validateCouponPayload,
  normalizeCheckoutType,
  isPromoApplicableToCheckout,
};
