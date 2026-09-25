var SHELL = 'japan2026-shell-v7', TILES = 'japan2026-tiles-v1';
var SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './styles.css', './places.js', './app.js',
  './vendor/leaflet.css', './vendor/leaflet.js', './vendor/atkinson-400.woff2', './vendor/atkinson-700.woff2'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(SHELL_FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== SHELL && k !== TILES; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.indexOf('basemaps.cartocdn.com') !== -1) {
    // map tiles: use saved copy if we have one, otherwise download and keep it
    e.respondWith(caches.open(TILES).then(function (c) {
      return c.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) { if (res.ok || res.type === 'opaque') c.put(e.request, res.clone()); return res; });
      });
    }));
    return;
  }
  // page: try the network first so updates show up, fall back to the saved copy offline
  e.respondWith(fetch(e.request).then(function (res) {
    if (res.ok && url.indexOf(self.location.origin) === 0) {
      var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(e.request, copy); });
    }
    return res;
  }).catch(function () { return caches.match(e.request).then(function (hit) { return hit || caches.match('./index.html'); }); }));
});
