const CACHE_NAME = 'sewzella-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sewzella_logo.jpeg',
  '/vite.svg'
];

const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>SewZella - Offline</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; text-align: center; }
    .card { background: #1e293b; border-radius: 24px; padding: 40px 24px; max-width: 420px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid #334155; }
    .icon { width: 72px; height: 72px; background: rgba(239, 68, 68, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #f87171; }
    .icon svg { width: 36px; height: 36px; }
    h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }
    .btn { background: linear-gradient(135deg, #843d9b, #6366f1); color: white; border: none; padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.2s; box-shadow: 0 4px 12px rgba(132, 61, 155, 0.3); }
    .btn:active { transform: scale(0.97); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(239, 68, 68, 0.2); border-radius: 20px; font-size: 12px; color: #fca5a5; margin-bottom: 20px; font-weight: 600; }
    .dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; display: inline-block; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 010-7.072m-2.829 2.829L3 3m0 0l18 18M9.172 9.172a3 3 0 014.242 0"/>
      </svg>
    </div>
    <div class="badge"><span class="dot"></span> No Internet Connection</div>
    <h1>Web Page Offline</h1>
    <p>Please check your cellular data or Wi-Fi connection and tap below to retry.</p>
    <button class="btn" onclick="window.location.reload()">Try Reconnecting</button>
  </div>
  <script>
    window.addEventListener('online', () => window.location.reload());
  </script>
</body>
</html>`;

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache failed for some assets:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Ignore non-GET requests or WebSockets
  if (request.method !== 'GET' || request.url.startsWith('ws://') || request.url.startsWith('wss://')) {
    return;
  }

  // Handle HTML navigation requests
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => {
          // OFFLINE: Return cached index.html or embedded fallback HTML
          const cachedIndex = await caches.match('/index.html') || await caches.match('/');
          if (cachedIndex) return cachedIndex;
          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background cache update if online
        fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
