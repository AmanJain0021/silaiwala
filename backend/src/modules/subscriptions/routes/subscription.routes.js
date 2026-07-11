const express = require("express");
const { getPlans, subscribe, createSubscriptionOrder, getAllPlansAdmin, createPlan, updatePlan, deletePlan, togglePlanStatus } = require("../controllers/subscription.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

const router = express.Router();

// Public / Tailor routes
router.get("/", getPlans);
router.post("/create-order", protect, authorize("tailor"), createSubscriptionOrder);
router.post("/subscribe", protect, authorize("tailor"), subscribe);

// Admin routes
router.get("/admin", protect, authorize("admin"), getAllPlansAdmin);
router.post("/admin", protect, authorize("admin"), createPlan);
router.put("/admin/:id", protect, authorize("admin"), updatePlan);
router.delete("/admin/:id", protect, authorize("admin"), deletePlan);
router.patch("/admin/:id/toggle", protect, authorize("admin"), togglePlanStatus);

module.exports = router;
