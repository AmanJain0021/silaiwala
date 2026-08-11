const { getFirebaseMessaging } = require('../config/firebase.js');
const User = require('../models/User.js');

/**
 * Send multicast FCM push notification to an array of tokens (Web & Mobile).
 * Automatically cleans up invalid/expired tokens from MongoDB User models.
 * 
 * @param {Object} options
 * @param {Array<string>} options.tokens - Array of FCM registration token strings
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification message body
 * @param {Object} [options.data] - Additional key-value payload data
 * @param {boolean} [options.isUrgent=true] - Priority flag
 */
const sendMulticastNotification = async ({ tokens, title, body, data = {}, isUrgent = true }) => {
  const validTokens = Array.isArray(tokens)
    ? [...new Set(tokens.filter(t => typeof t === 'string' && t.trim().length > 10))]
    : [];

  if (validTokens.length === 0) {
    return { successCount: 0, failureCount: 0, removedTokens: [] };
  }

  // Format custom data into a string-only key-value map as required by FCM
  const formattedData = {};
  if (data && typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        formattedData[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    }
  }

  const dataWithNotifInfo = {
    ...formattedData,
    title: String(title),
    body: String(body),
    message: String(body),
    url: data?.url || data?.targetUrl || '/'
  };

  const payload = {
    tokens: validTokens,
    notification: {
      title: String(title),
      body: String(body),
    },
    data: dataWithNotifInfo,
    webpush: {
      headers: {
        Urgency: 'high',
        TTL: '86400'
      },
      notification: {
        title: String(title),
        body: String(body),
        icon: '/logo192.png',
        click_action: data?.url || data?.targetUrl || '/'
      },
      fcmOptions: {
        link: data?.url || data?.targetUrl || '/'
      }
    },
    android: {
      priority: isUrgent ? 'high' : 'normal',
      notification: {
        title: String(title),
        body: String(body),
        sound: 'default',
        priority: 'high',
        channelId: 'delivery_requests'
      },
      data: dataWithNotifInfo
    }
  };

  try {
    const messaging = getFirebaseMessaging();
    const response = await messaging.sendEachForMulticast(payload);
    console.log(`[FCM-Helper] Multicast push sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${validTokens.length} tokens.`);

    const tokensToRemove = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          console.warn(`[FCM-Helper] Token ${validTokens[idx].substring(0, 15)}... failed with error:`, errCode || resp.error?.message);
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            tokensToRemove.push(validTokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        console.log(`[FCM-Helper] Automatically $pull-ing ${tokensToRemove.length} dead FCM tokens from MongoDB...`);
        await User.updateMany(
          {
            $or: [
              { fcmToken: { $in: tokensToRemove } },
              { fcmTokenMobile: { $in: tokensToRemove } }
            ]
          },
          {
            $pull: {
              fcmToken: { $in: tokensToRemove },
              fcmTokenMobile: { $in: tokensToRemove }
            }
          }
        );
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      removedTokens: tokensToRemove
    };
  } catch (err) {
    console.error('[FCM-Helper] Multicast push error:', err);
    throw err;
  }
};

module.exports = {
  sendMulticastNotification
};
