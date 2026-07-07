const SubscriptionPlan = require("../../../models/SubscriptionPlan");
const Tailor = require("../../../models/Tailor");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const razorpay = require("../../../config/razorpay");
const crypto = require("crypto");

/**
 * @desc    Get all subscription plans
 * @route   GET /api/v1/subscriptions
 * @access  Public or Authenticated
 */
exports.getPlans = asyncHandler(async (req, res, next) => {
  // Use $ne: false so that older documents without the isActive field are also returned
  const plans = await SubscriptionPlan.find({ isActive: { $ne: false } }).sort({ sortOrder: 1, price: 1 });

  res.status(200).json({
    success: true,
    data: plans,
  });
});

/**
 * @desc    Create a razorpay order for subscription
 * @route   POST /api/v1/subscriptions/create-order
 * @access  Private (Tailor only)
 */
exports.createSubscriptionOrder = asyncHandler(async (req, res, next) => {
  const { planId } = req.body;
  
  if (req.user.role !== "tailor") {
    return next(new ErrorResponse("Not authorized to access this route", 403));
  }
  
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return next(new ErrorResponse("Subscription plan not found", 404));
  }
  
  if (plan.price <= 0) {
    return next(new ErrorResponse("Plan price is zero, directly subscribe instead", 400));
  }

  const options = {
    amount: Math.round(plan.price * 100), // amount in paise
    currency: "INR",
    receipt: `sub_${crypto.randomBytes(5).toString("hex")}`,
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        planId: plan._id
      }
    });
  } catch (error) {
    console.error("Razorpay Error:", error);
    return next(new ErrorResponse("Razorpay order creation failed", 500));
  }
});

/**
 * @desc    Subscribe to a plan
 * @route   POST /api/v1/subscriptions/subscribe
 * @access  Private (Tailor only)
 */
exports.subscribe = asyncHandler(async (req, res, next) => {
  const { planId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (req.user.role !== "tailor") {
    return next(new ErrorResponse("Not authorized to access this route", 403));
  }

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return next(new ErrorResponse("Subscription plan not found", 404));
  }

  if (plan.price > 0) {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(new ErrorResponse("Payment details are required for this plan", 400));
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return next(new ErrorResponse("Invalid payment signature", 400));
    }
  }

  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  // Calculate expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  tailor.activePlan = plan._id;
  tailor.planExpiryDate = expiryDate;
  if (plan.commissionPercentage !== undefined) {
    tailor.commissionPercentage = plan.commissionPercentage;
  }
  
  await tailor.save();

  res.status(200).json({
    success: true,
    message: "Successfully subscribed to plan",
    data: {
      activePlan: plan,
      planExpiryDate: expiryDate
    }
  });
});

/**
 * @desc    Get all subscription plans (Admin)
 * @route   GET /api/v1/subscriptions/admin
 * @access  Private (Admin only)
 */
exports.getAllPlansAdmin = asyncHandler(async (req, res, next) => {
  const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, price: 1 });

  res.status(200).json({
    success: true,
    data: plans,
  });
});

/**
 * @desc    Create a subscription plan (Admin)
 * @route   POST /api/v1/subscriptions/admin
 * @access  Private (Admin only)
 */
exports.createPlan = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.create(req.body);

  res.status(201).json({
    success: true,
    data: plan,
  });
});

/**
 * @desc    Update a subscription plan (Admin)
 * @route   PUT /api/v1/subscriptions/admin/:id
 * @access  Private (Admin only)
 */
exports.updatePlan = asyncHandler(async (req, res, next) => {
  let plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404));
  }

  plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: plan,
  });
});

/**
 * @desc    Delete a subscription plan (Admin)
 * @route   DELETE /api/v1/subscriptions/admin/:id
 * @access  Private (Admin only)
 */
exports.deletePlan = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404));
  }

  // Check if tailors are subscribed to this plan
  const subscribedTailorsCount = await Tailor.countDocuments({ activePlan: req.params.id });
  if (subscribedTailorsCount > 0) {
    return next(
      new ErrorResponse(
        `Cannot delete plan. ${subscribedTailorsCount} tailors are currently subscribed to it. Please disable it instead.`,
        400
      )
    );
  }

  await plan.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Toggle subscription plan status (Admin)
 * @route   PATCH /api/v1/subscriptions/admin/:id/toggle
 * @access  Private (Admin only)
 */
exports.togglePlanStatus = asyncHandler(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);

  if (!plan) {
    return next(new ErrorResponse(`Plan not found with id of ${req.params.id}`, 404));
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  res.status(200).json({
    success: true,
    data: plan,
    message: `Plan successfully ${plan.isActive ? 'enabled' : 'disabled'}`,
  });
});
