const Service = require("../../../models/Service.js");
const Tailor = require("../../../models/Tailor.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

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
    .populate("category", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});

/**
 * @desc    Create a new service for the tailor
 * @route   POST /api/v1/tailors/services
 * @access  Private (Tailor)
 */
exports.createService = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  req.body.tailor = tailor._id;
  
  // Default values or adjustments
  if (!req.body.isActive) req.body.isActive = true;

  const service = await Service.create(req.body);

  res.status(201).json({
    success: true,
    data: service,
  });
});

/**
 * @desc    Update a service
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

  service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
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
  const services = await Service.find({ tailor: req.params.tailorId, isActive: true })
    .populate("category", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: services.length,
    data: services,
  });
});
