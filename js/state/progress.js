// Level progress: which level is unlocked, best stars and time per level.
import { createStore } from './store.js';
import { load, save } from './storage.js';

const DEFAULTS = { unlocked: 1, levels: {}, seenHowTo: false };

const progress = createStore({ ...DEFAULTS, ...load('progress', {}) });
progress.subscribe((p) => save('progress', p));

export default progress;

export function recordLevel(levelNo, { ms, stars }) {
  const p = progress.get();
  const prev = p.levels[levelNo] || {};
  const entry = {
    stars: Math.max(prev.stars || 0, stars),
    bestMs: prev.bestMs ? Math.min(prev.bestMs, ms) : ms,
  };
  progress.set({
    levels: { ...p.levels, [levelNo]: entry },
    unlocked: Math.max(p.unlocked, levelNo + 1),
  });
  return { ...entry, previousBestMs: prev.bestMs || null };
}

export function totalStars(p = progress.get()) {
  return Object.values(p.levels).reduce((sum, l) => sum + (l.stars || 0), 0);
}
