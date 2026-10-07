/**
 * GeoSnap — Service Worker di cache (Fase 5, Task 5.2).
 *
 * Strategia cache-first per tutti gli asset statici del bundle.
 * Garantisce il funzionamento offline dopo il primo caricamento.
 *
 * Riferimento: §12.1 dei Requisiti Tecnici MVP1.
 */

const CACHE_NAME = 'geosnap-v1';

// Installazione: pre-caching dell'app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './icon-192.svg',
        './icon-512.svg',
        './favicon.svg',
        './manifest.webmanifest',
      ]);
    }),
  );
  // Attiva immediatamente senza attendere che i tab esistenti si chiudano.
  self.skipWaiting();
});

// Attivazione: pulizia delle cache vecchie.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    }),
  );
  // Prende il controllo immediato di tutti i client.
  self.clients.claim();
});

// Fetch: cache-first per le richieste same-origin.
self.addEventListener('fetch', (event) => {
  // Solo richieste GET same-origin.
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached !== undefined) {
        // Aggiorna la cache in background (stale-while-revalidate leggero).
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, clone);
                });
              }
            })
            .catch(() => {
              // Errore di rete: la cache è già stata restituita.
            }),
        );
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }),
  );
});
