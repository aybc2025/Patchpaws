// Re-proves every shipped level: one answer, solvable without guessing, valid layout.
// Runs in CI (.github/workflows/verify.yml) with plain Node — no npm install.
import { readFileSync } from 'node:fs';
import { decode } from '../js/game/generator.js';
import { countSolutions } from '../js/game/solver.js';
import { solveLogically } from '../js/game/logic.js';

const levels = JSON.parse(readFileSync(new URL('../data/levels.json', import.meta.url), 'utf8'));
let failures = 0;
const levelsByGrade = {};
levels.forEach((code, i) => {
  const p = decode(code);
  const { n, regions, solution } = p;
  const fail = (msg) => { failures++; console.error(`Level ${i + 1}: ${msg}`); };
  if (regions.length !== n * n) return fail('wrong cell count');
  if (new Set(regions).size !== n) return fail('wrong patch count');
  if (countSolutions(n, regions, 2) !== 1) return fail('not exactly one answer');
  const cats = solution.map((c, r) => r * n + c);
  if (new Set(cats.map((i) => regions[i])).size !== n) return fail('answer repeats a patch');
  for (let r = 1; r < n; r++) if (Math.abs(solution[r] - solution[r - 1]) < 2) fail('answer cats touch');
  const logic = solveLogically(n, regions);
  if (!logic.solved) return fail('needs guessing');
  levelsByGrade[logic.maxLevel] = (levelsByGrade[logic.maxLevel] || 0) + 1;
});
console.log(`${levels.length} levels checked, ${failures} failures. Hardest step per level:`, levelsByGrade);
process.exit(failures ? 1 : 0);
