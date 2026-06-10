const express = require("express");
const router = express.Router();
const {
  getMyProfile,
  getDashboardStats,
  updateProfile,
  updateStatus,
  getAssignedOrders,
  getAvailableOrders,
  getOrderById,
  acceptOrder,
  updateDeliveryStatus,
  submitDocuments,
  rejectOrder,
  resendDeliveryOtp,
  completeDeliveryFlow,
  requestPayout,
  getPayouts,
} = require("../controllers/delivery.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

// All routes are protected and for delivery partners only
router.use(protect);
router.use(authorize("delivery"));

router.get("/me", getMyProfile);
router.get("/stats", getDashboardStats);
router.patch("/profile", updateProfile);
router.patch("/status", updateStatus);
router.get("/orders", getAssignedOrders);
router.get("/orders/:id", getOrderById);
router.get("/available-orders", getAvailableOrders);
router.post("/orders/:id/accept", acceptOrder);
router.post("/orders/:id/reject", rejectOrder);
router.patch("/orders/:id/status", updateDeliveryStatus);
router.post("/orders/:id/resend-delivery-otp", resendDeliveryOtp);
router.patch("/orders/:id/complete", completeDeliveryFlow);
router.post("/documents", submitDocuments);
router.post("/payouts/request", requestPayout);
router.get("/payouts", getPayouts);

module.exports = router;
