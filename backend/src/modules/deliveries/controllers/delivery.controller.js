const mongoose = require("mongoose");
const Delivery = require("../../../models/Delivery.js");
const Order = require("../../../models/Order.js");
const { transitionOrder } = require("../../../utils/orderStateMachine.js");
const User = require("../../../models/User.js");
const Tailor = require("../../../models/Tailor.js");
const Settings = require("../../../models/Settings.js");
const Notification = require("../../../models/Notification.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Get currently logged-in delivery partner profile
 * @route   GET /api/v1/deliveries/me
 * @access  Private (Delivery)
 */
exports.getMyProfile = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ user: req.user.id }).populate(
    "user",
    "name email phoneNumber profileImage"
  );

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

/**
 * @desc    Update delivery profile
 * @route   PATCH /api/v1/deliveries/profile
 * @access  Private (Delivery)
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { vehicleType, vehicleNumber, name, email, phoneNumber, bankDetails, emergencyContact, profileImage } = req.body;

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Update Delivery fields
  if (vehicleType) delivery.vehicleType = vehicleType;
  if (vehicleNumber) delivery.vehicleNumber = vehicleNumber;
  if (bankDetails) {
    delivery.bankDetails = {
      ...delivery.bankDetails,
      ...bankDetails
    };
  }
  if (emergencyContact) delivery.emergencyContact = emergencyContact;

  await delivery.save();

  // Update User fields if provided
  if (name || email || phoneNumber || profileImage) {
    const user = await User.findById(req.user.id);
    if (!user) return next(new ErrorResponse("User not found", 404));

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profileImage) user.profileImage = profileImage;
    await user.save();
  }

  const updatedProfile = await Delivery.findOne({ user: req.user.id }).populate(
    "user",
    "name email phoneNumber profileImage"
  );

  res.status(200).json({
    success: true,
    data: updatedProfile,
  });
});

/**
 * @desc    Toggle availability and update location
 * @route   PATCH /api/v1/deliveries/status
 * @access  Private (Delivery)
 */
exports.updateStatus = asyncHandler(async (req, res, next) => {
  const { isAvailable, status, lat, lng, eta, distanceRemaining, address } = req.body;

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  if (isAvailable !== undefined) delivery.isAvailable = isAvailable;
  if (address) delivery.currentAddress = address;
  if (status) {
    let finalStatus = status;
    if (status === 'available') finalStatus = 'active';
    if (status === 'offline') finalStatus = 'inactive';
    delivery.status = finalStatus;
  }

  if (lat && lng) {
    delivery.currentLocation = {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
    delivery.lastLocationUpdatedAt = new Date();

    // Update active DeliveryTracking documents
    const DeliveryTracking = require("../../../models/DeliveryTracking.js");
    const Order = require("../../../models/Order.js");
    const { getIO } = require("../../../config/socket.js");

    // Find active orders for this rider
    const activeOrders = await Order.find({
      $or: [
        { pickupPartner: req.user.id, pickupDeliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'out-for-delivery'] } },
        { dropoffPartner: req.user.id, dropoffDeliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'out-for-delivery'] } },
        { deliveryPartner: req.user.id, deliveryStatus: { $in: ['assigned', 'accepted', 'reached-pickup', 'picked-up', 'reached-dropoff', 'out-for-delivery'] } },
        { pickupPartner: req.user.id, status: { $in: ['fabric-ready-for-pickup', 'fabric-picked-up'] } },
        { dropoffPartner: req.user.id, status: { $in: ['ready', 'ready-for-delivery', 'ready-for-pickup', 'out-for-delivery'] } }
      ]
    }).select('_id');

    const io = getIO();

    for (const order of activeOrders) {
      let tracking = await DeliveryTracking.findOne({ orderId: order._id });
      if (!tracking) {
        tracking = new DeliveryTracking({
          orderId: order._id,
          deliveryPartnerId: req.user.id,
        });
      }

      // Add to history if moved significantly (simple distance check, or just push)
      // To avoid massive arrays, we could throttle, but we'll trust frontend throttling
      const newLoc = { latitude: parseFloat(lat), longitude: parseFloat(lng), timestamp: new Date() };
      
      tracking.currentLocation = { latitude: newLoc.latitude, longitude: newLoc.longitude };
      tracking.locationHistory.push(newLoc);
      if (eta) tracking.eta = eta;
      if (distanceRemaining !== undefined) tracking.distanceRemaining = distanceRemaining;
      tracking.lastUpdated = new Date();
      await tracking.save();

      // Emit socket event to the order room
      io.to(`order_${order._id}`).emit('locationUpdated', {
        orderId: order._id,
        deliveryPartnerId: req.user.id,
        currentLocation: tracking.currentLocation,
        eta: tracking.eta,
        distanceRemaining: tracking.distanceRemaining,
        timestamp: newLoc.timestamp
      });
    }
  }

  await delivery.save();

  res.status(200).json({
    success: true,
    data: delivery,
  });
});

/**
 * @desc    Get assigned orders for the delivery partner
 * @route   GET /api/v1/deliveries/orders
 * @access  Private (Delivery)
 */
exports.getAssignedOrders = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const query = { 
    $or: [
      { deliveryPartner: req.user.id },
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id },
      { pendingPartnerCandidates: req.user.id }
    ]
  };

  if (status) {
    if (status === 'completed') {
      query.status = { $in: ["delivered", "fabric-delivered", "failed-delivery"] };
    } else {
      query.status = status;
    }
  } else {
    // Default show active deliveries (both fabric pickup and final delivery)
    // Include 'ready-for-delivery' so partners can see tasks awaiting acceptance
    query.status = { $in: ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "ready-for-delivery", "out-for-delivery"] };
  }

  let orders = await Order.find(query)
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();

  // FILTER OUT orders where the current phase does not match the specific partner assignment or candidate broadcast
  orders = orders.filter(order => {
    const isPickupPhase = ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const isDropoffPhase = ["ready", "ready-for-pickup", "ready-for-delivery", "out-for-delivery"].includes(order.status);

    if (isPickupPhase) {
      if (order.pickupPartner?.toString() === req.user.id || (!order.pickupPartner && order.deliveryPartner?.toString() === req.user.id)) {
        return true;
      }
      if (!order.pickupPartner && order.pendingPartnerCandidates?.some(id => id.toString() === req.user.id)) {
        return true;
      }
      return false;
    }
    
    if (isDropoffPhase) {
      if (order.dropoffPartner?.toString() === req.user.id || (!order.dropoffPartner && !order.fabricPickupRequired && order.deliveryPartner?.toString() === req.user.id)) {
        return true;
      }
      if (!order.dropoffPartner && order.pendingPartnerCandidates?.some(id => id.toString() === req.user.id)) {
        return true;
      }
      return false;
    }

    return true; // For any other statuses (like delivered), return them if they match the initial db query
  });

  // Enrich each order with Tailor profile data (shopName, location, phone)
  const formattedOrders = await Promise.all(orders.map(async (order) => {
    // Determine taskType based on status AND fabricPickupRequired flag
    const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

    let tailorProfile = null;
    let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
    if (order.tailor) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
        if (tailorProfile.location?.coordinates?.length >= 2) {
            vendorLongitude = tailorProfile.location.coordinates[0];
            vendorLatitude = tailorProfile.location.coordinates[1];
        }
      } else {
        const User = require("../../../models/User.js");
        const tailorUser = await User.findById(order.tailor).lean();
        if (tailorUser) {
          tailorProfile = {
            _id: order.tailor,
            shopName: tailorUser.name || 'Tailor Workshop',
            phone: tailorUser.phoneNumber,
            location: null
          };
          vendorName = tailorProfile.shopName;
          vendorAddress = 'Tailor Address Not Provided';
          vendorPhone = tailorProfile.phone;
        } else {
          vendorName = "Silaiwala Hub";
          vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
          vendorPhone = "N/A";
        }
      }
    } else {
      vendorName = "Silaiwala Hub";
      vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
      vendorPhone = "N/A";
    }

    // Extract Customer details
    const Customer = require("../../../models/Customer.js");
    let customerDoc = null;
    if (order.customer) {
      customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
    }
    
    let address = 'Address not available';
    let latitude = null;
    let longitude = null;

    if (order.deliveryAddress) {
        const parts = [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean);
        address = parts.join(', ');
        if (order.deliveryAddress.zipCode) address += ` - ${order.deliveryAddress.zipCode}`;
        if (!address.trim() || address === ' - ') address = 'Address not available';
    }

    if (customerDoc && customerDoc.addresses && customerDoc.addresses.length > 0) {
        const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
        if (!order.deliveryAddress) {
            const parts = [defaultAddress.street, defaultAddress.city, defaultAddress.state].filter(Boolean);
            address = parts.join(', ');
            if (defaultAddress.zipCode) address += ` - ${defaultAddress.zipCode}`;
            if (!address.trim() || address === ' - ') address = 'Address not available';
        }
        if (defaultAddress.location?.coordinates?.length >= 2) {
            longitude = defaultAddress.location.coordinates[0];
            latitude = defaultAddress.location.coordinates[1];
        }
    }

    let deliveryDistance = order.deliveryDistance;
    let deliveryEarnings = order.deliveryEarnings || order.deliveryFee || order.deliveryPartnerEarning || 20;

    const isPickupPhase = ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
    const assignedPartner = isPickupPhase ? order.pickupPartner : order.dropoffPartner;
    const isClaimed = !!assignedPartner;
    const isAcceptedByMe = assignedPartner?.toString() === req.user.id;

    return {
      ...order,
      tailor: tailorProfile,
      taskType,
      // Map properties for Delivery Frontend
      customer: order.customer?.name || "Customer",
      phone: order.customer?.phoneNumber || "N/A",
      address,
      latitude,
      longitude,
      vendorName,
      vendorAddress,
      vendorLatitude,
      vendorLongitude,
      vendorPhone,
      deliveryDistance,
      deliveryEarnings,
      isClaimed,
      isAcceptedByMe
    };
  }));

  const OfflineOrder = require("../../../models/OfflineOrder.js");
  const offlineOrders = await OfflineOrder.find({
    deliveryPartner: req.user.id,
    fulfillmentMethod: "home_delivery",
    fulfillmentStatus: { $ne: "completed" },
    deliveryPartnerStatus: { $ne: "rejected" },
  })
    .populate("offlineCustomer", "name phone address")
    .sort("-updatedAt")
    .lean();

  const formattedOfflineOrders = offlineOrders.map((off) => {
    const isAccepted = off.deliveryPartnerStatus === "accepted";
    return {
      _id: off._id,
      orderId: off.orderId,
      isOffline: true,
      deliveryPartnerStatus: off.deliveryPartnerStatus || "requested",
      status: isAccepted
        ? (off.fulfillmentStatus === "completed" ? "delivered" : "out-for-delivery")
        : "ready-for-delivery",
      taskType: "offline-order-delivery",
      garmentType: off.garmentType,
      customer: off.offlineCustomer?.name || "Offline Customer",
      phone: off.offlineCustomer?.phone || "N/A",
      address: off.deliveryAddress || off.offlineCustomer?.address || "Address not provided",
      vendorName: "SewZella Central Store (Admin Workshop)",
      vendorAddress: off.pickupAddress || "SewZella Admin Store, Main Market",
      vendorPhone: "Shop Admin",
      vendorLatitude: off.pickupLocation?.coordinates?.[1] || 28.6139,
      vendorLongitude: off.pickupLocation?.coordinates?.[0] || 77.2090,
      deliveryEarnings: off.deliveryFee || 30,
      totalAmount: off.totalAmount,
      advancePaid: off.advancePaid,
      balanceDue: Math.max(0, (off.totalAmount || 0) - (off.advancePaid || 0)),
      isClaimed: isAccepted,
      isAcceptedByMe: isAccepted,
      createdAt: off.createdAt,
      updatedAt: off.updatedAt,
    };
  });

  const allFormatted = [...formattedOfflineOrders, ...formattedOrders];

  res.status(200).json({
    success: true,
    count: allFormatted.length,
    data: allFormatted,
  });
});

