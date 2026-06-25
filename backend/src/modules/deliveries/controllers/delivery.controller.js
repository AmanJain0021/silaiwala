const mongoose = require("mongoose");
const Delivery = require("../../../models/Delivery");
const Order = require("../../../models/Order");
const { transitionOrder } = require("../../../utils/orderStateMachine");
const User = require("../../../models/User");
const Tailor = require("../../../models/Tailor");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * @desc    Get currently logged-in delivery partner profile
 * @route   GET /api/v1/deliveries/me
 * @access  Private (Delivery)
 */
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ user: req.user.id }).populate(
    "user",
    "name email phoneNumber profileImage"
  );

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

/**
 * @desc    Update delivery profile
 * @route   PATCH /api/v1/deliveries/profile
 * @access  Private (Delivery)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { vehicleType, vehicleNumber, name, email, phoneNumber, bankDetails, emergencyContact, profileImage } = req.body;

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Update Delivery fields
  if (vehicleType) delivery.vehicleType = vehicleType;
  if (vehicleNumber) delivery.vehicleNumber = vehicleNumber;
  if (bankDetails) {
    delivery.bankDetails = {
      ...delivery.bankDetails,
      ...bankDetails
    };
  }
  if (emergencyContact) delivery.emergencyContact = emergencyContact;

  await delivery.save();

  // Update User fields if provided
  if (name || email || phoneNumber || profileImage) {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profileImage) user.profileImage = profileImage;
    await user.save();
  }

  const updatedProfile = await Delivery.findOne({ user: req.user.id }).populate(
    "user",
    "name email phoneNumber profileImage"
  );

  res.status(200).json({
    success: true,
    data: updatedProfile,
  });
});

/**
 * @desc    Toggle availability and update location
 * @route   PATCH /api/v1/deliveries/status
 * @access  Private (Delivery)
 */
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { isAvailable, status, lat, lng, eta, distanceRemaining, address } = req.body;

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  if (isAvailable !== undefined) delivery.isAvailable = isAvailable;
  if (address) delivery.currentAddress = address;
  if (status) {
    let finalStatus = status;
    if (status === 'available') finalStatus = 'active';
    if (status === 'offline') finalStatus = 'inactive';
    delivery.status = finalStatus;
  }

  if (lat && lng) {
    delivery.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };

    // Update active DeliveryTracking documents
    const DeliveryTracking = require("../../../models/DeliveryTracking");
    const Order = require("../../../models/Order");
    const { getIO } = require("../../../config/socket");

    // Find active orders for this rider
    const activeOrders = await Order.find({
      $or: [
        { pickupPartner: req.user.id, pickupDeliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'] } },
        { dropoffPartner: req.user.id, dropoffDeliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'] } },
        { deliveryPartner: req.user.id, deliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff'] } }
      ]
    }).select('_id');

    const io = getIO();

    for (const order of activeOrders) {
      let tracking = await DeliveryTracking.findOne({ orderId: order._id });
      if (!tracking) {
        tracking = new DeliveryTracking({
          orderId: order._id,
          deliveryPartnerId: req.user.id,
        });
      }

      // Add to history if moved significantly (simple distance check, or just push)
      // To avoid massive arrays, we could throttle, but we'll trust frontend throttling
      const newLoc = { latitude: parseFloat(lat), longitude: parseFloat(lng), timestamp: new Date() };
      
      tracking.currentLocation = { latitude: newLoc.latitude, longitude: newLoc.longitude };
      tracking.locationHistory.push(newLoc);
      if (eta) tracking.eta = eta;
      if (distanceRemaining !== undefined) tracking.distanceRemaining = distanceRemaining;
      tracking.lastUpdated = new Date();
      await tracking.save();

      // Emit socket event to the order room
      io.to(`order_${order._id}`).emit('locationUpdated', {
        orderId: order._id,
        deliveryPartnerId: req.user.id,
        currentLocation: tracking.currentLocation,
        eta: tracking.eta,
        distanceRemaining: tracking.distanceRemaining,
        timestamp: newLoc.timestamp
      });
    }
  }

  await delivery.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

/**
 * @desc    Get assigned orders for the delivery partner
 * @route   GET /api/v1/deliveries/orders
 * @access  Private (Delivery)
 */
exports.getAssignedOrders = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = { 
    $or: [
      { deliveryPartner: req.user.id },
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id }
    ]
  };

  if (status) {
    query.status = status;
  } else {
    // Default show active deliveries (both fabric pickup and final delivery)
    // Include 'ready-for-delivery' so partners can see tasks awaiting acceptance
    query.status = { $in: ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "ready-for-delivery", "out-for-delivery"] };
  }

  let orders = await Order.find(query)
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();

  // FILTER OUT orders where the current phase does not match the specific partner assignment
  // This prevents the pickup partner from seeing the order in Active Dispatch during the dropoff phase
  orders = orders.filter(order => {
    const isPickupPhase = ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const isDropoffPhase = ["ready", "ready-for-pickup", "ready-for-delivery", "out-for-delivery"].includes(order.status);

    if (isPickupPhase) {
      return (order.pickupPartner?.toString() === req.user.id) || 
             (!order.pickupPartner && order.deliveryPartner?.toString() === req.user.id);
    }
    
    if (isDropoffPhase) {
      return (order.dropoffPartner?.toString() === req.user.id) || 
             (!order.dropoffPartner && !order.fabricPickupRequired && order.deliveryPartner?.toString() === req.user.id);
    }

    return true; // For any other statuses (like delivered), return them if they somehow match the initial db query
  });



  // Enrich each order with Tailor profile data (shopName, location, phone)
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    // Determine taskType based on status AND fabricPickupRequired flag
    const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

    let tailorProfile = null;
    let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
    if (order.tailor) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
        if (tailorProfile.location?.coordinates?.length >= 2) {
            vendorLongitude = tailorProfile.location.coordinates[0];
            vendorLatitude = tailorProfile.location.coordinates[1];
        }
      } else {
        const User = require("../../../models/User");
        const tailorUser = await User.findById(order.tailor).lean();
        if (tailorUser) {
          tailorProfile = {
            _id: order.tailor,
            shopName: tailorUser.name || 'Tailor Workshop',
            phone: tailorUser.phoneNumber,
            location: null
          };
          vendorName = tailorProfile.shopName;
          vendorAddress = 'Tailor Address Not Provided';
          vendorPhone = tailorProfile.phone;
        } else {
          vendorName = "Silaiwala Hub";
          vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
          vendorPhone = "N/A";
        }
      }
    } else {
      vendorName = "Silaiwala Hub";
      vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
      vendorPhone = "N/A";
    }

    // Extract Customer details
    const Customer = require("../../../models/Customer");
    const customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
    
    let address = 'Customer Address Not Provided';
    let latitude = null;
    let longitude = null;

    if (order.deliveryAddress) {
        address = `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} - ${order.deliveryAddress.zipCode || ''}`;
    }

    if (customerDoc && customerDoc.addresses && customerDoc.addresses.length > 0) {
        const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
        if (!order.deliveryAddress) {
           address = `${defaultAddress.street || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.zipCode || ''}`;
        }
        if (defaultAddress.location?.coordinates?.length >= 2) {
            longitude = defaultAddress.location.coordinates[0];
            latitude = defaultAddress.location.coordinates[1];
        }
    }

    let deliveryDistance = order.deliveryDistance;
    let deliveryEarnings = order.deliveryFee;
    


    return {
      ...order,
      tailor: tailorProfile,
      taskType,
      // Map properties for Delivery Frontend
      customer: order.customer?.name || "Customer",
      phone: order.customer?.phoneNumber || "N/A",
      address,
      latitude,
      longitude,
      vendorName,
      vendorAddress,
      vendorLatitude,
      vendorLongitude,
      vendorPhone,
      deliveryDistance,
      deliveryEarnings
    };
  }));

  res.status(200).json({
    success: true,
    count: formattedOrders.length,
    data: formattedOrders,
  });
});

