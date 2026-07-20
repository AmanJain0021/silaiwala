const User = require("../models/User.js");
const Customer = require("../models/Customer.js");
const Settings = require("../models/Settings.js");
const LoyaltyPointTransaction = require("../models/LoyaltyPointTransaction.js");

/**
 * Award referral loyalty points when referred customer's first advance (or full) payment succeeds.
 * @param {object} order - Order doc (customer populated id)
 * @param {import('mongoose').ClientSession} session
 * @param {'advance'|'full'} paymentType
 */
async function processReferralRewardsOnFirstPayment(order, session, paymentType) {
  if (paymentType !== "advance" && paymentType !== "full") return;

  const customerProfile = await Customer.findOne({ user: order.customer }).session(session);
  if (!customerProfile || customerProfile.referralBonusAwarded) return;

  const settings = await Settings.getSettings();
  const cfg = settings.referralConfig || {};

  const finishFirstPayment = async () => {
    customerProfile.referralBonusAwarded = true;
    customerProfile.totalOrders = (customerProfile.totalOrders || 0) + 1;
    await customerProfile.save({ session });
  };

  if (!customerProfile.referredBy) {
    await finishFirstPayment();
    return;
  }

  const referredUser = await User.findById(customerProfile.user).session(session);
  const referrerUser = await User.findById(customerProfile.referredBy).session(session);
  if (!referrerUser) {
    await finishFirstPayment();
    return;
  }

  if (cfg.enabled === false) {
    await finishFirstPayment();
    return;
  }

  const referrerPoints = Number(cfg.referrerPointsOnFirstAdvance) || 0;
  const refereePoints = Number(cfg.refereePointsOnFirstAdvance) || 0;

  const creditPoints = async (userDoc, points, reason, description) => {
    if (!points || points <= 0 || !userDoc) return;
    userDoc.loyaltyPoints = (userDoc.loyaltyPoints || 0) + points;
    await userDoc.save({ session });
    await LoyaltyPointTransaction.create(
      [
        {
          user: userDoc._id,
          points,
          type: "credit",
          reason,
          order: order._id,
          description,
          balanceAfter: userDoc.loyaltyPoints,
        },
      ],
      { session }
    );
  };

  const refereeName = referredUser?.name || "your friend";

  if (referrerPoints > 0) {
    await creditPoints(
      referrerUser,
      referrerPoints,
      "referral_referrer",
      `Referral bonus: ${refereeName} paid first advance on order ${order.orderId}`
    );
    const referrerProfile = await Customer.findOne({ user: customerProfile.referredBy }).session(session);
    if (referrerProfile) {
      referrerProfile.referralEarnings = (referrerProfile.referralEarnings || 0) + referrerPoints;
      await referrerProfile.save({ session });
    }
  }

  if (refereePoints > 0 && referredUser) {
    await creditPoints(
      referredUser,
      refereePoints,
      "referral_welcome",
      `Welcome bonus for your first order payment (${order.orderId})`
    );
  }

  await finishFirstPayment();
}

module.exports = { processReferralRewardsOnFirstPayment };