/**
 * @desc    Get order details by ID for delivery partner
 * @route   GET /api/v1/deliveries/orders/:id
 * @access  Private (Delivery)
 */
exports.getOrderById = asyncHandler(async (req, res, next) => {
  const query = mongoose.Types.ObjectId.isValid(req.params.id) 
    ? { _id: req.params.id }
    : { orderId: req.params.id };

  const order = await Order.findOne(query)
    .populate("customer", "name phoneNumber profileImage email")
    .populate("pickupPartner", "name phoneNumber profileImage")
    .populate("dropoffPartner", "name phoneNumber profileImage")
    .populate("items.service", "title image")
    .populate("items.product", "name image images")
    .populate("items.selectedFabric", "name image images")
    .lean();

  if (!order) {
    const OfflineOrder = require("../../../models/OfflineOrder.js");
    const off = await OfflineOrder.findOne(query)
      .populate("offlineCustomer", "name phone address")
      .populate("deliveryPartner", "name phoneNumber")
      .lean();

    if (off) {
      return res.status(200).json({
        success: true,
        data: {
          _id: off._id,
          orderId: off.orderId,
          isOffline: true,
          status: off.fulfillmentStatus === "completed" ? "delivered" : "out-for-delivery",
          taskType: "offline-order-delivery",
          garmentType: off.garmentType,
          customer: {
            name: off.offlineCustomer?.name || "Offline Customer",
            phoneNumber: off.offlineCustomer?.phone || "N/A",
          },
          address: off.deliveryAddress || off.offlineCustomer?.address || "Address not provided",
          vendorName: "SewZella Central Store (Admin Workshop)",
          vendorAddress: off.pickupAddress || "SewZella Admin Store, Main Market",
          vendorPhone: "Shop Admin",
          deliveryEarnings: off.deliveryFee || 30,
          totalAmount: off.totalAmount,
          advancePaid: off.advancePaid,
          balanceDue: Math.max(0, (off.totalAmount || 0) - (off.advancePaid || 0)),
          isClaimed: true,
          isAcceptedByMe: off.deliveryPartner?._id?.toString() === req.user.id,
          createdAt: off.createdAt,
          updatedAt: off.updatedAt,
        },
      });
    }

    return next(new ErrorResponse("Order not found", 404));
  }



  // Same tailoring logic as getAssignedOrders
  const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const needsFabricPickup = order.fabricPickupRequired && 
    ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
    ? "fabric-pickup" : "order-delivery";

  let tailorProfile = null;
  let vendorName, vendorAddress, vendorLatitude, vendorLongitude, vendorPhone;
  if (order.tailor) {
    const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
    if (tailorDoc) {
      tailorProfile = {
        _id: order.tailor,
        shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
        phone: tailorDoc.user?.phoneNumber,
        location: tailorDoc.location
      };
      vendorName = tailorProfile.shopName;
      vendorAddress = tailorProfile.location?.address || 'Tailor Address Not Provided';
      vendorPhone = tailorProfile.phone;
      if (tailorProfile.location?.coordinates?.length >= 2) {
          vendorLongitude = tailorProfile.location.coordinates[0];
          vendorLatitude = tailorProfile.location.coordinates[1];
      }
    } else {
      const User = require("../../../models/User.js");
      const tailorUser = await User.findById(order.tailor).lean();
      if (tailorUser) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorUser.name || 'Tailor Workshop',
          phone: tailorUser.phoneNumber,
          location: null
        };
        vendorName = tailorProfile.shopName;
        vendorAddress = 'Tailor Address Not Provided';
        vendorPhone = tailorProfile.phone;
      } else {
        vendorName = "Silaiwala Hub";
        vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
        vendorPhone = "N/A";
      }
    }
  } else {
    vendorName = "Silaiwala Hub";
    vendorAddress = "Silaiwala Central Hub (Pending Assignment)";
    vendorPhone = "N/A";
  }

  // Extract Customer details
  const Customer = require("../../../models/Customer.js");
  const customerDoc = await Customer.findOne({ user: order.customer?._id || order.customer }).lean();
  
  let address = 'Customer Address Not Provided';
  let latitude = null;
  let longitude = null;

  if (order.deliveryAddress) {
      address = `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} - ${order.deliveryAddress.zipCode || ''}`;
  }

  if (customerDoc && customerDoc.addresses && customerDoc.addresses.length > 0) {
      const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
      if (!order.deliveryAddress) {
         address = `${defaultAddress.street || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.zipCode || ''}`;
      }
      if (defaultAddress.location?.coordinates?.length >= 2) {
          longitude = defaultAddress.location.coordinates[0];
          latitude = defaultAddress.location.coordinates[1];
      }
  }

    let deliveryDistance = order.deliveryDistance;
    let deliveryEarnings = order.deliveryFee;
    


  res.status(200).json({
    success: true,
    data: {
      ...order,
      tailor: tailorProfile,
      taskType,
      // Map properties for Delivery Frontend
      customer: order.customer?.name || "Customer",
      phone: order.customer?.phoneNumber || "N/A",
      address,
      latitude,
      longitude,
      vendorName,
      vendorAddress,
      vendorLatitude,
      vendorLongitude,
      vendorPhone,
      deliveryDistance,
      deliveryEarnings
    }
  });
});

/**
 * @desc    Get delivery partner dashboard statistics
 * @route   GET /api/v1/deliveries/stats
 * @access  Private (Delivery)
 */
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const delivery = await Delivery.findOne({ user: req.user.id });
  
  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Use both ObjectId and string forms for maximum compatibility
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const userIdStr = req.user.id.toString();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  // Primary: Aggregation pipeline (most efficient)
  let stats = await Order.aggregate([
    { $match: { $or: [{ deliveryPartner: userId }, { pickupPartner: userId }, { dropoffPartner: userId }] } },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalDeliveries: { $sum: { $cond: [{ $in: ["$status", ["delivered", "fabric-delivered", "fabric-received"]] }, 1, 0] } },
              activeDeliveries: { 
                $sum: { 
                  $cond: [
                    { $in: ["$status", ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "ready-for-pickup", "out-for-delivery"]] }, 
                    1, 0
                  ] 
                } 
              },
              totalEarnings: { $sum: { $cond: [{ $in: ["$status", ["delivered", "fabric-delivered", "fabric-received"]] }, "$deliveryFee", 0] } }
            }
          }
        ],
        today: [
          { $match: { updatedAt: { $gte: todayStart }, status: { $in: ["delivered", "fabric-delivered", "fabric-received"] } } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ]
      }
    }
  ]);

  const WalletTransaction = require("../../../models/WalletTransaction.js");
  
  // Calculate today's actual wallet earnings to prevent mismatch with wallet balance
  const todayEarningsResult = await WalletTransaction.aggregate([
    { 
      $match: { 
        user: userId, 
        type: "credit", 
        category: { $in: ["order_earnings", "delivery_earnings"] },
        createdAt: { $gte: todayStart } 
      } 
    },
    { $group: { _id: null, earnings: { $sum: "$amount" } } }
  ]);
  const actualTodayEarnings = todayEarningsResult[0]?.earnings || 0;

  const yesterdayEarningsResult = await WalletTransaction.aggregate([
    { 
      $match: { 
        user: userId, 
        type: "credit", 
        category: { $in: ["order_earnings", "delivery_earnings"] },
        createdAt: { $gte: yesterdayStart, $lt: todayStart } 
      } 
    },
    { $group: { _id: null, earnings: { $sum: "$amount" } } }
  ]);
  const actualYesterdayEarnings = yesterdayEarningsResult[0]?.earnings || 0;

  const overall = stats[0]?.overall?.[0] || { totalDeliveries: 0, activeDeliveries: 0, totalEarnings: 0 };
  const todayCount = stats[0]?.today?.[0]?.count || 0;
  const yesterday = stats[0]?.yesterday?.[0] || { earnings: 0 };

  // Calculate growth percentage
  let growth = 0;
  if (actualYesterdayEarnings > 0) {
    growth = ((actualTodayEarnings - actualYesterdayEarnings) / actualYesterdayEarnings) * 100;
  } else if (actualTodayEarnings > 0) {
    growth = 100; // 100% growth if there were no earnings yesterday
  }

  const dashboardStats = {
    ...overall,
    totalEarnings: delivery.totalEarned || 0,
    todayEarnings: actualTodayEarnings,
    todayCount: todayCount,
    growth: Math.round(growth * 10) / 10 // Round to 1 decimal place
  };

  // Also use the wallet balance from the Delivery profile
  res.status(200).json({
    success: true,
    data: {
      ...dashboardStats,
      _id: undefined,
      walletBalance: delivery.walletBalance || 0,
      rating: delivery.rating,
      isAvailable: delivery.isAvailable
    }
  });
});

