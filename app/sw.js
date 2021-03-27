self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('offline').then(cache => {
    return cache.add(new Request('offline.html', { cache: 'reload' }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(new Promise(async (resolve) => {
    const cache = await caches.open('offline');
    try {
      const response = await fetch(event.request);
      const responseClone = response.clone();
      cache.put(event.request, responseClone);
      resolve(response);
    } catch {
      const response = await cache.match(event.request);
      if (response !== undefined) {
        resolve(response);
      } else {
        const offlineResponse = await cache.match('offline.html');
        if (offlineResponse !== undefined) {
          resolve(offlineResponse);
        } else {
          resolve(new Response('No network & cache failed.'));
        }
      }
    }
  }));
});
