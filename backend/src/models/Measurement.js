const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    profileName: {
      type: String,
      required: [true, "Please provide a name for this measurement profile"],
      trim: true,
    },
    /** Display label — usually the service/category name (e.g. Shirt, Blouse) */
    garmentType: {
      type: String,
      required: [true, "Please specify the garment / service type"],
    },
    /** Links profile to admin service category (measurement schema source) */
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    measurements: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    unit: {
      type: String,
      enum: ["inches", "cm"],
      default: "inches",
    },
    isDefault: {
      type: Boolean,
      default: false,
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

// Each customer only sees their own profiles (queried by user)
measurementSchema.index({ user: 1, categoryId: 1 });
measurementSchema.index({ user: 1, garmentType: 1 });

const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = Measurement;
