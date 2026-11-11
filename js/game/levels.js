// Loads the shipped level list (data/levels.json) once and hands out decoded puzzles.
import { decode } from './generator.js';

let cache = null;

export async function loadLevels() {
  if (!cache) {
    const res = await fetch('./data/levels.json');
    if (!res.ok) throw new Error('levels-unavailable');
    cache = await res.json();
  }
  return cache;
}

export const levelCount = () => (cache ? cache.length : 0);

export async function getLevel(levelNo) {
  const list = await loadLevels();
  const code = list[levelNo - 1];
  return code ? { ...decode(code), code } : null;
}

/** Groups consecutive levels by board size: [{ n, from, to }]. */
export async function bands() {
  const list = await loadLevels();
  const out = [];
  list.forEach((code, i) => {
    const n = Number(code.split('|')[0]);
    const last = out[out.length - 1];
    if (last && last.n === n) last.to = i + 1;
    else out.push({ n, from: i + 1, to: i + 1 });
  });
  return out;
}
