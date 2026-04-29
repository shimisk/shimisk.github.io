const CACHE_NAME = 'grax-rooms-cache-v1';

// Add all static assets you want cached
const ASSETS = [
  '/',               // root
  '/index.html',
  '/styles.css',
  '/app.js',

];

// Install: cache everything
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network first for HTML, cache first for everything else
self.addEventListener('fetch', event => {
  const req = event.request;

  // HTML → network first (ensures updates)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Other files → cache first
  event.respondWith(
    caches.match(req).then(cached => {
      return (
        cached ||
        fetch(req).then(res => {
          // Cache new files
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
      );
    })
  );
});
