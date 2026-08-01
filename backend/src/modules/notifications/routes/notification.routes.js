const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  registerFcmToken,
  removeFcmToken,
  testPushNotification
} = require("../controllers/notification.controller.js");
const { protect } = require("../../../middlewares/auth.middleware.js");

router.use(protect);

router.post("/fcm-token", registerFcmToken);
router.post("/fcm-token/remove", removeFcmToken);
router.post("/test-push", testPushNotification);
router.get("/", getNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
