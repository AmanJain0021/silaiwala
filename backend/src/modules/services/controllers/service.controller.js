const Service = require("../../../models/Service");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * @desc    Get all services
 * @route   GET /api/v1/services
 * @access  Public
 */
exports.getServices = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 20000 } = req.query; // Default radius 20km
  const isActive = req.query.isActive === 'false' ? false : true;
  
  let query = { isActive };

  // 1. Handle Location Based Filtering (Temporarily Disabled)
  /*
  if (lat && lng) {
    const Tailor = require("../../../models/Tailor");
    const nearbyTailors = await Tailor.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      },
      isAvailable: true
    }).select("_id");

    const nearbyIds = nearbyTailors.map(t => t._id);
    query.tailor = { $in: nearbyIds };
  } else 
  */
  if (req.query.tailor) {
    query.tailor = req.query.tailor;
  }

  if (req.query.category) query.category = req.query.category;

  // 2. Fetch Services
  const services = await Service.find(query)
    .populate({
      path: "tailor",
      match: { isAvailable: true },
      select: "shopName rating location user",
      populate: { 
        path: "user", 
        match: { isActive: true },
        select: "name profileImage" 
      }
    })
    .populate("category", "name")
    .lean();

  // 3. Final Filter and Response
  const filteredServices = services.filter(service => 
    service.tailor && service.tailor.user
  );

  res.status(200).json({
    success: true,
    count: filteredServices.length,
    data: filteredServices,
  });
});

/**
 * @desc    Get single service
 * @route   GET /api/v1/services/:id
 * @access  Public
 */
exports.getServiceById = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id)
    .populate("category", "name description")
    .populate({
      path: "tailor",
      select: "shopName rating location user",
      populate: {
        path: "user",
        select: "name profileImage"
      }
    })
    .lean();

  if (!service) {
    return next(new ErrorResponse(`Service not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: service,
  });
});

/**
 * @desc    Create new service (Admin Utility)
 * @route   POST /api/v1/services
 * @access  Private (Admin - logic omitted for simplicity or can be added later)
 */
exports.createService = asyncHandler(async (req, res, next) => {
  const service = await Service.create(req.body);

  res.status(201).json({
    success: true,
    data: service,
  });
});

/**
 * @desc    Update service
 * @route   PUT /api/v1/services/:id
 * @access  Private (Admin)
 */
exports.updateService = asyncHandler(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!service) {
    return next(new ErrorResponse(`Service not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: service,
  });
});

/**
 * @desc    Delete service
 * @route   DELETE /api/v1/services/:id
 * @access  Private (Admin)
 */
exports.deleteService = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return next(new ErrorResponse(`Service not found with id of ${req.params.id}`, 404));
  }

  await service.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
