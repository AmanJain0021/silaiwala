const express = require("express");
const router = express.Router();
const { 
  getWalletDashboard, 
  getUserTransactions,
  requestWithdrawal,
  getAllWithdrawals,
  updateWithdrawalStatus
} = require("./controllers/wallet.controller.js");

const { protect, authorize } = require("../../middlewares/auth.middleware.js");

router.use(protect);

// Admin Routes (Needs to be defined before parameterized routes to avoid conflicts, though none here right now)
router.get("/admin/withdrawals", authorize("admin"), getAllWithdrawals);
router.patch("/admin/withdrawals/:id", authorize("admin"), updateWithdrawalStatus);

// Tailor & Delivery & Customer Routes
router.get("/dashboard", authorize("tailor", "delivery", "user", "customer", "measurement_executive"), getWalletDashboard);
router.get("/transactions", authorize("tailor", "delivery", "user", "customer", "measurement_executive"), getUserTransactions);
router.post("/withdraw", authorize("tailor", "delivery", "user", "customer", "measurement_executive"), requestWithdrawal);

module.exports = router;
