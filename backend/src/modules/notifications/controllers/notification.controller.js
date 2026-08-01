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
  const { deviceToken } = req.body;

  if (!deviceToken) {
    return next(new ErrorResponse("No device token provided. Please allow notifications and reload.", 400));
  }

  // Send FCM push directly to this specific device token
  try {
    require("../../../config/firebase.js");
    const { getMessaging } = require('firebase-admin/messaging');

    const payload = {
      notification: {
        title: "Test Push Notification",
        body: "This is a test push notification to verify the setup is working correctly.",
      },
      data: {
        type: "TEST",
        testUrl: "/dashboard",
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            contentAvailable: true
          }
        }
      },
      token: deviceToken  // Single token — this specific device only
    };

    const response = await getMessaging().send(payload);
    console.log(`[TEST-PUSH] FCM sent successfully to device token ${deviceToken.substring(0, 20)}..., response: ${response}`);

    res.status(200).json({
      success: true,
      message: "Test push notification sent to this device",
    });
  } catch (fcmError) {
    console.error("[TEST-PUSH] FCM Error:", fcmError.message);
    
    // If the token is invalid/expired, let the user know
    if (fcmError.code === 'messaging/registration-token-not-registered' ||
        fcmError.code === 'messaging/invalid-registration-token') {
      return next(new ErrorResponse("Your device token is expired or invalid. Please reload the page and try again.", 400));
    }
    
    return next(new ErrorResponse("Failed to send test notification: " + fcmError.message, 500));
  }
});

