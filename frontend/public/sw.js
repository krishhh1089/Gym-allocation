/**
 * GymSlot SRM-AP - Application Shell Service Worker
 * 
 * STRICT SECURITY POLICY:
 * Zero offline caching of dynamic student records, slot allocations, QR code payloads,
 * credentials, or backend API queries. Only immutable static assets (HTML/CSS/JS/Fonts)
 * are stored in the application shell cache.
 */

const CACHE_NAME = 'gymslot-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never cache non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 2. Strict Security Exclusions:
  // Bypass service worker caching completely for any API endpoints, QR tokens,
  // session tokens, user profiles, or dynamic queries.
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/auth') ||
    url.pathname.includes('/qr') ||
    url.pathname.includes('/students') ||
    url.pathname.includes('/attendance') ||
    url.pathname.includes('/slots') ||
    url.pathname.includes('/allocations') ||
    url.pathname.includes('/admin') ||
    url.searchParams.has('token') ||
    url.searchParams.has('session')
  ) {
    // Network-only: never cache sensitive data
    return;
  }

  // 3. For navigation requests (HTML pages), network-first with shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // 4. For static assets (JS, CSS, fonts, SVG icons), Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignore background fetch errors */});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache static JS/CSS chunks
        if (
          url.pathname.startsWith('/assets/') ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.svg') ||
          url.pathname.endsWith('.woff2')
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      });
    })
  );
});

