const TailorWorkSample = require("../../../models/TailorWorkSample.js");
const Tailor = require("../../../models/Tailor.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Get all work samples for logged in tailor
 * @route   GET /api/v1/tailors/work-samples
 * @access  Private (Tailor)
 */
exports.getMyWorkSamples = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const samples = await TailorWorkSample.find({ tailor: tailor._id })
    .populate("category", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: samples.length,
    data: samples,
  });
});

/**
 * @desc    Get all work samples for a specific tailor (Public)
 * @route   GET /api/v1/tailors/:tailorId/work-samples
 * @access  Public
 */
exports.getTailorWorkSamples = asyncHandler(async (req, res, next) => {
  const samples = await TailorWorkSample.find({ tailor: req.params.tailorId })
    .populate("category", "name")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: samples.length,
    data: samples,
  });
});

/**
 * @desc    Get all work samples (Global Feed)
 * @route   GET /api/v1/tailors/work-samples/feed
 * @access  Public
 */
exports.getAllWorkSamples = asyncHandler(async (req, res, next) => {
  const samples = await TailorWorkSample.find({ isActive: true })
    .populate("category", "name")
    .populate({
      path: "tailor",
      select: "shopName",
      populate: { path: "user", select: "name profileImage" }
    })
    .sort("-createdAt")
    .limit(20);

  res.status(200).json({
    success: true,
    count: samples.length,
    data: samples,
  });
});

/**
 * @desc    Create a work sample
 * @route   POST /api/v1/tailors/work-samples
 * @access  Private (Tailor)
 */
exports.createWorkSample = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  req.body.tailor = tailor._id;

  const sample = await TailorWorkSample.create(req.body);

  res.status(201).json({
    success: true,
    data: sample,
  });
});

/**
 * @desc    Update a work sample
 * @route   PATCH /api/v1/tailors/work-samples/:id
 * @access  Private (Tailor)
 */
exports.updateWorkSample = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  let sample = await TailorWorkSample.findOne({ _id: req.params.id, tailor: tailor._id });

  if (!sample) {
    return next(new ErrorResponse("Work sample not found", 404));
  }

  sample = await TailorWorkSample.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: sample,
  });
});

/**
 * @desc    Delete a work sample
 * @route   DELETE /api/v1/tailors/work-samples/:id
 * @access  Private (Tailor)
 */
exports.deleteWorkSample = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const sample = await TailorWorkSample.findOne({ _id: req.params.id, tailor: tailor._id });

  if (!sample) {
    return next(new ErrorResponse("Work sample not found", 404));
  }

  await sample.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
