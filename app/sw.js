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
  event.respondWith(
    caches.open('offline').then(cache => {
      return cache.match(event.request);
    }).then(response => {
      if (response !== undefined) {
        return response;
      } else {
        return fetch(event.request).then(response => {
          let responseClone = response.clone();
          caches.open('offline').then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        }).catch(() => {
          return new Response('No network & cache failed.');
        });
      }
    })
  );
});
