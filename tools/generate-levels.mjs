// Generates data/levels.json — 300 graded puzzles, easiest first within each board size.
// Usage: node tools/generate-levels.mjs   (deterministic: same output every run)
import { writeFileSync } from 'node:fs';
import { generate, encode } from '../js/game/generator.js';

const BANDS = [
  { n: 5, count: 8, maxLevel: 2 },
  { n: 6, count: 22, maxLevel: 3 },
  { n: 7, count: 40, maxLevel: 4 },
  { n: 8, count: 70, maxLevel: 5 },
  { n: 9, count: 80, maxLevel: 6 },
  { n: 10, count: 80, maxLevel: 7 },
];

const out = [];
let seed = 1000;
for (const band of BANDS) {
  const pool = [];
  while (pool.length < band.count * 1.5) {
    const p = generate(band.n, seed++, { maxLevel: band.maxLevel });
    if (p) pool.push(p);
  }
  // Keep the band's most interesting puzzles, then order them easy → hard,
  // with every fifth level a breather so difficulty doesn't climb in a straight line.
  pool.sort((a, b) => b.score - a.score);
  const chosen = pool.slice(0, band.count).sort((a, b) => a.score - b.score);
  const ordered = [];
  const easy = chosen.slice(0, Math.floor(band.count / 5));
  const rest = chosen.slice(easy.length);
  for (let i = 0; i < band.count; i++) ordered.push(i % 5 === 4 && easy.length ? easy.shift() : rest.shift() ?? easy.shift());
  ordered.forEach((p) => out.push(encode(p)));
  console.log(`${band.n}x${band.n}: ${band.count} levels`);
}
writeFileSync(new URL('../data/levels.json', import.meta.url), JSON.stringify(out));
console.log('total', out.length);
