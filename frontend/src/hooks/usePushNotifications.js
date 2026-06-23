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
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          // Use VAPID key for web push
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          const currentToken = await getToken(messaging, { vapidKey: vapidKey });
          
          if (currentToken) {
            setFcmToken(currentToken);
            console.log('FCM Token:', currentToken);
            
            // Send token to backend
            await api.post('/notifications/fcm-token', { fcmToken: currentToken });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Notification permission denied or dismissed.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    requestPermissionAndGetToken();

    // Listen for foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground Message received:', payload);
      
      // Play sound for all foreground push notifications based on role
      try { playNotificationSound(user?.role || 'customer'); } catch(e) { console.error(e); }
      
      // Optional: You could trigger a local React toast here if you wanted.
      // Since we already have socket.io for real-time in-app toasts, 
      // we might not need to show FCM payloads while the app is active,
      // but the event listener is here if needed.
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  return { fcmToken };
};
