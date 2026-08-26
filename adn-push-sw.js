/* ADN Minero · Service Worker de notificaciones push */
const WORKER = 'https://adn-muro.simonrovi.workers.dev';
const ICON = 'https://simonrovi-web.github.io/adn-minero/app/icon-192.png';
const HOME = 'https://simonrovi-web.github.io/adn-minero/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

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