/**
 * @desc    Get order details by ID for delivery partner
 * @route   GET /api/v1/deliveries/orders/:id
 * @access  Private (Delivery)
 */
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const query = mongoose.Types.ObjectId.isValid(req.params.id) 
    ? { _id: req.params.id }
    : { orderId: req.params.id };

  const order = await Order.findOne(query)
    .populate("customer", "name phoneNumber profileImage email")
    .populate("pickupPartner", "name phoneNumber profileImage")
    .populate("dropoffPartner", "name phoneNumber profileImage")
    .populate("items.service", "title image")
    .populate("items.product", "name image images")
    .populate("items.selectedFabric", "name image images")
    .lean();

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }



  // Same tailoring logic as getAssignedOrders
  const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const needsFabricPickup = order.fabricPickupRequired && 
    ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
    ? "fabric-pickup" : "order-delivery";

  let tailorProfile = null;
  let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
  if (order.tailor) {
    const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
    if (tailorDoc) {
      tailorProfile = {
        _id: order.tailor,
        shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
        phone: tailorDoc.user?.phoneNumber,
        location: tailorDoc.location
      };
      vendorName = tailorProfile.shopName;
      vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
      vendorPhone = tailorProfile.phone;
      if (tailorProfile.location?.coordinates?.length >= 2) {
          vendorLongitude = tailorProfile.location.coordinates[0];
          vendorLatitude = tailorProfile.location.coordinates[1];
      }
    } else {
      const User = require("../../../models/User");
      const tailorUser = await User.findById(order.tailor).lean();
      if (tailorUser) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorUser.name || 'Tailor Workshop',
          phone: tailorUser.phoneNumber,
          location: null
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
      } else {
        vendorName = "Silaiwala Hub";
        vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
        vendorPhone = "N/A";
      }
    }
  } else {
    vendorName = "Silaiwala Hub";
    vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
    vendorPhone = "N/A";
  }

  // Extract Customer details
  const Customer = require("../../../models/Customer");
  const customerDoc = await Customer.findOne({ user: order.customer?._id || order.customer }).lean();
  
  let address = 'Customer Address Not Provided';
  let latitude = null;
  let longitude = null;

  if (order.deliveryAddress) {
      address = `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} - ${order.deliveryAddress.zipCode || ''}`;
  }

  if (customerDoc && customerDoc.addresses && customerDoc.addresses.length > 0) {
      const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
      if (!order.deliveryAddress) {
         address = `${defaultAddress.street || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.zipCode || ''}`;
      }
      if (defaultAddress.location?.coordinates?.length >= 2) {
          longitude = defaultAddress.location.coordinates[0];
          latitude = defaultAddress.location.coordinates[1];
      }
  }

    let deliveryDistance = order.deliveryDistance;
    let deliveryEarnings = order.deliveryFee;
    


  res.status(200).json({
    success: true,
    data: {
      ...order,
      tailor: tailorProfile,
      taskType,
      // Map properties for Delivery Frontend
      customer: order.customer?.name || "Customer",
      phone: order.customer?.phoneNumber || "N/A",
      address,
      latitude,
      longitude,
      vendorName,
      vendorAddress,
      vendorLatitude,
      vendorLongitude,
      vendorPhone,
      deliveryDistance,
      deliveryEarnings
    }
  });
});

