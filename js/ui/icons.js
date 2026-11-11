// Line icons, drawn on a 24px grid with round caps. All decorative (aria-hidden).
import { s } from './dom.js';

const line = (paths, extra = {}) => s('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', ...extra },
  paths.map((d) => s('path', { d })));

export const icons = {
  back: () => line(['M14.5 5.5 8 12l6.5 6.5'], { 'stroke-width': 2.6 }),
  close: () => line(['M6.5 6.5l11 11M17.5 6.5l-11 11'], { 'stroke-width': 2.6 }),
  settings: () => s('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' },
    s('circle', { cx: 12, cy: 12, r: 3.2 }),
    s('path', { d: 'M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7' })),
  undo: () => line(['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11']),
  hint: () => line(['M9 18h6M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z']),
  restart: () => line(['M4 12a8 8 0 1 0 2.4-5.7L4 8.6', 'M4 4v4.6h4.6']),
  rules: () => s('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'aria-hidden': 'true' },
    s('circle', { cx: 12, cy: 12, r: 9 }),
    s('path', { d: 'M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.5M12 17.2v.1' })),
  levels: () => s('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'aria-hidden': 'true' },
    ...[[3.5, 3.5], [13.5, 3.5], [3.5, 13.5], [13.5, 13.5]].map(([x, y]) => s('rect', { x, y, width: 7, height: 7, rx: 2 }))),
  play: () => s('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' }, s('path', { d: 'M8 5.5v13l10.5-6.5z', 'stroke-linejoin': 'round' })),
  mark: () => line(['M6 6l12 12M18 6 6 18'], { 'stroke-width': 3 }),
  check: () => line(['M5 12.5l4.5 4.5L19 7.5'], { 'stroke-width': 2.8 }),
  star: (filled = true) => s('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: filled ? 'star is-on' : 'star' },
    s('path', { d: 'M12 2.8 L14.6 8.6 L20.9 9.2 L16.1 13.4 L17.5 19.6 L12 16.4 L6.5 19.6 L7.9 13.4 L3.1 9.2 L9.4 8.6 Z', 'stroke-linejoin': 'round' })),
  paw: () => s('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
    s('ellipse', { cx: 12, cy: 15.5, rx: 5, ry: 4.2 }),
    ...[[5.2, 10, 2, 2.6], [9.2, 6.6, 2, 2.6], [14.8, 6.6, 2, 2.6], [18.8, 10, 2, 2.6]].map(([cx, cy, rx, ry]) => s('ellipse', { cx, cy, rx, ry }))),
};

export const HEART_PATH = 'M12 20.5 C6 16.5 2.5 13 2.5 8.6 C2.5 5.8 4.7 3.7 7.3 3.7 C9.3 3.7 11 4.9 12 6.5 C13 4.9 14.7 3.7 16.7 3.7 C19.3 3.7 21.5 5.8 21.5 8.6 C21.5 13 18 16.5 12 20.5 Z';
