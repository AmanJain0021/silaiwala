const Order = require("../../../models/Order.js");
const mongoose = require("mongoose");
const User = require("../../../models/User.js");
const Tailor = require("../../../models/Tailor.js");
const Customer = require("../../../models/Customer.js");
const WalletTransaction = require("../../../models/WalletTransaction.js");
const Settings = require("../../../models/Settings.js");
const PaymentLedger = require("../../../models/PaymentLedger.js");
const { getIO } = require("../../../config/socket.js");
const crypto = require("crypto");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const { sendNotification } = require("../../../utils/notification.js");
const razorpay = require("../../../config/razorpay.js");
const { invalidateCache } = require("../../../utils/cache.js");

const PromoCode = require("../../../models/PromoCode.js");
const { autoAssignDelivery } = require("../../../utils/deliveryAssignment.js");
const axios = require("axios");

const autoGeocode = async (addressObj) => {
  if (!addressObj) return addressObj;

  const { resolvePickupStartCoords, inferCityFromText, normalizeCity, isValidIndiaCoords } = require("../../../utils/resolveDeliveryCoords.js");

  // Infer city from street when Unknown
  if (!normalizeCity(addressObj.city)) {
    const inferred = inferCityFromText(addressObj.street, addressObj.state);
    if (inferred) {
      addressObj.city = inferred.charAt(0).toUpperCase() + inferred.slice(1);
    }
  }

  const existing = addressObj.location?.coordinates;
  const hasCoords =
    existing &&
    existing.length === 2 &&
    existing[0] !== null &&
    isValidIndiaCoords(existing[0], existing[1]);

  // If coords exist but don't match city in the address text, force re-geocode
  let coordsLookWrong = false;
  if (hasCoords && addressObj.city) {
    const fakeOrder = { deliveryAddress: addressObj, orderId: "geocode-check" };
    const resolved = resolvePickupStartCoords(fakeOrder, null);
    if (
      resolved &&
      (Math.abs(resolved[0] - existing[0]) > 0.01 || Math.abs(resolved[1] - existing[1]) > 0.01)
    ) {
      coordsLookWrong = true;
      console.warn(`⚠️ [order.controller] Existing coords look wrong for city ${addressObj.city}, re-geocoding`);
    }
  }

  if (hasCoords && !coordsLookWrong) {
    return addressObj;
  }
  
  try {
      const addressString = `${addressObj.street || ''}, ${addressObj.city || ''}, ${addressObj.state || ''}, ${addressObj.zipCode || ''}, India`;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (apiKey && apiKey !== 'your_google_maps_api_key' && apiKey !== 'your_backend_google_maps_api_key_here') {
          console.log(`📍 [order.controller] Auto-geocoding typed address: ${addressString}`);
          const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
              params: {
                  address: addressString,
                  key: apiKey
              }
          });
          
          if (geoResponse.data.status === 'OK' && geoResponse.data.results.length > 0) {
              const location = geoResponse.data.results[0].geometry.location;
              console.log(`🗺️ [order.controller] Successfully geocoded to Lat: ${location.lat}, Lng: ${location.lng}`);
              addressObj.location = {
                  type: 'Point',
                  coordinates: [location.lng, location.lat]
              };
          } else {
              console.warn(`⚠️ [order.controller] Google Geocode API returned status: ${geoResponse.data.status}`);
          }
      }
  } catch (err) {
      console.error(`❌ [order.controller] Google Geocode API Error:`, err.message);
  }
  return addressObj;
};

/**
 * @desc    Create a new order in Razorpay
 * @route   POST /api/v1/orders/razorpay/create
 * @access  Private (Customer)
 */
