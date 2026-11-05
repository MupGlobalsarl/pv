/* MUPGLOBAL SARL – service worker : application disponible hors connexion, mise à jour automatique quand Internet est disponible */
const CACHE = "mupglobal-pv-202611051104";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./installer.html", "./qr-installer.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("mupglobal-pv-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", cp)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })));
});
