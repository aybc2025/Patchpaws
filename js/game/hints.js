// Picks the hint for the player's current board. Pure — works on plain arrays.
import { nextStep, MARK, CAT, EMPTY } from './logic.js';

export function findHint(geo, cells, solution) {
  const { n } = geo;
  // A cross on the answer square would make every later deduction wrong — flag it first.
  for (let r = 0; r < n; r++) {
    const i = r * n + solution[r];
    if (cells[i] === MARK) return { rule: 'wrongMark', xs: [], clear: i, focus: [], targets: [i] };
  }
  const step = nextStep(geo, cells.slice());
  if (step && step.rule !== 'broken') {
    return { ...step, targets: step.place != null ? [step.place] : step.xs };
  }
  // Fallback (should not happen with verified puzzles): reveal a missing cat.
  for (let r = 0; r < n; r++) {
    const i = r * n + solution[r];
    if (cells[i] !== CAT) return { rule: 'reveal', place: i, xs: [], focus: [], targets: [i] };
  }
  return null;
}

/** Chebyshev distance — used to ripple auto-crosses outward from a cat. */
export const ringDistance = (n, a, b) =>
  Math.max(Math.abs(Math.floor(a / n) - Math.floor(b / n)), Math.abs((a % n) - (b % n)));

export { EMPTY, MARK, CAT };
