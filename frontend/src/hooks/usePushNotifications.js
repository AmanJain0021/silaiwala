import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../utils/api';
import { playNotificationSound } from '../utils/audio';
import toast from 'react-hot-toast';

let _currentDeviceToken = localStorage.getItem('fcm_token') || null;

/**
 * Get the current device's FCM token.
 */
export const getCurrentDeviceFcmToken = () => _currentDeviceToken;

/**
 * Register FCM token with backend API (EXACTLY ONCE per token).
 */
const syncTokenWithBackend = async (token, userId = null) => {
  if (!token) return;

  // ONLY sync FCM token if an active user authentication token exists
  const hasAuthToken = !!(
    localStorage.getItem('token') ||
    localStorage.getItem('jwt_token') ||
    localStorage.getItem('customer_token') ||
    localStorage.getItem('tailor_token') ||
    localStorage.getItem('delivery_token') ||
    localStorage.getItem('exec_token') ||
    localStorage.getItem('executive_token')
  );

  if (!hasAuthToken) {
    return; // User is logged out / on login-signup pages. Skip backend API call.
  }

  _currentDeviceToken = token;
  localStorage.setItem('fcm_token', token);

  const userSuffix = userId ? String(userId).slice(-8) : 'gen';
  const syncedKey = `fcm_token_synced_${userSuffix}_${token.slice(-10)}`;
  const syncStatus = localStorage.getItem(syncedKey);
  if (syncStatus === 'true') {
    return; // Already synced for this user! Prevent repeated API calls.
  }

  const payload = {
    fcmToken: token,
    token: token,
    platform: 'web'
  };

  try {
    await api.put('/user/fcm-token', payload);
    localStorage.setItem(syncedKey, 'true');
    console.log('[FCM] Token synced via PUT /user/fcm-token for user:', userId || 'current');
  } catch (err) {
    try {
      await api.post('/notifications/fcm-token', payload);
      localStorage.setItem(syncedKey, 'true');
      console.log('[FCM] Token synced via POST /notifications/fcm-token fallback for user:', userId || 'current');
    } catch (fallbackErr) {
      console.warn('[FCM] Token sync warning:', fallbackErr.message);
    }
  }
};

/**
 * Send a test push notification to THIS device only.
 */
export const testPushToThisDevice = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        console.warn('[FCM] Notification permission not granted:', perm);
      }
    } catch (e) {
      console.warn('[FCM] Notification permission request warning:', e);
    }
  }

  let deviceToken = getCurrentDeviceFcmToken() || localStorage.getItem('fcm_token');

  try {
    const { messaging, getToken: fbGetToken } = await import('../config/firebase');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    let registration;
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        registration = await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('[FCM] ServiceWorker registration notice:', swErr);
      }
    }

    const token = await fbGetToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      deviceToken = token;
      _currentDeviceToken = token;
      localStorage.setItem('fcm_token', token);
      syncTokenWithBackend(token);
    }
  } catch (err) {
    console.warn('[FCM] Could not obtain token on-the-fly, using fallback token if available:', err.message);
  }

  const response = await api.post('/notifications/test-push', {
    deviceToken: deviceToken || undefined,
    fcmToken: deviceToken || undefined,
    token: deviceToken || undefined
  });
  return response.data;
};

/**
 * Remove this device's FCM token from DB on logout.
 */
export const removeDeviceTokenOnLogout = async () => {
  const deviceToken = getCurrentDeviceFcmToken();
  if (deviceToken) {
    try {
      await api.post('/auth/logout', { fcmToken: deviceToken, token: deviceToken }).catch(async () => {
        await api.post('/notifications/fcm-token/remove', { fcmToken: deviceToken, token: deviceToken });
      });
      console.log('[FCM] Device token pulled from DB on logout');
    } catch (err) {
      console.error('[FCM] Failed to remove token on logout:', err.message);
    }
    const syncedKey = 'fcm_token_synced_' + deviceToken.slice(-10);
    localStorage.removeItem(syncedKey);
  }
  _currentDeviceToken = null;
  localStorage.removeItem('fcm_token');
};

export const usePushNotifications = (user) => {
  const [fcmToken, setFcmToken] = useState(_currentDeviceToken);
  const userId = user?._id || user?.id || user?.user?._id || user?.data?._id || null;

  useEffect(() => {
    if (!userId) return; // Skip FCM push token request for logged-out visitors & login/signup pages

    const requestPermissionAndGetToken = async () => {
      try {
        if (!('Notification' in window)) {
          console.warn('[FCM] Notifications are not supported in this browser.');
          return;
        }

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

          let registration;
          if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('/sw.js', { scope: '/' });
            registration = await navigator.serviceWorker.ready;
          }

          const currentToken = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
          });

          if (currentToken) {
            setFcmToken(currentToken);
            await syncTokenWithBackend(currentToken, userId);
          }
        }
      } catch (err) {
        console.error('[FCM] Error obtaining push token:', err);
      }
    };

    requestPermissionAndGetToken();

    const unsubscribe = onMessage(messaging, async (payload) => {
      console.log('[FCM] Foreground data message received:', payload);

      window.dispatchEvent(new CustomEvent('fcm_message', { detail: payload }));

      try { playNotificationSound(user?.role || 'customer'); } catch (e) { console.error(e); }

      const title = payload?.data?.title || payload?.notification?.title || 'SewZella';
      const body = payload?.data?.body || payload?.data?.message || payload?.notification?.body || 'New Notification';

      const orderId = payload?.data?.orderId || payload?.data?.id || payload?.data?.order;
      const status = payload?.data?.status;

      let toastId;
      if (orderId && status) {
        toastId = `toast-status-${orderId}-${String(status).toLowerCase()}`;
      } else if (orderId) {
        toastId = `toast-new-order-${orderId}`;
      } else {
        toastId = `toast-fcm-${title}-${body}`.replace(/\s+/g, '-').toLowerCase();
      }

      toast.success(`🔔 ${title}\n${body}`, {
        id: toastId,
        position: 'top-right',
        duration: 5000,
        style: {
          borderRadius: '16px',
          background: '#111827',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '14px 22px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
        }
      });

      // Show OS-level native notification in foreground
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const iconUrl = window.location.origin + '/logo.png';
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
              body,
              icon: iconUrl,
              badge: iconUrl,
              data: payload.data,
              vibrate: [200, 100, 200],
              tag: 'fcm-foreground-' + Date.now()
            });
          } else {
            new Notification(title, { body, icon: iconUrl });
          }
        } catch (_err) {
          console.warn('[FCM] Foreground OS notification error:', _err);
          try { new Notification(title, { body }); } catch (fallbackErr) { console.warn(fallbackErr); }
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  return { fcmToken };
};
