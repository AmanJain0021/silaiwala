const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const Order = require("../../../models/Order");
const Tailor = require("../../../models/Tailor");
const Product = require("../../../models/Product");
const ShiprocketLog = require("../../../models/ShiprocketLog");
const ShiprocketValidationService = require("../services/shiprocketValidation.service");
const { sendNotification } = require("../../../utils/notification");
const { getIO } = require("../../../config/socket");
const { createOrder, generateAWB, requestPickup, generateLabel } = require("../../../utils/shiprocket");

// Helper to check if order is strictly a ready-made product order
const isReadyMadeProductOrder = (order) => {
  if (!order.items || order.items.length === 0) return false;
  // If ANY item has a service, it's not strictly ready-made
  const hasService = order.items.some(item => !!item.service || item.isAlteration || item.isCustomDesign);
  return !hasService;
};

/**
 * @desc    Validate order for Shiprocket Shipment
 * @route   GET /api/v1/shiprocket/validate/:orderId
 * @access  Private (Tailor/Admin)
 */
exports.validateShipment = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId).populate('customer').populate('items.product');
  if (!order) return next(new ErrorResponse("Order not found", 404));

  const tailorProfile = await Tailor.findOne({ user: order.tailor }).populate('user');
  
  const validationResult = ShiprocketValidationService.validateOrderForShipment(order, tailorProfile);
  
  res.status(200).json({
    success: true,
    data: validationResult
  });
});

/**
 * @desc    Create Shiprocket Shipment
 * @route   POST /api/v1/shiprocket/create-shipment/:orderId
 * @access  Private (Tailor/Admin)
 */
exports.createShipment = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId).populate('customer').populate('items.product');

  if (!order) return next(new ErrorResponse("Order not found", 404));

  if (!isReadyMadeProductOrder(order)) {
    return next(new ErrorResponse("Shiprocket integration is only available for Ready-Made Product orders", 400));
  }

  if (order.deliveryProvider === 'shiprocket' && order.shiprocketDetails?.shipmentId) {
    return next(new ErrorResponse("Shipment already exists for this order", 400));
  }

  const tailorProfile = await Tailor.findOne({ user: order.tailor }).populate('user');
  
  // 1. Strict Validation
  const validationResult = ShiprocketValidationService.validateOrderForShipment(order, tailorProfile);
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: "Shipment validation failed",
      errors: validationResult.errors
    });
  }

  // 2. Calculate dimensions and weight from products (guaranteed to exist by validation)
  let totalWeight = 0;
  let maxL = 0, maxW = 0, maxH = 0;
  
  order.items.forEach(item => {
    if (item.product) {
      totalWeight += item.product.weight * item.quantity;
      if (item.product.length > maxL) maxL = item.product.length;
      if (item.product.width > maxW) maxW = item.product.width;
      if (item.product.height > maxH) maxH = item.product.height;
    }
  });

  const orderItems = order.items.filter(item => item.product).map(item => ({
    name: item.product.name,
    sku: item.product._id.toString(),
    units: item.quantity,
    selling_price: item.price,
    discount: 0, // Using 0 here because total discount is handled at order level or if needed can distribute
    tax: 0, 
    hsn: ""
  }));

  const nameParts = order.customer.name.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ""; // empty string for single name

  const shiprocketOrderData = {
    order_id: order.orderId,
    order_date: new Date(order.createdAt).toISOString().split('T')[0], // Use Order creation date
    pickup_location: tailorProfile.shiprocketPickupLocation, // Dynamic, no fallback
    channel_id: "",
    comment: "SilaiWala Ready-Made Product",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: order.deliveryAddress.street,
    billing_city: order.deliveryAddress.city,
    billing_pincode: order.deliveryAddress.zipCode,
    billing_state: order.deliveryAddress.state,
    billing_country: "India", // Only support India for now
    billing_email: order.customer.email,
    billing_phone: order.customer.phoneNumber,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.paymentStatus === 'paid' ? 'Prepaid' : 'COD',
    sub_total: order.totalAmount, // Final amount
    length: maxL,
    breadth: maxW,
    height: maxH,
    weight: totalWeight
  };

  try {
    const srResponse = await createOrder(shiprocketOrderData);

    // Log Success
    await ShiprocketLog.create({
      order: order._id,
      shipmentId: srResponse.shipment_id?.toString(),
      action: 'CREATE_SHIPMENT',
      requestPayload: shiprocketOrderData,
      responseData: srResponse,
      status: 'SUCCESS'
    });

    order.deliveryProvider = 'shiprocket';
    order.shiprocketDetails = {
      orderId: srResponse.order_id?.toString(),
      shipmentId: srResponse.shipment_id?.toString(),
      currentStatus: 'NEW',
      pickupScheduled: false
    };

    // Move status to ready internally
    const { transitionOrder } = require("../../../utils/orderStateMachine");
    if (order.status !== 'ready' && order.status !== 'ready-for-delivery') {
      transitionOrder(order, 'ready', 'Order packed and Shiprocket shipment generated');
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: "Shiprocket shipment created successfully"
    });
  } catch (error) {
    // Log Failure
    await ShiprocketLog.create({
      order: order._id,
      action: 'CREATE_SHIPMENT',
      requestPayload: shiprocketOrderData,
      status: 'FAILED',
      errorMessage: error.message
    });
    return next(new ErrorResponse(error.message, 500));
  }
});

/**
 * @desc    Generate AWB for Shipment
 * @route   POST /api/v1/shiprocket/generate-awb/:orderId
 * @access  Private (Tailor/Admin)
 */
