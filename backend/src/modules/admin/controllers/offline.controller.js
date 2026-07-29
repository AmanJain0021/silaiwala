const mongoose = require("mongoose");
const OfflineCustomer = require("../../../models/OfflineCustomer.js");
const OfflineOrder = require("../../../models/OfflineOrder.js");
const {
  DEFAULT_OFFLINE_PACKAGES,
  DEFAULT_GARMENT_TYPES,
} = require("../../../utils/offlinePackages.js");
const { ensureTrackingToken } = require("../../../utils/offlineTracking.js");
const {
  OFFLINE_PIPELINE_STEPS,
  isAllowedOfflineStatus,
  statusFilterValues,
  buildPipelineCounts,
  getOfflineStatusLabel,
} = require("../../../utils/offlineOrderStatus.js");
const { emitOfflineOrderStatusUpdate } = require("../../../utils/offlineOrderEvents.js");
const { applyOfflineOrderStatusChange } = require("../../../services/offlineOrderStatus.service.js");

const derivePaymentStatus = (totalAmount, advancePaid) => {
  const total = Number(totalAmount) || 0;
  const paid = Number(advancePaid) || 0;
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
};

const normalizePhone = (phone = "") => String(phone).replace(/[^\d]/g, "").slice(-10);

const computeOfflinePricing = ({
  stitchingCharges = 0,
  addOnsTotal = 0,
  deliveryFee = 0,
  discountType = "amount",
  discountValue = 0,
  totalAmount,
}) => {
  const base = Math.max(0, Number(stitchingCharges) || 0);
  const addons = Math.max(0, Number(addOnsTotal) || 0);
  const delivery = Math.max(0, Number(deliveryFee) || 0);
  const subtotal = base + addons + delivery;
  let discountAmount = 0;
  const rawDiscount = Math.max(0, Number(discountValue) || 0);

  if (discountType === "percent") {
    discountAmount = Math.round((subtotal * Math.min(rawDiscount, 100)) / 100);
  } else {
    discountAmount = Math.min(rawDiscount, subtotal);
  }

  const computedTotal = Math.max(0, subtotal - discountAmount);
  // Allow explicit total override from client only if provided and valid
  const finalTotal =
    totalAmount !== undefined && totalAmount !== null && !Number.isNaN(Number(totalAmount))
      ? Math.max(0, Number(totalAmount))
      : computedTotal;

  return {
    stitchingCharges: base,
    addOnsTotal: addons,
    deliveryFee: delivery,
    discountType: discountType === "percent" ? "percent" : "amount",
    discountValue: rawDiscount,
    discountAmount,
    totalAmount: finalTotal,
  };
};

const resolveFulfillmentFields = ({
  fulfillmentMethod,
  deliveryAddress,
  deliveryFee,
  deliveryNotes,
  customerAddress = "",
}) => {
  const method = fulfillmentMethod === "home_delivery" ? "home_delivery" : "pickup";
  const address =
    method === "home_delivery"
      ? String(deliveryAddress || customerAddress || "").trim()
      : "";
  return {
    fulfillmentMethod: method,
    deliveryAddress: address,
    deliveryFee: method === "home_delivery" ? Math.max(0, Number(deliveryFee) || 0) : 0,
    deliveryNotes: String(deliveryNotes || "").trim(),
    fulfillmentStatus: "pending",
  };
};

/**
 * @desc    Offline order form meta (packages + garment types)
 * @route   GET /api/v1/admin/offline-orders/meta
 */
