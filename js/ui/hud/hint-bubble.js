// Speech bubble under the board that explains the hint, with "Show me" to apply it.
import { h } from '../dom.js';
import { icons } from '../icons.js';
import { hintText } from '../../game/rules.js';

export function createHintBubble({ session, patchName }) {
  const text = h('p', { class: 'bubble-text' });
  const apply = h('button', { type: 'button', class: 'btn btn-primary bubble-apply', onclick: () => session.actions.applyHint() }, 'Show me');
  const close = h('button', { type: 'button', class: 'iconbtn bubble-close', 'aria-label': 'Close hint', onclick: () => session.actions.dismissHint() }, icons.close());
  const el = h('div', { class: 'bubble', role: 'status', 'aria-live': 'polite', hidden: true }, text, h('div', { class: 'bubble-actions' }, close, apply));
  let shownFor = null;
  let flashTimer = null;

  function show(message, withApply) {
    text.textContent = message;
    apply.hidden = !withApply;
    close.hidden = !withApply;
    el.hidden = false;
    el.classList.remove('is-in');
    void el.offsetWidth; // restart the entrance
    el.classList.add('is-in');
  }

  function update(state) {
    const e = state.lastEvent;
    if (e?.kind === 'hintEmpty' && shownFor !== e.nonce) {
      shownFor = e.nonce;
      show('No hints left for this puzzle on Classic.', false);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => { el.hidden = true; }, 2400);
      return;
    }
    if (state.hint) {
      if (shownFor !== state.hint) { shownFor = state.hint; show(hintText(state.hint, patchName), true); }
    } else if (shownFor && typeof shownFor === 'object') {
      shownFor = null;
      el.hidden = true;
    }
  }

  return { el, update, destroy: () => clearTimeout(flashTimer) };
}
