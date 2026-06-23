const mongoose = require("mongoose");

const measurementExecutiveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    address: {
      type: String,
      trim: true,
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
    serviceRadius: {
      type: Number,
      default: 10, // km
      min: 1,
      max: 50,
    },
    profilePhoto: {
      type: String,
      default: "default_profile.png",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    availabilityStatus: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalMeasurements: {
      type: Number,
      default: 0,
    },
    aadharNumber: {
      type: String,
      trim: true,
    },
    documents: [
      {
        name: String,
        url: String,
        status: {
          type: String,
          enum: ["pending", "verified", "rejected"],
          default: "pending",
        },
        remarks: String,
      },
    ],
    bankDetails: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
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
  },
  {
    timestamps: true,
  }
);

measurementExecutiveSchema.index({ currentLocation: "2dsphere" });

const MeasurementExecutive = mongoose.model(
  "MeasurementExecutive",
  measurementExecutiveSchema
);

module.exports = MeasurementExecutive;
