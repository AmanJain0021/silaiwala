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

    // 1. Resolve target user/tailor if recipient is a specific ID
    const User = require("../models/User.js");
    let targetUser = null;
    let targetTailorId = null;

    if (recipient !== "admins" && recipient !== "delivery_partners" && recipient) {
      targetUser = await User.findById(recipient);
      if (!targetUser) {
        try {
          const Tailor = require("../models/Tailor.js");
          const tailorDoc = await Tailor.findById(recipient);
          if (tailorDoc && tailorDoc.user) {
            targetTailorId = tailorDoc._id.toString();
            targetUser = await User.findById(tailorDoc.user);
          }
        } catch (tErr) {}
      } else {
        try {
          const Tailor = require("../models/Tailor.js");
          const tailorDoc = await Tailor.findOne({ user: recipient });
          if (tailorDoc) {
            targetTailorId = tailorDoc._id.toString();
          }
        } catch (tErr) {}
      }
    }

    const finalRecipientUserId = targetUser ? targetUser._id.toString() : (recipient ? recipient.toString() : null);

    // Save to Database
    let notificationsToCreate = [];
    if (recipient === "admins") {
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
    } else if (recipient !== "delivery_partners" && finalRecipientUserId) {
      await Notification.create({
        recipient: finalRecipientUserId,
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
      } else if (finalRecipientUserId) {
        const targetRooms = new Set([`user_${finalRecipientUserId}`]);
        if (targetTailorId) targetRooms.add(`user_${targetTailorId}`);

        targetRooms.forEach(roomName => {
          io.to(roomName).emit("new_notification", {
             title, message, type, data, createdAt: new Date()
          });

          if (type === "TASK_ASSIGNED" || type === "NEW_DELIVERY_TASK") {
            io.to(roomName).emit("new_task", {
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
          
          if (type === "ORDER_CREATED" || type === "NEW_ORDER") {
              io.to(roomName).emit("new_order", {
                  orderId: data?.orderId,
                  _id: data?.orderId,
                  message: title,
                  title,
                  data
              });
              io.to(roomName).emit("receive_new_order", {
                  orderId: data?.orderId,
                  _id: data?.orderId,
                  message: title,
                  title,
                  data
              });
          }
        });
      }

      // Real-time tracking for a specific order.
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
      const { sendMulticastNotification } = require("./firebaseHelper.js");
      
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
      } else if (targetUser) {
        const webTokens = targetUser.fcmToken || [];
        const mobileTokens = targetUser.fcmTokenMobile || [];
        
        console.log(`[FCM] User ${targetUser._id} has ${webTokens.length} web token(s) and ${mobileTokens.length} mobile token(s)`);
        
        if (targetPlatform === 'mobile') {
          fcmTokens = [...mobileTokens];
        } else if (targetPlatform === 'web') {
          fcmTokens = [...webTokens];
        } else {
          fcmTokens = [...webTokens, ...mobileTokens];
        }
      }

      if (fcmTokens.length > 0) {
        await sendMulticastNotification({
          tokens: fcmTokens,
          title,
          body: message,
          data: {
            ...data,
            type: type || 'SYSTEM'
          },
          isUrgent: true
        });
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
