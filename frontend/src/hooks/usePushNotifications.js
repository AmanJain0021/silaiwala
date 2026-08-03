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
 * Register FCM token with backend API.
 */
const syncTokenWithBackend = async (token) => {
  if (!token) return;
  _currentDeviceToken = token;
  localStorage.setItem('fcm_token', token);

  const payload = {
    fcmToken: token,
    token: token,
    platform: 'web'
  };

  try {
    await api.put('/user/fcm-token', payload);
    console.log('[FCM] Token synced via PUT /api/user/fcm-token');
  } catch (err) {
    try {
      await api.post('/notifications/fcm-token', payload);
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
  let deviceToken = getCurrentDeviceFcmToken();

  if (!deviceToken) {
    try {
      const { messaging, getToken: fbGetToken } = await import('../config/firebase');
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      let registration;
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        registration = await navigator.serviceWorker.ready;
      }

      deviceToken = await fbGetToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });

      if (deviceToken) {
        await syncTokenWithBackend(deviceToken);
      }
    } catch (err) {
      console.warn('[FCM] Could not obtain token on-the-fly:', err.message);
    }
  }

  const response = await api.post('/notifications/test-push', {
    deviceToken: deviceToken || undefined
  });
  return response.data;
};

/**
 * Remove this device's FCM token from DB on logout.
 */
export const removeDeviceTokenOnLogout = async () => {
  const deviceToken = getCurrentDeviceFcmToken();
  if (!deviceToken) {
    console.log('[FCM] No device token to remove on logout');
    return;
  }
  try {
    await api.post('/auth/logout', { fcmToken: deviceToken, token: deviceToken }).catch(async () => {
      await api.post('/notifications/fcm-token/remove', { fcmToken: deviceToken, token: deviceToken });
    });
    console.log('[FCM] Device token pulled from DB on logout');
  } catch (err) {
    console.error('[FCM] Failed to remove token on logout:', err.message);
  } finally {
    _currentDeviceToken = null;
    localStorage.removeItem('fcm_token');
  }
};

export const usePushNotifications = (user) => {
  const [fcmToken, setFcmToken] = useState(_currentDeviceToken);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const requestPermissionAndGetToken = async () => {
      try {
        if (!('Notification' in window)) {
          console.warn('[FCM] Notifications are not supported in this browser.');
          return;
        }

        console.log('[FCM] Requesting notification permission...');
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
          console.log('[FCM] Notification permission granted.');
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

          let registration;
          if ('serviceWorker' in navigator) {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
            registration = await navigator.serviceWorker.ready;
          }

          const currentToken = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
          });

          if (currentToken) {
            setFcmToken(currentToken);
            await syncTokenWithBackend(currentToken);
          } else {
            console.warn('[FCM] No registration token returned by Firebase.');
          }
        } else {
          console.warn('[FCM] Notification permission state:', permission);
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
          position: 'top-center',
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

      if (Notification.permission === 'granted') {
        const iconUrl = window.location.origin + '/logo.png';
        const showForegroundPush = async () => {
          try {
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(title, {
                body,
                icon: iconUrl,
                data: payload.data,
                vibrate: [200, 100, 200]
              });
            }
          } catch (err) {
            console.error('[FCM] Foreground OS notification error:', err);
          }
        };
        showForegroundPush();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { fcmToken };
};
