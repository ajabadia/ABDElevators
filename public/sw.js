const CACHE_NAME = 'abd-field-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/technician',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Fallback for document queries in offline
        if (event.request.url.includes('/api/intelligence/explorer')) {
          return caches.match('/offline-search-fallback.json');
        }
      });
    })
  );
});
