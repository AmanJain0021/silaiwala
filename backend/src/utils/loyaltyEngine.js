const User = require("../models/User");
const Settings = require("../models/Settings");
const mongoose = require("mongoose");

/**
 * Handles awarding or deducting loyalty points based on order status changes.
 * Call this function AFTER an order's status has been successfully changed to 'delivered' or 'cancelled'.
 * 
 * @param {Object} order - The Order mongoose document
 */
exports.processLoyaltyPoints = async (order) => {
  try {
    const settings = await Settings.getSettings();
    const config = settings.loyaltyConfig;
    if (!config) return;

    const user = await User.findById(order.customer);
    if (!user) return;

    // Initialize if not present
    if (typeof user.loyaltyPoints !== 'number') {
      user.loyaltyPoints = 0;
    }

    if (order.status === 'delivered' || order.status === 'order-completed') {
      // Check if points were already awarded for this order to prevent double-awarding.
      // We can use a flag on the order itself.
      if (order.loyaltyPointsAwarded) return;

      const orderAmount = order.totalAmount || 0;
      const pointsFromSpend = Math.floor(orderAmount / 100) * (config.pointsPer100Spent || 0);
      const flatPoints = config.flatPointsPerBooking || 0;
      const totalAwarded = pointsFromSpend + flatPoints;

      if (totalAwarded > 0) {
        user.loyaltyPoints += totalAwarded;
        await user.save();
        
        order.loyaltyPointsAwarded = true;
        await mongoose.model('Order').updateOne({ _id: order._id }, { loyaltyPointsAwarded: true });
        
        console.log(`[Loyalty Engine] Awarded ${totalAwarded} points to user ${user._id} for order ${order.orderId}`);
      }
    } else if (order.status === 'cancelled') {
      if (order.loyaltyPointsDeducted) return;

      const penalty = config.cancellationPenalty || 0;
      if (penalty > 0) {
        user.loyaltyPoints -= penalty;
        if (user.loyaltyPoints < 0) user.loyaltyPoints = 0;
        await user.save();
        
        await mongoose.model('Order').updateOne({ _id: order._id }, { loyaltyPointsDeducted: true });
        
        console.log(`[Loyalty Engine] Deducted ${penalty} points from user ${user._id} for cancelled order ${order.orderId}`);
      }
    }
  } catch (error) {
    console.error("[Loyalty Engine] Error processing loyalty points:", error);
  }
};
