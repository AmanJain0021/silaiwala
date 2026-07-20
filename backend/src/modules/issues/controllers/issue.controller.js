const mongoose = require("mongoose");
const crypto = require("crypto");
const Issue = require("../../../models/Issue.js");
const IssueMessage = require("../../../models/IssueMessage.js");
const Order = require("../../../models/Order.js");
const User = require("../../../models/User.js");
const { sendNotification } = require("../../../utils/notification.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const { getIO } = require("../../../config/socket.js");

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

  // Generate issueId
  const issueIdString = `ISS-${Math.floor(100000 + Math.random() * 900000)}`;

  // Create issue
  const issue = await Issue.create({
    issueId: issueIdString,
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
      recipient: issue.customer,
      type: "ISSUE_UPDATED",
      title: "Issue Status Updated",
      message: message,
      data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` }
    });

  res.status(200).json({
    success: true,
    data: issue
  });
});

async function ensureReworkOrder(issue, original) {
  if (issue.reworkOrder) {
    return Order.findById(issue.reworkOrder);
  }

  const newOrderId = `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const reworkOrder = await Order.create({
    orderId: newOrderId,
    customer: original.customer,
    tailor: original.tailor,
    deliveryAddress: original.deliveryAddress,
    items: original.items.map((i) => ({
      ...i.toObject(),
      price: 0,
    })),
    totalAmount: 0,
    status: "accepted",
    fabricPickupRequired: true,
    isRework: true,
    parentOrder: original._id,
    relatedIssue: issue._id,
  });

  issue.reworkOrder = reworkOrder._id;
  await issue.save();
  return reworkOrder;
}

/**
 * @desc    Distance-based delivery quote for rework (tailor pays)
 * @route   GET /api/v1/issues/:id/delivery-quote?cycle=pickup|dropoff
 */
exports.getReworkDeliveryQuote = asyncHandler(async (req, res, next) => {
  const cycle = req.query.cycle === "dropoff" ? "dropoff" : "pickup";
  const issue = await Issue.findById(req.params.id).populate("originalOrder");

  if (!issue) return next(new ErrorResponse("Issue not found", 404));
  if (issue.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }
  if (!["accepted", "pickup_pending", "pickup_completed", "rework_in_progress", "ready_for_delivery"].includes(issue.status)) {
    return next(new ErrorResponse("Delivery can be arranged only after accepting the issue", 400));
  }

  const { calculateOrderLegFee } = require("../../../utils/deliveryFeeCalculator.js");
  const Tailor = require("../../../models/Tailor.js");
  const tailorProfile = await Tailor.findOne({ user: req.user.id }).lean();

  const orderForQuote = issue.originalOrder;
  const quote = await calculateOrderLegFee(orderForQuote, cycle);

  res.status(200).json({
    success: true,
    data: {
      ...quote,
      walletBalance: tailorProfile?.walletBalance || 0,
      canAfford: (tailorProfile?.walletBalance || 0) >= quote.deliveryFee,
      cycle,
    },
  });
});

/**
 * @desc    Tailor pays distance-based fee and assigns delivery (broadcast / manual)
 * @route   POST /api/v1/issues/:id/dispatch-delivery
 */
exports.dispatchReworkDelivery = asyncHandler(async (req, res, next) => {
  const { deliveryMethod, cycle: cycleBody } = req.body;
  const cycle = cycleBody === "dropoff" ? "dropoff" : "pickup";

  if (!deliveryMethod || !["broadcast", "manual"].includes(deliveryMethod)) {
    return next(new ErrorResponse("deliveryMethod must be broadcast or manual", 400));
  }

  const issue = await Issue.findById(req.params.id).populate("originalOrder");
  if (!issue) return next(new ErrorResponse("Issue not found", 404));
  if (issue.tailor.toString() !== req.user.id) {
    return next(new ErrorResponse("Not authorized", 403));
  }
  if (issue.status === "pending" || issue.status === "rejected") {
    return next(new ErrorResponse("Accept the issue before assigning delivery", 400));
  }

  const original = issue.originalOrder;
  let reworkOrder = await ensureReworkOrder(issue, original);

  const { calculateOrderLegFee } = require("../../../utils/deliveryFeeCalculator.js");
  const Tailor = require("../../../models/Tailor.js");
  const WalletTransaction = require("../../../models/WalletTransaction.js");
  const quote = await calculateOrderLegFee(original, cycle);

  const tailorProfile = await Tailor.findOne({ user: req.user.id });
  if (!tailorProfile) return next(new ErrorResponse("Tailor profile not found", 404));

  if ((tailorProfile.walletBalance || 0) < quote.deliveryFee) {
    return next(
      new ErrorResponse(
        `Insufficient wallet balance. Need ₹${quote.deliveryFee} (distance ~${quote.distanceKm} km). Please top up your wallet.`,
        400
      )
    );
  }

  const chargeKey =
    cycle === "pickup" ? "reworkPickupDeliveryPaid" : "reworkReturnDeliveryPaid";
  if (reworkOrder[chargeKey]) {
    return next(new ErrorResponse(`Delivery charge for ${cycle} leg already paid`, 400));
  }

  tailorProfile.walletBalance -= quote.deliveryFee;
  await tailorProfile.save();

  await WalletTransaction.create({
    user: req.user.id,
    amount: quote.deliveryFee,
    type: "debit",
    category: "commission_deduction",
    order: reworkOrder._id,
    status: "completed",
    description: `Rework ${cycle} delivery partner charge (₹${quote.deliveryFee}, ${quote.distanceKm} km)`,
  });

  reworkOrder.deliveryFee = quote.deliveryFee;
  reworkOrder.deliveryPartnerEarning = quote.deliveryFee;
  reworkOrder.deliveryEarnings = quote.deliveryFee;
  reworkOrder.deliveryDistance = quote.distanceKm;
  reworkOrder.deliveryMethod = deliveryMethod;
  reworkOrder[chargeKey] = true;

  if (cycle === "pickup") {
    reworkOrder.status = "fabric-ready-for-pickup";
    reworkOrder.fabricPickupRequired = true;
    issue.status = "pickup_pending";
  } else {
    reworkOrder.status = "ready-for-delivery";
    reworkOrder.fabricPickupRequired = false;
    issue.status = "ready_for_delivery";
  }

  reworkOrder.trackingHistory = reworkOrder.trackingHistory || [];
  reworkOrder.trackingHistory.push({
    status: reworkOrder.status,
    message: `Tailor paid ₹${quote.deliveryFee} for ${cycle} delivery (${quote.distanceKm} km) — ${deliveryMethod} assignment`,
    timestamp: new Date(),
  });

  await reworkOrder.save();
  await issue.save();

  if (deliveryMethod === "broadcast") {
    const { autoAssignDelivery } = require("../../../utils/deliveryAssignment.js");
    await autoAssignDelivery(reworkOrder._id, cycle === "pickup" ? "pickup" : "dropoff");
  } else {
    reworkOrder.pendingPartnerCandidates = [];
    if (cycle === "pickup") {
      reworkOrder.pickupDeliveryStatus = "pending";
    } else {
      reworkOrder.dropoffDeliveryStatus = "pending";
    }
    await reworkOrder.save();

    await sendNotification({
      recipient: "admins",
      type: "SYSTEM_NOTICE",
      title: "Rework delivery — manual assignment",
      message: `Tailor paid for ${cycle} delivery on rework order ${reworkOrder.orderId}. Please assign a partner.`,
      data: { orderId: reworkOrder._id, targetUrl: "/admin/delivery" },
    });

    const { tryGetIO } = require("../../../config/socket.js");
    const adminIo = tryGetIO();
    if (adminIo) {
      adminIo.to("admin_room").emit("manual_delivery_request", {
        orderId: reworkOrder.orderId,
        _id: reworkOrder._id,
        isRework: true,
      });
    }
  }

  await sendNotification({
    recipient: issue.customer,
    type: "ISSUE_UPDATED",
    title: "Delivery arranged",
    message:
      cycle === "pickup"
        ? "A delivery partner will pick up your garment for rework."
        : "A delivery partner will bring your reworked order back to you.",
    data: { issueId: issue._id, targetUrl: `/user/issues/${issue._id}` },
  });

  res.status(200).json({
    success: true,
    data: {
      issue,
      reworkOrder,
      quote,
    },
  });
});

/**
 * @desc    Arrange pickup for an accepted issue (Creates cloned rework order)
 * @route   POST /api/v1/issues/:id/arrange-pickup
 * @deprecated Use dispatch-delivery with deliveryMethod
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

  return next(
    new ErrorResponse(
      "Use dispatch-delivery with broadcast or manual to assign a partner and pay delivery charges.",
      400
    )
  );
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
  
  // Patch old records that don't have an issueId
  if (!issue.issueId) {
      issue.issueId = `ISS-${Math.floor(100000 + Math.random() * 900000)}`;
  }

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
