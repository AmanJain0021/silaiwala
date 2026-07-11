const BulkOrder = require("../../../models/BulkOrder.js");
const User = require("../../../models/User.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

// @desc    Create a new bulk order inquiry
// @route   POST /api/v1/bulk-orders
// @access  Private (Customer)
exports.createBulkOrder = asyncHandler(async (req, res, next) => {
    const {
      organizationName,
      contactPerson,
      phoneNumber,
      email,
      orderType,
      serviceType,
      estimatedQuantity,
      fabricPreference,
      expectedDeliveryDate,
      location,
      measurementMethod,
      sizeDistribution,
      measurementSheet,
      notes,
      referenceImages,
    } = req.body;

    const bulkOrder = await BulkOrder.create({
      user: req.user._id,
      organizationName,
      contactPerson,
      phoneNumber,
      email,
      orderType,
      serviceType,
      estimatedQuantity,
      fabricPreference,
      expectedDeliveryDate,
      location,
      measurementMethod,
      sizeDistribution,
      measurementSheet,
      notes,
      referenceImages,
      history: [
        {
          status: "pending",
          message: "Request submitted by user.",
          updatedBy: req.user._id,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: bulkOrder,
    });
});

// @desc    Get user's bulk order inquiries
// @route   GET /api/v1/bulk-orders/my
// @access  Private (Customer)
exports.getMyBulkOrders = asyncHandler(async (req, res, next) => {
    const bulkOrders = await BulkOrder.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: bulkOrders.length,
      data: bulkOrders,
    });
});

// @desc    Get all bulk order inquiries (Admin)
// @route   GET /api/v1/bulk-orders
// @access  Private (Admin)
exports.getAllBulkOrders = asyncHandler(async (req, res, next) => {
    const bulkOrders = await BulkOrder.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bulkOrders.length,
      data: bulkOrders,
    });
});

// @desc    Get single bulk order details
// @route   GET /api/v1/bulk-orders/:id
// @access  Private (Customer/Admin/Tailor)
exports.getBulkOrder = asyncHandler(async (req, res, next) => {
    const bulkOrder = await BulkOrder.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!bulkOrder) {
        return next(new ErrorResponse("Order not found", 404));
    }

    // Check if the user is authorized to view this order
    if (
      req.user.role !== "admin" &&
      bulkOrder.user._id.toString() !== req.user._id.toString()
    ) {
        return next(new ErrorResponse("Not authorized to view this inquiry", 403));
    }

    res.status(200).json({
      success: true,
      data: bulkOrder,
    });
});

// @desc    Update bulk order (Admin - for Quoting, Assignment, and Status)
// @route   PUT /api/v1/bulk-orders/:id
// @access  Private (Admin)
exports.updateBulkOrderStatus = asyncHandler(async (req, res, next) => {
    const { status, quote, message, tailor, deliveryPartner, paymentStatus } = req.body;

    let bulkOrder = await BulkOrder.findById(req.params.id);

    if (!bulkOrder) {
        return next(new ErrorResponse("Order not found", 404));
    }

    if (status) bulkOrder.status = status;
    if (quote) bulkOrder.quote = quote;
    if (tailor) bulkOrder.tailor = tailor;
    if (deliveryPartner) bulkOrder.deliveryPartner = deliveryPartner;
    if (paymentStatus) bulkOrder.paymentStatus = paymentStatus;

    if (message || status || tailor || deliveryPartner || paymentStatus) {
      bulkOrder.history.push({
        status: status || bulkOrder.status,
        message: message || `Inquiry details updated by System Admin`,
        updatedBy: req.user._id,
      });
    }

    await bulkOrder.save();

    res.status(200).json({
      success: true,
      data: bulkOrder,
    });
});
