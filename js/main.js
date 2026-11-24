// Boot: start the router, unlock audio on first touch, register the service worker
// and offer a refresh when a new version has been downloaded.
import { startRouter } from './router.js';
import { homeScreen } from './ui/screens/home.js';
import { levelsScreen } from './ui/screens/levels.js';
import { gameScreen } from './ui/screens/game.js';
import { unlockAudio } from './audio/sfx.js';
import { showUpdateToast } from './ui/update-toast.js';
import { startWakeLock } from './state/wake-lock.js';

startRouter(document.getElementById('app'), {
  home: homeScreen,
  levels: levelsScreen,
  game: gameScreen,
});

startWakeLock();

window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js', { scope: './' }).then((reg) => {
    const offer = (worker) => showUpdateToast(() => worker.postMessage({ type: 'SKIP_WAITING' }));
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
      });
    });
  }).catch(() => { /* offline play still works from the network cache */ });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
}
