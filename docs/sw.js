// ============================================================
// App-shell service worker for the FSA mock test page.
// ============================================================
// It precaches mock.html and mock-bridge.js so the page opens
// offline. It also runtime-caches other same-origin GETs on
// first load. Bump CACHE_VERSION on every deploy so clients
// drop the old cache and pick up the new files.
//
// All precache paths are relative. The site runs under /pwa/
// on GitHub Pages, so a leading slash would break the cache.
// ============================================================

var CACHE_VERSION = "mock-shell-v1";
var PRECACHE = ["mock.html", "mock-bridge.js", "manifest.webmanifest"];

self.addEventListener("install", function (e) {
  // Make the new worker active without a wait for old tabs to close.
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) { return c.addAll(PRECACHE); })
  );
});

self.addEventListener("activate", function (e) {
  // Delete caches from older versions, then control open pages.
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) { return caches.delete(k); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) { return hit; }
      return fetch(e.request).then(function (resp) {
        // Runtime-cache same-origin GETs so repeat loads work offline.
        if (resp.ok && e.request.url.indexOf(self.location.origin) === 0) {
          var copy = resp.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        // Offline and not in cache: for a page load, return the shell.
        if (e.request.mode === "navigate") { return caches.match("mock.html"); }
      });
    })
  );
});
