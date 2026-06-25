const MeasurementExecutive = require("../../../models/MeasurementExecutive");
const mongoose = require("mongoose");
const MeasurementRequest = require("../../../models/MeasurementRequest");
const MeasurementReport = require("../../../models/MeasurementReport");
const Order = require("../../../models/Order");
const { transitionOrder } = require("../../../utils/orderStateMachine");
const User = require("../../../models/User");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { sendNotification } = require("../../../utils/notification");
const { getIO } = require("../../../config/socket");
const { autoAssignMeasurementExecutive } = require("../../../utils/measurementAssignment");
const crypto = require("crypto");

// ───────────────────────────────────────────────────────────────────────────────
// PROFILE
// ───────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get executive profile
 * @route   GET /api/v1/measurement-executive/profile
 * @access  Private (measurement_executive)
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const profile = await MeasurementExecutive.findOne({ user: req.user.id });

  if (!profile) {
    return next(new ErrorResponse("Executive profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { user, profile },
  });
});

/**
 * @desc    Update executive location
 * @route   PUT /api/v1/measurement-executive/location
 * @access  Private (measurement_executive)
 */
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { coordinates } = req.body; // [longitude, latitude]

  if (!coordinates || coordinates.length < 2) {
    return next(new ErrorResponse("Please provide valid coordinates [longitude, latitude]", 400));
  }

  const profile = await MeasurementExecutive.findOneAndUpdate(
    { user: req.user.id },
    {
      currentLocation: {
        type: "Point",
        coordinates,
      },
    },
    { new: true }
  );

  if (!profile) {
    return next(new ErrorResponse("Executive profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
});

/**
 * @desc    Toggle availability status
 * @route   PUT /api/v1/measurement-executive/availability
 * @access  Private (measurement_executive)
 */
exports.toggleAvailability = asyncHandler(async (req, res, next) => {
  const { status } = req.body; // "online" or "offline"

  if (!["online", "offline"].includes(status)) {
    return next(new ErrorResponse("Status must be 'online' or 'offline'", 400));
  }

  const profile = await MeasurementExecutive.findOneAndUpdate(
    { user: req.user.id },
    { availabilityStatus: status },
    { new: true }
  );

  if (!profile) {
    return next(new ErrorResponse("Executive profile not found", 404));
  }

  res.status(200).json({
    success: true,
    message: `You are now ${status}`,
    data: profile,
  });
});

/**
 * @desc    Update executive profile
 * @route   PUT /api/v1/measurement-executive/profile
 * @access  Private (measurement_executive)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    "address", "serviceRadius", "profilePhoto", "aadharNumber",
    "emergencyContact", "bankDetails", "documents",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const profile = await MeasurementExecutive.findOneAndUpdate(
    { user: req.user.id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!profile) {
    return next(new ErrorResponse("Executive profile not found", 404));
  }

  // Also update user-level fields if provided
  if (req.body.name || req.body.profileImage) {
    const userUpdate = {};
    if (req.body.name) userUpdate.name = req.body.name;
    if (req.body.profileImage) userUpdate.profileImage = req.body.profileImage;
    await User.findByIdAndUpdate(req.user.id, userUpdate);
  }

  res.status(200).json({
    success: true,
    data: profile,
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// REQUESTS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get measurement requests for the executive
 * @route   GET /api/v1/measurement-executive/requests
 * @access  Private (measurement_executive)
 */
exports.getMyRequests = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const query = { executive: req.user.id };

  if (status) {
    if (status === "active") {
      query.status = { $in: ["assigned", "accepted", "otp_sent", "otp_verified", "measurements_uploaded"] };
    } else if (status === "completed") {
      query.status = "completed";
    } else if (status === "pending") {
      query.status = { $in: ["assigned"] };
    } else {
      query.status = status;
    }
  }

  const requests = await MeasurementRequest.find(query)
    .populate("customer", "name phoneNumber profileImage")
    .populate("tailor", "name phoneNumber profileImage")
    .populate("order", "orderId totalAmount status items")
    .sort("-createdAt")
    .lean();

  const profile = await MeasurementExecutive.findOne({ user: req.user.id }).lean();
  let execCoords = null;
  if (profile?.currentLocation?.coordinates?.length === 2) {
    execCoords = profile.currentLocation.coordinates;
  }

  const requestsWithDistance = requests.map(request => {
    let distance = null;
    if (execCoords && request.customerLocation?.coordinates?.length === 2) {
      const [lon1, lat1] = execCoords;
      const [lon2, lat2] = request.customerLocation.coordinates;
      
      // Haversine formula
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = (R * c).toFixed(1);
    }
    return { ...request, distance };
  });

  res.status(200).json({
    success: true,
    count: requestsWithDistance.length,
    data: requestsWithDistance,
  });
});