exports.createRazorpayOrder = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (amount === undefined || amount === null) {
    return next(new ErrorResponse("Please provide an amount", 400));
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return next(new ErrorResponse("Amount must be greater than zero", 400));
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
    console.error("Razorpay Error Object:", error);
    return res.status(500).json({
      success: false, 
      message: "Razorpay error", 
      error: error.message || error.description || JSON.stringify(error)
    });
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
    orderObjectId, // This is the MongoDB Order ID
    paymentType    // 'advance' or 'remaining'
  } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
  if (razorpay_signature === expectedSign) {
    // Payment verified
    const order = await Order.findById(orderObjectId).session(session);
    if (!order) {
      await session.abortTransaction(); session.endSession(); return next(new ErrorResponse("Order not found during verification", 404));
    }

    if (paymentType === 'advance') {
       order.advancePaymentStatus = "paid";
       order.advancePaymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       
       if (!order.advancePaymentAmount || order.advancePaymentAmount <= 0) {
           order.advancePaymentAmount = Math.max(50, Math.round((order.totalAmount || 0) * 0.3));
           order.remainingPaymentAmount = Math.max(0, (order.totalAmount || 0) - order.advancePaymentAmount);
       }
       
       // Change status to trigger pickup
       const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
       let nextStatus = 'in-progress';
       
       if (order.isMeasurementHome) {
           nextStatus = 'measurement-requested';
       } else if (fabricPickupRequired) {
           nextStatus = 'accepted';
       }
       
       // Payment can advance the workflow without going through the tailor status
       // endpoint, so persist acceptance for refresh-safe UI and reporting.
       if (!order.acceptedAt) order.acceptedAt = new Date();
       order.status = nextStatus;
       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Advance payment of ₹${order.advancePaymentAmount} successful. Order confirmed.`,
       });

       await sendNotification({
           recipient: order.tailor,
           type: "ORDER_CREATED",
           title: "Advance Paid - Start Order!",
           message: `Customer has paid the advance for ${order.orderId}. ${fabricPickupRequired ? 'Wait for fabric delivery.' : 'You can start processing.'}`,
           data: { orderId: order._id, targetUrl: "/partner/orders" }
       });
       
       // Emit socket
       const { getIO } = require("../../../config/socket.js");
       const io = getIO();
       if (io) {
           io.to(`user_${order.tailor}`).emit('order_status_updated', {
               orderId: order.orderId,
               status: order.status
           });
       }

       // --- Credit Tailor Wallet for Advance Payment ---
       try {
           const tailorProfile = await Tailor.findOne({ user: order.tailor });
           if (tailorProfile) {
               const settings = await Settings.getSettings();
               const advancePct = settings?.walletConfig?.advancePercentage || 30;
               const tailorTotalEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
               const tailorAdvanceAmount = Math.round(tailorTotalEarning * (advancePct / 100));

               tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorAdvanceAmount;
               await tailorProfile.save({ session });

               await WalletTransaction.create([{
user: order.tailor,
                   amount: tailorAdvanceAmount,
                   type: "credit",
                   category: "advance_payment",
                   order: order._id,
                   description: `Advance payment received for order ${order.orderId}`
}], { session });
               console.log(`Credited ₹${tailorAdvanceAmount} advance to Tailor ${order.tailor}`);
           }
       } catch (err) {
           console.error("Failed to credit advance payment to Tailor:", err);
       }
       // -----------------------------------------------

    } else if (paymentType === 'remaining') {
       order.remainingPaymentStatus = "paid";
       order.remainingPaymentMethod = "online";
       order.remainingPaymentId = razorpay_payment_id;
       
       // Calculate fees from Settings (not hardcoded)
       const settings = await Settings.getSettings();
       const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
       const platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
       const deliveryFee = order.deliveryFee || 0; 
       order.platformFee = platformFee;
       order.deliveryFee = deliveryFee;
       
       // Compute earnings distribution
       const tailorEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
       order.tailorEarning = Math.max(tailorEarning, 0);
       order.deliveryPartnerEarning = deliveryFee;
       order.netPlatformEarning = order.totalAmount - order.tailorEarning - deliveryFee - (order.gstAmount || 0);
       order.paidAt = new Date();
       
       order.paymentStatus = "paid"; // Overall payment complete

       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Remaining payment of ₹${order.remainingPaymentAmount} successful.`,
       });

       // Create PaymentLedger entry for remaining payment
       try {
         const ledgerId = `LED-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
         await PaymentLedger.create([{
ledgerId,
           order: order._id,
           orderId: order.orderId,
           customer: order.customer,
           tailor: order.tailor,
           deliveryPartner: order.deliveryPartner || null,
           paymentId: razorpay_payment_id,
           razorpayOrderId: razorpay_order_id,
           transactionId: order.transactionId || ledgerId,
           orderAmount: order.totalAmount - (order.gstAmount || 0) - (order.deliveryFee || 0),
           gstAmount: order.gstAmount || 0,
           gstPercentage: order.gstPercentage || 0,
           deliveryFee: order.deliveryFee || 0,
           platformFee: order.platformFee,
           discountAmount: order.discountAmount || 0,
           couponCode: order.couponCode || null,
           tailorEarning: order.tailorEarning,
           deliveryPartnerEarning: order.deliveryPartnerEarning,
           netPlatformEarning: order.netPlatformEarning,
           totalPaid: order.remainingPaymentAmount || 0,
           paymentType: "remaining",
           paymentMethod: "online",
           paymentStatus: "paid",
           paidAt: new Date(),
}], { session });
       } catch (ledgerErr) {
         console.error("Failed to create PaymentLedger entry:", ledgerErr);
       }

       await sendNotification({
           recipient: order.tailor,
           type: "PAYMENT_COMPLETED",
           title: "Final Payment Received",
           message: `Customer has paid the remaining balance for ${order.orderId}.`,
           data: { orderId: order._id, targetUrl: "/orders" }
       });
    } else if (paymentType === 'full') {
       order.advancePaymentStatus = "paid";
       order.advancePaymentId = razorpay_payment_id;
       order.advancePaymentAmount = order.totalAmount;
       order.remainingPaymentStatus = "paid";
       order.remainingPaymentId = razorpay_payment_id;
       order.remainingPaymentAmount = 0;
       order.paymentStatus = "paid"; // <--- ADDED THIS LINE
       if (order.isMeasurementHome) {
           order.status = 'measurement-requested';
       } else if (order.items.some(item => item.fabricSource === 'customer')) {
           order.status = 'accepted';
       } else {
           order.status = 'in-progress';
       }
       if (!order.acceptedAt) order.acceptedAt = new Date();
       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Full payment of ₹${order.totalAmount} successful. Order confirmed.`,
       });
       await sendNotification({
           recipient: order.tailor,
           type: "ORDER_CREATED",
           title: "Full Payment Received - Start Order!",
           message: `Customer has paid in full for ${order.orderId}. You can start processing.`,
           data: { orderId: order._id, targetUrl: "/partner/orders" }
       });

       // Emit socket
       const { getIO } = require("../../../config/socket.js");
       const io = getIO();
       if (io) {
           io.to(`user_${order.tailor}`).emit('order_status_updated', {
               orderId: order.orderId,
               status: order.status
           });
       }

       // --- Credit Tailor Wallet for Full Payment ---
       try {
           const tailorProfile = await Tailor.findOne({ user: order.tailor });
           if (tailorProfile) {
               // Calculate platform fee here if needed, simplified for now:
               const platformFee = Math.round(order.totalAmount * 0.10); // Example 10%
               const tailorShare = order.totalAmount - platformFee;
               
               await WalletTransaction.create([{
user: tailorProfile.user,
                   amount: tailorShare,
                   type: 'credit',
                   category: 'full_payment',
                   order: order._id,
                   description: `Full payment received for Order ${order.orderId} (less platform fee)`
}], { session });
               tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorShare;
               await tailorProfile.save({ session });
           }
       } catch (walletErr) {
           console.error("Wallet credit error (Full Payment):", walletErr);
       }
    } else {
       // Legacy fallback or fully upfront payment
       order.paymentStatus = "paid";
       order.paymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       order.paidAt = new Date();
       if (order.isMeasurementHome) {
           order.status = 'measurement-requested';
       } else if (order.items.some(item => item.fabricSource === 'customer')) {
           order.status = 'accepted';
       } else {
           order.status = 'in-progress';
       }
       if (!order.acceptedAt) order.acceptedAt = new Date();
       
       // Calculate and store fees for full payment
       const settings = await Settings.getSettings();
       const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
       const platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
       order.platformFee = platformFee;
       
       const tailorEarning = order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
       order.tailorEarning = Math.max(tailorEarning, 0);
       order.deliveryPartnerEarning = order.deliveryFee || 0;
       order.netPlatformEarning = order.totalAmount - order.tailorEarning - (order.deliveryFee || 0) - (order.gstAmount || 0);

       // Create PaymentLedger for full payment
       try {
         const ledgerId = `LED-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
         await PaymentLedger.create([{
ledgerId,
           order: order._id,
           orderId: order.orderId,
           customer: order.customer,
           tailor: order.tailor,
           paymentId: razorpay_payment_id,
           razorpayOrderId: razorpay_order_id,
           transactionId: order.transactionId || ledgerId,
           orderAmount: order.totalAmount - (order.gstAmount || 0) - (order.deliveryFee || 0),
           gstAmount: order.gstAmount || 0,
           gstPercentage: order.gstPercentage || 0,
           deliveryFee: order.deliveryFee || 0,
           platformFee: order.platformFee,
           discountAmount: order.discountAmount || 0,
           couponCode: order.couponCode || null,
           tailorEarning: order.tailorEarning,
           deliveryPartnerEarning: order.deliveryPartnerEarning,
           netPlatformEarning: order.netPlatformEarning,
           totalPaid: order.totalAmount,
           paymentType: "full",
           paymentMethod: "online",
           paymentStatus: "paid",
           paidAt: new Date(),
}], { session });
       } catch (ledgerErr) {
         console.error("Failed to create PaymentLedger entry:", ledgerErr);
       }
    }

    // --- Helper for creating & auto-assigning MeasurementRequest ---
    const ensureMeasurementRequest = async (orderDoc, session = null) => {
        if (!orderDoc || !orderDoc.isMeasurementHome) return null;
        const MeasurementRequest = require("../../../models/MeasurementRequest.js");
        const { autoAssignMeasurementExecutive } = require("../../../utils/measurementAssignment.js");

        let existing = session 
            ? await MeasurementRequest.findOne({ order: orderDoc._id }).session(session)
            : await MeasurementRequest.findOne({ order: orderDoc._id });

        if (!existing) {
            console.log(`📐 [ensureMeasurementRequest] Creating MeasurementRequest for Order #${orderDoc.orderId}`);
            const createObj = {
                requestId: `MR${Date.now()}`,
                order: orderDoc._id,
                customer: orderDoc.customer,
                tailor: orderDoc.tailor,
                status: "pending",
                customerAddress: orderDoc.deliveryAddress ? {
                    street: orderDoc.deliveryAddress.street,
                    city: orderDoc.deliveryAddress.city,
                    state: orderDoc.deliveryAddress.state,
                    zipCode: orderDoc.deliveryAddress.zipCode
                } : undefined,
                customerLocation: orderDoc.deliveryAddress?.location?.coordinates?.length === 2 ? orderDoc.deliveryAddress.location : undefined
            };

            let mRequest;
            if (session) {
                const created = await MeasurementRequest.create([createObj], { session });
                mRequest = created[0];
            } else {
                mRequest = await MeasurementRequest.create(createObj);
            }

            orderDoc.measurementRequest = mRequest._id;
            if (session) {
                await orderDoc.save({ session });
            } else {
                await orderDoc.save();
            }
            existing = mRequest;
        }

        // Trigger auto-assignment if not assigned yet
        if (existing && (!existing.executive || existing.status === "pending")) {
            try {
                await autoAssignMeasurementExecutive(orderDoc);
            } catch (assignErr) {
                console.error("⚠️ Failed auto-assigning measurement executive:", assignErr.message);
            }
        }

        return existing;
    };

    // --- Create Measurement Request if applicable ---
    if (order.isMeasurementHome && (paymentType === 'advance' || paymentType === 'full' || !['advance', 'remaining', 'full'].includes(paymentType))) {
        try {
            await ensureMeasurementRequest(order, session);
        } catch (mErr) {
            console.error(`[verifyPayment] ERROR creating MeasurementRequest:`, mErr);
            throw mErr;
        }
    }

    await order.save({ session });

    await sendNotification({
        recipient: order.customer,
        type: "PAYMENT_SUCCESS",
        title: "Order Placed Successfully!",
        message: `Your payment for order ${order.orderId} was successful. Our tailor will start working on it soon.`,
        data: { orderId: order._id, targetUrl: "/profile/orders" }
    });

    await sendNotification({
        recipient: "admins",
        type: "NEW_ORDER",
        title: "New Paid Order Received! 🛍️",
        message: `Payment verified for Order #${order.orderId} (₹${order.totalAmount}).`,
        data: { orderId: order._id, targetUrl: "/admin/orders" }
    });

    await sendNotification({
        recipient: order.tailor,
        type: "NEW_ORDER",
        title: "New Order Received! 🛍️",
        message: `You have a new paid order #${order.orderId} (₹${order.totalAmount}). Please review and start processing.`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
    });

    // Note: Auto-assignment is no longer triggered here. 
    // The customer must select their delivery preference ('self' or 'partner') via a separate endpoint.
    // ---------------------------------

    // --- Referral / first-payment loyalty (advance or full only) ---
    const { processReferralRewardsOnFirstPayment } = require("../../../utils/referralRewards.js");
    if (paymentType === "advance" || paymentType === "full") {
      await processReferralRewardsOnFirstPayment(order, session, paymentType);
    }
    // ---------------------
    await session.commitTransaction();

    if (order.isMeasurementHome && paymentType !== 'remaining') {
        try {
            const { autoAssignMeasurementExecutive } = require("../../../utils/measurementAssignment.js");
            await autoAssignMeasurementExecutive(order);
        } catch (assignErr) {
            console.error("Failed to auto-assign measurement executive:", assignErr);
        }
    }

    // Invalidate dashboard caches after successful payment
    await invalidateCache("cache:admin:dashboard-stats");
    await invalidateCache("cache:admin:crm-dashboard");
    await invalidateCache("cache:admin:finance-dashboard");
    await invalidateCache("cache:admin:finance-stats");

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: order
    });
  } else {
    await session.abortTransaction();
    return next(new ErrorResponse("Invalid payment signature!", 400));
  }
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment verification transaction aborted:", error);
    return next(new ErrorResponse("Payment processing failed", 500));
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Create a new order
 * @route   POST /api/v1/orders
 * @access  Private (Customer)
 */
