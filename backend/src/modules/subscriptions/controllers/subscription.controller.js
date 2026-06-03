const SubscriptionPlan = require("../../../models/SubscriptionPlan");
const Tailor = require("../../../models/Tailor");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * @desc    Get all subscription plans
 * @route   GET /api/v1/subscriptions
 * @access  Public or Authenticated
 */
exports.getPlans = asyncHandler(async (req, res, next) => {
  const plans = await SubscriptionPlan.find().sort({ price: 1 });

  res.status(200).json({
    success: true,
    data: plans,
  });
});

/**
 * @desc    Subscribe to a plan
 * @route   POST /api/v1/subscriptions/subscribe
 * @access  Private (Tailor only)
 */
exports.subscribe = asyncHandler(async (req, res, next) => {
  const { planId } = req.body;

  if (req.user.role !== "tailor") {
    return next(new ErrorResponse("Not authorized to access this route", 403));
  }

  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return next(new ErrorResponse("Subscription plan not found", 404));
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
