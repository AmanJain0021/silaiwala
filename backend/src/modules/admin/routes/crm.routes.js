const express = require("express");
const { getCRMDashboardData } = require("../controllers/crm.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "super_admin"));

router.get("/dashboard", getCRMDashboardData);

module.exports = router;
