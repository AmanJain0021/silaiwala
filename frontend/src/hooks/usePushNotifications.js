import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../utils/api';
import { playNotificationSound } from '../utils/audio';

let _currentDeviceToken = localStorage.getItem('fcm_token') || null;

/**
 * Get the current device's FCM token.
 */
export const getCurrentDeviceFcmToken = () => _currentDeviceToken;

/**
 * Register FCM token with backend API (EXACTLY ONCE per token).
 */
const syncTokenWithBackend = async (token) => {
  if (!token) return;
  _currentDeviceToken = token;
  localStorage.setItem('fcm_token', token);

  const syncedKey = 'fcm_token_synced_' + token.slice(-10);
  if (localStorage.getItem(syncedKey) === 'true') {
    return; // Already synced with backend! Prevent repeated API calls.
  }

  const payload = {
    fcmToken: token,
    token: token,
    platform: 'web'
  };

  try {
    await api.put('/user/fcm-token', payload);
    localStorage.setItem(syncedKey, 'true');
    console.log('[FCM] Token synced via PUT /api/user/fcm-token');
  } catch (err) {
    try {
      await api.post('/notifications/fcm-token', payload);
      localStorage.setItem(syncedKey, 'true');
      console.log('[FCM] Token synced via POST /notifications/fcm-token fallback');
    } catch (fallbackErr) {
      console.error('[FCM] Failed to sync token to backend:', fallbackErr.message);
    }
  }
};

/**
 * Send a test push notification to THIS device only.
 */
export const testPushToThisDevice = async () => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      throw new Error('Notification permission is blocked. Please allow notifications in your browser address bar (🔒 icon next to URL).');
    }
  }

  let deviceToken = null;

  try {
    const { messaging, getToken: fbGetToken } = await import('../config/firebase');
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

    let registration;
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      registration = await navigator.serviceWorker.ready;
    }

    deviceToken = await fbGetToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (deviceToken) {
      _currentDeviceToken = deviceToken;
      localStorage.setItem('fcm_token', deviceToken);
    }
  } catch (err) {
    console.warn('[FCM] Could not obtain token on-the-fly, using fallback:', err.message);
    deviceToken = getCurrentDeviceFcmToken();
  }

  if (!deviceToken) {
    deviceToken = getCurrentDeviceFcmToken();
  }

  if (!deviceToken) {
    throw new Error('Could not retrieve device push token. Please refresh the page and try again.');
  }

  const response = await api.post('/notifications/test-push', {
    deviceToken,
    fcmToken: deviceToken,
    token: deviceToken
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
            await syncTokenWithBackend(currentToken);
          }
        }
      } catch (err) {
        console.error('[FCM] Error obtaining push token:', err);
      }
    };

    requestPermissionAndGetToken();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Notification.permission === 'granted') {
        requestPermissionAndGetToken();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground data message received:', payload);

      window.dispatchEvent(new CustomEvent('fcm_message', { detail: payload }));

      try { playNotificationSound(user?.role || 'customer'); } catch (e) { console.error(e); }

      const title = payload?.data?.title || payload?.notification?.title || 'SewZella';
      const body = payload?.data?.body || payload?.data?.message || payload?.notification?.body || 'New Notification';

      import('react-hot-toast').then((module) => {
        const { toast } = module.default || module;
        toast.success(`🔔 ${title}\n${body}`, {
          position: 'bottom-center',
          duration: 6000,
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
      });

      // If foreground notification is needed via ServiceWorker, use the existing registration
      // However, it's better to avoid calling this directly in foreground if possible
      // to avoid duplicates or spam blocking by the browser.
      // But we will leave it working using standard Notification API as a fallback.
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  return { fcmToken };
};
