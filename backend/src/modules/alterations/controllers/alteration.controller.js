const Alteration = require("../../../models/Alteration");
const Order = require("../../../models/Order");
const Cart = require("../../../models/Cart");
const crypto = require("crypto");
const mongoose = require("mongoose");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const razorpay = require("../../../config/razorpay");

/**
 * @desc    Submit an Alteration Request from Cart
 * @route   POST /api/v1/alterations/request
 * @access  Private (Customer)
 */
exports.submitAlterationRequest = asyncHandler(async (req, res, next) => {
  const { deliveryAddress } = req.body;

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || !cart.items || cart.items.length === 0) {
    return next(new ErrorResponse("Cart is empty", 400));
  }

  const alterationItem = cart.items.find(item => item.isAlteration);
  if (!alterationItem) {
    return next(new ErrorResponse("No alteration found in cart", 400));
  }

  if (!alterationItem.config || !alterationItem.config.alterationDescription || !alterationItem.config.alterationImages || alterationItem.config.alterationImages.length === 0) {
    return next(new ErrorResponse("Alteration description and images are required", 400));
  }

  const alterationId = `ALT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const alteration = await Alteration.create({
    alterationId,
    customer: req.user.id,
    tailor: alterationItem.tailor,
    description: alterationItem.config.alterationDescription,
    images: alterationItem.config.alterationImages,
    pickupAddress: deliveryAddress,
    quotationStatus: "pending"
  });

  // Clear the alteration item from cart
  cart.items = cart.items.filter(item => !item.isAlteration);
  await cart.save();

  // Notify Tailor
  await sendNotification({
      recipient: alterationItem.tailor,
      type: "ALTERATION_REQUEST",
      title: "New Alteration Request!",
      message: `You have received a new alteration request (${alterationId}). Please review and provide a quote.`,
      data: { alterationId: alteration._id, targetUrl: "/tailor/alterations" }
  });

  res.status(201).json({
    success: true,
    data: alteration
  });
});

/**
 * @desc    Get all alterations for the logged in user (customer or tailor)
 * @route   GET /api/v1/alterations
 * @access  Private
 */
exports.getAlterations = asyncHandler(async (req, res, next) => {
  let query = {};
  
  if (req.user.role === 'customer') {
    query.customer = req.user.id;
  } else if (req.user.role === 'tailor') {
    query.tailor = req.user.id;
  } else if (req.user.role === 'admin') {
    // admin gets all
  } else {
    return next(new ErrorResponse("Not authorized to view alterations", 403));
  }

  const alterations = await Alteration.find(query)
    .populate('customer', 'name email phone avatar')
    .populate('tailor', 'name email phone avatar')
    .populate('linkedOrderId')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: alterations.length,
    data: alterations
  });
});

/**
 * @desc    Tailor submits a quote for an alteration
 * @route   PATCH /api/v1/alterations/:id/quote
 * @access  Private (Tailor)
 */
exports.submitQuote = asyncHandler(async (req, res, next) => {
  const { quoteAmount, estimatedCompletionTime } = req.body;

  if (!quoteAmount || !estimatedCompletionTime) {
    return next(new ErrorResponse("Please provide quoteAmount and estimatedCompletionTime", 400));
  }

  let alteration = await Alteration.findById(req.params.id);

  if (!alteration) {
    return next(new ErrorResponse("Alteration not found", 404));
  }

  if (alteration.tailor.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to quote this alteration", 403));
  }

  if (alteration.quotationStatus === 'accepted' || alteration.quotationStatus === 'rejected') {
    return next(new ErrorResponse("Cannot modify a quote that has already been decided", 400));
  }

  alteration.quoteAmount = quoteAmount;
  alteration.estimatedCompletionTime = estimatedCompletionTime;
  alteration.quotationStatus = "quoted";

  await alteration.save();

  // Notify Customer
  await sendNotification({
      recipient: alteration.customer,
      type: "ALTERATION_QUOTE",
      title: "Alteration Quote Received",
      message: `Your tailor has quoted ₹${quoteAmount} for your alteration (${alteration.alterationId}). Please review and pay to proceed.`,
      data: { alterationId: alteration._id, targetUrl: "/profile/alterations" }
  });

  res.status(200).json({
    success: true,
    data: alteration
  });
});

/**
 * @desc    Initialize Razorpay payment for Alteration
 * @route   POST /api/v1/alterations/:id/razorpay
 * @access  Private (Customer)
 */
exports.createRazorpayAlterationOrder = asyncHandler(async (req, res, next) => {
  const alteration = await Alteration.findById(req.params.id);

  if (!alteration) {
    return next(new ErrorResponse("Alteration not found", 404));
  }

  if (alteration.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to pay for this alteration", 403));
  }

  if (alteration.quotationStatus !== 'quoted') {
    return next(new ErrorResponse("This alteration is not ready for payment", 400));
  }

  if (alteration.paymentStatus === 'paid') {
    return next(new ErrorResponse("This alteration is already paid", 400));
  }

  const options = {
    amount: Math.round(alteration.quoteAmount * 100), // amount in paise
    currency: "INR",
    receipt: `alt_receipt_${crypto.randomBytes(5).toString("hex")}`,
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
 * @desc    Verify Razorpay payment and convert Alteration to Order
 * @route   POST /api/v1/alterations/:id/verify
 * @access  Private (Customer)
 */
exports.verifyAlterationPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature !== expectedSign) {
    return next(new ErrorResponse("Invalid payment signature!", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const alteration = await Alteration.findById(req.params.id).session(session);
    if (!alteration) {
      await session.abortTransaction(); session.endSession(); return next(new ErrorResponse("Alteration not found", 404));
    }

    if (alteration.paymentStatus === 'paid') {
      await session.abortTransaction(); session.endSession(); return next(new ErrorResponse("Already paid", 400));
    }

    alteration.paymentStatus = 'paid';
    alteration.quotationStatus = 'accepted';

    // Bridge the Alteration into the Main Order system!
    const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    
    // We treat Alterations as fully-paid upfront orders that require fabric pickup
    const newOrder = await Order.create([{
      orderId,
      customer: alteration.customer,
      tailor: alteration.tailor,
      totalAmount: alteration.quoteAmount,
      status: "fabric-ready-for-pickup", // Triggers delivery partner to pick up garment from customer
      paymentStatus: "paid",
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      paidAt: new Date(),
      deliveryAddress: alteration.pickupAddress,
      fabricPickupRequired: true, 
      items: [{
        isAlteration: true,
        alterationRef: alteration._id,
        quantity: 1,
        price: alteration.quoteAmount,
        fabricSource: "customer" // Garment provided by customer
      }],
      trackingHistory: [{
        status: "fabric-ready-for-pickup",
        timestamp: new Date(),
        message: `Payment of ₹${alteration.quoteAmount} received. Order confirmed and assigned for garment pickup.`
      }]
    }], { session });

    alteration.linkedOrderId = newOrder[0]._id;
    await alteration.save({ session });

    // Notify Tailor
    await sendNotification({
        recipient: alteration.tailor,
        type: "ORDER_CREATED",
        title: "Alteration Quote Accepted & Paid!",
        message: `Customer has paid ₹${alteration.quoteAmount} for Alteration ${alteration.alterationId}. A delivery partner will bring the garment to you soon.`,
        data: { orderId: newOrder[0]._id, targetUrl: "/orders" }
    });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: newOrder[0]
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Alteration payment verification failed:", error);
    return next(new ErrorResponse("Payment processing failed", 500));
  } finally {
    session.endSession();
  }
});
