const express = require("express");
const router = express.Router();
const { 
  reportIssue, 
  getCustomerIssues, 
  getIssueDetails,
  getTailorIssues,
  updateIssueStatus,
  arrangePickup,
  getAdminIssues,
  adminUpdateIssueStatus,
  getIssueChat,
  sendIssueMessage
} = require("../controllers/issue.controller");
const { protect, authorize } = require("../../../middlewares/auth.middleware");

router.use(protect);

// Customer Routes
router.post("/", authorize("customer"), reportIssue);
router.get("/customer", authorize("customer"), getCustomerIssues);
router.get("/:id", authorize("customer", "tailor", "admin"), getIssueDetails);

// Chat Routes
router.get("/:id/chat", authorize("customer", "tailor", "admin"), getIssueChat);
router.post("/:id/chat", authorize("customer", "tailor", "admin"), sendIssueMessage);

// Tailor Routes
router.get("/tailor/list", authorize("tailor"), getTailorIssues);
router.patch("/:id/status", authorize("tailor"), updateIssueStatus);
router.post("/:id/arrange-pickup", authorize("tailor"), arrangePickup);

// Admin Routes
router.get("/admin/list", authorize("admin"), getAdminIssues);
router.patch("/admin/:id/status", authorize("admin"), adminUpdateIssueStatus);

module.exports = router;