exports.generateAWBForOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);

  if (!order || order.deliveryProvider !== 'shiprocket' || !order.shiprocketDetails?.shipmentId) {
    return next(new ErrorResponse("Invalid order or Shiprocket shipment not found", 400));
  }

  if (order.shiprocketDetails?.awbCode) {
    return next(new ErrorResponse("AWB has already been generated.", 400));
  }

  try {
    const awbData = await generateAWB(order.shiprocketDetails.shipmentId);

    if (awbData.awb_assign_error || !awbData.awb_code) {
      const errorMsg = awbData.awb_assign_error || "Failed to generate AWB. Unknown error from Shiprocket.";
      await ShiprocketLog.create({
        order: order._id,
        shipmentId: order.shiprocketDetails.shipmentId,
        action: 'GENERATE_AWB',
        responseData: awbData,
        status: 'FAILED',
        errorMessage: errorMsg
      });
      return next(new ErrorResponse(errorMsg, 400));
    }

    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'GENERATE_AWB',
      responseData: awbData,
      status: 'SUCCESS'
    });

    order.shiprocketDetails.awbCode = awbData.awb_code;
    order.shiprocketDetails.courierName = awbData.courier_name;
    order.shiprocketDetails.trackingUrl = `https://shiprocket.co/tracking/${awbData.awb_code}`;
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: "AWB generated successfully"
    });
  } catch (error) {
    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'GENERATE_AWB',
      status: 'FAILED',
      errorMessage: error.message
    });
    return next(new ErrorResponse(error.message, 500));
  }
});

/**
 * @desc    Schedule Pickup
 * @route   POST /api/v1/shiprocket/schedule-pickup/:orderId
 * @access  Private (Tailor/Admin)
 */
exports.schedulePickupForOrder = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);

  if (!order || order.deliveryProvider !== 'shiprocket' || !order.shiprocketDetails?.shipmentId) {
    return next(new ErrorResponse("Invalid order or Shiprocket shipment not found", 400));
  }

  if (!order.shiprocketDetails.awbCode) {
    return next(new ErrorResponse("Please generate AWB first", 400));
  }

  if (order.shiprocketDetails?.pickupScheduled) {
    return next(new ErrorResponse("Pickup has already been scheduled.", 400));
  }

  try {
    const pickupData = await requestPickup(order.shiprocketDetails.shipmentId);

    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'SCHEDULE_PICKUP',
      responseData: pickupData,
      status: 'SUCCESS'
    });

    order.shiprocketDetails.pickupScheduled = true;
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
      message: "Pickup scheduled successfully"
    });
  } catch (error) {
    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'SCHEDULE_PICKUP',
      status: 'FAILED',
      errorMessage: error.message
    });
    return next(new ErrorResponse(error.message, 500));
  }
});

/**
 * @desc    Get Label
 * @route   GET /api/v1/shiprocket/label/:orderId
 * @access  Private (Tailor/Admin)
 */
exports.getLabel = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);

  if (!order || order.deliveryProvider !== 'shiprocket' || !order.shiprocketDetails?.shipmentId) {
    return next(new ErrorResponse("Invalid order or Shiprocket shipment not found", 400));
  }

  try {
    const labelData = await generateLabel(order.shiprocketDetails.shipmentId);

    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'GET_LABEL',
      responseData: labelData,
      status: 'SUCCESS'
    });

    res.status(200).json({
      success: true,
      data: { label_url: labelData.label_url }
    });
  } catch (error) {
    await ShiprocketLog.create({
      order: order._id,
      shipmentId: order.shiprocketDetails.shipmentId,
      action: 'GET_LABEL',
      status: 'FAILED',
      errorMessage: error.message
    });
    return next(new ErrorResponse(error.message, 500));
  }
});

/**
 * @desc    Shiprocket Webhook Listener
 * @route   POST /api/v1/shiprocket/webhook
 * @access  Public
 */
exports.webhookListener = asyncHandler(async (req, res, next) => {
  const payload = req.body;
  const signature = req.headers['x-shiprocket-signature'];
  // TODO: Validate signature using Shiprocket API secret in production

  const awbCode = payload.awb;
  const currentStatus = payload.current_status;

  if (!awbCode) return res.status(200).send("OK");

  const order = await Order.findOne({ "shiprocketDetails.awbCode": awbCode });
  if (!order) return res.status(200).send("OK");

  order.shiprocketDetails.currentStatus = currentStatus;

  let internalStatusUpdate = null;

  // Map Shiprocket status to internal status
  if (currentStatus === 'PICKED UP') {
    internalStatusUpdate = 'picked-up';
  } else if (currentStatus === 'OUT FOR DELIVERY') {
    internalStatusUpdate = 'out-for-delivery';
  } else if (currentStatus === 'DELIVERED') {
    internalStatusUpdate = 'delivered';
    if (!order.deliveredAt) order.deliveredAt = new Date();
  } else if (currentStatus === 'CANCELED') {
    internalStatusUpdate = 'cancelled';
  }

  if (internalStatusUpdate && order.status !== internalStatusUpdate) {
    const { transitionOrder } = require("../../../utils/orderStateMachine");
    transitionOrder(order, internalStatusUpdate, `Shiprocket update: ${currentStatus}`);
  }

  order.trackingHistory.push({
    status: currentStatus,
    message: `Shiprocket: ${currentStatus}`,
    timestamp: new Date()
  });

  await order.save();

  // Notify customer
  if (internalStatusUpdate) {
    await sendNotification({
      recipient: order.customer,
      type: 'ORDER_STATUS_UPDATED',
      title: 'Shipment Update',
      message: `Your order ${order.orderId} is now ${currentStatus}.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });

    const io = getIO();
    if (io) {
      io.to(`user_${order.customer}`).emit('order_status_updated', {
        orderId: order.orderId,
        _id: order._id,
        status: order.status,
        shiprocketStatus: currentStatus
      });
    }
  }

  res.status(200).send("OK");
});
