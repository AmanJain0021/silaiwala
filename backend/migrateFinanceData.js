require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const Order = require("./src/models/Order");
const PaymentLedger = require("./src/models/PaymentLedger");
const Settings = require("./src/models/Settings");
const WalletTransaction = require("./src/models/WalletTransaction");
const crypto = require("crypto");

/**
 * Migration Script: Finance Data Backfill
 * 
 * This script runs through all existing "paid" orders and populates the missing
 * financial tracking fields (gstAmount, tailorEarning, etc) and generates
 * the missing PaymentLedger entries so the admin dashboard numbers are accurate.
 */

const migrate = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is undefined. Please ensure .env file exists in backend directory.");
    }
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    const settings = await Settings.findOne() || { pricing: { gstPercentage: 5 }, walletConfig: { platformFeePercentage: 10 } };
    const gstPct = settings.pricing?.gstPercentage || 5;
    const platformFeePct = settings.walletConfig?.platformFeePercentage || 10;

    const orders = await Order.find({ paymentStatus: "paid" });
    console.log(`Found ${orders.length} paid orders to migrate.`);

    let updatedCount = 0;
    let ledgerCount = 0;

    for (const order of orders) {
      let needsUpdate = false;

      // 1. Calculate GST if missing
      if (order.gstAmount === undefined || order.gstAmount === null) {
        const baseAmountForGST = order.totalAmount - (order.deliveryFee || 0);
        order.gstAmount = Math.round((baseAmountForGST * gstPct) / (100 + gstPct));
        order.gstPercentage = gstPct;
        needsUpdate = true;
      }

      // 2. Set Transaction ID if missing
      if (!order.transactionId) {
        order.transactionId = `TXN-MIG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        needsUpdate = true;
      }

      // 3. Platform Fee fix
      if (!order.platformFee) {
        order.platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
        needsUpdate = true;
      }

      // 4. Calculate Earnings if missing
      if (order.tailorEarning === undefined || order.tailorEarning === null) {
        let tailorEarning = order.totalAmount - order.platformFee - (order.deliveryFee || 0) - (order.gstAmount || 0);
        
        // Add back advance payment if they had one
        if (order.advancePaymentStatus === 'paid') {
           tailorEarning += (order.advancePaymentAmount || 0);
        }
        
        order.tailorEarning = Math.max(tailorEarning, 0);
        needsUpdate = true;
      }

      if (order.deliveryPartnerEarning === undefined || order.deliveryPartnerEarning === null) {
        order.deliveryPartnerEarning = order.deliveryFee || 0;
        needsUpdate = true;
      }

      if (order.netPlatformEarning === undefined || order.netPlatformEarning === null) {
        order.netPlatformEarning = order.platformFee + (order.gstAmount || 0);
        needsUpdate = true;
      }

      if (needsUpdate) {
        await order.save();
        updatedCount++;
      }

      // 5. Create PaymentLedger Entry if missing
      const existingLedger = await PaymentLedger.findOne({ order: order._id });
      if (!existingLedger) {
        const ledgerId = `LED-MIG-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
        
        // Determine what was paid
        let paymentType = "full";
        let paidAmount = order.totalAmount;
        let paymentMethod = order.razorpayOrderId ? "online" : "cash";

        if (order.advancePaymentStatus === 'paid' && order.remainingPaymentStatus === 'paid') {
          // Creating a single combined ledger for simplicity of migration
          paymentType = "remaining"; // Final settlement
        } else if (order.advancePaymentStatus === 'paid') {
          paymentType = "advance";
          paidAmount = order.advancePaymentAmount;
          paymentMethod = order.advancePaymentMethod || "online";
        }

        await PaymentLedger.create({
          ledgerId,
          order: order._id,
          orderId: order.orderId,
          customer: order.customer,
          tailor: order.tailor,
          deliveryPartner: order.deliveryPartner,
          paymentId: order.paymentId || order.remainingPaymentId || order.advancePaymentId,
          razorpayOrderId: order.razorpayOrderId,
          transactionId: order.transactionId,
          
          orderAmount: order.totalAmount - (order.gstAmount || 0) - (order.deliveryFee || 0),
          gstAmount: order.gstAmount || 0,
          gstPercentage: order.gstPercentage || 0,
          deliveryFee: order.deliveryFee || 0,
          platformFee: order.platformFee,
          discountAmount: order.discountAmount || 0,
          couponCode: order.couponCode,
          
          tailorEarning: order.tailorEarning,
          deliveryPartnerEarning: order.deliveryPartnerEarning,
          netPlatformEarning: order.netPlatformEarning,
          
          totalPaid: paidAmount,
          paymentType,
          paymentMethod,
          paymentStatus: "paid",
          paidAt: order.paidAt || order.createdAt || new Date(),
        });
        ledgerCount++;
      }
    }

    console.log(`Migration Complete. Updated ${updatedCount} orders and created ${ledgerCount} ledger entries.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrate();
