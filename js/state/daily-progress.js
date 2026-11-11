// Daily puzzle results and streak, keyed by the player's local date (YYYY-MM-DD).
import { createStore } from './store.js';
import { load, save } from './storage.js';
import { dateKey, addDays } from '../game/daily.js';

const DEFAULTS = { streak: 0, bestStreak: 0, last: null, days: {} };

const daily = createStore({ ...DEFAULTS, ...load('daily', {}) });
daily.subscribe((d) => save('daily', d));

export default daily;

/** Streak still counts if the last solve was today or yesterday. */
export function currentStreak(d = daily.get(), today = dateKey()) {
  if (!d.last) return 0;
  return d.last === today || d.last === addDays(today, -1) ? d.streak : 0;
}

export function recordDaily(key, { ms, stars }) {
  const d = daily.get();
  if (d.days[key]) {
    const prev = d.days[key];
    daily.set({ days: { ...d.days, [key]: { ms: Math.min(prev.ms, ms), stars: Math.max(prev.stars, stars) } } });
    return;
  }
  const streak = d.last === addDays(key, -1) ? currentStreak(d, key) + 1 : 1;
  daily.set({
    streak,
    bestStreak: Math.max(d.bestStreak, streak),
    last: key,
    days: { ...d.days, [key]: { ms, stars } },
  });
}

/** Monday → Sunday of the current week with each day's state. */
export function weekStrip(today = dateKey()) {
  const d = new Date(today + 'T12:00:00');
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(today, -mondayOffset);
  const solved = daily.get().days;
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
    const key = addDays(monday, i);
    return { label, key, done: !!solved[key], today: key === today, future: key > today };
  });
}
