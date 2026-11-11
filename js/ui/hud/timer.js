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

  const onVisible = () => { last = performance.now(); };
  document.addEventListener('visibilitychange', onVisible);

  return {
    el,
    destroy() {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    },
  };
}
