const Product = require("../../../models/Product.js");
const Tailor = require("../../../models/Tailor.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Get all fabrics of a specific tailor (for customers during checkout)
 * @route   GET /api/v1/tailors/:tailorId/fabrics
 * @access  Public (Customer)
 */
exports.getTailorFabrics = asyncHandler(async (req, res, next) => {
  const fabrics = await Product.find({
    tailor: req.params.tailorId,
    productType: "fabric",
    isActive: true,
    inStock: true,
  })
    .select("name description price image images stock")
    .lean();

  res.status(200).json({
    success: true,
    count: fabrics.length,
    data: fabrics,
  });
});


/**
 * @desc    Get all fabric products for logged in tailor
 * @route   GET /api/v1/tailors/products
 * @access  Private (Tailor)
 */
exports.getMyProducts = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const products = await Product.find({ tailor: tailor._id }).populate("category", "name").sort("-createdAt");

  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

/**
 * @desc    Create a fabric product
 * @route   POST /api/v1/tailors/products
 * @access  Private (Tailor)
 */
exports.createProduct = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }
  
  req.body.tailor = tailor._id;
  
  // Force it to be active by default
  req.body.isActive = true;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    data: product,
  });
});

/**
 * @desc    Update a product
 * @route   PATCH /api/v1/tailors/products/:id
 * @access  Private (Tailor)
 */
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  let product = await Product.findOne({ _id: req.params.id, tailor: tailor._id });

  if (!product) {
    return next(new ErrorResponse("Product not found", 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/tailors/products/:id
 * @access  Private (Tailor)
 */
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const tailor = await Tailor.findOne({ user: req.user.id });
  if (!tailor) {
    return next(new ErrorResponse("Tailor profile not found", 404));
  }

  const product = await Product.findOne({ _id: req.params.id, tailor: tailor._id });

  if (!product) {
    return next(new ErrorResponse("Product not found", 404));
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