/**
 * @desc    Get delivery partner dashboard statistics
 * @route   GET /api/v1/deliveries/stats
 * @access  Private (Delivery)
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ user: req.user.id });
  
  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Use both ObjectId and string forms for maximum compatibility
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const userIdStr = req.user.id.toString();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Primary: Aggregation pipeline (most efficient)
  let stats = await Order.aggregate([
    { $match: { $or: [{ deliveryPartner: userId }, { pickupPartner: userId }, { dropoffPartner: userId }] } },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalDeliveries: { $sum: { $cond: [{ $in: ["$status", ["delivered", "fabric-delivered", "fabric-received"]] }, 1, 0] } },
              activeDeliveries: { 
                $sum: { 
                  $cond: [
                    { $in: ["$status", ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "out-for-delivery"]] }, 
                    1, 0
                  ] 
                } 
              },
              totalEarnings: { $sum: { $cond: [{ $in: ["$status", ["delivered", "fabric-delivered", "fabric-received"]] }, "$deliveryFee", 0] } }
            }
          }
        ],
        today: [
          { $match: { updatedAt: { $gte: todayStart }, status: { $in: ["delivered", "fabric-delivered", "fabric-received"] } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }
    }
  ]);

  const WalletTransaction = require("../../../models/WalletTransaction");
  
  // Calculate today's actual wallet earnings to prevent mismatch with wallet balance
  const todayEarningsResult = await WalletTransaction.aggregate([
    { 
      $match: { 
        user: userId, 
        type: "credit", 
        category: { $in: ["order_earnings", "delivery_earnings"] },
        createdAt: { $gte: todayStart } 
      } 
    },
    { $group: { _id: null, earnings: { $sum: "$amount" } } }
  ]);
  const actualTodayEarnings = todayEarningsResult[0]?.earnings || 0;

  const yesterdayEarningsResult = await WalletTransaction.aggregate([
    { 
      $match: { 
        user: userId, 
        type: "credit", 
        category: { $in: ["order_earnings", "delivery_earnings"] },
        createdAt: { $gte: yesterdayStart, $lt: todayStart } 
      } 
    },
    { $group: { _id: null, earnings: { $sum: "$amount" } } }
  ]);
  const actualYesterdayEarnings = yesterdayEarningsResult[0]?.earnings || 0;

  const overall = stats[0]?.overall?.[0] || { totalDeliveries: 0, activeDeliveries: 0, totalEarnings: 0 };
  const todayCount = stats[0]?.today?.[0]?.count || 0;
  const yesterday = stats[0]?.yesterday?.[0] || { earnings: 0 };

  // Calculate growth percentage
  let growth = 0;
  if (actualYesterdayEarnings > 0) {
    growth = ((actualTodayEarnings - actualYesterdayEarnings) / actualYesterdayEarnings) * 100;
  } else if (actualTodayEarnings > 0) {
    growth = 100; // 100% growth if there were no earnings yesterday
  }

  const dashboardStats = {
    ...overall,
    totalEarnings: delivery.totalEarned || 0,
    todayEarnings: actualTodayEarnings,
    todayCount: todayCount,
    growth: Math.round(growth * 10) / 10 // Round to 1 decimal place
  };

  // Also use the wallet balance from the Delivery profile
  res.status(200).json({
    success: true,
    data: {
      ...dashboardStats,
      _id: undefined,
      walletBalance: delivery.walletBalance || 0,
      rating: delivery.rating,
      isAvailable: delivery.isAvailable
    }
  });
});

/**
 * @desc    Update delivery status of an order
 * @route   PATCH /api/v1/deliveries/orders/:id/status
 * @access  Private (Delivery)
 */
exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

  const { status, message, proof } = req.body;
  const allowedStatuses = [
    "accepted",
    "reached-pickup",
    "fabric-picked-up", 
    "reached-dropoff",
    "fabric-delivered", 
    "picked-up-from-tailor",
    "out-for-delivery", 
    "delivered", 
    "failed-delivery"
  ];

  if (!allowedStatuses.includes(status)) {
    await session.abortTransaction();
      return next(new ErrorResponse("Invalid delivery status", 400));
  }

  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  const order = await Order.findOne({
    ...query,
    $or: [
      { deliveryPartner: req.user.id },
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id }
    ]
  }).session(session);

  if (!order) {
    await session.abortTransaction();
      return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Handle Granular Delivery Statuses & Main Status Mapping
  
  // Determine if this is cycle 1 (pickup) or cycle 2 (dropoff)
  const isPickupCycle = order.pickupPartner?.toString() === req.user.id;
  const isDropoffCycle = order.dropoffPartner?.toString() === req.user.id;

  if (status === "accepted") {
      order.deliveryStatus = "accepted";
      if (isPickupCycle) order.pickupDeliveryStatus = "accepted";
      if (isDropoffCycle) order.dropoffDeliveryStatus = "accepted";
      order.deliveryAcceptedAt = new Date();
  } else if (status === "reached-pickup" || status === "reached-dropoff") {
      const cycle = status === "reached-pickup" ? "pickup" : "dropoff";
      order.deliveryStatus = status;
      if (isPickupCycle && cycle === 'pickup') order.pickupDeliveryStatus = status;
      if (isDropoffCycle && cycle === 'dropoff') order.dropoffDeliveryStatus = status;
      
      // Generate OTP automatically on arrival
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (cycle === 'pickup') order.pickupDeliveryOtp = otp;
      if (cycle === 'dropoff') order.dropoffDeliveryOtp = otp;
      
      console.log(`\n\n======================================================`);
      console.log(`🔐 DELIVERY OTP GENERATED: ${otp}`);
      console.log(`======================================================\n\n`);
      
      const { sendNotification } = require("../../../utils/notification");
      
      // Notify Customer
      await sendNotification({
        recipient: order.customer,
        type: "OTP_GENERATED",
        title: "Delivery OTP",
        message: `Your OTP for the delivery partner is ${otp}. Share this only when the partner arrives.`,
        data: { orderId: order._id, otp }
      });
      
      // Notify Tailor
      if (order.tailor) {
        await sendNotification({
          recipient: order.tailor,
          type: "OTP_GENERATED",
          title: "Delivery OTP",
          message: `The OTP for the delivery partner is ${otp}. Share this only when the partner arrives.`,
          data: { orderId: order._id, otp }
        });
      }
  } else if (status === "fabric-picked-up" || status === "picked-up-from-tailor") {
      const { otp } = req.body;
      if (!otp) {
        await session.abortTransaction();
      return next(new ErrorResponse("OTP is required to complete pickup", 400));
      }
      if (order.pickupDeliveryOtp !== otp && otp !== "123456") {
        await session.abortTransaction();
      return next(new ErrorResponse("Invalid OTP", 400));
      }
      
      order.pickupOtpVerified = true;
      order.deliveryStatus = "picked-up";
      order.pickupAt = new Date();
      order.status = status === "fabric-picked-up" ? "fabric-picked-up" : "out-for-delivery";
  } else if (status === "fabric-delivered") {
      order.deliveryStatus = "delivered";
      order.status = "fabric-delivered";
  } else if (status === "out-for-delivery") {
      order.deliveryStatus = "out-for-delivery";
      order.status = "out-for-delivery";
  } else if (status === "delivered") {
      order.deliveryStatus = "delivered";
      order.status = "delivered";
  } else if (status === "failed-delivery") {
      // Just keep existing main status, update delivery history
  }

  // New: Notifications for fabric pickup
  if (status === "fabric-picked-up") {
    const { sendNotification } = require("../../../utils/notification");
    await sendNotification({
      recipient: order.customer,
      type: "FABRIC_PICKED_UP",
      title: "Fabric Picked Up",
      message: `Your fabric for order ${order.orderId} has been picked up and is on its way to the artisan.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
  }

  // Optimization: If fabric is delivered to tailor, clear the delivery partner 
  // so a new delivery partner (or same) can pick it up for final delivery later.
  if (status === "fabric-delivered") {
    order.deliveryPartner = null;
    
    // Notify Tailor that fabric has arrived
    const { sendNotification } = require("../../../utils/notification");
    await sendNotification({
      recipient: order.tailor,
      type: "FABRIC_DELIVERED",
      title: "Fabric Received!",
      message: `The fabric for order ${order.orderId} has been delivered. You can now start working on it.`,
      data: { orderId: order._id, targetUrl: "/partner/orders" }
    });
  }

    if (status === "fabric-delivered" || status === "delivered") {
    try {
      const earnedAmount = order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0;

      if (!earnedAmount || earnedAmount <= 0) {
        console.error(`CRITICAL: Missing deliveryEarnings on order ${order.orderId}. Wallet will not be credited.`);
      } else {
        const WalletTransaction = require("../../../models/WalletTransaction");
        // Prevent duplicate credit by matching the exact status at the start of the description
        const existingTx = await WalletTransaction.findOne({
          user: req.user.id,
          order: order._id,
          category: { $in: ["order_earnings", "delivery_earnings"] },
          description: new RegExp(`^Delivery payout for ${status} \\(`, "i")
        }).session(session);

        if (existingTx) {
          console.warn(`DUPLICATE CREDIT PREVENTED: Wallet already credited for status ${status} on order ${order._id}`);
        } else {
          // Add to Delivery profile
          await Delivery.findOneAndUpdate(
            { user: req.user.id },
            { 
              $inc: { 
                walletBalance: earnedAmount,
                totalEarned: earnedAmount,
                totalDeliveries: 1
              } 
            }
          );

          // Create a WalletTransaction record
          await WalletTransaction.create([{
            user: req.user.id,
            amount: earnedAmount,
            type: "credit",
            category: "delivery_earnings",
            order: order._id,
            description: `Delivery payout for ${status} (${order.deliveryDistance}km)`,
          }], { session });

          // Store deliveryPartnerEarning on Order for audit trail
          const currentEarning = order.deliveryPartnerEarning || 0;
          order.deliveryPartnerEarning = currentEarning + earnedAmount;
          // Save will happen below with other order changes

          console.log(`Credited ₹${earnedAmount} to Delivery Partner ${req.user.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to process delivery payout:", err);
    }
  }

  if (status === "delivered") {
    order.deliveredAt = new Date();
    if (proof) order.deliveryProof = proof;

    // Notify Customer
    const { sendNotification } = require("../../../utils/notification");
    await sendNotification({
      recipient: order.customer,
      type: "ORDER_DELIVERED",
      title: "Order Delivered! 🎉",
      message: `Your order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/orders" }
    });

    // Distribute Tailor Earnings
    const { distributeEarnings } = require("../../../utils/earningsEngine");
    try {
      await distributeEarnings(order._id);
    } catch (err) {
      console.error("Failed to distribute tailor earnings:", err);
    }
  }

  // Notify for out-for-delivery
  if (status === "out-for-delivery") {
    const { sendNotification } = require("../../../utils/notification");
    await sendNotification({
      recipient: order.customer,
      type: "OUT_FOR_DELIVERY",
      title: "Order Out for Delivery",
      message: `Your order ${order.orderId} is out for delivery with our partner.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
  }

  order.trackingHistory.push({
    status: `delivery-${status}`,
    message: message || `Delivery status updated to ${status}`,
    timestamp: new Date(),
    proof: proof,
  });

  await order.save({ session });

  // --- Socket Emissions ---
  try {
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io) {
        // 1. Notify Customer
        io.to(`user_${order.customer}`).emit('order_status_updated', {
            orderId: order.orderId,
            status: status
        });

        // 2. Notify Tailor
        io.to(`user_${order.tailor}`).emit('order_status_updated', {
            orderId: order.orderId,
            status: status
        });
    }
  } catch (err) {
    console.error("Socket emission failed in updateDeliveryStatus:", err.message);
  }
  // ------------------------

  await session.commitTransaction();
    res.status(200).json({
    success: true,
    data: order,
  });
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted in updateDeliveryStatus:", error);
    return next(new ErrorResponse("Transaction failed", 500));
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Get orders waiting for a delivery partner
 * @route   GET /api/v1/deliveries/available-orders
 * @access  Private (Delivery)
 */
exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  const deliveryProfile = await Delivery.findOne({ user: req.user.id }).lean();
  if (!deliveryProfile) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  const roles = deliveryProfile.partnerRoles || ["delivery"];
  const isDelivery = roles.includes("delivery");
  const isMeasurement = roles.includes("measurement");

  let allowedStatuses = [];
  if (isDelivery) {
    allowedStatuses.push("fabric-ready-for-pickup", "ready", "ready-for-delivery", "ready-for-pickup");
  }
  if (isMeasurement) {
    allowedStatuses.push("measurement-verification", "pending-measurement"); // Add measurement statuses here
  }

  if (allowedStatuses.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const orders = await Order.find({
    status: { $in: allowedStatuses },
    $or: [
      { deliveryPartner: null },
      { deliveryPartner: { $exists: false } },
      { pickupPartner: null, status: "fabric-ready-for-pickup" },
      { dropoffPartner: null, status: { $in: ["ready", "ready-for-delivery", "ready-for-pickup"] } },
      { status: { $in: ["measurement-verification", "pending-measurement"] } } // For measurement tasks
    ]
  })
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();



  // Enrich with Tailor profile data
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    const isFabric = order.status === "fabric-ready-for-pickup";

    let vendorLatitude, vendorLongitude;
    let tailorProfile = null;
    
    if (order.tailor) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location
        };
        if (tailorProfile.location?.coordinates?.length >= 2) {
            vendorLongitude = tailorProfile.location.coordinates[0];
            vendorLatitude = tailorProfile.location.coordinates[1];
        }
      }
    }

    const Customer = require("../../../models/Customer");
    const customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
    let latitude = null;
    let longitude = null;
    if (customerDoc && customerDoc.addresses && customerDoc.addresses.length > 0) {
        const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
        if (defaultAddress.location?.coordinates?.length >= 2) {
            longitude = defaultAddress.location.coordinates[0];
            latitude = defaultAddress.location.coordinates[1];
        }
    }

    let deliveryDistance = order.deliveryDistance;
    let deliveryEarnings = order.deliveryEarnings;

    return {
      ...order,
      tailor: tailorProfile,
      taskType: isFabric ? "fabric-pickup" : "order-delivery",
      deliveryDistance,
      deliveryEarnings
    };
  }));

  res.status(200).json({
    success: true,
    count: formattedOrders.length,
    data: formattedOrders,
  });
});

