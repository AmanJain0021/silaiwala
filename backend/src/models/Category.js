const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
    image: String,
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    type: {
      type: String,
      default: "service",
      trim: true,
    },
    gender: {
      type: String,
      default: "all",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    basePrice: {
      type: Number,
      min: [0, "Base price cannot be negative"],
    },
    minPrice: {
      type: Number,
      min: [0, "Minimum price cannot be negative"],
    },
    maxPrice: {
      type: Number,
      min: [0, "Maximum price cannot be negative"],
    },
    deliveryTime: {
      type: String,
    },
    // Admin-defined style variants (e.g. Anarkali, Straight, A-line under "Kurta")
    styles: [
      {
        name: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
        description: { type: String, default: "", trim: true },
      },
    ],
    // Admin-defined measurement fields for dynamic forms (fields + optional section headings)
    measurementFields: [
      {
        type: {
          type: String,
          enum: ["field", "heading"],
          default: "field",
        },
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        placeholder: { type: String, default: "" },
        isRequired: { type: Boolean, default: true },
      },
    ],
    // Admin-defined style add-ons specific to this service/category
    styleAddons: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, default: 0 },
        description: { type: String, default: "", trim: true },
        image: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate that maxPrice >= minPrice when both are provided
categorySchema.pre("validate", function () {
  if (this.minPrice != null && this.maxPrice != null) {
    if (this.maxPrice < this.minPrice) {
      this.invalidate("maxPrice", "Maximum price must be greater than or equal to minimum price");
    }
  }
});

module.exports = mongoose.model("Category", categorySchema);
