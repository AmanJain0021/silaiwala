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
            
            // Send token to backend
            // Detect if the user is on a mobile browser or desktop browser
            try {
              const platformType = isMobile ? 'mobile' : 'web';
              const response = await api.post('/notifications/fcm-token', { token: currentToken, platform: platformType });
              console.log('FCM Token successfully saved to backend:', response.data);
              if (isMobile) alert("Push Notifications Enabled Successfully on Mobile!");
            } catch (apiErr) {
              console.error('Failed to save FCM Token to backend:', apiErr.response?.data || apiErr.message);
              if (isMobile) alert("API Error saving token: " + (apiErr.response?.data?.message || apiErr.message));
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
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(payload.notification?.title || 'SewZella', {
              body: payload.notification?.body || 'New Notification',
              icon: '/vite.svg',
              data: payload.data
            });
          });
        } else {
          new Notification(payload.notification?.title || 'SewZella', {
            body: payload.notification?.body || 'New Notification',
            icon: '/vite.svg',
            data: payload.data
          });
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { fcmToken };
};
