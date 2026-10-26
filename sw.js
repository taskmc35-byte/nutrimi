/* Nutrimi — service worker: l'app si apre anche senza connessione */
var CACHE = 'nutrimi-v9';
var SHELL = ['./', 'index.html', 'config.js', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/mark.svg', 'icons/icon-192.png',
  'icons/ui/home.png', 'icons/ui/cart.png', 'icons/ui/jar.png', 'icons/ui/pot.png', 'icons/ui/user.png', 'icons/ui/scan.png', 'icons/ui/plus.png', 'icons/ui/minus.png', 'icons/ui/check.png', 'icons/ui/x.png', 'icons/ui/trash.png', 'icons/ui/search.png', 'icons/ui/alert.png', 'icons/ui/clock.png', 'icons/ui/link.png', 'icons/ui/chev.png', 'icons/ui/leaf.png', 'icons/ui/cloud.png', 'icons/ui/phone.png', 'icons/ui/bell.png', 'icons/ui/camera.png',
  'js/data/foods.js', 'js/data/recipes.js', 'js/core.js', 'js/cloud.js', 'js/scanner.js', 'js/expiry.js', 'js/views.js', 'js/diary.js', 'js/app.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase, Open Food Facts e font passano dalla rete
  // rete prima, cache come riserva: gli aggiornamenti arrivano subito
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('index.html'); }); }));
});

/* notifiche inviate dal server alle 9:00 */
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Nutrimi', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Nutrimi', {
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'nutrimi-scadenze', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow(url);
  }));
});
