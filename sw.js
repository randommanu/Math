const V = 'tabuada-v1';
const CORE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache primeiro, atualiza em segundo plano (stale-while-revalidate)
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const ok = u.origin === location.origin || /(googleapis|gstatic)\.com$/.test(u.host);
  if (!ok) return;
  e.respondWith(
    caches.match(r, { ignoreSearch: u.origin === location.origin }).then(hit => {
      const net = fetch(r).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(V).then(c => c.put(r, copy));
        }
        return res;
      }).catch(() => hit || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()));
      return hit || net;
    })
  );
});