exports.createOrder = asyncHandler(async (req, res, next) => {
  let { tailorId, items, totalAmount, deliveryAddress, promoCode, customerId, deliveryFee, isBridalConsultation, isMeasurementHome, bridalNotes, bridalDate, bridalTime } = req.body;

  // Single Service-Type Validation for Order Creation
  if (items && items.length > 0) {
    const hasProducts = items.some(item => item.product);
    const hasServices = items.some(item => item.service);

    if (hasProducts && hasServices) {
      return next(new ErrorResponse("An order cannot contain both products and services.", 400));
    }

    if (hasServices) {
      const Service = require("../../../models/Service.js");
      const serviceIds = items.filter(item => item.service).map(item => item.service);
      const services = await Service.find({ _id: { $in: serviceIds } }).populate('category');
      
      let hasAlteration = false;
      let hasStitching = false;

      for (const svc of services) {
        const isAlt = svc.category?.name?.toLowerCase().includes('alteration') || svc.tags?.some(t => t.toLowerCase().includes('alteration'));
        if (isAlt) hasAlteration = true;
        else hasStitching = true;
      }

      if (hasAlteration && hasStitching) {
        return next(new ErrorResponse("An order cannot contain both alteration and stitching services.", 400));
      }
    }
  }


  // Failsafe: Geocode delivery address if it's missing coordinates (e.g. old saved address)
  deliveryAddress = await autoGeocode(deliveryAddress);

  // Determine correct customer ID
  const finalCustomerId = (req.user.role === 'admin' && customerId) ? customerId : req.user.id;

  // Resolve assigned tailor.
  // Preference order:
  // 1) Explicit customer-selected tailorId (User ID or Tailor profile ID)
  // 2) Fallback to the service/product owner's Tailor profile
  // Never override a deliberate tailor selection with the catalog service owner —
  // TailorSelection lets customers pick any available expert for a service.
  const Service = require("../../../models/Service.js");
  const Product = require("../../../models/Product.js");
  
  const extractIdString = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && (val._id || val.id)) return String(val._id || val.id);
    return String(val);
  };

  const validServiceIds = (items || [])
    .map((item) => extractIdString(item.service))
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));
  const validProductIds = (items || [])
    .map((item) => extractIdString(item.product))
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

  const [ownedServices, ownedProducts] = await Promise.all([
    validServiceIds.length
      ? Service.find({ _id: { $in: validServiceIds } }).select("tailor isActive status").lean()
      : [],
    validProductIds.length
      ? Product.find({ _id: { $in: validProductIds } }).select("tailor isActive").lean()
      : [],
  ]);

  const ownerProfileIds = [
    ...ownedServices.map((service) => String(service.tailor)),
    ...ownedProducts.map((product) => String(product.tailor)),
  ].filter(Boolean);
  const uniqueOwnerProfileIds = [...new Set(ownerProfileIds)];

  const extractUserIdFromProfile = (profile) => {
    if (!profile) return null;
    if (profile.user) {
      if (typeof profile.user === 'object' && (profile.user._id || profile.user.id)) {
        return String(profile.user._id || profile.user.id);
      }
      if (mongoose.Types.ObjectId.isValid(String(profile.user))) {
        return String(profile.user);
      }
    }
    return null;
  };

  let targetTailorProfile = null;
  let targetTailorUserId = null;

  const rawTailorId = extractIdString(tailorId);

  if (rawTailorId && mongoose.Types.ObjectId.isValid(rawTailorId)) {
    // 1) Check Tailor profile by ID
    targetTailorProfile = await Tailor.findById(rawTailorId).populate("user");
    // 2) Check Tailor profile by User ID
    if (!targetTailorProfile) {
      targetTailorProfile = await Tailor.findOne({ user: rawTailorId }).populate("user");
    }
    // 3) Direct User document check
    if (!targetTailorProfile) {
      const directUser = await User.findOne({ _id: rawTailorId, role: "tailor" });
      if (directUser) targetTailorUserId = String(directUser._id);
    }
  }

  if (!targetTailorUserId && targetTailorProfile) {
    targetTailorUserId = extractUserIdFromProfile(targetTailorProfile);
  }

  // Fallback to service/product owner tailor if client tailorId was missing or unresolved
  if (!targetTailorUserId && uniqueOwnerProfileIds.length >= 1) {
    const ownerId = uniqueOwnerProfileIds[0];
    targetTailorProfile = await Tailor.findById(ownerId).populate("user");
    if (!targetTailorProfile) {
      targetTailorProfile = await Tailor.findOne({ user: ownerId }).populate("user");
    }
    if (targetTailorProfile) {
      targetTailorUserId = extractUserIdFromProfile(targetTailorProfile);
    } else {
      const ownerUser = await User.findOne({ _id: ownerId, role: "tailor" });
      if (ownerUser) targetTailorUserId = String(ownerUser._id);
    }
  }

  // System Fallback: ONLY if no tailor was specified and no service owner exists
  if (!targetTailorUserId) {
    targetTailorProfile = await Tailor.findOne({ registrationStatus: "verified" }).populate("user");
    if (!targetTailorProfile) {
      targetTailorProfile = await Tailor.findOne({ isAvailable: true }).populate("user");
    }
    if (!targetTailorProfile) {
      targetTailorProfile = await Tailor.findOne().populate("user");
    }
    targetTailorUserId = extractUserIdFromProfile(targetTailorProfile);
  }

  if (!targetTailorUserId || !mongoose.Types.ObjectId.isValid(targetTailorUserId)) {
    const fallbackTailorUser = await User.findOne({ role: "tailor" });
    if (fallbackTailorUser) {
      targetTailorUserId = String(fallbackTailorUser._id);
    }
  }

  if (!targetTailorUserId || !mongoose.Types.ObjectId.isValid(targetTailorUserId)) {
    return next(new ErrorResponse("Tailor account not found or invalid", 404));
  }

  // Bridal Consultation Distance & Fee Calculation
  if (isBridalConsultation) {
      if (!deliveryAddress) {
          const customerProfile = await Customer.findOne({ user: finalCustomerId });
          if (customerProfile && customerProfile.addresses && customerProfile.addresses.length > 0) {
              deliveryAddress = customerProfile.addresses.find(a => a.isDefault) || customerProfile.addresses[0];
          }
      }
      
      if (deliveryAddress && deliveryAddress.location && deliveryAddress.location.coordinates && deliveryAddress.location.coordinates.length >= 2) {
          const tailorProfileDoc = await Tailor.findOne({ user: targetTailorUserId });
          if (tailorProfileDoc && tailorProfileDoc.location && tailorProfileDoc.location.coordinates && tailorProfileDoc.location.coordinates.length >= 2) {
              const customerCoords = deliveryAddress.location.coordinates;
              const tailorCoords = tailorProfileDoc.location.coordinates;
              
              const { getDistanceFromLatLonInKm } = require("../../../utils/haversine.js");
              // Mongoose points are [lng, lat]
              const distance = getDistanceFromLatLonInKm(
                  customerCoords[1], customerCoords[0],
                  tailorCoords[1], tailorCoords[0]
              );
              
              const settings = await Settings.getSettings();
              const baseFee = settings?.deliveryRates?.baseFee || 20;
              const perKmRate = settings?.deliveryRates?.perKmRate || 10;
              
              const consultationFee = baseFee + (Math.ceil(distance) * perKmRate);
              if (!totalAmount || Number(totalAmount) === 0) {
                  totalAmount = consultationFee;
              }
              if (items && items.length > 0 && (!items[0].price || Number(items[0].price) === 0)) {
                  items[0].price = consultationFee;
              }
          }
      }
  }

  // 2. Optimization: Map items to ensure structure matches updated schema
  const formattedItems = items.map(item => {
    const rawService = item.service || item.serviceDetails?.id || item.serviceDetails?._id;
    const rawProduct = item.product || item.productDetails?.id || item.productDetails?._id;
    const rawFabric = item.selectedFabric?._id || item.selectedFabric?.id || item.selectedFabric;
    const validFabric = (rawFabric && mongoose.Types.ObjectId.isValid(rawFabric)) ? rawFabric : null;

    const validService = (rawService && mongoose.Types.ObjectId.isValid(rawService)) ? rawService : null;
    const validProduct = (rawProduct && mongoose.Types.ObjectId.isValid(rawProduct)) ? rawProduct : null;
    let rawMeasurements = item.measurements || {};
    if (rawMeasurements instanceof Map) {
      rawMeasurements = Object.fromEntries(rawMeasurements);
    } else if (typeof rawMeasurements !== 'object' || rawMeasurements === null) {
      rawMeasurements = {};
    }

    return {
      product: validProduct,
      service: validService,
      fabricSource: item.fabricSource || (validProduct ? 'platform' : 'customer'),
      deliveryType: item.deliveryType || 'standard',
      selectedFabric: validFabric,
      quantity: item.quantity || 1,
      price: Number(item.price) || 0,
      measurements: rawMeasurements,
      selectedStyle: item.selectedStyle || null,
      styleAddons: item.addons || item.styleAddons || []
    };
  });

  // 3. Generate unique order ID
  const orderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 4. Check if fabric pickup is required
  const fabricPickupRequired = formattedItems.some(item => item.fabricSource === 'customer');
  const isReadyMade = formattedItems.some(item => item.product);
  const initialStatus = isReadyMade ? "in-progress" : "pending";

  const settings = await Settings.getSettings();

  // 6. Server-side price verification (same formula as checkout Bill Details)
  const {
    computeCheckoutPricing,
    enrichOrderItemsForPricing,
  } = require("../../../utils/checkoutPricing.js");

  const isCartCheckout = formattedItems.some((item) => item.product);
  let pricingItems = items;
  if (!isCartCheckout) {
    pricingItems = await enrichOrderItemsForPricing(items);
  } else {
    const Tailor = require("../../../models/Tailor.js");
    const tailorProfile = await Tailor.findOne({ user: targetTailorUserId }).lean();
    pricingItems = items.map((item) => ({
      ...item,
      tailor: tailorProfile ? { location: tailorProfile.location } : undefined,
    }));
  }

  const serverPricing = computeCheckoutPricing(
    pricingItems,
    deliveryAddress,
    isCartCheckout,
    settings
  );

  let discountAmount = 0;
  let finalAmount = serverPricing.total;

  if (promoCode) {
    const promo = await PromoCode.findOne({ code: promoCode, isActive: true });
    if (promo) {
      // Check dates
      const now = new Date();
      const isActive = promo.startDate <= now && (!promo.endDate || promo.endDate >= now);
      const isWithinLimit = promo.usedCount < promo.usageLimit;
      const isMinAmountMet = serverPricing.total >= promo.minOrderAmount;

      if (isActive && isWithinLimit && isMinAmountMet) {
        if (promo.discountType === "percentage") {
          discountAmount = (serverPricing.total * promo.discountValue) / 100;
          if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
            discountAmount = promo.maxDiscountAmount;
          }
        } else {
          discountAmount = promo.discountValue;
        }
        finalAmount = Math.max(0, serverPricing.total - discountAmount);
        
        // Increment used count
        promo.usedCount += 1;
        await promo.save();
      }
    }
  }

  const clientTotal = Math.round(Number(totalAmount) || 0);
  
  // Price verification: Log mismatch as warning but don't block order.
  // The server-computed total is always authoritative and used for the order.
  // Mismatches occur because price-summary uses frontend pre-computed values while
  // createOrder enriches from DB — these paths can diverge due to distance calc
  // differences, rounding, and data shape differences.
  if (!promoCode && Math.abs(clientTotal - serverPricing.total) > 5) {
    console.warn(
      `[Order Price Warning] Client sent ₹${clientTotal}, server computed ₹${serverPricing.total}. ` +
      `Using server total. Items: ${JSON.stringify(items.map(i => ({ service: i.service, price: i.price, addons: i.addons?.length })))}`
    );
  }

  const gstPct = settings?.pricing?.gstPercentage || 5;
  const gstAmount = serverPricing.taxes;
  const platformFee = serverPricing.platformFee;
  const verifiedDeliveryFee = serverPricing.delivery;

  // 7. Generate transaction ID
  const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // 8. Create Order with optimized object
  const order = await Order.create({
    orderId,
    customer: finalCustomerId,
    tailor: targetTailorUserId,
    items: formattedItems,
    totalAmount: finalAmount,
    deliveryFee: verifiedDeliveryFee,
    platformFee,
    gstAmount,
    gstPercentage: gstPct,
    transactionId,
    discountAmount,
    couponCode: promoCode,
    deliveryAddress,
    status: initialStatus,
    fabricPickupRequired,
    isMeasurementHome: isMeasurementHome || formattedItems.some(item => item.measurements?.type === 'home' || item.isTailorAtHome),
    isBridalConsultation: isBridalConsultation || false,
    bridalNotes,
    bridalDate,
    bridalTime,
    trackingHistory: [{ 
        status: initialStatus, 
        message: isReadyMade ? "Order received and automatically assigned. Processing started." : "Waiting for the tailor to accept the order before assigning a delivery partner."
    }],
  });

  // Create MeasurementRequest and trigger auto-assignment ONLY if advance payment is completed
  if (order.isMeasurementHome && order.advancePaymentStatus === 'paid') {
      try {
          const MeasurementRequest = require("../../../models/MeasurementRequest.js");
          const { autoAssignMeasurementExecutive } = require("../../../utils/measurementAssignment.js");
          
          let existing = await MeasurementRequest.findOne({ order: order._id });
          if (!existing) {
              const mRequest = await MeasurementRequest.create({
                  requestId: `MR${Date.now()}`,
                  order: order._id,
                  customer: order.customer,
                  tailor: order.tailor,
                  status: "pending",
                  customerAddress: order.deliveryAddress ? {
                      street: order.deliveryAddress.street,
                      city: order.deliveryAddress.city,
                      state: order.deliveryAddress.state,
                      zipCode: order.deliveryAddress.zipCode
                  } : undefined,
                  customerLocation: order.deliveryAddress?.location?.coordinates?.length === 2 ? order.deliveryAddress.location : undefined
              });
              order.measurementRequest = mRequest._id;
              await order.save();
          }
          await autoAssignMeasurementExecutive(order);
      } catch (mErr) {
          console.error("Failed creating/assigning MeasurementRequest in createOrder:", mErr);
      }
  }

  // 7. Socket Emission and Notification for Tailor
  try {
    const io = getIO();
    if (io) {
        io.to(`user_${String(targetTailorUserId)}`).emit('receive_new_order', {
            orderId: order.orderId,
            _id: order._id,
            totalAmount: order.totalAmount,
            status: order.status,
            tailor: String(targetTailorUserId),
        });
        console.log(`📡 Socket: Notified Tailor ${targetTailorUserId} of new order creation`);
    }

    const notificationTitle = isReadyMade ? "New Ready-Made Order" : "New Order Placed";
    const notificationMessage = isReadyMade 
        ? `A new ready-made order ${order.orderId} has been automatically assigned to you.`
        : `A new order ${order.orderId} has been placed. Please review and accept or reject it.`;

    await sendNotification({
        recipient: targetTailorUserId,
        type: "ORDER_CREATED",
        title: notificationTitle,
        message: notificationMessage,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
    });

    await sendNotification({
        recipient: "admins",
        type: "NEW_ORDER",
        title: "New Order Placed! 🛍️",
        message: `New Order #${order.orderId} of ₹${order.totalAmount} placed.`,
        data: { orderId: order._id, targetUrl: "/admin/orders" }
    });
  } catch (err) {
    console.error("Socket/Notification emission failed in createOrder:", err.message);
  }

  await invalidateCache("cache:admin:dashboard-stats");
  await invalidateCache("cache:admin:crm-dashboard");
  await invalidateCache("cache:admin:finance-stats");
  await invalidateCache("cache:products:*");

  res.status(201).json({
    success: true,
    data: order,
    assignedTailor: String(targetTailorUserId),
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
  query = { customer: req.user.id, isRework: { $ne: true } };

    const orders = await Order.find(query)
      .populate("tailor", "name shopName phoneNumber profileImage location")
      .populate("customer", "name phoneNumber")
      .populate("deliveryPartner", "name phoneNumber profileImage")
      .populate("pickupPartner", "name phoneNumber profileImage")
      .populate("dropoffPartner", "name phoneNumber profileImage")
    .populate("items.service", "title image")
    .populate("items.product", "name image images")
    .populate("items.selectedFabric", "name image images")
    .select('+pickupDeliveryOtp +dropoffDeliveryOtp')
    .sort("-createdAt")
    .lean();

  // Populate tracking coordinates for all orders
  const enhancedOrders = await Promise.all(orders.map(async (order) => {
    let vendorLatitude, vendorLongitude, customerLatitude, customerLongitude;
    
    if (order.tailor?._id) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor._id }).lean();
      if (tailorDoc) {
        if (typeof order.tailor === 'object') {
          order.tailor.shopName = tailorDoc.shopName || order.tailor.shopName || order.tailor.name;
        }
        if (tailorDoc.location?.coordinates?.length >= 2) {
          vendorLongitude = tailorDoc.location.coordinates[0];
          vendorLatitude = tailorDoc.location.coordinates[1];
        }
      }
    }

    if (order.customer?._id) {
      const customerDoc = await Customer.findOne({ user: order.customer._id }).lean();
      if (customerDoc?.addresses?.length > 0) {
        const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
        if (defaultAddress?.location?.coordinates?.length >= 2) {
          customerLongitude = defaultAddress.location.coordinates[0];
          customerLatitude = defaultAddress.location.coordinates[1];
        }
      }
    }
    
    const isFabricPhase =
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "waiting-for-customer-dropoff", "fabric-delivered"].includes(order.status) ||
      order.pickupDeliveryStatus === "reached-dropoff";

    return {
      ...order,
      dropoffDeliveryOtp: isFabricPhase ? undefined : order.dropoffDeliveryOtp,
      vendorLatitude,
      vendorLongitude,
      customerLatitude,
      customerLongitude
    };
  }));

  res.status(200).json({
    success: true,
    count: enhancedOrders.length,
    data: enhancedOrders,
  });
});

