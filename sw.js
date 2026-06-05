// Service Worker — Dr. Savianu Medical Website
// Strategie: Stale-While-Revalidate per HTML, Cache-First per img/font, Network-First per JS/CSS
const CACHE_NAME = 'savianu-v306';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/faq.html',
  '/offline.html',
  '/styles.css',
  '/app.js',
  '/config.js',
  '/manifest.json',
  '/logo.png',
  '/bluelogo.png',
  '/bronzelogo.png'
];

function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin;
}

// Cache-First: per risorse statiche immutabili (immagini, font)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    if (request.destination === 'image') {
      return new Response('', { status: 408, statusText: 'Offline' });
    }
    return caches.match('/offline.html');
  }
}

// Network-First: per JS/CSS (priorità alla rete, fallback cache)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    // offline.html solo per navigazione HTML, non per JS/CSS/immagini
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
      return caches.match('/offline.html');
    }
    return new Response('', { status: 408, statusText: 'Network Error/Offline' });
  }
}

// Messaggi dalla pagina (SKIP_WAITING per l'update toast)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install: pre-cache risorse essenziali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate: pulizia cache vecchie + controllo immediato dei client
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: routing strategico per tipo di risorsa
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!isSameOrigin(event.request.url)) return;

  const { destination, mode } = event.request;

  // HTML (navigazione): Network-First — priorità ai dati aggiornati (assenze, orari)
  // Cache come fallback solo in assenza di rete
  if (mode === 'navigate' || destination === 'document') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  // Immagini e font: Cache-First
  if (destination === 'image' || destination === 'font') {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // JS, CSS e tutto il resto: Network-First
  event.respondWith(networkFirst(event.request));
});
