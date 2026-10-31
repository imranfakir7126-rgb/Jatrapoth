var CACHE = 'jp-shell-v1';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function fromNet(req, ms) {
  return new Promise(function (ok, no) {
    var t = setTimeout(function () { no(new Error('timeout')); }, ms);
    fetch(req).then(function (r) { clearTimeout(t); ok(r); }, function (e) { clearTimeout(t); no(e); });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request; if (req.method !== 'GET') return;
  var u = new URL(req.url);
  var same = u.origin === self.location.origin, font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!same && !font) return;
  e.respondWith(
    fromNet(req, req.mode === 'navigate' ? 4000 : 8000).then(function (r) {
      if (r && (r.ok || r.type === 'opaque')) { var c = r.clone(); caches.open(CACHE).then(function (ch) { ch.put(req, c); }); }
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (m) {
        if (m) return m;
        if (req.mode === 'navigate') return caches.match(self.registration.scope).then(function (x) { return x || caches.match('./'); });
        return Response.error();
      });
    })
  );
});
