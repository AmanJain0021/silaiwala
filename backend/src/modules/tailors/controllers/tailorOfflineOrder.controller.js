const OfflineOrder = require("../../../models/OfflineOrder.js");
const {
  OFFLINE_PIPELINE_STEPS,
  statusFilterValues,
} = require("../../../utils/offlineOrderStatus.js");
const { applyOfflineOrderStatusChange } = require("../../../services/offlineOrderStatus.service.js");

/**
 * @desc    Shop / walk-in orders assigned to this tailor
 * @route   GET /api/v1/tailors/offline-orders
 */
exports.getTailorOfflineOrders = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {
      source: "offline",
      shopTailor: req.user._id,
    };

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

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      OfflineOrder.find(query)
        .populate("offlineCustomer", "name phone")
        .sort("-createdAt")
        .limit(Number(limit))
        .skip(skip),
      OfflineOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      meta: { total, page: Number(page), limit: Number(limit), pipelineStatuses: OFFLINE_PIPELINE_STEPS },
    });
  } catch (error) {
    console.error("Error in getTailorOfflineOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update production status on assigned shop order
 * @route   PATCH /api/v1/tailors/offline-orders/:id/status
 */
exports.updateTailorOfflineOrderStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const order = await OfflineOrder.findOne({
      _id: req.params.id,
      source: "offline",
      shopTailor: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Shop order not found or not assigned to you",
      });
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

    const populated = await OfflineOrder.findById(order._id).populate(
      "offlineCustomer",
      "name phone"
    );

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error("Error in updateTailorOfflineOrderStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
