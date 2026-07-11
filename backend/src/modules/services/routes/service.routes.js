const express = require("express");
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/service.controller.js");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware.js");

const router = express.Router();

// Public routes
router.get("/", publicLimiter, getServices);
router.get("/:id", publicLimiter, getServiceById);

// Protected routes (Admin role should be added in real scenario)
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

module.exports = router;
