const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Walk-in / in-store orders — separate from marketplace Order collection.
 * Flagged with source: "offline" (+ isOffline) so they never mix into online Order queries.
 */
const customizationOptionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    price: { type: Number, default: 0, min: 0 },
    refImage: { type: String, default: "" },
    addon: { type: mongoose.Schema.Types.ObjectId, ref: "StyleAddon" },
    enabled: { type: Boolean, default: false },
    estimatedTime: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

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
    // TODO: Basic/Premium/Luxury packages are offline-specific (not online deliveryType).
    stitchingPackage: {
      type: String,
      enum: ["basic", "premium", "luxury"],
      default: "basic",
    },
    stitchingCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    fabricSource: {
      type: String,
      enum: ["customer", "sewzella"],
      default: "customer",
    },
    /** Same Map shape as Order.items[].measurements / Measurement.measurements */
    measurements: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    measurementUnit: {
      type: String,
      enum: ["inches", "cm"],
      default: "inches",
    },
    measurementPhotos: {
      type: [String],
      default: [],
    },
    savedMeasurementLabel: {
      type: String,
      trim: true,
      default: "",
    },
    // Reuse StyleAddon catalog selections (neck/sleeve/bottom/embroidery/lace)
    styleAddons: [
      {
        addon: { type: mongoose.Schema.Types.ObjectId, ref: "StyleAddon" },
        name: { type: String, trim: true },
        category: { type: String, trim: true },
        price: { type: Number, default: 0, min: 0 },
        refImage: { type: String, default: "" },
      },
    ],
    customizations: {
      neck: { type: customizationOptionSchema, default: () => ({}) },
      sleeve: { type: customizationOptionSchema, default: () => ({}) },
      bottom: { type: customizationOptionSchema, default: () => ({}) },
      lining: { type: customizationOptionSchema, default: () => ({}) },
      embroidery: { type: customizationOptionSchema, default: () => ({}) },
      lacePiping: { type: customizationOptionSchema, default: () => ({}) },
    },
    addOnsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["amount", "percent"],
      default: "amount",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
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
      enum: [
        "accepted",
        "cutting",
        "stitching",
        "fitting",
        "finishing",
        "ready",
        "delivered",
        "cancelled",
        // legacy — kept for existing documents
        "pending",
        "in_progress",
      ],
      default: "accepted",
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
    },
    /**
     * Fulfillment — offline-native (not marketplace Order delivery).
     * TODO: Bridge home_delivery to DeliveryPartner broadcast only via a dedicated
     * adapter that never writes to online Order / online delivery revenue.
     */
    fulfillmentMethod: {
      type: String,
      enum: ["pickup", "home_delivery"],
      default: "pickup",
      index: true,
    },
    deliveryAddress: {
      type: String,
      trim: true,
      default: "",
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryNotes: {
      type: String,
      trim: true,
      default: "",
    },
    /** Tracks physical handoff separately from production status */
    fulfillmentStatus: {
      type: String,
      enum: [
        "pending",
        "awaiting_pickup",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    expectedCompletionDate: {
      type: Date,
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
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    deliveryPartnerStatus: {
      type: String,
      enum: ["none", "requested", "accepted", "rejected"],
      default: "none",
    },
    assignedDeliveryAt: {
      type: Date,
    },
    pickupAddress: {
      type: String,
      trim: true,
      default: "SewZella Central Store (Admin Workshop)",
    },
    source: {
      type: String,
      enum: ["offline"],
      default: "offline",
      immutable: true,
    },
    isOffline: {
      type: Boolean,
      default: true,
      immutable: true,
    },
    /** Public read-only tracking (no login) — QR on receipt */
    trackingToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    pickedUpAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    outForDeliveryAt: {
      type: Date,
    },
    /**
     * Walk-in feedback — TODO: do not reuse marketplace Review (requires User + Order).
     */
    customerRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    customerReview: {
      type: String,
      trim: true,
      default: "",
    },
    measurementsSavedOnComplete: {
      type: Boolean,
      default: false,
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
    const lastOrder = await mongoose.model("OfflineOrder")
      .findOne({ orderId: { $regex: /^OFF-\d+$/ } })
      .sort({ createdAt: -1 });

    let nextIdNum = 1001;
    if (lastOrder && lastOrder.orderId) {
      const match = lastOrder.orderId.match(/^OFF-(\d+)$/);
      if (match) {
        nextIdNum = parseInt(match[1], 10) + 1;
      }
    } else {
      const count = await mongoose.model("OfflineOrder").countDocuments();
      nextIdNum = 1000 + count + 1;
    }
    
    this.orderId = `OFF-${nextIdNum}`;
  }
  if (!this.trackingToken) {
    this.trackingToken = crypto.randomBytes(16).toString("hex");
  }
});

offlineOrderSchema.pre("save", function () {
  this.syncPaymentStatus();

  if (this.isModified("status") && this.status === "ready") {
    if (this.fulfillmentMethod === "pickup" && this.fulfillmentStatus === "pending") {
      this.fulfillmentStatus = "awaiting_pickup";
    }
  }

  if (this.isModified("status") && this.status === "delivered") {
    if (!this.deliveredAt) this.deliveredAt = new Date();
    if (this.fulfillmentMethod === "pickup" && !this.pickedUpAt) {
      this.pickedUpAt = this.deliveredAt;
    }
    this.fulfillmentStatus = "completed";
  }

  if (this.isModified("status") && this.status === "cancelled") {
    this.fulfillmentStatus = "cancelled";
  }
});

offlineOrderSchema.index({ createdAt: -1 });
offlineOrderSchema.index({ paymentStatus: 1, status: 1 });
offlineOrderSchema.index({ shopTailor: 1, status: 1 });
offlineOrderSchema.index({ stitchingPackage: 1 });
offlineOrderSchema.index({ fulfillmentMethod: 1, fulfillmentStatus: 1 });
offlineOrderSchema.index({ status: 1, fulfillmentMethod: 1 });

module.exports = mongoose.model("OfflineOrder", offlineOrderSchema);
