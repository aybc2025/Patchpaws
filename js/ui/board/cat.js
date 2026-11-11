// The Patchpaws cat: an original round "loaf" drawn in a 100-unit box.
// Ears, eyes, tail and body are separate groups so the effects layer can move each one.
// Mood is a data attribute: sleep (default) · awake · angry.
import { s } from '../dom.js';

const INK = '#1C1E3D';
export const FURS = [
  { fur: '#F08A3C', stripe: '#C8642A', ear: '#F6A6B9' }, // ginger
  { fur: '#3B3D52', stripe: null, ear: '#E8879B' },      // charcoal
  { fur: '#FFFFFF', stripe: null, ear: '#F6A6B9' },      // snow
  { fur: '#9AA0B8', stripe: '#7C8299', ear: '#F6A6B9' }, // smoke
  { fur: '#8B5E44', stripe: '#6B4433', ear: '#F2A0A8' }, // cocoa
];

const ear = (side, f) => {
  const d = side === 'l' ? 'M21 52 L25 13 L47 31 Z' : 'M79 52 L75 13 L53 31 Z';
  const inner = side === 'l' ? 'M28 25 L36 33 L29 37 Z' : 'M72 25 L64 33 L71 37 Z';
  return s('g', { class: `cat-ear cat-ear-${side}` },
    s('path', { d, fill: f.fur, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }),
    s('path', { d: inner, fill: f.ear }));
};

export function makeCat(furIndex = 0) {
  const f = FURS[furIndex % FURS.length];
  const line = { fill: 'none', stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  return s('g', { class: 'cat', 'data-mood': 'sleep' },
    s('g', { class: 'cat-tail' },
      s('path', { d: 'M74 84 C92 86 99 70 91 58', ...line, 'stroke-width': 14 }),
      s('path', { d: 'M74 84 C92 86 99 70 91 58', ...line, stroke: f.fur, 'stroke-width': 7 })),
    s('g', { class: 'cat-body' },
      ear('l', f), ear('r', f),
      s('path', { class: 'cat-head', d: 'M17 61 C17 39 32 29 50 29 C68 29 83 39 83 61 C83 81 68 91 50 91 C32 91 17 81 17 61 Z', fill: f.fur, stroke: INK, 'stroke-width': 5 }),
      f.stripe && s('path', { d: 'M44 33 L46 41 M50 31.5 V40 M56 33 L54 41', ...line, stroke: f.stripe, 'stroke-width': 3.2 }),
      s('g', { class: 'eyes eyes-sleep' },
        s('path', { d: 'M31 58 q7 6 14 0', ...line, 'stroke-width': 4.5 }),
        s('path', { d: 'M55 58 q7 6 14 0', ...line, 'stroke-width': 4.5 })),
      s('g', { class: 'eyes eyes-open' },
        s('ellipse', { cx: 38, cy: 57, rx: 5.6, ry: 7, fill: INK }),
        s('ellipse', { cx: 62, cy: 57, rx: 5.6, ry: 7, fill: INK }),
        s('circle', { cx: 40, cy: 54, r: 2, fill: '#fff' }),
        s('circle', { cx: 64, cy: 54, r: 2, fill: '#fff' })),
      s('g', { class: 'eyes eyes-angry' },
        s('path', { d: 'M30 51 L45 57', ...line, 'stroke-width': 4.5 }),
        s('path', { d: 'M70 51 L55 57', ...line, 'stroke-width': 4.5 }),
        s('circle', { cx: 39, cy: 61, r: 3.4, fill: INK }),
        s('circle', { cx: 61, cy: 61, r: 3.4, fill: INK })),
      s('path', { d: 'M46 67 h8 l-4 5 z', fill: '#E86F86', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }),
      s('path', { class: 'mouth-calm', d: 'M43 75 q3.5 4 7 0 q3.5 4 7 0', ...line, 'stroke-width': 3 }),
      s('path', { class: 'mouth-hiss', d: 'M42 79 q8 -8 16 0 q-8 4 -16 0 Z', fill: '#E86F86', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      s('g', { class: 'whiskers', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0.7 },
        s('path', { d: 'M26 69 L10 67' }), s('path', { d: 'M27 74 L12 77' }),
        s('path', { d: 'M74 69 L90 67' }), s('path', { d: 'M73 74 L88 77' }))));
}

/** A cat sized to one board square at (r, c). Returns the positioned <svg>. */
export function catInCell(r, c, furIndex) {
  return s('svg', { class: 'cat-cell', x: c + 0.03, y: r + 0.02, width: 0.94, height: 0.94, viewBox: '0 0 100 100', overflow: 'visible' }, makeCat(furIndex));
}

export const furFor = (i, n) => ((i * 7 + n * 3) % FURS.length + FURS.length) % FURS.length;
