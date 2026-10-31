const mongoose = require("mongoose");

const bulkOrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationName: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    orderType: {
      type: String,
      enum: ["school", "corporate", "event", "wholesale", "other"],
      default: "other",
    },
    serviceType: {
      type: String, // e.g., "Men's Formal Shirts", "Women's Blazers"
      required: true,
    },
    estimatedQuantity: {
      type: Number,
      required: true,
      min: 10, // Minimum for bulk
    },
    fabricPreference: {
      type: String,
      enum: ["customer-provided", "platform-provided", "open-to-suggestions"],
      default: "platform-provided",
    },
    expectedDeliveryDate: {
      type: Date,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    measurementMethod: {
      type: String,
      enum: ["standard-sizes", "custom-sheet", "on-site-service"],
      default: "standard-sizes",
    },
    sizeDistribution: {
      S: { type: Number, default: 0 },
      M: { type: Number, default: 0 },
      L: { type: Number, default: 0 },
      XL: { type: Number, default: 0 },
      XXL: { type: Number, default: 0 },
    },
    notes: {
      type: String,
    },
    measurementSheet: {
      type: String, // URL to uploaded Excel/PDF
    },
    referenceImages: [String], // URLs to Cloudinary
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    adminCreator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: [
        "pending", 
        "reviewing", 
        "quoted", 
        "accepted", 
        "rejected", 
        "in-production", 
        "completed", 
        "cancelled",
        "ready-for-pickup",
        "shipped",
        "delivered",
        "accepted-by-tailor",
        "fabric-ready-for-pickup"
      ],
      default: "pending",
    },
    quote: {
      pricePerUnit: { type: Number },
      totalAmount: { type: Number },
      depositRequired: { type: Number },
      validUntil: { type: Date },
      adminNotes: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "deposit-paid", "partially-paid", "fully-paid", "refunded"],
      default: "pending",
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

// Pre-save hook to generate orderId if not present
bulkOrderSchema.pre("validate", async function () {
  if (!this.orderId) {
    const count = await mongoose.model("BulkOrder").countDocuments();
    this.orderId = `BULK-${1000 + count + 1}`;
  }
});

module.exports = mongoose.model("BulkOrder", bulkOrderSchema);
