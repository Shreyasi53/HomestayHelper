const CACHE_NAME = 'homestay-helper-react-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core offline shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isOllamaOrApi = url.pathname.includes('/api/ollama') || url.pathname.startsWith('/api/') || url.port === '11434';

  // 1. Pass-through for non-GET requests (POST, etc.) and Ollama / API requests without caching
  if (event.request.method !== 'GET' || isOllamaOrApi) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Stale-While-Revalidate caching strategy for normal static GET assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (Airplane mode / Zero Bars) - fallback to cache silently
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
