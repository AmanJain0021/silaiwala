const express = require("express");
const { getActiveBanners, getCMSContent, getCMSContentBySlug, getSettings } = require("../controllers/cms.controller");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware");

const router = express.Router();

// Public routes for Customer/Tailor portals
router.get("/settings", publicLimiter, getSettings);
router.get("/banners/active", publicLimiter, getActiveBanners);
router.get("/content", publicLimiter, getCMSContent);
router.get("/content/:slug", publicLimiter, getCMSContentBySlug);

module.exports = router;