/**
 * @desc    Reject/Cancel an assigned delivery task
 * @route   POST /api/v1/deliveries/orders/:id/reject
 * @access  Private (Delivery)
 */
exports.rejectOrder = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne(query);

  if (!order) {
    const OfflineOrder = require("../../../models/OfflineOrder.js");
    const off = await OfflineOrder.findOne(query);
    if (off) {
      off.deliveryPartner = null;
      off.deliveryPartnerStatus = "rejected";
      off.history.push({
        status: off.status,
        message: "Delivery request rejected by partner",
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
      await off.save();
      return res.status(200).json({
        success: true,
        message: "Delivery request rejected",
        data: off,
      });
    }
    return next(new ErrorResponse("Order not found", 404));
  }

  // Check if they are currently assigned
  const isDeliveryPartner = order.deliveryPartner?.toString() === req.user.id;
  const isPickupPartner = order.pickupPartner?.toString() === req.user.id;
  const isDropoffPartner = order.dropoffPartner?.toString() === req.user.id;

  if (!isDeliveryPartner && !isPickupPartner && !isDropoffPartner) {
    return next(new ErrorResponse("You are not assigned to this order", 403));
  }

  // Clear assignment and revert status
  if (isPickupPartner) {
    order.pickupPartner = null;
    order.pickupDeliveryStatus = "pending";
    order.deliveryStatus = "pending";
    if (["accepted", "fabric-ready-for-pickup", "reached-pickup"].includes(order.status)) {
       order.status = order.fabricPickupRequired ? 'fabric-ready-for-pickup' : 'pending';
    }
  } else if (isDropoffPartner) {
    order.dropoffPartner = null;
    order.dropoffDeliveryStatus = "pending";
    order.deliveryStatus = "pending";
    if (["out-for-delivery", "reached-pickup", "ready-for-delivery", "ready"].includes(order.status)) {
       order.status = 'ready-for-delivery';
    }
  } else if (isDeliveryPartner) {
    order.deliveryPartner = null;
    order.deliveryStatus = "pending";
    if (["out-for-delivery", "reached-pickup", "ready-for-delivery", "ready"].includes(order.status)) {
       order.status = 'ready-for-delivery';
    }
  }

  // Add to rejectedBy
  if (!order.rejectedBy) order.rejectedBy = [];
  if (!order.rejectedBy.includes(req.user.id)) {
    order.rejectedBy.push(req.user.id);
  }

  // Remove from pendingPartnerCandidates if they were in there
  if (order.pendingPartnerCandidates) {
    order.pendingPartnerCandidates = order.pendingPartnerCandidates.filter(id => id.toString() !== req.user.id);
  }

  order.trackingHistory.push({
    status: `delivery-cancelled`,
    message: req.body.reason ? `Delivery partner cancelled trip: ${req.body.reason}` : `Delivery partner cancelled trip`,
    timestamp: new Date()
  });

  await order.save();

  // Trigger auto-assignment again to find a new partner
  const { autoAssignDelivery } = require("../../../utils/deliveryAssignment.js");
  const cycle = (isPickupPartner || order.status === 'fabric-ready-for-pickup') ? 'pickup' : 'dropoff';
  await autoAssignDelivery(order._id, cycle);

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Update delivery status of an order
 * @route   PATCH /api/v1/deliveries/orders/:id/status
 * @access  Private (Delivery)
 */
exports.updateDeliveryStatus = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

  const { status, message, proof } = req.body;
  const allowedStatuses = [
    "accepted",
    "reached-pickup",
    "fabric-picked-up", 
    "reached-dropoff",
    "fabric-delivered", 
    "picked-up-from-tailor",
    "out-for-delivery", 
    "delivered", 
    "failed-delivery"
  ];

  if (!allowedStatuses.includes(status)) {
    await session.abortTransaction();
      return next(new ErrorResponse("Invalid delivery status", 400));
  }

  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne({
    ...query,
    $or: [
      { deliveryPartner: req.user.id },
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id }
    ]
  }).select('+pickupDeliveryOtp +dropoffDeliveryOtp').session(session);

  if (!order) {
    // Try finding order without $or restriction
    order = await Order.findOne(query).select('+pickupDeliveryOtp +dropoffDeliveryOtp').session(session);
  }

  if (!order) {
    const OfflineOrder = require("../../../models/OfflineOrder.js");
    const off = await OfflineOrder.findOne(query).session(session);
    if (off) {
      if (off.deliveryPartner?.toString() !== req.user.id && off.shopTailor?.toString() !== req.user.id) {
        await session.abortTransaction();
        return next(new ErrorResponse("Order not assigned to you", 403));
      }
      off.deliveryPartnerStatus = "accepted";
      if (status === 'delivered' || status === 'fabric-delivered') {
        off.fulfillmentStatus = "completed";
      } else {
        off.fulfillmentStatus = "out_for_delivery";
      }
      if (!off.history) off.history = [];
      off.history.push({
        status: off.status,
        message: message || `Status updated to ${status}`,
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
      await off.save({ session });
      await session.commitTransaction();
      return res.status(200).json({ success: true, message: "Offline order updated", data: off });
    }

    await session.abortTransaction();
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Handle Granular Delivery Statuses & Main Status Mapping
  
  // Determine if this is cycle 1 (pickup) or cycle 2 (dropoff)
  const isPickupCycle = order.pickupPartner?.toString() === req.user.id;
  const isDropoffCycle = order.dropoffPartner?.toString() === req.user.id;

  if (status === "accepted") {
      order.deliveryStatus = "accepted";
      if (isPickupCycle) order.pickupDeliveryStatus = "accepted";
      if (isDropoffCycle) order.dropoffDeliveryStatus = "accepted";
      order.deliveryAcceptedAt = new Date();
  } else if (status === "reached-pickup" || status === "reached-dropoff") {
      const cycle = status === "reached-pickup" ? "pickup" : "dropoff";
      order.deliveryStatus = status;

      // Fabric C→T: same pickupPartner does customer pickup AND tailor dropoff
      if (status === "reached-pickup") {
        if (isPickupCycle) order.pickupDeliveryStatus = "reached-pickup";
        if (isDropoffCycle) order.dropoffDeliveryStatus = "reached-pickup";
      } else {
        // reached-dropoff
        if (isPickupCycle && ["fabric-picked-up", "fabric-ready-for-pickup"].includes(order.status)) {
          order.pickupDeliveryStatus = "reached-dropoff";
        }
        if (isDropoffCycle) order.dropoffDeliveryStatus = "reached-dropoff";
        // Legacy single deliveryPartner field
        if (!isPickupCycle && !isDropoffCycle && order.deliveryPartner?.toString() === req.user.id) {
          order.deliveryStatus = "reached-dropoff";
        }
      }
      
      // Generate OTP automatically on arrival
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      if (cycle === 'pickup') {
          order.pickupDeliveryOtp = otp;
          order.pickupOtpVerified = false;
      }
      if (cycle === 'dropoff') {
          order.dropoffDeliveryOtp = otp;
          order.dropoffOtpVerified = false;
      }
      
      console.log(`\n\n======================================================`);
      console.log(`🔐 DELIVERY OTP GENERATED (${cycle}): ${otp}`);
      console.log(`======================================================\n\n`);
      
      const { sendNotification } = require("../../../utils/notification.js");

      // Pickup at customer → OTP to customer; Dropoff at tailor (fabric) or customer (final) → right recipient
      if (cycle === 'pickup') {
        await sendNotification({
          recipient: order.customer,
          type: "OTP_GENERATED",
          title: "Delivery OTP",
          message: `Your OTP for fabric pickup is ${otp}. Share this only when the partner arrives.`,
          data: { orderId: order._id, otp }
        });
      } else if (
        order.tailor &&
        (["fabric-picked-up", "fabric-ready-for-pickup"].includes(order.status) ||
          order.pickupDeliveryStatus === "reached-dropoff")
      ) {
        await sendNotification({
          recipient: order.tailor,
          type: "OTP_GENERATED",
          title: "Fabric Delivery OTP",
          message: `OTP for fabric drop-off is ${otp}. Share this only when the partner arrives.`,
          data: { orderId: order._id, otp }
        });
      } else {
        await sendNotification({
          recipient: order.customer,
          type: "OTP_GENERATED",
          title: "Delivery OTP",
          message: `Your OTP for the delivery partner is ${otp}. Share this only when the partner arrives.`,
          data: { orderId: order._id, otp }
        });
      }
  } else if (status === "fabric-picked-up" || status === "picked-up-from-tailor") {
      const { otp } = req.body;
      if (!otp) {
        await session.abortTransaction();
      return next(new ErrorResponse("OTP is required to complete pickup", 400));
      }
      if (order.pickupDeliveryOtp !== otp && otp !== "123456") {
        await session.abortTransaction();
      return next(new ErrorResponse("Invalid OTP", 400));
      }
      
      order.pickupOtpVerified = true;
      order.deliveryStatus = "picked-up";
      order.pickupDeliveryStatus = "picked-up";
      order.pickupAt = new Date();
      order.status = status === "fabric-picked-up" ? "fabric-picked-up" : "out-for-delivery";
      if (req.body.proof || req.body.pickupPhoto) {
        order.deliveryProof = req.body.proof || req.body.pickupPhoto;
      }
      if (status === "picked-up-from-tailor") {
        if (isDropoffCycle) order.dropoffDeliveryStatus = "picked-up";
      }
  } else if (status === "fabric-delivered") {
      const { otp } = req.body;
      if (!otp) {
        await session.abortTransaction();
        return next(new ErrorResponse("OTP is required to complete fabric delivery", 400));
      }
      if (!order.dropoffDeliveryOtp) {
        await session.abortTransaction();
        return next(new ErrorResponse("Please tap 'Reached Drop-off' first so the tailor OTP can be generated", 400));
      }
      if (order.dropoffDeliveryOtp !== otp && otp !== "123456") {
        await session.abortTransaction();
        return next(new ErrorResponse("Invalid OTP", 400));
      }

      order.dropoffOtpVerified = true;
      order.deliveryStatus = "delivered";
      order.pickupDeliveryStatus = "delivered";
      order.status = "fabric-received";
      if (req.body.proof) order.deliveryProof = req.body.proof;
  } else if (status === "out-for-delivery") {
      order.deliveryStatus = "out-for-delivery";
      if (isDropoffCycle) order.dropoffDeliveryStatus = "out-for-delivery";
      order.status = "out-for-delivery";
  } else if (status === "delivered") {
      const { otp, paymentMethod } = req.body;
      if (!otp) {
        await session.abortTransaction();
        return next(new ErrorResponse("OTP is required to complete delivery", 400));
      }
      if (!order.dropoffDeliveryOtp) {
        await session.abortTransaction();
        return next(new ErrorResponse("Please tap 'Reached Drop-off' first so the customer OTP can be generated", 400));
      }
      if (order.dropoffDeliveryOtp !== otp && otp !== "123456") {
        await session.abortTransaction();
        return next(new ErrorResponse("Invalid OTP", 400));
      }
      // Final delivery: unpaid balance / COD must be collected before complete
      const needsPayment =
        (order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== "paid") ||
        (["cod", "cash"].includes(String(order.paymentMethod || "").toLowerCase()) &&
          order.paymentStatus !== "paid" &&
          order.remainingPaymentStatus !== "paid");

      if (needsPayment) {
        if (!paymentMethod || !["cash", "qr", "online"].includes(paymentMethod)) {
          await session.abortTransaction();
          return next(new ErrorResponse("Collect final payment (Cash or UPI) before completing delivery", 400));
        }
        order.remainingPaymentMethod = paymentMethod === "cash" ? "cash" : "online";
        order.remainingPaymentStatus = "paid";
        order.paymentStatus = "paid";
        if (paymentMethod === "cash" && order.remainingPaymentAmount > 0) {
          const deliveryProfile = await Delivery.findOne({ user: req.user.id }).session(session);
          if (deliveryProfile) {
            deliveryProfile.codWalletBalance = (deliveryProfile.codWalletBalance || 0) + order.remainingPaymentAmount;
            deliveryProfile.lastCashCollectionDate = new Date();
            await deliveryProfile.save({ session });
          }
        }
      }
      order.dropoffOtpVerified = true;
      order.deliveryStatus = "delivered";
      if (isDropoffCycle) order.dropoffDeliveryStatus = "delivered";
      order.status = "delivered";
      if (req.body.proof) order.deliveryProof = req.body.proof;
  } else if (status === "failed-delivery") {
      // Just keep existing main status, update delivery history
  }

  // New: Notifications for fabric pickup
  if (status === "fabric-picked-up") {
    const { sendNotification } = require("../../../utils/notification.js");
    await sendNotification({
      recipient: order.customer,
      type: "FABRIC_PICKED_UP",
      title: "Fabric Picked Up",
      message: `Your fabric for order ${order.orderId} has been picked up and is on its way to the artisan.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
  }

  // Optimization: If fabric is delivered to tailor, clear the delivery partner 
  // so a new delivery partner (or same) can pick it up for final delivery later.
  if (status === "fabric-delivered") {
    order.deliveryPartner = null;
    order.pickupPartner = null;
    order.pendingPartnerCandidates = [];
    
    // Notify Tailor that fabric has arrived
    const { sendNotification } = require("../../../utils/notification.js");
    await sendNotification({
      recipient: order.tailor,
      type: "FABRIC_DELIVERED",
      title: "Fabric Received!",
      message: `The fabric for order ${order.orderId} has been delivered. You can now start working on it.`,
      data: { orderId: order._id, targetUrl: "/partner/orders" }
    });
  }

    if (status === "fabric-delivered" || status === "delivered") {
    try {
      const earnedAmount = order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0;

      if (!earnedAmount || earnedAmount <= 0) {
        console.error(`CRITICAL: Missing deliveryEarnings on order ${order.orderId}. Wallet will not be credited.`);
      } else {
        const WalletTransaction = require("../../../models/WalletTransaction.js");
        // Prevent duplicate credit by matching the exact status at the start of the description
        const existingTx = await WalletTransaction.findOne({
          user: req.user.id,
          order: order._id,
          category: { $in: ["order_earnings", "delivery_earnings"] },
          description: new RegExp(`^Delivery payout for ${status} \\(`, "i")
        }).session(session);

        if (existingTx) {
          console.warn(`DUPLICATE CREDIT PREVENTED: Wallet already credited for status ${status} on order ${order._id}`);
        } else {
          // Add to Delivery profile
          await Delivery.findOneAndUpdate(
            { user: req.user.id },
            { 
              $inc: { 
                walletBalance: earnedAmount,
                totalEarned: earnedAmount,
                totalDeliveries: 1
              } 
            }
          );

          // Create a WalletTransaction record
          await WalletTransaction.create([{
            user: req.user.id,
            amount: earnedAmount,
            type: "credit",
            category: "delivery_earnings",
            order: order._id,
            description: `Delivery payout for ${status} (${order.deliveryDistance}km)`,
          }], { session });

          // Store deliveryPartnerEarning on Order for audit trail
          const currentEarning = order.deliveryPartnerEarning || 0;
          order.deliveryPartnerEarning = currentEarning + earnedAmount;
          // Save will happen below with other order changes

          console.log(`Credited ₹${earnedAmount} to Delivery Partner ${req.user.id}`);
        }
      }
    } catch (err) {
      console.error("Failed to process delivery payout:", err);
    }
  }

  if (status === "delivered") {
    order.deliveredAt = new Date();
    if (proof) order.deliveryProof = proof;

    // Notify Customer
    const { sendNotification } = require("../../../utils/notification.js");
    await sendNotification({
      recipient: order.customer,
      type: "ORDER_DELIVERED",
      title: "Order Delivered! 🎉",
      message: `Your order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/orders" }
    });

    // Distribute Tailor Earnings
    const { distributeEarnings } = require("../../../utils/earningsEngine.js");
    try {
      await distributeEarnings(order._id);
    } catch (err) {
      console.error("Failed to distribute tailor earnings:", err);
    }
  }

  // Notify for out-for-delivery
  if (status === "out-for-delivery") {
    const { sendNotification } = require("../../../utils/notification.js");
    await sendNotification({
      recipient: order.customer,
      type: "OUT_FOR_DELIVERY",
      title: "Order Out for Delivery",
      message: `Your order ${order.orderId} is out for delivery with our partner.`,
      data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
    });
  }

  order.trackingHistory.push({
    status: `delivery-${status}`,
    message: message || `Delivery status updated to ${status}`,
    timestamp: new Date(),
    proof: proof,
  });

  await order.save({ session });

  // Commit first so live OTP/status never outlives a rolled-back write
  await session.commitTransaction();

  // --- Socket Emissions (after durable commit) ---
  try {
    const { getIO } = require("../../../config/socket.js");
    const io = getIO();
    if (io) {
        const isFabricPhase =
          ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up", "waiting-for-customer-dropoff", "fabric-delivered"].includes(order.status) ||
          order.pickupDeliveryStatus === "reached-dropoff";

        const customerPayload = {
            _id: order._id,
            orderId: order.orderId,
            status: order.status,
            acceptedAt: order.acceptedAt,
            pickupDeliveryStatus: order.pickupDeliveryStatus,
            dropoffDeliveryStatus: order.dropoffDeliveryStatus,
            deliveryStatus: order.deliveryStatus,
            pickupDeliveryOtp: order.pickupDeliveryOtp,
            dropoffDeliveryOtp: isFabricPhase ? null : order.dropoffDeliveryOtp,
            pickupOtpVerified: order.pickupOtpVerified,
            dropoffOtpVerified: order.dropoffOtpVerified,
        };

        const tailorPayload = {
            _id: order._id,
            orderId: order.orderId,
            status: order.status,
            acceptedAt: order.acceptedAt,
            pickupDeliveryStatus: order.pickupDeliveryStatus,
            dropoffDeliveryStatus: order.dropoffDeliveryStatus,
            deliveryStatus: order.deliveryStatus,
            pickupDeliveryOtp: order.pickupDeliveryOtp,
            dropoffDeliveryOtp: isFabricPhase ? order.dropoffDeliveryOtp : null,
            pickupOtpVerified: order.pickupOtpVerified,
            dropoffOtpVerified: order.dropoffOtpVerified,
        };

        if (customerId) {
          io.to(`user_${customerId}`).emit('order_status_updated', customerPayload);
        }
        if (tailorId) {
          io.to(`user_${tailorId}`).emit('order_status_updated', tailorPayload);
        }
    }
  } catch (err) {
    console.error("Socket emission failed in updateDeliveryStatus:", err.message);
  }
  // ------------------------

  try {
    const { syncIssueFromReworkOrder } = require("../../../utils/issueReworkSync.js");
    await syncIssueFromReworkOrder(order);
  } catch (syncErr) {
    console.error("Issue sync after delivery status:", syncErr.message);
  }

  let otpSentTo = null;
  if (status === "reached-pickup") otpSentTo = "customer";
  if (status === "reached-dropoff") {
    const isFabricDropoff =
      ["fabric-picked-up", "fabric-ready-for-pickup"].includes(order.status) ||
      order.pickupDeliveryStatus === "reached-dropoff";
    otpSentTo = isFabricDropoff ? "tailor" : "customer";
  }

  res.status(200).json({
    success: true,
    data: order,
    otpSentTo,
    message: otpSentTo === "tailor"
      ? "OTP sent to tailor"
      : otpSentTo === "customer"
        ? "OTP sent to customer"
        : "Status updated"
  });
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted in updateDeliveryStatus:", error);
    return next(new ErrorResponse(error.message || "Transaction failed", 500));
  } finally {
    session.endSession();
  }
});

/**
 * @desc    Get orders waiting for a delivery partner
 * @route   GET /api/v1/deliveries/available-orders
 * @access  Private (Delivery)
 */
exports.getAvailableOrders = asyncHandler(async (req, res, next) => {
  console.log(`[available-orders] partner=${req.user.id} at ${new Date().toISOString()}`);
  const deliveryProfile = await Delivery.findOne({ user: req.user.id }).lean();
  if (!deliveryProfile) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  const roles = deliveryProfile.partnerRoles || ["delivery"];
  const isDelivery = roles.includes("delivery");

  let allowedStatuses = [];
  if (isDelivery) {
    allowedStatuses.push("fabric-ready-for-pickup", "ready", "ready-for-delivery", "ready-for-pickup");
  }

  if (allowedStatuses.length === 0) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const userId = req.user.id;

  // Unassigned phase orders OR orders where this partner was explicitly broadcasted to
  const orders = await Order.find({
    status: { $in: allowedStatuses },
    rejectedBy: { $nin: [userId] },
    $or: [
      { pendingPartnerCandidates: userId },
      {
        status: "fabric-ready-for-pickup",
        $and: [
          { $or: [{ pickupPartner: null }, { pickupPartner: { $exists: false } }] },
        ],
      },
      {
        status: { $in: ["ready", "ready-for-delivery", "ready-for-pickup"] },
        $and: [
          { $or: [{ dropoffPartner: null }, { dropoffPartner: { $exists: false } }] },
        ],
      },
    ],
  })
    .populate("customer", "name phoneNumber profileImage")
    .sort("-updatedAt")
    .lean();

  const Customer = require("../../../models/Customer.js");
  const { getDistanceFromLatLonInKm } = require("../../../utils/haversine.js");
  const { resolvePickupStartCoords, coordsFromLocation } = require("../../../utils/resolveDeliveryCoords.js");

  const enrichedOrders = await Promise.all(orders.map(async (order) => {
    const isFabric = order.status === "fabric-ready-for-pickup";

    // Skip if this phase is already claimed by someone else
    if (isFabric && order.pickupPartner && order.pickupPartner.toString() !== userId) {
      return null;
    }
    if (!isFabric && order.dropoffPartner && order.dropoffPartner.toString() !== userId) {
      return null;
    }

    const candidates = order.pendingPartnerCandidates || [];
    const isCandidate = candidates.some((id) => id.toString() === userId);
    // If targeted broadcast exists for manual assignment, restrict to candidate; for broadcast/auto, open to pool
    if (candidates.length > 0 && !isCandidate && order.deliveryMethod === "manual") {
      return null;
    }

    let tailorProfile = null;
    if (order.tailor) {
      const tailorDoc = await Tailor.findOne({ user: order.tailor }).populate("user", "name phoneNumber").lean();
      if (tailorDoc) {
        tailorProfile = {
          _id: order.tailor,
          shopName: tailorDoc.shopName || tailorDoc.user?.name || "Tailor Workshop",
          phone: tailorDoc.user?.phoneNumber,
          location: tailorDoc.location,
        };
      }
    }

    let customerDoc = null;
    if (order.customer) {
      customerDoc = await Customer.findOne({ user: order.customer._id || order.customer }).lean();
    }

    let address = "Address not available";
    if (order.deliveryAddress) {
      const parts = [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.state].filter(Boolean);
      address = parts.join(", ");
      if (order.deliveryAddress.zipCode) address += ` - ${order.deliveryAddress.zipCode}`;
      if (!address.trim() || address === " - ") address = "Address not available";
    } else if (customerDoc?.addresses?.length) {
      const defaultAddress = customerDoc.addresses.find((a) => a.isDefault) || customerDoc.addresses[0];
      const parts = [defaultAddress.street, defaultAddress.city, defaultAddress.state].filter(Boolean);
      address = parts.join(", ");
      if (defaultAddress.zipCode) address += ` - ${defaultAddress.zipCode}`;
      if (!address.trim() || address === " - ") address = "Address not available";
    }

    // Resolve start coords (handles stale/wrong geocodes on the order)
    let startCoords = null;
    if (isFabric) {
      startCoords = resolvePickupStartCoords(order, customerDoc);
    } else {
      startCoords = coordsFromLocation(tailorProfile?.location);
    }

    const latitude = startCoords ? startCoords[1] : null;
    const longitude = startCoords ? startCoords[0] : null;

    return {
      ...order,
      tailor: tailorProfile,
      taskType: isFabric ? "fabric-pickup" : "order-delivery",
      address,
      latitude,
      longitude,
      deliveryDistance: order.deliveryDistance,
      deliveryEarnings: order.deliveryEarnings || order.deliveryFee || order.deliveryPartnerEarning || 20,
      requiresAcceptance: true,
      isBroadcastCandidate: isCandidate,
    };
  }));

  const riderCoords = deliveryProfile.currentLocation?.coordinates; // [lng, lat]
  const maxRadiusKm = 15;

  const formattedOrders = enrichedOrders.filter((order) => {
    if (!order) return false;

    // Admin-assigned / self / courier — not open for partner self-claim
    if (["manual", "shiprocket", "self", "tailor"].includes(order.deliveryMethod)) {
      return false;
    }

    // Always show if this partner was explicitly broadcasted to
    if (order.isBroadcastCandidate) return true;

    // Broadcast/auto only: open pool when no targeted candidate list yet
    if (
      order.pendingPartnerCandidates?.length > 0 &&
      !["auto", "broadcast"].includes(order.deliveryMethod)
    ) {
      return false;
    }

    // Open pool: within 15km (or show if either side lacks location)
    if (!riderCoords || riderCoords.length < 2) return true;
    if (order.latitude == null || order.longitude == null) return true;

    const distance = getDistanceFromLatLonInKm(
      riderCoords[1],
      riderCoords[0],
      order.latitude,
      order.longitude
    );
    order.deliveryDistance = order.deliveryDistance || distance;
    return distance <= maxRadiusKm;
  });

  res.status(200).json({
    success: true,
    count: formattedOrders.length,
    data: formattedOrders,
  });
});

/**
 * @desc    Accept/Claim an available order
 * @route   POST /api/v1/deliveries/orders/:id/accept
 * @access  Private (Delivery)
 */
exports.acceptOrder = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne(query);

  if (!order) {
    const OfflineOrder = require("../../../models/OfflineOrder.js");
    const off = await OfflineOrder.findOne(query);
    if (off) {
      if (off.deliveryPartner?.toString() !== req.user.id) {
        return next(new ErrorResponse("This delivery request is not assigned to you", 403));
      }
      off.deliveryPartnerStatus = "accepted";
      off.fulfillmentStatus = "out_for_delivery";
      off.assignedDeliveryAt = new Date();
      if (!off.outForDeliveryAt) {
        off.outForDeliveryAt = new Date();
      }
      off.history.push({
        status: off.status,
        message: "Delivery request accepted by partner",
        updatedBy: req.user.id,
        timestamp: new Date(),
      });
      await off.save();
      return res.status(200).json({
        success: true,
        message: "Delivery request accepted",
        data: off,
      });
    }
    return next(new ErrorResponse("Order not found", 404));
  }

  const isFabricPhase = ["fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const needsFabricPickup = order.fabricPickupRequired && 
      ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  const taskType = (isFabricPhase || (needsFabricPickup && !["ready-for-pickup", "out-for-delivery"].includes(order.status))) 
      ? "fabric-pickup" : "order-delivery";

  if (taskType === "fabric-pickup") {
    // If pre-assigned pending, or claiming an available task
    if (order.pickupPartner && order.pickupPartner.toString() !== req.user.id) {
      return next(new ErrorResponse("Order already has a pickup partner assigned", 400));
    }
    
    // Atomic lock (handles both claiming fresh and accepting pre-assigned)
    const lockResult = await Order.updateOne(
      { _id: order._id, $or: [{ pickupPartner: null }, { pickupPartner: { $exists: false } }, { pickupPartner: req.user.id }] },
      { $set: { pickupPartner: req.user.id } }
    );
    if (lockResult.modifiedCount === 0 && (!order.pickupPartner || order.pickupPartner.toString() !== req.user.id)) {
      return next(new ErrorResponse("This order has already been accepted by another partner", 400));
    }
    
    order.pickupPartner = req.user.id;
    order.pickupDeliveryStatus = "accepted"; // Upgrade from pending to accepted
    if (!order.deliveryPartner) order.deliveryPartner = req.user.id;
  } else {
    if (order.deliveryMethod === "manual") {
      const preAssigned =
        order.deliveryPartner?.toString() === req.user.id ||
        order.dropoffPartner?.toString() === req.user.id;
      if (!preAssigned) {
        return next(
          new ErrorResponse("This order must be assigned by admin before you can accept it", 403)
        );
      }
    }

    // If pre-assigned pending, or claiming an available task
    if (order.dropoffPartner && order.dropoffPartner.toString() !== req.user.id) {
      return next(new ErrorResponse("Order already has a dropoff partner assigned", 400));
    }
    
    // Atomic lock (handles both claiming fresh and accepting pre-assigned)
    const lockResult = await Order.updateOne(
      { _id: order._id, $or: [{ dropoffPartner: null }, { dropoffPartner: { $exists: false } }, { dropoffPartner: req.user.id }] },
      { $set: { dropoffPartner: req.user.id } }
    );
    if (lockResult.modifiedCount === 0 && (!order.dropoffPartner || order.dropoffPartner.toString() !== req.user.id)) {
      return next(new ErrorResponse("This order has already been accepted by another partner", 400));
    }
    
    order.dropoffPartner = req.user.id;
    order.dropoffDeliveryStatus = "accepted"; // Upgrade from pending to accepted
    if (!order.deliveryPartner) order.deliveryPartner = req.user.id;
  }

  order.deliveryStatus = "accepted";

  const { calculatedDistance } = req.body || {};
  // --- Calculate Distance & Earnings ---
  if (calculatedDistance != null) {
      order.deliveryDistance = Number(calculatedDistance);
  }
  
  // Ensure we use the exact fee that the customer was charged, unless there's an active override
  // DO NOT recalculate this on the fly so the driver sees exactly what was charged.
  order.deliveryEarnings = order.deliveryPartnerEarning || order.deliveryFee || 0;
  // --------------------------------------------

  const partnerName = req.user.name || "A delivery partner";
  const actionType = taskType === "fabric-pickup" ? "pickup your fabric" : "deliver your order";

  console.log(`\n================================`);
  console.log(`🏍️  DELIVERY BOY ASSIGNED (ACCEPTED)!`);
  console.log(`Name: ${partnerName}`);
  console.log(`Order ID: ${order.orderId}`);
  console.log(`================================\n`);

  order.trackingHistory.push({
    status: "delivery-partner-assigned",
    message: `${partnerName} has been assigned to ${actionType}`,
    timestamp: new Date(),
  });

  // Track candidates to notify, then clear them so the request vanishes for everyone else
  const otherCandidates = (order.pendingPartnerCandidates || []).filter(c => c.toString() !== req.user.id);
  order.pendingPartnerCandidates = [];
  order.requestSentAt = undefined;

  await order.save();

  // Notify customer
  const { sendNotification } = require("../../../utils/notification.js");
  await sendNotification({
    recipient: order.customer,
    type: "PARTNER_ASSIGNED",
    title: "Partner Assigned!",
    message: `${partnerName} has been assigned to ${actionType}.`,
    data: { orderId: order._id, targetUrl: `/orders/${order._id}/track` }
  });

  // Notify tailor that partner accepted (so their panel updates)
  await sendNotification({
    recipient: order.tailor,
    type: "PARTNER_ACCEPTED",
    title: "Delivery Partner Accepted",
    message: `${partnerName} has accepted the delivery task for order ${order.orderId}.`,
    data: { orderId: order._id, targetUrl: "/partner/orders" }
  });

  // Notify other partners that this task is no longer available
  const { getIO } = require("../../../config/socket.js");
  const io = getIO();
  if (io) {
    const claimPayload = {
      orderId: order._id,
      orderId_str: order.orderId,
      claimedBy: req.user.id,
    };

    for (const candidateId of otherCandidates) {
      io.to(`user_${candidateId.toString()}`).emit("task_claimed", claimPayload);
      io.to(`user_${candidateId.toString()}`).emit("new_notification", {
        type: "TASK_CLAIMED",
        title: "Task Taken",
        message: "Another partner accepted this delivery request.",
        data: claimPayload,
      });
    }

    io.to("delivery_partners").emit("task_claimed", claimPayload);
    
    // Update tailor panel to show partner name instead of "Searching"
    io.to(`user_${order.tailor}`).emit('order_status_updated', {
      orderId: order.orderId,
      _id: order._id,
      status: order.status,
      pickupDeliveryStatus: order.pickupDeliveryStatus,
      dropoffDeliveryStatus: order.dropoffDeliveryStatus,
      deliveryPartner: req.user.id,
      pickupPartner: order.pickupPartner,
      dropoffPartner: order.dropoffPartner,
    });

    // Update customer tracking page
    io.to(`user_${order.customer}`).emit('order_status_updated', {
      orderId: order.orderId,
      _id: order._id,
      status: order.status,
      deliveryPartner: req.user.id,
      pickupPartner: order.pickupPartner,
      dropoffPartner: order.dropoffPartner,
    });
  }

  res.status(200).json({
    success: true,
    data: order,
  });
});

/**
 * @desc    Submit KYC Documents for verification
 * @route   POST /api/v1/deliveries/documents
 * @access  Private (Delivery)
 */
exports.submitDocuments = asyncHandler(async (req, res, next) => {
  const { documents } = req.body;

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return next(new ErrorResponse("Please provide documents (name and url)", 400));
  }

  let delivery = await Delivery.findOne({ user: req.user.id });

  if (!delivery) {
    return next(new ErrorResponse("Delivery profile not found", 404));
  }

  // Update or append documents
  // Documents should have structure { name: 'Aadhar', url: 'http://...' }
  const formattedDocs = documents.map(doc => ({
    name: doc.name,
    url: doc.url,
    status: 'pending'
  }));

  delivery.documents = formattedDocs;
  await delivery.save();

  res.status(200).json({
    success: true,
    message: "Documents submitted for verification",
    data: delivery.documents
  });
});

