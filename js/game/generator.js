// Puzzle generator: places n non-touching cats, grows n colour regions around them,
// then reshapes region borders until the answer is unique and reachable by logic alone.
import { mulberry32, shuffle } from './rng.js';
import { countSolutions } from './solver.js';
import { solveLogically } from './logic.js';

function placeCats(n, rand) {
  const cols = new Array(n);
  const used = new Array(n).fill(false);
  function go(r) {
    if (r === n) return true;
    const order = shuffle(rand, [...Array(n).keys()]);
    for (const c of order) {
      if (used[c] || (r > 0 && Math.abs(c - cols[r - 1]) < 2)) continue;
      used[c] = true; cols[r] = c;
      if (go(r + 1)) return true;
      used[c] = false;
    }
    return false;
  }
  return go(0) ? cols : null;
}

const orth = (n, i) => {
  const r = Math.floor(i / n), c = i % n, out = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
};

function growRegions(n, cats, rand) {
  const regions = new Array(n * n).fill(-1);
  cats.forEach((c, r) => { regions[r * n + c] = r; });
  let left = n * n - n;
  // Uneven growth weights give a natural mix of big and small patches.
  const weight = Array.from({ length: n }, () => 0.35 + rand() * 1.3);
  while (left > 0) {
    const total = weight.reduce((a, b) => a + b, 0);
    let x = rand() * total, reg = 0;
    while (x > weight[reg]) { x -= weight[reg]; reg++; }
    const frontier = [];
    regions.forEach((v, i) => {
      if (v === reg) for (const j of orth(n, i)) if (regions[j] === -1) frontier.push(j);
    });
    if (!frontier.length) { weight[reg] = 0.0001; continue; }
    regions[frontier[Math.floor(rand() * frontier.length)]] = reg;
    left--;
  }
  return regions;
}

function stillConnected(n, regions, reg, without) {
  const cells = [];
  regions.forEach((v, i) => { if (v === reg && i !== without) cells.push(i); });
  if (!cells.length) return false;
  const seen = new Set([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const i = stack.pop();
    for (const j of orth(n, i)) {
      if (j !== without && regions[j] === reg && !seen.has(j)) { seen.add(j); stack.push(j); }
    }
  }
  return seen.size === cells.length;
}

/**
 * @returns {{n, regions:number[], solution:number[], maxLevel, score} | null}
 */
export function generate(n, seed, { maxLevel = 99, minLevel = 0, attempts = 40 } = {}) {
  const rand = mulberry32(seed);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const cats = placeCats(n, rand);
    const catCells = new Set(cats.map((c, r) => r * n + c));
    let regions = growRegions(n, cats, rand);
    let count = countSolutions(n, regions, 400);
    for (let iter = 0; iter < 1500 && count > 1; iter++) {
      const i = Math.floor(rand() * n * n);
      if (catCells.has(i)) continue;
      const others = orth(n, i).map((j) => regions[j]).filter((v) => v !== regions[i]);
      if (!others.length) continue;
      const to = others[Math.floor(rand() * others.length)];
      const from = regions[i];
      if (!stillConnected(n, regions, from, i)) continue;
      regions[i] = to;
      const next = countSolutions(n, regions, 400);
      if (next <= count) count = next; else regions[i] = from;
    }
    if (count !== 1) continue;
    const logic = solveLogically(n, regions);
    if (!logic.solved || logic.maxLevel > maxLevel || logic.maxLevel < minLevel) continue;
    return { n, regions, solution: cats, maxLevel: logic.maxLevel, score: logic.score };
  }
  return null;
}

/** Compact string form: "n|regionChars|solutionDigits". */
export function encode(p) {
  return `${p.n}|${p.regions.map((r) => String.fromCharCode(97 + r)).join('')}|${p.solution.join('')}`;
}

export function decode(s) {
  const [n, regs, sol] = s.split('|');
  return {
    n: Number(n),
    regions: [...regs].map((ch) => ch.charCodeAt(0) - 97),
    solution: [...sol].map(Number),
  };
}