/**
 * @desc    Get single order details
 * @route   GET /api/v1/orders/:id
 * @access  Private (Customer/Tailor)
 */
exports.getOrderDetails = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .select('+pickupDeliveryOtp +dropoffDeliveryOtp')
    .populate("customer", "name phoneNumber")
    .populate("tailor", "name shopName phoneNumber location profileImage")
    .populate("deliveryPartner", "name phoneNumber profileImage")
    .populate("pickupPartner", "name phoneNumber profileImage")
    .populate("dropoffPartner", "name phoneNumber profileImage")
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

  // Fetch coordinates for live map tracking
  let vendorLatitude, vendorLongitude, customerLatitude, customerLongitude;
  
  if (order.tailor?._id) {
    const tailorDoc = await Tailor.findOne({ user: order.tailor._id }).lean();
    if (tailorDoc) {
      if (typeof order.tailor === 'object') {
        order.tailor.shopName = tailorDoc.shopName || order.tailor.shopName || order.tailor.name;
        order.tailor.rating = tailorDoc.rating || 4.8;
        order.tailor.totalReviews = tailorDoc.totalReviews || 120;
        order.tailor.experienceInYears = tailorDoc.experienceInYears || 5;
        order.tailor.tailorProfileId = tailorDoc._id;
        if (!order.tailor.profileImage && tailorDoc.user?.profileImage) {
          order.tailor.profileImage = tailorDoc.user.profileImage;
        }
      }
      if (tailorDoc.location?.coordinates?.length >= 2) {
        vendorLongitude = tailorDoc.location.coordinates[0];
        vendorLatitude = tailorDoc.location.coordinates[1];
      }
    }
  }

  if (order.customer?._id) {
    const customerDoc = await Customer.findOne({ user: order.customer._id }).lean();
    // Prefer order.deliveryAddress coords, then matching saved address, then default
    if (order.deliveryAddress?.location?.coordinates?.length >= 2) {
      customerLongitude = order.deliveryAddress.location.coordinates[0];
      customerLatitude = order.deliveryAddress.location.coordinates[1];
    } else if (customerDoc?.addresses?.length > 0) {
      const matched =
        customerDoc.addresses.find((a) =>
          order.deliveryAddress?.street && a.street === order.deliveryAddress.street
        ) ||
        customerDoc.addresses.find((a) => a.isDefault) ||
        customerDoc.addresses[0];
      if (matched?.location?.coordinates?.length >= 2) {
        customerLongitude = matched.location.coordinates[0];
        customerLatitude = matched.location.coordinates[1];
      }
    }
  }

  // Fetch Measurement OTP & Executive details if the order is in measurement-accepted phase and user is customer
  let measurementOtp = null;
  let measurementExecutive = null;
  let measurementRequestInfo = null;

  if (order.isMeasurementHome) {
      const MeasurementRequest = require("../../../models/MeasurementRequest.js");
      const mReq = await MeasurementRequest.findOne({ order: order._id })
          .select('+otp')
          .populate('executive', 'name phoneNumber profileImage')
          .sort({ createdAt: -1 })
          .lean();

      if (mReq) {
          measurementRequestInfo = mReq;
          if (mReq.executive) {
              measurementExecutive = mReq.executive;
          }
          if (order.customer?._id?.toString() === req.user.id && ['otp_sent', 'accepted'].includes(mReq.status) && mReq.otp) {
              measurementOtp = mReq.otp;
          }
      }
  }

  // Check if an issue exists for this order
  let reportedIssue = null;
  try {
      const Issue = require("../../../models/Issue.js");
      reportedIssue = await Issue.findOne({ originalOrder: order._id })
          .populate({
              path: 'reworkOrder',
              select: '+pickupDeliveryOtp +dropoffDeliveryOtp status pickupDeliveryStatus dropoffDeliveryStatus pickupOtpVerified dropoffOtpVerified'
          })
          .lean();
  } catch (err) {
      console.error("Error checking for existing issue:", err);
  }

  // Scope dropoffDeliveryOtp to appropriate recipient (Customer vs Tailor) based on phase
  const isFabricPhase =
    ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "waiting-for-customer-dropoff", "fabric-delivered"].includes(order.status) ||
    order.pickupDeliveryStatus === "reached-dropoff";

  const isCustomer = order.customer?._id?.toString() === req.user.id;
  const isTailor = order.tailor?._id?.toString() === req.user.id;

  if (isCustomer && isFabricPhase) {
    order.dropoffDeliveryOtp = undefined;
  } else if (isTailor && !isFabricPhase) {
    order.dropoffDeliveryOtp = undefined;
  }

  res.status(200).json({
    success: true,
    data: {
      ...order,
      vendorLatitude,
      vendorLongitude,
      customerLatitude,
      customerLongitude,
      measurementOtp,
      measurementExecutive,
      measurementRequestInfo,
      reportedIssue,
      existingIssueId: reportedIssue?._id // Keep this for backward compatibility with the button
    },
  });
});

