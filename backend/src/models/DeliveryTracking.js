const mongoose = require("mongoose");

const deliveryTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true, // One tracking document per order (can be updated for multiple phases if needed)
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    currentLocation: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    currentStatus: {
      type: String,
      default: "assigned"
    },
    eta: {
      type: String,
      default: null
    },
    distanceRemaining: {
      type: Number,
      default: null
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    locationHistory: [
      {
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now },
        phase: String // e.g. "pickup", "dropoff"
      }
    ]
  },
  { timestamps: true }
);

const DeliveryTracking = mongoose.model("DeliveryTracking", deliveryTrackingSchema);

module.exports = DeliveryTracking;