/**
 * @desc    Get single request detail
 * @route   GET /api/v1/measurement-executive/requests/:id
 * @access  Private (measurement_executive, admin)
 */
exports.getRequestDetail = asyncHandler(async (req, res, next) => {
  const request = await MeasurementRequest.findById(req.params.id)
    .populate("customer", "name phoneNumber profileImage email")
    .populate("tailor", "name phoneNumber profileImage")
    .populate("executive", "name phoneNumber profileImage")
    .populate("order", "orderId totalAmount status items deliveryAddress")
    .lean();

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  // Check ownership (executive or admin)
  if (
    request.executive?._id?.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    return next(new ErrorResponse("Not authorized to view this request", 403));
  }

  // Also fetch report if exists
  const report = await MeasurementReport.findOne({
    measurementRequest: request._id,
  }).lean();

  const profile = await MeasurementExecutive.findOne({ user: req.user.id }).lean();
  let distance = null;
  if (profile?.currentLocation?.coordinates?.length === 2 && request.customerLocation?.coordinates?.length === 2) {
    const [lon1, lat1] = profile.currentLocation.coordinates;
    const [lon2, lat2] = request.customerLocation.coordinates;
    
    // Haversine formula
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    distance = (R * c).toFixed(1);
  }

  res.status(200).json({
    success: true,
    data: { ...request, report, distance },
  });
});

/**
 * @desc    Accept a measurement request
 * @route   PUT /api/v1/measurement-executive/requests/:id/accept
 * @access  Private (measurement_executive)
 */
exports.acceptRequest = asyncHandler(async (req, res, next) => {
  const request = await MeasurementRequest.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (request.status !== "assigned") {
    return next(new ErrorResponse(`Cannot accept request in '${request.status}' state`, 400));
  }

  request.status = "accepted";
  await request.save();

  // Update order status
  const order = await Order.findById(request.order);
  if (order) {
    order.status = "measurement-accepted";
    order.trackingHistory.push({
      status: "measurement-accepted",
      message: "Measurement executive has accepted the request and is on the way.",
      timestamp: new Date(),
    });
    await order.save();
  }

  // Get executive user info
  const execUser = await User.findById(req.user.id).lean();

  // Notify customer
  await sendNotification({
    recipient: request.customer,
    type: "MEASUREMENT_ACCEPTED",
    title: "Measurement Executive On The Way! 🏃",
    message: `${execUser?.name || "An executive"} has accepted your measurement request for order ${order?.orderId || "N/A"}.`,
    data: { orderId: order?._id, targetUrl: "/user/orders" },
  });

  // Socket notifications
  const io = getIO();
  if (io) {
    io.to(`user_${request.customer}`).emit("measurement_request_accepted", {
      requestId: request._id,
      orderId: order?.orderId,
      executiveName: execUser?.name,
      executivePhone: execUser?.phoneNumber,
    });

    io.to(`user_${request.customer}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });

    io.to(`user_${request.tailor}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });
  }

  res.status(200).json({
    success: true,
    message: "Request accepted successfully",
    data: request,
  });
});

/**
 * @desc    Reject a measurement request
 * @route   PUT /api/v1/measurement-executive/requests/:id/reject
 * @access  Private (measurement_executive)
 */
