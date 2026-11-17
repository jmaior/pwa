// Service worker for the Site Service Report PWA.
// Scope: site-service-report.html only. Caches the app shell and jsPDF CDN
// script on first load so the form works fully offline.
var VERSION = 'site-service-report-v1';
var SHELL_CACHE = VERSION + '-shell';
var CDN_CACHE = VERSION + '-cdn';

var SHELL = [
  'site-service-report.html'
];

var CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }),
      caches.open(CDN_CACHE).then(function (c) {
        return Promise.all(CDN.map(function (url) {
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

function isCdn(url) {
  return /cdnjs\.cloudflare\.com\/ajax\/libs\/jspdf\//.test(url);
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = req.url;

  // jsPDF CDN: cache-first (stable, versioned URL).
  if (isCdn(url)) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req, { mode: 'cors' }).then(function (resp) {
          return caches.open(CDN_CACHE).then(function (c) {
            c.put(req, resp.clone());
            return resp;
          });
        });
      })
    );
    return;
  }

  // App shell: network-first so updates land; fall back to cache when offline.
  if (url.indexOf(self.location.origin) === 0 && /site-service-report\.html(\?|$)/.test(url)) {
    event.respondWith(
      fetch(req).then(function (resp) {
        return caches.open(SHELL_CACHE).then(function (c) {
          c.put('site-service-report.html', resp.clone());
          return resp;
        });
      }).catch(function () {
        return caches.match('site-service-report.html');
      })
    );
    return;
  }
});
