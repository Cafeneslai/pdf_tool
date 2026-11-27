/**
 * PenguTools Service Worker 🐧
 * Offline Caching & Progressive Web App Engine
 */

const CACHE_NAME = 'pengutools-v1.5.0';
const SHARE_CACHE = 'pengutools-share';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/mascot.js',
  './assets/js/tools/pdf-tools.js',
  './assets/js/tools/image-tools.js',
  './assets/js/tools/file-tools.js',
  './assets/libs/pdf-lib.min.js',
  './assets/libs/pdf.min.js',
  './assets/libs/pdf.worker.min.js',
  './assets/libs/jszip.min.js',
  './assets/images/icon.svg',
  './assets/images/og-preview.png'
];

// Install: Cache core application assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== SHARE_CACHE) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate / Network-First with Cache Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // PWA Share Target: files shared from other apps arrive as a POST, stash them and open the picker
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      const files = formData.getAll('files').filter(f => f && typeof f === 'object' && f.size > 0);
      await caches.delete(SHARE_CACHE);
      const cache = await caches.open(SHARE_CACHE);
      await Promise.all(files.map((file, i) => cache.put(`./shared/${i}`, new Response(file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) }
      }))));
      return Response.redirect('./index.html#/shared', 303);
    })());
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Ignore cross-origin non-http schemes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Fetch from network to update cache in background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline)
        return cachedResponse;
      });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
