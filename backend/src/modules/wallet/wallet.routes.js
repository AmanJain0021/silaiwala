const express = require("express");
const router = express.Router();
const { 
  getWalletDashboard, 
  requestWithdrawal,
  getAllWithdrawals,
  updateWithdrawalStatus
} = require("./controllers/wallet.controller");

const { protect, authorize } = require("../../middlewares/auth.middleware");

router.use(protect);

// Admin Routes (Needs to be defined before parameterized routes to avoid conflicts, though none here right now)
router.get("/admin/withdrawals", authorize("admin"), getAllWithdrawals);
router.patch("/admin/withdrawals/:id", authorize("admin"), updateWithdrawalStatus);

// Tailor & Delivery & Customer Routes
router.get("/dashboard", authorize("tailor", "delivery", "user", "customer", "measurement_executive"), getWalletDashboard);
router.post("/withdraw", authorize("tailor", "delivery", "user", "customer", "measurement_executive"), requestWithdrawal);

module.exports = router;
