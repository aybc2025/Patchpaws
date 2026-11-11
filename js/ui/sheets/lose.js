// Out of hearts. Copy depends on difficulty: Cozy keeps your board, Classic starts fresh.
import { h } from '../dom.js';
import { openSheet } from './sheet.js';
import { rulesFor } from '../../state/settings.js';

export function openLose({ onRetry, onHome }) {
  const keep = rulesFor().keepOnRetry;
  const content = h('div', { class: 'sheet-body' },
    h('h2', { class: 'sheet-title' }, 'Out of hearts'),
    h('p', { class: 'sheet-sub' }, keep ? 'Your cats and ✕ marks stay put.' : 'Classic: the quilt starts fresh.'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => sheet.close().then(onRetry) }, 'Try again'),
    h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => sheet.close().then(onHome) }, 'Home'));
  const sheet = openSheet({ label: 'Out of hearts', content, dismissible: false, className: 'sheet-lose' });
  return sheet;
}
