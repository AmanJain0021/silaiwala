const Notification = require("../models/Notification");
const { getIO } = require("../config/socket");

/**
 * Service to create and send real-time notifications
 * @param {Object} options - Notification options
 * @param {String} options.recipient - Target User ID
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification body
 * @param {Object} [options.data] - Extra data (orderId, url)
 */
const sendNotification = async (options) => {
  try {
    const { recipient, type, title, message, data } = options;

    // 1. Save to Database
    let notificationsToCreate = [];
    if (recipient === "admins") {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        notificationsToCreate.push({
          recipient: admin._id,
          type,
          title,
          message,
          data
        });
      }
      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
      }
    } else if (recipient !== "delivery_partners") {
      await Notification.create({
        recipient,
        type,
        title,
        message,
        data
      });
    }

    // 2. Emit Real-time via Socket.io
    const io = getIO();
    if (io) {
      if (recipient === "admins") {
        const User = require('../models/User');
        const admins = await User.find({ role: 'admin' });
        admins.forEach(admin => {
          io.to(`user_${admin._id.toString()}`).emit("new_notification", {
             title, message, type, data, createdAt: new Date()
          });
        });
      } else if (recipient === "delivery_partners") {
          io.to("delivery_partners").emit("new_notification", {
              title,
              message,
              type,
              data,
              createdAt: new Date()
          });
          io.to("delivery_partners").emit("new_task", {
              title,
              message,
              data
          });
      } else {
        const recipientId = recipient.toString();
        io.to(`user_${recipientId}`).emit("new_notification", {
           title, message, type, data, createdAt: new Date()
        });
        
        // Also emit specific type events if needed
        if (type === "ORDER_CREATED") {
            io.to(`user_${recipientId}`).emit("new_order", {
                orderId: data?.orderId,
                message: title
            });
        }
      }

      // Real-time tracking for a specific order
      if (data?.orderId) {
          io.to(`order_${data.orderId}`).emit("order_status_updated", {
              status: type, // Using type or status from data
              message: message,
              orderId: data.orderId
          });
      }
    }

    // 3. Dispatch Firebase Cloud Messaging (FCM) push
    try {
      const admin = require('../config/firebase');
      const User = require('../models/User');
      
      let fcmTokens = [];
      
      if (recipient === "admins") {
        const admins = await User.find({ role: 'admin', fcmTokens: { $exists: true, $not: {$size: 0} } });
        fcmTokens = admins.flatMap(a => a.fcmTokens);
      } else if (recipient === "delivery_partners") {
        // Send to all active delivery partners
        const partners = await User.find({ role: 'delivery', isActive: true, fcmTokens: { $exists: true, $not: {$size: 0} } });
        fcmTokens = partners.flatMap(p => p.fcmTokens);
      } else {
        // Send to specific user
        const targetUser = await User.findById(recipient);
        if (targetUser && targetUser.fcmTokens && targetUser.fcmTokens.length > 0) {
          fcmTokens = targetUser.fcmTokens;
        }
      }

      if (fcmTokens.length > 0) {
        const payload = {
          notification: {
            title: title,
            body: message,
          },
          data: {
            type: type || 'SYSTEM',
            orderId: data?.orderId ? data.orderId.toString() : '',
            url: data?.targetUrl || ''
          },
          tokens: fcmTokens
        };
        
        // Send to multiple devices
        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`FCM Broadcast Sent: ${response.successCount} successful, ${response.failureCount} failed.`);
      }
    } catch (fcmError) {
      console.error("❌ FCM Push Error:", fcmError.message);
    }

    return notification;
  } catch (error) {
    console.error("❌ Notification Error:", error.message);
  }
};

module.exports = { sendNotification };
