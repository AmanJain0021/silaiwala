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

  if (razorpay_signature === expectedSign) {
    // Payment verified
    const order = await Order.findById(orderObjectId);
    if (!order) {
      return next(new ErrorResponse("Order not found during verification", 404));
    }

    if (paymentType === 'advance') {
       order.advancePaymentStatus = "paid";
       order.advancePaymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       
       // Change status to trigger pickup
       const fabricPickupRequired = order.items.some(item => item.fabricSource === 'customer');
       order.status = fabricPickupRequired ? 'fabric-ready-for-pickup' : 'in-progress';
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
               const advanceAmount = order.advancePaymentAmount || 0;
               tailorProfile.walletBalance = (tailorProfile.walletBalance || 0) + advanceAmount;
               await tailorProfile.save();

               await WalletTransaction.create({
                   user: order.tailor,
                   amount: advanceAmount,
                   type: "credit",
                   category: "advance_payment",
                   order: order._id,
                   description: `Advance payment received for order ${order.orderId}`
               });
               console.log(`Credited ₹${advanceAmount} advance to Tailor ${order.tailor}`);
           }
       } catch (err) {
           console.error("Failed to credit advance payment to Tailor:", err);
       }
       // -----------------------------------------------

    } else if (paymentType === 'remaining') {
       order.remainingPaymentStatus = "paid";
       order.remainingPaymentMethod = "online";
       order.remainingPaymentId = razorpay_payment_id;
       
       // Calculate fees
       const platformFee = Math.round(order.totalAmount * 0.1);
       const deliveryFee = order.deliveryFee || 50; 
       order.platformFee = platformFee;
       order.deliveryFee = deliveryFee;
       
       // Note: Final order delivery completion might happen later or be triggered by delivery partner.
       // The remaining payment is usually paid when the rider is at the door, 
       // but completing the delivery itself is handled by Delivery Controller.
       
       order.paymentStatus = "paid"; // Overall payment complete

       order.trackingHistory.push({
         status: order.status,
         timestamp: new Date(),
         message: `Remaining payment of ₹${order.remainingPaymentAmount} successful.`,
       });

       await sendNotification({
           recipient: order.tailor,
           type: "PAYMENT_COMPLETED",
           title: "Final Payment Received",
           message: `Customer has paid the remaining balance for ${order.orderId}.`,
           data: { orderId: order._id, targetUrl: "/orders" }
       });
    } else {
       // Legacy fallback or fully upfront payment
       order.paymentStatus = "paid";
       order.paymentId = razorpay_payment_id;
       order.razorpayOrderId = razorpay_order_id;
       order.status = order.items.some(item => item.fabricSource === 'customer') ? 'fabric-ready-for-pickup' : 'in-progress';
    }

    await order.save();

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
  let { tailorId, items, totalAmount, deliveryAddress, promoCode, customerId, deliveryFee } = req.body;

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
    deliveryFee: deliveryFee || 0,
    discountAmount,
    couponCode: promoCode,
    deliveryAddress,
    status: initialStatus,
    fabricPickupRequired,
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
  query = { customer: req.user.id };

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

  res.status(200).json({
    success: true,
    data: {
      ...order,
      vendorLatitude,
      vendorLongitude,
      customerLatitude,
      customerLongitude
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

  res.status(200).json({
    success: true,
    message: "Delivery preference updated successfully",
    data: order
  });
});
