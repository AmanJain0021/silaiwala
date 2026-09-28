const Service = require("../../../models/Service.js");
const Tailor = require("../../../models/Tailor.js");
const Category = require("../../../models/Category.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const { sendNotification } = require("../../../utils/notification.js");

/**
 * @desc    Get all services for logged in tailor
 * @route   GET /api/v1/tailors/services
 * @access  Private (Tailor)
 */
exports.getMyServices = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const services = await Service.find({ tailor: tailor._id })
    .populate("category", "name gender type minPrice maxPrice basePrice description styles measurementFields styleAddons image")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});

/**
 * @desc    Create / Opt-in to a service for the tailor using Admin Category
 * @route   POST /api/v1/tailors/services
 * @access  Private (Tailor)
 */
exports.createService = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  if (!req.body.category) {
    return next(new ErrorResponse("Please select an Admin Service Category", 400));
  }

  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new ErrorResponse("Service category not found", 404));
  }

  // Always enforce official Admin Title, Image & Description
  const defaultServiceImg = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800";
  req.body.title = category.name;
  req.body.image = (category.image && category.image !== "no-photo.jpg") ? category.image : defaultServiceImg;
  req.body.description = category.description || `${category.name} custom stitching service.`;

  if (!req.body.basePrice) {
    req.body.basePrice = category.basePrice || category.minPrice || 199;
  }
  if (!req.body.deliveryTime) {
    req.body.deliveryTime = category.deliveryTime || "3-5 DAYS";
  }

  // Validate price falls strictly within admin-defined category price band
  const price = Number(req.body.basePrice);
  if (isNaN(price) || price <= 0) {
    return next(new ErrorResponse("Please enter a valid stitching price greater than 0", 400));
  }

  if (category.minPrice != null && price < category.minPrice) {
    return next(
      new ErrorResponse(
        `Price cannot be less than minimum allowed price of ₹${category.minPrice} for ${category.name}.`,
        400
      )
    );
  }

  if (category.maxPrice != null && price > category.maxPrice) {
    return next(
      new ErrorResponse(
        `Price cannot be greater than maximum allowed price of ₹${category.maxPrice} for ${category.name}.`,
        400
      )
    );
  }

  // Check if tailor already has this service — if so, update & submit for re-approval
  let existingService = await Service.findOne({ tailor: tailor._id, category: category._id });
  if (existingService) {
    const defaultServiceImg = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800";
    existingService.title = category.name;
    existingService.image = (category.image && category.image !== "no-photo.jpg") ? category.image : defaultServiceImg;
    existingService.description = category.description || existingService.description;
    existingService.basePrice = price;
    existingService.deliveryTime = req.body.deliveryTime;
    if (req.body.selectedStyles) existingService.selectedStyles = req.body.selectedStyles;
    existingService.isActive = false; // Remains inactive until Admin approves
    existingService.status = "pending"; // Sent to Admin for review
    existingService.rejectionReason = null;
    await existingService.save();

    const { invalidateCache } = require("../../../utils/cache.js");
    await invalidateCache("cache:services:*");

    sendNotification({
      recipient: "admins",
      type: "SYSTEM_NOTICE",
      title: "Tailor Service Submitted for Approval",
      message: `${tailor.shopName || "A tailor"} submitted "${category.name}" at ₹${price} for approval.`,
      data: { targetUrl: "/admin/services" }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `"${category.name}" service submitted for Admin approval! It will be visible to customers once approved.`,
      data: existingService,
    });
  }

  req.body.tailor = tailor._id;
  req.body.status = "pending"; // Requires Admin review before appearing on customer app
  req.body.rejectionReason = null;
  req.body.isActive = false; // Inactive until Admin approves

  const service = await Service.create(req.body);

  const { invalidateCache } = require("../../../utils/cache.js");
  await invalidateCache("cache:services:*");

  sendNotification({
    recipient: "admins",
    type: "SYSTEM_NOTICE",
    title: "New Tailor Service Pending Approval",
    message: `${tailor.shopName || "A tailor"} requested to offer "${category.name}" at ₹${price}.`,
    data: { targetUrl: "/admin/services" }
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: `"${category.name}" service submitted for Admin approval! It will be visible to customers once approved.`,
    data: service,
  });
});