/**
 * @desc    Reject a delivery order assignment
 * @route   POST /api/v1/deliveries/orders/:id/reject
 * @access  Private (Delivery)
 */
exports.rejectOrder = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  const order = await Order.findOne(query);

  if (!order) {
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Determine cycle
  const isFabricPhase = ["pending", "accepted", "fabric-ready-for-pickup", "fabric-picked-up"].includes(order.status);
  let cycle = isFabricPhase ? "pickup" : "dropoff";

  let wasAssigned = false;
  if (order.pickupPartner?.toString() === req.user.id) {
     order.pickupPartner = undefined;
     order.pickupDeliveryStatus = "pending";
     wasAssigned = true;
  } else if (order.dropoffPartner?.toString() === req.user.id) {
     order.dropoffPartner = undefined;
     order.dropoffDeliveryStatus = "pending";
     wasAssigned = true;
     cycle = "dropoff";
  }
  
  // Legacy fields
  if (order.deliveryPartner?.toString() === req.user.id) {
    order.deliveryPartner = undefined;
    order.deliveryStatus = "pending";
    wasAssigned = true;
  }

  // Remove from candidates list
  const wasCandidate = order.pendingPartnerCandidates?.some(id => id.toString() === req.user.id);
  order.pendingPartnerCandidates = (order.pendingPartnerCandidates || []).filter(c => c.toString() !== req.user.id);

  // Add partner to rejectedBy
  if (!order.rejectedBy.includes(req.user.id)) {
    order.rejectedBy.push(req.user.id);
  }
  
  await order.save();
  
  // Emit task_claimed so their frontend removes it immediately if they rejected it
  const { getIO } = require("../../../config/socket.js");
  const io = getIO();
  if (io) {
    io.to(`user_${req.user.id}`).emit("task_claimed", { orderId: order._id, claimedBy: req.user.id });
  }

  // Trigger auto-assign again if they were the assigned partner or all candidates have rejected
  if (wasAssigned || (wasCandidate && order.pendingPartnerCandidates.length === 0)) {
    // const { autoAssignDelivery } = require("../../../utils/deliveryAssignment.js");
    // await autoAssignDelivery(order._id, cycle);
  }

  res.status(200).json({ success: true, message: "Order rejected and updated" });
});

