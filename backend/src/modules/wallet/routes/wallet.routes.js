const express = require("express");
const {
  getWalletDashboard,
  requestWithdrawal,
  getAllWithdrawals,
  updateWithdrawalStatus
} = require("../controllers/wallet.controller");

const { protect, authorize } = require("../../../middleware/auth");

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Tailor & Delivery Partner Routes
router.get("/dashboard", authorize("tailor", "delivery", "measurement_executive"), getWalletDashboard);
router.post("/withdraw", authorize("tailor", "delivery", "measurement_executive"), requestWithdrawal);

// Admin Routes
router.get("/admin/withdrawals", authorize("admin"), getAllWithdrawals);
router.patch("/admin/withdrawals/:id", authorize("admin"), updateWithdrawalStatus);

module.exports = router;
