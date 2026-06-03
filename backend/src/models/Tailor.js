const mongoose = require("mongoose");

const tailorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    shopName: {
      type: String,
      trim: true,
    },
    specializations: [
      {
        type: String,
      },
    ],
    experienceInYears: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      address: {
        type: String,
        trim: true,
      }
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    commissionPercentage: {
      type: Number,
      default: 20,
      min: 0,
      max: 100
    },
    bankDetails: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String
    },
    registrationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
    documents: [
      {
        name: String,
        url: String,
        status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
        remarks: String
      },
    ],
    activePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
    },
    planExpiryDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimization
tailorSchema.index({ location: "2dsphere" });
tailorSchema.index({ rating: -1 });

const Tailor = mongoose.model("Tailor", tailorSchema);

module.exports = Tailor;
