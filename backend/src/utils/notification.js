const Notification = require("../models/Notification.js");
const { tryGetIO } = require("../config/socket.js");

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
    const { recipient, type, title, message, data, targetPlatform } = options;

    // 1. Save to Database
    let notificationsToCreate = [];
    if (recipient === "admins") {
      const User = require("../models/User.js");
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
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
    const io = tryGetIO();
    if (io) {
      if (recipient === "admins") {
        const User = require("../models/User.js");
        const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } });
        admins.forEach(admin => {
          io.to(`user_${admin._id.toString()}`).emit("new_notification", {
             title, message, type, data, createdAt: new Date()
          });
        });
        io.to("admin_room").emit("new_notification", {
           title, message, type, data, createdAt: new Date()
        });
        if (type === "NEW_ORDER" || type === "ORDER_CREATED") {
           io.to("admin_room").emit("new_order", {
              title, message, type, data, createdAt: new Date()
           });
        }
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

        if (type === "TASK_ASSIGNED" || type === "NEW_DELIVERY_TASK") {
          io.to(`user_${recipientId}`).emit("new_task", {
            title,
            message,
            type,
            data,
            _id: data?.orderId,
            orderId: data?.orderId_str || data?.orderId,
            taskType: data?.taskType,
            assignedByAdmin: !!data?.assignedByAdmin,
          });
        }
        
        // Also emit specific type events if needed
        if (type === "ORDER_CREATED") {
            io.to(`user_${recipientId}`).emit("new_order", {
                orderId: data?.orderId,
                message: title
            });
        }
      }

      // Real-time tracking for a specific order. Never reuse order_status_updated
      // with a notification type — clients treat that field as a real workflow status.
      if (data?.orderId) {
          io.to(`order_${data.orderId}`).emit("order_notification", {
              type,
              message,
              orderId: data.orderId,
              _id: data.orderId,
              title,
              data,
          });
      }
    }

    // 3. Dispatch Firebase Cloud Messaging (FCM) push
    try {
      // Initialize Firebase (if not already initialized)
      require("../config/firebase.js");
      const { getMessaging } = require('firebase-admin/messaging');
      const User = require("../models/User.js");
      
      let fcmTokens = [];
      
      if (recipient === "admins") {
        const admins = await User.find({ 
          role: { $in: ['admin', 'super_admin'] },
          $or: [
            { fcmToken: { $exists: true, $not: {$size: 0} } },
            { fcmTokenMobile: { $exists: true, $not: {$size: 0} } }
          ]
        });
        fcmTokens = admins.flatMap(a => {
          const tokens = a.fcmToken ? [...a.fcmToken] : [];
          if (a.fcmTokenMobile) tokens.push(...a.fcmTokenMobile);
          return tokens;
        });
      } else if (recipient === "delivery_partners") {
        // Send to all active delivery partners
        const partners = await User.find({ 
          role: 'delivery', 
          isActive: true, 
          $or: [
            { fcmToken: { $exists: true, $not: {$size: 0} } },
            { fcmTokenMobile: { $exists: true, $not: {$size: 0} } }
          ]
        });
        fcmTokens = partners.flatMap(p => {
          const tokens = p.fcmToken ? [...p.fcmToken] : [];
          if (p.fcmTokenMobile) tokens.push(...p.fcmTokenMobile);
          return tokens;
        });
      } else {
        // Send to specific user — collect tokens based on targetPlatform
        const targetUser = await User.findById(recipient);
        if (targetUser) {
          const webTokens = targetUser.fcmToken || [];
          const mobileTokens = targetUser.fcmTokenMobile || [];
          
          console.log(`[FCM] User ${recipient} has ${webTokens.length} web token(s) and ${mobileTokens.length} mobile token(s)`);
          
          if (targetPlatform === 'mobile') {
            // Only mobile tokens
            fcmTokens = [...mobileTokens];
            console.log(`[FCM] Targeting MOBILE only: ${fcmTokens.length} token(s)`);
          } else if (targetPlatform === 'web') {
            // Only web tokens
            fcmTokens = [...webTokens];
            console.log(`[FCM] Targeting WEB only: ${fcmTokens.length} token(s)`);
          } else {
            // No platform filter — send to ALL devices
            fcmTokens = [...webTokens, ...mobileTokens];
            console.log(`[FCM] Targeting ALL devices: ${fcmTokens.length} token(s)`);
          }
        }
      }

      if (fcmTokens.length > 0) {
        // Remove duplicate and empty tokens to prevent FCM errors
        fcmTokens = [...new Set(fcmTokens.filter(t => t))];
        
        if (fcmTokens.length === 0) return true;

        const fcmData = { type: type || 'SYSTEM' };
        if (data) {
          for (const key in data) {
            fcmData[key] = data[key] ? data[key].toString() : '';
          }
        }
        if (!fcmData.url && data?.targetUrl) {
          fcmData.url = data.targetUrl.toString();
        }

        const payload = {
          notification: {
            title: title,
            body: message,
          },
          data: fcmData,
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
          tokens: fcmTokens
        };
        
        // Send to multiple devices using the modular getMessaging()
        const response = await getMessaging().sendEachForMulticast(payload);
        console.log(`FCM Broadcast Sent: ${response.successCount} successful, ${response.failureCount} failed.`);
      }
    } catch (fcmError) {
      console.error("❌ FCM Push Error:", fcmError.message);
    }

    return true;
  } catch (error) {
    console.error("❌ Notification Error:", error.message);
    return false;
  }
};

module.exports = { sendNotification };
