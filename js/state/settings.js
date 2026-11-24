// Player settings. Difficulty decides hint allowance and what happens after losing.
import { createStore } from './store.js';
import { load, save } from './storage.js';

const DEFAULTS = {
  sound: true,
  haptics: true,
  autoMark: true,
  keepAwake: false,       // hold a screen wake lock while the app is open
  tapMode: 'mark',        // 'mark' | 'cat' — what a single tap does
  difficulty: 'cozy',     // 'cozy' | 'classic'
};

export const DIFFICULTY = {
  cozy: { hints: Infinity, keepOnRetry: true },
  classic: { hints: 3, keepOnRetry: false },
};

const settings = createStore({ ...DEFAULTS, ...load('settings', {}) });
settings.subscribe((s) => save('settings', s));

export default settings;
export const rulesFor = (s = settings.get()) => DIFFICULTY[s.difficulty] || DIFFICULTY.cozy;
