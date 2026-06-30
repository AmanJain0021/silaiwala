const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  registerFcmToken,
  testPushNotification
} = require("../controllers/notification.controller");
const { protect } = require("../../../middlewares/auth.middleware");

router.use(protect);

router.post("/fcm-token", registerFcmToken);
router.post("/test-push", testPushNotification);
router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
