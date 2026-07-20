const mongoose = require("mongoose");

const loyaltyPointTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    points: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    reason: {
      type: String,
      enum: [
        "referral_referrer",
        "referral_welcome",
        "order_loyalty",
        "subscription_redeem",
        "cancellation_penalty",
        "admin_adjustment",
      ],
      required: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    subscriptionPlan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    description: String,
    balanceAfter: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LoyaltyPointTransaction", loyaltyPointTransactionSchema);
