const mongoose = require("mongoose");
const Tailor = require("../../../models/Tailor");
const User = require("../../../models/User");
const Order = require("../../../models/Order");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const Notification = require("../../../models/Notification");
const { getIO } = require("../../../config/socket");
const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");

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
        ],
        // 5. Upcoming Pickups (orders needing fabric pickup or final delivery)
        upcomingPickups: [
          { 
            $match: { 
              status: { $in: ["fabric-ready-for-pickup", "fabric-picked-up", "ready", "ready-for-delivery", "ready-for-pickup"] } 
            } 
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 4 },
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
            $project: {
              orderId: 1,
              totalAmount: 1,
              status: 1,
              customerName: "$customerInfo.name",
              customer: { name: "$customerInfo.name" }
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
        walletBalance: tailorProfile?.walletBalance || 0,
        rating: tailorProfile?.rating || 0,
        totalReviews: tailorProfile?.totalReviews || 0
      },
      recentActivity: dashboardData[0].recentActivity,
      upcomingPickups: dashboardData[0].upcomingPickups || []
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
      query.status = { $in: ['pending', 'measurement-requested', 'measurement-assigned', 'measurement-accepted', 'measurement-otp-verified', 'measurements-uploaded', 'measurements-approved', 'measurement-revision-required'] };
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
    .select('+pickupDeliveryOtp +dropoffDeliveryOtp')
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
  const allowedStatuses = ["accepted", "order-received", "fabric-selected", "fabric-received", "measurement-verification", "cutting", "stitching", "finishing", "quality-check", "ready-for-pickup", "ready-for-delivery", "out-for-delivery", "delivered", "product-delivered", "order-completed", "cancelled", "ready", "in-progress"];

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

  // LOGIC: Status just becomes the new status. 
  // We don't auto-change to fabric-ready-for-pickup on "accepted" because we wait for payment.
  
  if (status === "accepted") {
    // 1. Fetch Admin Settings for Wallet Config
    const Settings = require("../../../models/Settings");
    const adminSettings = await Settings.findOne() || await Settings.create({});
    const advancePercentage = adminSettings.walletConfig?.advancePercentage || 30;
    
    // 2. Calculate partial payments
    if (order.isBridalConsultation) {
        order.advancePaymentAmount = order.totalAmount;
        order.remainingPaymentAmount = 0;
    } else {
        order.advancePaymentAmount = Math.round(order.totalAmount * (advancePercentage / 100));
        order.remainingPaymentAmount = order.totalAmount - order.advancePaymentAmount;
    }
    order.advancePaymentStatus = "pending";
    order.remainingPaymentStatus = "pending";
    order.paymentStatus = "pending"; // Overall status
  }

  if (status === "ready-for-delivery" || status === "ready") {
    // Tell Customer the remaining amount is due
    if (order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== "paid") {
       order.remainingPaymentMethod = "pending"; // Reset to ensure customer selects cash/online
    }
  }

  const { transitionOrder } = require("../../../utils/orderStateMachine");
  transitionOrder(order, status, message || `Order status updated to ${status}`);

  await order.save();

  // --- All post-save notifications (non-critical, should not block response) ---
  try {
    let notificationType = "ORDER_STATUS_UPDATED";
    let title = "Order Update";
    let notificationMessage = message || `Your order ${order.orderId} status has been updated to ${status.replace(/-/g, ' ')}.`;
    
    if (status === "accepted") {
      notificationType = "ORDER_ACCEPTED";
      title = "Order Accepted - Advance Payment Required";
      notificationMessage = `Your order ${order.orderId} has been accepted by the tailor. Please pay the advance amount of ₹${order.advancePaymentAmount} to proceed.`;
    } else if (status === "cancelled") {
      notificationType = "ORDER_REJECTED";
      title = "Order Cancelled";
      notificationMessage = `Your order ${order.orderId} was cancelled.`;
    } else if (status === "ready-for-delivery" || status === "ready") {
      notificationType = "ORDER_STATUS_UPDATED";
      title = "Order Ready - Final Payment Due";
      notificationMessage = `Your order ${order.orderId} is ready for delivery. Please complete your remaining payment of ₹${order.remainingPaymentAmount}.`;
    }

    // Notify Customer about status update
    await sendNotification({
      recipient: order.customer,
      type: notificationType,
      title,
      message: notificationMessage,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
    
    // Auto-Assignment Logic for Deliveries (Second Cycle)
    // For Bridal Consultations, we bypass delivery partner assignment as the tailor handles it manually
    if ((status === "ready" || status === "ready-for-delivery") && autoAssign && !order.isBridalConsultation) {
      const { autoAssignDelivery } = require("../../../utils/deliveryAssignment");
      await autoAssignDelivery(order._id, "dropoff");
    }

    // If tailor specifically requested Manual or Shiprocket
    if ((status === "ready-for-pickup" || status === "ready-for-delivery") && deliveryMethod && deliveryMethod !== 'auto') {
        order.deliveryMethod = deliveryMethod;
        await order.save();
    }

    // --- Socket Emission for Customer & Delivery ---
    const { getIO } = require("../../../config/socket");
    const io = getIO();
    if (io) {
        let finalStatus = status;
        io.to(`user_${order.customer}`).emit('order_status_updated', {
            orderId: order.orderId,
            _id: order._id,
            status: finalStatus
        });

        if (finalStatus === 'ready-for-pickup' || finalStatus === 'ready-for-delivery' || finalStatus === 'fabric-ready-for-pickup' || finalStatus === 'ready') {
            io.to('delivery_partners').emit('receive_new_order', {
                orderId: order.orderId,
                _id: order._id,
                status: finalStatus,
                taskType: (finalStatus === 'ready' || finalStatus === 'ready-for-delivery') ? 'order-delivery' : 'fabric-pickup'
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


/**
 * @desc    Request customer to approve uploaded measurements
 * @route   POST /api/v1/tailors/orders/:id/send-measurement-confirmation
 * @access  Private (Tailor)
 */
exports.sendMeasurementForConfirmation = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, tailor: req.user.id });
  if (!order) return next(new ErrorResponse('Order not found or not assigned to you', 404));
  
  if (!['measurements-uploaded', 'pending'].includes(order.status)) {
    return next(new ErrorResponse('Order must be in pending or measurements-uploaded state to request approval', 400));
  }
  
  const { transitionOrder } = require("../../../utils/orderStateMachine");
  transitionOrder(order, 'measurement-verification', 'Measurements sent to customer for approval');
  await order.save();

  // Notify Customer
  try {
    const { sendNotification } = require('../../../utils/notification');
    await sendNotification({
      recipient: order.customer,
      type: 'MEASUREMENT_APPROVAL_REQUEST',
      title: 'Review Your Measurements 📏',
      message: `Tailor has requested your approval for the measurements of order ${order.orderId}`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
  } catch (err) {
    console.error("Notification failed:", err);
  }

  // Emit socket
  try {
    const { getIO } = require('../../../config/socket');
    const io = getIO();
    if (io) {
      io.to(`user_${order.customer}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
    }
  } catch (err) {
    console.error("Socket emission failed:", err);
  }

  res.status(200).json({ success: true, data: order });
});

/**
 * @desc    Get Measurement Report for an order
 * @route   GET /api/v1/tailors/orders/:id/measurement-report
 * @access  Private (Tailor)
 */
exports.getMeasurementReport = asyncHandler(async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, tailor: req.user.id }).populate('customer', 'name profileImage');
  if (!order) return next(new ErrorResponse('Order not found or not assigned to you', 404));

  const MeasurementReport = require("../../../models/MeasurementReport");
  const report = await MeasurementReport.findOne({ order: order._id }).populate("executive", "name phoneNumber profileImage");

  // Return null report instead of 404 to allow the frontend to handle empty state
  res.status(200).json({ success: true, data: { report: report || null, order } });
});

/**
 * @desc    Update Measurement Report
 * @route   PUT /api/v1/tailors/orders/:id/measurement-report
 * @access  Private (Tailor)
 */
exports.updateMeasurementReport = asyncHandler(async (req, res, next) => {
  const { measurements } = req.body;
  const order = await Order.findOne({ _id: req.params.id, tailor: req.user.id });

  if (!order) {
    return next(new ErrorResponse("Order not found or not authorized", 404));
  }

  const MeasurementReport = require("../../../models/MeasurementReport");
  let report = await MeasurementReport.findOne({ order: order._id });

  if (!report) {
    // Create report if it doesn't exist
    report = new MeasurementReport({
      order: order._id,
      formData: measurements || {},
      unit: "inches"
    });
  } else if (measurements && typeof measurements === 'object') {
    report.formData = measurements;
  }

  await report.save();

  res.status(200).json({
    success: true,
    data: report
  });
});