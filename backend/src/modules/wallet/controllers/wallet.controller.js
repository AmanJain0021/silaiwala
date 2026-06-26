const mongoose = require("mongoose");
const WalletTransaction = require("../../../models/WalletTransaction");
const WithdrawalRequest = require("../../../models/WithdrawalRequest");
const Tailor = require("../../../models/Tailor");
const Delivery = require("../../../models/Delivery");
const Customer = require("../../../models/Customer");
const MeasurementExecutive = require("../../../models/MeasurementExecutive");
const Settings = require("../../../models/Settings");
const User = require("../../../models/User");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");

/**
 * @desc    Get current user's wallet dashboard
 * @route   GET /api/v1/wallet/dashboard
 * @access  Private (Tailor/Delivery)
 */
exports.getWalletDashboard = asyncHandler(async (req, res, next) => {
  const { role, id } = req.user;
  
  let profile;
  if (role === "tailor") {
    profile = await Tailor.findOne({ user: id });
  } else if (role === "delivery") {
    profile = await Delivery.findOne({ user: id });
  } else if (role === "user" || role === "customer") {
    profile = await Customer.findOne({ user: id });
  } else if (role === "measurement_executive") {
    profile = await MeasurementExecutive.findOne({ user: id });
  }

  if (!profile) {
    return next(new ErrorResponse("Profile not found", 404));
  }

  // Get recent transactions
  const transactions = await WalletTransaction.find({ user: id })
    .sort("-createdAt")
    .limit(10)
    .populate("order", "orderId totalAmount")
    .populate("withdrawalRequest", "status transactionReference proofOfPayment");

  // Get pending withdrawals
  const withdrawals = await WithdrawalRequest.find({ user: id, status: "pending" });

  res.status(200).json({
    success: true,
    data: {
      balance: profile.walletBalance || 0,
      totalEarned: profile.totalEarned || 0, // Tailor might use different field, handled below if needed
      totalWithdrawn: profile.totalWithdrawn || 0,
      pendingWithdrawals: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      codWalletBalance: profile.codWalletBalance || 0,
      cashBlocked: profile.cashBlocked || false,
      recentTransactions: transactions
    }
  });
});

/**
 * @desc    Request a withdrawal
 * @route   POST /api/v1/wallet/withdraw
 * @access  Private (Tailor/Delivery)
 */
exports.requestWithdrawal = asyncHandler(async (req, res, next) => {
  const amount = parseFloat(req.body.amount);
  const { method, bankDetails } = req.body;
  const { role, id } = req.user;

  if (!amount || amount < 50) {
    return next(new ErrorResponse("Minimum withdrawal amount is ₹50", 400));
  }

  let profile;
  if (role === "tailor") {
    profile = await Tailor.findOne({ user: id });
  } else if (role === "delivery") {
    profile = await Delivery.findOne({ user: id });
  } else if (role === "user" || role === "customer") {
    profile = await Customer.findOne({ user: id });
  } else if (role === "measurement_executive") {
    profile = await MeasurementExecutive.findOne({ user: id });
  }

  if (!profile) {
    return next(new ErrorResponse("Profile not found", 404));
  }

  if (profile.walletBalance < amount) {
    return next(new ErrorResponse("Insufficient wallet balance", 400));
  }

  // Create Request first to validate schema constraints before deducting
  const withdrawal = await WithdrawalRequest.create({
    user: id,
    role: role,
    amount: amount,
    method: method || "upi",
    status: "pending",
    bankDetails: bankDetails || profile.bankDetails
  });

  // Deduct from wallet immediately only after successful creation
  profile.walletBalance -= amount;
  await profile.save();

  // Log transaction
  await WalletTransaction.create({
    user: id,
    amount: amount,
    type: "debit",
    category: "withdrawal",
    withdrawalRequest: withdrawal._id,
    description: "Withdrawal request initiated"
  });

  // Notify Admins
  const adminUsers = await User.find({ role: 'admin' });
  for (const adminUser of adminUsers) {
    await sendNotification({
      recipient: adminUser._id,
      type: "WITHDRAWAL_REQUESTED",
      title: "New Withdrawal Request",
      message: `A new withdrawal of ₹${amount} was requested by a ${role}.`,
      data: { targetUrl: '/admin/finance' }
    });
  }

  res.status(200).json({
    success: true,
    message: "Withdrawal requested successfully",
    data: withdrawal
  });
});

