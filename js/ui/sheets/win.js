// Solved! Stars pop in one at a time with rising chimes.
import { h, formatTime, reducedMotion } from '../dom.js';
import { icons } from '../icons.js';
import { openSheet } from './sheet.js';
import { sfx } from '../../audio/sfx.js';

const TITLES = { 3: 'Purrfect!', 2: 'Nicely done', 1: 'Solved' };

export function openWin({ title, result, bestMs, isNewBest, primary, secondary }) {
  const stars = [0, 1, 2].map((k) => {
    const star = icons.star(k < result.stars);
    star.style.setProperty('--k', k);
    return star;
  });
  const content = h('div', { class: 'sheet-body' },
    h('h2', { class: 'sheet-title' }, TITLES[result.stars]),
    h('p', { class: 'sheet-sub' }, title),
    h('div', { class: 'stars', role: 'img', 'aria-label': `${result.stars} of 3 stars` }, stars),
    h('div', { class: 'stats' },
      h('div', {}, h('b', {}, formatTime(result.ms)), 'Time'),
      h('div', {}, h('b', {}, String(result.mistakes)), result.mistakes === 1 ? 'Mistake' : 'Mistakes'),
      h('div', { class: isNewBest ? 'is-best' : '' }, h('b', {}, bestMs ? formatTime(bestMs) : '—'), isNewBest ? 'New best' : 'Best')),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => sheet.close().then(primary.action) }, primary.label),
    h('button', { type: 'button', class: 'btn btn-quiet', onclick: () => sheet.close().then(secondary.action) }, secondary.label));

  const sheet = openSheet({ label: TITLES[result.stars], content, dismissible: false, className: 'sheet-win' });
  if (!reducedMotion()) {
    for (let k = 0; k < result.stars; k++) setTimeout(() => sfx.star(k), 420 + k * 160);
  }
  return sheet;
}
