const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_ACCEPTED",
        "ORDER_REJECTED",
        "ORDER_STATUS_UPDATED",
        "ORDER_ASSIGNED",
        "ORDER_DELIVERED",
        "PAYMENT_SUCCESS",
        "NEW_REVIEW",
        "SYSTEM_NOTICE",
        "NEW_DELIVERY_TASK",
        "FABRIC_PICKED_UP",
        "FABRIC_DELIVERED",
        "OUT_FOR_DELIVERY",
        "PARTNER_ASSIGNED",
        "PARTNER_ACCEPTED",
        "ACCOUNT_APPROVED",
        "ACCOUNT_REJECTED",
        "TASK_ASSIGNED",
        "WITHDRAWAL_REQUESTED",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_REJECTED",
        "WITHDRAWAL_PAID",
        "NEW_REGISTRATION",
        "SUPPORT_TICKET",
        "TAILOR_TIMEOUT",
        "MEASUREMENT_NO_EXECUTIVE",
        "NEW_MEASUREMENT_REQUEST",
        "MEASUREMENT_ACCEPTED",
        "MEASUREMENT_OTP",
        "MEASUREMENT_UPLOADED",
        "MEASUREMENT_REJECTED",
        "ACCOUNT_STATUS",
        "OTP_GENERATED",
        "DELIVERY_OTP",
        "CUSTOM_DESIGN_REQUEST",
        "CUSTOM_DESIGN_QUOTE",
        "ALTERATION_REQUEST",
        "ALTERATION_QUOTE",
        "ISSUE_REPORTED",
        "ISSUE_UPDATED",
        "ISSUE_RESOLVED"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      targetUrl: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