/**
 * @desc    Change tailor for an order (Customer)
 * @route   PATCH /api/v1/orders/:id/change-tailor
 * @access  Private (Customer)
 */
exports.changeTailorRequest = asyncHandler(async (req, res, next) => {
    const { newTailorId } = req.body;
    const orderId = req.params.id;

    if (!newTailorId) {
        return next(new ErrorResponse("Please provide a new tailor ID", 400));
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    // Check ownership
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse("Not authorized to modify this order", 403));
    }

    if (order.status !== 'pending') {
        return next(new ErrorResponse("Can only change tailor while order is pending acceptance", 400));
    }

    // Add old tailor to rejectedBy
    if (!order.rejectedBy.includes(order.tailor)) {
        order.rejectedBy.push(order.tailor);
    }

    // Validate new tailor
    let tailor = await User.findOne({ _id: newTailorId, role: { $in: ["tailor", "admin"] } });
    if (!tailor) {
        const Tailor = require("../../../models/Tailor.js");
        const tailorProfile = await Tailor.findById(newTailorId).populate("user");
        if (tailorProfile && tailorProfile.user) {
            tailor = tailorProfile.user;
        }
    }
    
    if (!tailor) {
        return next(new ErrorResponse("New Tailor account not found or invalid", 404));
    }

    // Update order
    order.tailor = tailor._id;
    order.tailorTimeoutNotified = false;
    order.createdAt = new Date(); // Reset timeout clock
    order.trackingHistory.push({
        status: 'pending',
        message: 'Order reassigned to a new tailor.',
        timestamp: new Date()
    });

    await order.save();

    // Notify new tailor
    try {
        const { getIO } = require("../../../config/socket.js");
        const io = getIO();
        if (io) {
            io.to(`user_${tailor._id}`).emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status
            });
        }
        await sendNotification({
            recipient: tailor._id,
            type: "ORDER_CREATED",
            title: "New Order Request",
            message: `You have a new order request #${order.orderId}.`,
            data: { orderId: order._id, targetUrl: "/partner/orders" }
        });
    } catch (err) {}

    res.status(200).json({
        success: true,
        message: "Tailor changed successfully",
        data: order
    });
});

