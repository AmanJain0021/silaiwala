const mongoose = require("mongoose");
const Tailor = require("../../../models/Tailor");
const User = require("../../../models/User");
const Order = require("../../../models/Order");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");

/**
 * @desc    Get all tailors with filters and location
 * @route   GET /api/v1/tailors
 * @access  Public
 */
exports.getTailors = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 5000, specialization, page = 1, limit = 10 } = req.query;

  let query = { isAvailable: true };

  // 1. Geo-Spatial Search (Optimization: Only if coordinates provided)
  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius),
      },
    };
  }

  // 2. Filter by Specialization
  if (specialization) {
    query.specializations = { $in: [specialization] };
  }

  // 3. Optimization: Pagination & Field Selection
  const skip = (page - 1) * limit;

  const tailors = await Tailor.find(query)
    .populate({
      path: "user",
      select: "name profileImage email phoneNumber",
    })
    .select("shopName bio specializations rating totalReviews location isAvailable")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Tailor.countDocuments(query);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    count: tailors.length,
    data: tailors,
  });
});

/**
 * @desc    Get single tailor details
 * @route   GET /api/v1/tailors/:id
 * @access  Public
 */
exports.getTailorDetails = asyncHandler(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ErrorResponse("Invalid Tailor ID format", 400));
  }

  const tailor = await Tailor.findById(req.params.id)
    .populate({
      path: "user",
      select: "name profileImage email phoneNumber",
    })
    .lean();

  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: tailor,
  });
});
/**
 * @desc    Get current tailor profile
 * @route   GET /api/v1/tailors/me
 * @access  Private (Tailor)
 */
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id }).populate("user", "name email phoneNumber profileImage isActive");

  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: tailor,
  });
});

/**
 * @desc    Update tailor profile
 * @route   PATCH /api/v1/tailors/profile
 * @access  Private (Tailor)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { 
    shopName, 
    bio, 
    specializations, 
    experienceInYears, 
    location, 
    address,
    isAvailable,
    name,
    email,
    phoneNumber,
    profileImage,
    latitude,
    longitude
  } = req.body;

  let tailor = await Tailor.findOne({ user: req.user.id });

  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  // Update Tailor fields
  if (shopName) tailor.shopName = shopName;
  if (bio) tailor.bio = bio;
  if (specializations) tailor.specializations = specializations;
  if (experienceInYears !== undefined) tailor.experienceInYears = experienceInYears;
  if (location) tailor.location = location;
  if (address) tailor.location.address = address;
  if (latitude && longitude) tailor.location.coordinates = [longitude, latitude];
  if (isAvailable !== undefined) tailor.isAvailable = isAvailable;

  await tailor.save();

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

  // Get updated profile with user info
  const updatedTailor = await Tailor.findOne({ user: req.user.id }).populate("user", "name email phoneNumber profileImage");

  res.status(200).json({
    success: true,
    data: updatedTailor,
  });
});

/**
 * @desc    Update rejected documents
 * @route   PATCH /api/v1/tailors/documents
 * @access  Private (Tailor)
 */
exports.updateDocuments = asyncHandler(async (req, res, next) => {
  const { documents } = req.body;
  if (!documents || !Array.isArray(documents)) {
    return next(new ErrorResponse("Please provide valid documents array", 400));
  }

  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  tailor.documents = documents;
  tailor.registrationStatus = "pending";
  tailor.rejectionReason = null;
  await tailor.save();

  res.status(200).json({
    success: true,
    data: tailor,
  });
});

/**
 * @desc    Withdrawal request from tailor
 * @route   POST /api/v1/tailors/withdraw
 * @access  Private (Tailor)
 */
exports.withdrawFunds = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorResponse("Please provide a valid amount", 400));
  }

  const tailor = await Tailor.findOne({ user: req.user.id });

  if (amount > tailor.walletBalance) {
    return next(new ErrorResponse("Insufficient balance", 400));
  }

  // Process withdrawal (In real app, this would trigger a payment gateway or admin notification)
  tailor.walletBalance -= amount;
  tailor.totalWithdrawn += amount;
  await tailor.save();

  // Logic to create a Transaction record would go here...

  res.status(200).json({
    success: true,
    message: "Withdrawal request initiated successfully",
    data: {
      amount,
      newBalance: tailor.walletBalance
    }
  });
});