/**
 * @desc    Get all withdrawal requests (Admin)
 * @route   GET /api/v1/wallet/admin/withdrawals
 * @access  Private (Admin)
 */
exports.getAllWithdrawals = asyncHandler(async (req, res, next) => {
  const { status, role } = req.query;
  const query = {};

  if (status) query.status = status;
  if (role) query.role = role;

  const withdrawals = await WithdrawalRequest.find(query)
    .populate("user", "name email phoneNumber")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: withdrawals.length,
    data: withdrawals
  });
});

/**
 * @desc    Update withdrawal status (Admin)
 * @route   PATCH /api/v1/wallet/admin/withdrawals/:id
 * @access  Private (Admin)
 */
exports.updateWithdrawalStatus = asyncHandler(async (req, res, next) => {
  const { status, transactionReference, adminNotes, proofOfPayment } = req.body;
  
  const withdrawal = await WithdrawalRequest.findById(req.params.id);
  if (!withdrawal) {
    return next(new ErrorResponse("Withdrawal request not found", 404));
  }

  if (withdrawal.status === "paid" || withdrawal.status === "rejected") {
    return next(new ErrorResponse(`Cannot update a ${withdrawal.status} request`, 400));
  }

  withdrawal.status = status;
  if (adminNotes) withdrawal.adminNotes = adminNotes;
  if (transactionReference) withdrawal.transactionReference = transactionReference;
  if (proofOfPayment) withdrawal.proofOfPayment = proofOfPayment;

  if (status === "paid") {
    withdrawal.paidAt = new Date();
    // Update total withdrawn in profile
    let profile;
    if (withdrawal.role === "tailor") {
      profile = await Tailor.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "delivery") {
      profile = await Delivery.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "user" || withdrawal.role === "customer") {
      profile = await Customer.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "measurement_executive") {
      profile = await MeasurementExecutive.findOne({ user: withdrawal.user });
    }
    if (profile) {
      profile.totalWithdrawn = (profile.totalWithdrawn || 0) + withdrawal.amount;
      await profile.save();
    }
  } else if (status === "rejected") {
    // Refund to wallet
    let profile;
    if (withdrawal.role === "tailor") {
      profile = await Tailor.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "delivery") {
      profile = await Delivery.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "user" || withdrawal.role === "customer") {
      profile = await Customer.findOne({ user: withdrawal.user });
    } else if (withdrawal.role === "measurement_executive") {
      profile = await MeasurementExecutive.findOne({ user: withdrawal.user });
    }
    if (profile) {
      profile.walletBalance += withdrawal.amount;
      await profile.save();
      // Log refund
      await WalletTransaction.create({
        user: withdrawal.user,
        amount: withdrawal.amount,
        type: "credit",
        category: "withdrawal",
        withdrawalRequest: withdrawal._id,
        description: "Withdrawal request rejected - Refunded to wallet"
      });
    }

    await sendNotification({
      recipient: withdrawal.user,
      type: "WITHDRAWAL_REJECTED",
      title: "Withdrawal Rejected",
      message: `Your withdrawal request of ₹${withdrawal.amount} has been rejected. The amount has been refunded to your wallet.`,
    });
  } else if (status === "approved") {
    withdrawal.approvedAt = new Date();

    await sendNotification({
      recipient: withdrawal.user,
      type: "WITHDRAWAL_APPROVED",
      title: "Withdrawal Approved",
      message: `Your withdrawal request of ₹${withdrawal.amount} has been approved and is being processed.`,
    });
  }

  await withdrawal.save();

  if (status === "paid") {
    await sendNotification({
      recipient: withdrawal.user,
      type: "WITHDRAWAL_PAID",
      title: "Payout Completed",
      message: `Your withdrawal of ₹${withdrawal.amount} has been successfully transferred to your account.`,
    });
  }

  res.status(200).json({
    success: true,
    data: withdrawal
  });
});
