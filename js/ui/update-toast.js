// "New version ready" toast with a Refresh button.
import { h } from './dom.js';

export function showUpdateToast(onRefresh) {
  if (document.querySelector('.toast')) return;
  const toast = h('div', { class: 'toast', role: 'status' },
    h('span', {}, 'A new version is ready.'),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => { toast.remove(); onRefresh(); } }, 'Refresh'));
  document.body.append(toast);
}
