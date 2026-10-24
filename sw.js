/* Nutrimi — service worker: l'app si apre anche senza connessione */
var CACHE = 'nutrimi-v3';
var SHELL = ['./', 'index.html', 'config.js', 'css/app.css', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png',
  'js/data/foods.js', 'js/data/recipes.js', 'js/core.js', 'js/cloud.js', 'js/scanner.js', 'js/expiry.js', 'js/views.js', 'js/app.js'];

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
    body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'nutrimi-scadenze', data: { url: d.url || './' }
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
