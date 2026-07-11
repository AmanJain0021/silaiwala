const express = require("express");
const router = express.Router();
const {
  createBulkOrder,
  getMyBulkOrders,
  getAllBulkOrders,
  getBulkOrder,
  updateBulkOrderStatus,
} = require("../controllers/bulkOrder.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

// All routes require protection
router.use(protect);

// Customer & Admin routes
router.post("/", authorize("customer", "admin"), createBulkOrder);
router.get("/my", authorize("customer", "admin"), getMyBulkOrders);
router.get("/:id", authorize("customer", "admin", "tailor"), getBulkOrder);

// Admin-only routes
router.get("/", authorize("admin"), getAllBulkOrders);
router.put("/:id", authorize("admin"), updateBulkOrderStatus);

module.exports = router;
