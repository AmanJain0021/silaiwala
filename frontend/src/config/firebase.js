import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBqPY08wpsJp6EWrOmigkmE90JmTlx6iWg",
  authDomain: "silaiwala-c2efd.firebaseapp.com",
  projectId: "silaiwala-c2efd",
  storageBucket: "silaiwala-c2efd.firebasestorage.app",
  messagingSenderId: "681027877595",
  appId: "1:681027877595:web:2e7cd04ebea623f1b3eafe",
  measurementId: "G-P2W2WKE5BC"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
