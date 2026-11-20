// Stillgestanden! – Service Worker
// Immer zuerst aus dem Netz laden (damit Updates sofort ankommen),
// nur ohne Verbindung auf die gespeicherte Version zurückfallen.
const CACHE = 'stillgestanden-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Nur eigene Dateien; Server-Anfragen an Supabase, Karten usw. laufen unverändert
  if(e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  e.respondWith(
    // Seite selbst immer frisch vom Server holen, nicht aus dem Browser-Zwischenspeicher
    (e.request.mode === 'navigate' || u.pathname.endsWith('/index.html') ? fetch(e.request.url, {cache:'no-cache', credentials:'same-origin'}) : fetch(e.request)).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