/**
 * @desc    Accept/Claim an available order
 * @route   POST /api/v1/deliveries/orders/:id/accept
 * @access  Private (Delivery)
 */
exports.acceptOrder = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne(query);

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

  if (taskType === "fabric-pickup") {
    // If pre-assigned pending, or claiming an available task
    if (order.pickupPartner && order.pickupPartner.toString() !== req.user.id) {
      return next(new ErrorResponse("Order already has a pickup partner assigned", 400));
    }
    
    // Atomic lock (handles both claiming fresh and accepting pre-assigned)
    const lockResult = await Order.updateOne(
      { _id: order._id, $or: [{ pickupPartner: null }, { pickupPartner: { $exists: false } }, { pickupPartner: req.user.id }] },
      { $set: { pickupPartner: req.user.id } }
    );
    if (lockResult.modifiedCount === 0 && (!order.pickupPartner || order.pickupPartner.toString() !== req.user.id)) {
      return next(new ErrorResponse("This order has already been accepted by another partner", 400));
    }
    
    order.pickupPartner = req.user.id;
    order.pickupDeliveryStatus = "accepted"; // Upgrade from pending to accepted
    if (!order.deliveryPartner) order.deliveryPartner = req.user.id;
  } else {
    // If pre-assigned pending, or claiming an available task
    if (order.dropoffPartner && order.dropoffPartner.toString() !== req.user.id) {
      return next(new ErrorResponse("Order already has a dropoff partner assigned", 400));
    }
    
    // Atomic lock (handles both claiming fresh and accepting pre-assigned)
    const lockResult = await Order.updateOne(
      { _id: order._id, $or: [{ dropoffPartner: null }, { dropoffPartner: { $exists: false } }, { dropoffPartner: req.user.id }] },
      { $set: { dropoffPartner: req.user.id } }
    );
    if (lockResult.modifiedCount === 0 && (!order.dropoffPartner || order.dropoffPartner.toString() !== req.user.id)) {
      return next(new ErrorResponse("This order has already been accepted by another partner", 400));
    }
    
    order.dropoffPartner = req.user.id;
    order.dropoffDeliveryStatus = "accepted"; // Upgrade from pending to accepted
    if (!order.deliveryPartner) order.deliveryPartner = req.user.id;
  }

  order.deliveryStatus = "accepted";

  const { calculatedDistance } = req.body || {};
  // --- Calculate Distance & Earnings ---
  if (calculatedDistance != null) {
      order.deliveryDistance = Number(calculatedDistance);
  }
  
  // Ensure we use the exact fee that the customer was charged, unless there's an active override
  // DO NOT recalculate this on the fly so the driver sees exactly what was charged.
  order.deliveryEarnings = order.deliveryPartnerEarning || order.deliveryFee || 0;
  // --------------------------------------------

  const partnerName = req.user.name || "A delivery partner";
  const actionType = taskType === "fabric-pickup" ? "pickup your fabric" : "deliver your order";

  console.log(`\n================================`);
  console.log(`🏍️  DELIVERY BOY ASSIGNED (ACCEPTED)!`);
  console.log(`Name: ${partnerName}`);
  console.log(`Order ID: ${order.orderId}`);
  console.log(`================================\n`);

  order.trackingHistory.push({
    status: "delivery-partner-assigned",
    message: `${partnerName} has been assigned to ${actionType}`,
    timestamp: new Date(),
  });

  await order.save();

  // Notify customer
  const { sendNotification } = require("../../../utils/notification");
  await sendNotification({
    recipient: order.customer,
    type: "PARTNER_ASSIGNED",
    title: "Partner Assigned!",
    message: `${partnerName} has been assigned to ${actionType}.`,
    data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
  });

  // Notify tailor that partner accepted (so their panel updates)
  await sendNotification({
    recipient: order.tailor,
    type: "PARTNER_ACCEPTED",
    title: "Delivery Partner Accepted",
    message: `${partnerName} has accepted the delivery task for order ${order.orderId}.`,
    data: { orderId: order._id, targetUrl: "/partner/orders" }
  });

  // Notify other partners that this task is no longer available
  const { getIO } = require("../../../config/socket");
  const io = getIO();
  if (io) {
    io.to("delivery_partners").emit("task_claimed", { orderId: order._id });
    
    // Update tailor panel to show partner name instead of "Searching"
    io.to(`user_${order.tailor}`).emit('order_status_updated', {
      orderId: order.orderId,
      _id: order._id,
      status: order.status,
      pickupDeliveryStatus: order.pickupDeliveryStatus,
      dropoffDeliveryStatus: order.dropoffDeliveryStatus,
      deliveryPartner: req.user.id
    });

    // Update customer tracking page
    io.to(`user_${order.customer}`).emit('order_status_updated', {
      orderId: order.orderId,
      _id: order._id,
      status: order.status,
      deliveryPartner: req.user.id
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Submit KYC Documents for verification
 * @route   POST /api/v1/deliveries/documents
 * @access  Private (Delivery)
 */
exports.submitDocuments = asyncHandler(async (req, res, next) => {
  const { documents } = req.body;

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return next(new ErrorResponse("Please provide documents (name and url)", 400));
  }

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Update or append documents
  // Documents should have structure { name: 'Aadhar', url: 'http://...' }
  const formattedDocs = documents.map(doc => ({
    name: doc.name,
    url: doc.url,
    status: 'pending'
  }));

  delivery.documents = formattedDocs;
  await delivery.save();

  res.status(200).json({
    success: true,
    message: "Documents submitted for verification",
    data: delivery.documents
  });
});

/**
 * @desc    Reject a delivery order assignment
 * @route   POST /api/v1/deliveries/orders/:id/reject
 * @access  Private (Delivery)
 */
exports.rejectOrder = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  const order = await Order.findOne({
    ...query,
    $or: [
      { deliveryPartner: req.user.id },
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id }
    ]
  });

  if (!order) {
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Add partner to rejectedBy
  if (!order.rejectedBy.includes(req.user.id)) {
    order.rejectedBy.push(req.user.id);
  }

  let cycle = "pickup";
  if (order.pickupPartner?.toString() === req.user.id) {
     order.pickupPartner = null;
     order.pickupDeliveryStatus = "pending";
  } else if (order.dropoffPartner?.toString() === req.user.id) {
     order.dropoffPartner = null;
     order.dropoffDeliveryStatus = "pending";
     cycle = "dropoff";
  }
  
  // Legacy fields
  if (order.deliveryPartner?.toString() === req.user.id) {
    order.deliveryPartner = null;
    order.deliveryStatus = "pending";
  }
  
  await order.save();
  
  // Trigger auto-assign again
  const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");
  await autoAssignDelivery(order._id, cycle);

  res.status(200).json({ success: true, message: "Order rejected and reassigned" });
});

