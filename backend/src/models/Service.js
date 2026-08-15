const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a service title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    basePrice: {
      type: Number,
      required: [true, "Please add a base price"],
    },
    image: {
      type: String,
      default: "no-photo.jpg",
    },
    tags: [
      {
        type: String,
      },
    ],
    isPickupAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryTime: {
      type: String,
      required: [true, "Please specify estimated delivery time"], // e.g. "3-5 days"
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Tailor-selected style variants (e.g. ["Anarkali Kurta", "Straight Kurta"]) from category's admin styles
    selectedStyles: [
      {
        name: { type: String, trim: true },
        image: { type: String, default: "" },
        description: { type: String, default: "", trim: true },
      },
    ],
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tailor",
      required: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be can not be more than 5"],
      default: 4.5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimization: Index for faster searches and category filtering
serviceSchema.index({ tailor: 1, category: 1, isActive: 1 });
serviceSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Service", serviceSchema);
