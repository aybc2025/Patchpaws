// Group deductions ("squeeze"): if k patches only fit inside k rows (or columns), nothing
// else in those lines can hold a cat — and the reverse. The hardest rule the game uses.
import { rowOf, colOf, hasCat, open } from './logic.js';

function* combinations(items, k, start = 0, acc = []) {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= items.length - (k - acc.length); i++) {
    acc.push(items[i]);
    yield* combinations(items, k, i + 1, acc);
    acc.pop();
  }
}

export function squeezeStep(geo, state) {
  const { n, regions } = geo;
  const freeRegs = [...Array(n).keys()].filter((r) => !hasCat(state, geo.regs[r]));
  for (let k = 2; k <= Math.max(2, freeRegs.length - 1); k++) {
    for (const [kind, lines, lineOf] of [['row', geo.rows, rowOf], ['col', geo.cols, colOf]]) {
      for (const combo of combinations(freeRegs, k)) {
        const cells = combo.flatMap((r) => open(state, geo.regs[r]));
        const ls = new Set(cells.map((i) => lineOf(geo, i)));
        if (ls.size !== k) continue;
        const xs = [...ls].flatMap((l) => open(state, lines[l])).filter((i) => !combo.includes(regions[i]));
        if (xs.length) {
          return { rule: 'squeeze', level: 3 + k, xs, focus: [...combo.map((r) => ({ kind: 'region', index: r, cells: geo.regs[r] })), ...[...ls].map((l) => ({ kind, index: l, cells: lines[l] }))] };
        }
      }
      const freeLines = [...Array(n).keys()].filter((l) => !hasCat(state, lines[l]));
      for (const combo of combinations(freeLines, k)) {
        if (k >= freeLines.length) break;
        const cells = combo.flatMap((l) => open(state, lines[l]));
        const rs = new Set(cells.map((i) => regions[i]));
        if (rs.size !== k) continue;
        const xs = [...rs].flatMap((r) => open(state, geo.regs[r])).filter((i) => !combo.includes(lineOf(geo, i)));
        if (xs.length) {
          return { rule: 'squeeze', level: 3 + k, xs, focus: [...combo.map((l) => ({ kind, index: l, cells: lines[l] })), ...[...rs].map((r) => ({ kind: 'region', index: r, cells: geo.regs[r] }))] };
        }
      }
    }
  }
  return null;
}
