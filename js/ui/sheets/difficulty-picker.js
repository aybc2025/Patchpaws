// Cozy / Classic segmented choice, shared by Settings and the first-run rules sheet.
import { h } from '../dom.js';
import settings from '../../state/settings.js';

const OPTIONS = [
  { id: 'cozy', name: 'Cozy', note: 'Unlimited hints (each costs a star). Losing keeps your board.' },
  { id: 'classic', name: 'Classic', note: '3 hints per puzzle. Losing starts the quilt over.' },
];

export function createDifficultyPicker() {
  const note = h('p', { class: 'picker-note' });
  const buttons = OPTIONS.map((o) => h('button', {
    type: 'button', class: 'seg-opt', onclick: () => settings.set({ difficulty: o.id }),
  }, o.name));
  const el = h('div', { class: 'picker' },
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Difficulty' }, buttons), note);

  const update = (st) => {
    OPTIONS.forEach((o, k) => buttons[k].setAttribute('aria-pressed', String(st.difficulty === o.id)));
    note.textContent = OPTIONS.find((o) => o.id === st.difficulty)?.note || '';
  };
  update(settings.get());
  const unsub = settings.subscribe(update);
  return { el, destroy: unsub };
}
