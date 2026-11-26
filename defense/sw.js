/* Starlight: Last Station v0.4.6 — cache the app shell for offline / PWA play. */
const CACHE = 'starlight-td-v0.4.6';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './CREDITS.txt',
  './js/config.js',
  './js/audio.js',
  './js/input.js',
  './js/fx.js',
  './js/game.js',
  './js/main.js',
  './js/pwa.js',
  './icons/icon-192.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './assets/title-bg.jpg',
  './assets/crawl-bg.jpg',
  './assets/edisar-scarred.jpg',
  './assets/bazooka-joe.jpg',
  './assets/bazooka-joe-valio.jpg',
  './assets/space-dimensions-retro.ogg',
  './assets/skyfire.ogg',
  './assets/without-fear.ogg',
  './assets/brave-pilots.ogg',
  './assets/battle-in-the-stars.ogg',
  './assets/deathmatch.ogg',
  './assets/space-heroes.ogg',
  './assets/victory-tune.ogg',
  './assets/defeated.ogg',
  './assets/evil-sacrifice-archenemies.ogg',
  './assets/megasong.ogg',
  './assets/phase-zero.ogg',
  './assets/boss-fight-2.ogg',
  './assets/nebula.jpg',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
