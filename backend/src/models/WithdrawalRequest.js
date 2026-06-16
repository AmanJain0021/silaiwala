const mongoose = require("mongoose");

const withdrawalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["tailor", "delivery"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 50, // Minimum withdrawal amount
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },
    method: {
      type: String,
      enum: ["upi", "bank_transfer", "qr_code"],
      default: "upi",
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
      bankName: String,
      qrCodeImage: String,
    },
    adminNotes: {
      type: String,
    },
    transactionReference: {
      type: String,
    },
    approvedAt: Date,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
