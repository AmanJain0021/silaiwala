const express = require("express");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware.js");
const { getOfflineOrderByTrackingToken } = require("../controllers/offlineTrack.controller.js");

const router = express.Router();

router.get("/track/:token", publicLimiter, getOfflineOrderByTrackingToken);

module.exports = router;
