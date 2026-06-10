const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    method: {
      type: String,
      enum: ["bank_transfer", "upi", "wallet"],
      default: "bank_transfer",
    },
    bankDetails: {
      accountNumber: String,
      ifsc: String,
      upiId: String,
    },
    transactionReference: String, // Bank Ref ID
    processedAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payout", payoutSchema);
