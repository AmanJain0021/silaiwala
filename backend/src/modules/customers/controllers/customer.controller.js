const User = require("../../../models/User.js");
const Customer = require("../../../models/Customer.js");
const Settings = require("../../../models/Settings.js");
const Tailor = require("../../../models/Tailor.js");
const Product = require("../../../models/Product.js");
const Order = require("../../../models/Order.js");
const PromoCode = require("../../../models/PromoCode.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

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