exports.rejectRequest = asyncHandler(async (req, res, next) => {
  const request = await MeasurementRequest.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (!["assigned", "accepted"].includes(request.status)) {
    return next(new ErrorResponse(`Cannot reject request in '${request.status}' state`, 400));
  }

  // Add to rejectedBy and reset
  request.rejectedBy.push(req.user.id);
  request.executive = null;
  request.status = "pending";
  await request.save();

  // Try to re-assign to next nearest executive
  const order = await Order.findById(request.order);
  if (order) {
    order.status = "measurement-requested";
    order.trackingHistory.push({
      status: "measurement-requested",
      message: "Previous executive declined. Searching for another executive.",
      timestamp: new Date(),
    });
    await order.save();

    await autoAssignMeasurementExecutive(order);
  }

  res.status(200).json({
    success: true,
    message: "Request rejected. Searching for another executive.",
    data: request,
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// OTP
// ───────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Generate OTP for measurement verification
 * @route   POST /api/v1/measurement-executive/requests/:id/generate-otp
 * @access  Private (measurement_executive)
 */
exports.generateOTP = asyncHandler(async (req, res, next) => {
  const request = await MeasurementRequest.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (!["measurements_uploaded", "otp_sent"].includes(request.status)) {
    return next(new ErrorResponse("You must upload measurements before generating OTP", 400));
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  request.otp = otp;
  request.otpExpiresAt = expiresAt;
  request.status = "otp_sent";
  await request.save();

  // Log OTP (in production, send via SMS)
  console.log(`📐 [OTP] Measurement OTP for request ${request.requestId}: ${otp}`);

  // Notify customer with OTP
  await sendNotification({
    recipient: request.customer,
    type: "MEASUREMENT_OTP",
    title: "Measurement Verification OTP",
    message: `Your OTP for measurement verification is: ${otp}. Please share with the executive. Valid for 10 minutes.`,
    data: {
      requestId: request._id,
      otp, // Include in notification for easy access
      targetUrl: "/user/orders",
    },
  });

  // Socket: notify customer
  const io = getIO();
  if (io) {
    const otpEventData = {
      requestId: request._id,
      requestIdStr: request.requestId,
      message: "OTP sent for measurement verification. Please share with the executive.",
      otp, // Send to customer's app
    };

    io.to(`user_${request.customer}`).emit("measurement_otp_sent", otpEventData);
    
    // Also emit to the order room so the OrderTracking page receives it immediately
    if (request.order) {
        const Order = require("../../../models/Order");
        const orderDoc = await Order.findById(request.order).lean();
        if (orderDoc) {
            io.to(`order_${orderDoc._id}`).emit("measurement_otp_sent", otpEventData);
        }
    }
  }

  res.status(200).json({
    success: true,
    message: "OTP generated and sent to customer",
  });
});

/**
 * @desc    Verify OTP
 * @route   POST /api/v1/measurement-executive/requests/:id/verify-otp
 * @access  Private (measurement_executive)
 */
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  if (!otp) {
    return next(new ErrorResponse("Please provide the OTP", 400));
  }

  const request = await MeasurementRequest.findById(req.params.id).select("+otp");

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (request.status !== "otp_sent") {
    return next(new ErrorResponse("OTP has not been sent yet", 400));
  }

  // Check expiry
  if (request.otpExpiresAt && new Date() > request.otpExpiresAt) {
    return next(new ErrorResponse("OTP has expired. Please generate a new one.", 400));
  }

  // Allow dev bypass: "123456"
  const isDev = process.env.NODE_ENV !== "production";
  const isValid = request.otp === otp || (isDev && otp === "123456");

  if (!isValid) {
    return next(new ErrorResponse("Invalid OTP", 400));
  }

  request.otpVerified = true;
  request.status = "otp_verified";
  request.otp = undefined; // Clear OTP after verification
  await request.save();

  // Update order
  const order = await Order.findById(request.order);
  if (order) {
    order.status = "measurement-otp-verified";
    order.trackingHistory.push({
      status: "measurement-otp-verified",
      message: "OTP verified successfully. Executive is taking measurements.",
      timestamp: new Date(),
    });
    await order.save();
  }

  // Socket notifications
  const io = getIO();
  if (io) {
    io.to(`user_${request.customer}`).emit("measurement_otp_verified", {
      requestId: request._id,
      orderId: order?.orderId,
    });

    io.to(`user_${request.tailor}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });
  }

  res.status(200).json({
    success: true,
    message: "OTP verified successfully. You can now upload measurements.",
  });
});

// ───────────────────────────────────────────────────────────────────────────────
// MEASUREMENT UPLOAD
// ───────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Upload measurement data
 * @route   POST /api/v1/measurement-executive/requests/:id/upload
 * @access  Private (measurement_executive)
 */
exports.uploadMeasurement = asyncHandler(async (req, res, next) => {
  const { formData, unit, pdfUrl, photos, notes } = req.body;

  const request = await MeasurementRequest.findById(req.params.id);

  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (request.status !== "accepted") {
    return next(new ErrorResponse("Measurements can only be uploaded when request is accepted", 400));
  }

  if (!formData || Object.keys(formData).length === 0) {
    return next(new ErrorResponse("Please provide measurement data", 400));
  }

  // Create MeasurementReport
  const report = await MeasurementReport.create({
    measurementRequest: request._id,
    order: request.order,
    executive: req.user.id,
    formData,
    unit: unit || "inches",
    pdfUrl: pdfUrl || null,
    photos: photos || [],
    notes: notes || "",
  });

  // Update request status
  request.status = "measurements_uploaded";
  await request.save();

  // Update order with measurement report reference
  const order = await Order.findById(request.order);
  if (order) {
    order.measurementReport = report._id;
    order.status = "measurements-uploaded";
    order.trackingHistory.push({
      status: "measurements-uploaded",
      message: "Measurements have been uploaded by the executive.",
      timestamp: new Date(),
    });
    await order.save();
  }

  // Update executive stats
  await MeasurementExecutive.findOneAndUpdate(
    { user: req.user.id },
    { $inc: { totalMeasurements: 1 } }
  );

  // Get executive info for notifications
  const execUser = await User.findById(req.user.id).lean();

  // Notify tailor
  await sendNotification({
    recipient: request.tailor,
    type: "MEASUREMENT_UPLOADED",
    title: "Measurements Received! 📏",
    message: `Measurements for order ${order?.orderId || "N/A"} have been uploaded by ${execUser?.name || "executive"}.`,
    data: {
      orderId: order?._id,
      reportId: report._id,
      targetUrl: "/orders",
    },
  });

  // Notify customer
  await sendNotification({
    recipient: request.customer,
    type: "MEASUREMENT_UPLOADED",
    title: "Measurements Submitted ✅",
    message: `Your measurements for order ${order?.orderId || "N/A"} have been recorded successfully.`,
    data: { orderId: order?._id, targetUrl: "/user/orders" },
  });

  // Socket notifications
  const io = getIO();
  if (io) {
    io.to(`user_${request.tailor}`).emit("measurement_uploaded", {
      requestId: request._id,
      orderId: order?.orderId,
      reportId: report._id,
    });

    io.to(`user_${request.tailor}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });

    io.to(`user_${request.customer}`).emit("measurement_uploaded", {
      requestId: request._id,
      orderId: order?.orderId,
      reportId: report._id,
    });

    io.to(`user_${request.customer}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });
  }

  res.status(201).json({
    success: true,
    message: "Measurements uploaded successfully",
    data: report,
  });
});

/**
 * @desc    Complete a measurement request
 * @route   PUT /api/v1/measurement-executive/requests/:id/complete
 * @access  Private (measurement_executive)
 */
exports.completeMeasurement = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

  const request = await MeasurementRequest.findById(req.params.id).session(session);

  if (!request) {
    await session.abortTransaction();
      return next(new ErrorResponse("Measurement request not found", 404));
  }

  if (request.executive?.toString() !== req.user.id) {
    await session.abortTransaction();
      return next(new ErrorResponse("This request is not assigned to you", 403));
  }

  if (request.status !== "otp_verified") {
    await session.abortTransaction();
      return next(new ErrorResponse("OTP must be verified before completing", 400));
  }

  request.status = "completed";
  await request.save({ session });

  // Calculate and process payout for the Measurement Executive
  try {
    const profile = await MeasurementExecutive.findOne({ user: req.user.id }).session(session).lean();
    let distance = 0;
    
    if (profile?.currentLocation?.coordinates?.length === 2 && request.customerLocation?.coordinates?.length === 2) {
      const [lon1, lat1] = profile.currentLocation.coordinates;
      const [lon2, lat2] = request.customerLocation.coordinates;
      
      // Haversine formula
      const R = 6371; // km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = parseFloat((R * c).toFixed(1));
    }

    const Settings = require("../../../models/Settings");
    const WalletTransaction = require("../../../models/WalletTransaction");
    const settings = await Settings.findOne().session(session).lean();

    const baseFee = settings?.executiveRates?.baseFee || 50;
    const perKmRate = settings?.executiveRates?.perKmRate || 15;
    
    // Total earned amount based on distance
    const earnedAmount = baseFee + (distance * perKmRate);

    // Prevent duplicate credit
    const existingTx = await WalletTransaction.findOne({
      user: req.user.id,
      order: request.order,
      category: "executive_earnings"
    }).session(session);

    if (!existingTx && earnedAmount > 0) {
      // Add to Executive profile
      await MeasurementExecutive.findOneAndUpdate(
        { user: req.user.id },
        { 
          $inc: { 
            walletBalance: earnedAmount,
            totalEarned: earnedAmount
          } 
        }
      );

      // Create a WalletTransaction record
      await WalletTransaction.create([{
        user: req.user.id,
        amount: earnedAmount,
        type: "credit",
        category: "executive_earnings",
        order: request.order,
        description: `Measurement payout for completed task (${distance}km)`,
      }], { session });

      console.log(`Credited ₹${earnedAmount} to Measurement Executive ${req.user.id} for distance ${distance}km`);
    }
  } catch (err) {
    console.error("Failed to process measurement executive payout:", err);
  }

  // Update order
  const order = await Order.findById(request.order).session(session);
  if (order) {
    order.status = "measurements-approved";
    order.trackingHistory.push({
      status: "measurements-approved",
      message: "Measurement process completed. Order is ready for processing.",
      timestamp: new Date(),
    });
    await order.save({ session });
  }

  // Socket notifications
  const io = getIO();
  if (io) {
    io.to(`user_${request.customer}`).emit("measurement_completed", {
      requestId: request._id,
      orderId: order?.orderId,
    });
    io.to(`user_${request.tailor}`).emit("measurement_completed", {
      requestId: request._id,
      orderId: order?.orderId,
    });
    io.to(`user_${request.tailor}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });
    io.to(`user_${request.customer}`).emit("order_status_updated", {
      orderId: order?.orderId,
      _id: order?._id,
      status: order?.status,
    });
  }

  await session.commitTransaction();
    res.status(200).json({
    success: true,
    message: "Measurement completed successfully",
    data: request,
  });
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted in completeMeasurement:", error);
    return next(new ErrorResponse("Transaction failed", 500));
  } finally {
    session.endSession();
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS
// ───────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all measurement executives (Admin)
 * @route   GET /api/v1/measurement-executive/admin/executives
 * @access  Private (admin)
 */
exports.getAllExecutives = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = {};
  if (status) query.verificationStatus = status;

  const executives = await MeasurementExecutive.find(query)
    .populate("user", "name email phoneNumber profileImage isActive")
    .sort("-createdAt")
    .lean();

  res.status(200).json({
    success: true,
    count: executives.length,
    data: executives,
  });
});

/**
 * @desc    Approve/Reject/Suspend an executive (Admin)
 * @route   PUT /api/v1/measurement-executive/admin/executives/:id/status
 * @access  Private (admin)
 */
exports.updateExecutiveStatus = asyncHandler(async (req, res, next) => {
  const { verificationStatus } = req.body;

  if (!["pending", "verified", "rejected"].includes(verificationStatus)) {
    return next(new ErrorResponse("Invalid verification status", 400));
  }

  const profile = await MeasurementExecutive.findById(req.params.id);
  if (!profile) {
    return next(new ErrorResponse("Executive profile not found", 404));
  }

  profile.verificationStatus = verificationStatus;
  await profile.save();

  // Activate/deactivate user account
  const isActive = verificationStatus === "verified";
  await User.findByIdAndUpdate(profile.user, { isActive, isVerified: isActive });

  // Notify executive
  const title =
    verificationStatus === "verified"
      ? "Account Approved! ✅"
      : "Account Status Updated";
  const message =
    verificationStatus === "verified"
      ? "Your measurement executive account has been approved. You can now go online!"
      : `Your account status has been updated to: ${verificationStatus}`;

  await sendNotification({
    recipient: profile.user,
    type: "ACCOUNT_STATUS",
    title,
    message,
    data: { targetUrl: "/executive/dashboard" },
  });

  res.status(200).json({
    success: true,
    message: `Executive status updated to ${verificationStatus}`,
    data: profile,
  });
});

/**
 * @desc    Get all measurement requests (Admin)
 * @route   GET /api/v1/measurement-executive/admin/requests
 * @access  Private (admin)
 */
exports.getAllRequests = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = {};
  if (status) query.status = status;

  const requests = await MeasurementRequest.find(query)
    .populate("customer", "name phoneNumber profileImage")
    .populate("tailor", "name phoneNumber profileImage")
    .populate("executive", "name phoneNumber profileImage")
    .populate("order", "orderId totalAmount status")
    .sort("-createdAt")
    .lean();

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

/**
 * @desc    Admin manually assign/reassign executive
 * @route   PUT /api/v1/measurement-executive/admin/requests/:id/assign
 * @access  Private (admin)
 */
exports.adminAssignExecutive = asyncHandler(async (req, res, next) => {
  const { executiveUserId } = req.body;

  if (!executiveUserId) {
    return next(new ErrorResponse("Please provide executiveUserId", 400));
  }

  const request = await MeasurementRequest.findById(req.params.id);
  if (!request) {
    return next(new ErrorResponse("Measurement request not found", 404));
  }

  // Verify the executive exists and is verified
  const execProfile = await MeasurementExecutive.findOne({
    user: executiveUserId,
    verificationStatus: "verified",
  });
  if (!execProfile) {
    return next(new ErrorResponse("Executive not found or not verified", 404));
  }

  request.executive = executiveUserId;
  request.status = "assigned";
  await request.save();

  // Update order
  const order = await Order.findById(request.order);
  if (order) {
    order.status = "measurement-assigned";
    order.trackingHistory.push({
      status: "measurement-assigned",
      message: "Measurement executive manually assigned by admin.",
      timestamp: new Date(),
    });
    await order.save();
  }

  // Notify the executive
  const customer = await User.findById(request.customer).lean();
  await sendNotification({
    recipient: executiveUserId,
    type: "NEW_MEASUREMENT_REQUEST",
    title: "New Measurement Assignment 📐",
    message: `You have been assigned a measurement request for order ${order?.orderId || "N/A"}. Customer: ${customer?.name || "N/A"}.`,
    data: {
      requestId: request._id,
      orderId: order?._id,
      targetUrl: "/executive/requests",
    },
  });

  const io = getIO();
  if (io) {
    io.to(`user_${executiveUserId}`).emit("new_measurement_request", {
      requestId: request._id,
      requestIdStr: request.requestId,
      orderId: order?._id,
      orderIdStr: order?.orderId,
      customerName: customer?.name || "N/A",
      status: "assigned",
    });
  }

  res.status(200).json({
    success: true,
    message: "Executive assigned successfully",
    data: request,
  });
});

/**
 * @desc    Get dashboard stats for executive
 * @route   GET /api/v1/measurement-executive/dashboard
 * @access  Private (measurement_executive)
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [profile, totalPending, totalAccepted, completedToday, totalCompleted] =
    await Promise.all([
      MeasurementExecutive.findOne({ user: req.user.id }),
      MeasurementRequest.countDocuments({
        executive: req.user.id,
        status: { $in: ["assigned"] },
      }),
      MeasurementRequest.countDocuments({
        executive: req.user.id,
        status: { $in: ["accepted", "otp_sent", "otp_verified", "measurements_uploaded"] },
      }),
      MeasurementRequest.countDocuments({
        executive: req.user.id,
        status: "completed",
        updatedAt: { $gte: today },
      }),
      MeasurementRequest.countDocuments({
        executive: req.user.id,
        status: "completed",
      }),
    ]);

  res.status(200).json({
    success: true,
    data: {
      profile,
      stats: {
        totalPending,
        totalAccepted,
        completedToday,
        totalCompleted,
        totalMeasurements: profile?.totalMeasurements || 0,
      },
    },
  });
});
