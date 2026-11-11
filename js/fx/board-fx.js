// Board-level motion: cross-stitch pops and ripples, the quilt stitching itself
// together at level start, the hint spotlight, the shake on a mistake, the win shimmer.
import { s, reducedMotion } from '../ui/dom.js';
import { outlinePath } from '../ui/board/seams.js';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

export function popMark(board, i, delay = 0) {
  const m = board.marks.get(i);
  if (!m || reducedMotion()) return;
  m.animate([{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'none' }],
    { duration: 120, delay, easing: EASE_OUT, fill: 'backwards' });
}

/** Crosses appear ring by ring outward from the cat (18–22ms per ring, ≤140ms). */
export function ripple(board, auto) {
  for (const [i, dist] of auto) popMark(board, i, Math.min(140, 60 + (dist - 1) * 22));
}

export function stitchIn(board) {
  if (reducedMotion()) return;
  const { n } = board;
  board.quilt.patchRects.forEach((rect, i) => {
    const d = (Math.floor(i / n) + (i % n)) * 22;
    rect.animate([{ opacity: 0, transform: 'scale(0.86)' }, { opacity: 1, transform: 'none' }],
      { duration: 280, delay: Math.min(d, 420), easing: EASE_OUT, fill: 'backwards' });
  });
  board.quilt.seam.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
    { duration: 520, delay: 160, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'backwards' });
  board.quilt.stitch.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 620, fill: 'backwards' });
}

export function shake(board) {
  if (reducedMotion()) return;
  board.el.animate([
    { transform: 'none' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' }, { transform: 'translateX(3px)' }, { transform: 'none' },
  ], { duration: 340, delay: 120, easing: 'ease-out' });
}

export function shimmer(board) {
  if (reducedMotion()) return;
  board.quilt.shimmer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${board.n * 2.2}px)` }],
    { duration: 950, delay: 200, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
}

/** Dims everything outside the hint's patch/row/column and stitches a moving outline round it. */
export function showFocus(board, step) {
  const { n } = board;
  const layer = board.quilt.focus;
  layer.replaceChildren();
  const inFocus = new Set((step.focus || []).flatMap((u) => u.cells));
  if (inFocus.size) {
    const dim = s('g', { class: 'focus-dim' });
    for (let i = 0; i < n * n; i++) {
      if (!inFocus.has(i)) dim.append(s('rect', { x: i % n, y: Math.floor(i / n), width: 1.01, height: 1.01 }));
    }
    layer.append(dim);
    layer.append(s('path', { class: 'focus-outline', d: outlinePath(n, (r, c) => inFocus.has(r * n + c)) }));
  }
  for (const i of step.targets || []) {
    layer.append(s('rect', { class: 'focus-target', x: (i % n) + 0.1, y: Math.floor(i / n) + 0.1, width: 0.8, height: 0.8, rx: 0.2 }));
  }
  layer.classList.add('is-on');
}

export function clearFocus(board) {
  const layer = board.quilt.focus;
  if (!layer.childNodes.length) return;
  layer.classList.remove('is-on');
  layer.replaceChildren();
}
