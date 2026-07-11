const Measurement = require("../../../models/Measurement.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Get all measurement profiles for user
 * @route   GET /api/v1/measurements
 * @access  Private
 */
exports.getMeasurements = asyncHandler(async (req, res, next) => {
  const measurements = await Measurement.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: measurements.length,
    data: measurements,
  });
});

/**
 * @desc    Create a new measurement profile
 * @route   POST /api/v1/measurements
 * @access  Private
 */
exports.createMeasurement = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  // If this is set as default, unset others of the same garment type
  if (req.body.isDefault) {
    await Measurement.updateMany(
      { user: req.user.id, garmentType: req.body.garmentType },
      { isDefault: false }
    );
  }

  const measurement = await Measurement.create(req.body);

  res.status(201).json({
    success: true,
    data: measurement,
  });
});

/**
 * @desc    Update a measurement profile
 * @route   PUT /api/v1/measurements/:id
 * @access  Private
 */
exports.updateMeasurement = asyncHandler(async (req, res, next) => {
  let measurement = await Measurement.findById(req.params.id);

  if (!measurement) {
    return next(new ErrorResponse("Measurement profile not found", 404));
  }

  // Make sure user owns the profile
  if (measurement.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to update this profile", 401));
  }

  // If setting as default, unset others
  if (req.body.isDefault) {
    await Measurement.updateMany(
      { user: req.user.id, garmentType: measurement.garmentType },
      { isDefault: false }
    );
  }

  measurement = await Measurement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: measurement,
  });
});

/**
 * @desc    Delete a measurement profile
 * @route   DELETE /api/v1/measurements/:id
 * @access  Private
 */
exports.deleteMeasurement = asyncHandler(async (req, res, next) => {
  const measurement = await Measurement.findById(req.params.id);

  if (!measurement) {
    return next(new ErrorResponse("Measurement profile not found", 404));
  }

  // Make sure user owns the profile
  if (measurement.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to delete this profile", 401));
  }

  await measurement.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
