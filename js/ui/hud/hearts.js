// Three hearts. A lost heart cracks down the middle and its halves fall away.
import { h, s, reducedMotion } from '../dom.js';
import { HEART_PATH } from '../icons.js';

const CRACK = 'L13 17 L11 14 L13 11 L11 8.5 Z';
const LEFT = `M12 6.5 C11 4.9 9.3 3.7 7.3 3.7 C4.7 3.7 2.5 5.8 2.5 8.6 C2.5 13 6 16.5 12 20.5 ${CRACK}`;
const RIGHT = `M12 6.5 C13 4.9 14.7 3.7 16.7 3.7 C19.3 3.7 21.5 5.8 21.5 8.6 C21.5 13 18 16.5 12 20.5 ${CRACK}`;

export function createHearts(initial = 3) {
  const items = [0, 1, 2].map(() => {
    const left = s('path', { class: 'heart-half', d: LEFT });
    const right = s('path', { class: 'heart-half', d: RIGHT });
    const svg = s('svg', { class: 'heart', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
      s('path', { class: 'heart-empty', d: HEART_PATH }), left, right);
    return { svg, left, right };
  });
  const label = h('span', { class: 'visually-hidden' });
  const el = h('div', { class: 'hearts', role: 'img' }, items.map((x) => x.svg), label);

  function set(count) {
    items.forEach((x, k) => x.svg.classList.toggle('is-full', k < count));
    el.setAttribute('aria-label', `${count} of 3 hearts left`);
  }

  /** Animate the heart at index `left` (the one just lost). */
  function crack(left) {
    const x = items[left];
    if (!x) return;
    if (reducedMotion()) { set(left); return; }
    const opts = { duration: 520, delay: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' };
    x.svg.animate([{ transform: 'none' }, { transform: 'scale(1.25)', offset: 0.3 }, { transform: 'none' }], { duration: 300 });
    const a = x.left.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(-3px, 9px) rotate(-24deg)', opacity: 0 }], opts);
    x.right.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(3px, 9px) rotate(24deg)', opacity: 0 }], opts);
    a.finished.then(() => {
      set(left);
      x.left.getAnimations().forEach((an) => an.cancel());
      x.right.getAnimations().forEach((an) => an.cancel());
    });
  }

  set(initial);
  return { el, set, crack };
}