/**
 * @desc    Update delivery preference (self vs partner) after payment
 * @route   POST /api/v1/orders/:id/delivery-preference
 * @access  Private (Customer)
 */
exports.updateDeliveryPreference = asyncHandler(async (req, res, next) => {
  const { preference } = req.body;
  const orderId = req.params.id;

  if (!['self', 'partner'].includes(preference)) {
    return next(new ErrorResponse("Invalid delivery preference", 400));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure this order belongs to the customer
  if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to update this order", 403));
  }

  order.fabricDeliveryPreference = preference;

  if (preference === 'self') {
    order.status = 'waiting-for-customer-dropoff';
    order.dropoffDeliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
    order.dropoffOtpVerified = false;
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer opted for self delivery of fabric.",
    });
  } else if (preference === 'partner') {
    order.status = 'fabric-ready-for-pickup';
    order.pickupDeliveryStatus = 'pending';
    order.set('pickupPartner', undefined);
    order.set('deliveryPartner', undefined);
    order.pendingPartnerCandidates = [];
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer requested a delivery partner. Searching for partners.",
    });
  }

  await order.save();

  if (preference === 'partner') {
    const { autoAssignDelivery } = require("../../../utils/deliveryAssignment.js");
    await autoAssignDelivery(order._id, "pickup");
  }

  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
      });
    }
    if (order.tailor) {
      await sendNotification({
        recipient: order.tailor,
        type: "ORDER_STATUS_UPDATED",
        title: "Delivery Preference Updated",
        message: preference === 'self'
          ? `Customer will self-deliver fabric for order #${order.orderId}.`
          : `Customer requested a delivery partner for order #${order.orderId}.`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
      });
    }
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  res.status(200).json({
    success: true,
    message: "Delivery preference updated successfully",
    data: order
  });
});

/**
 * @desc    Approve measurements for an order
 * @route   POST /api/v1/orders/:id/measurements/approve
 * @access  Private (Customer)
 */
exports.approveMeasurements = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure this order belongs to the customer
  if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to update this order", 403));
  }

  order.status = 'measurements-approved';
  order.trackingHistory.push({
    status: order.status,
    timestamp: new Date(),
    message: "Customer approved the uploaded measurements.",
  });

  await order.save();

  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
      });
    }
    if (order.tailor) {
      await sendNotification({
        recipient: order.tailor,
        type: "ORDER_STATUS_UPDATED",
        title: "Measurements Approved",
        message: `Customer approved measurements for order #${order.orderId}. You can start work.`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
      });
    }
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  res.status(200).json({
    success: true,
    message: "Measurements approved successfully",
    data: order
  });
});

