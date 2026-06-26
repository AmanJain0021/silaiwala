const mongoose = require("mongoose");

const issueMessageSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "senderModel",
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User"],
      default: "User"
    },
    message: {
      type: String,
    },
    imageUrl: {
      type: String,
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

module.exports = mongoose.model("IssueMessage", issueMessageSchema);
