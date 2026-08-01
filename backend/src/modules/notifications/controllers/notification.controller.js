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
  console.log(`[FCM-TOKEN] Received request for user ${user._id} (${user.role}) - token: ${token}, platform: ${platform}`);

  // Add token based on platform
  if (platform === 'mobile' || platform === 'android' || platform === 'ios' || platform === 'react-native') {
    console.log(`[FCM-TOKEN] Saving token to MOBILE list (fcmTokenMobile) for user ${user._id}`);
    if (!user.fcmTokenMobile) user.fcmTokenMobile = [];
    if (!user.fcmTokenMobile.includes(token)) {
      user.fcmTokenMobile.push(token);
    } else {
      console.log(`[FCM-TOKEN] Token already exists in MOBILE list`);
    }
  } else {
    console.log(`[FCM-TOKEN] Saving token to WEB list (fcmToken) for user ${user._id}`);
    if (!user.fcmToken) user.fcmToken = [];
    if (!user.fcmToken.includes(token)) {
      user.fcmToken.push(token);
    } else {
      console.log(`[FCM-TOKEN] Token already exists in WEB list`);
    }
  }

  await user.save();
  console.log(`[FCM-TOKEN] Successfully saved token for user ${user._id}`);

  res.status(200).json({
    success: true,
    message: "FCM Token registered successfully",
  });
});

/**
 * @desc    Send a test push notification to logged in user
 * @route   POST /api/v1/notifications/test-push
 * @access  Private
 */
exports.testPushNotification = asyncHandler(async (req, res, next) => {
  const { sendNotification } = require("../../../utils/notification.js");
  
  await sendNotification({
    recipient: req.user._id,
    title: "Test Push Notification",
    message: "This is a test push notification to verify the setup is working correctly.",
    type: "TEST",
    data: {
      testUrl: "/dashboard",
      timestamp: new Date().toISOString()
    }
  });

  res.status(200).json({
    success: true,
    message: "Test push notification sent successfully",
  });
});
