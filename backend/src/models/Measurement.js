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
    garmentType: {
      type: String,
      required: [true, "Please specify the garment type (e.g., Shirt, Pant)"],
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

// Ensure a user can only have one default per garment type (optional but good)
// measurementSchema.index({ user: 1, garmentType: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = Measurement;
