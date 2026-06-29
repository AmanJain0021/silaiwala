const Order = require("../../../models/Order");
const mongoose = require("mongoose");
const User = require("../../../models/User");
const Tailor = require("../../../models/Tailor");
const Customer = require("../../../models/Customer");
const WalletTransaction = require("../../../models/WalletTransaction");
const Settings = require("../../../models/Settings");
const PaymentLedger = require("../../../models/PaymentLedger");
const { getIO } = require("../../../config/socket");
const crypto = require("crypto");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const razorpay = require("../../../config/razorpay");

const PromoCode = require("../../../models/PromoCode");
const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");
const axios = require("axios");

const autoGeocode = async (addressObj) => {
  if (!addressObj) return addressObj;
  // If coordinates already exist, skip
  if (addressObj.location && addressObj.location.coordinates && addressObj.location.coordinates.length === 2 && addressObj.location.coordinates[0] !== null) {
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
       
       // Change status to trigger pickup
       const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
       let nextStatus = 'in-progress';
       
       if (order.isMeasurementHome) {
           nextStatus = 'measurement-requested';
       } else if (fabricPickupRequired) {
           nextStatus = 'fabric-ready-for-pickup';
       }
       
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
           data: { orderId: order._id, targetUrl: "/orders" }
       });
       
       // Emit socket
       const { getIO } = require("../../../config/socket");
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
       order.status = order.items.some(item => item.fabricSource === 'customer') ? 'fabric-ready-for-pickup' : 'in-progress';
       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Full payment of ₹${order.totalAmount} successful. Order accepted.`,
       });
       await sendNotification({
           recipient: order.tailor,
           type: "ORDER_CREATED",
           title: "Full Payment Received - Start Order!",
           message: `Customer has paid in full for ${order.orderId}. You can start processing.`,
           data: { orderId: order._id, targetUrl: "/orders" }
       });

       // Emit socket
       const { getIO } = require("../../../config/socket");
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
       order.status = order.items.some(item => item.fabricSource === 'customer') ? 'fabric-ready-for-pickup' : 'in-progress';
       
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

    await order.save({ session });

    await sendNotification({
        recipient: order.customer,
        type: "PAYMENT_SUCCESS",
        title: "Order Placed Successfully!",
        message: `Your payment for order ${order.orderId} was successful. Our tailor will start working on it soon.`,
        data: { orderId: order._id, targetUrl: "/profile/orders" }
    });

    // Note: Auto-assignment is no longer triggered here. 
    // The customer must select their delivery preference ('self' or 'partner') via a separate endpoint.

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
                await referrerProfile.save({ session });

                await WalletTransaction.create([{
user: referrerProfile.user,
                    amount: REFERRER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: `Bonus for referring ${customerProfile.user.name || 'a new user'}`
}], { session });

                // 2. Reward New Customer
                customerProfile.walletBalance += CUSTOMER_BONUS;
                await WalletTransaction.create([{
user: customerProfile.user,
                    amount: CUSTOMER_BONUS,
                    type: "credit",
                    category: "referral_bonus",
                    description: "Welcome bonus from referral"
}], { session });
            }
        }
        await customerProfile.save({ session });
    } else if (customerProfile) {
        customerProfile.totalOrders += 1;
        await customerProfile.save({ session });
    }
    // ---------------------
    await session.commitTransaction();
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
      const Service = require("../../../models/Service");
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
              
              const { getDistanceFromLatLonInKm } = require("../../../utils/haversine");
              // Mongoose points are [lng, lat]
              const distance = getDistanceFromLatLonInKm(
                  customerCoords[1], customerCoords[0],
                  tailorCoords[1], tailorCoords[0]
              );
              
              const settings = await Settings.getSettings();
              const baseFee = settings?.deliveryRates?.baseFee || 20;
              const perKmRate = settings?.deliveryRates?.perKmRate || 10;
              
              const consultationFee = baseFee + (Math.ceil(distance) * perKmRate);
              totalAmount = consultationFee;
              if (items && items.length > 0) {
                  items[0].price = consultationFee;
              }
          }
      }
  }

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
    measurements: item.measurements || {},
    styleAddons: item.addons || []
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
        } else if (paymentType === 'full') {
       order.advancePaymentStatus = "paid";
       order.advancePaymentId = razorpay_payment_id;
       order.advancePaymentAmount = order.totalAmount;
       order.remainingPaymentStatus = "paid";
       order.remainingPaymentId = razorpay_payment_id;
       order.remainingPaymentAmount = 0;
       
       transitionOrder(order, 'accepted', `Full payment of ₹${order.totalAmount} successful. Order accepted.`, true);

       await sendNotification({
           recipient: order.tailor,
           type: "ORDER_CREATED",
           title: "Full Payment Received - Start Order!",
           message: `Customer has paid in full for ${order.orderId}. You can start processing.`,
           data: { orderId: order._id, targetUrl: "/orders" }
       });

       // Emit socket
       const { getIO } = require("../../../config/socket");
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
               
               await WalletTransaction.create({
                   user: tailorProfile.user,
                   amount: tailorShare,
                   type: 'credit',
                   category: 'full_payment',
                   order: order._id,
                   description: `Full payment received for Order ${order.orderId} (less platform fee)`
               });
               tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + tailorShare;
               await tailorProfile.save();
           }
       } catch (walletErr) {
           console.error("Wallet credit error (Full Payment):", walletErr);
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

  // 6. Compute GST from Settings
  const settings = await Settings.getSettings();
  const gstPct = settings?.pricing?.gstPercentage || 5;
  const baseAmountForGST = finalAmount - (deliveryFee || 0); // GST on order amount, not delivery
  const gstAmount = Math.round((baseAmountForGST * gstPct) / (100 + gstPct)); // GST inclusive extraction

  // 7. Generate transaction ID
  const transactionId = `TXN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

  // 8. Create Order with optimized object
  const order = await Order.create({
    orderId,
    customer: finalCustomerId,
    tailor: targetTailorUserId,
    items: formattedItems,
    totalAmount: finalAmount,
    deliveryFee: deliveryFee || 0,
    gstAmount,
    gstPercentage: gstPct,
    transactionId,
    discountAmount,
    couponCode: promoCode,
    deliveryAddress,
    status: initialStatus,
    fabricPickupRequired,
    isMeasurementHome: isMeasurementHome || formattedItems.some(item => item.measurements?.type === 'home'),
    isBridalConsultation: isBridalConsultation || false,
    bridalNotes,
    bridalDate,
    bridalTime,
    trackingHistory: [{ 
        status: initialStatus, 
        message: "Waiting for the tailor to accept the order before assigning a delivery partner."
    }],
  });

  // Auto-assignment is now deferred until after payment in verifyPayment.

  // 7. Socket Emission and Notification for Tailor
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

    await sendNotification({
        recipient: targetTailorUserId,
        type: "ORDER_CREATED",
        title: "New Order Placed",
        message: `A new order ${order.orderId} has been placed. Please accept or reject it.`,
        data: { orderId: order._id, targetUrl: "/orders" }
    });
  } catch (err) {
    console.error("Socket/Notification emission failed in createOrder:", err.message);
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
  query = { customer: req.user.id, isRework: { $ne: true } };

    const orders = await Order.find(query)
      .populate("tailor", "name shopName profileImage")
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
      if (tailorDoc?.location?.coordinates?.length >= 2) {
        vendorLongitude = tailorDoc.location.coordinates[0];
        vendorLatitude = tailorDoc.location.coordinates[1];
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
    
    return {
      ...order,
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
    .populate("tailor", "name shopName phoneNumber")
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
    if (tailorDoc?.location?.coordinates?.length >= 2) {
      vendorLongitude = tailorDoc.location.coordinates[0];
      vendorLatitude = tailorDoc.location.coordinates[1];
    }
  }

  if (order.customer?._id) {
    const customerDoc = await Customer.findOne({ user: order.customer._id }).lean();
    if (customerDoc?.addresses?.length > 0) {
      // Find the address that matches the delivery address or default
      const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
      if (defaultAddress?.location?.coordinates?.length >= 2) {
        customerLongitude = defaultAddress.location.coordinates[0];
        customerLatitude = defaultAddress.location.coordinates[1];
      }
    }
  }

  // Fetch Measurement OTP if the order is in measurement-accepted phase and user is customer
  let measurementOtp = null;
  if (order.isMeasurementHome && order.customer?._id?.toString() === req.user.id) {
      const MeasurementRequest = require("../../../models/MeasurementRequest");
      const mReq = await MeasurementRequest.findOne({ order: order._id }).select('+otp').sort({ createdAt: -1 }).lean();
      if (mReq && ['otp_sent', 'accepted'].includes(mReq.status) && mReq.otp) {
          measurementOtp = mReq.otp;
      }
  }

  // Check if an issue exists for this order
  let reportedIssue = null;
  try {
      const Issue = require("../../../models/Issue");
      reportedIssue = await Issue.findOne({ originalOrder: order._id }).lean();
  } catch (err) {
      console.error("Error checking for existing issue:", err);
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
        const Tailor = require("../../../models/Tailor");
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
        const { getIO } = require("../../../config/socket");
        const io = getIO();
        if (io) {
            io.to(`user_${tailor._id}`).emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                totalAmount: order.totalAmount,
                status: order.status
            });
        }
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
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer opted for self delivery of fabric.",
    });
  } else if (preference === 'partner') {
    order.status = 'fabric-ready-for-pickup';
    // If partner, trigger auto-assignment
    const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");
    await autoAssignDelivery(order._id, "pickup");
    
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer requested a delivery partner. Searching for partners.",
    });
  }

  await order.save();

  try {
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
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
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
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
  const MeasurementRequest = require("../../../models/MeasurementRequest");
  const mRequest = await MeasurementRequest.findOne({ order: order._id }).sort("-createdAt");
  
  if (mRequest) {
    mRequest.status = 'rejected';
    mRequest.notes = (mRequest.notes ? mRequest.notes + "\n" : "") + `Revision Request: ${notes}`;
    await mRequest.save();

    // Notify executive if assigned
    if (mRequest.executive) {
      const { sendNotification } = require("../../../utils/notification");
      await sendNotification({
          recipient: mRequest.executive,
          type: "MEASUREMENT_REJECTED",
          title: "Measurement Revision Needed",
          message: `Customer requested changes for order ${order.orderId}.`,
          data: { orderId: order._id }
      });
      
      try {
        const { getIO } = require("../../../config/socket");
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
    const { getIO } = require("../../../config/socket");
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
    return next(new ErrorResponse("Order not found", 404));
  }

  // Ensure this order belongs to the customer
  if (order.customer.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse("Not authorized to update this order", 403));
  }

  order.fabricDeliveryPreference = preference;

  if (preference === 'self') {
    order.status = 'waiting-for-customer-dropoff';
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer opted for self delivery of fabric.",
    });
  } else if (preference === 'partner') {
    order.status = 'fabric-ready-for-pickup';
    // If partner, trigger auto-assignment
    const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");
    await autoAssignDelivery(order._id, "pickup");
    
    order.trackingHistory.push({
      status: order.status,
      timestamp: new Date(),
      message: "Customer requested a delivery partner. Searching for partners.",
    });
  }

  await order.save();

  try {
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
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
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io && order.tailor) {
      io.to(`user_${order.tailor}`).emit('order_status_updated', {
          orderId: order.orderId,
          status: order.status
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
  const MeasurementRequest = require("../../../models/MeasurementRequest");
  const mRequest = await MeasurementRequest.findOne({ order: order._id }).sort("-createdAt");
  
  if (mRequest) {
    mRequest.status = 'rejected';
    mRequest.notes = (mRequest.notes ? mRequest.notes + "\n" : "") + `Revision Request: ${notes}`;
    await mRequest.save();

    // Notify executive if assigned
    if (mRequest.executive) {
      const { sendNotification } = require("../../../utils/notification");
      await sendNotification({
          recipient: mRequest.executive,
          type: "MEASUREMENT_REJECTED",
          title: "Measurement Revision Needed",
          message: `Customer requested changes for order ${order.orderId}.`,
          data: { orderId: order._id }
      });
      
      try {
        const { getIO } = require("../../../config/socket");
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
    const { getIO } = require("../../../config/socket");
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

  const MeasurementReport = require("../../../models/MeasurementReport");
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
