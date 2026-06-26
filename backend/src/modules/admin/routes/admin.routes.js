const express = require("express");
const { protect, authorize } = require("../../../middlewares/auth.middleware");
const upload = require("../../../middlewares/upload.middleware");
const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  getDeliveryPartners,
  getPendingTailors,
  approveTailor,
  rejectTailor,
  updateTailorCommission,
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
} = require("../controllers/admin.controller");

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
} = require("../controllers/finance.controller");

const {
  getAllDepositHistory,
  updateDepositStatus,
  updateCodSettings
} = require("../../deliveries/controllers/cashDeposit.controller");

const router = express.Router();


// Apply auth middleware to ALL routes
router.use(protect);
router.use(authorize("admin"));

// Dashboard
router.get("/dashboard", getDashboardStats);

// User Management
router.get("/users", getAllUsers);
router.get("/delivery-partners", getDeliveryPartners);
router.put("/users/:id/status", updateUserStatus);

// Tailor Approvals
router.get("/tailors/pending", getPendingTailors);
router.put("/tailors/:id/approve", approveTailor);
router.put("/tailors/:id/reject", rejectTailor);
router.put("/tailors/:id/commission", updateTailorCommission);

// Delivery Partner Approvals
router.get("/delivery-partners/pending", getPendingDeliveryPartners);
router.put("/delivery-partners/:id/approve", approveDeliveryPartner);
router.delete("/delivery-partners/:id/reject", rejectDeliveryPartner);

// Delivery Partner COD
router.get("/deliveries/cod-deposit", getAllDepositHistory);
router.post("/deliveries/:id/cod-deposit/status", updateDepositStatus);

// Orders
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);

// CMS & Marketing
router.post("/cms/banners", createBanner);
router.get("/cms/banners", getAllBanners);
router.put("/cms/banners/:id", updateBanner);
router.delete("/cms/banners/:id", deleteBanner);

// Notifications
router.post("/cms/notifications/broadcast", sendBroadcastNotification);

// Legal & FAQ Content
router.get("/cms/content", getAllCMSContent);
router.post("/cms/content", createCMSContent);
router.put("/cms/content/:id", updateCMSContent);
router.delete("/cms/content/:id", deleteCMSContent);

// File Uploads
router.post("/upload-image", upload.single("image"), uploadImage);

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

module.exports = router;
