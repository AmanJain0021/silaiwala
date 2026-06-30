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
