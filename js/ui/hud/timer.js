// Game clock. Advances the session while playing and visible; pauses in the background.
import { h, formatTime } from '../dom.js';

export function createTimer(session) {
  const el = h('span', { class: 'timer', 'aria-label': 'Time' }, formatTime(session.store.get().elapsedMs));
  let last = performance.now();
  let shown = '';

  const interval = setInterval(() => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (document.hidden) return;
    session.actions.tick(Math.min(dt, 1000));
    const text = formatTime(session.store.get().elapsedMs);
    if (text !== shown) { el.textContent = text; shown = text; }
  }, 250);

  // Save the clock the moment the app is backgrounded or closed, not just every 5 s.
  const onVisible = () => { last = performance.now(); if (document.hidden) session.persist(); };
  const onHide = () => session.persist();
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('pagehide', onHide);

  return {
    el,
    destroy() {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pagehide', onHide);
    },
  };
}
