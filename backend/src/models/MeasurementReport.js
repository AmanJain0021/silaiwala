const mongoose = require("mongoose");

const measurementReportSchema = new mongoose.Schema(
  {
    measurementRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MeasurementRequest",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    executive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formData: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Allows numbers and strings for flexibility
      default: {},
    },
    unit: {
      type: String,
      enum: ["inches", "cm"],
      default: "inches",
    },
    pdfUrl: {
      type: String,
    },
    photos: [
      {
        type: String, // Cloudinary URLs
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

measurementReportSchema.index({ order: 1 });
measurementReportSchema.index({ measurementRequest: 1 });

const MeasurementReport = mongoose.model(
  "MeasurementReport",
  measurementReportSchema
);

module.exports = MeasurementReport;
