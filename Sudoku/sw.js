/* ============================================================
   sw.js — service worker for offline PWA support
   ============================================================ */

const CACHE = 'sudoku-sweetie-v3';

const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/background.css',
  './css/home.css',
  './css/game.css',
  './css/overlays.css',
  './js/app.js',
  './js/game.js',
  './js/board.js',
  './js/input.js',
  './js/timer.js',
  './js/storage.js',
  './js/sudoku.js',
  './js/state.js',
  './manifest.json',
  './assets/images/logo.png',
  './assets/images/logo-32.png',
  './assets/images/logo-180.png',
  './assets/images/logo-192.png',
  './assets/images/logo-512.png',
  './assets/images/logo-maskable-512.png',
  './assets/images/icon-easy.png',
  './assets/images/icon-medium.png',
  './assets/images/icon-hard.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
