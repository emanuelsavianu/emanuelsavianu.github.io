// Service Worker for Dr. Savianu Medical Website
// Updated CACHE_NAME to v6 to force a reset of previous caches and clear the Modulo Farmaci
const CACHE_NAME = 'savianu-v36';
const urlsToCache = [
  '/',
  '/index.html',
  '/faq.html',
  '/android.html',
  '/ferie.html',
  '/installazione.html',
  '/calcolatore-ferie.html',
  '/privacy.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/logo.png'
];

// Install event - force immediate activation
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network-First Strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with the freshest version
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request) || caches.match('/offline.html')) // Fallback to cache, then offline page
  );
});