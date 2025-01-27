const CACHE_NAME = 'abfahrtsmonitor-v1';
const ASSETS = [
    '/Boids-Algo/',
    '/Boids-Algo/index.html',
    '/Boids-Algo/manifest.json',
    '/Boids-Algo/icons/icon-128x128.png',
    '/Boids-Algo/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
