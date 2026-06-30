const mongoose = require("mongoose");

const shiprocketLogSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    shipmentId: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE_SHIPMENT", "GENERATE_AWB", "SCHEDULE_PICKUP", "GET_LABEL"],
    },
    requestPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    responseData: {
      type: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      required: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

shiprocketLogSchema.index({ order: 1 });
shiprocketLogSchema.index({ action: 1 });
shiprocketLogSchema.index({ status: 1 });

const ShiprocketLog = mongoose.model("ShiprocketLog", shiprocketLogSchema);

module.exports = ShiprocketLog;
