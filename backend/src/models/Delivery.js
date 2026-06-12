const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ["bike", "scooter", "car", "cycle", "other"],
      required: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    currentAddress: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on-delivery"],
      default: "active",
    },
    documents: [
      {
        name: String,
        url: String,
        status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
      },
    ],
    bankDetails: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    aadharNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

deliverySchema.index({ currentLocation: "2dsphere" });

const Delivery = mongoose.model("Delivery", deliverySchema);

module.exports = Delivery;
