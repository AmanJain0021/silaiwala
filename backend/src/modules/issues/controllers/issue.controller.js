const mongoose = require("mongoose");
const crypto = require("crypto");
const Issue = require("../../../models/Issue");
const IssueMessage = require("../../../models/IssueMessage");
const Order = require("../../../models/Order");
const User = require("../../../models/User");
const { sendNotification } = require("../../../utils/notification");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const { getIO } = require("../../../config/socket");

// --- CUSTOMER CONTROLLERS ---

/**
 * @desc    Report a new stitching issue
 * @route   POST /api/v1/issues
 * @access  Private (Customer)
 */
exports.reportIssue = asyncHandler(async (req, res, next) => {
  const { orderId, description, images } = req.body;

  // Verify order
  const order = await Order.findById(orderId);
  if (!order) {
    return next(new ErrorResponse("Order not found", 404));
  }

  // Verify it belongs to customer
  if (order.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized to report issue for this order", 403));
  }

  // Ensure order is delivered
  if (order.status !== "delivered" && order.status !== "order-completed") {
    return next(new ErrorResponse("Can only report issues for delivered orders", 400));
  }

  // Ensure it's not a rework order itself
  if (order.isRework) {
    return next(new ErrorResponse("Cannot report an issue on a rework order", 400));
  }

  // Check expiration (7 days for now, could be dynamic from AdminSettings)
  const expirationDays = 7;
  const deliveryDate = order.updatedAt; // assuming updatedAt is roughly when it was delivered
  const now = new Date();
  const diffTime = Math.abs(now - deliveryDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > expirationDays) {
    return next(new ErrorResponse("The stitching issue reporting period has expired.", 400));
  }

  // Check if issue already exists
  const existingIssue = await Issue.findOne({ originalOrder: orderId });
  if (existingIssue) {
    return res.status(400).json({
        success: false,
        error: "An issue has already been reported for this order",
        issueId: existingIssue._id
    });
  }

  // Create issue
  const issue = await Issue.create({
    originalOrder: orderId,
    customer: req.user.id,
    tailor: order.tailor,
    description,
    images: images || [],
    status: "pending"
  });

  // Notify tailor
  await sendNotification({
    recipient: order.tailor,
    title: "New Stitching Issue Reported",
    message: `Customer reported an issue for order ${order.orderId}`,
    type: "ISSUE_REPORTED",
    data: { issueId: issue._id, targetUrl: "/partner/issues" }
  });

  res.status(201).json({
    success: true,
    data: issue
  });
});

/**
 * @desc    Get customer issues
 * @route   GET /api/v1/issues/customer
 * @access  Private (Customer)
 */
exports.getCustomerIssues = asyncHandler(async (req, res, next) => {
  const issues = await Issue.find({ customer: req.user.id })
    .populate("originalOrder", "orderId items totalAmount")
    .populate("tailor", "name shopName")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: issues
  });
});

// --- COMMON CONTROLLERS ---

/**
 * @desc    Get issue details
 * @route   GET /api/v1/issues/:id
 * @access  Private (Customer, Tailor, Admin)
 */
exports.getIssueDetails = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id)
    .populate("originalOrder")
    .populate("reworkOrder")
    .populate("customer", "name phoneNumber profileImage")
    .populate("tailor", "name shopName profileImage");

  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }

  // Access control
  if (req.user.role === "customer" && issue.customer._id.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }
  if (req.user.role === "tailor" && issue.tailor._id.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }

  res.status(200).json({
    success: true,
    data: issue
  });
});

// --- TAILOR CONTROLLERS ---

/**
 * @desc    Get tailor issues
 * @route   GET /api/v1/issues/tailor/list
 * @access  Private (Tailor)
 */
exports.getTailorIssues = asyncHandler(async (req, res, next) => {
  const issues = await Issue.find({ tailor: req.user.id })
    .populate("originalOrder", "orderId items totalAmount")
    .populate("customer", "name profileImage")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: issues
  });
});

/**
 * @desc    Update issue status (Accept, Reject)
 * @route   PATCH /api/v1/issues/:id/status
 * @access  Private (Tailor)
 */
