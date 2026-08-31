const User = require("../../../models/User.js");
const Customer = require("../../../models/Customer.js");
const Settings = require("../../../models/Settings.js");
const Tailor = require("../../../models/Tailor.js");
const Product = require("../../../models/Product.js");
const Order = require("../../../models/Order.js");
const PromoCode = require("../../../models/PromoCode.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const {
  normalizeCheckoutType,
  isPromoApplicableToCheckout,
} = require("../../../utils/promoDiscount.js");

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
  const { name, profileImage, addresses, email, phoneNumber, location } = req.body;

  // Update User data with string-only validation
  const userUpdate = {};
  if (typeof name === 'string' && name.trim()) userUpdate.name = name.trim();
  if (typeof email === 'string' && email.trim()) userUpdate.email = email.trim();
  if (typeof phoneNumber === 'string' && phoneNumber.trim()) userUpdate.phoneNumber = phoneNumber.trim();
  if (typeof profileImage === 'string' && profileImage.trim()) userUpdate.profileImage = profileImage.trim();
  if (typeof location === 'string' && location.trim()) userUpdate.location = location.trim();

  if (Object.keys(userUpdate).length > 0) {
    await User.findByIdAndUpdate(req.user.id, userUpdate, { new: true, runValidators: true });
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
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

exports.getTailors = asyncHandler(async (req, res, next) => {
  const { lat, lng, search, minPrice, maxPrice, rating, sortBy, strictRadius } = req.query;
  const isStrict = strictRadius === 'true';

  const Settings = require("../../../models/Settings.js");
  const settings = await Settings.findOne();
  const searchRadiusKmRaw = settings?.tailorSearch?.searchRadiusKm;
  const searchRadiusKm = (searchRadiusKmRaw === 'default' || searchRadiusKmRaw === 0 || searchRadiusKmRaw == null) ? 0 : Number(searchRadiusKmRaw);

  let query = {};

  // 1. Geographic Filter
  // Only apply hard geographic limit to the mongo query if isStrict is explicitly true
  if (lat && lng && isStrict && searchRadiusKm > 0) {
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: searchRadiusKm * 1000
      }
    };
  }

  // 2. Price Filter
  // Only apply maxPrice filter if it's less than the default slider max (10000)
  // so we don't accidentally filter out tailors that haven't set their basePrice yet
  if (minPrice || (maxPrice && Number(maxPrice) < 10000)) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice && Number(maxPrice) < 10000) query.basePrice.$lte = Number(maxPrice);
  }

  // 3. Rating Filter
  if (rating) {
      query.rating = { $gte: Number(rating) };
  }

  let tailors = await Tailor.find(query)
    .populate("user", "name email profileImage")
    .populate("activePlan", "name sortOrder price isPopular theme")
    .lean();

  // Search Filter (applied locally to properly include populated user.name)
  if (search) {
      const searchRegex = new RegExp(search, 'i');
      tailors = tailors.filter(t => 
          searchRegex.test(t.shopName || "") || 
          searchRegex.test(t.user?.name || "") || 
          (t.specializations || []).some(s => searchRegex.test(s))
      );
  }

  // Calculate distance
  if (lat && lng) {
      tailors.forEach(t => {
          if (t.location && t.location.coordinates) {
              t.distanceKm = getDistanceInKm(parseFloat(lat), parseFloat(lng), t.location.coordinates[1], t.location.coordinates[0]);
              t.distance = t.distanceKm.toFixed(1) + ' km away'; // Format for frontend
          } else {
              t.distanceKm = Infinity;
          }
      });
  } else {
      tailors.forEach(t => t.distanceKm = 0);
  }

  // Sorting
  tailors.sort((a, b) => {
    // Group In-Range tailors above Out-of-Range tailors (always apply if radius exists)
    if (searchRadiusKm > 0) {
        const aInRange = a.distanceKm <= searchRadiusKm;
        const bInRange = b.distanceKm <= searchRadiusKm;
        if (aInRange && !bInRange) return -1;
        if (!aInRange && bInRange) return 1;
    }

    if (sortBy === 'price_low') return (a.basePrice || 0) - (b.basePrice || 0);
    if (sortBy === 'price_high') return (b.basePrice || 0) - (a.basePrice || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    
    // Default: Priority sort (higher sortOrder comes first)
    const sortA = a.activePlan?.sortOrder || 0;
    const sortB = b.activePlan?.sortOrder || 0;
    
    if (sortA !== sortB) return sortB - sortA;
    
    // Tie-breaker: Distance
    return (a.distanceKm || 0) - (b.distanceKm || 0);
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
  const { code, orderAmount, checkoutType } = req.body;
  const amount = Math.max(0, Math.round(Number(orderAmount) || 0));
  const normalizedCode = String(code || "").trim().toUpperCase();
  const type = normalizeCheckoutType(checkoutType);

  if (!normalizedCode) {
    return next(new ErrorResponse("Please enter a coupon code", 400));
  }

  const promo = await PromoCode.findOne({ code: normalizedCode, isActive: true });

  if (!promo) {
    return next(new ErrorResponse("Invalid or expired promo code", 404));
  }

  const { calculatePromoDiscount } = require("../../../utils/promoDiscount.js");
  const result = calculatePromoDiscount(amount, promo, type);

  if (!result.ok) {
    return next(new ErrorResponse(result.reason || "Promo code could not be applied", 400));
  }

  res.status(200).json({
    success: true,
    data: {
      code: promo.code,
      description: promo.description || "",
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discount: result.discount,
      newTotal: result.newTotal,
      minOrderAmount: promo.minOrderAmount || 0,
      applicableTo: promo.applicableTo || "all",
    },
  });
});

/**
 * @desc    List active promo codes / offers for checkout
 * @route   GET /api/v1/customers/promo-codes
 * @access  Private (Customer)
 */
exports.getAvailablePromoCodes = asyncHandler(async (req, res) => {
  const now = new Date();
  const checkoutType = normalizeCheckoutType(req.query.checkoutType || req.query.for);
  const withUsage = await PromoCode.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gte: now } }],
  })
    .select(
      "code description discountType discountValue minOrderAmount maxDiscountAmount endDate usageLimit usedCount applicableTo"
    )
    .sort("-createdAt")
    .lean();

  const list = withUsage
    .filter((p) => (p.usedCount || 0) < (p.usageLimit ?? 1000))
    .filter((p) => isPromoApplicableToCheckout(p, checkoutType))
    .map((p) => ({
      code: p.code,
      description: p.description || "",
      discountType: p.discountType,
      discountValue: p.discountValue,
      minOrderAmount: p.minOrderAmount || 0,
      maxDiscountAmount: p.maxDiscountAmount || null,
      endDate: p.endDate || null,
      applicableTo: p.applicableTo || "all",
    }));

  res.status(200).json({
    success: true,
    count: list.length,
    data: list,
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
  const user = await User.findById(req.user.id).select("loyaltyPoints name");
  const settings = await Settings.getSettings();
  const referralConfig = settings.referralConfig || {};

  res.status(200).json({
    success: true,
    data: {
      referralCode: customer.referralCode || "NOT_GENERATED",
      totalReferrals: customer.referredCount || 0,
      loyaltyPoints: user?.loyaltyPoints || 0,
      referralEarnings: customer.referralEarnings || 0,
      referralConfig: {
        enabled: referralConfig.enabled !== false,
        referrerPointsOnFirstAdvance: Number(referralConfig.referrerPointsOnFirstAdvance) || 0,
        refereePointsOnFirstAdvance: Number(referralConfig.refereePointsOnFirstAdvance) || 0,
      },
    },
  });
});
