// Keeps the screen on while the app is open, when the "Keep screen on" setting is enabled.
// Uses the Screen Wake Lock API; silently does nothing where it is unsupported.
import settings from './settings.js';

let lock = null;

async function acquire() {
  if (lock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch { lock = null; }
}

function release() {
  const l = lock;
  lock = null;
  l?.release().catch(() => {});
}

export function startWakeLock() {
  const sync = () => (settings.get().keepAwake ? acquire() : release());
  settings.subscribe(sync);
  // The browser drops the lock when the tab is hidden; take it again on return.
  document.addEventListener('visibilitychange', sync);
  sync();
}
