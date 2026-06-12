importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBqPY08wpsJp6EWrOmigkmE90JmTlx6iWg",
  authDomain: "silaiwala-c2efd.firebaseapp.com",
  projectId: "silaiwala-c2efd",
  storageBucket: "silaiwala-c2efd.firebasestorage.app",
  messagingSenderId: "681027877595",
  appId: "1:681027877595:web:2e7cd04ebea623f1b3eafe"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
