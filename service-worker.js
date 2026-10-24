const CACHE_NAME = "nursepro-cache-v2";

const APP_URL = new URL("./", self.registration.scope).href;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.add(APP_URL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.startsWith("nursepro-cache-") &&
                     key !== CACHE_NAME;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(function (cache) {
                return cache.put(APP_URL, copy);
              });
          }

          return response;
        })
        .catch(function () {
          return caches.match(APP_URL);
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request)
      .then(function (cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(function (response) {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(function (cache) {
                return cache.put(request, copy);
              });
          }

          return response;
        });
      })
  );
});