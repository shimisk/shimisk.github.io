const CACHE_VERSION = 'v5';
const CACHE = `petbook-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './petbook.html',
  './manifest.json',
  './petbook.css',
  './petbook.constants.js',
  './petbook.i18n.js',
  './petbook.pickers.js',
  './petbook.modals.js',
  './petbook.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
      self.registration.navigationPreload ? self.registration.navigationPreload.enable().catch(() => {}) : Promise.resolve()
    ])
  );
  self.clients.claim();
});

function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(request, { signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
  });
}

function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (!response || !response.ok) {
        return;
      }
      const clone = response.clone();
      return caches.open(CACHE).then((cache) => cache.put(request, clone));
    })
    .catch(() => {});
}

function networkFirst(request, preloadResponsePromise) {
  const timeoutMs = request.mode === 'navigate' ? 6000 : 2500;
  const networkRequest = Promise.resolve(preloadResponsePromise)
    .then((preloaded) => preloaded || fetchWithTimeout(request, timeoutMs));

  return networkRequest
    .then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return response;
    })
    .catch(async () => {
      updateCacheInBackground(request);
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate') {
        return caches.match('./petbook.html') || caches.match('./');
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(networkFirst(event.request, event.preloadResponse));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./petbook.html');
      }
      return undefined;
    })
  );
});
