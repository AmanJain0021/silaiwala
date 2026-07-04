const mongoose = require("mongoose");

const cmsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["legal", "faq"],
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["customer", "tailor", "delivery", "executive", "general"],
      default: "general",
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

module.exports = mongoose.model("CMSContent", cmsSchema);
