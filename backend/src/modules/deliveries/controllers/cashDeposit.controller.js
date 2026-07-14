const CashDeposit = require("../../../models/CashDeposit.js");
const Delivery = require("../../../models/Delivery.js");
const Settings = require("../../../models/Settings.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const mongoose = require("mongoose");
const Notification = require("../../../models/Notification.js");
const { getIO } = require("../../../config/socket.js");
const razorpay = require("../../../config/razorpay.js");
const crypto = require("crypto");

/**
 * @desc    Request a COD cash deposit
 * @route   POST /api/v1/deliveries/cod-deposit/request
 * @access  Private (Delivery)
 */
exports.requestCashDeposit = asyncHandler(async (req, res, next) => {
  const { amount, remarks } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorResponse("Please provide a valid deposit amount.", 400));
  }

  const deliveryProfile = await Delivery.findOne({ user: req.user.id });
  if (!deliveryProfile) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  if (amount > deliveryProfile.codWalletBalance) {
    return next(new ErrorResponse("Deposit amount cannot exceed your COD Wallet balance.", 400));
  }

  const deposit = await CashDeposit.create({
    deliveryPartner: deliveryProfile._id,
    amount,
    remarks,
    status: "pending",
  });

  // Notify admin
  getIO().to("admin_room").emit("new_cash_deposit_request", { deposit });

  res.status(201).json({
    success: true,
    data: deposit,
    message: "Cash deposit request submitted successfully."
  });
});

/**
 * @desc    Get COD deposit history for Delivery Partner
 * @route   GET /api/v1/deliveries/cod-deposit/history
 * @access  Private (Delivery)
 */
