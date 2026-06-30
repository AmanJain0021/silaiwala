const express = require("express");
const router = express.Router();
const { createOrder, getMyOrders, getOrderDetails, createRazorpayOrder, verifyPayment, changeTailorRequest, updateDeliveryPreference, approveMeasurements, requestMeasurementRevision, requestExchange, updateExchangeStatus } = require("../controllers/order.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

router.use(protect);

router.post("/razorpay/create", authorize("customer", "admin", "delivery", "tailor"), createRazorpayOrder);
router.post("/razorpay/verify", authorize("customer", "admin", "delivery", "tailor"), verifyPayment);
router.post("/:id/delivery-preference", authorize("customer", "admin"), updateDeliveryPreference);
router.post("/:id/measurements/approve", authorize("customer", "admin"), approveMeasurements);
router.post("/:id/measurements/request-revision", authorize("customer", "admin"), requestMeasurementRevision);
router.post("/", authorize("customer", "admin", "delivery", "tailor"), createOrder);
router.get("/my-orders", authorize("customer", "delivery", "tailor", "admin"), getMyOrders);
router.patch("/:id/change-tailor", authorize("customer"), changeTailorRequest);
router.get("/:id", getOrderDetails);
router.get("/:id/measurements", authorize("customer", "admin"), require("../controllers/order.controller").getMeasurementReportForCustomer);

// Exchange Routes
router.post("/:id/exchange", authorize("customer"), requestExchange);
router.patch("/:id/exchange/status", authorize("tailor", "admin"), updateExchangeStatus);

module.exports = router;
