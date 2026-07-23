const mongoose = require("mongoose");

/**
 * Walk-in / in-store orders — separate from marketplace Order collection.
 * No delivery partners, Razorpay, OTPs, or online tracking.
 */
const offlineOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    offlineCustomer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OfflineCustomer",
      required: [true, "Offline customer is required"],
      index: true,
    },
    garmentType: {
      type: String,
      required: [true, "Please provide garment/service type"],
      trim: true,
    },
    /** Same Map shape as Order.items[].measurements / Measurement.measurements */
    measurements: {
      type: Map,
      of: Number,
      default: {},
    },
    measurementUnit: {
      type: String,
      enum: ["inches", "cm"],
      default: "inches",
    },
    totalAmount: {
      type: Number,
      required: [true, "Please provide order price"],
      min: 0,
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "ready", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopTailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    source: {
      type: String,
      enum: ["offline"],
      default: "offline",
      immutable: true,
    },
    deliveredAt: {
      type: Date,
    },
    history: [
      {
        status: String,
        message: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

offlineOrderSchema.virtual("balanceDue").get(function () {
  return Math.max(0, (this.totalAmount || 0) - (this.advancePaid || 0));
});

offlineOrderSchema.set("toJSON", { virtuals: true });
offlineOrderSchema.set("toObject", { virtuals: true });

/** Derive paymentStatus from amounts */
offlineOrderSchema.methods.syncPaymentStatus = function () {
  const total = this.totalAmount || 0;
  const paid = this.advancePaid || 0;
  if (paid <= 0) {
    this.paymentStatus = "pending";
  } else if (paid >= total) {
    this.paymentStatus = "paid";
  } else {
    this.paymentStatus = "partial";
  }
};

offlineOrderSchema.pre("validate", async function () {
  if (!this.orderId) {
    const count = await mongoose.model("OfflineOrder").countDocuments();
    this.orderId = `OFF-${1000 + count + 1}`;
  }
});

offlineOrderSchema.pre("save", function () {
  this.syncPaymentStatus();
  if (this.isModified("status") && this.status === "delivered" && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
});

offlineOrderSchema.index({ createdAt: -1 });
offlineOrderSchema.index({ paymentStatus: 1, status: 1 });

module.exports = mongoose.model("OfflineOrder", offlineOrderSchema);
