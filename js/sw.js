// Service Worker para caching offline y mejora de rendimiento
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `ademincol-${CACHE_VERSION}`;
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/servicios.html',
    '/nuestra-empresa.html',
    '/contactenos.html',
    '/css/custom-header.css',
    '/css/wordpress-core.css',
    '/css/critical.css',
    '/js/sticky-header.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Network first for HTML files to ensure freshness
    if (request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache first for static assets
    event.respondWith(
        caches.match(request)
            .then(response => response || fetch(request))
            .catch(() => {
                if (request.destination === 'image') {
                    return new Response('', { status: 204 });
                }
            })
    );
});
