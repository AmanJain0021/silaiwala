const BulkOrder = require("../../../models/BulkOrder.js");
const User = require("../../../models/User.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

// @desc    Create a new bulk order inquiry (Customer or Admin)
// @route   POST /api/v1/bulk-orders
// @access  Private (Customer/Admin)
exports.createBulkOrder = asyncHandler(async (req, res, next) => {
    const {
      customerId,
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
      quote,
      status,
      tailor,
      deliveryPartner,
      paymentStatus
    } = req.body;

    const isAdminUser = ['admin', 'super_admin'].includes(req.user.role);

    // Resolve user account
    let assignedUserId = req.user._id;
    if (isAdminUser) {
      if (customerId) {
        assignedUserId = customerId;
      } else if (email || phoneNumber) {
        const found = await User.findOne({
          $or: [
            ...(email ? [{ email: email.toLowerCase() }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : [])
          ]
        });
        if (found) assignedUserId = found._id;
      }
    }

    const initialStatus = (isAdminUser && status) 
      ? status 
      : (isAdminUser && quote && quote.totalAmount ? "quoted" : "pending");

    const bulkOrder = await BulkOrder.create({
      user: assignedUserId,
      createdByAdmin: !!isAdminUser,
      adminCreator: isAdminUser ? req.user._id : undefined,
      organizationName,
      contactPerson: contactPerson || (isAdminUser ? "Corporate Client" : req.user.name),
      phoneNumber: phoneNumber || req.user.phoneNumber || "",
      email: email ? email.toLowerCase() : req.user.email,
      orderType: orderType || "other",
      serviceType: serviceType || "Bulk Custom Tailoring",
      estimatedQuantity: Number(estimatedQuantity) || 10,
      fabricPreference: fabricPreference || "platform-provided",
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      location: location && location.address ? location : { address: "Address provided", city: "Local", pincode: "110001" },
      measurementMethod: measurementMethod || "standard-sizes",
      sizeDistribution: sizeDistribution || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
      measurementSheet,
      notes,
      referenceImages: referenceImages || [],
      quote: quote && (quote.pricePerUnit || quote.totalAmount) ? {
        pricePerUnit: Number(quote.pricePerUnit) || 0,
        totalAmount: Number(quote.totalAmount) || 0,
        depositRequired: Number(quote.depositRequired) || 0,
        adminNotes: quote.adminNotes || "Quote created by Admin."
      } : undefined,
      tailor: (isAdminUser && tailor) ? tailor : undefined,
      deliveryPartner: (isAdminUser && deliveryPartner) ? deliveryPartner : undefined,
      status: initialStatus,
      paymentStatus: (isAdminUser && paymentStatus) ? paymentStatus : "pending",
      history: [
        {
          status: initialStatus,
          message: isAdminUser
            ? `Bulk Order created by ${req.user.name || 'Admin'} for ${contactPerson || 'Customer'}.`
            : "Request submitted by user.",
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
    const bulkOrders = await BulkOrder.find({ user: req.user._id })
      .populate("tailor", "name shopName phoneNumber")
      .populate("deliveryPartner", "name phoneNumber")
      .sort({ createdAt: -1 });

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
      .populate("user", "name email phoneNumber")
      .populate("tailor", "name shopName phoneNumber")
      .populate("deliveryPartner", "name phoneNumber")
      .populate("adminCreator", "name email phoneNumber role")
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
    const bulkOrder = await BulkOrder.findById(req.params.id)
      .populate("user", "name email phoneNumber")
      .populate("tailor", "name shopName phoneNumber")
      .populate("deliveryPartner", "name phoneNumber")
      .populate("adminCreator", "name email phoneNumber role");

    if (!bulkOrder) {
        return next(new ErrorResponse("Order not found", 404));
    }

    // Check if the user is authorized to view this order
    const isStaff = ['admin', 'super_admin', 'tailor'].includes(req.user.role);
    if (
      !isStaff &&
      bulkOrder.user?._id?.toString() !== req.user._id.toString()
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
        message: message || `Inquiry details updated by ${req.user.name || 'System Admin'}`,
        updatedBy: req.user._id,
      });
    }

    await bulkOrder.save();

    res.status(200).json({
      success: true,
      data: bulkOrder,
    });
});
