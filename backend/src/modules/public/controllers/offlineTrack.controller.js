const OfflineOrder = require("../../../models/OfflineOrder.js");
const { getOfflineStatusLabel, OFFLINE_PIPELINE_STEPS, pipelineStepIndex } = require("../../../utils/offlineOrderStatus.js");

const formatStatus = (status) => getOfflineStatusLabel(status);

/**
 * @desc    Public offline order status by tracking token (no auth)
 * @route   GET /api/v1/public/offline-orders/track/:token
 */
exports.getOfflineOrderByTrackingToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 16) {
      return res.status(400).json({ success: false, message: "Invalid tracking token" });
    }

    const order = await OfflineOrder.findOne({
      trackingToken: token,
      source: "offline",
    })
      .populate("offlineCustomer", "name phone")
      .select(
        "orderId garmentType status paymentStatus totalAmount advancePaid stitchingPackage priority fabricSource fulfillmentMethod deliveryAddress deliveryFee fulfillmentStatus createdAt updatedAt deliveredAt pickedUpAt outForDeliveryAt history trackingToken"
      )
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const balanceDue = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0));

    const history = (order.history || []).map((h) => ({
      status: h.status,
      message: h.message,
      timestamp: h.timestamp,
      label: formatStatus(h.status),
    }));

    const currentStep = pipelineStepIndex(order.status);
    const pipeline = OFFLINE_PIPELINE_STEPS.map((step, idx) => ({
      value: step.value,
      label: step.label,
      state:
        order.status === "cancelled"
          ? "cancelled"
          : idx < currentStep
            ? "done"
            : idx === currentStep
              ? "current"
              : "upcoming",
    }));

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        garmentType: order.garmentType,
        stitchingPackage: order.stitchingPackage,
        fabricSource: order.fabricSource,
        priority: order.priority,
        status: order.status,
        statusLabel: formatStatus(order.status),
        fulfillmentMethod: order.fulfillmentMethod || "pickup",
        fulfillmentStatus: order.fulfillmentStatus || "pending",
        deliveryAddress: order.deliveryAddress || "",
        deliveryFee: order.deliveryFee || 0,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        advancePaid: order.advancePaid,
        balanceDue,
        customerName: order.offlineCustomer?.name || "Customer",
        customerPhone: order.offlineCustomer?.phone
          ? order.offlineCustomer.phone.replace(/\d(?=\d{4})/g, "*")
          : "",
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        deliveredAt: order.deliveredAt,
        history,
        pipeline,
      },
    });
  } catch (error) {
    console.error("Error in getOfflineOrderByTrackingToken:", error);
    res.status(500).json({ success: false, message: "Unable to load order status" });
  }
};
