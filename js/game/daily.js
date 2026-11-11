// Daily puzzle: the same board for everyone on a given date, built on the device
// from a seed derived from the date. Board size grows through the week.
import { hashString } from './rng.js';
import { generate, encode, decode } from './generator.js';

const SIZE_BY_WEEKDAY = [10, 7, 8, 8, 9, 9, 10]; // Sun..Sat
const MAX_STEP_BY_SIZE = { 7: 4, 8: 5, 9: 6, 10: 7 };

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key, days) {
  const d = new Date(key + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function dailySize(key) {
  return SIZE_BY_WEEKDAY[new Date(key + 'T12:00:00').getDay()];
}

/** Pure, deterministic. Tries successive seeds until one passes every check. */
export function buildDaily(key) {
  const n = dailySize(key);
  let seed = hashString('patchpaws-daily-' + key);
  for (let i = 0; i < 50; i++) {
    const p = generate(n, seed + i, { maxLevel: MAX_STEP_BY_SIZE[n], attempts: 20 });
    if (p) return encode(p);
  }
  return null;
}

let worker = null;
const pending = new Map();

function viaWorker(key) {
  if (!worker) {
    worker = new Worker(new URL('../workers/daily.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      pending.get(data.key)?.(data.code);
      pending.delete(data.key);
    };
  }
  return new Promise((resolve) => {
    pending.set(key, resolve);
    worker.postMessage({ key });
  });
}

export async function getDaily(key) {
  const cacheKey = 'patchpaws:dailyBoard';
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached?.key === key) return { ...decode(cached.code), code: cached.code };
  } catch { /* ignore */ }
  let code;
  try { code = await viaWorker(key); } catch { code = null; }
  if (!code) code = buildDaily(key);
  try { localStorage.setItem(cacheKey, JSON.stringify({ key, code })); } catch { /* ignore */ }
  return { ...decode(code), code };
}
