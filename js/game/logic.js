// Human-style deduction engine. Shared by the level generator (to prove a puzzle
// needs no guessing, and to grade it) and by the in-game hint button.
// Cell states: 0 = empty, 1 = X (ruled out), 2 = cat.
export const EMPTY = 0;
export const MARK = 1;
export const CAT = 2;

import { squeezeStep } from './logic-groups.js';

const geoCache = new Map();

export function geometry(n, regions) {
  const key = n + ':' + regions.join('');
  if (geoCache.has(key)) return geoCache.get(key);
  const rows = [], cols = [], regs = [];
  for (let i = 0; i < n; i++) { rows.push([]); cols.push([]); regs.push([]); }
  const neighbors = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      rows[r].push(i); cols[c].push(i); regs[regions[i]].push(i);
      const nb = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n) nb.push(rr * n + cc);
      }
      neighbors.push(nb);
    }
  }
  const units = [
    ...regs.map((cells, index) => ({ kind: 'region', index, cells })),
    ...rows.map((cells, index) => ({ kind: 'row', index, cells })),
    ...cols.map((cells, index) => ({ kind: 'col', index, cells })),
  ];
  const geo = { n, regions, rows, cols, regs, neighbors, units };
  geoCache.set(key, geo);
  return geo;
}

export const rowOf = (geo, i) => Math.floor(i / geo.n);
export const colOf = (geo, i) => i % geo.n;

/** Every cell a cat at `cell` rules out (row, column, region, touching cells). */
export function attackedBy(geo, cell) {
  const set = new Set([
    ...geo.rows[rowOf(geo, cell)],
    ...geo.cols[colOf(geo, cell)],
    ...geo.regs[geo.regions[cell]],
    ...geo.neighbors[cell],
  ]);
  set.delete(cell);
  return set;
}

export const hasCat = (state, cells) => cells.some((i) => state[i] === CAT);
export const open = (state, cells) => cells.filter((i) => state[i] === EMPTY);

/**
 * Find the next logical deduction. Returns null when stuck.
 * Step shape: { rule, level, place?: cell, xs: cell[], focus: {kind,index}[] }
 */
export function nextStep(geo, state) {
  const { n, regions } = geo;

  // Level 0 — cells already attacked by a placed cat.
  const attacked = [];
  state.forEach((s, i) => {
    if (s !== CAT) return;
    for (const j of attackedBy(geo, i)) if (state[j] === EMPTY) attacked.push(j);
  });
  if (attacked.length) {
    return { rule: 'attacked', level: 0, xs: [...new Set(attacked)], focus: [] };
  }

  // Broken board (a unit with no room) — reported so callers can stop.
  for (const u of geo.units) {
    if (!hasCat(state, u.cells) && open(state, u.cells).length === 0) {
      return { rule: 'broken', level: 99, xs: [], focus: [u] };
    }
  }

  // Level 1 — only one spot left in a region / row / column.
  for (const u of geo.units) {
    if (hasCat(state, u.cells)) continue;
    const o = open(state, u.cells);
    if (o.length === 1) return { rule: 'lastSpot', level: 1, place: o[0], xs: [], focus: [u] };
  }

  // Level 2 — a region confined to one row/column (or a line confined to one region).
  for (let reg = 0; reg < n; reg++) {
    const cells = geo.regs[reg];
    if (hasCat(state, cells)) continue;
    const o = open(state, cells);
    const rs = new Set(o.map((i) => rowOf(geo, i)));
    const cs = new Set(o.map((i) => colOf(geo, i)));
    if (rs.size === 1) {
      const r = [...rs][0];
      const xs = open(state, geo.rows[r]).filter((i) => regions[i] !== reg);
      if (xs.length) return { rule: 'regionInLine', level: 2, xs, focus: [{ kind: 'region', index: reg, cells }, { kind: 'row', index: r, cells: geo.rows[r] }] };
    }
    if (cs.size === 1) {
      const c = [...cs][0];
      const xs = open(state, geo.cols[c]).filter((i) => regions[i] !== reg);
      if (xs.length) return { rule: 'regionInLine', level: 2, xs, focus: [{ kind: 'region', index: reg, cells }, { kind: 'col', index: c, cells: geo.cols[c] }] };
    }
  }
  for (const [kind, lines] of [['row', geo.rows], ['col', geo.cols]]) {
    for (let li = 0; li < n; li++) {
      const cells = lines[li];
      if (hasCat(state, cells)) continue;
      const o = open(state, cells);
      const regs = new Set(o.map((i) => regions[i]));
      if (regs.size === 1) {
        const reg = [...regs][0];
        const xs = open(state, geo.regs[reg]).filter((i) => !cells.includes(i));
        if (xs.length) return { rule: 'lineInRegion', level: 2, xs, focus: [{ kind, index: li, cells }, { kind: 'region', index: reg, cells: geo.regs[reg] }] };
      }
    }
  }

  // Level 3 — a cat here would leave some region/row/column with no room.
  for (let i = 0; i < n * n; i++) {
    if (state[i] !== EMPTY) continue;
    const hit = attackedBy(geo, i);
    for (const u of geo.units) {
      if (u.cells.includes(i) || hasCat(state, u.cells)) continue;
      const o = open(state, u.cells);
      if (o.length && o.every((j) => hit.has(j))) {
        return { rule: 'blocks', level: 3, xs: [i], focus: [u] };
      }
    }
  }

  // Level 4+ — k regions squeezed into k lines (and the reverse).
  return squeezeStep(geo, state);
}

export function applyStep(geo, state, step) {
  if (step.place != null) {
    state[step.place] = CAT;
    for (const j of attackedBy(geo, step.place)) if (state[j] === EMPTY) state[j] = MARK;
  }
  for (const i of step.xs) if (state[i] === EMPTY) state[i] = MARK;
}

/** Solve with deductions only. Tells the generator whether a puzzle is guess-free and how hard. */
export function solveLogically(n, regions) {
  const geo = geometry(n, regions);
  const state = new Array(n * n).fill(EMPTY);
  let maxLevel = 0, score = 0, steps = 0;
  for (;;) {
    const step = nextStep(geo, state);
    if (!step || step.rule === 'broken') break;
    applyStep(geo, state, step);
    maxLevel = Math.max(maxLevel, step.level);
    score += step.level * step.level;
    steps++;
    if (state.filter((s) => s === CAT).length === n) return { solved: true, maxLevel, score, steps, state };
  }
  return { solved: false, maxLevel, score, steps, state };
}
