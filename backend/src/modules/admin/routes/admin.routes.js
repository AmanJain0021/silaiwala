const express = require("express");
const { protect, authorize } = require("../../../middlewares/auth.middleware.js");
const upload = require("../../../middlewares/upload.middleware.js");
const { uploadLimiter } = require("../../../middlewares/rateLimiter.middleware.js");
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getDeliveryPartners,
  getPendingTailors,
  getTailorById,
  approveTailor,
  rejectTailor,
  updateTailorCommission,
  getDeliveryStats,
  getPendingDeliveryPartners,
  approveDeliveryPartner,
  rejectDeliveryPartner,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  createBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
  sendBroadcastNotification,
  getNotificationLogs,
  getAllCMSContent,
  createCMSContent,
  updateCMSContent,
  deleteCMSContent,
  uploadImage,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAllPayouts,
  updatePayoutStatus,
  getSettings,
  updateSettings,
  generateReport,
  updateTailorShiprocketLocation,
  retryShiprocketSetup,
  getShiprocketShipments,
  getPendingServices,
  approveServiceStatus,
  rejectServiceStatus,
  getPendingProducts,
  approveProductStatus,
  rejectProductStatus,
} = require("../controllers/admin.controller.js");

const {
  getFinanceDashboard,
  getFinancialStats,
  getTransactions,
  getOrderFinancials,
  getGSTReport,
  getTailorEarnings,
  getDeliveryEarnings,
  getWalletAudit,
  getPaymentLedger,
} = require("../controllers/finance.controller.js");

const {
  getAllDepositHistory,
  updateDepositStatus,
  updateCodSettings
} = require("../../deliveries/controllers/cashDeposit.controller.js");

const {
  getOfflineCustomers,
  getOfflineCustomerById,
  createOfflineCustomer,
  updateOfflineCustomer,
  deleteOfflineCustomer,
  getOfflineOrders,
  getOfflineOrderById,
  createOfflineOrder,
  updateOfflineOrder,
  updateOfflineOrderStatus,
  getOfflineOrderStats,
} = require("../controllers/offline.controller.js");

const router = express.Router();
const crmRoutes = require("./crm.routes.js");

// Apply auth middleware to ALL routes
router.use(protect);
router.use(authorize("admin", "super_admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// CRM Dashboard
router.use("/crm", crmRoutes);

// User Management
router.get("/users", getAllUsers);
router.get("/delivery-partners", getDeliveryPartners);
router.put("/users/:id/status", updateUserStatus);

// Tailor Approvals
router.get("/tailors/pending", getPendingTailors);
router.get("/tailors/:id", getTailorById);
router.put("/tailors/:id/approve", approveTailor);
router.put("/tailors/:id/reject", rejectTailor);
router.put("/tailors/:id/commission", updateTailorCommission);
router.put("/tailors/:id/shiprocket-location", updateTailorShiprocketLocation);
router.post("/tailors/:id/shiprocket-setup", retryShiprocketSetup);
// Tailor Service Approvals
router.get("/tailors/services/pending", getPendingServices);
router.patch("/tailors/services/:id/approve", approveServiceStatus);
router.patch("/tailors/services/:id/reject", rejectServiceStatus);
router.get("/tailors/products/pending", getPendingProducts);
router.patch("/tailors/products/:id/approve", approveProductStatus);
router.patch("/tailors/products/:id/reject", rejectProductStatus);

// Delivery Partner Approvals
router.get("/delivery-partners/stats", getDeliveryStats);
router.get("/delivery-partners/pending", getPendingDeliveryPartners);
router.put("/delivery-partners/:id/approve", approveDeliveryPartner);
router.delete("/delivery-partners/:id/reject", rejectDeliveryPartner);

// Delivery Partner COD
router.get("/deliveries/cod-deposit", getAllDepositHistory);
router.post("/deliveries/:id/cod-deposit/status", updateDepositStatus);

// Orders (online marketplace — unchanged)
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);

// Offline Customers (walk-in / admin-only — separate from User/Customer)
router.get("/offline-customers", getOfflineCustomers);
router.post("/offline-customers", createOfflineCustomer);
router.get("/offline-customers/:id", getOfflineCustomerById);
router.put("/offline-customers/:id", updateOfflineCustomer);
router.delete("/offline-customers/:id", deleteOfflineCustomer);

// Offline Orders (walk-in — separate from Order collection & online revenue)
router.get("/offline-orders/stats", getOfflineOrderStats);
router.get("/offline-orders", getOfflineOrders);
router.post("/offline-orders", createOfflineOrder);
router.get("/offline-orders/:id", getOfflineOrderById);
router.put("/offline-orders/:id", updateOfflineOrder);
router.patch("/offline-orders/:id/status", updateOfflineOrderStatus);

// CMS & Marketing
router.post("/cms/banners", createBanner);
router.get("/cms/banners", getAllBanners);
router.put("/cms/banners/:id", updateBanner);
router.delete("/cms/banners/:id", deleteBanner);

// Notifications
router.post("/cms/notifications/broadcast", sendBroadcastNotification);
router.get("/cms/notifications/logs", getNotificationLogs);

// Legal & FAQ Content
router.get("/cms/content", getAllCMSContent);
router.post("/cms/content", createCMSContent);
router.put("/cms/content/:id", updateCMSContent);
router.delete("/cms/content/:id", deleteCMSContent);

// File Uploads
router.post("/upload-image", uploadLimiter, upload.single("image"), uploadImage);

// Category Management
router.get("/categories", getAllCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// Store Management (Products)
router.get("/store/products", getAllProducts);
router.post("/store/products", createProduct);
router.put("/store/products/:id", updateProduct);
router.delete("/store/products/:id", deleteProduct);

// Inventory
router.patch("/store/inventory/:id", updateInventory);

// Coupon Management
router.get("/store/coupons", getAllCoupons);
router.post("/store/coupons", createCoupon);
router.put("/store/coupons/:id", updateCoupon);
router.delete("/store/coupons/:id", deleteCoupon);

// Finance Management
router.get("/finance/dashboard", getFinanceDashboard);
router.get("/finance/stats", getFinancialStats);
router.get("/finance/transactions", getTransactions);
router.get("/finance/orders/:id", getOrderFinancials);
router.get("/finance/gst", getGSTReport);
router.get("/finance/tailor-earnings", getTailorEarnings);
router.get("/finance/delivery-earnings", getDeliveryEarnings);
router.get("/finance/wallet-audit", getWalletAudit);
router.get("/finance/ledger", getPaymentLedger);
router.get("/finance/payouts", getAllPayouts);
router.patch("/finance/payouts/:id", updatePayoutStatus);

// System Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.patch("/settings/cod-wallet", updateCodSettings);

// Reports Management
router.get("/reports/generate", generateReport);

// Shiprocket Shipments Dashboard
router.get("/shiprocket/shipments", getShiprocketShipments);

module.exports = router;
