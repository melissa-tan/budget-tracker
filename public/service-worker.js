
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/index.js',
    '/manifest.webmanifest',
    '/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

self.addEventListener("install", (e) => {
    e.waitUntil(caches.open(DATA_CACHE_NAME)
        .then((cache) => cache.add('/api/transaction'))
    );
    e.waitUntil(caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }
                })
            )
        })
    )
    self.clients.claim();
})

self.addEventListener("fetch", (e) => {
    if (e.request.url.includes('/api')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME)
                .then((cachedResponse) => {
                    return fetch(e.request)
                        .then((response) => {
                            if (response.status === 200) {
                                cachedResponse.put(e.request.url, response.clong());
                            }
                            return response;
                        })
                        .catch((err) => {
                            return cachedResponse.match(e.request);
                        });
                }).catch((err) => console.log(err))
        );
        return;
    }
    e.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                return response || fetch(event.request);
            });
        })
    );


})