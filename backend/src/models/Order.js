const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
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
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pickupPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    dropoffPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
        fabricSource: {
          type: String,
          enum: ["customer", "platform"],
          default: "customer",
        },
        deliveryType: {
          type: String,
          enum: ["standard", "express", "premium"],
          default: "standard",
        },
        selectedFabric: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: Number,
        measurements: Map,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending", 
        "waiting-for-customer-dropoff",
        "fabric-ready-for-pickup",
        "fabric-picked-up",
        "fabric-delivered",
        "fabric-received",
        "order-received",
        "fabric-selected",
        "accepted", 
        "measurement-verification",
        "in-progress", 
        "cutting",
        "stitching",
        "finishing",
        "quality-check",
        "completed", 
        "ready",
        "ready-for-pickup",
        "ready-for-delivery",
        "out-for-delivery", 
        "delivered", 
        "product-delivered",
        "order-completed",
        "failed-delivery", 
        "cancelled"
      ],
      default: "pending",
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'delivered'],
      default: 'pending'
    },
    pickupDeliveryStatus: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'delivered'],
      default: 'pending'
    },
    dropoffDeliveryStatus: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'delivered'],
      default: 'pending'
    },
    pickupDeliveryOtp: {
      type: String,
      select: false // Only selected explicitly for verification
    },
    pickupOtpVerified: {
      type: Boolean,
      default: false
    },
    dropoffDeliveryOtp: {
      type: String,
      select: false
    },
    dropoffOtpVerified: {
      type: Boolean,
      default: false
    },
    deliveryMethod: {
      type: String,
      enum: ['auto', 'manual', 'shiprocket'],
      default: 'auto'
    },
    fabricPickupRequired: {
        type: Boolean,
        default: false
    },
    fabricDeliveryPreference: {
        type: String,
        enum: ['pending', 'self', 'partner'],
        default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "failed"],
      default: "pending",
    },
    tailorTimeoutNotified: {
      type: Boolean,
      default: false,
    },
    paymentId: String, // Razorpay Payment ID
    razorpayOrderId: String,
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    trackingHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        message: String,
        proof: String,
      },
    ],
    deliveryProof: String,
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0
    },
    acceptedAt: Date,
    assignedAt: Date,
    deliveryAcceptedAt: Date,
    pickupAt: Date,
    deliveryFee: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    deliveredAt: Date,
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for optimization
orderSchema.index({ customer: 1, status: 1 });
orderSchema.index({ tailor: 1, status: 1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
