// Fabric prints for the ten quilt patches. Each patch has a colour AND a print, so
// patches stay distinguishable for colour-blind players. Units are board cells (1 = one square).
import { s } from '../dom.js';

export const PATCH_COLORS = ['#F6A6B9', '#FFC39E', '#F8E59A', '#A9E3BF', '#93D3D6', '#A3BEF4', '#C8B3F0', '#CFDB9C', '#F49A8E', '#D9D3E8'];
const INK = 'rgba(28,30,61,0.09)';

const PRINTS = [
  () => [],                                                                                       // plain
  () => [s('circle', { cx: 0.125, cy: 0.125, r: 0.045, fill: INK })],                             // polka
  () => [s('rect', { width: 0.15, height: 0.3, fill: INK }), s('rect', { width: 0.3, height: 0.15, fill: INK })], // gingham
  () => [s('path', { d: 'M0 .2 L.2 0', stroke: INK, 'stroke-width': 0.04 })],                       // pinstripe
  () => [s('circle', { cx: 0.08, cy: 0.08, r: 0.05, fill: INK }), s('circle', { cx: 0.245, cy: 0.245, r: 0.05, fill: INK })], // dots
  () => [s('rect', { width: 0.2, height: 0.2, fill: INK }), s('rect', { x: 0.2, y: 0.2, width: 0.2, height: 0.2, fill: INK })], // checks
  () => [s('rect', { width: 0.2, height: 0.07, fill: INK })],                                      // stripes
  () => [s('path', { d: 'M0 0 L.22 .22 M.22 0 L0 .22', stroke: INK, 'stroke-width': 0.025 })],      // crosshatch
  () => [s('path', { d: 'M.08 .12 h.09', stroke: INK, 'stroke-width': 0.035, 'stroke-linecap': 'round' })], // ticks
  () => [s('path', { d: 'M0 .15 L.15 0 L.3 .15', fill: 'none', stroke: INK, 'stroke-width': 0.03 })], // herringbone
];
const SIZES = [1, 0.25, 0.3, 0.2, 0.33, 0.4, 0.2, 0.22, 0.25, 0.3];

/** Adds <pattern>s to defs; returns fill values indexed by patch colour id. */
export function addPatterns(defs, prefix) {
  return PATCH_COLORS.map((color, i) => {
    const id = `${prefix}-p${i}`;
    defs.append(s('pattern', { id, width: SIZES[i], height: SIZES[i], patternUnits: 'userSpaceOnUse' },
      s('rect', { width: SIZES[i], height: SIZES[i], fill: color }), ...PRINTS[i]()));
    return `url(#${id})`;
  });
}
