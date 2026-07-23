const Order = require("../../../models/Order.js");
const OfflineOrder = require("../../../models/OfflineOrder.js");
const OfflineCustomer = require("../../../models/OfflineCustomer.js");

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const resolveDateRange = (query = {}) => {
  const now = new Date();
  let from;
  let to = endOfDay(now);

  if (query.from && query.to) {
    from = startOfDay(new Date(query.from));
    to = endOfDay(new Date(query.to));
  } else {
    switch (query.range) {
      case "today":
        from = startOfDay(now);
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        from = startOfDay(y);
        to = endOfDay(y);
        break;
      }
      case "last_7_days":
      case "last_7":
        from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
        break;
      case "last_30_days":
      case "last_30":
        from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
        break;
      case "this_month":
      default:
        from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
    }
  }

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    const err = new Error("Invalid date range");
    err.statusCode = 400;
    throw err;
  }

  return { from, to };
};

const offlineInRange = (from, to) => ({
  source: "offline",
  createdAt: { $gte: from, $lte: to },
});

/**
 * @desc    Offline vs online comparison + analytics bundle for admin
 * @route   GET /api/v1/admin/offline-reports/summary
 */
exports.getOfflineReportsSummary = async (req, res) => {
  try {
    const { from, to } = resolveDateRange(req.query);
    const offlineMatch = offlineInRange(from, to);
    const onlineMatch = {
      createdAt: { $gte: from, $lte: to },
      status: { $ne: "cancelled" },
    };

    const [
      offlineAgg,
      onlineAgg,
      offlineByDay,
      onlineByDay,
      byGarment,
      byPackage,
      byTailor,
      pendingFulfillment,
      cashByDay,
      completedTurnaround,
      topCustomers,
    ] = await Promise.all([
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            collected: { $sum: "$advancePaid" },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: onlineMatch },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            collected: { $sum: "$advancePaid" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: onlineMatch },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$garmentType",
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { orders: -1 } },
        { $limit: 12 },
      ]),
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$stitchingPackage",
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { orders: -1 } },
      ]),
      OfflineOrder.aggregate([
        {
          $match: {
            ...offlineMatch,
            status: { $ne: "cancelled" },
            shopTailor: { $ne: null },
          },
        },
        {
          $group: {
            _id: "$shopTailor",
            orders: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            avgTurnaroundMs: {
              $avg: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$status", "delivered"] },
                      { $ne: ["$deliveredAt", null] },
                    ],
                  },
                  { $subtract: ["$deliveredAt", "$createdAt"] },
                  null,
                ],
              },
            },
          },
        },
        { $sort: { delivered: -1, orders: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "tailor",
          },
        },
        {
          $project: {
            orders: 1,
            revenue: 1,
            delivered: 1,
            avgTurnaroundHours: {
              $cond: [
                { $gt: ["$avgTurnaroundMs", 0] },
                { $divide: ["$avgTurnaroundMs", 1000 * 60 * 60] },
                null,
              ],
            },
            tailorName: { $arrayElemAt: ["$tailor.name", 0] },
            tailorPhone: { $arrayElemAt: ["$tailor.phoneNumber", 0] },
          },
        },
      ]),
      OfflineOrder.find({
        source: "offline",
        status: "ready",
        fulfillmentStatus: { $in: ["pending", "awaiting_pickup", "out_for_delivery"] },
      })
        .populate("offlineCustomer", "name phone")
        .populate("shopTailor", "name phoneNumber")
        .sort("-updatedAt")
        .limit(50)
        .lean(),
      // Daily cash/manual collections — offline has no Razorpay; advancePaid is shop-collected
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" }, advancePaid: { $gt: 0 } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            collected: { $sum: "$advancePaid" },
            orderValue: { $sum: "$totalAmount" },
            balanceDue: {
              $sum: { $subtract: ["$totalAmount", "$advancePaid"] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      OfflineOrder.aggregate([
        {
          $match: {
            source: "offline",
            status: "delivered",
            deliveredAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: null,
            completed: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
            collected: { $sum: "$advancePaid" },
            avgTurnaroundMs: { $avg: { $subtract: ["$deliveredAt", "$createdAt"] } },
          },
        },
      ]),
      OfflineOrder.aggregate([
        { $match: { ...offlineMatch, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$offlineCustomer",
            orders: { $sum: 1 },
            spent: { $sum: "$totalAmount" },
            collected: { $sum: "$advancePaid" },
          },
        },
        { $sort: { spent: -1 } },
        { $limit: 15 },
        {
          $lookup: {
            from: "offlinecustomers",
            localField: "_id",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $project: {
            orders: 1,
            spent: 1,
            collected: 1,
            name: { $arrayElemAt: ["$customer.name", 0] },
            phone: { $arrayElemAt: ["$customer.phone", 0] },
          },
        },
      ]),
    ]);

    const off = offlineAgg[0] || { orders: 0, revenue: 0, collected: 0, delivered: 0 };
    const on = onlineAgg[0] || { orders: 0, revenue: 0 };
    const completed = completedTurnaround[0] || {
      completed: 0,
      revenue: 0,
      collected: 0,
      avgTurnaroundMs: null,
    };

    const customerCount = await OfflineCustomer.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      data: {
        range: { from, to },
        // Side-by-side only — never summed into one "platform total"
        comparison: {
          offline: {
            orders: off.orders,
            revenue: off.revenue,
            collected: off.collected,
            pendingBalance: Math.max(0, off.revenue - off.collected),
            delivered: off.delivered,
          },
          online: {
            orders: on.orders,
            revenue: on.revenue,
          },
        },
        trends: {
          offlineByDay,
          onlineByDay,
        },
        // TODO: Offline orders have no gstAmount — GST/invoice report deferred until confirmed
        gst: {
          available: false,
          message:
            "Offline orders do not store GST fields. Online GST remains under Finance → GST. Confirm if walk-in GST should be added before building an offline invoice report.",
        },
        cashCollection: {
          // Assumed shop-counter / manual collection (no Razorpay on OfflineOrder)
          note: "Walk-in collections recorded as advancePaid (manual/cash at shop).",
          byDay: cashByDay,
          totalCollected: cashByDay.reduce((s, r) => s + (r.collected || 0), 0),
        },
        tailorProductivity: byTailor.map((t) => ({
          tailorId: t._id,
          name: t.tailorName || "Unknown",
          phone: t.tailorPhone || "",
          orders: t.orders,
          delivered: t.delivered,
          revenue: t.revenue,
          avgTurnaroundHours:
            t.avgTurnaroundHours != null ? Math.round(t.avgTurnaroundHours * 10) / 10 : null,
        })),
        pendingFulfillment: pendingFulfillment.map((o) => ({
          _id: o._id,
          orderId: o.orderId,
          garmentType: o.garmentType,
          status: o.status,
          fulfillmentMethod: o.fulfillmentMethod || "pickup",
          fulfillmentStatus: o.fulfillmentStatus,
          totalAmount: o.totalAmount,
          advancePaid: o.advancePaid,
          balanceDue: Math.max(0, (o.totalAmount || 0) - (o.advancePaid || 0)),
          customerName: o.offlineCustomer?.name,
          customerPhone: o.offlineCustomer?.phone,
          tailorName: o.shopTailor?.name,
          deliveryAddress: o.deliveryAddress || "",
          updatedAt: o.updatedAt,
        })),
        analytics: {
          byGarmentType: byGarment.map((g) => ({
            garmentType: g._id || "Unknown",
            orders: g.orders,
            revenue: g.revenue,
          })),
          byPackage: byPackage.map((p) => ({
            package: p._id || "basic",
            orders: p.orders,
            revenue: p.revenue,
          })),
          completedInRange: {
            count: completed.completed,
            revenue: completed.revenue,
            collected: completed.collected,
            avgTurnaroundHours:
              completed.avgTurnaroundMs != null
                ? Math.round((completed.avgTurnaroundMs / (1000 * 60 * 60)) * 10) / 10
                : null,
          },
          topCustomers,
          activeOfflineCustomers: customerCount,
        },
      },
    });
  } catch (error) {
    console.error("Error in getOfflineReportsSummary:", error);
    const status = error.statusCode || 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Per-customer offline order history (reports deep-link)
 * @route   GET /api/v1/admin/offline-reports/customer/:id
 */
exports.getOfflineCustomerReport = async (req, res) => {
  try {
    const customer = await OfflineCustomer.findById(req.params.id).lean();
    if (!customer) {
      return res.status(404).json({ success: false, message: "Offline customer not found" });
    }

    const orders = await OfflineOrder.find({
      source: "offline",
      offlineCustomer: customer._id,
    })
      .populate("shopTailor", "name")
      .sort("-createdAt")
      .lean();

    const totals = orders.reduce(
      (acc, o) => {
        if (o.status !== "cancelled") {
          acc.orders += 1;
          acc.revenue += o.totalAmount || 0;
          acc.collected += o.advancePaid || 0;
        }
        if (o.status === "delivered") acc.delivered += 1;
        return acc;
      },
      { orders: 0, revenue: 0, collected: 0, delivered: 0 }
    );

    res.status(200).json({
      success: true,
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          savedMeasurementsCount: (customer.savedMeasurements || []).length,
        },
        totals: {
          ...totals,
          pendingBalance: Math.max(0, totals.revenue - totals.collected),
        },
        orders: orders.map((o) => ({
          _id: o._id,
          orderId: o.orderId,
          garmentType: o.garmentType,
          stitchingPackage: o.stitchingPackage,
          status: o.status,
          fulfillmentMethod: o.fulfillmentMethod,
          totalAmount: o.totalAmount,
          advancePaid: o.advancePaid,
          tailorName: o.shopTailor?.name,
          createdAt: o.createdAt,
          deliveredAt: o.deliveredAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error in getOfflineCustomerReport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
