const mongoose = require("mongoose");
const Delivery = require("../../../models/Delivery");
const Order = require("../../../models/Order");
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
  const { vehicleType, vehicleNumber, name, email, phoneNumber, bankDetails, emergencyContact } = req.body;

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
  if (name || email || phoneNumber) {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
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
  const { isAvailable, status, lat, lng } = req.body;

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  if (isAvailable !== undefined) delivery.isAvailable = isAvailable;
  if (status) delivery.status = status;

  if (lat && lng) {
    delivery.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
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
  const query = { deliveryPartner: req.user.id };

  if (status) {
    query.status = status;
  } else {
    // Default show active deliveries (both fabric pickup and final delivery)
    query.status = { $in: ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "out-for-delivery"] };
  }

  const orders = await Order.find(query)
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();

  // Enrich each order with Tailor profile data (shopName, location, phone)
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    // Determine taskType based on status AND fabricPickupRequired flag
    const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

    // Lookup Tailor profile to get shopName, location, phone
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
      }
    }

    return {
      ...order,
      tailor: tailorProfile,
      taskType
    };
  }));

  res.status(200).json({
    success: true,
    count: formattedOrders.length,
    data: formattedOrders,
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
    { $match: { deliveryPartner: userId } },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalDeliveries: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
              activeDeliveries: { 
                $sum: { 
                  $cond: [
                    { $in: ["$status", ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "out-for-delivery"]] }, 
                    1, 0
                  ] 
                } 
              },
              totalEarnings: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$deliveryFee", 0] } }
            }
          }
        ],
        today: [
          { $match: { updatedAt: { $gte: todayStart }, status: "delivered" } },
          { $group: { _id: null, earnings: { $sum: "$deliveryFee" }, count: { $sum: 1 } } }
        ],
        yesterday: [
          { $match: { updatedAt: { $gte: yesterdayStart, $lt: todayStart }, status: "delivered" } },
          { $group: { _id: null, earnings: { $sum: "$deliveryFee" } } }
        ]
      }
    }
  ]);

  const overall = stats[0]?.overall?.[0] || { totalDeliveries: 0, activeDeliveries: 0, totalEarnings: 0 };
  const today = stats[0]?.today?.[0] || { earnings: 0, count: 0 };
  const yesterday = stats[0]?.yesterday?.[0] || { earnings: 0 };

  // Calculate growth percentage
  let growth = 0;
  if (yesterday.earnings > 0) {
    growth = ((today.earnings - yesterday.earnings) / yesterday.earnings) * 100;
  } else if (today.earnings > 0) {
    growth = 100; // 100% growth if there were no earnings yesterday
  }

  const dashboardStats = {
    ...overall,
    todayEarnings: today.earnings,
    todayCount: today.count,
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
    return next(new ErrorResponse("Invalid delivery status", 400));
  }

  const order = await Order.findOne({
    _id: req.params.id,
    deliveryPartner: req.user.id,
  });

  if (!order) {
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Handle Granular Delivery Statuses & Main Status Mapping
  if (status === "accepted") {
      order.deliveryStatus = "accepted";
      order.deliveryAcceptedAt = new Date();
  } else if (status === "reached-pickup") {
      order.deliveryStatus = "reached-pickup";
  } else if (status === "fabric-picked-up") {
      order.deliveryStatus = "picked-up";
      order.pickupAt = new Date();
      order.status = "fabric-picked-up";
  } else if (status === "reached-dropoff") {
      order.deliveryStatus = "reached-dropoff";
  } else if (status === "fabric-delivered") {
      order.deliveryStatus = "delivered";
      order.status = "fabric-delivered";
  } else if (status === "picked-up-from-tailor") {
      order.deliveryStatus = "picked-up";
      order.pickupAt = new Date();
      // Keep main status as ready-for-pickup or advance it to out-for-delivery depending on UI
      order.status = "out-for-delivery"; 
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

  if (status === "delivered") {
    order.deliveredAt = new Date();
    if (proof) order.deliveryProof = proof;
    
    // Increment stats on delivery profile
    await Delivery.findOneAndUpdate(
      { user: req.user.id },
      { $inc: { totalDeliveries: 1 } }
    );

    // Notify Customer
    const { sendNotification } = require("../../../utils/notification");
    await sendNotification({
      recipient: order.customer,
      type: "ORDER_DELIVERED",
      title: "Order Delivered! 🎉",
      message: `Your order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/orders" }
    });

    // Distribute Earnings
    const { distributeEarnings } = require("../../../utils/earningsEngine");
    try {
      await distributeEarnings(order._id);
    } catch (err) {
      console.error("Failed to distribute earnings automatically:", err);
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

  await order.save();

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

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Get orders waiting for a delivery partner
 * @route   GET /api/v1/deliveries/available-orders
 * @access  Private (Delivery)
 */
exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  const orders = await Order.find({
    status: { $in: ["ready-for-pickup", "fabric-ready-for-pickup"] },
    $or: [
      { deliveryPartner: null },
      { deliveryPartner: { $exists: false } }
    ]
  })
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();

  // Enrich with Tailor profile data
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    const isFabric = order.status === "fabric-ready-for-pickup";

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
      }
    }

    return {
      ...order,
      tailor: tailorProfile,
      taskType: isFabric ? "fabric-pickup" : "order-delivery"
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
  let order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  if (order.deliveryPartner) {
    return next(new ErrorResponse("Order already has a delivery partner", 400));
  }

  if (!["ready-for-pickup", "fabric-ready-for-pickup", "out-for-delivery"].includes(order.status)) {
    return next(new ErrorResponse("Order is not available for pickup", 400));
  }

  // Assign partner
  order.deliveryPartner = req.user.id;
  
  const partnerName = req.user.name || "A delivery partner";
  const actionType = order.status === "fabric-ready-for-pickup" ? "pickup your fabric" : "deliver your order";

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

  // Notify other partners that this task is no longer available
  const { getIO } = require("../../../config/socket");
  const io = getIO();
  if (io) {
    io.to("delivery_partners").emit("task_claimed", { orderId: order._id });
    
    // Also join the delivery partner to the order room for live tracking if needed later
    // socket.join(`order_${order._id}`); // Note: context of 'socket' not available in controller usually
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
