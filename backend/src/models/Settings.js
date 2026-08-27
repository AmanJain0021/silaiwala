const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    general: {
      platformName: { type: String, default: "SewZella" },
      appLogos: {
        customer: { type: String, default: "" },
        tailor: { type: String, default: "" },
        delivery: { type: String, default: "" },
        measurementExecutive: { type: String, default: "" },
      },
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
      /** Order subtotal (₹) above which customer delivery fee is waived */
      freeDeliveryMinOrder: { type: Number, default: 999 },
    },
    commissions: {
      stitchingPercentage: { type: Number, default: 15 },
      readymadePercentage: { type: Number, default: 10 },
    },
    deliveryRates: {
      baseFee: { type: Number, default: 20 },
      perKmRate: { type: Number, default: 10 },
    },
    executiveRates: {
      baseFee: { type: Number, default: 50 },
      perKmRate: { type: Number, default: 15 },
    },
    walletConfig: {
      advancePercentage: { type: Number, default: 30 },
      platformFeePercentage: { type: Number, default: 5 },
      minDeliveryFee: { type: Number, default: 20 },
      withdrawalApprovalRequired: { type: Boolean, default: true },
    },
    codWalletConfig: {
      maxCashLimit: { type: Number, default: 5000 },
      maxDepositTimeHours: { type: Number, default: 48 },
      autoBlockOnLimit: { type: Boolean, default: true },
    },
    loyaltyConfig: {
      pointsPer100Spent: { type: Number, default: 1 },
      flatPointsPerBooking: { type: Number, default: 0 },
      redemptionValuePerPoint: { type: Number, default: 1 },
      cancellationPenalty: { type: Number, default: 0 },
    },
    referralConfig: {
      enabled: { type: Boolean, default: true },
      /** Loyalty points for referrer when referee signs up with their code */
      referrerPointsOnFirstAdvance: { type: Number, default: 50 },
      /** Loyalty points for new user when they sign up with a referral code */
      refereePointsOnFirstAdvance: { type: Number, default: 25 },
    },
    tailorSearch: {
      searchRadiusKm: { type: mongoose.Schema.Types.Mixed, default: "default" },
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
