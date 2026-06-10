const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    general: {
      platformName: { type: String, default: "Silaiwala" },
      supportEmail: { type: String, default: "support@silaiwala.com" },
      supportPhone: { type: String, default: "+91 1800 123 4567" },
      emergencyPhone: { type: String, default: "+91 9999999999" },
      currencyDefault: { type: String, default: "INR" },
    },
    maintenanceMode: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "App will be temporarily unavailable to users." },
    },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      smtpSettings: {
        host: String,
        port: Number,
        user: String,
        pass: String,
      }
    },
    paymentGateways: {
      razorpay: {
        enabled: { type: Boolean, default: true },
        keyId: String,
        keySecret: String,
      },
      stripe: {
        enabled: { type: Boolean, default: false },
        publishableKey: String,
        secretKey: String,
      }
    },
    appConfig: {
      androidVersion: { type: String, default: "1.0.0" },
      iosVersion: { type: String, default: "1.0.0" },
      forceUpdate: { type: Boolean, default: false },
    },
    visitFee: {
      baseFee: { type: Number, default: 150 },
      perKmFee: { type: Number, default: 20 },
      freeKm: { type: Number, default: 3 },
    },
    pricing: {
      gstPercentage: { type: Number, default: 5 },
    },
    deliveryRates: {
      baseFee: { type: Number, default: 20 },
      perKmRate: { type: Number, default: 10 },
    }
  },
  {
    timestamps: true,
  }
);

// We only want ONE settings document
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
