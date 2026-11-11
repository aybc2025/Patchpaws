// Accessible bottom sheet: scrim, focus trap, Esc / scrim-tap to close (when dismissible),
// focus returns to whatever opened it. Enters with the drawer curve, exits faster.
import { h } from '../dom.js';

let openCount = 0;

export function openSheet({ label, content, dismissible = true, onClose, className = '' }) {
  const opener = document.activeElement;
  const sheet = h('div', { class: `sheet ${className}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': label, tabindex: '-1' },
    h('div', { class: 'sheet-grab', 'aria-hidden': 'true' }), content);
  const scrim = h('div', { class: 'scrim' });
  const layer = h('div', { class: 'sheet-layer' }, scrim, sheet);
  document.body.append(layer);
  openCount++;
  document.getElementById('app')?.setAttribute('inert', '');
  let closed = false;

  const focusables = () => [...sheet.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])')];
  // Focus the sheet itself: screen readers announce it, keyboard users Tab in, and touch users get no stray focus ring.
  requestAnimationFrame(() => sheet.focus({ preventScroll: true }));

  function onKey(e) {
    if (e.key === 'Escape' && dismissible) { e.preventDefault(); close(); }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (document.activeElement === sheet) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey);
  if (dismissible) scrim.addEventListener('click', () => close());

  function close(reason) {
    if (closed) return Promise.resolve();
    closed = true;
    document.removeEventListener('keydown', onKey);
    layer.classList.add('is-closing');
    openCount--;
    if (!openCount) document.getElementById('app')?.removeAttribute('inert');
    return new Promise((resolve) => {
      setTimeout(() => {
        layer.remove();
        if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
        onClose?.(reason);
        resolve();
      }, 240);
    });
  }

  return { close, sheet };
}

export const closeAllSheets = () => document.querySelectorAll('.sheet-layer').forEach((l) => l.remove());
