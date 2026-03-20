const CACHE_VERSION = "v5";
const STATIC_CACHE = `diary-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `diary-runtime-${CACHE_VERSION}`;
const THIRD_PARTY_CACHE = `diary-third-party-${CACHE_VERSION}`;

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/styles/base.css",
  "./src/styles/layout.css",
  "./src/styles/components.css",
  "./src/db.js",
  "./src/utils.js",
  "./src/fonts.js",
  "./src/themes.js",
  "./src/main.js",
  "./src/components/App.js",
  "./src/components/HomeView.js",
  "./src/components/EntryCard.js",
  "./src/components/EntryEditor.js",
  "./src/components/EntryReader.js",
  "./src/components/StickerPicker.js",
  "./src/components/LockScreen.js",
  "./src/components/PinSetup.js",
  "./src/components/SettingsView.js",
  "./assets/witchy/bg.png",
  "./assets/witchy/header.png",
  "./assets/witchy/card-1.png",
  "./assets/witchy/card-2.png",
  "./assets/witchy/card-3.png",
  "./assets/witchy/card-4.png",
  "./assets/witchy/card-5.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/witchy/stickers/angry.png",
  "./assets/witchy/stickers/anxious.png",
  "./assets/witchy/stickers/cozy.png",
  "./assets/witchy/stickers/exhaust.png",
  "./assets/witchy/stickers/happy.png",
  "./assets/witchy/stickers/in-love.png",
  "./assets/witchy/stickers/magical.png",
  "./assets/witchy/stickers/mysterious.png",
  "./assets/witchy/stickers/sad.png",
  "./assets/witchy/stickers/sleepy.png",
];

const THIRD_PARTY = [
  "https://esm.sh/react@18.3.1?dev",
  "https://esm.sh/react-dom@18.3.1/client?dev",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const staticCache = await caches.open(STATIC_CACHE);
    await staticCache.addAll(APP_SHELL);

    const thirdPartyCache = await caches.open(THIRD_PARTY_CACHE);
    await Promise.allSettled(THIRD_PARTY.map(async url => {
      const response = await fetch(url, { mode: "cors" });
      if (response.ok) {
        await thirdPartyCache.put(url, response.clone());
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, RUNTIME_CACHE, THIRD_PARTY_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => !keep.has(key)).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(handleNavigation(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (APP_SHELL.some(path => sameAsset(url, path))) {
      event.respondWith(networkFirst(event.request, STATIC_CACHE));
      return;
    }

    if (url.pathname.includes("/assets/")) {
      event.respondWith(cacheFirst(event.request, RUNTIME_CACHE));
      return;
    }

    event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    return;
  }

  if (url.hostname === "esm.sh" || url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(staleWhileRevalidate(event.request, THIRD_PARTY_CACHE));
  }
});

async function handleNavigation(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    return (await caches.match("./index.html")) || (await caches.match("./"));
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return (await caches.match(request)) || new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || networkPromise || new Response("Offline", { status: 503, statusText: "Offline" });
}

function sameAsset(url, relativePath) {
  const absolute = new URL(relativePath, self.location.href);
  return url.href === absolute.href;
}
