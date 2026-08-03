importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAI_-n3t-xKFtr02gr4kY30WdlnP-9cV4A",
  authDomain: "sewzella-26c9e.firebaseapp.com",
  projectId: "sewzella-26c9e",
  storageBucket: "sewzella-26c9e.firebasestorage.app",
  messagingSenderId: "568290631976",
  appId: "1:568290631976:web:09bb1bdd21deff72f2301d"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Clean background handler for Firebase Cloud Messaging
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background FCM message:', payload);
  
  const title = payload?.notification?.title || payload?.data?.title || 'SewZella Notification 🔔';
  const body = payload?.notification?.body || payload?.data?.body || payload?.data?.message || 'New notification received';
  const url = payload?.data?.url || payload?.data?.targetUrl || '/';
  
  const origin = self.location ? self.location.origin : '';
  const iconPath = origin ? origin + '/logo.png' : '/logo.png';

  const notificationOptions = {
    body: body,
    icon: iconPath,
    badge: iconPath,
    data: {
      ...payload.data,
      url: url
    },
    vibrate: [200, 100, 200],
    requireInteraction: true
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Handle notification click to navigate user to target URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