/**
 * @desc    Toggle a service active/inactive status
 * @route   PATCH /api/v1/tailors/services/:id/toggle
 * @access  Private (Tailor)
 */
exports.toggleServiceStatus = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const service = await Service.findOne({ _id: req.params.id, tailor: tailor._id });
  if (!service) {
    return next(new ErrorResponse("Service not found", 404));
  }

  if (service.status !== "approved") {
    return next(
      new ErrorResponse(
        `This service is currently "${service.status}". Only admin-approved services can be activated or paused.`,
        400
      )
    );
  }

  service.isActive = !service.isActive;
  await service.save();

  const { invalidateCache } = require("../../../utils/cache.js");
  await invalidateCache("cache:services:*");

  res.status(200).json({
    success: true,
    message: `Service "${service.title}" ${service.isActive ? 'activated' : 'paused'}.`,
    data: service,
  });
});

/**
 * @desc    Update an offered service
 * @route   PATCH /api/v1/tailors/services/:id
 * @access  Private (Tailor)
 */
exports.updateService = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  let service = await Service.findOne({ _id: req.params.id, tailor: tailor._id });
  if (!service) {
    return next(new ErrorResponse("Service not found or not owned by you", 404));
  }

  delete req.body.tailor;

  // Enforce admin category metadata
  const categoryId = req.body.category || service.category;
  if (categoryId) {
    const category = await Category.findById(categoryId);
    if (category) {
      const defaultServiceImg = "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800";
      req.body.title = category.name;
      req.body.image = (category.image && category.image !== "no-photo.jpg") ? category.image : defaultServiceImg;
      req.body.description = category.description || service.description;

      if (req.body.basePrice != null) {
        const price = Number(req.body.basePrice);
        if (isNaN(price) || price <= 0) {
          return next(new ErrorResponse("Please enter a valid stitching price greater than 0", 400));
        }

        if (category.minPrice != null && price < category.minPrice) {
          return next(
            new ErrorResponse(
              `Price cannot be less than minimum allowed price of ₹${category.minPrice} for ${category.name}.`,
              400
            )
          );
        }

        if (category.maxPrice != null && price > category.maxPrice) {
          return next(
            new ErrorResponse(
              `Price cannot be greater than maximum allowed price of ₹${category.maxPrice} for ${category.name}.`,
              400
            )
          );
        }
      }
    }
  }

  // Service updates (e.g. price change) require Admin re-approval
  req.body.status = "pending";
  req.body.isActive = false; // Hidden until Admin approves update
  req.body.rejectionReason = null;

  service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  const { invalidateCache } = require("../../../utils/cache.js");
  await invalidateCache("cache:services:*");

  sendNotification({
    recipient: "admins",
    type: "SYSTEM_NOTICE",
    title: "Tailor Service Update Pending Approval",
    message: `${tailor.shopName || "A tailor"} updated service "${service.title}" at ₹${service.basePrice}. Pending review.`,
    data: { targetUrl: "/admin/services" }
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `Service "${service.title}" updated and submitted for Admin approval!`,
    data: service,
  });
});

/**
 * @desc    Delete a service
 * @route   DELETE /api/v1/tailors/services/:id
 * @access  Private (Tailor)
 */
exports.deleteService = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const service = await Service.findOne({ _id: req.params.id, tailor: tailor._id });

  if (!service) {
    return next(new ErrorResponse("Service not found or not owned by you", 404));
  }

  await service.deleteOne();

  const { invalidateCache } = require("../../../utils/cache.js");
  await invalidateCache("cache:services:*");

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Get all services for a specific tailor (Public)
 * @route   GET /api/v1/tailors/:tailorId/services
 * @access  Public
 */
exports.getTailorServices = asyncHandler(async (req, res, next) => {
  const services = await Service.find({ tailor: req.params.tailorId, isActive: true, status: "approved" })
    .populate("category", "name gender type minPrice maxPrice basePrice description styles measurementFields styleAddons")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});