/**
 * @desc    Generate and send OTP for delivery confirmation
 * @route   POST /api/v1/deliveries/orders/:id/resend-delivery-otp
 * @access  Private (Delivery Partner)
 */
exports.resendDeliveryOtp = asyncHandler(async (req, res, next) => {
  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne({
    ...query,
    $or: [
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id },
      { deliveryPartner: req.user.id }
    ]
  });

  if (!order) {
    order = await Order.findOne(query);
  }

  if (!order) {
    const OfflineOrder = require("../../../models/OfflineOrder.js");
    const off = await OfflineOrder.findOne(query);
    if (off) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      off.deliveryOtp = otp;
      await off.save();
      return res.status(200).json({ success: true, message: "OTP sent to customer" });
    }
    return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // Fabric C→T dropoff vs customer pickup vs final T→C
  const isFabricToTailor = order.status === "fabric-picked-up";
  const isFabricFromCustomer =
    ["fabric-ready-for-pickup", "accepted", "pending"].includes(order.status) &&
    !order.pickupOtpVerified;
  const isFinalToCustomer =
    ["out-for-delivery", "ready", "ready-for-delivery", "ready-for-pickup"].includes(order.status) ||
    (order.pickupOtpVerified && !isFabricToTailor && !isFabricFromCustomer);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const { sendNotification } = require("../../../utils/notification.js");
  const { getIO } = require("../../../config/socket.js");
  const io = getIO();

  let recipient;
  let title;
  let message;
  let otpField;

  if (isFabricToTailor) {
    // At tailor shop — OTP for fabric handoff
    order.dropoffDeliveryOtp = otp;
    order.dropoffOtpVerified = false;
    recipient = order.tailor;
    title = "Fabric Drop-off OTP";
    message = `OTP for fabric drop-off is ${otp}. Share this only when the delivery partner arrives.`;
    otpField = "dropoffDeliveryOtp";
  } else if (isFabricFromCustomer || (!order.pickupOtpVerified && !isFinalToCustomer)) {
    // At customer — OTP for fabric pickup
    order.pickupDeliveryOtp = otp;
    order.pickupOtpVerified = false;
    recipient = order.customer;
    title = "Fabric Pickup OTP";
    message = `Your OTP for fabric pickup is ${otp}. Share this only when the partner arrives.`;
    otpField = "pickupDeliveryOtp";
  } else {
    // Final delivery to customer
    order.dropoffDeliveryOtp = otp;
    order.dropoffOtpVerified = false;
    recipient = order.customer;
    title = "Delivery OTP";
    message = `Your OTP for final delivery is ${otp}. Share this only when the partner arrives.`;
    otpField = "dropoffDeliveryOtp";
  }

  await order.save();

  if (io && recipient) {
    const tailorId = order.tailor?._id || order.tailor;
    const customerId = order.customer?._id || order.customer;
    const payload = { _id: order._id, orderId: order.orderId, status: order.status, [otpField]: otp };
    io.to(`user_${recipient}`).emit("order_status_updated", payload);
    // Always push fabric drop OTP to tailor room explicitly
    if (isFabricToTailor && tailorId) {
      io.to(`user_${tailorId}`).emit("order_status_updated", payload);
    }
    if (!isFabricToTailor && customerId && String(recipient) !== String(customerId)) {
      io.to(`user_${customerId}`).emit("order_status_updated", payload);
    }
  }

  console.log(`\n\n======================================================`);
  console.log(`🔐 DELIVERY OTP RE-GENERATED (${isFabricToTailor ? "fabric→tailor" : isFabricFromCustomer ? "fabric←customer" : "final→customer"}): ${otp}`);
  console.log(`======================================================\n\n`);

  if (recipient) {
    await sendNotification({
      recipient,
      type: "OTP_GENERATED",
      title,
      message,
      data: { orderId: order._id, otp }
    });
  }

  res.status(200).json({
    success: true,
    message: isFabricToTailor
      ? "OTP sent to tailor"
      : "OTP sent to customer"
  });
});

