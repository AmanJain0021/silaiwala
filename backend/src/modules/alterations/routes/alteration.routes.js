const express = require("express");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

const {
  submitAlterationRequest,
  getAlterations,
  submitQuote,
  createRazorpayAlterationOrder,
  verifyAlterationPayment
} = require("../controllers/alteration.controller");

const router = express.Router();

// Apply auth middleware
router.use(protect);

// Customer endpoints
router.post("/request", authorize("customer", "admin"), submitAlterationRequest);
router.post("/:id/razorpay", authorize("customer", "admin"), createRazorpayAlterationOrder);
router.post("/:id/verify", authorize("customer", "admin"), verifyAlterationPayment);

// Tailor endpoints
router.patch("/:id/quote", authorize("tailor", "admin"), submitQuote);

// General endpoints
router.get("/", getAlterations);

module.exports = router;
