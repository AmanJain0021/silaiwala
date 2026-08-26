const WalletTransaction = require("../models/WalletTransaction.js");
const Tailor = require("../models/Tailor.js");
const Order = require("../models/Order.js");
const mongoose = require("mongoose");

/**
 * Tailor merchandise = stitching base + style addons (excludes fabric, visit, fees, GST, delivery).
 */
function computeTailorMerchandise(order) {
  if (!order?.items?.length) return 0;
  return Math.round(
    order.items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 1;
      const base = Number(item.price) || 0;
      let addons = 0;
      if (Array.isArray(item.styleAddons)) {
        for (const a of item.styleAddons) {
          addons += Number(a?.price) || 0;
        }
      }
      return sum + (base + addons) * qty;
    }, 0)
  );
}

/**
 * Total delivery partner budget for this order (never use customer deliveryFee when free delivery).
 */
function computeDeliveryBudget(order) {
  const actual = Number(order.actualDeliveryCost);
  if (Number.isFinite(actual) && actual > 0) return Math.round(actual);

  const pickup = Math.round(Number(order.pickupDeliveryCost) || 0);
  const dropoff = Math.round(Number(order.dropoffDeliveryCost) || 0);
  if (pickup + dropoff > 0) return pickup + dropoff;

  const stored = Number(order.deliveryPartnerEarning);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);

  return Math.round(Number(order.deliveryEarnings) || Number(order.deliveryFee) || 0);
}

/**
 * Phase payout amount for fabric pickup vs final dropoff.
 */
function computePhaseDeliveryEarning(order, phase) {
  const pickup = Math.round(Number(order.pickupDeliveryCost) || 0);
  const dropoff = Math.round(Number(order.dropoffDeliveryCost) || 0);
  const budget = computeDeliveryBudget(order);

  if (phase === "pickup" || phase === "fabric-delivered") {
    if (pickup > 0) return pickup;
    // Legacy orders: split 50/50 when both trips exist
    if (order.fabricPickupRequired && dropoff === 0 && budget > 0) {
      return Math.round(budget / 2);
    }
    return pickup;
  }

  // dropoff / delivered
  if (dropoff > 0) return dropoff;
  if (order.fabricPickupRequired && pickup === 0 && budget > 0) {
    return Math.round(budget / 2);
  }
  if (pickup > 0 && dropoff === 0 && budget > pickup) {
    return budget - pickup;
  }
  return budget > 0 ? budget : Math.round(Number(order.deliveryFee) || 0);
}

/** Match any prior wallet credit for the same delivery phase (status + complete APIs). */
function phaseDeliveryTxQuery(orderId, partnerId, phase) {
  const isPickup = phase === "pickup" || phase === "fabric-delivered";
  const desc = isPickup
    ? /(Delivery payout for fabric-delivered|Earnings for Fabric Delivery|Earnings for Pickup of order)/i
    : /(Delivery payout for delivered|Earnings for Delivery of order)/i;
  return {
    user: partnerId,
    order: orderId,
    category: { $in: ["order_earnings", "delivery_earnings"] },
    description: desc,
  };
}

/**
 * Residual platform money after partner payouts.
 * Includes: platformFee + GST + fabric + customer delivery − coupon − free-delivery subsidy.
 */
function computePlatformNet(order) {
  const total = Math.round(Number(order.totalAmount) || 0);
  const tailor = computeTailorMerchandise(order);
  const delivery = computeDeliveryBudget(order);
  const measurement = Math.round(
    Number(order.measurementVisitFee) ||
      Number(order.measurementExecutiveEarning) ||
      0
  );
  return total - tailor - delivery - measurement;
}

/**
 * Distributes remaining tailor earnings upon successful delivery.
 * Delivery partner payouts are handled per-phase in delivery.controller.js.
 * Platform absorbs free-delivery subsidy and coupon discount (no silent loss to partners).
 */
const distributeEarnings = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order || order.status !== "delivered") {
      throw new Error("Invalid order or order not delivered");
    }

    if (order.earningsSettled) {
      await session.abortTransaction();
      return;
    }

    if (order.paymentStatus !== "paid") {
      await session.abortTransaction();
      return;
    }

    const { tailor } = order;
    const deliveryBudget = computeDeliveryBudget(order);

    let tailorShare = computeTailorMerchandise(order);

    // Deduct advance already credited to tailor wallet
    let tailorAdvanceReceived = 0;
    if (order.advancePaymentStatus === "paid" && order.advancePaymentAmount > 0) {
      const existingAdvance = await WalletTransaction.findOne({
        user: tailor,
        order: orderId,
        category: "advance_payment",
        type: "credit",
      }).session(session);

      if (existingAdvance) {
        tailorAdvanceReceived = Math.round(Number(existingAdvance.amount) || 0);
      } else {
        const Settings = require("../models/Settings.js");
        const settings = (await Settings.findOne()) || (await Settings.create({}));
        const advancePct = settings?.walletConfig?.advancePercentage || 30;
        tailorAdvanceReceived = Math.round(tailorShare * (advancePct / 100));
      }
      tailorShare = Math.max(0, tailorShare - tailorAdvanceReceived);
    }

    // Prevent duplicate tailor final settlement
    const existingFinal = await WalletTransaction.findOne({
      user: tailor,
      order: orderId,
      category: "order_earnings",
      type: "credit",
      description: new RegExp(`Final settlement for order`, "i"),
    }).session(session);

    if (!existingFinal && tailorShare > 0) {
      const tailorProfile = await Tailor.findOne({ user: tailor }).session(session);
      if (tailorProfile) {
        tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorShare;
        await tailorProfile.save({ session });

        await WalletTransaction.create(
          [
            {
              user: tailor,
              amount: tailorShare,
              type: "credit",
              category: "order_earnings",
              order: orderId,
              description: `Final settlement for order ${order.orderId}`,
            },
          ],
          { session }
        );
      }
    }

    const totalTailorEarning = computeTailorMerchandise(order);
    const measurementBudget = Math.round(
      Number(order.measurementVisitFee) ||
        Number(order.measurementExecutiveEarning) ||
        0
    );
    const platformNet = computePlatformNet(order);

    order.tailorEarning = totalTailorEarning;
    order.deliveryPartnerEarning = deliveryBudget;
    order.actualDeliveryCost = order.actualDeliveryCost || deliveryBudget;
    order.measurementExecutiveEarning =
      order.measurementExecutiveEarning || measurementBudget;
    // Never invent platformFee from totalAmount — keep checkout-locked commission
    order.netPlatformEarning = platformNet;
    order.earningsSettled = true;

    await order.save({ session });
    await session.commitTransaction();
    console.log(
      `Earnings distributed for order ${order.orderId}: tailor=₹${totalTailorEarning}, delivery=₹${deliveryBudget}, measurement=₹${measurementBudget}, platformFee=₹${order.platformFee || 0}, platformNet=₹${platformNet}`
    );
  } catch (error) {
    await session.abortTransaction();
    console.error("Earnings distribution failed:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  distributeEarnings,
  computeTailorMerchandise,
  computeDeliveryBudget,
  computePhaseDeliveryEarning,
  computePlatformNet,
  phaseDeliveryTxQuery,
};
