// Service worker for the Transformer Inspection PWA.
// Scope is limited to this app (registered from transformer-inspection.html).
// Caches the app shell and jsPDF for full offline use.
var VERSION = 'transformer-inspection-v1';
var SHELL_CACHE = VERSION + '-shell';
var LIB_CACHE   = VERSION + '-lib';

var SHELL = [
  'transformer-inspection.html'
];

var LIBS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', function (event) {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }),
      caches.open(LIB_CACHE).then(function (c) {
        return Promise.all(LIBS.map(function (url) {
          return fetch(url, { mode: 'cors' })
            .then(function (r) { if (r.ok) return c.put(url, r.clone()); })
            .catch(function () {});
        }));
      })
    ]).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf(VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isLib(url) {
  return url.indexOf('cdnjs.cloudflare.com') !== -1;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = req.url;

  if (isLib(url)) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (resp) {
          return caches.open(LIB_CACHE).then(function (c) {
            c.put(req, resp.clone());
            return resp;
          });
        });
      })
    );
    return;
  }

  if (url.indexOf(self.location.origin) === 0 && /transformer-inspection\.html(\?|$)/.test(url)) {
    event.respondWith(
      fetch(req).then(function (resp) {
        return caches.open(SHELL_CACHE).then(function (c) {
          c.put('transformer-inspection.html', resp.clone());
          return resp;
        });
      }).catch(function () {
        return caches.match('transformer-inspection.html');
      })
    );
    return;
  }
});
