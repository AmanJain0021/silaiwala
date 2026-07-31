const express = require("express");
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetails, createRazorpayOrder, verifyPayment, changeTailorRequest, updateDeliveryPreference, approveMeasurements, requestMeasurementRevision, requestExchange, updateExchangeStatus, calculatePriceSummary, updateOrderStatus } = require("../controllers/order.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

router.use(protect);

router.post("/price-summary", authorize("customer", "admin"), calculatePriceSummary);
router.post("/razorpay/create", authorize("customer", "admin", "delivery", "tailor"), createRazorpayOrder);
router.post("/razorpay/verify", authorize("customer", "admin", "delivery", "tailor"), verifyPayment);
router.post("/:id/delivery-preference", authorize("customer", "admin"), updateDeliveryPreference);
router.post("/:id/customer-location", authorize("customer"), require("../controllers/order.controller.js").broadcastCustomerLocation);
router.post("/:id/tailor-location", authorize("tailor"), require("../controllers/order.controller.js").broadcastTailorLocation);
router.patch("/:id/tailor-complete-delivery", authorize("tailor"), require("../controllers/order.controller.js").completeTailorSelfDelivery);
router.post("/:id/measurements/approve", authorize("customer", "admin"), approveMeasurements);
router.post("/:id/measurements/request-revision", authorize("customer", "admin"), requestMeasurementRevision);
router.post("/", authorize("customer", "admin", "delivery", "tailor"), createOrder);
router.get("/my-orders", authorize("customer", "delivery", "tailor", "admin"), getMyOrders);
router.patch("/:id/change-tailor", authorize("customer"), changeTailorRequest);
router.patch("/:id/status", authorize("customer"), updateOrderStatus);
const { getOrderChat, sendChatMessage, getUnreadChatCounts } = require("../controllers/chat.controller.js");
router.get("/chats/unread", authorize("customer", "tailor"), getUnreadChatCounts);
router.get("/:id", getOrderDetails);
router.get("/:id/measurements", authorize("customer", "admin"), require("../controllers/order.controller.js").getMeasurementReportForCustomer);

// Exchange Routes
router.post("/:id/exchange", authorize("customer"), requestExchange);
router.patch("/:id/exchange/status", authorize("tailor", "admin"), updateExchangeStatus);

// Chat Routes
router.get("/:id/chat", authorize("customer", "tailor"), getOrderChat);
router.post("/:id/chat", authorize("customer", "tailor"), sendChatMessage);

module.exports = router;
