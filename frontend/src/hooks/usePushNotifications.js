import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../utils/api';
import { playNotificationSound } from '../utils/audio';

// Global variable to store the current device's FCM token
// This allows any component to access it without prop drilling
let _currentDeviceToken = null;

/**
 * Get the current device's FCM token.
 * Use this in test push buttons to send the token to the backend.
 */
export const getCurrentDeviceFcmToken = () => _currentDeviceToken;

/**
 * Send a test push notification to THIS device only.
 * Sends the current device's FCM token to the backend so the
 * push is targeted to this specific device, not all devices.
 */
export const testPushToThisDevice = async () => {
  const deviceToken = getCurrentDeviceFcmToken();
  if (!deviceToken) {
    throw new Error('No FCM token registered for this device. Please allow notifications and reload.');
  }
  const response = await api.post('/notifications/test-push', { 
    deviceToken 
  });
  return response.data;
};

/**
 * Remove this device's FCM token from the database on logout.
 * Call this BEFORE clearing the auth token from localStorage,
 * because the API call needs the auth token to authenticate.
 */
export const removeDeviceTokenOnLogout = async () => {
  const deviceToken = getCurrentDeviceFcmToken();
  if (!deviceToken) {
    console.log('[FCM] No device token to remove on logout');
    return;
  }
  try {
    await api.post('/notifications/fcm-token/remove', { token: deviceToken });
    console.log('[FCM] Device token removed from database on logout');
    _currentDeviceToken = null;
  } catch (err) {
    // Don't block logout if this fails
    console.error('[FCM] Failed to remove token on logout:', err.message);
  }
};

export const usePushNotifications = (user) => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return; // Only request token if user is logged in

    const requestPermissionAndGetToken = async () => {
      try {
        console.log('[FCM] Requesting notification permission...');
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('[FCM] Notification permission granted.');
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          
          let registration;
          if ('serviceWorker' in navigator) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          }

          const currentToken = await getToken(messaging, { 
              vapidKey: vapidKey,
              serviceWorkerRegistration: registration
          });
          
          if (currentToken) {
            setFcmToken(currentToken);
            _currentDeviceToken = currentToken; // Store globally for test push
            console.log('[FCM] Device token obtained:', currentToken.substring(0, 20) + '...');
            
            // ALL browser tokens (desktop, mobile browser) are WEB push tokens.
            // Only native apps (React Native) should use 'mobile'.
            try {
              await api.post('/notifications/fcm-token', { 
                token: currentToken, 
                platform: 'web' 
              });
              console.log('[FCM] Token saved to backend as WEB token');
            } catch (apiErr) {
              console.error('[FCM] Failed to save token:', apiErr.response?.data || apiErr.message);
            }
          } else {
            console.warn('[FCM] No registration token returned by Firebase.');
          }
        } else {
          console.warn('[FCM] Notification permission:', permission);
        }
      } catch (err) {
        console.error('[FCM] Error getting push token:', err);
      }
    };

    requestPermissionAndGetToken();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      
      // Dispatch a global event so any component can listen to FCM messages
      window.dispatchEvent(new CustomEvent('fcm_message', { detail: payload }));
      
      // Play sound for all foreground push notifications based on role
      try { playNotificationSound(user?.role || 'customer'); } catch(e) { console.error(e); }
      
      // Force an OS-level native notification even when the app is open!
      if (Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || 'SewZella';
        const body = payload.notification?.body || payload.data?.message || 'New Notification';
        const iconUrl = window.location.origin + '/vite.svg';
        
        const showForegroundPush = async () => {
          try {
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.ready;
              await registration.showNotification(title, {
                body: body,
                icon: iconUrl,
                data: payload.data,
                vibrate: [200, 100, 200]
              });
            } else {
              new Notification(title, {
                body: body,
                icon: iconUrl,
                data: payload.data
              });
            }
          } catch (err) {
            console.error("[FCM] Foreground notification error:", err);
            // Fallback for mobile if OS blocks foreground system push
            import('react-hot-toast').then((module) => {
              const { toast } = module.default || module;
              toast.success(`🔔 ${title}: ${body}`, { position: 'top-center', duration: 5000 });
            });
          }
        };
        showForegroundPush();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { fcmToken };
};

