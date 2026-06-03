const Order = require("../../../models/Order");
const User = require("../../../models/User");
const Tailor = require("../../../models/Tailor");
const Customer = require("../../../models/Customer");
const WalletTransaction = require("../../../models/WalletTransaction");
const { getIO } = require("../../../config/socket");
const crypto = require("crypto");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const razorpay = require("../../../config/razorpay");

const PromoCode = require("../../../models/PromoCode");

/**
 * @desc    Create a new order in Razorpay
 * @route   POST /api/v1/orders/razorpay/create
 * @access  Private (Customer)
 */
exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorResponse("Please provide an amount", 400));
  }

  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise
    currency: "INR",
    receipt: `receipt_${crypto.randomBytes(5).toString("hex")}`,
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      data: razorpayOrder,
    });
  } catch (error) {
    return next(new ErrorResponse("Razorpay order creation failed", 500));
  }
});

/**
 * @desc    Verify Razorpay payment signature
 * @route   POST /api/v1/orders/razorpay/verify
 * @access  Private (Customer)
 */
exports.verifyPayment = asyncHandler(async (req, res, next) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    orderObjectId // This is the MongoDB Order ID
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment verified
    const order = await Order.findById(orderObjectId);
    if (!order) {
      return next(new ErrorResponse("Order not found during verification", 404));
    }

    // Calculate fees (Example logic: 10% platform, 50 delivery)
    const platformFee = Math.round(order.totalAmount * 0.1);
    const deliveryFee = 50; // Fixed delivery fee for now

    order.paymentStatus = "paid";
    order.paymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.platformFee = platformFee;
    order.deliveryFee = deliveryFee;
    
    await order.save();
    
    // Send Notification only AFTER successful payment validation
    const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
    
    await sendNotification({
        recipient: order.tailor,
        type: "ORDER_CREATED",
        title: "New Request Received!",
        message: `You have received a new order ${order.orderId}. ${fabricPickupRequired ? 'Wait for fabric delivery from customer.' : 'You can start processing once accepted.'}`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
    });

    await sendNotification({
        recipient: order.customer,
        type: "PAYMENT_SUCCESS",
        title: "Order Placed Successfully!",
        message: `Your payment for order ${order.orderId} was successful. Our tailor will start working on it soon.`,
        data: { orderId: order._id, targetUrl: "/profile/orders" }
    });

    // --- Socket Emission for Tailor ---
    try {
        const io = getIO();
        if (io) {
            io.to(`user_${order.tailor}`).emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status
            });
            console.log(`📡 Socket: Notified Tailor ${order.tailor} of new paid order`);
        }
    } catch (err) {
        console.error("Socket emission failed in verifyPayment:", err.message);
    }
    // ---------------------------------

    // --- Referral Flow ---
    // Check if this is the customer's first order
    const customerProfile = await Customer.findOne({ user: order.customer });
    if (customerProfile && customerProfile.totalOrders === 0) {
        customerProfile.totalOrders = 1;

        // If referred by someone, give them both a bonus
        if (customerProfile.referredBy) {
            const referrerProfile = await Customer.findOne({ user: customerProfile.referredBy });
            if (referrerProfile) {
                const REFERRER_BONUS = 50;
                const CUSTOMER_BONUS = 25;

                // 1. Reward Referrer
                referrerProfile.walletBalance += REFERRER_BONUS;
                referrerProfile.referralEarnings += REFERRER_BONUS;
                await referrerProfile.save();

                await WalletTransaction.create({
                    user: referrerProfile.user,
                    amount: REFERRER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: `Bonus for referring ${customerProfile.user.name || 'a new user'}`
                });

                // 2. Reward New Customer
                customerProfile.walletBalance += CUSTOMER_BONUS;
                await WalletTransaction.create({
                    user: customerProfile.user,
                    amount: CUSTOMER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: "Welcome bonus from referral"
                });
            }
        }
        await customerProfile.save();
    } else if (customerProfile) {
        customerProfile.totalOrders += 1;
        await customerProfile.save();
    }
    // ---------------------

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });
  } else {
    return next(new ErrorResponse("Invalid payment signature!", 400));
  }
});

