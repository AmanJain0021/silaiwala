const CustomDesign = require("../../../models/CustomDesign");
const Order = require("../../../models/Order");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Tailor = require("../../../models/Tailor");
const Settings = require("../../../models/Settings");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const razorpay = require("../../../config/razorpay");
const { getIO } = require("../../../config/socket");

/**
 * @desc    Submit a Custom Design Request from Cart
 * @route   POST /api/v1/custom-designs/request
 * @access  Private (Customer)
 */
exports.submitCustomDesignRequest = asyncHandler(async (req, res, next) => {
  const { tailorId, description, images, deliveryAddress } = req.body;

  if (!tailorId || !description || !images || images.length === 0 || !deliveryAddress) {
    return next(new ErrorResponse("Tailor, description, images, and delivery address are required", 400));
  }

  const customDesignId = `CDR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const customDesign = await CustomDesign.create({
    customDesignId,
    customer: req.user.id,
    tailor: tailorId,
    description: description,
    images: images,
    pickupAddress: deliveryAddress, // Reused as deliveryAddress in the Order
    quotationStatus: "pending"
  });

  // Notify Tailor
  await sendNotification({
      recipient: tailorId,
      type: "CUSTOM_DESIGN_REQUEST",
      title: "New Custom Design Request!",
      message: `You have received a new custom design request (${customDesignId}). Please review and provide a quote.`,
      data: { customDesignId: customDesign._id, targetUrl: "/tailor/custom-designs" }
  });

  res.status(201).json({
    success: true,
    data: customDesign
  });
});

/**
 * @desc    Get all custom designs for the logged in user (customer or tailor)
 * @route   GET /api/v1/custom-designs
 * @access  Private
 */
exports.getCustomDesigns = asyncHandler(async (req, res, next) => {
  let query = {};
  
  if (req.user.role === 'customer') {
    query.customer = req.user.id;
  } else if (req.user.role === 'tailor') {
    query.tailor = req.user.id;
  } else if (req.user.role === 'admin') {
    // admin gets all
  } else {
    return next(new ErrorResponse("Not authorized to view custom designs", 403));
  }

  const customDesigns = await CustomDesign.find(query)
    .populate('customer', 'name email phone profileImage')
    .populate('tailor', 'name email phone profileImage')
    .populate('linkedOrderId')
    .sort('-createdAt');

  const tailorUserIds = customDesigns.map(a => a.tailor?._id).filter(Boolean);
  const tailors = await Tailor.find({ user: { $in: tailorUserIds } });

  const data = customDesigns.map(cd => {
     const cdObj = cd.toObject();
     if (cdObj.tailor) {
       const tailorProfile = tailors.find(t => t.user.toString() === cdObj.tailor._id.toString());
       if (tailorProfile && tailorProfile.location) {
           cdObj.tailor.location = tailorProfile.location;
       }
     }
     return cdObj;
  });

  res.status(200).json({
    success: true,
    count: customDesigns.length,
    data: data
  });
});

/**
 * @desc    Tailor submits a quote for a custom design
 * @route   PATCH /api/v1/custom-designs/:id/quote
 * @access  Private (Tailor)
 */
exports.submitQuote = asyncHandler(async (req, res, next) => {
  const { quoteAmount, estimatedCompletionTime } = req.body;

  if (!quoteAmount || !estimatedCompletionTime) {
    return next(new ErrorResponse("Please provide quoteAmount and estimatedCompletionTime", 400));
  }

  let customDesign = await CustomDesign.findById(req.params.id);

  if (!customDesign) {
    return next(new ErrorResponse("Custom Design not found", 404));
  }

  if (customDesign.tailor.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to quote this custom design", 403));
  }

  if (customDesign.quotationStatus === 'accepted' || customDesign.quotationStatus === 'rejected') {
    return next(new ErrorResponse("Cannot modify a quote that has already been decided", 400));
  }

  customDesign.quoteAmount = quoteAmount;
  customDesign.estimatedCompletionTime = estimatedCompletionTime;
  customDesign.quotationStatus = "quoted";

  await customDesign.save();

  // Notify Customer
  await sendNotification({
      recipient: customDesign.customer,
      type: "CUSTOM_DESIGN_QUOTE",
      title: "Custom Design Quote Received",
      message: `Your tailor has quoted ₹${quoteAmount} for your custom design (${customDesign.customDesignId}). Please review and pay to proceed.`,
      data: { customDesignId: customDesign._id, targetUrl: "/profile/custom-designs" }
  });

  res.status(200).json({
    success: true,
    data: customDesign
  });
});

/**
 * @desc    Initialize Razorpay payment for Custom Design Advance
 * @route   POST /api/v1/custom-designs/:id/razorpay
 * @access  Private (Customer)
 */
exports.createRazorpayCustomDesignOrder = asyncHandler(async (req, res, next) => {
  const customDesign = await CustomDesign.findById(req.params.id);

  if (!customDesign) {
    return next(new ErrorResponse("Custom Design not found", 404));
  }

  if (customDesign.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to pay for this custom design", 403));
  }

  if (customDesign.quotationStatus !== 'quoted') {
    return next(new ErrorResponse("This custom design is not ready for payment", 400));
  }

  if (customDesign.paymentStatus === 'paid') {
    return next(new ErrorResponse("This custom design is already paid", 400));
  }

  const finalTotal = req.body.finalTotal || customDesign.quoteAmount;

  // Calculate Advance Amount
  const adminSettings = await Settings.findOne() || await Settings.create({});
  const advancePercentage = adminSettings.walletConfig?.advancePercentage || 30;
  const advancePaymentAmount = Math.round(finalTotal * (advancePercentage / 100));

  const options = {
    amount: Math.round(advancePaymentAmount * 100), // amount in paise
    currency: "INR",
    receipt: `cdr_receipt_${crypto.randomBytes(5).toString("hex")}`,
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
 * @desc    Verify Razorpay payment and convert Custom Design to Order
 * @route   POST /api/v1/custom-designs/:id/verify
 * @access  Private (Customer)
 */
exports.verifyCustomDesignPayment = asyncHandler(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, finalTotal, deliveryFee, platformFee, taxes } = req.body;

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
    const customDesign = await CustomDesign.findById(req.params.id).session(session);
    if (!customDesign) {
      await session.abortTransaction(); session.endSession(); return next(new ErrorResponse("Custom Design not found", 404));
    }

    if (customDesign.paymentStatus === 'paid') {
      await session.abortTransaction(); session.endSession(); return next(new ErrorResponse("Already paid", 400));
    }

    customDesign.paymentStatus = 'paid';
    customDesign.quotationStatus = 'accepted';

    // Bridge the Custom Design into the Main Order system!
    const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    
    // Calculate Advanced and Remaining Payment
    const totalQuote = finalTotal || customDesign.quoteAmount;
    const adminSettings = await Settings.findOne().session(session) || await Settings.create({}, { session });
    const advancePercentage = adminSettings.walletConfig?.advancePercentage || 30;
    const advancePaymentAmount = Math.round(totalQuote * (advancePercentage / 100));
    const remainingPaymentAmount = totalQuote - advancePaymentAmount;
    
    const newOrder = await Order.create([{
      orderId,
      customer: customDesign.customer,
      tailor: customDesign.tailor,
      totalAmount: totalQuote,
      deliveryFee: deliveryFee || 0,
      platformFee: platformFee || 0,
      taxes: taxes || 0,
      status: "accepted", // Automatically skips pending, goes to accepted to start measurement
      paymentStatus: "pending", // Overall payment is pending because remaining is left
      advancePaymentAmount,
      remainingPaymentAmount,
      advancePaymentStatus: "paid",
      remainingPaymentStatus: "pending",
      advancePaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      acceptedAt: new Date(),
      deliveryAddress: customDesign.pickupAddress, // The delivery address
      fabricPickupRequired: true, // Needs fabric later
      isMeasurementHome: true, // Assuming measurement is required for custom designs (can be customized)
      items: [{
        isCustomDesign: true,
        customDesignRef: customDesign._id,
        quantity: 1,
        price: customDesign.quoteAmount,
        fabricSource: "customer" // Fabric provided by customer
      }],
      trackingHistory: [{
        status: "accepted",
        timestamp: new Date(),
        message: `Advance Payment of ₹${advancePaymentAmount} received. Custom Design order confirmed and ready for measurements.`
      }]
    }], { session });

    customDesign.linkedOrderId = newOrder[0]._id;
    await customDesign.save({ session });

    // Notify Tailor
    await sendNotification({
        recipient: customDesign.tailor,
        type: "ORDER_CREATED",
        title: "Custom Design Quote Accepted & Advance Paid!",
        message: `Customer has paid advance ₹${advancePaymentAmount} for Custom Design ${customDesign.customDesignId}. The order has been moved to accepted state to start measurements.`,
        data: { orderId: newOrder[0]._id, targetUrl: "/orders" }
    });
    
    const io = getIO();
    if (io) {
        io.to(`user_${customDesign.tailor}`).emit('receive_new_order', {
            orderId: newOrder[0].orderId,
            status: 'accepted'
        });
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: newOrder[0]
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Custom Design payment verification failed:", error);
    return next(new ErrorResponse("Payment processing failed", 500));
  } finally {
    session.endSession();
  }
});
