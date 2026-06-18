const mongoose = require("mongoose");

const paymentLedgerSchema = new mongoose.Schema(
  {
    ledgerId: {
      type: String,
      unique: true,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderId: {
      type: String, // Human-readable order ID (e.g., ORD-XXXXXXXX)
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentId: {
      type: String, // Razorpay Payment ID
    },
    razorpayOrderId: {
      type: String,
    },
    transactionId: {
      type: String, // Internal unique transaction reference
      unique: true,
      required: true,
    },

    // --- Amount Breakdown ---
    orderAmount: {
      type: Number, // Base order amount (before GST, delivery, discounts)
      required: true,
      default: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
    },
    gstPercentage: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },

    // --- Distribution ---
    tailorEarning: {
      type: Number,
      default: 0,
    },
    deliveryPartnerEarning: {
      type: Number,
      default: 0,
    },
    netPlatformEarning: {
      type: Number,
      default: 0,
    },

    // --- Total ---
    totalPaid: {
      type: Number,
      required: true,
      default: 0,
    },

    // --- Payment Details ---
    paymentType: {
      type: String,
      enum: ["full", "advance", "remaining"],
      default: "full",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "wallet", "pending"],
      default: "online",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },

    paidAt: Date,
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
paymentLedgerSchema.index({ order: 1 });
paymentLedgerSchema.index({ customer: 1 });
paymentLedgerSchema.index({ tailor: 1 });
paymentLedgerSchema.index({ deliveryPartner: 1 });
paymentLedgerSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentLedgerSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PaymentLedger", paymentLedgerSchema);
