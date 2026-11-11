// Rules, each with its own mini quilt. On first launch it also asks for a difficulty.
import { h, s } from '../dom.js';
import { openSheet } from './sheet.js';
import { buildQuilt, paletteFor } from '../board/quilt-svg.js';
import { catInCell, furFor } from '../board/cat.js';
import { outlinePath } from '../board/seams.js';
import { decode } from '../../game/generator.js';
import { createDifficultyPicker } from './difficulty-picker.js';

const DEMO = '5|abbccdbbccdbbccddccecccee|02413';

function miniBoard({ cats, focus, ring }) {
  const p = decode(DEMO);
  const q = buildQuilt({ n: 5, regions: p.regions, palette: paletteFor(DEMO, 5), className: 'quilt quilt-mini' });
  if (focus) {
    const inSet = (r, c) => focus(r, c, p);
    const dim = s('g', { class: 'focus-dim' });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (!inSet(r, c)) dim.append(s('rect', { x: c, y: r, width: 1.01, height: 1.01 }));
    q.focus.append(dim, s('path', { class: 'focus-outline is-static', d: outlinePath(5, inSet) }));
  }
  if (ring) {
    const r0 = 2, c0 = p.solution[2];
    for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) {
      if (r < 0 || c < 0 || r > 4 || c > 4 || (r === r0 && c === c0)) continue;
      q.fx.append(s('rect', { class: 'fx-noroom', x: c + 0.08, y: r + 0.08, width: 0.84, height: 0.84, rx: 0.16 }));
    }
  }
  cats.forEach((r) => q.cats.append(catInCell(r, p.solution[r], furFor(r * 5 + p.solution[r], 5))));
  return q.svg;
}

const rule = (board, title, text) => h('div', { class: 'rule' }, board, h('div', {}, h('b', {}, title), h('span', {}, text)));

export function openHowTo({ firstRun = false, onClose } = {}) {
  const picker = firstRun ? createDifficultyPicker() : null;
  const content = h('div', { class: 'sheet-body' },
    h('h2', { class: 'sheet-title' }, 'How to play'),
    h('div', { class: 'rules' },
      rule(miniBoard({ cats: [0, 1, 2, 3, 4], focus: (r, c, p) => p.regions[r * 5 + c] === 2 }), 'One cat per patch', 'Every colour patch gets exactly one cat.'),
      rule(miniBoard({ cats: [0, 1, 2, 3, 4], focus: (r) => r === 2 }), 'One per row and column', 'No two cats share a line.'),
      rule(miniBoard({ cats: [2], ring: true }), 'Cats need space', 'They can’t touch, not even at the corners.')),
    h('p', { class: 'sheet-sub' }, 'Tap for ✕ · double-tap or hold for a cat · 3 hearts'),
    picker && h('div', { class: 'sheet-section' }, h('h3', { class: 'sheet-h3' }, 'Choose your pace'), picker.el),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => sheet.close() }, firstRun ? 'Start playing' : 'Got it'));
  const sheet = openSheet({ label: 'How to play', content, onClose: () => { picker?.destroy(); onClose?.(); } });
  return sheet;
}