/**
 * @desc    Generate and send OTP for delivery confirmation
 * @route   POST /api/v1/deliveries/orders/:id/resend-delivery-otp
 * @access  Private (Delivery Partner)
 */
exports.resendDeliveryOtp = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  const order = await Order.findOne({
    ...query,
    $or: [
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id },
      { deliveryPartner: req.user.id }
    ]
  });

  if (!order) return next(new ErrorResponse("Order not found or not assigned to you", 404));

  let cycle = 'dropoff';
  if (["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status) || (!order.dropoffPartner && order.pickupPartner?.toString() === req.user.id)) {
      cycle = 'pickup';
  }
  
  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const { sendNotification } = require("../../../utils/notification");

  if (cycle === 'pickup') {
    order.pickupDeliveryOtp = otp;
    order.pickupOtpVerified = false;
  } else {
    order.dropoffDeliveryOtp = otp;
    order.dropoffOtpVerified = false;
  }
  
  await order.save();
  
  console.log(`\n\n======================================================`);
  console.log(`🔐 DELIVERY OTP RE-GENERATED: ${otp}`);
  console.log(`======================================================\n\n`);

  if (cycle === 'pickup') {
    // Send to Tailor
    await sendNotification({
      recipient: order.tailor,
      type: "DELIVERY_OTP",
      title: "Fabric Delivery OTP",
      message: `Your delivery OTP for fabric collection is ${otp}. Please provide this to the delivery partner.`,
      data: { orderId: order._id, otp }
    });
  } else {
    order.dropoffDeliveryOtp = otp;
    order.dropoffOtpVerified = false;
    await order.save();
    
    // Send to Customer
    await sendNotification({
      recipient: order.customer,
      type: "DELIVERY_OTP",
      title: "Delivery OTP",
      message: `Your OTP for final delivery is ${otp}. Please provide this to the delivery partner.`,
      data: { orderId: order._id, otp }
    });
  }

  res.status(200).json({ success: true, message: "OTP sent successfully" });
});

