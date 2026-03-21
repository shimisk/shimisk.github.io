const CACHE = "feedback-admin-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {
        // It's ok if some files fail to cache (e.g., CDN imports)
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const requestUrl = new URL(e.request.url);

  if (requestUrl.origin === self.location.origin) {
    const isAppShellRequest = APP_SHELL.some((path) => requestUrl.pathname.endsWith(path.replace(/^\.\//, "/")))
      || e.request.mode === "navigate";

    if (isAppShellRequest) {
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
            return res;
          })
          .catch(() => caches.match(e.request))
      );
      return;
    }
  }

  // Network first for Firebase API calls
  if (e.request.url.includes("firestore.googleapis.com") || e.request.url.includes("esm.sh")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for other resources
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
