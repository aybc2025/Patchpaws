// Builds the static quilt SVG: patches with prints, stitched seams, border,
// plus empty layers for marks, cats, hint focus and effects.
import { s } from '../dom.js';
import { hashString, mulberry32, shuffle } from '../../game/rng.js';
import { addPatterns } from './patterns.js';
import { seamPath, innerGridPath } from './seams.js';

export const PAD = 0.08;
let uid = 0;

/** Region id → patch colour id, shuffled per puzzle so boards don't all look alike. */
export function paletteFor(code, n) {
  return shuffle(mulberry32(hashString(code)), [...Array(10).keys()]).slice(0, n);
}

export function buildQuilt({ n, regions, palette, className = 'quilt' }) {
  const prefix = `q${++uid}`;
  const defs = s('defs');
  const fills = addPatterns(defs, prefix);
  defs.append(s('clipPath', { id: `${prefix}-clip` }, s('rect', { width: n, height: n, rx: 0.42 })));

  const patchRects = [];
  const patches = s('g', { class: 'quilt-patches' });
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const rect = s('rect', { x: c, y: r, width: 1.01, height: 1.01, fill: fills[palette[regions[r * n + c]]] });
      patchRects.push(rect);
      patches.append(rect);
    }
  }
  const seamD = seamPath(n, regions);
  const seam = s('path', { class: 'quilt-seam', d: seamD, pathLength: 1 });
  const stitch = s('path', { class: 'quilt-stitch', d: seamD });
  const focus = s('g', { class: 'quilt-focus' });
  const shimmer = s('rect', { class: 'quilt-shimmer', x: -n, y: 0, width: n, height: n, fill: `url(#${prefix}-shine)` });
  defs.append(s('linearGradient', { id: `${prefix}-shine`, x1: 0, y1: 0, x2: 1, y2: 0.4 },
    s('stop', { offset: '0.35', 'stop-color': '#fff', 'stop-opacity': 0 }),
    s('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': 0.45 }),
    s('stop', { offset: '0.65', 'stop-color': '#fff', 'stop-opacity': 0 })));

  const clipped = s('g', { 'clip-path': `url(#${prefix}-clip)` },
    patches,
    s('path', { class: 'quilt-grid', d: innerGridPath(n, regions) }),
    seam, stitch, focus, shimmer);

  const marks = s('g', { class: 'quilt-marks' });
  const cats = s('g', { class: 'quilt-cats' });
  const fx = s('g', { class: 'quilt-fx' });
  const svg = s('svg', {
    class: className, viewBox: `${-PAD} ${-PAD} ${n + 2 * PAD} ${n + 2 * PAD}`, 'aria-hidden': 'true',
  }, defs, clipped, s('rect', { class: 'quilt-border', width: n, height: n, rx: 0.42 }), marks, cats, fx);

  return { svg, patchRects, seam, stitch, focus, shimmer, marks, cats, fx };
}