/**
 * @desc    Create a new order
 * @route   POST /api/v1/orders
 * @access  Private (Customer)
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
  const { tailorId, items, totalAmount, deliveryAddress, promoCode, customerId } = req.body;

  // Determine correct customer ID
  const finalCustomerId = (req.user.role === 'admin' && customerId) ? customerId : req.user.id;

  // 1. Validation: Ensure tailor exists and is active (Check both User and Tailor Profile IDs)
  let tailor = await User.findOne({ _id: tailorId, role: { $in: ["tailor", "admin"] } });
  
  if (!tailor) {
    // If not found in User, check if it's a Tailor Profile ID
    const tailorProfile = await Tailor.findById(tailorId).populate("user");
    if (tailorProfile && tailorProfile.user) {
      tailor = tailorProfile.user;
    }
  }

  if (!tailor) {
    return next(new ErrorResponse("Tailor account not found or invalid", 404));
  }

  const targetTailorUserId = tailor._id;

  // 2. Optimization: Map items to ensure structure matches updated schema
  // In a real production environment, we would also verify basePrice and delivery charges here
  const formattedItems = items.map(item => ({
    product: item.product || null,
    service: item.service || null,
    fabricSource: item.fabricSource || (item.product ? 'platform' : 'customer'),
    deliveryType: item.deliveryType || 'standard',
    selectedFabric: item.selectedFabric || null,
    quantity: item.quantity || 1,
    price: item.price,
    measurements: item.measurements || {}
  }));

  // 3. Generate unique order ID
  const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 4. Check if fabric pickup is required
  const fabricPickupRequired = formattedItems.some(item => item.fabricSource === 'customer');
  const initialStatus = "pending";

  // 5. Handle Promo Code / Coupon
  let discountAmount = 0;
  let finalAmount = totalAmount;

  if (promoCode) {
    const promo = await PromoCode.findOne({ code: promoCode, isActive: true });
    if (promo) {
      // Check dates
      const now = new Date();
      const isActive = promo.startDate <= now && (!promo.endDate || promo.endDate >= now);
      const isWithinLimit = promo.usedCount < promo.usageLimit;
      const isMinAmountMet = totalAmount >= promo.minOrderAmount;

      if (isActive && isWithinLimit && isMinAmountMet) {
        if (promo.discountType === "percentage") {
          discountAmount = (totalAmount * promo.discountValue) / 100;
          if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
            discountAmount = promo.maxDiscountAmount;
          }
        } else {
          discountAmount = promo.discountValue;
        }
        finalAmount = totalAmount - discountAmount;
        
        // Increment used count
        promo.usedCount += 1;
        await promo.save();
      }
    }
  }

  // 6. Create Order with optimized object
  const order = await Order.create({
    orderId,
    customer: finalCustomerId,
    tailor: targetTailorUserId,
    items: formattedItems,
    totalAmount: finalAmount,
    discountAmount,
    couponCode: promoCode,
    deliveryAddress,
    status: initialStatus,
    fabricPickupRequired,
    trackingHistory: [{ 
        status: initialStatus, 
        message: fabricPickupRequired 
            ? "Order placed. Fabric pickup task created." 
            : "Order placed successfully" 
    }],
  });
  // 7. Socket Emission for Tailor (if order is created - e.g. COD or during development)
  try {
    const io = getIO();
    if (io) {
        io.to(`user_${targetTailorUserId}`).emit('receive_new_order', {
            orderId: order.orderId,
            _id: order._id,
            totalAmount: order.totalAmount,
            status: order.status
        });
        console.log(`📡 Socket: Notified Tailor ${targetTailorUserId} of new order creation`);
    }
  } catch (err) {
    console.error("Socket emission failed in createOrder:", err.message);
  }

  res.status(201).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Get customer orders
 * @route   GET /api/v1/orders/my-orders
 * @access  Private (Customer)
 */
exports.getMyOrders = asyncHandler(async (req, res, next) => {
  let query = {};

  // This endpoint is used by the customer app, so we always look for orders where the user is the customer
  query = { customer: req.user.id };

  const orders = await Order.find(query)
    .populate("tailor", "name shopName profileImage")
    .populate("customer", "name phoneNumber")
    .populate("items.service", "title image")
    .populate("items.product", "name image images")
    .populate("items.selectedFabric", "name image images")
    .sort("-createdAt")
    .lean();

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

/**
 * @desc    Get single order details
 * @route   GET /api/v1/orders/:id
 * @access  Private (Customer/Tailor)
 */
exports.getOrderDetails = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("customer", "name phoneNumber")
    .populate("tailor", "name shopName phoneNumber")
    .populate("deliveryPartner", "name phoneNumber profileImage")
    .populate("items.service", "title image")
    .populate("items.product", "name image images")
    .populate("items.selectedFabric", "name image images")
    .lean();

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Check ownership
  if (
    order.customer?._id?.toString() !== req.user.id &&
    order.tailor?._id?.toString() !== req.user.id &&
    order.deliveryPartner?.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(new ErrorResponse("Not authorized to view this order", 403));
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});
