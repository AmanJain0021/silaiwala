import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './utils/toastNotifier'
import './styles/index.css'
import App from './App.jsx'

import ErrorBoundary from './ErrorBoundary.jsx'
import OfflineDetector from './components/Common/OfflineDetector.jsx'

// Register Service Worker only in production.
// In Vite dev, a SW can cache index.html and leave a blank white screen when the
// module graph changes or the dev server restarts.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    if (import.meta.env.DEV) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        console.log('[SW] Unregistered service workers for Vite dev');
      } catch (error) {
        console.warn('[SW] Failed to unregister in dev:', error);
      }
      return;
    }

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
    <BrowserRouter>
      <GoogleOAuthProvider clientId={clientId}>
        <ErrorBoundary>
          <OfflineDetector>
            <App />
          </OfflineDetector>
        </ErrorBoundary>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
