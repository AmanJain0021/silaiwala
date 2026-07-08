const express = require("express");
const { getCRMDashboardData } = require("../controllers/crm.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "super_admin"));

router.get("/dashboard", getCRMDashboardData);

module.exports = router;