exports.updateIssueStatus = asyncHandler(async (req, res, next) => {
  const { status, rejectionReason } = req.body;
  const issue = await Issue.findById(req.params.id).populate("originalOrder");

  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }
  if (issue.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }

  if (status === "rejected" && !rejectionReason) {
    return next(new ErrorResponse("Rejection reason is required", 400));
  }

  issue.status = status;
  if (status === "rejected") {
    issue.rejectionReason = rejectionReason;
  }

  await issue.save();

  // Notify customer
  let message = `Tailor has updated your reported issue to ${status}.`;
  if (status === "accepted") {
    message = `Tailor has accepted your issue. They will arrange a pickup soon.`;
  } else if (status === "rejected") {
    message = `Tailor rejected your issue: ${rejectionReason}`;
  }

    await sendNotification({
      user: issue.customer,
      title: "Issue Status Updated",
      message: message,
      type: "info",
      data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` }
    });

  res.status(200).json({
    success: true,
    data: issue
  });
});

/**
 * @desc    Arrange pickup for an accepted issue (Creates cloned rework order)
 * @route   POST /api/v1/issues/:id/arrange-pickup
 * @access  Private (Tailor)
 */
exports.arrangePickup = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id).populate("originalOrder");

  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }
  if (issue.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }
  if (issue.status !== "accepted") {
    return next(new ErrorResponse("Issue must be accepted before arranging pickup", 400));
  }
  if (issue.reworkOrder) {
    return next(new ErrorResponse("Pickup already arranged for this issue", 400));
  }

  const original = issue.originalOrder;

  // Create Cloned Rework Order
  const newOrderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  
  const reworkOrder = await Order.create({
    orderId: newOrderId,
    customer: original.customer,
    tailor: original.tailor,
    items: original.items.map(i => ({
      ...i.toObject(),
      price: 0 // No charge for rework
    })),
    totalAmount: 0,
    status: "fabric-ready-for-pickup", // Delivery partners will see this for pickup
    deliveryMethod: original.deliveryMethod,
    fabricPickupRequired: true, // Crucial: triggers the pickup from customer to tailor
    isRework: true,
    parentOrder: original._id
  });

  issue.reworkOrder = reworkOrder._id;
  issue.status = "pickup_pending";
  await issue.save();

  // The existing delivery.controller will automatically see this new Order 
  // and assign a delivery partner for fabricPickup because fabricPickupRequired is true.
  
  await sendNotification({
    user: issue.customer,
    title: "Pickup Arranged",
    message: `A delivery partner will be assigned to pick up your garment for rework.`,
    type: "info",
    data: { issueId: issue._id, orderId: reworkOrder._id, targetUrl: `/user/issues/${issue._id}` }
  });

  res.status(200).json({
    success: true,
    data: issue
  });
});

// --- ADMIN CONTROLLERS ---

/**
 * @desc    Get all issues for Admin
 * @route   GET /api/v1/issues/admin/list
 * @access  Private (Admin)
 */
exports.getAdminIssues = asyncHandler(async (req, res, next) => {
  const issues = await Issue.find()
    .populate("originalOrder", "orderId totalAmount")
    .populate("customer", "name phoneNumber")
    .populate("tailor", "name shopName")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    data: issues
  });
});

/**
 * @desc    Force update issue status by Admin
 * @route   PATCH /api/v1/issues/admin/:id/status
 * @access  Private (Admin)
 */
exports.adminUpdateIssueStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }

  issue.status = status;
  await issue.save();

  res.status(200).json({
    success: true,
    data: issue
  });
});

// --- CHAT CONTROLLERS ---

/**
 * @desc    Get issue chat history
 * @route   GET /api/v1/issues/:id/chat
 * @access  Private (Customer, Tailor, Admin)
 */
exports.getIssueChat = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }

  // Access control
  if (req.user.role === "customer" && issue.customer.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }
  if (req.user.role === "tailor" && issue.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }

  const messages = await IssueMessage.find({ issue: issue._id })
    .populate("sender", "name profileImage role")
    .sort("createdAt");

  res.status(200).json({
    success: true,
    data: messages
  });
});

/**
 * @desc    Send issue chat message (HTTP Fallback)
 * @route   POST /api/v1/issues/:id/chat
 * @access  Private (Customer, Tailor, Admin)
 */
exports.sendIssueMessage = asyncHandler(async (req, res, next) => {
  const { message, imageUrl } = req.body;
  const issue = await Issue.findById(req.params.id);
  
  if (!issue) {
    return next(new ErrorResponse("Issue not found", 404));
  }

  if (issue.status === "closed" || issue.status === "resolved") {
    return next(new ErrorResponse("Cannot send message to a closed issue", 400));
  }

  const msg = await IssueMessage.create({
    issue: issue._id,
    sender: req.user.id,
    senderModel: "User",
    message,
    imageUrl
  });

  await msg.populate("sender", "name profileImage role");

  const io = getIO();
  io.to(`issue_${issue._id}`).emit("receive_issue_message", msg);

  res.status(201).json({
    success: true,
    data: msg
  });
});
