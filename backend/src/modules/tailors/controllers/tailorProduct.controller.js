const Product = require("../../../models/Product.js");
const Tailor = require("../../../models/Tailor.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");
const { sendNotification } = require("../../../utils/notification.js");
const { PUBLIC_PRODUCT_FILTER } = require("../../../utils/catalogVisibility.js");

exports.getTailorFabrics = asyncHandler(async (req, res, next) => {
  const fabrics = await Product.find({
    tailor: req.params.tailorId,
    productType: "fabric",
    ...PUBLIC_PRODUCT_FILTER,
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
  req.body.status = "pending";
  req.body.rejectionReason = null;
  req.body.isActive = false;

  const product = await Product.create(req.body);

  await sendNotification({
    recipient: "admins",
    type: "SYSTEM_NOTICE",
    title: "New product pending approval",
    message: `${product.productType === "fabric" ? "Fabric" : "Garment"} "${product.name}" awaits admin review.`,
    data: { productId: product._id, targetUrl: "/admin/services" },
  });

  res.status(201).json({
    success: true,
    message: "Submitted for admin approval. It will appear to customers once approved.",
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

  delete req.body.status;
  delete req.body.isActive;
  delete req.body.tailor;

  req.body.status = "pending";
  req.body.isActive = false;
  req.body.rejectionReason = null;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Changes submitted for admin approval.",
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