exports.getOfflineOrderMeta = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        packages: DEFAULT_OFFLINE_PACKAGES,
        garmentTypes: DEFAULT_GARMENT_TYPES,
        pipelineStatuses: OFFLINE_PIPELINE_STEPS,
        terminalStatuses: ["delivered", "cancelled"],
      },
    });
  } catch (error) {
    console.error("Error in getOfflineOrderMeta:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Offline Customers ───────────────────────────────────────────────

/**
 * @desc    List offline customers (search by name/phone)
 * @route   GET /api/v1/admin/offline-customers
 */
exports.getOfflineCustomers = async (req, res) => {
  try {
    const { search, isActive, limit = 50, page = 1 } = req.query;
    const query = {};

    if (isActive === "true") query.isActive = true;
    if (isActive === "false") query.isActive = false;

    if (search) {
      const term = search.trim();
      const phoneTerm = normalizePhone(term);
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
        ...(phoneTerm ? [{ phoneNormalized: { $regex: phoneTerm, $options: "i" } }] : []),
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      OfflineCustomer.find(query)
        .populate("createdBy", "name")
        .populate("shopTailor", "name phoneNumber")
        .sort("-createdAt")
        .limit(Number(limit))
        .skip(skip)
        .lean(),
      OfflineCustomer.countDocuments(query),
    ]);

    const customerIds = customers.map((c) => c._id);
    const orderAgg = await OfflineOrder.aggregate([
      { $match: { offlineCustomer: { $in: customerIds } } },
      {
        $group: {
          _id: "$offlineCustomer",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          pendingBalance: {
            $sum: { $subtract: ["$totalAmount", "$advancePaid"] },
          },
        },
      },
    ]);

    const statsByCustomer = Object.fromEntries(
      orderAgg.map((row) => [row._id.toString(), row])
    );

    const data = customers.map((c) => {
      const stats = statsByCustomer[c._id.toString()] || {};
      return {
        ...c,
        orderCount: stats.orderCount || 0,
        totalSpent: stats.totalSpent || 0,
        pendingBalance: Math.max(0, stats.pendingBalance || 0),
      };
    });

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      data,
    });
  } catch (error) {
    console.error("Error in getOfflineCustomers:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Lookup offline customer by phone
 * @route   GET /api/v1/admin/offline-customers/lookup
 */
exports.lookupOfflineCustomerByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: "phone query is required",
      });
    }

    const customer = await OfflineCustomer.findOne({
      $or: [
        { phoneNormalized: normalized },
        { phone: { $regex: normalized, $options: "i" } },
      ],
    })
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .sort("-createdAt");

    if (!customer) {
      return res.status(200).json({
        success: true,
        found: false,
        data: null,
      });
    }

    const orders = await OfflineOrder.find({ offlineCustomer: customer._id })
      .sort("-createdAt")
      .lean();

    const totalSpent = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingBalance = orders.reduce(
      (acc, o) => acc + Math.max(0, (o.totalAmount || 0) - (o.advancePaid || 0)),
      0
    );

    return res.status(200).json({
      success: true,
      found: true,
      data: {
        customer,
        stats: {
          orderCount: orders.length,
          totalSpent,
          pendingBalance,
        },
      },
    });
  } catch (error) {
    console.error("Error in lookupOfflineCustomerByPhone:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get offline customer + order history
 * @route   GET /api/v1/admin/offline-customers/:id
 */
exports.getOfflineCustomerById = async (req, res) => {
  try {
    const customer = await OfflineCustomer.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber");

    if (!customer) {
      return res.status(404).json({ success: false, message: "Offline customer not found" });
    }

    const orders = await OfflineOrder.find({ offlineCustomer: customer._id })
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .sort("-createdAt");

    const totalSpent = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const pendingBalance = orders.reduce(
      (acc, o) => acc + Math.max(0, (o.totalAmount || 0) - (o.advancePaid || 0)),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        customer,
        orders,
        savedMeasurements: customer.savedMeasurements || [],
        stats: {
          orderCount: orders.length,
          totalSpent,
          pendingBalance,
        },
      },
    });
  } catch (error) {
    console.error("Error in getOfflineCustomerById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create offline customer
 * @route   POST /api/v1/admin/offline-customers
 */
exports.createOfflineCustomer = async (req, res) => {
  try {
    const { name, phone, address, notes, shopTailor, savedMeasurements } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    const customer = await OfflineCustomer.create({
      name: name.trim(),
      phone: String(phone).trim(),
      phoneNormalized: normalizedPhone,
      address: address?.trim() || "",
      notes: notes?.trim() || "",
      savedMeasurements: Array.isArray(savedMeasurements) ? savedMeasurements : [],
      shopTailor: shopTailor || undefined,
      createdBy: req.user._id,
      source: "offline",
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error in createOfflineCustomer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update offline customer
 * @route   PUT /api/v1/admin/offline-customers/:id
 */
exports.updateOfflineCustomer = async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "address",
      "notes",
      "shopTailor",
      "isActive",
      "savedMeasurements",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.phone !== undefined) {
      const normalizedPhone = normalizePhone(updates.phone);
      if (!normalizedPhone || normalizedPhone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number",
        });
      }
      updates.phoneNormalized = normalizedPhone;
    }

    const customer = await OfflineCustomer.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber");

    if (!customer) {
      return res.status(404).json({ success: false, message: "Offline customer not found" });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    console.error("Error in updateOfflineCustomer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft-deactivate offline customer (keeps order history)
 * @route   DELETE /api/v1/admin/offline-customers/:id
 */
exports.deleteOfflineCustomer = async (req, res) => {
  try {
    const customer = await OfflineCustomer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: "Offline customer not found" });
    }

    res.status(200).json({
      success: true,
      message: "Offline customer deactivated",
      data: customer,
    });
  } catch (error) {
    console.error("Error in deleteOfflineCustomer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Offline Orders ──────────────────────────────────────────────────

/**
 * @desc    List offline orders
 * @route   GET /api/v1/admin/offline-orders
 */
exports.getOfflineOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      offlineCustomer,
      search,
      fulfillmentMethod,
      pendingFulfillment,
      limit = 50,
      page = 1,
    } = req.query;

    const query = { source: "offline" };
    if (status) {
      const filterValues = statusFilterValues(status);
      if (filterValues?.$nin) {
        query.status = filterValues;
      } else if (filterValues?.length === 1) {
        query.status = filterValues[0];
      } else if (filterValues?.length > 1) {
        query.status = { $in: filterValues };
      }
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (offlineCustomer) query.offlineCustomer = offlineCustomer;
    if (fulfillmentMethod === "pickup" || fulfillmentMethod === "home_delivery") {
      query.fulfillmentMethod = fulfillmentMethod;
    }
    if (pendingFulfillment === "true") {
      query.status = "ready";
      query.fulfillmentStatus = { $in: ["awaiting_pickup", "out_for_delivery", "pending"] };
    }

    if (search) {
      const term = search.trim();
      const matchingCustomers = await OfflineCustomer.find({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { phone: { $regex: term, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { orderId: { $regex: term, $options: "i" } },
        { garmentType: { $regex: term, $options: "i" } },
        { offlineCustomer: { $in: matchingCustomers.map((c) => c._id) } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      OfflineOrder.find(query)
        .populate("offlineCustomer", "name phone address")
        .populate("deliveryPartner", "name phoneNumber email vehicleNumber")
        .populate("createdBy", "name")
        .populate("shopTailor", "name phoneNumber")
        .sort("-createdAt")
        .limit(Number(limit))
        .skip(skip),
      OfflineOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  } catch (error) {
    console.error("Error in getOfflineOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single offline order
 * @route   GET /api/v1/admin/offline-orders/:id
 */
exports.getOfflineOrderById = async (req, res) => {
  try {
    let order = await OfflineOrder.findById(req.params.id)
      .populate("offlineCustomer", "name phone address notes savedMeasurements")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name")
      .populate("styleAddons.addon", "name category price image");

    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    await ensureTrackingToken(order);
    order = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address notes savedMeasurements")
      .populate("deliveryPartner", "name phoneNumber email vehicleNumber")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name")
      .populate("styleAddons.addon", "name category price image");

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error in getOfflineOrderById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create offline order against an offline customer
 * @route   POST /api/v1/admin/offline-orders
 */
exports.createOfflineOrder = async (req, res) => {
  try {
    const {
      offlineCustomer,
      garmentType,
      stitchingPackage = "basic",
      stitchingCharges,
      fabricSource = "customer",
      measurements,
      measurementUnit,
      measurementPhotos,
      savedMeasurementLabel,
      styleAddons,
      customizations,
      addOnsTotal,
      discountType,
      discountValue,
      totalAmount,
      advancePaid = 0,
      status,
      priority = "normal",
      notes,
      expectedCompletionDate,
      shopTailor,
      fulfillmentMethod = "pickup",
      deliveryAddress,
      deliveryFee,
      deliveryNotes,
    } = req.body;

    if (!offlineCustomer || !garmentType) {
      return res.status(400).json({
        success: false,
        message: "offlineCustomer and garmentType are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(offlineCustomer)) {
      return res.status(400).json({ success: false, message: "Invalid offline customer id" });
    }

    const customer = await OfflineCustomer.findById(offlineCustomer);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Offline customer not found" });
    }
    if (!customer.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot create order for a deactivated offline customer",
      });
    }

    const fulfillment = resolveFulfillmentFields({
      fulfillmentMethod,
      deliveryAddress,
      deliveryFee,
      deliveryNotes,
      customerAddress: customer.address,
    });

    if (fulfillment.fulfillmentMethod === "home_delivery" && !fulfillment.deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "deliveryAddress is required for home delivery",
      });
    }

    const pkg = DEFAULT_OFFLINE_PACKAGES.find((p) => p.id === stitchingPackage);
    const resolvedStitching =
      stitchingCharges !== undefined && stitchingCharges !== null && stitchingCharges !== ""
        ? Number(stitchingCharges)
        : pkg?.defaultPrice || 0;

    const pricing = computeOfflinePricing({
      stitchingCharges: resolvedStitching,
      addOnsTotal,
      deliveryFee: fulfillment.deliveryFee,
      discountType,
      discountValue,
      totalAmount,
    });

    const advance = Number(advancePaid) || 0;
    if (advance < 0 || advance > pricing.totalAmount) {
      return res.status(400).json({
        success: false,
        message: "advancePaid must be between 0 and totalAmount",
      });
    }

    const order = await OfflineOrder.create({
      offlineCustomer: customer._id,
      garmentType: garmentType.trim(),
      stitchingPackage: pkg?.id || "basic",
      stitchingCharges: pricing.stitchingCharges,
      fabricSource: fabricSource === "sewzella" ? "sewzella" : "customer",
      measurements: measurements || {},
      measurementUnit: measurementUnit || "inches",
      measurementPhotos: Array.isArray(measurementPhotos) ? measurementPhotos : [],
      savedMeasurementLabel: savedMeasurementLabel?.trim() || "",
      styleAddons: Array.isArray(styleAddons) ? styleAddons : [],
      customizations: customizations || {},
      addOnsTotal: pricing.addOnsTotal,
      discountType: pricing.discountType,
      discountValue: pricing.discountValue,
      discountAmount: pricing.discountAmount,
      totalAmount: pricing.totalAmount,
      advancePaid: advance,
      paymentStatus: derivePaymentStatus(pricing.totalAmount, advance),
      status: status && isAllowedOfflineStatus(status) ? status : "accepted",
      priority: priority === "urgent" ? "urgent" : "normal",
      fulfillmentMethod: fulfillment.fulfillmentMethod,
      deliveryAddress: fulfillment.deliveryAddress,
      deliveryFee: pricing.deliveryFee,
      deliveryNotes: fulfillment.deliveryNotes,
      fulfillmentStatus: fulfillment.fulfillmentStatus,
      notes: notes?.trim() || "",
      expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : undefined,
      shopTailor: shopTailor || customer.shopTailor || undefined,
      createdBy: req.user._id,
      source: "offline",
      isOffline: true,
      history: [
        {
          status: status && isAllowedOfflineStatus(status) ? status : "accepted",
          message: `Offline order created · ${
            fulfillment.fulfillmentMethod === "home_delivery" ? "Home delivery" : "Customer pickup"
          }`,
          updatedBy: req.user._id,
        },
      ],
    });

    emitOfflineOrderStatusUpdate(order);

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("styleAddons.addon", "name category price image");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in createOfflineOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update offline order (details / payment / status)
 * @route   PUT /api/v1/admin/offline-orders/:id
 */
exports.updateOfflineOrder = async (req, res) => {
  try {
    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    const {
      garmentType,
      stitchingPackage,
      stitchingCharges,
      fabricSource,
      measurements,
      measurementUnit,
      measurementPhotos,
      savedMeasurementLabel,
      styleAddons,
      customizations,
      addOnsTotal,
      discountType,
      discountValue,
      totalAmount,
      advancePaid,
      status,
      priority,
      notes,
      expectedCompletionDate,
      shopTailor,
      message,
      fulfillmentMethod,
      deliveryAddress,
      deliveryFee,
      deliveryNotes,
    } = req.body;

    const prevStatus = order.status;

    if (garmentType !== undefined) order.garmentType = garmentType.trim();
    if (stitchingPackage !== undefined) order.stitchingPackage = stitchingPackage;
    if (fabricSource !== undefined) {
      order.fabricSource = fabricSource === "sewzella" ? "sewzella" : "customer";
    }
    if (measurements !== undefined) order.measurements = measurements;
    if (measurementUnit !== undefined) order.measurementUnit = measurementUnit;
    if (measurementPhotos !== undefined) order.measurementPhotos = measurementPhotos;
    if (savedMeasurementLabel !== undefined) {
      order.savedMeasurementLabel = savedMeasurementLabel.trim();
    }
    if (styleAddons !== undefined) order.styleAddons = styleAddons;
    if (customizations !== undefined) order.customizations = customizations;
    if (priority !== undefined) {
      order.priority = priority === "urgent" ? "urgent" : "normal";
    }
    if (notes !== undefined) order.notes = notes.trim();
    if (expectedCompletionDate !== undefined) {
      order.expectedCompletionDate = expectedCompletionDate ? new Date(expectedCompletionDate) : null;
    }
    if (shopTailor !== undefined) order.shopTailor = shopTailor || undefined;
    if (status !== undefined) {
      if (!isAllowedOfflineStatus(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid offline order status",
        });
      }
      order.status = status;
    }

    if (fulfillmentMethod !== undefined) {
      order.fulfillmentMethod =
        fulfillmentMethod === "home_delivery" ? "home_delivery" : "pickup";
      if (order.fulfillmentMethod === "pickup") {
        order.deliveryAddress = "";
        order.deliveryFee = 0;
        if (order.fulfillmentStatus === "out_for_delivery") {
          order.fulfillmentStatus = order.status === "ready" ? "awaiting_pickup" : "pending";
        }
      }
    }
    if (deliveryAddress !== undefined) order.deliveryAddress = String(deliveryAddress).trim();
    if (deliveryNotes !== undefined) order.deliveryNotes = String(deliveryNotes).trim();
    if (deliveryFee !== undefined) order.deliveryFee = Math.max(0, Number(deliveryFee) || 0);

    if (order.fulfillmentMethod === "home_delivery" && !order.deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "deliveryAddress is required for home delivery",
      });
    }

    const pricingTouched =
      stitchingCharges !== undefined ||
      addOnsTotal !== undefined ||
      deliveryFee !== undefined ||
      fulfillmentMethod !== undefined ||
      discountType !== undefined ||
      discountValue !== undefined ||
      totalAmount !== undefined;

    if (pricingTouched) {
      const pricing = computeOfflinePricing({
        stitchingCharges:
          stitchingCharges !== undefined ? stitchingCharges : order.stitchingCharges,
        addOnsTotal: addOnsTotal !== undefined ? addOnsTotal : order.addOnsTotal,
        deliveryFee: order.fulfillmentMethod === "home_delivery" ? order.deliveryFee : 0,
        discountType: discountType !== undefined ? discountType : order.discountType,
        discountValue: discountValue !== undefined ? discountValue : order.discountValue,
        totalAmount,
      });
      order.stitchingCharges = pricing.stitchingCharges;
      order.addOnsTotal = pricing.addOnsTotal;
      order.deliveryFee = pricing.deliveryFee;
      order.discountType = pricing.discountType;
      order.discountValue = pricing.discountValue;
      order.discountAmount = pricing.discountAmount;
      order.totalAmount = pricing.totalAmount;
    }

    if (advancePaid !== undefined) order.advancePaid = Number(advancePaid);

    if ((order.advancePaid || 0) > (order.totalAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: "advancePaid cannot exceed totalAmount",
      });
    }

    order.syncPaymentStatus();

    if (
      status !== undefined ||
      advancePaid !== undefined ||
      pricingTouched ||
      fulfillmentMethod !== undefined ||
      deliveryAddress !== undefined ||
      message
    ) {
      order.history.push({
        status: order.status,
        message:
          message ||
          (status && status !== prevStatus
            ? `Status updated to ${getOfflineStatusLabel(order.status)}`
            : "Order details updated"),
        updatedBy: req.user._id,
      });
    }

    await order.save();

    if (status !== undefined && status !== prevStatus) {
      emitOfflineOrderStatusUpdate(order);
    }

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name")
      .populate("styleAddons.addon", "name category price image");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in updateOfflineOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update offline order status only
 * @route   PATCH /api/v1/admin/offline-orders/:id/status
 */
exports.updateOfflineOrderStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    try {
      await applyOfflineOrderStatusChange(order, {
        status,
        message,
        updatedBy: req.user._id,
      });
    } catch (err) {
      if (err.statusCode === 400) {
        return res.status(400).json({ success: false, message: err.message });
      }
      throw err;
    }

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in updateOfflineOrderStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Mark home-delivery order as out for delivery (shop staff / future partner bridge)
 * @route   PATCH /api/v1/admin/offline-orders/:id/out-for-delivery
 */
exports.markOfflineOrderOutForDelivery = async (req, res) => {
  try {
    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }
    if (order.fulfillmentMethod !== "home_delivery") {
      return res.status(400).json({
        success: false,
        message: "Only home delivery orders can be marked out for delivery",
      });
    }
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update fulfillment on a closed order",
      });
    }
    if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Order must be Ready before going out for delivery",
      });
    }

    order.fulfillmentStatus = "out_for_delivery";
    order.outForDeliveryAt = new Date();
    order.history.push({
      status: order.status,
      message: req.body.message || "Out for home delivery",
      updatedBy: req.user._id,
    });
    await order.save();
    emitOfflineOrderStatusUpdate(order);

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("shopTailor", "name phoneNumber");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in markOfflineOrderOutForDelivery:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Complete offline order — collect balance, handoff, optional rating + save measurements
 * @route   POST /api/v1/admin/offline-orders/:id/complete
 */
exports.completeOfflineOrder = async (req, res) => {
  try {
    const {
      amountReceived,
      collectFullBalance = true,
      customerRating,
      customerReview,
      saveMeasurements = true,
      savedMeasurementLabel,
      message,
    } = req.body;

    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }
    if (order.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot complete a cancelled order" });
    }
    if (order.status === "delivered") {
      return res.status(400).json({ success: false, message: "Order already completed" });
    }

    if (order.fulfillmentMethod === "home_delivery") {
      if (order.status !== "ready" && order.fulfillmentStatus !== "out_for_delivery") {
        return res.status(400).json({
          success: false,
          message: "Home delivery order must be Ready (or out for delivery) before completion",
        });
      }
    } else if (order.status !== "ready") {
      return res.status(400).json({
        success: false,
        message: "Order must be Ready for pickup before completion",
      });
    }

    const balanceDue = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0));
    let paidNow = 0;
    if (amountReceived !== undefined && amountReceived !== null && amountReceived !== "") {
      paidNow = Math.max(0, Number(amountReceived) || 0);
    } else if (collectFullBalance) {
      paidNow = balanceDue;
    }

    if (paidNow > balanceDue + 0.01) {
      return res.status(400).json({
        success: false,
        message: "amountReceived cannot exceed balance due",
      });
    }

    order.advancePaid = Math.min(
      order.totalAmount || 0,
      (order.advancePaid || 0) + paidNow
    );
    order.syncPaymentStatus();

    if (customerRating !== undefined && customerRating !== null && customerRating !== "") {
      const rating = Number(customerRating);
      if (rating < 1 || rating > 5 || Number.isNaN(rating)) {
        return res.status(400).json({
          success: false,
          message: "customerRating must be between 1 and 5",
        });
      }
      order.customerRating = rating;
    }
    if (customerReview !== undefined) {
      order.customerReview = String(customerReview).trim();
    }

    const handoffLabel =
      order.fulfillmentMethod === "home_delivery" ? "Delivered to customer" : "Customer picked up";

    order.status = "delivered";
    order.fulfillmentStatus = "completed";
    order.deliveredAt = new Date();
    if (order.fulfillmentMethod === "pickup") {
      order.pickedUpAt = order.deliveredAt;
    }

    order.history.push({
      status: "delivered",
      message:
        message ||
        `${handoffLabel}${paidNow > 0 ? ` · ₹${paidNow} collected` : ""}`,
      updatedBy: req.user._id,
    });

    // Persist measurements on OfflineCustomer for future walk-ins
    let measurementsSaved = false;
    if (saveMeasurements) {
      const measurementsObj =
        order.measurements instanceof Map
          ? Object.fromEntries(order.measurements)
          : order.measurements || {};
      const hasMeasurements = Object.keys(measurementsObj).length > 0;
      if (hasMeasurements) {
        const customer = await OfflineCustomer.findById(order.offlineCustomer);
        if (customer) {
          const label =
            (savedMeasurementLabel || order.savedMeasurementLabel || order.garmentType || "Saved").trim();
          customer.savedMeasurements = customer.savedMeasurements || [];
          customer.savedMeasurements.push({
            label,
            garmentType: order.garmentType,
            measurements: measurementsObj,
            unit: order.measurementUnit || "inches",
            notes: "",
            createdAt: new Date(),
          });
          await customer.save();
          order.measurementsSavedOnComplete = true;
          measurementsSaved = true;
        }
      }
    }

    await order.save();
    emitOfflineOrderStatusUpdate(order);

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address savedMeasurements")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name");

    res.status(200).json({
      success: true,
      data: populated,
      meta: { amountCollected: paidNow, measurementsSaved },
    });
  } catch (error) {
    console.error("Error in completeOfflineOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Offline Stats (separate from online revenue) ────────────────────

/**
 * @desc    Offline revenue & status summary — never mixed with online Order totals
 * @route   GET /api/v1/admin/offline-orders/stats
 */
exports.getOfflineOrderStats = async (req, res) => {
  try {
    const [summary] = await OfflineOrder.aggregate([
      { $match: { source: "offline", status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$advancePaid" },
          pendingPayments: {
            $sum: { $subtract: ["$totalAmount", "$advancePaid"] },
          },
        },
      },
    ]);

    const byStatus = await OfflineOrder.aggregate([
      { $match: { source: "offline" } },
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
    ]);

    const byPayment = await OfflineOrder.aggregate([
      { $match: { source: "offline", status: { $ne: "cancelled" } } },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
    ]);

    const deliveredRevenue = await OfflineOrder.aggregate([
      { $match: { source: "offline", status: "delivered" } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = {};
    byStatus.forEach((row) => {
      statusCounts[row._id] = row.count;
    });
    const pipelineCounts = buildPipelineCounts(byStatus);

    const paymentCounts = { pending: 0, partial: 0, paid: 0 };
    byPayment.forEach((row) => {
      paymentCounts[row._id] = row.count;
    });

    const [pendingPickup, pendingHomeDelivery] = await Promise.all([
      OfflineOrder.countDocuments({
        source: "offline",
        status: "ready",
        fulfillmentMethod: "pickup",
        fulfillmentStatus: { $ne: "completed" },
      }),
      OfflineOrder.countDocuments({
        source: "offline",
        status: "ready",
        fulfillmentMethod: "home_delivery",
        fulfillmentStatus: { $in: ["pending", "awaiting_pickup", "out_for_delivery"] },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders: summary?.totalOrders || 0,
        totalRevenue: summary?.totalRevenue || 0,
        totalCollected: summary?.totalCollected || 0,
        pendingPayments: Math.max(0, summary?.pendingPayments || 0),
        deliveredRevenue: deliveredRevenue[0]?.revenue || 0,
        deliveredCount: deliveredRevenue[0]?.count || 0,
        statusCounts,
        pipelineCounts,
        paymentCounts,
        pendingPickup,
        pendingHomeDelivery,
        pendingFulfillment: pendingPickup + pendingHomeDelivery,
        customerCount: await OfflineCustomer.countDocuments({ isActive: true }),
      },
    });
  } catch (error) {
    console.error("Error in getOfflineOrderStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Assign delivery partner to an offline order
 * @route   PATCH /api/v1/admin/offline-orders/:id/assign-delivery
 */
exports.assignDeliveryPartner = async (req, res) => {
  try {
    const { deliveryPartnerId, pickupAddress, pickupCoordinates } = req.body;
    if (!deliveryPartnerId) {
      return res.status(400).json({ success: false, message: "Delivery partner ID is required" });
    }

    const User = require("../../../models/User.js");
    const partner = await User.findOne({ _id: deliveryPartnerId, role: "delivery" });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Delivery partner not found or invalid role" });
    }

    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    if (pickupAddress && String(pickupAddress).trim()) {
      order.pickupAddress = String(pickupAddress).trim();
    }
    if (pickupCoordinates) {
      const lat = pickupCoordinates.lat !== undefined ? Number(pickupCoordinates.lat) : Number(pickupCoordinates[1]);
      const lng = pickupCoordinates.lng !== undefined ? Number(pickupCoordinates.lng) : Number(pickupCoordinates[0]);
      if (!isNaN(lat) && !isNaN(lng)) {
        order.pickupLocation = { type: "Point", coordinates: [lng, lat] };
      }
    }

    order.deliveryPartner = deliveryPartnerId;
    order.deliveryPartnerStatus = "requested";
    order.fulfillmentMethod = "home_delivery";
    order.fulfillmentStatus = "pending";

    const partnerLabel = partner.name || partner.phoneNumber || "Delivery Partner";
    order.history.push({
      status: order.status,
      message: `Sent delivery request to ${partnerLabel}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await order.save();

    const updated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address notes savedMeasurements")
      .populate("deliveryPartner", "name phoneNumber email vehicleNumber")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name")
      .populate("styleAddons.addon", "name category price image");

    try {
      const io = req.app.get("io");
      if (io) {
        io.to(deliveryPartnerId.toString()).emit("admin_task_assigned", {
          _id: updated._id,
          orderId: updated.orderId,
          isOffline: true,
          taskType: "offline-order-delivery",
          message: `Admin assigned offline order ${updated.orderId} to you.`,
        });
        io.to(deliveryPartnerId.toString()).emit("new_notification", {
          type: "TASK_ASSIGNED",
          title: "New Offline Delivery Request",
          message: `Admin assigned offline order ${updated.orderId} to you.`,
          data: { orderId: updated._id, isOffline: true },
        });
      }
    } catch (e) {
      console.warn("Socket notification failed:", e.message);
    }

    res.status(200).json({
      success: true,
      message: `Delivery request sent to ${partnerLabel}`,
      data: updated,
    });
  } catch (error) {
    console.error("Error in assignDeliveryPartner:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel delivery request for an offline order
 * @route   PATCH /api/v1/admin/offline-orders/:id/cancel-delivery-request
 */
exports.cancelDeliveryRequest = async (req, res) => {
  try {
    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    order.deliveryPartner = null;
    order.deliveryPartnerStatus = "none";
    order.history.push({
      status: order.status,
      message: "Cancelled delivery request",
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await order.save();

    const updated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address notes savedMeasurements")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name")
      .populate("styleAddons.addon", "name category price image");

    res.status(200).json({
      success: true,
      message: "Delivery request cancelled",
      data: updated,
    });
  } catch (error) {
    console.error("Error in cancelDeliveryRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