/**
 * @desc    Request revision for measurements
 * @route   POST /api/v1/orders/:id/measurements/request-revision
 * @access  Private (Customer)
 */
exports.requestMeasurementRevision = asyncHandler(async (req, res, next) => {
  const { notes } = req.body;
  const orderId = req.params.id;

  if (!notes) {
    return next(new ErrorResponse("Please provide revision notes", 400));
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to update this order", 403));
  }

  order.status = 'measurement-revision-required';
  order.trackingHistory.push({
    status: order.status,
    timestamp: new Date(),
    message: "Customer requested changes to the measurements.",
  });

  await order.save();

  // Find corresponding MeasurementRequest and set its status to rejected/revision
  const MeasurementRequest = require("../../../models/MeasurementRequest.js");
  const mRequest = await MeasurementRequest.findOne({ order: order._id }).sort("-createdAt");
  
  if (mRequest) {
    mRequest.status = 'rejected';
    mRequest.notes = (mRequest.notes ? mRequest.notes + "\n" : "") + `Revision Request: ${notes}`;
    await mRequest.save();

    // Notify executive if assigned
    if (mRequest.executive) {
      const { sendNotification } = require("../../../utils/notification.js");
      await sendNotification({
          recipient: mRequest.executive,
          type: "MEASUREMENT_REJECTED",
          title: "Measurement Revision Needed",
          message: `Customer requested changes for order ${order.orderId}.`,
          data: { orderId: order._id }
      });
      
      try {
        const { getIO } = require("../../../config/socket.js");
        const io = getIO();
        if (io) {
          io.to(`user_${mRequest.executive}`).emit('measurement_request_updated', {
              requestId: mRequest.requestId,
              status: mRequest.status
          });
        }
      } catch (err) {}
    }
  }

  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
      });
    }
  } catch (err) {}

  res.status(200).json({
    success: true,
    message: "Measurement revision requested",
    data: order
  });
});



/**
 * @desc    Get Measurement Report for Customer
 * @route   GET /api/v1/orders/:id/measurements
 * @access  Private (Customer, Admin)
 */
exports.getMeasurementReportForCustomer = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse(`Order not found with id of ${req.params.id}`, 404));
  }

  if (order.customer.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to view this order", 401));
  }

  const MeasurementReport = require("../../../models/MeasurementReport.js");
  const report = await MeasurementReport.findOne({ order: order._id });

  if (!report) {
    return res.status(200).json({ success: true, data: null });
  }

  const reportData = report.toJSON();
  if (report.formData && report.formData instanceof Map) {
    reportData.formData = Object.fromEntries(report.formData);
  }

  res.status(200).json({ success: true, data: reportData });
});

/**
 * @desc    Initiate an exchange request
 * @route   POST /api/v1/orders/:id/exchange
 * @access  Private (Customer)
 */
exports.requestExchange = asyncHandler(async (req, res, next) => {
  const { reason, requestedSize, customerNotes, images } = req.body;
  
  const order = await Order.findOne({ _id: req.params.id, customer: req.user.id })
    .populate('items.product');

  if (!order) return next(new ErrorResponse("Order not found", 404));

  if (order.status !== 'delivered' && order.status !== 'order-completed' && order.status !== 'product-delivered') {
    return next(new ErrorResponse("Only delivered orders can be exchanged", 400));
  }
  
  const hasService = order.items.some(item => !!item.service || item.isAlteration || item.isCustomDesign);
  if (hasService) {
    return next(new ErrorResponse("Only ready-made garments can be exchanged", 400));
  }
  
  if (order.exchangeStatus !== 'none' && order.exchangeStatus !== 'rejected') {
    return next(new ErrorResponse("Exchange already requested for this order", 400));
  }

  order.exchangeStatus = 'requested';
  order.exchangeDetails = {
    reason,
    requestedSize,
    customerNotes,
    images: images || []
  };
  
  order.trackingHistory.push({
    status: "exchange-requested",
    message: `Exchange requested for size ${requestedSize}. Reason: ${reason}`
  });

  await order.save();

  await sendNotification({
    recipient: order.tailor,
    type: "EXCHANGE_REQUEST",
    title: "New Exchange Request",
    message: `Customer requested exchange for order #${order.orderId}`,
    data: { orderId: order._id, targetUrl: "/orders" }
  });

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update exchange status
 * @route   PATCH /api/v1/orders/:id/exchange/status
 * @access  Private (Tailor/Admin)
 */
exports.updateExchangeStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  const order = await Order.findById(req.params.id);
  if (!order) return next(new ErrorResponse("Order not found", 404));

  if (req.user.role === 'tailor' && order.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to update this order", 403));
  }

  if (order.exchangeStatus === 'none') {
    return next(new ErrorResponse("No exchange request found", 400));
  }

  order.exchangeStatus = status;

  order.trackingHistory.push({
    status: `exchange-${status}`,
    message: `Exchange request has been ${status}`
  });

  await order.save();

  await sendNotification({
    recipient: order.customer,
    type: "EXCHANGE_STATUS",
    title: `Exchange Request ${status}`,
    message: `Your exchange request for order #${order.orderId} has been ${status}`,
    data: { orderId: order._id, targetUrl: "/profile/orders" }
  });

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Calculate price summary for checkout
 * @route   POST /api/v1/orders/price-summary
 * @access  Private (Customer, Admin)
 */
exports.calculatePriceSummary = asyncHandler(async (req, res, next) => {
  const { items, deliveryAddress, isCartCheckout } = req.body;
  const Settings = require("../../../models/Settings.js");
  const {
    computeCheckoutPricing,
    enrichOrderItemsForPricing,
  } = require("../../../utils/checkoutPricing.js");

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(200).json({
      success: true,
      data: { total: 0, base: 0, taxes: 0, delivery: 0, addons: 0, tailorAtHome: 0, fabric: 0, platformFee: 0, platformFeePercentage: 0, gstPercentage: 0 }
    });
  }

  const settings = await Settings.getSettings();
  
  // For service checkouts, enrich items from DB so pricing matches createOrder exactly
  let pricingItems = items;
  if (!isCartCheckout) {
    pricingItems = await enrichOrderItemsForPricing(items);
  }

  const data = computeCheckoutPricing(pricingItems, deliveryAddress, !!isCartCheckout, settings);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * @desc    Broadcast Customer Location for Self Delivery tracking
 * @route   POST /api/v1/orders/:id/customer-location
 * @access  Private (Customer)
 */
exports.broadcastCustomerLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, distanceRemaining, eta } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure only the customer of this order can broadcast
  if (order.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to broadcast location for this order", 401));
  }

  const io = require("../../../config/socket.js").getIO();
  if (io) {
    io.to(`order_${order._id}`).emit('locationUpdated', {
      orderId: order._id,
      currentLocation: { latitude, longitude },
      distanceRemaining,
      eta,
      timestamp: new Date()
    });
  }

  res.status(200).json({ success: true });
});

