const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    category: {
      type: String,
      enum: ["order_earnings", "advance_payment", "delivery_earnings", "withdrawal", "commission_deduction", "referral_bonus", "refund"],
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    withdrawalRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WithdrawalRequest",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
