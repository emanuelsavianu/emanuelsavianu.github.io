// Service Worker — Dr. Savianu Medical Website
// Strategie: Network-First per HTML, Cache-First per img/font, Network-First per JS/CSS
const CACHE_NAME = 'savianu-v443';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/404.html',
  '/styles.css',
  '/app.js',
  '/chrome.js',
  '/config.js',
  '/manifest.json',
  '/assets/bronzelogo-192.png',
  '/assets/css/offline.css?v=1',
  '/assets/fonts/fonts.css',
  '/assets/fonts/montserrat-var-latin.woff2',
  '/assets/fonts/montserrat-var-latin-ext.woff2',
  '/assets/fonts/cormorant-garamond-var-latin.woff2',
  '/assets/fonts/cormorant-garamond-var-latin-ext.woff2',
  '/assets/fontawesome/css/fontawesome.min.css',
  '/assets/fontawesome/css/solid.subset.css',
  '/assets/fontawesome/webfonts/fa-solid-900.subset.woff2',
];

function isSameOrigin(url) {
  return new URL(url).origin === self.location.origin;
}

// Matching tollerante alla query string.
// Gli asset sono versionati (`/styles.css?v=20261122f`, `/app.js?v=…`,
// `/chrome.js?v=…`): senza `ignoreSearch` la chiave della cache non combacia
// mai con la URL precachata e, offline, CSS/JS/font non si trovavano. Con
// `ignoreSearch` una richiesta versionata trova l'entry precachata.
function matchCached(request) {
  return caches.match(request, { ignoreSearch: true });
}


// Cache-First: per risorse statiche immutabili (immagini, font)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await matchCached(request);
  if (cachedResponse) return cachedResponse;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Fallback offline. `offline.html` va servito SOLO a una navigazione: per
    // un font, un CSS o un'immagine servire un documento HTML significa
    // consegnare al browser un asset "valido" ma corrotto (e, su un font, un
    // errore di parsing al posto di un 404). Qui si risponde 408 e basta.
    if (request.mode === 'navigate' || request.destination === 'document') {
      return caches.match('/offline.html', { ignoreSearch: true });
    }
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// Network-First: per JS/CSS (priorità alla rete, fallback cache)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Gli asset sono versionati (`/styles.css?v=YYYYMMDDx`): usare la URL
      // integra come chiave crea una entry NUOVA a ogni bump del `?v=`,
      // lasciando in cache la vecchia `/styles.css` precachata (bloat che
      // cresce a ogni release) e senza aggiornarla. Si normalizza la chiave
      // togliendo la query di versione, così l'entry precachata viene
      // aggiornata sul posto.
      const url = new URL(request.url);
      if (url.searchParams.has('v')) url.search = '';
      cache.put(url.href, response.clone());
    }
    return response;
  } catch (e) {
    const cachedResponse = await matchCached(request);
    if (cachedResponse) return cachedResponse;
    // offline.html solo per navigazione HTML, non per JS/CSS/immagini
    if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
      return caches.match('/offline.html', { ignoreSearch: true });
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
