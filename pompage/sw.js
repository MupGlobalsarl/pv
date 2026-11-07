/* ancienne adresse : se désinstalle et vide son cache */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("mupglobal-pompe-")).map((k) => caches.delete(k)))).then(() => self.registration.unregister())); });
