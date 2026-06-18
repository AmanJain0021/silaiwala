const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    commissionRange: {
      type: String,
      required: true,
    },
    features: [
      {
        type: String,
        required: true,
      },
    ],
    isPopular: {
      type: Boolean,
      default: false,
    },
    theme: {
      type: String,
      enum: ["basic", "premium", "elite"],
      default: "basic",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxOrdersPerMonth: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
