const Notification = require("../../../models/Notification.js");
const asyncHandler = require("../../../utils/asyncHandler.js");
const ErrorResponse = require("../../../utils/errorResponse.js");

/**
 * @desc    Get all notifications for logged in user
 * @route   GET /api/v1/notifications
 * @access  Private
 */
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort("-createdAt")
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    unreadCount,
    count: notifications.length,
    data: notifications,
  });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new ErrorResponse("Notification not found", 404));
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
exports.markAllRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user.id,
  });

  if (!notification) {
    return next(new ErrorResponse("Notification not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Register or update FCM Token for user
 * @route   POST /api/v1/notifications/fcm-token
 * @access  Private
 */
exports.registerFcmToken = asyncHandler(async (req, res, next) => {
  const { token, platform } = req.body;

  if (!token) {
    return next(new ErrorResponse("Please provide an FCM token", 400));
  }

  const user = req.user;
  console.log(`[FCM-TOKEN] Received request for user ${user._id} (${user.role}) - token: ${token.substring(0, 20)}..., platform: ${platform}`);

  // Ensure arrays exist
  if (!user.fcmToken) user.fcmToken = [];
  if (!user.fcmTokenMobile) user.fcmTokenMobile = [];

  const isMobile = platform === 'mobile' || platform === 'android' || platform === 'ios' || platform === 'react-native';

  if (isMobile) {
    // Save to mobile, remove from web if it was there
    const webIndex = user.fcmToken.indexOf(token);
    if (webIndex !== -1) {
      user.fcmToken.splice(webIndex, 1);
      console.log(`[FCM-TOKEN] Removed token from WEB list (was misplaced)`);
    }
    if (!user.fcmTokenMobile.includes(token)) {
      user.fcmTokenMobile.push(token);
      console.log(`[FCM-TOKEN] Added token to MOBILE list`);
    } else {
      console.log(`[FCM-TOKEN] Token already in MOBILE list`);
    }
  } else {
    // Save to web, remove from mobile if it was there
    const mobileIndex = user.fcmTokenMobile.indexOf(token);
    if (mobileIndex !== -1) {
      user.fcmTokenMobile.splice(mobileIndex, 1);
      console.log(`[FCM-TOKEN] Removed token from MOBILE list (was misplaced)`);
    }
    if (!user.fcmToken.includes(token)) {
      user.fcmToken.push(token);
      console.log(`[FCM-TOKEN] Added token to WEB list`);
    } else {
      console.log(`[FCM-TOKEN] Token already in WEB list`);
    }
  }

  await user.save();
  console.log(`[FCM-TOKEN] Saved. Web tokens: ${user.fcmToken.length}, Mobile tokens: ${user.fcmTokenMobile.length}`);

  res.status(200).json({
    success: true,
    message: "FCM Token registered successfully",
  });
});

/**
 * @desc    Send a test push notification to the REQUESTING device
 * @route   POST /api/v1/notifications/test-push
 * @access  Private
 * 
 * The frontend sends the current device's FCM token in req.body.deviceToken.
 * This ensures the push notification goes to ONLY the device that clicked
 * the test button, not all devices logged into the same account.
 */
exports.testPushNotification = asyncHandler(async (req, res, next) => {
  const { deviceToken } = req.body || {};
  const User = require("../../../models/User.js");
  const { sendMulticastNotification } = require("../../../utils/firebaseHelper.js");

  try {
    // Fetch fresh user from DB to get all stored web & mobile tokens
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return next(new ErrorResponse("User not found", 404));
    }

    const webTokens = freshUser.fcmToken || [];
    const mobileTokens = freshUser.fcmTokenMobile || [];
    
    // Combine all tokens from DB + deviceToken from body, filtered and deduplicated
    const allTokens = [...new Set([...webTokens, ...mobileTokens, deviceToken].filter(Boolean))];

    if (allTokens.length === 0) {
      return next(new ErrorResponse("No FCM tokens found for your account. Please allow notification permissions and refresh.", 400));
    }

    console.log(`[TEST-PUSH] Sending test notification to user ${req.user._id} (${allTokens.length} tokens)...`);

    const results = await sendMulticastNotification({
      tokens: allTokens,
      title: "Test Push Notification 🔔",
      body: "This is a test push notification from SewZella. Setup is working correctly!",
      data: {
        type: "TEST",
        url: "/user/notifications",
        timestamp: new Date().toISOString()
      },
      isUrgent: true
    });

    res.status(200).json({
      success: true,
      message: `Test push sent to ${results.successCount} device(s)`,
    });
  } catch (fcmError) {
    console.error("[TEST-PUSH] FCM Error:", fcmError.message);
    return next(new ErrorResponse("Failed to send test notification: " + fcmError.message, 500));
  }
});

/**
 * @desc    Remove FCM token on logout (removes from both web and mobile arrays)
 * @route   POST /api/v1/notifications/fcm-token/remove
 * @access  Private
 */
exports.removeFcmToken = asyncHandler(async (req, res, next) => {
  const { token } = req.body || {};

  if (!token) {
    return res.status(200).json({ success: true, message: "No token to remove" });
  }

  const user = req.user;
  let removed = false;

  // Remove from web tokens
  if (user.fcmToken && user.fcmToken.includes(token)) {
    user.fcmToken = user.fcmToken.filter(t => t !== token);
    removed = true;
    console.log(`[FCM-TOKEN] Removed token from WEB list for user ${user._id}`);
  }

  // Remove from mobile tokens
  if (user.fcmTokenMobile && user.fcmTokenMobile.includes(token)) {
    user.fcmTokenMobile = user.fcmTokenMobile.filter(t => t !== token);
    removed = true;
    console.log(`[FCM-TOKEN] Removed token from MOBILE list for user ${user._id}`);
  }

  if (removed) {
    await user.save();
    console.log(`[FCM-TOKEN] After removal — Web: ${user.fcmToken.length}, Mobile: ${user.fcmTokenMobile.length}`);
  } else {
    console.log(`[FCM-TOKEN] Token not found in any list for user ${user._id}`);
  }

  res.status(200).json({
    success: true,
    message: "FCM Token removed successfully",
  });
});
