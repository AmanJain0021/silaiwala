const mongoose = require("mongoose");
const Order = require("../../../models/Order");
const User = require("../../../models/User");
const Tailor = require("../../../models/Tailor");
const Delivery = require("../../../models/Delivery");
const WalletTransaction = require("../../../models/WalletTransaction");
const WithdrawalRequest = require("../../../models/WithdrawalRequest");
const PaymentLedger = require("../../../models/PaymentLedger");
const Settings = require("../../../models/Settings");

// ─── FINANCE DASHBOARD ──────────────────────────────────────────────────────

/**
 * @desc    Get comprehensive finance dashboard stats
 * @route   GET /api/v1/admin/finance/dashboard
 * @access  Private (Admin)
 */
exports.getFinanceDashboard = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const gstPercentage = settings?.pricing?.gstPercentage || 5;

    // Aggregation: All paid orders
    const orderAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalGST: { $sum: "$gstAmount" },
          totalDeliveryFees: { $sum: "$deliveryFee" },
          totalPlatformFees: { $sum: "$platformFee" },
          totalTailorEarnings: { $sum: "$tailorEarning" },
          totalDeliveryEarnings: { $sum: "$deliveryPartnerEarning" },
          totalNetPlatformEarnings: { $sum: "$netPlatformEarning" },
          totalDiscounts: { $sum: "$discountAmount" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    const stats = orderAgg[0] || {
      totalRevenue: 0,
      totalGST: 0,
      totalDeliveryFees: 0,
      totalPlatformFees: 0,
      totalTailorEarnings: 0,
      totalDeliveryEarnings: 0,
      totalNetPlatformEarnings: 0,
      totalDiscounts: 0,
      orderCount: 0,
    };

    // Withdrawal stats
    const withdrawalAgg = await WithdrawalRequest.aggregate([
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const withdrawalStats = {};
    withdrawalAgg.forEach((w) => {
      withdrawalStats[w._id] = { total: w.total, count: w.count };
    });

    // Revenue trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueTrend = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          gst: { $sum: "$gstAmount" },
          platformFee: { $sum: "$platformFee" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Withdrawal trend (last 30 days)
    const withdrawalTrend = await WithdrawalRequest.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill 30-day range for trends
    const filledRevenueTrend = [];
    const filledWithdrawalTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const revMatch = revenueTrend.find((t) => t._id === dateStr);
      filledRevenueTrend.push({
        date: dateStr,
        name: dayNames[d.getDay()],
        revenue: revMatch ? revMatch.revenue : 0,
        gst: revMatch ? revMatch.gst : 0,
        platformFee: revMatch ? revMatch.platformFee : 0,
        orders: revMatch ? revMatch.orders : 0,
      });

      const wMatch = withdrawalTrend.find((t) => t._id === dateStr);
      filledWithdrawalTrend.push({
        date: dateStr,
        name: dayNames[d.getDay()],
        amount: wMatch ? wMatch.amount : 0,
        count: wMatch ? wMatch.count : 0,
      });
    }

    // Recent Wallet Transactions
    const recentTransactions = await WalletTransaction.find()
      .populate("user", "name role")
      .populate("order", "orderId")
      .sort("-createdAt")
      .limit(5);

    // Recent Partial Payments
    const recentPartialPayments = await Order.find({
      advancePaymentStatus: "paid",
      remainingPaymentStatus: { $ne: "paid" }
    })
      .populate("customer", "name")
      .sort("-createdAt")
      .limit(5);

    // Most Recent Fully Paid Order Breakdown
    const recentPaidOrder = await Order.findOne({ paymentStatus: "paid" })
      .populate("customer", "name")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: stats.totalRevenue,
          totalOrdersRevenue:
            stats.totalRevenue - stats.totalGST - stats.totalDeliveryFees,
          totalGSTCollected: stats.totalGST,
          totalDeliveryCharges: stats.totalDeliveryFees,
          totalPlatformCommission: stats.totalPlatformFees,
          totalTailorEarnings: stats.totalTailorEarnings,
          totalDeliveryEarnings: stats.totalDeliveryEarnings,
          totalDiscounts: stats.totalDiscounts,
          netPlatformEarnings: stats.totalNetPlatformEarnings,
          totalWithdrawalsPaid: withdrawalStats.paid?.total || 0,
          pendingWithdrawals: withdrawalStats.pending?.total || 0,
          approvedWithdrawals: withdrawalStats.approved?.total || 0,
          rejectedWithdrawals: withdrawalStats.rejected?.total || 0,
          totalOrders: stats.orderCount,
          gstPercentage,
        },
        trends: {
          revenue: filledRevenueTrend,
          withdrawals: filledWithdrawalTrend,
        },
        recentTransactions,
        recentPartialPayments,
        recentPaidOrder,
      },
    });
  } catch (error) {
    console.error("Error in getFinanceDashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── FINANCIAL STATS (Rewritten) ────────────────────────────────────────────

/**
 * @desc    Get financial stats (backward compatible, but using real data)
 * @route   GET /api/v1/admin/finance/stats
 * @access  Private (Admin)
 */
exports.getFinancialStats = async (req, res) => {
  try {
    const orderAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalPlatformFees: { $sum: "$platformFee" },
          totalGST: { $sum: "$gstAmount" },
          totalDeliveryFees: { $sum: "$deliveryFee" },
          totalTailorEarnings: { $sum: "$tailorEarning" },
          totalDeliveryEarnings: { $sum: "$deliveryPartnerEarning" },
          netPlatformEarnings: { $sum: "$netPlatformEarning" },
        },
      },
    ]);

    const stats = orderAgg[0] || {
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalGST: 0,
      totalDeliveryFees: 0,
      totalTailorEarnings: 0,
      totalDeliveryEarnings: 0,
      netPlatformEarnings: 0,
    };

    // Pending payouts from WithdrawalRequest
    const pendingAgg = await WithdrawalRequest.aggregate([
      { $match: { status: { $in: ["pending", "approved"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingPayouts = pendingAgg[0]?.total || 0;

    // Refunds
    const refundAgg = await Order.aggregate([
      { $match: { paymentStatus: "refunded" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const refundsProcessed = refundAgg[0]?.total || 0;

    // Weekly Revenue Trend (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendData = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formattedTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = days[d.getDay()];
      const match = trendData.find((t) => t._id === dateStr);
      formattedTrend.push({
        name: dayName,
        revenue: match ? match.revenue : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: stats.totalRevenue,
        platformCommission: stats.totalPlatformFees,
        totalGSTCollected: stats.totalGST,
        totalDeliveryCharges: stats.totalDeliveryFees,
        totalTailorEarnings: stats.totalTailorEarnings,
        totalDeliveryEarnings: stats.totalDeliveryEarnings,
        netPlatformEarnings: stats.netPlatformEarnings,
        pendingPayouts,
        refundsProcessed,
        revenueTrend: formattedTrend,
      },
    });
  } catch (error) {
    console.error("Error in getFinancialStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TRANSACTIONS (Rewritten) ───────────────────────────────────────────────

/**
 * @desc    Get transaction history with full breakdown
 * @route   GET /api/v1/admin/finance/transactions
 * @access  Private (Admin)
 */
exports.getTransactions = async (req, res) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      customer,
      tailor,
      deliveryPartner,
      page = 1,
      limit = 50,
    } = req.query;

    let query = {};

    // Only show orders that have had a payment event
    if (status) {
      query.paymentStatus = status;
    } else {
      query.paymentStatus = { $in: ["paid", "refunded"] };
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { paymentId: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (customer) query.customer = customer;
    if (tailor) query.tailor = tailor;
    if (deliveryPartner) query.deliveryPartner = deliveryPartner;

    const skip = (page - 1) * limit;

    const transactions = await Order.find(query)
      .populate("customer", "name email phoneNumber")
      .populate("tailor", "name")
      .populate("deliveryPartner", "name")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    const data = transactions.map((t) => ({
      _id: t._id,
      transactionId: t.transactionId || "TXN-" + t._id.toString().slice(-8).toUpperCase(),
      orderId: t.orderId,
      date: t.paidAt || t.createdAt,
      customer: t.customer?.name || "Guest",
      customerEmail: t.customer?.email || "",
      tailor: t.tailor?.name || "N/A",
      deliveryPartner: t.deliveryPartner?.name || "N/A",
      paymentType: t.advancePaymentStatus === "paid" && t.remainingPaymentStatus === "paid"
        ? "Split (Advance + Remaining)"
        : t.advancePaymentStatus === "paid"
        ? "Advance"
        : "Full",
      // Amounts
      orderAmount: t.totalAmount - (t.gstAmount || 0) - (t.deliveryFee || 0),
      totalAmount: t.totalAmount,
      gstAmount: t.gstAmount || 0,
      deliveryFee: t.deliveryFee || 0,
      platformFee: t.platformFee || 0,
      discountAmount: t.discountAmount || 0,
      tailorShare: t.tailorEarning || 0,
      deliveryShare: t.deliveryPartnerEarning || 0,
      netPlatformEarning: t.netPlatformEarning || 0,
      // Payment info
      paymentMethod: t.razorpayOrderId ? "Online (Razorpay)" : "Cash",
      paymentId: t.paymentId || t.advancePaymentId || "",
      status: t.paymentStatus === "paid" ? "Completed" : t.paymentStatus === "refunded" ? "Refunded" : t.paymentStatus,
      type: t.paymentStatus === "paid" ? "Credit" : "Debit",
      // Advance/Remaining breakdown
      advanceAmount: t.advancePaymentAmount || 0,
      advanceStatus: t.advancePaymentStatus || "N/A",
      remainingAmount: t.remainingPaymentAmount || 0,
      remainingStatus: t.remainingPaymentStatus || "N/A",
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (error) {
    console.error("Error in getTransactions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── ORDER FINANCIALS ───────────────────────────────────────────────────────

/**
 * @desc    Get detailed financial breakdown for a single order
 * @route   GET /api/v1/admin/finance/orders/:id
 * @access  Private (Admin)
 */
exports.getOrderFinancials = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phoneNumber")
      .populate("tailor", "name email phoneNumber")
      .populate("deliveryPartner", "name email phoneNumber")
      .populate("pickupPartner", "name")
      .populate("dropoffPartner", "name");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Get wallet transactions for this order
    const walletTransactions = await WalletTransaction.find({ order: order._id })
      .populate("user", "name role")
      .sort("-createdAt");

    // Get payment ledger entries
    const ledgerEntries = await PaymentLedger.find({ order: order._id })
      .sort("-createdAt");

    // Get withdrawal requests linked to the tailor/delivery partner
    let tailorWithdrawals = [];
    let deliveryWithdrawals = [];

    if (order.tailor) {
      tailorWithdrawals = await WithdrawalRequest.find({
        user: order.tailor._id || order.tailor,
        role: "tailor",
      })
        .sort("-createdAt")
        .limit(5);
    }

    if (order.deliveryPartner) {
      deliveryWithdrawals = await WithdrawalRequest.find({
        user: order.deliveryPartner._id || order.deliveryPartner,
        role: "delivery",
      })
        .sort("-createdAt")
        .limit(5);
    }

    const baseAmount = (order.totalAmount || 0) - (order.gstAmount || 0) - (order.deliveryFee || 0);

    res.status(200).json({
      success: true,
      data: {
        // Customer Info
        customer: {
          name: order.customer?.name,
          email: order.customer?.email,
          phone: order.customer?.phoneNumber,
        },
        // Order Info
        orderId: order.orderId,
        orderObjectId: order._id,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        deliveredAt: order.deliveredAt,

        // Amount Breakdown
        breakdown: {
          orderAmount: baseAmount,
          gstAmount: order.gstAmount || 0,
          gstPercentage: order.gstPercentage || 0,
          deliveryFee: order.deliveryFee || 0,
          platformFee: order.platformFee || 0,
          discountAmount: order.discountAmount || 0,
          couponCode: order.couponCode || null,
          totalAmount: order.totalAmount || 0,
        },

        // Distribution
        distribution: {
          tailorShare: order.tailorEarning || 0,
          deliveryPartnerShare: order.deliveryPartnerEarning || 0,
          platformRevenue: order.netPlatformEarning || 0,
        },

        // Payment Status
        payment: {
          overallStatus: order.paymentStatus,
          paymentId: order.paymentId,
          razorpayOrderId: order.razorpayOrderId,
          transactionId: order.transactionId,
          method: order.razorpayOrderId ? "Online (Razorpay)" : "Cash",
        },

        // Partial Payment Details
        partialPayment: {
          advanceAmount: order.advancePaymentAmount || 0,
          advanceStatus: order.advancePaymentStatus,
          advancePaymentId: order.advancePaymentId,
          remainingAmount: order.remainingPaymentAmount || 0,
          remainingStatus: order.remainingPaymentStatus,
          remainingPaymentId: order.remainingPaymentId,
          remainingPaymentMethod: order.remainingPaymentMethod,
        },

        // Tailor Info
        tailor: {
          name: order.tailor?.name,
          email: order.tailor?.email,
          phone: order.tailor?.phoneNumber,
        },

        // Delivery Partner Info
        deliveryPartner: {
          name: order.deliveryPartner?.name,
          email: order.deliveryPartner?.email,
          phone: order.deliveryPartner?.phoneNumber,
        },

        // Linked Transactions
        walletTransactions: walletTransactions.map((wt) => ({
          _id: wt._id,
          user: wt.user?.name,
          userRole: wt.user?.role,
          amount: wt.amount,
          type: wt.type,
          category: wt.category,
          status: wt.status,
          description: wt.description,
          date: wt.createdAt,
        })),

        // Payment Ledger
        ledgerEntries,

        // Withdrawal status
        withdrawals: {
          tailor: tailorWithdrawals,
          delivery: deliveryWithdrawals,
        },
      },
    });
  } catch (error) {
    console.error("Error in getOrderFinancials:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GST REPORT ─────────────────────────────────────────────────────────────

/**
 * @desc    Get GST report / ledger
 * @route   GET /api/v1/admin/finance/gst
 * @access  Private (Admin)
 */
exports.getGSTReport = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 50 } = req.query;

    let match = { paymentStatus: "paid", gstAmount: { $gt: 0 } };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    // Summary
    const summaryAgg = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      {
        $group: {
          _id: null,
          totalGST: { $sum: "$gstAmount" },
          totalTaxableAmount: {
            $sum: {
              $subtract: [
                "$totalAmount",
                { $add: [{ $ifNull: ["$gstAmount", 0] }, { $ifNull: ["$deliveryFee", 0] }] },
              ],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // This month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const thisMonthAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalGST: { $sum: "$gstAmount" },
        },
      },
    ]);

    // Last month
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const lastMonthAgg = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: lastMonthStart, $lt: monthStart },
        },
      },
      {
        $group: {
          _id: null,
          totalGST: { $sum: "$gstAmount" },
        },
      },
    ]);

    // Per-order GST data
    const orders = await Order.find(match)
      .select("orderId totalAmount gstAmount gstPercentage deliveryFee createdAt")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(match);

    const gstEntries = orders.map((o) => ({
      orderId: o.orderId,
      taxableAmount: (o.totalAmount || 0) - (o.gstAmount || 0) - (o.deliveryFee || 0),
      gstPercentage: o.gstPercentage || 0,
      gstAmount: o.gstAmount || 0,
      totalWithGST: o.totalAmount || 0,
      date: o.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalGSTCollected: summaryAgg[0]?.totalGST || 0,
          totalTaxableAmount: summaryAgg[0]?.totalTaxableAmount || 0,
          totalOrders: summaryAgg[0]?.orderCount || 0,
          thisMonthGST: thisMonthAgg[0]?.totalGST || 0,
          lastMonthGST: lastMonthAgg[0]?.totalGST || 0,
        },
        entries: gstEntries,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getGSTReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TAILOR EARNINGS ────────────────────────────────────────────────────────

/**
 * @desc    Get tailor earning tracking for admin
 * @route   GET /api/v1/admin/finance/tailor-earnings
 * @access  Private (Admin)
 */
exports.getTailorEarnings = async (req, res) => {
  try {
    const { tailorId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Get all tailor wallet transactions
    let txQuery = { category: { $in: ["order_earnings", "advance_payment"] }, type: "credit" };
    if (tailorId) txQuery.user = tailorId;

    const transactions = await WalletTransaction.find(txQuery)
      .populate("user", "name email phoneNumber role")
      .populate("order", "orderId totalAmount status")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await WalletTransaction.countDocuments(txQuery);

    // Filter to only tailor users
    const tailorTransactions = transactions.filter(
      (t) => t.user?.role === "tailor" || t.user?.role === "admin"
    );

    // Get summary per tailor
    const tailorSummary = await WalletTransaction.aggregate([
      {
        $match: {
          category: { $in: ["order_earnings", "advance_payment"] },
          type: "credit",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
      { $match: { "userDoc.role": "tailor" } },
      {
        $group: {
          _id: "$user",
          name: { $first: "$userDoc.name" },
          totalEarned: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalEarned: -1 } },
    ]);

    // Get withdrawal info per tailor
    const withdrawalSummary = await WithdrawalRequest.aggregate([
      { $match: { role: "tailor" } },
      {
        $group: {
          _id: { user: "$user", status: "$status" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions: tailorTransactions.map((t) => ({
          _id: t._id,
          tailorName: t.user?.name || "Unknown",
          tailorId: t.user?._id,
          orderId: t.order?.orderId || "N/A",
          orderObjectId: t.order?._id,
          amount: t.amount,
          category: t.category,
          status: t.status,
          description: t.description,
          creditDate: t.createdAt,
        })),
        tailorSummary,
        withdrawalSummary,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getTailorEarnings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELIVERY EARNINGS ──────────────────────────────────────────────────────

/**
 * @desc    Get delivery partner earning tracking for admin
 * @route   GET /api/v1/admin/finance/delivery-earnings
 * @access  Private (Admin)
 */
exports.getDeliveryEarnings = async (req, res) => {
  try {
    const { partnerId, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let txQuery = {
      category: { $in: ["order_earnings", "delivery_earnings"] },
      type: "credit",
    };
    if (partnerId) txQuery.user = partnerId;

    const transactions = await WalletTransaction.find(txQuery)
      .populate("user", "name email phoneNumber role")
      .populate("order", "orderId totalAmount deliveryFee deliveryDistance status")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await WalletTransaction.countDocuments(txQuery);

    // Filter to only delivery users
    const deliveryTransactions = transactions.filter(
      (t) => t.user?.role === "delivery"
    );

    // Get summary per delivery partner
    const deliverySummary = await WalletTransaction.aggregate([
      {
        $match: {
          category: { $in: ["order_earnings", "delivery_earnings"] },
          type: "credit",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: "$userDoc" },
      { $match: { "userDoc.role": "delivery" } },
      {
        $group: {
          _id: "$user",
          name: { $first: "$userDoc.name" },
          totalEarned: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalEarned: -1 } },
    ]);

    // Withdrawal info
    const withdrawalSummary = await WithdrawalRequest.aggregate([
      { $match: { role: "delivery" } },
      {
        $group: {
          _id: { user: "$user", status: "$status" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        transactions: deliveryTransactions.map((t) => ({
          _id: t._id,
          partnerName: t.user?.name || "Unknown",
          partnerId: t.user?._id,
          orderId: t.order?.orderId || "N/A",
          orderObjectId: t.order?._id,
          deliveryFee: t.order?.deliveryFee || 0,
          deliveryDistance: t.order?.deliveryDistance || 0,
          amount: t.amount,
          category: t.category,
          status: t.status,
          description: t.description,
          creditDate: t.createdAt,
        })),
        deliverySummary,
        withdrawalSummary,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getDeliveryEarnings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── WALLET AUDIT ───────────────────────────────────────────────────────────

/**
 * @desc    Get wallet distribution audit
 * @route   GET /api/v1/admin/finance/wallet-audit
 * @access  Private (Admin)
 */
exports.getWalletAudit = async (req, res) => {
  try {
    const { userId, type, category, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (userId) query.user = userId;
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await WalletTransaction.find(query)
      .populate("user", "name email role")
      .populate("order", "orderId totalAmount status")
      .populate("withdrawalRequest")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await WalletTransaction.countDocuments(query);

    // Summary
    const summaryAgg = await WalletTransaction.aggregate([
      { $match: query.user ? { user: new mongoose.Types.ObjectId(query.user) } : {} },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      totalCredits: 0,
      totalDebits: 0,
      creditCount: 0,
      debitCount: 0,
    };
    summaryAgg.forEach((s) => {
      if (s._id === "credit") {
        summary.totalCredits = s.total;
        summary.creditCount = s.count;
      } else if (s._id === "debit") {
        summary.totalDebits = s.total;
        summary.debitCount = s.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map((t) => ({
          _id: t._id,
          user: t.user?.name || "Unknown",
          userRole: t.user?.role || "N/A",
          userId: t.user?._id,
          orderId: t.order?.orderId || "N/A",
          orderObjectId: t.order?._id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          status: t.status,
          description: t.description,
          date: t.createdAt,
        })),
        summary,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getWalletAudit:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PAYMENT LEDGER ─────────────────────────────────────────────────────────

/**
 * @desc    Get payment ledger entries
 * @route   GET /api/v1/admin/finance/ledger
 * @access  Private (Admin)
 */
exports.getPaymentLedger = async (req, res) => {
  try {
    const { orderId, customer, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (orderId) query.orderId = { $regex: orderId, $options: "i" };
    if (customer) query.customer = customer;
    if (status) query.paymentStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const entries = await PaymentLedger.find(query)
      .populate("customer", "name email")
      .populate("tailor", "name")
      .populate("deliveryPartner", "name")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip(skip);

    const total = await PaymentLedger.countDocuments(query);

    res.status(200).json({
      success: true,
      data: entries,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in getPaymentLedger:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
