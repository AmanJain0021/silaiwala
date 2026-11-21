const express = require("express");
const { getActiveBanners, getCMSContent, getCMSContentBySlug, getSettings, getLandingCategories } = require("../controllers/cms.controller.js");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware.js");

const router = express.Router();

// Public routes for Customer/Tailor portals
router.get("/settings", publicLimiter, getSettings);
router.get("/banners/active", publicLimiter, getActiveBanners);
router.get("/landing-categories", publicLimiter, getLandingCategories);
router.get("/content", publicLimiter, getCMSContent);
router.get("/content/:slug", publicLimiter, getCMSContentBySlug);

module.exports = router;
