// The playable board: quilt SVG + an accessible button grid on top for input.
// render(state) brings marks and cats in line with the session, touching only changed squares.
import { h, s } from '../dom.js';
import { buildQuilt, paletteFor, PAD } from './quilt-svg.js';
import { catInCell, furFor } from './cat.js';
import { markPath } from './seams.js';
import { PATCH_NAMES } from '../../game/rules.js';
import { attachInput } from './input.js';

const STATE_WORD = ['empty', 'crossed out', 'cat'];

export function createBoard(session) {
  const { n, regions, code } = session.puzzle;
  const palette = paletteFor(code, n);
  const quilt = buildQuilt({ n, regions, palette });
  const patchName = (region) => PATCH_NAMES[palette[region]];

  const buttons = [];
  const grid = h('div', { class: 'board-cells', role: 'grid', 'aria-label': `${n} by ${n} quilt` });
  for (let r = 0; r < n; r++) {
    const row = h('div', { role: 'row', class: 'board-row' });
    for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const b = h('button', { type: 'button', role: 'gridcell', class: 'board-cell', tabindex: i === 0 ? 0 : -1, dataset: { i } });
      buttons.push(b);
      row.append(b);
    }
    grid.append(row);
  }
  grid.style.setProperty('--n', n);
  grid.style.setProperty('--pad', `${(PAD / (n + 2 * PAD)) * 100}%`);

  const el = h('div', { class: 'board-wrap' }, h('div', { class: 'board' }, quilt.svg, grid));
  const marks = new Map();
  const cats = new Map();
  let rendered = new Array(n * n).fill(-1);

  function setCell(i, value) {
    const r = Math.floor(i / n), c = i % n;
    if (value === 1 && !marks.has(i)) {
      const m = s('path', { class: 'mark', d: markPath(r, c) });
      marks.set(i, m);
      quilt.marks.append(m);
    } else if (value !== 1 && marks.has(i)) {
      marks.get(i).remove();
      marks.delete(i);
    }
    if (value === 2 && !cats.has(i)) {
      const cat = catInCell(r, c, furFor(i, n));
      cats.set(i, cat);
      quilt.cats.append(cat);
    } else if (value !== 2 && cats.has(i)) {
      cats.get(i).remove();
      cats.delete(i);
    }
    buttons[i].setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}, ${patchName(regions[i])} patch, ${STATE_WORD[value]}`);
  }

  function render(state) {
    state.cells.forEach((v, i) => { if (rendered[i] !== v) setCell(i, v); });
    rendered = state.cells.slice();
    el.classList.toggle('is-lost', state.status === 'lost');
    el.classList.toggle('is-won', state.status === 'won');
  }

  const detachInput = attachInput(grid, buttons, n, session);
  render(session.store.get());

  return {
    el, quilt, n, palette, patchName, buttons, marks, cats,
    render,
    destroy: detachInput,
  };
}