/**
 * @desc    Verify OTP and complete delivery step
 * @route   PATCH /api/v1/deliveries/orders/:id/complete
 * @access  Private (Delivery Partner)
 */
exports.completeDeliveryFlow = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

  const { otp, openBoxPhoto, deliveryProofPhoto, paymentMethod } = req.body;
  if (!otp) {
      await session.abortTransaction();
      return next(new ErrorResponse("OTP is required", 400));
  }

  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  const order = await Order.findOne({
    ...query,
    $or: [
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id },
      { deliveryPartner: req.user.id }
    ]
  }).session(session).select('+pickupDeliveryOtp +dropoffDeliveryOtp'); // Ensure OTPs are selected

  if (!order) {
      await session.abortTransaction();
      return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  let cycle = 'dropoff';
  if (["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status) || (!order.dropoffPartner && order.pickupPartner?.toString() === req.user.id)) {
      cycle = 'pickup';
  }

  const { sendNotification } = require("../../../utils/notification");
  const Settings = require("../../../models/Settings");
  const WalletTransaction = require("../../../models/WalletTransaction");
  
  // Calculate delivery earnings
  let earnings = order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0;
  if (!earnings || earnings <= 0) {
    console.error(`CRITICAL: Delivery Fee missing for Order ${order.orderId}. Wallet will NOT be credited.`);
    earnings = 0;
  }

  // Helper to credit wallet
  const creditDeliveryWallet = async (partnerId, amount, description) => {
    if (!amount || amount <= 0) return;
    
    // Prevent duplicate credit
    const existingTx = await WalletTransaction.findOne({
      user: partnerId,
      order: order._id,
      category: "order_earnings",
      description: description
    }).session(session);
    
    if (existingTx) {
      console.warn(`DUPLICATE CREDIT PREVENTED: Wallet already credited for partner ${partnerId} on order ${order._id}`);
      return;
    }

    const profile = await Delivery.findOne({ user: partnerId }).session(session);
    if (profile) {
      profile.walletBalance = (profile.walletBalance || 0) + amount;
      profile.totalEarned = (profile.totalEarned || 0) + amount;
      profile.totalDeliveries = (profile.totalDeliveries || 0) + 1;
      await profile.save({ session });
      await WalletTransaction.create([{
        user: partnerId,
        amount,
        type: "credit",
        category: "order_earnings",
        order: order._id,
        description
      }], { session });
    }
  };

  if (cycle === 'pickup') {
    if (order.pickupDeliveryOtp !== otp && otp !== "123456") { // Allow 123456 as master for testing/dev
      await session.abortTransaction();
      return next(new ErrorResponse("Invalid OTP", 400));
    }
    
    order.pickupOtpVerified = true;
    order.deliveryStatus = "delivered";
    order.pickupDeliveryStatus = "delivered";
    order.status = "fabric-received";
    
    // Clear delivery partner so a new one can be assigned for final dropoff later
    order.deliveryPartner = null;

    if (deliveryProofPhoto) order.deliveryProof = deliveryProofPhoto;
    
    // Credit Wallet for Pickup
    await creditDeliveryWallet(req.user.id, earnings, `Earnings for Pickup of order ${order.orderId}`);

    // Notify Tailor
    await sendNotification({
      recipient: order.tailor,
      type: "FABRIC_DELIVERED",
      title: "Fabric Received!",
      message: `The fabric for order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/partner/orders" }
    });

  } else {
    if (order.dropoffDeliveryOtp !== otp && otp !== "123456") {
      await session.abortTransaction();
      return next(new ErrorResponse("Invalid OTP", 400));
    }
    
    order.dropoffOtpVerified = true;
    order.deliveryStatus = "delivered";
    order.dropoffDeliveryStatus = "delivered";
    order.status = "delivered";
    order.deliveredAt = new Date();
    
    if (deliveryProofPhoto) order.deliveryProof = deliveryProofPhoto;

    // Credit Wallet for Dropoff
    await creditDeliveryWallet(req.user.id, earnings, `Earnings for Delivery of order ${order.orderId}`);

    // Notify Customer
    await sendNotification({
      recipient: order.customer,
      type: "ORDER_DELIVERED",
      title: "Order Delivered! 🎉",
      message: `Your order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/orders" }
    });

    // Handle Partial Payment Logic before completing
    if (order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== 'paid') {
       if (paymentMethod === 'qr' || paymentMethod === 'online') {
           // Delivery Partner verified UPI payment to Admin
           order.remainingPaymentMethod = 'online';
           order.remainingPaymentStatus = 'paid';
           order.paymentStatus = 'paid';
       } else if (paymentMethod === 'cash') {
           // Delivery Partner collected cash
           order.remainingPaymentMethod = 'cash';
           order.remainingPaymentStatus = 'paid';
           order.paymentStatus = 'paid';
           
           // Deduct the collected cash from Delivery Partner's wallet
           const deliveryProfile = await Delivery.findOne({ user: req.user.id }).session(session);
           if (deliveryProfile) {
              deliveryProfile.walletBalance -= order.remainingPaymentAmount;
              await deliveryProfile.save({ session });
              await WalletTransaction.create([{
                user: req.user.id,
                amount: order.remainingPaymentAmount,
                type: "debit",
                category: "commission_deduction",
                order: order._id,
                description: `Cash collected from customer for order ${order.orderId}`
              }], { session });
           }
       } else {
           // Fallback if frontend didn't send payment method but there's a remaining amount
           await session.abortTransaction();
      return next(new ErrorResponse("Please select a payment method for the remaining amount.", 400));
       }
    }

    // Ensure platform and delivery fees are populated before distributing earnings
    if (!order.platformFee) {
       const Settings = require("../../../models/Settings");
       const settings = await Settings.getSettings();
       const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
       order.platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
    }

    
    // Distribute Earnings (Tailor)
    const { distributeEarnings } = require("../../../utils/earningsEngine");
    try {
      await order.save({ session }); // Save the status to paid before distributing
      await distributeEarnings(order._id);
    } catch (err) {
      console.error("Failed to distribute earnings automatically:", err);
    }
  }

  await order.save({ session });

  // Socket push for live UI updates
  const { getIO } = require("../../../config/socket");
  const io = getIO();
  if (io) {
    if (cycle === 'pickup') {
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
    } else {
      io.to(`user_${order.customer}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
      // Also notify tailor that final delivery is complete
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
    }
  }

  // Populate references for the frontend state update
  const returnOrder = order.toObject();

  // Extract Tailor Profile for vendorAddress
  const Tailor = require("../../../models/Tailor");
  if (returnOrder.tailor) {
    const tailorDoc = await Tailor.findOne({ user: returnOrder.tailor }).session(session).populate("user", "name phoneNumber").lean();
    if (tailorDoc) {
      returnOrder.tailor = {
        _id: returnOrder.tailor,
        shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
        phone: tailorDoc.user?.phoneNumber,
        location: tailorDoc.location
      };
      returnOrder.vendorName = returnOrder.tailor.shopName;
      returnOrder.vendorAddress = tailorDoc.location?.address || 'Tailor Address Not Provided';
      returnOrder.vendorLatitude = tailorDoc.location?.coordinates?.[1] || null;
      returnOrder.vendorLongitude = tailorDoc.location?.coordinates?.[0] || null;
      returnOrder.vendorPhone = returnOrder.tailor.phone;
    }
  }

  // Extract Customer Profile for address
  const Customer = require("../../../models/Customer");
  const customerDoc = await Customer.findOne({ user: returnOrder.customer?._id || returnOrder.customer }).session(session).populate("user", "name phoneNumber").lean();
  
  if (customerDoc) {
     returnOrder.customer = customerDoc.user?.name || "Customer";
     returnOrder.phone = customerDoc.user?.phoneNumber || "N/A";
     
     let address = 'Customer Address Not Provided';
     if (returnOrder.deliveryAddress) {
         address = `${returnOrder.deliveryAddress.street || ''}, ${returnOrder.deliveryAddress.city || ''}, ${returnOrder.deliveryAddress.state || ''} - ${returnOrder.deliveryAddress.zipCode || ''}`;
     } else if (customerDoc.addresses && customerDoc.addresses.length > 0) {
         const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
         address = `${defaultAddress.street || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.zipCode || ''}`;
     }
     returnOrder.address = address;
  }

  await session.commitTransaction();
    res.status(200).json({ success: true, data: returnOrder });
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted in completeDeliveryFlow:", error);
    return next(new ErrorResponse("Transaction failed", 500));
  } finally {
    session.endSession();
  }
});

