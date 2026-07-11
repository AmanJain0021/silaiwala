const express = require("express");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");

const {
  createBooking,
  getMyBookings,
  getAllBookings,
  assignTailor,
  getTailorBookings,
  updateBookingStatus,
} = require("../controllers/booking.controller.js");

const router = express.Router();

router.use(protect);

// Customer routes
router.post("/", authorize("customer", "admin"), createBooking);
router.get("/me", authorize("customer", "admin"), getMyBookings);

// Tailor routes
router.get("/tailor", authorize("tailor"), getTailorBookings);

// Admin routes
router.get("/", authorize("admin"), getAllBookings);
router.patch("/:id/assign", authorize("admin"), assignTailor);

// Tailor/Admin updates
router.patch("/:id/status", authorize("tailor", "admin"), updateBookingStatus);

module.exports = router;
