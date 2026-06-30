const express = require("express");
const router = express.Router();
const {
  validateShipment,
  createShipment,
  generateAWBForOrder,
  schedulePickupForOrder,
  getLabel,
  webhookListener,
  createReturnShipment
} = require("../controllers/shiprocket.controller");

const { protect, authorize } = require("../../../middlewares/auth.middleware");

// Webhook (Public, but protected by signature in controller)
router.post("/webhook", webhookListener);

// Admin / Tailor protected routes
router.use(protect);

router.get("/validate/:orderId", authorize("admin", "tailor"), validateShipment);
router.post("/create-shipment/:orderId", authorize("admin", "tailor"), createShipment);
router.post("/generate-awb/:orderId", authorize("admin", "tailor"), generateAWBForOrder);
router.post("/schedule-pickup/:orderId", authorize("admin", "tailor"), schedulePickupForOrder);
router.get("/label/:orderId", authorize("admin", "tailor"), getLabel);
router.post("/create-return/:orderId", authorize("admin", "tailor"), createReturnShipment);

module.exports = router;
