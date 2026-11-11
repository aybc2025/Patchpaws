// Saves unfinished games so closing the app mid-level loses nothing. Keeps the 4 most recent.
import { load, save } from './storage.js';

const KEEP = 4;
const valid = (v) => v && typeof v === 'object' && !Array.isArray(v);

export function loadSession(key, size) {
  const all = load('sessions', {}, valid);
  const s = all[key];
  if (!s || !Array.isArray(s.cells) || s.cells.length !== size) return null;
  if (!s.cells.every((v) => v === 0 || v === 1 || v === 2)) return null;
  return {
    cells: s.cells,
    hearts: clampInt(s.hearts, 0, 3, 3),
    mistakes: clampInt(s.mistakes, 0, 999, 0),
    hintsUsed: clampInt(s.hintsUsed, 0, 999, 0),
    elapsedMs: clampInt(s.elapsedMs, 0, 1e9, 0),
    history: Array.isArray(s.history) ? s.history : [],
    status: s.status === 'lost' ? 'lost' : 'playing',
  };
}

export function saveSession(key, data) {
  const all = load('sessions', {}, valid);
  all[key] = { ...data, savedAt: Date.now() };
  const keys = Object.keys(all).sort((a, b) => (all[b].savedAt || 0) - (all[a].savedAt || 0));
  keys.slice(KEEP).forEach((k) => delete all[k]);
  save('sessions', all);
}

export function dropSession(key) {
  const all = load('sessions', {}, valid);
  delete all[key];
  save('sessions', all);
}

export function hasSession(key) {
  return !!load('sessions', {}, valid)[key];
}

function clampInt(v, min, max, fallback) {
  return Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : fallback;
}
