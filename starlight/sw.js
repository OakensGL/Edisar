/* Project Starlight service worker — cache name is versioned so updates replace the old cache. */
const CACHE = 'starlight-v0.6.3';
const PRECACHE = ["./", "./index.html", "./CREDITS.txt", "./assets/angel-eyes-vision-ii.mp3", "./assets/avrill-explosion.ogg", "./assets/avrill.jpg", "./assets/credits-avrill.jpg", "./assets/credits-nebula-oakens.jpg", "./assets/edisar-furious.jpg", "./assets/edisar-rumble.ogg", "./assets/edisar.jpg", "./assets/full-moon-mix.ogg", "./assets/helldrake-extended.ogg", "./assets/intro-deck.jpg", "./assets/last-one-standing-6_initial_0.ogg", "./assets/last-one-standing-6low_0.ogg", "./assets/nebula-angry.jpg", "./assets/nebula.jpg", "./assets/the-last-encounter-mix.ogg", "./assets/thunder-short.ogg", "./assets/thunder-strike.ogg", "./assets/title.jpg", "./assets/zodik-neon-owl.ogg", "./icons/apple-touch-icon.png", "./icons/icon-192-maskable.png", "./icons/icon-192.png", "./icons/icon-512-maskable.png", "./icons/icon-512.png", "./js/audio.js", "./js/config.js", "./js/credits.js", "./js/cutscene.js", "./js/events.js", "./js/features.js", "./js/final.js", "./js/fx.js", "./js/intro.js", "./js/input.js", "./js/main.js", "./js/map.js", "./js/pwa.js", "./js/scores.js", "./js/story.js", "./js/survival.js", "./js/title.js", "./js/zones.js", "./manifest.webmanifest"];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('starlight-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isHTML(request, url) {
  if (request.mode === 'navigate') return true;
  const p = url.pathname;
  return p.endsWith('/') || p.endsWith('/index.html') || p.endsWith('index.html');
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;

  if (isHTML(req, url)) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => { c.put(req, copy); c.put('./index.html', res.clone()); });
        }
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