/**
 * @desc    Get comprehensive tailor dashboard data (Stats + Recent Activity)
 * @route   GET /api/v1/tailors/dashboard
 * @access  Private (Tailor)
 */
exports.getDashboardData = asyncHandler(async (req, res, next) => {
  const tailorId = new mongoose.Types.ObjectId(req.user.id);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Optimization: Single database trip using Aggregation $facet
  const dashboardData = await Order.aggregate([
    { $match: { tailor: tailorId } },
    {
      $facet: {
        // 1. General Stats
        stats: [
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              activeOrders: { 
                $sum: { $cond: [{ $in: ["$status", ["pending", "accepted", "in-progress"]] }, 1, 0] } 
              },
              completedOrders: {
                $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
              },
              totalEarnings: { 
                $sum: { 
                  $cond: [
                    { 
                      $and: [
                        { $eq: ["$paymentStatus", "paid"] },
                        { $ne: ["$status", "pending"] },
                        { $ne: ["$status", "cancelled"] }
                      ]
                    }, 
                    "$totalAmount", 
                    0
                  ] 
                }
              }
            }
          }
        ],
        // 2. Weekly Performance
        weeklyProgress: [
          { $match: { status: "delivered", deliveredAt: { $gte: oneWeekAgo } } },
          { $count: "completedThisWeek" }
        ],
        // 3. Avg Delivery Time (In Hours)
        deliveryAnalysis: [
          { $match: { status: "delivered", acceptedAt: { $exists: true }, deliveredAt: { $exists: true } } },
          {
            $group: {
              _id: null,
              avgTimeMs: { $avg: { $subtract: ["$deliveredAt", "$acceptedAt"] } }
            }
          }
        ],
        // 4. Recent Activity (Latest 5 orders)
        recentActivity: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "users",
              localField: "customer",
              foreignField: "_id",
              as: "customerInfo"
            }
          },
          { $unwind: "$customerInfo" },
          {
            $lookup: {
              from: "users",
              localField: "deliveryPartner",
              foreignField: "_id",
              as: "deliveryPartnerInfo"
            }
          },
          { $unwind: { path: "$deliveryPartnerInfo", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              orderId: 1,
              totalAmount: 1,
              status: 1,
              createdAt: 1,
              customerName: "$customerInfo.name",
              deliveryPartner: {
                name: "$deliveryPartnerInfo.name",
                phoneNumber: "$deliveryPartnerInfo.phoneNumber"
              },
              items: 1
            }
          }
        ]
      }
    }
  ]);

  // Populate items in recentActivity to get service/product titles
  if (dashboardData[0].recentActivity.length > 0) {
    await Order.populate(dashboardData[0].recentActivity, [
      { path: 'items.service', select: 'title' },
      { path: 'items.product', select: 'name' }
    ]);
  }

  const stats = dashboardData[0].stats[0] || { totalOrders: 0, activeOrders: 0, completedOrders: 0, totalEarnings: 0 };
  const weekly = dashboardData[0].weeklyProgress[0]?.completedThisWeek || 0;
  const avgMs = dashboardData[0].deliveryAnalysis[0]?.avgTimeMs || 0;
  
  // Convert ms to hours
  const avgHours = (avgMs / (1000 * 60 * 60)).toFixed(1);

  // Get tailor wallet balance
  const tailorProfile = await Tailor.findOne({ user: req.user.id });

  res.status(200).json({
    success: true,
    data: {
      shopName: tailorProfile?.shopName || 'Partner',
      tailorName: req.user.name || 'Tailor',
      registrationStatus: tailorProfile?.registrationStatus,
      rejectionReason: tailorProfile?.rejectionReason,
      summary: {
        totalEarnings: stats.totalEarnings,
        totalOrders: stats.totalOrders,
        pendingOrders: stats.activeOrders,
        completedThisWeek: weekly,
        avgDeliveryTime: parseFloat(avgHours),
        walletBalance: tailorProfile?.walletBalance || 0
      },
      recentActivity: dashboardData[0].recentActivity
    },
  });
});

