import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles/index.css'
import App from './App.jsx'

import ErrorBoundary from './ErrorBoundary.jsx'
import OfflineDetector from './components/Common/OfflineDetector.jsx'

// Register Service Workers with scope: '/'
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Only register sw.js which now contains Firebase Messaging


    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('[SW] ServiceWorker registered with scope:', registration.scope);
      },
      (error) => {
        console.warn('[SW] ServiceWorker registration failed:', error);
      }
    );
  });
}

// Get client ID from env or use a placeholder
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder_client_id';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ErrorBoundary>
        <OfflineDetector>
          <App />
        </OfflineDetector>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  </StrictMode>,
)
