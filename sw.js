
const CACHE = 'vetcare-world-v7';

const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith('vetcare-world-') &&
              key !== CACHE
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE)
            .then(cache => cache.put(request, copy));
        }

        return response;
      })
      .catch(() =>
        caches.match(request)
          .then(cached => {
            if (cached) return cached;

            if (request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return new Response(
              'You are offline. Please connect to the internet.',
              {
                status: 503,
                headers: {
                  'Content-Type': 'text/plain'
                }
              }
            );
          })
      )
  );
});
