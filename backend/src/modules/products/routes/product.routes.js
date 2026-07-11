const express = require("express");
const router = express.Router();
const { getProducts, getProductDetails, getCategories, getFeaturedProducts } = require("../controllers/product.controller.js");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware.js");

router.get("/", publicLimiter, getProducts);
router.get("/featured", publicLimiter, getFeaturedProducts);
router.get("/categories", publicLimiter, getCategories);
router.get("/:id", publicLimiter, getProductDetails);

module.exports = router;
