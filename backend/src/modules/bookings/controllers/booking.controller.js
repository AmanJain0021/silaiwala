const asyncHandler = require("../../../utils/asyncHandler.js");
const CustomBooking = require("../../../models/CustomBooking.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Create a custom booking (e.g. Bridal)
 * @route   POST /api/v1/custom-bookings
 * @access  Private (Customer/Admin)
 */
exports.createBooking = asyncHandler(async (req, res, next) => {
  const { date, time, notes, bookingType } = req.body;

  if (!date || !time) {
    return next(new ErrorResponse("Please provide date and time", 400));
  }

  const booking = await CustomBooking.create({
    user: req.user.id,
    date,
    time,
    notes,
    bookingType: bookingType || "bridal",
  });

  res.status(201).json({
    success: true,
    data: booking,
  });
});

/**
 * @desc    Get user's custom bookings
 * @route   GET /api/v1/custom-bookings/me
 * @access  Private
 */
exports.getMyBookings = asyncHandler(async (req, res, next) => {
  const bookings = await CustomBooking.find({ user: req.user.id })
    .populate("assignedTailor", "shopName user")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * @desc    Get all custom bookings (Admin only)
 * @route   GET /api/v1/custom-bookings
 * @access  Private (Admin)
 */
exports.getAllBookings = asyncHandler(async (req, res, next) => {
  const bookings = await CustomBooking.find()
    .populate("user", "name email phone")
    .populate("assignedTailor", "shopName user")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * @desc    Assign tailor to a custom booking (Admin only)
 * @route   PATCH /api/v1/custom-bookings/:id/assign
 * @access  Private (Admin)
 */
exports.assignTailor = asyncHandler(async (req, res, next) => {
  const { tailorId } = req.body;

  let booking = await CustomBooking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  if (!tailorId) {
    return next(new ErrorResponse("Please provide a tailor ID", 400));
  }
  
  // tailorId comes as User._id from Admin Panel dropdown. Map it to Tailor Profile _id.
  const Tailor = require("../../../models/Tailor.js");
  const tailorDoc = await Tailor.findOne({ user: tailorId });
  if (!tailorDoc) {
    return next(new ErrorResponse("Tailor profile not found for this user", 404));
  }

  booking.assignedTailor = tailorDoc._id;
  booking.status = "assigned";

  await booking.save();

  booking = await CustomBooking.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("assignedTailor", "shopName user");

  res.status(200).json({
    success: true,
    data: booking,
  });
});

/**
 * @desc    Tailor gets assigned custom bookings
 * @route   GET /api/v1/custom-bookings/tailor
 * @access  Private (Tailor)
 */
exports.getTailorBookings = asyncHandler(async (req, res, next) => {
  // Assuming tailorId is fetched from user's tailor profile
  // The Tailor model has user reference.
  const Tailor = require("../../../models/Tailor.js");
  const tailor = await Tailor.findOne({ user: req.user.id });

  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const bookings = await CustomBooking.find({ assignedTailor: tailor._id })
    .populate("user", "name phone")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * @desc    Update booking status (Tailor or Admin)
 * @route   PATCH /api/v1/custom-bookings/:id/status
 * @access  Private (Tailor/Admin)
 */
exports.updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  let booking = await CustomBooking.findById(req.params.id);

  if (!booking) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.id}`, 404));
  }

  booking.status = status;
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking,
  });
});
