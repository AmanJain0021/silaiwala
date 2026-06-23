const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  updateLocation,
  toggleAvailability,
  getMyRequests,
  getRequestDetail,
  acceptRequest,
  rejectRequest,
  generateOTP,
  verifyOTP,
  uploadMeasurement,
  completeMeasurement,
  getAllExecutives,
  updateExecutiveStatus,
  getAllRequests,
  adminAssignExecutive,
  getDashboardStats,
} = require("../controllers/measurementExecutive.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

// All routes require authentication
router.use(protect);

// ── Executive Routes ─────────────────────────────────────────────────────────
router.get(
  "/profile",
  authorize("measurement_executive", "admin"),
  getProfile
);
router.put(
  "/profile",
  authorize("measurement_executive"),
  updateProfile
);
router.put(
  "/location",
  authorize("measurement_executive"),
  updateLocation
);
router.put(
  "/availability",
  authorize("measurement_executive"),
  toggleAvailability
);
router.get(
  "/dashboard",
  authorize("measurement_executive"),
  getDashboardStats
);

// ── Request Routes ───────────────────────────────────────────────────────────
router.get(
  "/requests",
  authorize("measurement_executive", "admin"),
  getMyRequests
);
router.get(
  "/requests/:id",
  authorize("measurement_executive", "admin"),
  getRequestDetail
);
router.put(
  "/requests/:id/accept",
  authorize("measurement_executive"),
  acceptRequest
);
router.put(
  "/requests/:id/reject",
  authorize("measurement_executive"),
  rejectRequest
);

// ── OTP Routes ───────────────────────────────────────────────────────────────
router.post(
  "/requests/:id/generate-otp",
  authorize("measurement_executive"),
  generateOTP
);
router.post(
  "/requests/:id/verify-otp",
  authorize("measurement_executive"),
  verifyOTP
);

// ── Upload Routes ────────────────────────────────────────────────────────────
router.post(
  "/requests/:id/upload",
  authorize("measurement_executive"),
  uploadMeasurement
);
router.put(
  "/requests/:id/complete",
  authorize("measurement_executive"),
  completeMeasurement
);

// ── Admin Routes ─────────────────────────────────────────────────────────────
router.get("/admin/executives", authorize("admin"), getAllExecutives);
router.put(
  "/admin/executives/:id/status",
  authorize("admin"),
  updateExecutiveStatus
);
router.get("/admin/requests", authorize("admin"), getAllRequests);
router.put(
  "/admin/requests/:id/assign",
  authorize("admin"),
  adminAssignExecutive
);

module.exports = router;
