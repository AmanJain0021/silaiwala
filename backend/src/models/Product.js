const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
    },
    discount: {
      type: Number,
      default: 0,
    },
    codAvailable: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String,
      },
    ],
    image: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tailor",
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    ratings: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    sizes: [String],
    colors: [
      {
        name: String,
        hex: String,
      }
    ],
    subCategory: { type: String, trim: true },
    brand: { type: String, trim: true },
    discountPrice: { type: Number },
    variants: [
      {
        size: String,
        color: String,
        stock: { type: Number, default: 0 },
        sku: String,
      }
    ],
    fabric: { type: String, trim: true },
    gender: { type: String, enum: ["Men", "Women", "Kids", "Unisex"], default: "Unisex" },
    occasion: { type: String, trim: true },
    fitType: { type: String, trim: true },
    pattern: { type: String, trim: true },
    washCare: { type: String, trim: true },
    tags: [String],
    details: [
      {
        title: String,
        content: String,
      }
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    productType: {
      type: String,
      enum: ["store_item", "fabric"],
      default: "store_item",
    },
    weight: {
      type: Number,
      default: 0.5, // Default weight in kg
    },
    length: {
      type: Number,
      default: 10, // Default length in cm
    },
    width: {
      type: Number,
      default: 10, // Default width in cm
    },
    height: {
      type: Number,
      default: 10, // Default height in cm
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search and filtration
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ tailor: 1 });
productSchema.index({ tailor: 1, productType: 1, isActive: 1, inStock: 1 });

module.exports = mongoose.model("Product", productSchema);
