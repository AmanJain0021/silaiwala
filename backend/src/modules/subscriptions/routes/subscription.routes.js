const express = require("express");
const { getPlans, subscribe } = require("../controllers/subscription.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", getPlans);
router.post("/subscribe", protect, authorize("tailor"), subscribe);

module.exports = router;
