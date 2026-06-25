const express = require("express");
const { protect, authorize } = require("../../../middlewares/auth.middleware");
const {
  submitCustomDesignRequest,
  getCustomDesigns,
  submitQuote,
  createRazorpayCustomDesignOrder,
  verifyCustomDesignPayment,
} = require("../controllers/customDesign.controller");

const router = express.Router();

router.use(protect);

router.post("/request", authorize("customer"), submitCustomDesignRequest);
router.get("/", authorize("customer", "tailor", "admin"), getCustomDesigns);
router.patch("/:id/quote", authorize("tailor", "admin"), submitQuote);
router.post("/:id/razorpay", authorize("customer"), createRazorpayCustomDesignOrder);
router.post("/:id/verify", authorize("customer"), verifyCustomDesignPayment);

module.exports = router;