/**
 * @desc    Get historical earning data for graphs
 * @route   GET /api/v1/tailors/earnings
 * @access  Private (Tailor)
 */
exports.getEarningsData = asyncHandler(async (req, res, next) => {
  const tailorId = new mongoose.Types.ObjectId(req.user.id);
  const { period = 'week' } = req.query; // 'day', 'week', 'month'

  const tailorProfile = await Tailor.findOne({ user: req.user.id });

  // Get date threshold
  const threshold = new Date();
  if (period === 'week') threshold.setDate(threshold.getDate() - 7);
  else if (period === 'month') threshold.setMonth(threshold.getMonth() - 1);
  else if (period === 'day') threshold.setHours(threshold.getHours() - 24);

  // Grouping format based on period
  let groupByFormat = "%Y-%m-%d"; // Daily grouping for week/month
  if (period === 'day') groupByFormat = "%Y-%m-%d %H:00";

  const earnings = await Order.aggregate([
    { 
      $match: { 
        tailor: tailorId, 
        paymentStatus: "paid",
        createdAt: { $gte: threshold } 
      } 
    },
    {
      $group: {
        _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Total in period
  const periodTotal = earnings.reduce((acc, curr) => acc + curr.revenue, 0);

  // Map to expected frontend format (e.g., { name: 'Mon', revenue: 1200 })
  const formattedChartData = earnings.map(item => {
    // If daily, format as short day or time
    let name = item._id;
    if (period === 'week' || period === 'month') {
        const d = new Date(item._id);
        name = d.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return { name, revenue: item.revenue };
  });

  res.status(200).json({
    success: true,
    data: {
      chartData: formattedChartData,
      summary: {
        periodTotal,
        walletBalance: tailorProfile?.walletBalance || 0,
        totalWithdrawn: tailorProfile?.totalWithdrawn || 0,
        availableToWithdraw: tailorProfile?.walletBalance || 0
      }
    }
  });
});

/**
 * @desc    Get orders assigned to the tailor
 * @route   GET /api/v1/tailors/orders
 * @access  Private (Tailor)
 */
exports.getOrders = asyncHandler(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  let query = { tailor: req.user.id };

  if (status) {
    const statusLower = status.toLowerCase();
    if (statusLower === 'new') {
      query.status = 'pending';
    }
    else if (statusLower === 'active') {
      query.status = { $in: ['accepted', 'fabric-ready-for-pickup', 'fabric-picked-up', 'fabric-delivered', 'in-progress', 'cutting', 'stitching', 'completed', 'ready-for-pickup', 'out-for-delivery'] };
    }
    else if (statusLower === 'history') {
      query.status = { $in: ['delivered', 'cancelled'] };
    }
    else if (statusLower !== 'all') {
      query.status = status;
    }
  }

  const orders = await Order.find(query)
    .populate('customer', 'name profileImage phoneNumber')
    .populate('deliveryPartner', 'name phoneNumber profileImage')
    .populate({
      path: 'items.service',
      select: 'title image'
    })
    .populate({
      path: 'items.selectedFabric',
      select: 'title image'
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    total,
    count: orders.length,
    data: orders,
  });
});

/**
 * @desc    Get active delivery details and history for the tailor
 * @route   GET /api/v1/tailors/delivery-details
 * @access  Private (Tailor)
 */
exports.getDeliveryDetails = asyncHandler(async (req, res, next) => {
  const tailorId = req.user.id;

  // Active deliveries (those assigned to a partner and NOT delivered yet)
  const activeOrders = await Order.find({
    tailor: tailorId,
    deliveryPartner: { $exists: true, $ne: null },
    status: { $in: ["fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "out-for-delivery"] }
  })
  .populate("customer", "name phoneNumber")
  .populate("deliveryPartner", "name phoneNumber profileImage email")
  .sort("-updatedAt");

  // Recent history (already delivered)
  const history = await Order.find({
    tailor: tailorId,
    status: "delivered"
  })
  .populate("deliveryPartner", "name phoneNumber")
  .sort("-deliveredAt")
  .limit(10);

  // Get active courier (the one from the most recent active order)
  const activePartner = activeOrders.length > 0 ? activeOrders[0].deliveryPartner : null;

  res.status(200).json({
    success: true,
    data: {
      activePartner: activePartner ? {
        id: activePartner._id,
        name: activePartner.name,
        phone: activePartner.phoneNumber,
        email: activePartner.email,
        profileImage: activePartner.profileImage,
        task: activeOrders[0].status.replace(/-/g, ' ').toUpperCase(),
        orderId: activeOrders[0].orderId
      } : null,
      activeTasks: activeOrders.map(order => ({
          orderId: order.orderId,
          status: order.status,
          customerName: order.customer?.name,
          updatedAt: order.updatedAt
      })),
      history: history.map(h => ({
          orderId: h.orderId,
          partnerName: h.deliveryPartner?.name || 'Assigned Rider',
          deliveredAt: h.deliveredAt,
          status: "COMPLETED",
          task: "Final Delivery"
      }))
    }
  });
});

/**
 * @desc    Update order status (Tailor Workflow)
 * @route   PATCH /api/v1/tailors/orders/:id/status
 * @access  Private (Tailor)
 */
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status, message, autoAssign, deliveryMethod } = req.body;
  const allowedStatuses = ["accepted", "order-received", "fabric-selected", "fabric-received", "measurement-verification", "cutting", "stitching", "finishing", "quality-check", "ready-for-pickup", "ready-for-delivery", "out-for-delivery", "delivered", "product-delivered", "order-completed", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return next(new ErrorResponse("Invalid status update", 400));
  }

  const order = await Order.findOne({ _id: req.params.id, tailor: req.user.id });

  if (!order) {
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Set helper timestamps for performance tracking
  if (status === "accepted" && !order.acceptedAt) {
    order.acceptedAt = new Date();
  }
  if (status === "delivered" && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }

  // LOGIC: If tailor accepts AND fabric pickup is needed, change status to fabric-ready-for-pickup
  let finalStatus = status;
  if (status === "accepted" && order.fabricPickupRequired) {
    finalStatus = "fabric-ready-for-pickup";
  }

  order.status = finalStatus;
  order.trackingHistory.push({
    status: finalStatus,
    message: message || `Order status updated to ${finalStatus}`,
    timestamp: new Date()
  });

  await order.save();

  // --- All post-save notifications (non-critical, should not block response) ---
  try {
    // Notify Customer about status update
    await sendNotification({
      recipient: order.customer,
      type: "ORDER_STATUS_UPDATED",
      title: "Order Update",
      message: `Your order ${order.orderId} status has been updated to ${finalStatus.replace(/-/g, ' ')}.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
    
    // Auto-Assignment Logic for Deliveries
    if (finalStatus === "fabric-ready-for-pickup" || ((finalStatus === "ready-for-pickup" || finalStatus === "ready-for-delivery") && autoAssign)) {
      const Delivery = require("../../../models/Delivery");
      const tailorProfile = await Tailor.findOne({ user: req.user.id });
      
      let nearestRider = null;
      if (tailorProfile?.location?.coordinates) {
         try {
             const nearbyRiders = await Delivery.find({
                isAvailable: true,
                currentLocation: {
                   $near: {
                      $geometry: tailorProfile.location,
                      $maxDistance: 15000 // 15km search radius
                   }
                }
             }).populate("user").limit(1);
             if (nearbyRiders.length > 0) nearestRider = nearbyRiders[0];
         } catch (geoError) {
             console.error("⚠️ Geospatial search failed. Using availability query fallback:", geoError.message);
             nearestRider = await Delivery.findOne({ isAvailable: true }).populate("user");
         }
      } else {
         nearestRider = await Delivery.findOne({ isAvailable: true }).populate("user");
      }

      const isFabric = finalStatus === "fabric-ready-for-pickup";
      const taskTypeDesc = isFabric ? 'fabric pickup' : 'final delivery';

      if (nearestRider && nearestRider.user) {
         // Perform the auto-assignment
         order.deliveryPartner = nearestRider.user._id;
         order.deliveryStatus = 'assigned';
         order.assignedAt = new Date();
         if (deliveryMethod) order.deliveryMethod = deliveryMethod;
         
         order.trackingHistory.push({
            status: "delivery-assigned",
            message: `Delivery partner auto-assigned for ${taskTypeDesc}.`,
            timestamp: new Date()
         });
         await order.save();

         // Notify assigned rider
         await sendNotification({
           recipient: nearestRider.user._id,
           type: "NEW_DELIVERY_TASK",
           title: `New ${isFabric ? 'Fabric' : 'Delivery'} Task Assigned! 📍`,
           message: `Order ${order.orderId} has been auto-assigned to you for ${isFabric ? 'fabric pickup from Customer' : 'final delivery from Tailor'}.`,
           data: { 
             orderId: order._id, 
             type: finalStatus, 
             taskType: isFabric ? 'fabric-pickup' : 'order-delivery',
             targetUrl: "/delivery/tasks" 
           }
         });
         
         // Clear from general fleet if socket is available
         const { getIO } = require("../../../config/socket");
         const io = getIO();
         if (io) io.to("delivery_partners").emit("task_claimed", { orderId: order._id });

      } else {
         // Fallback if no rider found: mark as manual/shiprocket later
         order.deliveryMethod = deliveryMethod || 'manual';
         await order.save();
         
         // Optionally notify admin that manual assignment is needed
         await sendNotification({
           recipient: "admin",
           type: "MANUAL_ASSIGNMENT_REQUIRED",
           title: `No Riders Available 🚚`,
           message: `Order ${order.orderId} requires manual delivery assignment.`,
           data: { orderId: order._id, targetUrl: "/admin/delivery" }
         });
      }
    } else if ((finalStatus === "ready-for-pickup" || finalStatus === "ready-for-delivery") && deliveryMethod && deliveryMethod !== 'auto') {
        // If tailor specifically requested Manual or Shiprocket
        order.deliveryMethod = deliveryMethod;
        await order.save();
    }

    // Notify Customer about status change
    let notificationType = "ORDER_STATUS_UPDATED";
    let title = "Order Status Updated";
    
    if (status === "accepted") {
      notificationType = "ORDER_ACCEPTED";
      title = "Order Accepted!";
    } else if (status === "cancelled") {
      notificationType = "ORDER_REJECTED";
      title = "Order Cancelled";
    }

    await sendNotification({
      recipient: order.customer,
      type: notificationType,
      title,
      message: message || `Your order ${order.orderId} status is now: ${status}`,
      data: { orderId: order._id, targetUrl: "/orders" }
    });

    // --- Socket Emission for Customer & Delivery ---
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io) {
        io.to(`user_${order.customer}`).emit('order_status_updated', {
            orderId: order.orderId,
            _id: order._id,
            status: finalStatus
        });

        if (finalStatus === 'ready-for-pickup' || finalStatus === 'ready-for-delivery' || finalStatus === 'fabric-ready-for-pickup') {
            io.to('delivery_partners').emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                status: finalStatus,
                taskType: (finalStatus === 'ready-for-pickup' || finalStatus === 'ready-for-delivery') ? 'order-delivery' : 'fabric-pickup'
            });
            console.log(`📡 Socket: Broadcasted task ${order.orderId} to Delivery Room`);
        }
    }
  } catch (notifError) {
    console.error("⚠️ Post-save notification/socket error (non-critical):", notifError.message);
  }
  // ----------------------------------------------

  res.status(200).json({
    success: true,
    data: order,
  });
});
