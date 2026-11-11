// Undo · Hint · Restart · Rules. Restart asks for a second tap so it can't be hit by accident.
import { h } from '../dom.js';
import { icons } from '../icons.js';
import { rulesFor } from '../../state/settings.js';

export function createToolbar({ session, onRules }) {
  const { actions } = session;
  const badge = h('span', { class: 'tool-badge' });
  const undoBtn = h('button', { type: 'button', class: 'tile tool', onclick: () => actions.undo() }, icons.undo(), 'Undo');
  const hintBtn = h('button', { type: 'button', class: 'tile tool', onclick: () => actions.hint() }, badge, icons.hint(), 'Hint');
  const restartLabel = h('span', {}, 'Restart');
  let armed = null;
  const restartBtn = h('button', {
    type: 'button', class: 'tile tool',
    onclick: () => {
      if (armed) { clearTimeout(armed); armed = null; restartLabel.textContent = 'Restart'; restartBtn.classList.remove('is-armed'); actions.restart(); return; }
      restartLabel.textContent = 'Tap again';
      restartBtn.classList.add('is-armed');
      armed = setTimeout(() => { armed = null; restartLabel.textContent = 'Restart'; restartBtn.classList.remove('is-armed'); }, 2500);
    },
  }, icons.restart(), restartLabel);
  const rulesBtn = h('button', { type: 'button', class: 'tile tool', onclick: onRules }, icons.rules(), 'Rules');

  const el = h('div', { class: 'toolbar' }, undoBtn, hintBtn, restartBtn, rulesBtn);

  function update(state) {
    const playing = state.status === 'playing';
    undoBtn.disabled = !playing || !state.history.length;
    hintBtn.disabled = !playing;
    restartBtn.disabled = state.status === 'won';
    hintBtn.setAttribute('aria-pressed', String(!!state.hint));
    const limit = rulesFor().hints;
    const left = limit - state.hintsUsed;
    badge.textContent = Number.isFinite(limit) ? String(Math.max(0, left)) : '';
    badge.hidden = !Number.isFinite(limit);
    hintBtn.setAttribute('aria-label', Number.isFinite(limit) ? `Hint, ${Math.max(0, left)} left` : 'Hint');
  }

  return { el, update, destroy: () => clearTimeout(armed) };
}
