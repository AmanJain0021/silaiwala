const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    addresses: [
      {
        type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
        receiverName: String,
        phone: String,
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number], // [longitude, latitude]
          },
        },
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Assuming a Product model will exist
      },
    ],
    referralCode: {
      type: String,
      unique: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    referredCount: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    referralBonusAwarded: {
      type: Boolean,
      default: false,
    },
    activeCustomerPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },
    customerPlanExpiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.pre("save", function () {
  if (!this.referralCode) {
    // Unique-ish random code: TR + 6 alphanumeric uppercase
    this.referralCode =
      "TR" + Math.random().toString(36).substring(2, 8).toUpperCase();
  } else {
    this.referralCode = String(this.referralCode).trim().toUpperCase();
  }
});

// Geo-spatial index for addresses if needed later (optimized search)
customerSchema.index({ "addresses.zipCode": 1 });

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
