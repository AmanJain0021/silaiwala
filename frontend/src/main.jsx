import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
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

// Ensure window scroll is always at top-left and prevent browser scroll restoration shifting
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineDetector>
          <App />
        </OfflineDetector>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
