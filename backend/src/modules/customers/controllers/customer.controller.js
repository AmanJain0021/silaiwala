const User = require("../../../models/User");
const Customer = require("../../../models/Customer");
const Tailor = require("../../../models/Tailor");
const Product = require("../../../models/Product");
const Order = require("../../../models/Order");
const PromoCode = require("../../../models/PromoCode");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * @desc    Get current customer profile
 * @route   GET /api/v1/customers/profile
 * @access  Private (Customer)
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }
  
  let customerProfile = await Customer.findOne({ user: req.user.id }).lean();
  
  if (!customerProfile) {
    customerProfile = await Customer.create({ user: req.user.id });
    customerProfile = customerProfile.toJSON();
  }
  
  // Calculate Stats
  const [totalOrders, pendingOrders] = await Promise.all([
    Order.countDocuments({ customer: req.user.id }),
    Order.countDocuments({ customer: req.user.id, status: { $in: ["pending", "accepted", "in-progress"] } })
  ]);

  const referralsCount = await Customer.countDocuments({ referredBy: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      ...user.toJSON(),
      profile: customerProfile,
      stats: {
        totalOrders,
        pendingOrders,
        rewardPoints: customerProfile?.walletBalance || 0,
        savedAmount: customerProfile?.referralEarnings || 0,
        referredCount: customerProfile?.referredCount || 0
      }
    },
  });
});

/**
 * @desc    Update customer profile
 * @route   PATCH /api/v1/customers/profile
 * @access  Private (Customer)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, profileImage, addresses } = req.body;

  // Update User data
  if (name || profileImage) {
    await User.findByIdAndUpdate(req.user.id, { name, profileImage }, { new: true, runValidators: true });
  }

  // Update Customer Profile data
  if (addresses) {
    await Customer.findOneAndUpdate({ user: req.user.id }, { addresses }, { new: true });
  }

  const updatedUser = await User.findById(req.user.id);
  const updatedProfile = await Customer.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      ...updatedUser.toJSON(),
      profile: updatedProfile,
    },
  });
});

/**
 * @desc    Get nearby tailors
 * @route   GET /api/v1/customers/tailors
 * @access  Private (Customer)
 */
exports.getTailors = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 5000 } = req.query; // radius in meters

  let query = {};

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius),
      },
    };
  }

  const tailors = await Tailor.find(query)
    .populate("user", "name email profileImage")
    .populate("activePlan", "name sortOrder price isPopular theme")
    .lean();

  // Sort tailors: those with higher plan sortOrder come first.
  tailors.sort((a, b) => {
    const sortA = a.activePlan?.sortOrder || 0;
    const sortB = b.activePlan?.sortOrder || 0;
    return sortB - sortA;
  });

  res.status(200).json({
    success: true,
    count: tailors.length,
    data: tailors,
  });
});

/**
 * @desc    Toggle product in wishlist
 * @route   POST /api/v1/customers/wishlist/toggle
 * @access  Private (Customer)
 */
exports.wishlistToggle = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  let customer = await Customer.findOne({ user: req.user.id });
  if (!customer) {
    customer = await Customer.create({ user: req.user.id });
  }

  const isExists = customer.wishlist.includes(productId);

  if (isExists) {
    customer.wishlist = customer.wishlist.filter((id) => id.toString() !== productId);
  } else {
    customer.wishlist.push(productId);
  }

  await customer.save();

  res.status(200).json({
    success: true,
    data: customer.wishlist,
  });
});

/**
 * @desc    Get customer wishlist
 * @route   GET /api/v1/customers/wishlist
 * @access  Private (Customer)
 */
exports.getWishlist = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findOne({ user: req.user.id }).populate({
    path: "wishlist",
    populate: { path: "category", select: "name" },
  });

  if (!customer) {
    customer = await Customer.create({ user: req.user.id });
  }

  res.status(200).json({
    success: true,
    data: customer.wishlist,
  });
});

/**
 * @desc    Apply promo code
 * @route   POST /api/v1/customers/apply-promo
 * @access  Private (Customer)
 */
exports.applyPromoCode = asyncHandler(async (req, res, next) => {
  const { code, orderAmount } = req.body;

  const promo = await PromoCode.findOne({ code, isActive: true });

  if (!promo) {
    return next(new ErrorResponse("Invalid or expired promo code", 404));
  }

  // Check dates
  const now = new Date();
  if (promo.startDate > now || (promo.endDate && promo.endDate < now)) {
    return next(new ErrorResponse("Promo code is not active currently", 400));
  }

  // Check usage limit
  if (promo.usedCount >= promo.usageLimit) {
    return next(new ErrorResponse("Promo code usage limit reached", 400));
  }

  // Check minimum order amount
  if (orderAmount < promo.minOrderAmount) {
    return next(new ErrorResponse(`Minimum order amount of ${promo.minOrderAmount} required`, 400));
  }

  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = (orderAmount * promo.discountValue) / 100;
    if (promo.maxDiscountAmount && discount > promo.maxDiscountAmount) {
      discount = promo.maxDiscountAmount;
    }
  } else {
    discount = promo.discountValue;
  }

  res.status(200).json({
    success: true,
    data: {
      code: promo.code,
      discount,
      newTotal: orderAmount - discount,
    },
  });
});

/**
 * @desc    Get referral stats
 * @route   GET /api/v1/customers/referral-stats
 * @access  Private (Customer)
 */
exports.getReferralStats = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findOne({ user: req.user.id });
  if (!customer) {
    customer = await Customer.create({ user: req.user.id });
  }
  const referralsCount = await Customer.countDocuments({ referredBy: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      referralCode: customer.referralCode || "NOT_GENERATED",
      totalReferrals: customer.referredCount || 0,
      rewardPoints: customer.walletBalance || 0,
      referralEarnings: customer.referralEarnings || 0,
    },
  });
});
