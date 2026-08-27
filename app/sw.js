const CACHE='adn-app-v21';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
  e.respondWith(fetch(r).then(res=>{if(res&&res.ok&&new URL(r.url).origin===location.origin){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp)).catch(()=>{});}return res;})
  .catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));});
