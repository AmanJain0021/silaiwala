const User = require("../models/User.js");
const Customer = require("../models/Customer.js");
const Settings = require("../models/Settings.js");
const LoyaltyPointTransaction = require("../models/LoyaltyPointTransaction.js");

const creditLoyaltyPoints = async (userDoc, points, reason, description, orderId, session) => {
  if (!points || points <= 0 || !userDoc) return;
  userDoc.loyaltyPoints = (userDoc.loyaltyPoints || 0) + points;
  const saveOpts = session ? { session } : undefined;
  await userDoc.save(saveOpts);

  const payload = {
    user: userDoc._id,
    points,
    type: "credit",
    reason,
    description,
    balanceAfter: userDoc.loyaltyPoints,
  };
  if (orderId) payload.order = orderId;

  if (session) {
    await LoyaltyPointTransaction.create([payload], { session });
  } else {
    await LoyaltyPointTransaction.create(payload);
  }
};

const getReferralPointConfig = async () => {
  const settings = await Settings.getSettings();
  const cfg = settings.referralConfig || {};
  return {
    enabled: cfg.enabled !== false,
    referrerPoints: Number(cfg.referrerPointsOnFirstAdvance) || 0,
    refereePoints: Number(cfg.refereePointsOnFirstAdvance) || 0,
  };
};

/**
 * Award referral loyalty points at signup when a valid referral code is used.
 * Admin controls amounts via Settings → referralConfig.
 */
async function processReferralRewardsOnSignup({ newUser, customerProfile, referrerUserId }) {
  if (!customerProfile || !referrerUserId || !newUser) return;
  if (customerProfile.referralBonusAwarded) return;

  const cfg = await getReferralPointConfig();

  const markAwarded = async () => {
    customerProfile.referralBonusAwarded = true;
    await customerProfile.save();
  };

  if (!cfg.enabled) {
    await markAwarded();
    return;
  }

  const referrerUser = await User.findById(referrerUserId);
  if (!referrerUser) {
    await markAwarded();
    return;
  }

  const refereeName = newUser.name || "your friend";

  if (cfg.referrerPoints > 0) {
    await creditLoyaltyPoints(
      referrerUser,
      cfg.referrerPoints,
      "referral_referrer",
      `Referral bonus: ${refereeName} signed up with your code`,
      null,
      null
    );
    const referrerProfile = await Customer.findOne({ user: referrerUserId });
    if (referrerProfile) {
      referrerProfile.referralEarnings =
        (referrerProfile.referralEarnings || 0) + cfg.referrerPoints;
      await referrerProfile.save();
    }
  }

  if (cfg.refereePoints > 0) {
    // Reload new user in case points field changed elsewhere
    const freshNewUser = await User.findById(newUser._id);
    await creditLoyaltyPoints(
      freshNewUser || newUser,
      cfg.refereePoints,
      "referral_welcome",
      `Welcome bonus for signing up with a referral code`,
      null,
      null
    );
  }

  await markAwarded();
}

/**
 * Legacy / safety: award on first advance/full payment if not already awarded at signup
 * (e.g. users referred before signup-rewards launched).
 */
async function processReferralRewardsOnFirstPayment(order, session, paymentType) {
  if (paymentType !== "advance" && paymentType !== "full") return;

  const customerProfile = await Customer.findOne({ user: order.customer }).session(session);
  if (!customerProfile || customerProfile.referralBonusAwarded) return;

  const finishFirstPayment = async () => {
    customerProfile.referralBonusAwarded = true;
    customerProfile.totalOrders = (customerProfile.totalOrders || 0) + 1;
    await customerProfile.save({ session });
  };

  if (!customerProfile.referredBy) {
    await finishFirstPayment();
    return;
  }

  const cfg = await getReferralPointConfig();
  const referredUser = await User.findById(customerProfile.user).session(session);
  const referrerUser = await User.findById(customerProfile.referredBy).session(session);

  if (!referrerUser || !cfg.enabled) {
    await finishFirstPayment();
    return;
  }

  const refereeName = referredUser?.name || "your friend";

  if (cfg.referrerPoints > 0) {
    await creditLoyaltyPoints(
      referrerUser,
      cfg.referrerPoints,
      "referral_referrer",
      `Referral bonus: ${refereeName} paid first advance on order ${order.orderId}`,
      order._id,
      session
    );
    const referrerProfile = await Customer.findOne({
      user: customerProfile.referredBy,
    }).session(session);
    if (referrerProfile) {
      referrerProfile.referralEarnings =
        (referrerProfile.referralEarnings || 0) + cfg.referrerPoints;
      await referrerProfile.save({ session });
    }
  }

  if (cfg.refereePoints > 0 && referredUser) {
    await creditLoyaltyPoints(
      referredUser,
      cfg.refereePoints,
      "referral_welcome",
      `Welcome bonus for your first order payment (${order.orderId})`,
      order._id,
      session
    );
  }

  await finishFirstPayment();
}

module.exports = {
  processReferralRewardsOnSignup,
  processReferralRewardsOnFirstPayment,
};
