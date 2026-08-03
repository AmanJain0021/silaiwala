const { getFirebaseMessaging } = require('../config/firebase.js');
const User = require('../models/User.js');

/**
 * Send multicast FCM push notification for Web and Mobile.
 *
 * Includes both notification and data payloads to ensure Web browsers (Chrome Android/Desktop, Safari PWA)
 * and mobile clients display native OS push notifications in foreground, background, and closed states.
 *
 * @param {Object} params
 * @param {Array<string>} params.tokens - Array of FCM registration tokens
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body content
 * @param {Object} [params.data] - Additional metadata key-value pairs
 * @param {boolean} [params.isUrgent=true] - Priority flag
 * @returns {Promise<Object>} Summary of multicast send results
 */
const sendMulticastNotification = async ({ tokens = [], title = '', body = '', data = {}, isUrgent = true }) => {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, removedTokens: [] };
  }

  // Sanitize and deduplicate tokens
  const validTokens = [...new Set(tokens.filter(t => typeof t === 'string' && t.trim() !== ''))];
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
        Urgency: 'high'
      },
      notification: {
        title: String(title),
        body: String(body),
        icon: 'https://sewzella.com/logo.png',
        badge: 'https://sewzella.com/logo.png',
        vibrate: [200, 100, 200]
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
        sound: 'default'
      }
    },
    apns: {
      headers: {
        'apns-priority': isUrgent ? '10' : '5'
      },
      payload: {
        aps: {
          alert: {
            title: String(title),
            body: String(body)
          },
          sound: 'default',
          badge: 1
        }
      }
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
  } catch (error) {
    console.error('❌ [FCM-Helper] Multicast Error:', error.message);
    throw error;
  }
};

module.exports = {
  sendMulticastNotification
};
