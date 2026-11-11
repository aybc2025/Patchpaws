// "Tap = ✕ / Tap = cat" switch under the board.
import { h, s } from '../dom.js';
import { icons } from '../icons.js';
import settings from '../../state/settings.js';
import { makeCat } from '../board/cat.js';

export function createModeSwitch() {
  const catIcon = s('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, makeCat(2));
  const markBtn = h('button', { type: 'button', class: 'mode-opt', onclick: () => settings.set({ tapMode: 'mark' }) }, icons.mark(), 'Tap = ✕');
  const catBtn = h('button', { type: 'button', class: 'mode-opt', onclick: () => settings.set({ tapMode: 'cat' }) }, catIcon, 'Tap = cat');
  const el = h('div', { class: 'mode-switch', role: 'group', 'aria-label': 'What a tap does' }, markBtn, catBtn);

  const update = (st) => {
    markBtn.setAttribute('aria-pressed', String(st.tapMode === 'mark'));
    catBtn.setAttribute('aria-pressed', String(st.tapMode === 'cat'));
    el.dataset.mode = st.tapMode;
  };
  update(settings.get());
  const unsub = settings.subscribe(update);
  return { el, destroy: unsub };
}
