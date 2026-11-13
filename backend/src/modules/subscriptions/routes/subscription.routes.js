const express = require("express");
const {
  getPlans,
  subscribe,
  createSubscriptionOrder,
  redeemWithPoints,
  getMyMembership,
  createCustomerSubscriptionOrder,
  subscribeCustomer,
  getSubscriptionConfig,
  updateSubscriptionConfig,
  getAllPlansAdmin,
  getSubscribedTailorsAdmin,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus,
} = require("../controllers/subscription.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

const router = express.Router();

// System Subscription Configuration (Master Toggles)
router.get("/config", getSubscriptionConfig);
router.put("/config", protect, authorize("admin"), updateSubscriptionConfig);

// Public / Tailor routes
router.get("/", getPlans);
router.post("/create-order", protect, authorize("tailor"), createSubscriptionOrder);
router.post("/subscribe", protect, authorize("tailor"), subscribe);

// Customer Membership routes
router.get("/my-membership", protect, authorize("customer"), getMyMembership);
router.post("/create-customer-order", protect, authorize("customer"), createCustomerSubscriptionOrder);
router.post("/subscribe-customer", protect, authorize("customer"), subscribeCustomer);
router.post("/redeem-with-points", protect, authorize("customer"), redeemWithPoints);

// Admin routes
router.get("/admin", protect, authorize("admin"), getAllPlansAdmin);
router.get("/admin/subscribers", protect, authorize("admin"), getSubscribedTailorsAdmin);
router.post("/admin", protect, authorize("admin"), createPlan);
router.put("/admin/:id", protect, authorize("admin"), updatePlan);
router.delete("/admin/:id", protect, authorize("admin"), deletePlan);
router.patch("/admin/:id/toggle", protect, authorize("admin"), togglePlanStatus);

module.exports = router;
