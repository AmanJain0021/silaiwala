import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage } from '../config/firebase';
import api from '../utils/api';
import { playNotificationSound } from '../utils/audio';

export const usePushNotifications = (user) => {
  const [fcmToken, setFcmToken] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return; // Only request token if user is logged in

    const requestPermissionAndGetToken = async () => {
      try {
        console.log('Requesting notification permission...');
        // Only alert on mobile to help debug
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // Use VAPID key for web push
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
            console.log('FCM Token:', currentToken);
            
            // IMPORTANT: Browser-based FCM tokens (even on mobile browsers) are WEB push tokens.
            // Only native apps (React Native) generate true mobile FCM tokens.
            // So browser tokens must ALWAYS be saved as 'web' regardless of device.
            try {
              const platformType = 'web';
              const response = await api.post('/notifications/fcm-token', { token: currentToken, platform: platformType });
              console.log('FCM Token successfully saved to backend as WEB token:', response.data);
            } catch (apiErr) {
              console.error('Failed to save FCM Token to backend:', apiErr.response?.data || apiErr.message);
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
            if (isMobile) alert("FCM failed: No registration token returned by Firebase.");
          }
        } else {
          console.log('Notification permission denied or dismissed.');
          if (isMobile) alert("Permission Error: Notification permission was " + permission + ". Please allow notifications in site settings.");
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) alert("Error in getting push token: " + err.message);
      }
    };

    requestPermissionAndGetToken();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground Message received:', payload);
      
      // Dispatch a global event so any component can listen to FCM messages
      window.dispatchEvent(new CustomEvent('fcm_message', { detail: payload }));
      
      // Play sound for all foreground push notifications based on role
      try { playNotificationSound(user?.role || 'customer'); } catch(e) { console.error(e); }
      
      // Force an OS-level native notification even when the app is open!
      if (Notification.permission === 'granted') {
        const title = payload.notification?.title || payload.data?.title || 'SewZella';
        const body = payload.notification?.body || payload.data?.message || 'New Notification';
        // Mobile Chrome often fails silently if icon is a relative path or SVG. Using full origin path.
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
            console.error("Foreground notification error:", err);
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
