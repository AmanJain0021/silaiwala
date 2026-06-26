const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    originalOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    reworkOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "pending", 
        "under_review", 
        "accepted", 
        "rejected", 
        "pickup_pending", 
        "pickup_completed", 
        "rework_in_progress", 
        "ready_for_delivery", 
        "out_for_delivery", 
        "resolved", 
        "closed"
      ],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Issue", issueSchema);