exports.getMyDepositHistory = asyncHandler(async (req, res, next) => {
  const deliveryProfile = await Delivery.findOne({ user: req.user.id });
  if (!deliveryProfile) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  const history = await CashDeposit.find({ deliveryPartner: deliveryProfile._id })
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * @desc    Initialize Razorpay payment for COD Deposit
 * @route   POST /api/v1/deliveries/cod-deposit/razorpay/create
 * @access  Private (Delivery)
 */
exports.createRazorpayDepositOrder = asyncHandler(async (req, res, next) => {
  const { amount, remarks } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorResponse("Please provide a valid deposit amount.", 400));
  }

  const deliveryProfile = await Delivery.findOne({ user: req.user.id });
  if (!deliveryProfile) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  if (amount > deliveryProfile.codWalletBalance) {
    return next(new ErrorResponse("Deposit amount cannot exceed your COD Wallet balance.", 400));
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `deposit_${deliveryProfile._id}_${Date.now()}`.substring(0, 40),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const deposit = await CashDeposit.create({
      deliveryPartner: deliveryProfile._id,
      amount,
      remarks,
      status: "pending",
      paymentMethod: "online",
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(200).json({
      success: true,
      data: razorpayOrder,
      depositId: deposit._id
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return next(new ErrorResponse("Razorpay order creation failed", 500));
  }
});

/**
 * @desc    Verify Razorpay payment for COD Deposit
 * @route   POST /api/v1/deliveries/cod-deposit/razorpay/verify
 * @access  Private (Delivery)
 */
exports.verifyRazorpayDeposit = asyncHandler(async (req, res, next) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    depositId
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature !== expectedSign) {
    return next(new ErrorResponse("Invalid payment signature", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deposit = await CashDeposit.findById(depositId).session(session);
    if (!deposit) {
      throw new ErrorResponse("Deposit record not found", 404);
    }

    if (deposit.status !== "pending") {
      throw new ErrorResponse("Deposit already processed", 400);
    }

    deposit.status = "approved";
    deposit.razorpayPaymentId = razorpay_payment_id;
    deposit.razorpaySignature = razorpay_signature;

    await deposit.save({ session });

    const deliveryProfile = await Delivery.findById(deposit.deliveryPartner).session(session);
    deliveryProfile.codWalletBalance = Math.max(0, deliveryProfile.codWalletBalance - deposit.amount);

    const settings = await Settings.getSettings();
    const limit = settings.codWalletConfig?.maxCashLimit || 5000;
    const autoBlock = settings.codWalletConfig?.autoBlockOnLimit !== false;

    if (deliveryProfile.codWalletBalance < limit || !autoBlock) {
      deliveryProfile.cashBlocked = false;
    }

    await deliveryProfile.save({ session });

    await Notification.create([{
      recipient: deliveryProfile.user,
      title: "Online Deposit Successful ✅",
      message: `Your online deposit of ₹${deposit.amount} was successful.`,
      type: "PAYMENT_SUCCESS",
    }], { session });

    await session.commitTransaction();

    getIO().to(`user_${deliveryProfile.user}`).emit("cod_wallet_update", {
      codWalletBalance: deliveryProfile.codWalletBalance,
      cashBlocked: deliveryProfile.cashBlocked
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: deposit
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Get all COD deposit history (Admin)
 * @route   GET /api/v1/admin/deliveries/cod-deposit
 * @access  Private (Admin)
 */
exports.getAllDepositHistory = asyncHandler(async (req, res, next) => {
  const history = await CashDeposit.find()
    .populate({
      path: "deliveryPartner",
      populate: { path: "user", select: "name email phoneNumber profileImage" }
    })
    .populate({
      path: "tailor",
      populate: { path: "user", select: "name email phoneNumber profileImage" }
    })
    .populate("verifiedBy", "name email")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * @desc    Approve/Reject COD deposit (Admin)
 * @route   POST /api/v1/admin/deliveries/cod-deposit/:id/status
 * @access  Private (Admin)
 */
exports.updateDepositStatus = asyncHandler(async (req, res, next) => {
  const { status, remarks } = req.body;
  const depositId = req.params.id;

  if (!["approved", "rejected"].includes(status)) {
    return next(new ErrorResponse("Invalid status", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deposit = await CashDeposit.findById(depositId).session(session);
    if (!deposit) {
      throw new ErrorResponse("Deposit request not found", 404);
    }

    if (deposit.status !== "pending") {
      throw new ErrorResponse("This request has already been processed.", 400);
    }

    deposit.status = status;
    deposit.verifiedBy = req.user.id;
    if (remarks) deposit.remarks = remarks;

    await deposit.save({ session });

    let profile = null;
    let userId = null;
    if (deposit.deliveryPartner) {
      profile = await Delivery.findById(deposit.deliveryPartner).session(session);
      userId = profile?.user;
    } else if (deposit.tailor) {
      const Tailor = require("../../../models/Tailor.js");
      profile = await Tailor.findById(deposit.tailor).session(session);
      userId = profile?.user;
    }

    if (status === "approved" && profile) {
      profile.codWalletBalance = Math.max(0, profile.codWalletBalance - deposit.amount);
      
      const settings = await Settings.getSettings();
      const limit = settings.codWalletConfig?.maxCashLimit || 5000;
      const autoBlock = settings.codWalletConfig?.autoBlockOnLimit !== false;

      // Unblock if they are now under the limit
      if (profile.codWalletBalance < limit || !autoBlock) {
        profile.cashBlocked = false;
      }

      await profile.save({ session });

      await Notification.create([{
        recipient: userId,
        title: "Cash Deposit Approved ✅",
        message: `Your cash deposit of ₹${deposit.amount} has been verified and approved.`,
        type: "SYSTEM_NOTICE",
      }], { session });

    } else if (profile) {
      await Notification.create([{
        recipient: userId,
        title: "Cash Deposit Rejected ❌",
        message: `Your cash deposit of ₹${deposit.amount} was rejected. Remarks: ${remarks || 'None'}`,
        type: "SYSTEM_NOTICE",
      }], { session });
    }

    await session.commitTransaction();
    
    if (userId && profile) {
      getIO().to(`user_${userId}`).emit("cod_wallet_update", {
        codWalletBalance: profile.codWalletBalance,
        cashBlocked: profile.cashBlocked
      });
    }

    res.status(200).json({
      success: true,
      data: deposit,
      message: `Deposit ${status} successfully.`
    });

  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Update COD Wallet Settings (Admin)
 * @route   PATCH /api/v1/admin/settings/cod-wallet
 * @access  Private (Admin)
 */
exports.updateCodSettings = asyncHandler(async (req, res, next) => {
  const { maxCashLimit, maxDepositTimeHours, autoBlockOnLimit } = req.body;
  
  let settings = await Settings.getSettings();
  
  if (!settings.codWalletConfig) {
      settings.codWalletConfig = {};
  }
  
  if (maxCashLimit !== undefined) settings.codWalletConfig.maxCashLimit = maxCashLimit;
  if (maxDepositTimeHours !== undefined) settings.codWalletConfig.maxDepositTimeHours = maxDepositTimeHours;
  if (autoBlockOnLimit !== undefined) settings.codWalletConfig.autoBlockOnLimit = autoBlockOnLimit;
  
  await settings.save();
  
  res.status(200).json({
      success: true,
      data: settings,
      message: "COD Wallet settings updated successfully"
  });
});

/**
 * @desc    Request a COD cash deposit (Tailor)
 * @route   POST /api/v1/tailors/cod-deposit/request
 * @access  Private (Tailor)
 */
exports.requestTailorCashDeposit = asyncHandler(async (req, res, next) => {
  const { amount, remarks } = req.body;
  const Tailor = require("../../../models/Tailor.js");

  if (!amount || amount <= 0) {
    return next(new ErrorResponse("Please provide a valid deposit amount.", 400));
  }

  const tailorProfile = await Tailor.findOne({ user: req.user.id });
  if (!tailorProfile) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  if (amount > tailorProfile.codWalletBalance) {
    return next(new ErrorResponse("Deposit amount cannot exceed your COD Wallet balance.", 400));
  }

  const deposit = await CashDeposit.create({
    tailor: tailorProfile._id,
    amount,
    remarks,
    status: "pending",
  });

  // Notify admin
  getIO().to("admin_room").emit("new_cash_deposit_request", { deposit });

  res.status(201).json({
    success: true,
    data: deposit,
    message: "Cash deposit request submitted successfully."
  });
});

/**
 * @desc    Get COD deposit history for Tailor
 * @route   GET /api/v1/tailors/cod-deposit/history
 * @access  Private (Tailor)
 */
exports.getTailorDepositHistory = asyncHandler(async (req, res, next) => {
  const Tailor = require("../../../models/Tailor.js");
  const tailorProfile = await Tailor.findOne({ user: req.user.id });
  if (!tailorProfile) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const history = await CashDeposit.find({ tailor: tailorProfile._id })
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: history,
  });
});

/**
 * @desc    Initialize Razorpay payment for COD Deposit (Tailor)
 * @route   POST /api/v1/tailors/cod-deposit/razorpay/create
 * @access  Private (Tailor)
 */
exports.createTailorRazorpayDepositOrder = asyncHandler(async (req, res, next) => {
  const { amount, remarks } = req.body;
  const Tailor = require("../../../models/Tailor.js");

  if (!amount || amount <= 0) {
    return next(new ErrorResponse("Please provide a valid deposit amount.", 400));
  }

  const tailorProfile = await Tailor.findOne({ user: req.user.id });
  if (!tailorProfile) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  if (amount > tailorProfile.codWalletBalance) {
    return next(new ErrorResponse("Deposit amount cannot exceed your COD Wallet balance.", 400));
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `dep_tailor_${tailorProfile._id}_${Date.now()}`.substring(0, 40),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const deposit = await CashDeposit.create({
      tailor: tailorProfile._id,
      amount,
      remarks,
      status: "pending",
      paymentMethod: "online",
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(200).json({
      success: true,
      data: razorpayOrder,
      depositId: deposit._id
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return next(new ErrorResponse("Razorpay order creation failed", 500));
  }
});

/**
 * @desc    Verify Razorpay payment for COD Deposit (Tailor)
 * @route   POST /api/v1/tailors/cod-deposit/razorpay/verify
 * @access  Private (Tailor)
 */
exports.verifyTailorRazorpayDeposit = asyncHandler(async (req, res, next) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    depositId
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature !== expectedSign) {
    return next(new ErrorResponse("Invalid payment signature", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deposit = await CashDeposit.findById(depositId).session(session);
    if (!deposit) {
      throw new ErrorResponse("Deposit record not found", 404);
    }

    if (deposit.status !== "pending") {
      throw new ErrorResponse("Deposit already processed", 400);
    }

    deposit.status = "approved";
    deposit.razorpayPaymentId = razorpay_payment_id;
    deposit.razorpaySignature = razorpay_signature;

    await deposit.save({ session });

    const Tailor = require("../../../models/Tailor.js");
    const tailorProfile = await Tailor.findById(deposit.tailor).session(session);
    tailorProfile.codWalletBalance = Math.max(0, tailorProfile.codWalletBalance - deposit.amount);

    const settings = await Settings.getSettings();
    const limit = settings.codWalletConfig?.maxCashLimit || 5000;
    const autoBlock = settings.codWalletConfig?.autoBlockOnLimit !== false;

    if (tailorProfile.codWalletBalance < limit || !autoBlock) {
      tailorProfile.cashBlocked = false;
    }

    await tailorProfile.save({ session });

    await Notification.create([{
      recipient: tailorProfile.user,
      title: "Online Deposit Successful ✅",
      message: `Your online deposit of ₹${deposit.amount} was successful.`,
      type: "PAYMENT_SUCCESS",
    }], { session });

    await session.commitTransaction();

    getIO().to(`user_${tailorProfile.user}`).emit("cod_wallet_update", {
      codWalletBalance: tailorProfile.codWalletBalance,
      cashBlocked: tailorProfile.cashBlocked
    });

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: deposit
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

