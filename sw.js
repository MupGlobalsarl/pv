/* MUPGLOBAL SARL – service worker : application disponible hors connexion, mise à jour automatique quand Internet est disponible */
const CACHE = "mupglobal-pv-202611202115";
const IMG = "mupglobal-pv-img"; /* photos des produits : cache durable, rempli à la demande puis complété en arrière-plan */
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-192.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./installer.html", "./qr-installer.png", "./mupsolar-logo.webp"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("mupglobal-pv-") && k !== CACHE && k !== IMG).map((k) => caches.delete(k)))).then(() => self.clients.claim()).then(() => { imgFill(); })); });
/* après l'installation : télécharge tranquillement les photos manquantes pour qu'elles soient disponibles hors connexion, et retire les anciennes */
function imgFill() {
  return fetch("./img/list.json", { cache: "no-store" }).then((r) => r.json()).then((list) => caches.open(IMG).then(async (c) => {
    const want = new Set(list.map((f) => new URL("./" + f, self.registration.scope).href));
    for (const req of await c.keys()) if (!want.has(req.url)) await c.delete(req);
    for (const u of want) { if (!(await c.match(u))) { try { const r = await fetch(u); if (r.ok) await c.put(u, r); } catch (e) { return; } } }
  })).catch(() => {});
}
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  if (u.pathname.startsWith(new URL("./pompage/", self.registration.scope).pathname)) return; /* application Pompage : gérée par son propre service worker */
  if (u.pathname.includes("/img/") && !u.pathname.endsWith("list.json")) {
    e.respondWith(caches.open(IMG).then((c) => c.match(e.request).then((m) => m || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (e.request.mode === "navigate") {
    /* ouverture rapide : la page enregistrée s'affiche tout de suite si le réseau tarde (plus de 1,2 s) ;
       la nouvelle version est téléchargée en arrière-plan. « ?u= » (bouton Mettre à jour) force le réseau. */
    const key = /installer\.html$/.test(u.pathname) ? "./installer.html" : "./index.html", fresh = /[?&]u=\d/.test(u.search);
    const net = fetch(e.request).then((r) => { if (r.ok) { const cp = r.clone(); return caches.open(CACHE).then((c) => c.put(key, cp)).then(() => r, () => r); } return r; });
    e.waitUntil(net.then(() => {}, () => {}));
    e.respondWith(fresh ? net.catch(() => caches.match(key)) : caches.match(key).then((m) => m ? Promise.race([net.then((r) => (r.ok ? r : m), () => m), new Promise((res) => setTimeout(() => res(m), 1200))]) : net));
    return;
  }
  e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })));
});
