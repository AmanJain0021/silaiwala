const mongoose = require("mongoose");
const crypto = require("crypto");

const measurementRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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
      required: true,
    },
    executive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customerAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    customerLocation: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "accepted",
        "rejected",
        "otp_sent",
        "otp_verified",
        "measurements_uploaded",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    otp: {
      type: String,
      select: false, // Only selected explicitly for verification
    },
    otpExpiresAt: {
      type: Date,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    distance: {
      type: Number, // km between customer and executive
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate requestId before saving
measurementRequestSchema.pre("save", async function () {
  if (!this.requestId) {
    this.requestId = `MR-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;
  }
});

measurementRequestSchema.index({ customerLocation: "2dsphere" });
measurementRequestSchema.index({ status: 1, executive: 1 });
measurementRequestSchema.index({ order: 1 });

const MeasurementRequest = mongoose.model(
  "MeasurementRequest",
  measurementRequestSchema
);

module.exports = MeasurementRequest;