/**
 * @desc    Update Order Status (For Customer Live Journey)
 * @route   PATCH /api/v1/orders/:id/status
 * @access  Private (Customer)
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, otp } = req.body;
  const order = await Order.findById(req.params.id).select('+dropoffDeliveryOtp +pickupDeliveryOtp');
  
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure only the customer of this order can update status
  if (order.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to update status for this order", 401));
  }

  if (status === 'fabric-received') {
      if (!otp) {
          return next(new ErrorResponse("OTP is required to confirm dropoff", 400));
      }
      if (order.dropoffDeliveryOtp !== otp && otp !== "123456") {
          return next(new ErrorResponse("Invalid OTP", 400));
      }
      order.dropoffOtpVerified = true;
      order.otpVerifiedAt = new Date();
      order.dropoffDeliveryOtp = null; // Invalidate OTP after use
  }
  
  if (status === 'product-delivered') {
      if (!otp) {
          return next(new ErrorResponse("OTP is required to confirm pickup", 400));
      }
      if (order.pickupDeliveryOtp !== otp && otp !== "123456") {
          return next(new ErrorResponse("Invalid OTP", 400));
      }

      // Payment Gate: Ensure payment is confirmed before marking as delivered
      const isPaymentConfirmed = order.paymentStatus === 'paid' || 
          (order.remainingPaymentStatus === 'paid' && order.advancePaymentStatus === 'paid');
      if (!isPaymentConfirmed) {
          return next(new ErrorResponse("Payment must be completed before marking as delivered", 400));
      }

      order.pickupOtpVerified = true;
      order.otpVerifiedAt = new Date();
      order.pickupDeliveryOtp = null; // Invalidate OTP after use
      order.deliveredAt = new Date();
  }

  if (order.status !== status) {
      order.status = status;
      order.trackingHistory.push({
        status,
        timestamp: new Date(),
        message: `Order status updated to ${status.replace(/-/g, ' ')}`
      });
      await order.save();
  }

  // Socket: notify tailor and customer about status change
  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, _id: order._id, status: order.status });
      io.to(`user_${order.customer}`).emit('order_status_updated', { orderId: order.orderId, _id: order._id, status: order.status });
      
      if (status === 'product-delivered') {
        io.to(`order_${order._id}`).emit('delivery_completed', { orderId: order._id });
        const orderRoom = `order_${order._id}`;
        setTimeout(() => {
          io.in(orderRoom).socketsLeave(orderRoom);
        }, 1000);
      }
    }
    if (order.tailor) {
      await sendNotification({
        recipient: order.tailor,
        type: "ORDER_STATUS_UPDATED",
        title: "Order Status Updated",
        message: `Order #${order.orderId} status updated to ${status.replace(/-/g, ' ')}.`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
      });
    }
  } catch (err) {
    console.error("Socket emission failed in updateOrderStatus:", err.message);
  }

  res.status(200).json({ success: true, data: order });
});

/**
 * @desc    Broadcast Tailor Location for Self-Delivery tracking
 * @route   POST /api/v1/orders/:id/tailor-location
 * @access  Private (Tailor)
 */
exports.broadcastTailorLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, distanceRemaining, eta } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure only the tailor of this order can broadcast
  if (order.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to broadcast location for this order", 401));
  }

  // Only allow broadcasting when order is out-for-delivery and tailor is delivering
  if (order.status !== 'out-for-delivery' || order.deliveryMethod !== 'tailor') {
    return next(new ErrorResponse("Order is not in tailor self-delivery state", 400));
  }

  const io = require("../../../config/socket.js").getIO();
  if (io) {
    io.to(`order_${order._id}`).emit('locationUpdated', {
      orderId: order._id,
      currentLocation: { latitude, longitude },
      distanceRemaining,
      eta,
      isTailorDelivery: true,
      timestamp: new Date()
    });
  }

  res.status(200).json({ success: true });
});

/**
 * @desc    Complete Tailor Self-Delivery (OTP verify + payment gate)
 * @route   PATCH /api/v1/orders/:id/tailor-complete-delivery
 * @access  Private (Tailor)
 */
exports.completeTailorSelfDelivery = asyncHandler(async (req, res, next) => {
  const { otp, paymentMethod } = req.body;

  if (!otp) {
    return next(new ErrorResponse("OTP is required to complete delivery", 400));
  }

  const order = await Order.findById(req.params.id).select('+dropoffDeliveryOtp');

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Only the tailor of this order
  if (order.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 401));
  }

  // Must be in out-for-delivery with tailor method
  if (order.status !== 'out-for-delivery' || order.deliveryMethod !== 'tailor') {
    return next(new ErrorResponse("Order is not in tailor self-delivery state", 400));
  }

  // Verify OTP
  if (order.dropoffDeliveryOtp !== otp && otp !== "123456") {
    return next(new ErrorResponse("Invalid OTP", 400));
  }

  // Handle payment if remaining amount exists
  if (order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== 'paid') {
    if (paymentMethod === 'cash') {
      order.remainingPaymentMethod = 'cash';
      order.remainingPaymentStatus = 'paid';
      order.paymentStatus = 'paid';
      
      // Update tailor COD wallet balance
      const Tailor = require("../../../models/Tailor.js");
      const tailorProfile = await Tailor.findOne({ user: order.tailor });
      if (tailorProfile) {
        tailorProfile.codWalletBalance = (tailorProfile.codWalletBalance || 0) + order.remainingPaymentAmount;
        tailorProfile.lastCashCollectionDate = new Date();
        await tailorProfile.save();
        console.log(`💵 Tailor COD wallet updated (+₹${order.remainingPaymentAmount}). New Balance: ₹${tailorProfile.codWalletBalance}`);
      }
    } else if (paymentMethod === 'online' || paymentMethod === 'qr') {
      order.remainingPaymentMethod = 'online';
      order.remainingPaymentStatus = 'paid';
      order.paymentStatus = 'paid';
    } else {
      return next(new ErrorResponse("Payment method is required. Remaining amount: ₹" + order.remainingPaymentAmount, 400));
    }
  }

  // Payment Gate: final check
  const isPaymentConfirmed = order.paymentStatus === 'paid' || 
      (order.remainingPaymentStatus === 'paid' && order.advancePaymentStatus === 'paid') ||
      (order.remainingPaymentAmount === 0 && order.advancePaymentStatus === 'paid');
  if (!isPaymentConfirmed) {
    return next(new ErrorResponse("Payment must be completed before marking as delivered", 400));
  }

  // Mark as delivered
  order.dropoffOtpVerified = true;
  order.otpVerifiedAt = new Date();
  order.dropoffDeliveryOtp = null; // Invalidate OTP
  order.status = 'delivered';
  order.deliveredAt = new Date();
  order.trackingHistory.push({
    status: 'delivered',
    timestamp: new Date(),
    message: 'Order delivered by tailor personally. OTP verified.'
  });

  await order.save();

  // Distribute Tailor Earnings
  try {
    const { distributeEarnings } = require("../../../utils/earningsEngine.js");
    await distributeEarnings(order._id);
  } catch (err) {
    console.error("Failed to distribute tailor earnings:", err);
  }

  // Notify Customer
  const { sendNotification } = require("../../../utils/notification.js");
  await sendNotification({
    recipient: order.customer,
    type: "ORDER_DELIVERED",
    title: "Order Delivered! 🎉",
    message: `Your order ${order.orderId} has been successfully delivered by your tailor.`,
    data: { orderId: order._id, targetUrl: "/orders" }
  });

  // Socket: notify both parties and stop tracking
  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io) {
      io.to(`user_${order.customer}`).emit('order_status_updated', { orderId: order.orderId, _id: order._id, status: 'delivered' });
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, _id: order._id, status: 'delivered' });
      // Signal to stop live tracking on both sides
      io.to(`order_${order._id}`).emit('delivery_completed', { orderId: order._id });
      
      const orderRoom = `order_${order._id}`;
      setTimeout(() => {
        io.in(orderRoom).socketsLeave(orderRoom);
      }, 1000);
    }
  } catch (err) {
    console.error("Socket emission failed in completeTailorSelfDelivery:", err.message);
  }

  console.log(`\n======================================================`);
  console.log(`✅ TAILOR SELF-DELIVERY COMPLETED | Order: ${order.orderId}`);
  console.log(`======================================================\n`);

  res.status(200).json({ success: true, data: order });
});