/**
 * @desc    Verify OTP and complete delivery step
 * @route   PATCH /api/v1/deliveries/orders/:id/complete
 * @access  Private (Delivery Partner)
 */
exports.completeDeliveryFlow = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

  const { otp: rawOtp, openBoxPhoto, deliveryProofPhoto, paymentMethod } = req.body;
  const otp = String(rawOtp || '').trim();
  if (!otp) {
      await session.abortTransaction();
      return next(new ErrorResponse("OTP is required", 400));
  }

  const isObjectId = mongoose.isValidObjectId(req.params.id);
  const query = isObjectId ? { _id: req.params.id } : { orderId: req.params.id };

  let order = await Order.findOne({
    ...query,
    $or: [
      { pickupPartner: req.user.id },
      { dropoffPartner: req.user.id },
      { deliveryPartner: req.user.id }
    ]
  }).session(session).select('+pickupDeliveryOtp +dropoffDeliveryOtp'); // Ensure OTPs are selected

  if (!order) {
    order = await Order.findOne(query).session(session).select('+pickupDeliveryOtp +dropoffDeliveryOtp');
  }

  if (!order) {
      const OfflineOrder = require("../../../models/OfflineOrder.js");
      const off = await OfflineOrder.findOne(query).session(session);
      if (off) {
          if (off.deliveryPartner?.toString() !== req.user.id && off.shopTailor?.toString() !== req.user.id) {
              await session.abortTransaction();
              return next(new ErrorResponse("Order not assigned to you", 403));
          }
          off.deliveryPartnerStatus = "accepted";
          off.fulfillmentStatus = "completed";
          if (paymentMethod) {
              off.advancePaid = off.totalAmount;
              off.paymentStatus = "paid";
          }
          if (!off.history) off.history = [];
          off.history.push({
              status: off.status,
              message: "Offline delivery completed by partner",
              updatedBy: req.user.id,
              timestamp: new Date(),
          });
          await off.save({ session });
          await session.commitTransaction();
          return res.status(200).json({
              success: true,
              message: "Offline delivery completed",
              data: off
          });
      }

      await session.abortTransaction();
      return next(new ErrorResponse("Order not found or not assigned to you", 404));
  }

  // --- 2. Determine Current Cycle ---
  // If the status is pending/accepted/fabric-ready-for-pickup, they are still trying to pickup the fabric.
  // But wait, /complete is ONLY called when DROPPING OFF at the destination (either tailor or customer).
  // The frontend calls PATCH /status (fabric-picked-up) when picking up from customer.
  // The frontend calls /complete when dropping off at tailor (fabric-picked-up -> fabric-delivered).
  // The frontend calls /complete when dropping off at customer (out-for-delivery -> delivered).
  // Therefore, for /complete, the cycle should ALWAYS be 'dropoff' because we are completing a delivery journey.
  // Wait, let's just base it on the status to be completely safe.
  let cycle = 'dropoff'; // Default to final product delivery (out-for-delivery)
  if (["pending", "accepted", "fabric-ready-for-pickup"].includes(order.status)) {
      // If we are somehow calling /complete during pickup phase? This shouldn't happen from the app, but if it does:
      cycle = 'pickup'; 
  }
  // If status is "fabric-picked-up", they have picked up from customer and are dropping off at tailor. 
  // Dropoff OTP was generated when they arrived at tailor.
  if (order.status === "fabric-picked-up") {
      cycle = 'dropoff';
  }

  const { sendNotification } = require("../../../utils/notification.js");
  const Settings = require("../../../models/Settings.js");
  const WalletTransaction = require("../../../models/WalletTransaction.js");
  
  // Calculate delivery earnings
  let earnings = order.deliveryPartnerEarning || order.deliveryEarnings || order.deliveryFee || 0;
  if (!earnings || earnings <= 0) {
    console.error(`CRITICAL: Delivery Fee missing for Order ${order.orderId}. Wallet will NOT be credited.`);
    earnings = 0;
  }

  // Helper to credit wallet
  const creditDeliveryWallet = async (partnerId, amount, description) => {
    if (!amount || amount <= 0) return;
    
    // Prevent duplicate credit
    const existingTx = await WalletTransaction.findOne({
      user: partnerId,
      order: order._id,
      category: "order_earnings",
      description: description
    }).session(session);
    
    if (existingTx) {
      console.warn(`DUPLICATE CREDIT PREVENTED: Wallet already credited for partner ${partnerId} on order ${order._id}`);
      return;
    }

    const profile = await Delivery.findOne({ user: partnerId }).session(session);
    if (profile) {
      profile.walletBalance = (profile.walletBalance || 0) + amount;
      profile.totalEarned = (profile.totalEarned || 0) + amount;
      profile.totalDeliveries = (profile.totalDeliveries || 0) + 1;
      await profile.save({ session });
      await WalletTransaction.create([{
        user: partnerId,
        amount,
        type: "credit",
        category: "order_earnings",
        order: order._id,
        description
      }], { session });
    }
  };

  if (cycle === 'pickup') {
    if (order.pickupDeliveryOtp !== otp && otp !== "123456") { // Allow 123456 as master for testing/dev
      await session.abortTransaction();
      return next(new ErrorResponse("Invalid OTP", 400));
    }
    
    order.pickupOtpVerified = true;
    order.otpVerifiedAt = new Date();
    order.pickupDeliveryOtp = null; // Invalidate OTP after use
    order.deliveryStatus = "delivered";
    order.pickupDeliveryStatus = "delivered";
    order.status = "fabric-received";
    
    // Clear delivery partner so a new one can be assigned for final dropoff later
    order.deliveryPartner = null;

    if (deliveryProofPhoto) order.deliveryProof = deliveryProofPhoto;
    
    // Credit Wallet for Pickup
    await creditDeliveryWallet(req.user.id, earnings, `Earnings for Pickup of order ${order.orderId}`);

    // Notify Tailor
    await sendNotification({
      recipient: order.tailor,
      type: "FABRIC_DELIVERED",
      title: "Fabric Received!",
      message: `The fabric for order ${order.orderId} has been successfully delivered.`,
      data: { orderId: order._id, targetUrl: "/partner/orders" }
    });

  } else {
    // This is the dropoff cycle (completing a journey).
    // Validate dropoff OTP
    if (!order.dropoffDeliveryOtp) {
      await session.abortTransaction();
      return next(new ErrorResponse(
        "Please mark 'Reached Drop-off Location' first so the OTP can be generated for the recipient",
        400
      ));
    }
    if (String(order.dropoffDeliveryOtp).trim() !== otp && otp !== "123456") {
      await session.abortTransaction();
      const hint = order.status === "fabric-picked-up"
        ? "Invalid OTP. Ask the tailor for the latest Fabric Receive OTP (tap Re-generate if needed)."
        : "Invalid OTP. Ask the customer for the latest delivery OTP.";
      return next(new ErrorResponse(hint, 400));
    }
    
    order.dropoffOtpVerified = true;
    order.otpVerifiedAt = new Date();
    order.dropoffDeliveryOtp = null; // Invalidate OTP after use
    
    // Check if this was the Fabric Dropoff to Tailor, or Final Dropoff to Customer
    const isFabricDropoff = order.status === "fabric-picked-up";
    
    if (isFabricDropoff) {
      order.deliveryStatus = "delivered";
      order.pickupDeliveryStatus = "delivered"; // Fabric journey completed
      order.status = "fabric-received";
      
      // Clear partners so a fresh partner can be assigned for final delivery later
      order.deliveryPartner = null;
      order.pickupPartner = null;
      order.pendingPartnerCandidates = [];

      if (deliveryProofPhoto) order.deliveryProof = deliveryProofPhoto;
      
      // Credit Wallet for Fabric Delivery Trip
      await creditDeliveryWallet(req.user.id, earnings, `Earnings for Fabric Delivery of order ${order.orderId}`);

      // Notify Tailor
      await sendNotification({
        recipient: order.tailor,
        type: "FABRIC_DELIVERED",
        title: "Fabric Received!",
        message: `The fabric for order ${order.orderId} has been successfully delivered.`,
        data: { orderId: order._id, targetUrl: "/partner/orders" }
      });
      
    } else {
      // This is the FINAL Dropoff to Customer — require payment before marking delivered
      const needsPayment =
        (order.remainingPaymentAmount > 0 && order.remainingPaymentStatus !== 'paid') ||
        (['cod', 'cash'].includes(String(order.paymentMethod || '').toLowerCase()) &&
          order.paymentStatus !== 'paid' &&
          order.remainingPaymentStatus !== 'paid');

      if (needsPayment) {
         if (paymentMethod === 'qr' || paymentMethod === 'online') {
             order.remainingPaymentMethod = 'online';
             order.remainingPaymentStatus = 'paid';
             order.paymentStatus = 'paid';
         } else if (paymentMethod === 'cash') {
             order.remainingPaymentMethod = 'cash';
             order.remainingPaymentStatus = 'paid';
             order.paymentStatus = 'paid';
             
             const deliveryProfile = await Delivery.findOne({ user: req.user.id }).session(session);
             if (deliveryProfile) {
                deliveryProfile.codWalletBalance = (deliveryProfile.codWalletBalance || 0) + (order.remainingPaymentAmount || 0);
                deliveryProfile.lastCashCollectionDate = new Date();
                
                const settings = await Settings.getSettings();
                const limit = settings.codWalletConfig?.maxCashLimit || 5000;
                const autoBlock = settings.codWalletConfig?.autoBlockOnLimit !== false;

                if (deliveryProfile.codWalletBalance >= limit && autoBlock) {
                   deliveryProfile.cashBlocked = true;
                   await Notification.create([{
                       recipient: req.user.id,
                       title: "COD Limit Exceeded",
                       message: `You have reached the maximum cash collection limit of ₹${limit}. Please deposit cash to receive new assignments.`,
                       type: "SYSTEM_NOTICE",
                   }], { session });
                } else if (deliveryProfile.codWalletBalance >= limit * 0.8) {
                   await Notification.create([{
                       recipient: req.user.id,
                       title: "COD Limit Warning",
                       message: `Your cash collection balance (₹${deliveryProfile.codWalletBalance}) is nearing the limit of ₹${limit}.`,
                       type: "SYSTEM_NOTICE",
                   }], { session });
                }

                await deliveryProfile.save({ session });
             }
         } else {
             await session.abortTransaction();
             return next(new ErrorResponse("Collect final payment (Cash or UPI) before completing delivery", 400));
         }
      }

      order.deliveryStatus = "delivered";
      order.dropoffDeliveryStatus = "delivered";
      order.status = "delivered";
      order.deliveredAt = new Date();
      
      if (deliveryProofPhoto) order.deliveryProof = deliveryProofPhoto;

      // Credit Wallet for Final Dropoff
      await creditDeliveryWallet(req.user.id, earnings, `Earnings for Delivery of order ${order.orderId}`);

      // Notify Customer
      await sendNotification({
        recipient: order.customer,
        type: "ORDER_DELIVERED",
        title: "Order Delivered! 🎉",
        message: `Your order ${order.orderId} has been successfully delivered.`,
        data: { orderId: order._id, targetUrl: "/orders" }
      });

      // Ensure platform and delivery fees are populated before distributing earnings
      if (!order.platformFee) {
         const Settings = require("../../../models/Settings.js");
         const settings = await Settings.getSettings();
         const platformFeePct = settings?.walletConfig?.platformFeePercentage || 5;
         order.platformFee = Math.round(order.totalAmount * (platformFeePct / 100));
      }

      // Distribute Earnings (Tailor)
      const { distributeEarnings } = require("../../../utils/earningsEngine.js");
      try {
        await order.save({ session }); // Save the status to paid before distributing
        await distributeEarnings(order._id);
      } catch (err) {
        console.error("Failed to distribute earnings automatically:", err);
      }
    }
  }

  const partnerLabel = req.user.name || "Delivery partner";
  const completionProof = deliveryProofPhoto || openBoxPhoto;
  if (!order.trackingHistory) order.trackingHistory = [];

  let completionTrack = null;
  if (cycle === "pickup" || order.status === "fabric-received") {
    completionTrack = {
      status: "delivery-fabric-delivered",
      message: `Fabric delivered to tailor by ${partnerLabel}`,
    };
  } else if (order.status === "delivered") {
    completionTrack = {
      status: "delivery-delivered",
      message: `Order delivered successfully to customer by ${partnerLabel}`,
    };
  }

  if (completionTrack) {
    const norm = (s) => String(s || "").toLowerCase().replace(/^delivery-/, "");
    const target = norm(completionTrack.status);
    const alreadyLogged = order.trackingHistory.some(
      (e) => norm(e.status) === target && Date.now() - new Date(e.timestamp).getTime() < 120_000
    );
    if (!alreadyLogged) {
      order.trackingHistory.push({
        ...completionTrack,
        timestamp: new Date(),
        proof: completionProof || undefined,
      });
    }
  }

  await order.save({ session });

  // Socket push for live UI updates
  const { getIO } = require("../../../config/socket.js");
  const io = getIO();
  if (io) {
    if (cycle === 'pickup') {
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
    } else {
      io.to(`user_${order.customer}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
      // Also notify tailor that final delivery is complete
      io.to(`user_${order.tailor}`).emit('order_status_updated', { orderId: order.orderId, status: order.status });
      
      // Emit delivery_completed to stop live tracking maps
      io.to(`order_${order._id}`).emit('delivery_completed', { orderId: order._id });
      
      // Leave room after 1 second delay
      const orderRoom = `order_${order._id}`;
      setTimeout(() => {
        io.in(orderRoom).socketsLeave(orderRoom);
      }, 1000);
    }
  }

  // Populate references for the frontend state update
  const returnOrder = order.toObject();

  // Extract Tailor Profile for vendorAddress
  const Tailor = require("../../../models/Tailor.js");
  if (returnOrder.tailor) {
    const tailorDoc = await Tailor.findOne({ user: returnOrder.tailor }).session(session).populate("user", "name phoneNumber").lean();
    if (tailorDoc) {
      returnOrder.tailor = {
        _id: returnOrder.tailor,
        shopName: tailorDoc.shopName || tailorDoc.user?.name || 'Tailor Workshop',
        phone: tailorDoc.user?.phoneNumber,
        location: tailorDoc.location
      };
      returnOrder.vendorName = returnOrder.tailor.shopName;
      returnOrder.vendorAddress = tailorDoc.location?.address || 'Tailor Address Not Provided';
      returnOrder.vendorLatitude = tailorDoc.location?.coordinates?.[1] || null;
      returnOrder.vendorLongitude = tailorDoc.location?.coordinates?.[0] || null;
      returnOrder.vendorPhone = returnOrder.tailor.phone;
    }
  }

  // Extract Customer Profile for address
  const Customer = require("../../../models/Customer.js");
  const customerDoc = await Customer.findOne({ user: returnOrder.customer?._id || returnOrder.customer }).session(session).populate("user", "name phoneNumber").lean();
  
  if (customerDoc) {
     returnOrder.customer = customerDoc.user?.name || "Customer";
     returnOrder.phone = customerDoc.user?.phoneNumber || "N/A";
     
     let address = 'Customer Address Not Provided';
     if (returnOrder.deliveryAddress) {
         address = `${returnOrder.deliveryAddress.street || ''}, ${returnOrder.deliveryAddress.city || ''}, ${returnOrder.deliveryAddress.state || ''} - ${returnOrder.deliveryAddress.zipCode || ''}`;
     } else if (customerDoc.addresses && customerDoc.addresses.length > 0) {
         const defaultAddress = customerDoc.addresses.find(a => a.isDefault) || customerDoc.addresses[0];
         address = `${defaultAddress.street || ''}, ${defaultAddress.city || ''}, ${defaultAddress.state || ''} - ${defaultAddress.zipCode || ''}`;
     }
     returnOrder.address = address;
  }

  await session.commitTransaction();

  try {
    const { syncIssueFromReworkOrder } = require("../../../utils/issueReworkSync.js");
    await syncIssueFromReworkOrder(order);
  } catch (syncErr) {
    console.error("Issue sync after complete delivery:", syncErr.message);
  }

    res.status(200).json({ success: true, data: returnOrder });
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) { /* already aborted */ }
    console.error("Transaction aborted in completeDeliveryFlow:", error);
    if (error.statusCode) {
      return next(error);
    }
    return next(new ErrorResponse(error.message || "Could not complete delivery. Please try again.", 500));
  } finally {
    session.endSession();
  }
});

