/* ADN Minero · Service Worker de notificaciones push */
const WORKER = 'https://adn-muro.simonrovi.workers.dev';
const ICON = 'https://simonrovi-web.github.io/adn-minero/app/icon-192.png';
const HOME = 'https://simonrovi-web.github.io/adn-minero/';

const OFFLINE_CACHE = 'adn-offline-v1';
const OFFLINE_HTML = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>Sin conexión · ADN Minero</title><style>html,body{height:100%;margin:0;font-family:system-ui,sans-serif;'+
  'background:#141110;color:#f4ece5;display:grid;place-items:center;text-align:center;padding:24px}'+
  '.c{max-width:340px}.e{font-size:44px}h1{font-size:20px;margin:12px 0 6px}p{color:#c9b7a5;font-size:14px;line-height:1.5;margin:0}'+
  'a{display:inline-block;margin-top:18px;background:linear-gradient(135deg,#f0d7b6,#cf9b6f 55%,#b5734f);color:#2a1c12;'+
  'font-weight:700;text-decoration:none;padding:12px 20px;border-radius:12px}</style>'+
  '<div class="c"><div class="e">⛏️📡</div><h1>Sin conexión</h1><p>No hay internet ahora mismo. Los paneles que ya abriste funcionan sin conexión; '+
  'este todavía no lo has visitado.</p><a href="javascript:location.reload()">Reintentar</a></div>';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  try { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('adn-offline-') && k !== OFFLINE_CACHE).map(k => caches.delete(k))); } catch (e) {}
  await self.clients.claim();
})()));

// Caché red-primero con respaldo offline (solo mismo origen; no toca CDNs ni APIs)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== location.origin) return; // deja pasar Tailwind/fuentes/APIs
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.status === 200) { const cp = res.clone(); caches.open(OFFLINE_CACHE).then(c => c.put(req, cp)).catch(() => {}); }
      return res;
    } catch (err) {
      try { const cached = await caches.match(req); if (cached) return cached; } catch (e2) {}
      if (req.mode === 'navigate') return new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      return new Response('', { status: 504 });
    }
  })());
});

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data = { titulo: 'ADN Minero', cuerpo: 'Nueva alerta de la minería.', url: HOME };
    // El push viene sin cuerpo: pedimos el detalle de la última alerta.
    try {
      if (event.data) { data = event.data.json(); }
      else { data = await fetch(WORKER + '/push/latest').then(r => r.json()); }
    } catch (e) {}
    await self.registration.showNotification(data.titulo || 'ADN Minero', {
      body: data.cuerpo || '',
      icon: ICON,
      badge: ICON,
      tag: 'adn-alerta',
      renotify: true,
      data: { url: data.url || HOME }
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || HOME;
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.indexOf('simonrovi-web.github.io/adn-minero') >= 0 && 'focus' in c) return c.focus(); }
    return clients.openWindow(url);
  })());
});
