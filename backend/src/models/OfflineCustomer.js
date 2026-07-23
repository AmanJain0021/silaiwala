const mongoose = require("mongoose");

/**
 * Walk-in / non-app customers managed only from the admin panel.
 * Completely separate from User/Customer — no login, OTP, or app visibility.
 */
const offlineCustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide customer name"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    /** Admin/tailor who created this record */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    /** Optional shop tailor this walk-in belongs to */
    shopTailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    source: {
      type: String,
      enum: ["offline"],
      default: "offline",
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

offlineCustomerSchema.index({ name: "text", phone: "text" });
offlineCustomerSchema.index({ phone: 1, name: 1 });

module.exports = mongoose.model("OfflineCustomer", offlineCustomerSchema);
