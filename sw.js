// Service Worker for Dr. Savianu Medical Website
// Updated CACHE_NAME to v3 to force a reset of previous caches
const CACHE_NAME = 'savianu-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/logo.png',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Serif:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache resources and force immediate activation
self.addEventListener('install', event => {
  self.skipWaiting(); // Forces this new service worker to become active immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches and take control of the page
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Delete old versions of the cache
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all open tabs immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Network-First Strategy
// This ensures the browser always tries to download the latest version first.
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If the network request is successful, update the cache and return the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // If the user is offline, fall back to the version in the cache
        return caches.match(event.request);
      })
  );
});
