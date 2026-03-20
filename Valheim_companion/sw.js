const CACHE_VERSION = "v4";
const APP_SHELL_CACHE = `valheim-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `valheim-runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.json",
  "icon.svg",
  "icon-180.png",
  "constants.jsx",
  "valheim-companion.jsx",
  "companion/panels.css",
  "companion/panels/food-panel.css",
  "companion/panels/armor-panel.css",
  "companion/panels/materials-panel.css",
  "companion/panels/vendors-panel.css",
  "companion/panels/weapons-panel.css",
  "companion/panels/taming-panel.css",
  "companion/panels/farming-panel.css",
  "companion/ui-panels.jsx",
  "companion/panels/tab-bar.jsx",
  "companion/panels/armor-panel.jsx",
  "companion/panels/weapons-panel.jsx",
  "companion/panels/food-panel.jsx",
  "companion/panels/materials-panel.jsx",
  "companion/panels/vendors-panel.jsx",
  "companion/panels/taming-panel.jsx",
  "companion/panels/farming-panel.jsx",
  "data/bosses.json",
  "data/weapons.json",
  "data/armor.json",
  "data/food.json",
  "data/materials.json",
  "data/vendors.json",
  "data/weaponCategories.json",
  "data/foodCategories.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_SHELL_CACHE);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    throw _err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Keep API/data fresh when online, but usable offline.
  if (url.pathname.includes("/data/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // App source and styles should stay fresh when online.
  if (
    url.pathname.endsWith(".jsx") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Third-party assets can use cache first.
  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documents use network first with cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});