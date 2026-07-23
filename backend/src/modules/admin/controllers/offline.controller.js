const mongoose = require("mongoose");
const OfflineCustomer = require("../../../models/OfflineCustomer.js");
const OfflineOrder = require("../../../models/OfflineOrder.js");

const derivePaymentStatus = (totalAmount, advancePaid) => {
  const total = Number(totalAmount) || 0;
  const paid = Number(advancePaid) || 0;
  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
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
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
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
    const { name, phone, address, notes, shopTailor } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name and phone number are required",
      });
    }

    const customer = await OfflineCustomer.create({
      name: name.trim(),
      phone: String(phone).trim(),
      address: address?.trim() || "",
      notes: notes?.trim() || "",
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
    const allowed = ["name", "phone", "address", "notes", "shopTailor", "isActive"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
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
      limit = 50,
      page = 1,
    } = req.query;

    const query = { source: "offline" };
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (offlineCustomer) query.offlineCustomer = offlineCustomer;

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
    const order = await OfflineOrder.findById(req.params.id)
      .populate("offlineCustomer", "name phone address notes")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name");

    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

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
      measurements,
      measurementUnit,
      totalAmount,
      advancePaid = 0,
      status,
      notes,
      shopTailor,
    } = req.body;

    if (!offlineCustomer || !garmentType || totalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: "offlineCustomer, garmentType, and totalAmount are required",
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

    const amount = Number(totalAmount);
    const advance = Number(advancePaid) || 0;
    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ success: false, message: "Invalid totalAmount" });
    }
    if (advance < 0 || advance > amount) {
      return res.status(400).json({
        success: false,
        message: "advancePaid must be between 0 and totalAmount",
      });
    }

    const order = await OfflineOrder.create({
      offlineCustomer: customer._id,
      garmentType: garmentType.trim(),
      measurements: measurements || {},
      measurementUnit: measurementUnit || "inches",
      totalAmount: amount,
      advancePaid: advance,
      paymentStatus: derivePaymentStatus(amount, advance),
      status: status || "pending",
      notes: notes?.trim() || "",
      shopTailor: shopTailor || customer.shopTailor || undefined,
      createdBy: req.user._id,
      source: "offline",
      history: [
        {
          status: status || "pending",
          message: "Offline order created",
          updatedBy: req.user._id,
        },
      ],
    });

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber");

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
      measurements,
      measurementUnit,
      totalAmount,
      advancePaid,
      status,
      notes,
      shopTailor,
      message,
    } = req.body;

    const prevStatus = order.status;

    if (garmentType !== undefined) order.garmentType = garmentType.trim();
    if (measurements !== undefined) order.measurements = measurements;
    if (measurementUnit !== undefined) order.measurementUnit = measurementUnit;
    if (totalAmount !== undefined) order.totalAmount = Number(totalAmount);
    if (advancePaid !== undefined) order.advancePaid = Number(advancePaid);
    if (notes !== undefined) order.notes = notes.trim();
    if (shopTailor !== undefined) order.shopTailor = shopTailor || undefined;
    if (status !== undefined) order.status = status;

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
      totalAmount !== undefined ||
      message
    ) {
      order.history.push({
        status: order.status,
        message:
          message ||
          (status && status !== prevStatus
            ? `Status updated to ${order.status}`
            : "Order details updated"),
        updatedBy: req.user._id,
      });
    }

    await order.save();

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber")
      .populate("history.updatedBy", "name");

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

    const allowed = ["pending", "in_progress", "ready", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${allowed.join(", ")}`,
      });
    }

    const order = await OfflineOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Offline order not found" });
    }

    order.status = status;
    order.history.push({
      status,
      message: message || `Status updated to ${status}`,
      updatedBy: req.user._id,
    });
    await order.save();

    const populated = await OfflineOrder.findById(order._id)
      .populate("offlineCustomer", "name phone address")
      .populate("createdBy", "name")
      .populate("shopTailor", "name phoneNumber");

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in updateOfflineOrderStatus:", error);
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

    const statusCounts = {
      pending: 0,
      in_progress: 0,
      ready: 0,
      delivered: 0,
      cancelled: 0,
    };
    byStatus.forEach((row) => {
      statusCounts[row._id] = row.count;
    });

    const paymentCounts = { pending: 0, partial: 0, paid: 0 };
    byPayment.forEach((row) => {
      paymentCounts[row._id] = row.count;
    });

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
        paymentCounts,
        customerCount: await OfflineCustomer.countDocuments({ isActive: true }),
      },
    });
  } catch (error) {
    console.error("Error in getOfflineOrderStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
