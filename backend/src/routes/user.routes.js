const express = require("express");
const router = express.Router();
const { registerFcmToken, removeFcmToken } = require("../modules/notifications/controllers/notification.controller.js");
const { protect } = require("../middlewares/auth.middleware.js");

router.use(protect);

router.post("/fcm-token", registerFcmToken);
router.put("/fcm-token", registerFcmToken);
router.post("/fcm-token/remove", removeFcmToken);
router.delete("/fcm-token", removeFcmToken);

module.exports = router;
