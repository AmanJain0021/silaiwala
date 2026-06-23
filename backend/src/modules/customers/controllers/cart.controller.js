const Cart = require("../../../models/Cart");
const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");

/**
 * @desc    Get user cart
 * @route   GET /api/v1/customers/cart
 * @access  Private
 */
exports.getCart = asyncHandler(async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user.id })
    .populate({
        path: "items.product",
        select: "name title price image images tailor",
        populate: { path: "tailor", select: "location" }
    })
    .populate({
        path: "items.service",
        select: "title basePrice image images tailor",
        populate: { path: "tailor", select: "location" }
    });

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.status(200).json({
    success: true,
    data: cart,
  });
});

/**
 * @desc    Add or Update item in cart
 * @route   POST /api/v1/customers/cart
 * @access  Private
 */
exports.addToCart = asyncHandler(async (req, res, next) => {
  const { productId, serviceId, isAlteration, tailorId, quantity, price, config } = req.body;

  let cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }


  // Single Service-Type Cart Validation
  if (cart.items && cart.items.length > 0) {
    const hasProducts = cart.items.some(item => item.product);
    const hasServices = cart.items.some(item => item.service);

    if (productId && (hasServices || cart.items.some(i => i.isAlteration))) {
      return next(new ErrorResponse("This cart already contains a different service type. Please complete or clear your cart.", 400));
    }
    if (serviceId && (hasProducts || cart.items.some(i => i.isAlteration))) {
      return next(new ErrorResponse("This cart already contains a different service type. Please complete or clear your cart.", 400));
    }
    if (isAlteration && (hasProducts || hasServices)) {
      return next(new ErrorResponse("This cart already contains a different service type. Please complete or clear your cart.", 400));
    }

    if (serviceId && hasServices) {
      const Service = require("../../../models/Service");
      const incomingService = await Service.findById(serviceId).populate('category');
      const existingService = await Service.findById(cart.items.find(item => item.service).service).populate('category');
      
      if (incomingService && existingService) {
        const isIncomingAlt = incomingService.category?.name?.toLowerCase().includes('alteration') || incomingService.tags?.some(t => t.toLowerCase().includes('alteration'));
        const isExistingAlt = existingService.category?.name?.toLowerCase().includes('alteration') || existingService.tags?.some(t => t.toLowerCase().includes('alteration'));
        
        if (isIncomingAlt !== isExistingAlt) {
           return next(new ErrorResponse("This cart already contains a different service type. Please complete or clear your cart.", 400));
        }
      }
    }
  }

  // Check if item already exists (Alterations don't stack by ID usually, but we check if it's identical or just add new)
  const itemIndex = cart.items.findIndex(item => 
    (productId && item.product?.toString() === productId) || 
    (serviceId && item.service?.toString() === serviceId && !isAlteration)
  );

  if (itemIndex > -1 && !isAlteration) {
    cart.items[itemIndex].quantity += (quantity || 1);
    if (config) cart.items[itemIndex].config = config;
  } else {
    cart.items.push({
      product: productId || null,
      service: serviceId || null,
      isAlteration: isAlteration || false,
      tailor: tailorId || null,
      quantity: quantity || 1,
      price: price || 0,
      config
    });
  }

  await cart.save();

  res.status(200).json({
    success: true,
    data: cart,
  });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/customers/cart/:itemId
 * @access  Private
 */
exports.removeFromCart = asyncHandler(async (req, res, next) => {
  console.log("removeFromCart called with itemId:", req.params.itemId);
  
  if (!req.params.itemId || req.params.itemId === 'undefined') {
    return next(new ErrorResponse("Invalid item ID provided", 400));
  }

  const cart = await Cart.findOne({ user: req.user.id });

  if (!cart) {
    console.log("Cart not found for user:", req.user.id);
    return next(new ErrorResponse("Cart not found", 404));
  }

  // Find if item exists before pulling
  const itemExists = cart.items.find(i => i._id.toString() === req.params.itemId);
  if (!itemExists) {
     console.log("Item not found in cart array:", req.params.itemId);
  } else {
     // Use filter and markModified to guarantee Mongoose detects the array change
     cart.items = cart.items.filter(item => item._id.toString() !== req.params.itemId);
     cart.markModified('items');
  }

  await cart.save();
  console.log("Item removed and cart saved successfully");

  res.status(200).json({
    success: true,
    data: cart,
  });
});
