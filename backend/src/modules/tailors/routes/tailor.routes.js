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
  withdrawFunds,
  updateDocuments
} = require("../controllers/tailor.controller");
const {
  getMyWorkSamples,
  createWorkSample,
  updateWorkSample,
  deleteWorkSample,
  getTailorWorkSamples,
  getAllWorkSamples
} = require("../controllers/workSample.controller");
const {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getTailorFabrics
} = require("../controllers/tailorProduct.controller");
const {
  getMyServices,
  createService: createTailorService,
  updateService: updateTailorService,
  deleteService: deleteTailorService,
  getTailorServices
} = require("../controllers/tailorService.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

const router = express.Router();

// ─── PUBLIC LISTING ROUTE ───────────────────────────────────────────────────
router.get("/", getTailors);

router.get("/:tailorId/fabrics", getTailorFabrics);
router.get("/:tailorId/work-samples", getTailorWorkSamples);
router.get("/:tailorId/services", getTailorServices);
router.get("/work-samples/feed", getAllWorkSamples);

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

// ─── PUBLIC DETAILS ROUTE (DYNAMIC PATH) ────────────────────────────────────
// MUST come after static routes but BEFORE the global protect middleware below
router.get("/:id", getTailorDetails);

// ─── OTHER PROTECTED TAILOR ACTIONS ──────────────────────────────────────────
router.use(protect, authorize("tailor"));

router.patch("/profile", updateProfile);
router.patch("/documents", updateDocuments);
router.post("/withdraw", withdrawFunds);
router.patch("/orders/:id/status", updateOrderStatus);

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
