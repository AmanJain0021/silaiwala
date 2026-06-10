const WalletTransaction = require("../models/WalletTransaction");
const Tailor = require("../models/Tailor");
const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const mongoose = require("mongoose");

/**
 * Distributes earnings to tailor and delivery partner upon successful delivery
 * @param {string} orderId - MongoDB ID of the order
 */
const distributeEarnings = async (orderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order || order.status !== "delivered") {
      throw new Error("Invalid order or order not delivered");
    }

    if (order.paymentStatus !== "paid") {
      // In a real app, you might want to handle COD payments here as well
      // For now, only distributing if paid online or marked as paid
      return;
    }

    const { tailor, deliveryPartner, totalAmount, platformFee, deliveryFee } = order;

    // 1. Calculate Tailor Share
    const tailorShare = totalAmount - platformFee - deliveryFee;

    // 2. Credit Tailor
    const tailorProfile = await Tailor.findOne({ user: tailor }).session(session);
    if (tailorProfile) {
      tailorProfile.walletBalance += tailorShare;
      await tailorProfile.save({ session });

      await WalletTransaction.create([
        {
          user: tailor,
          amount: tailorShare,
          type: "credit",
          category: "order_earnings",
          order: orderId,
          description: `Earnings for order ${order.orderId}`,
        },
      ], { session });
    }

    // Note: Delivery partner payouts are now handled per-phase inside delivery.controller.js
    // to correctly support distance-based payouts for both fabric pickup and product delivery.

    await session.commitTransaction();
    console.log(`Earnings distributed for order ${order.orderId}`);
  } catch (error) {
    await session.abortTransaction();
    console.error("Earnings distribution failed:", error);
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { distributeEarnings };
