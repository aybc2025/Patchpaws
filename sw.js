// Patchpaws service worker. Precaches the whole app so it plays fully offline.
// Bump VERSION on every release; tools/check-precache.mjs verifies the file list.
const VERSION = 'v2';
const PREFIX = 'patchpaws-';
const CACHE = PREFIX + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data/levels.json',
  './fonts/poppins-400.woff',
  './fonts/poppins-500.woff',
  './fonts/poppins-700.woff',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './css/tokens.css',
  './css/base.css',
  './css/board.css',
  './css/game.css',
  './css/home.css',
  './css/levels.css',
  './css/sheets.css',
  './js/main.js',
  './js/router.js',
  './js/audio/sfx.js',
  './js/fx/board-fx.js',
  './js/fx/cat-fx.js',
  './js/fx/confetti.js',
  './js/fx/fx.js',
  './js/fx/haptics.js',
  './js/game/daily.js',
  './js/game/generator.js',
  './js/game/hints.js',
  './js/game/levels.js',
  './js/game/logic-groups.js',
  './js/game/logic.js',
  './js/game/rng.js',
  './js/game/rules.js',
  './js/game/solver.js',
  './js/state/daily-progress.js',
  './js/state/progress.js',
  './js/state/session-store.js',
  './js/state/session.js',
  './js/state/settings.js',
  './js/state/storage.js',
  './js/state/store.js',
  './js/ui/board/board.js',
  './js/ui/board/cat.js',
  './js/ui/board/input.js',
  './js/ui/board/patterns.js',
  './js/ui/board/quilt-svg.js',
  './js/ui/board/seams.js',
  './js/ui/dom.js',
  './js/ui/hud/hearts.js',
  './js/ui/hud/hint-bubble.js',
  './js/ui/hud/mode-switch.js',
  './js/ui/hud/timer.js',
  './js/ui/hud/toolbar.js',
  './js/ui/icons.js',
  './js/ui/screens/game.js',
  './js/ui/screens/home.js',
  './js/ui/screens/levels.js',
  './js/ui/sheets/difficulty-picker.js',
  './js/ui/sheets/howto.js',
  './js/ui/sheets/lose.js',
  './js/ui/sheets/settings.js',
  './js/ui/sheets/sheet.js',
  './js/ui/sheets/win.js',
  './js/ui/update-toast.js',
  './js/workers/daily.worker.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  // Only ever delete our own old caches — other apps share this github.io origin.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
      return res;
    })),
  );
});
