const express = require("express");
const { 
  getTailors, 
  getTailorDetails, 
  getMyProfile, 
  updateProfile, 
  getDashboardData, 
  getEarningsData,
  getOrders,
  getDeliveryDetails,
  updateOrderStatus,
  updateDocuments,
  getMeasurementReport,
  sendMeasurementForConfirmation,
  updateMeasurementReport
} = require("../controllers/tailor.controller.js");
const {
  getMyWorkSamples,
  createWorkSample,
  updateWorkSample,
  deleteWorkSample,
  getTailorWorkSamples,
  getAllWorkSamples
} = require("../controllers/workSample.controller.js");
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getTailorFabrics
} = require("../controllers/tailorProduct.controller.js");
const {
  getMyServices,
  createService: createTailorService,
  updateService: updateTailorService,
  deleteService: deleteTailorService,
  getTailorServices
} = require("../controllers/tailorService.controller.js");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");
const { publicLimiter } = require("../../../middlewares/rateLimiter.middleware.js");

const router = express.Router();

// ─── PUBLIC LISTING ROUTE ───────────────────────────────────────────────────
router.get("/", publicLimiter, getTailors);

router.get("/:tailorId/fabrics", publicLimiter, getTailorFabrics);
router.get("/:tailorId/work-samples", publicLimiter, getTailorWorkSamples);
router.get("/:tailorId/services", publicLimiter, getTailorServices);
router.get("/work-samples/feed", publicLimiter, getAllWorkSamples);

// ─── PROTECTED TAILOR GET ROUTES (STATIC PATHS FIRST) ─────────────────────
// We need these BEFORE /:id to avoid shadowing, and we add protect manually
// so we can keep /:id public at the end.
router.get("/me", protect, authorize("tailor"), getMyProfile);
router.get("/dashboard", protect, authorize("tailor"), getDashboardData);
router.get("/earnings", protect, authorize("tailor"), getEarningsData);
router.get("/orders", protect, authorize("tailor"), getOrders);
router.get("/work-samples", protect, authorize("tailor"), getMyWorkSamples);
router.get("/products", protect, authorize("tailor"), getMyProducts);
router.get("/services", protect, authorize("tailor"), getMyServices);
router.get("/delivery-details", protect, authorize("tailor"), getDeliveryDetails);
const {
  getTailorOfflineOrders,
  updateTailorOfflineOrderStatus,
} = require("../controllers/tailorOfflineOrder.controller.js");
router.get("/offline-orders", protect, authorize("tailor"), getTailorOfflineOrders);

// ─── PUBLIC DETAILS ROUTE (DYNAMIC PATH) ────────────────────────────────────
// MUST come after static routes but BEFORE the global protect middleware below
router.get("/:id", publicLimiter, getTailorDetails);

// ─── OTHER PROTECTED TAILOR ACTIONS ──────────────────────────────────────────
router.use(protect, authorize("tailor"));

// COD Cash Deposit Routes
const {
  requestTailorCashDeposit,
  getTailorDepositHistory,
  createTailorRazorpayDepositOrder,
  verifyTailorRazorpayDeposit
} = require("../../deliveries/controllers/cashDeposit.controller.js");

router.post("/cod-deposit/request", requestTailorCashDeposit);
router.post("/cod-deposit/razorpay/create", createTailorRazorpayDepositOrder);
router.post("/cod-deposit/razorpay/verify", verifyTailorRazorpayDeposit);
router.get("/cod-deposit/history", getTailorDepositHistory);

router.patch("/profile", updateProfile);
router.patch("/documents", updateDocuments);
router.patch("/orders/:id/status", updateOrderStatus);
router.patch("/offline-orders/:id/status", updateTailorOfflineOrderStatus);
router.get("/orders/:id/measurement-report", getMeasurementReport);
router.put("/orders/:id/measurement-report", updateMeasurementReport);
router.post("/orders/:id/send-measurement-confirmation", sendMeasurementForConfirmation);

// Work Samples Actions
router.post("/work-samples", createWorkSample);
router.patch("/work-samples/:id", updateWorkSample);
router.delete("/work-samples/:id", deleteWorkSample);

// Fabric Products Actions
router.post("/products", createProduct);
router.patch("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Tailor Services Actions
router.post("/services", createTailorService);
router.patch("/services/:id", updateTailorService);
router.delete("/services/:id", deleteTailorService);

// Final fallback routes if any

module.exports = router;
