// Level picker: quilt-square tiles grouped by board size, unlocked in order.
import { h } from '../dom.js';
import { icons } from '../icons.js';
import { bands } from '../../game/levels.js';
import progress, { totalStars } from '../../state/progress.js';
import { go } from '../../router.js';

function tile(levelNo, unlocked, record) {
  const locked = levelNo > unlocked;
  const current = levelNo === unlocked;
  const stars = record?.stars || 0;
  const btn = h('button', {
    type: 'button',
    class: `level${locked ? ' is-locked' : ''}${current ? ' is-current' : ''}`,
    disabled: locked,
    'aria-label': `Level ${levelNo}${locked ? ', locked' : current ? ', next up' : `, ${stars} stars`}`,
    onclick: () => go(`#/play/${levelNo}`),
  },
  h('span', { class: 'level-no' }, String(levelNo)),
  !locked && !current && h('span', { class: 'level-stars' }, [0, 1, 2].map((k) => icons.star(k < stars))));
  btn.style.setProperty('--patch', `var(--p${(levelNo * 3) % 10})`);
  return btn;
}

export function levelsScreen() {
  const list = h('div', { class: 'level-bands' });
  const sub = h('small', {});
  const el = h('main', { class: 'screen levels' },
    h('div', { class: 'topbar' },
      h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Back', onclick: () => go('#/') }, icons.back()),
      h('h1', { class: 'topbar-title' }, 'Levels', sub),
      h('span', { class: 'topbar-spacer' })),
    list);

  bands().then((groups) => {
    const p = progress.get();
    const total = groups[groups.length - 1]?.to || 0;
    sub.textContent = `${totalStars(p)} / ${total * 3} stars`;
    for (const g of groups) {
      const tiles = [];
      for (let lv = g.from; lv <= g.to; lv++) tiles.push(tile(lv, p.unlocked, p.levels[lv]));
      list.append(h('section', { class: 'band' },
        h('h2', { class: 'band-title' }, `${g.n} × ${g.n}`, h('span', {}, `Levels ${g.from}–${g.to}`)),
        h('div', { class: 'level-grid' }, tiles)));
    }
    requestAnimationFrame(() => el.querySelector('.is-current')?.scrollIntoView({ block: 'center' }));
  });

  return { el };
}
