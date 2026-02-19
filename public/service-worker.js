const CACHE_NAME = 'madi-jake-wedding-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/hero-bg.jpg',
  '/images/homrst-resort-matthew-majeka-1170.jpg',
  '/images/old-course-pavilion-reception-set-up.jpg',
  '/images/great-hall-1170x660.jpg',
  '/images/homrst-warm-pools-couple.jpg',
  '/images/homrst-omni-homestead-resort-golf-cascades-1.jpg',
  '/images/homrst-omni-homestead-resort-golf-cascades-5.jpg',
  '/images/fire-pit-serenity-garden-1170x660.jpg',
  '/images/creek-hiking-1170x660.jpg'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls (don't cache dynamic data)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
      })
  );
});
