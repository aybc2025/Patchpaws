// Cat motion: landing plop, hiss-and-poof on a mistake, the win wave, the startle on
// losing, and small idle moments (tail flick, ear twitch, a quick peek).
import { s, reducedMotion } from '../ui/dom.js';
import { catInCell, furFor } from '../ui/board/cat.js';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const catOf = (node) => node?.querySelector('.cat');
const rc = (board, i) => [Math.floor(i / board.n), i % board.n];

export function plop(board, i) {
  const cat = catOf(board.cats.get(i));
  if (!cat || reducedMotion()) return;
  cat.animate([
    { transform: 'translateY(-45%) scale(0.92)', opacity: 0 },
    { transform: 'translateY(0) scale(1.14, 0.84)', opacity: 1, offset: 0.45 },
    { transform: 'scale(0.95, 1.06)', offset: 0.72 },
    { transform: 'none', opacity: 1 },
  ], { duration: 340, easing: EASE_OUT });
  const [r, c] = rc(board, i);
  const dust = s('ellipse', { class: 'fx-dust', cx: c + 0.5, cy: r + 0.92, rx: 0.36, ry: 0.09 });
  board.quilt.fx.append(dust);
  dust.animate([{ transform: 'scale(0.4)', opacity: 0.85 }, { transform: 'scale(1.5, 1.2)', opacity: 0 }],
    { duration: 340, delay: 140, easing: EASE_OUT, fill: 'both' }).onfinish = () => dust.remove();
  cat.querySelector('.cat-ear-r')?.animate(
    [{ transform: 'none' }, { transform: 'rotate(16deg)' }, { transform: 'none' }],
    { duration: 240, delay: 380, easing: EASE_IN_OUT });
}

/** Wrong square: a grumpy cat puffs up, shakes, hisses and vanishes in a puff. Resolves when done. */
export function hissAndPoof(board, i) {
  const [r, c] = rc(board, i);
  const mark = board.marks.get(i);
  const flash = s('rect', { class: 'fx-flash', x: c + 0.04, y: r + 0.04, width: 0.92, height: 0.92, rx: 0.16 });
  board.quilt.fx.append(flash);
  flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 650, easing: EASE_OUT, fill: 'both' }).onfinish = () => flash.remove();
  if (reducedMotion()) return Promise.resolve();
  if (mark) mark.style.setProperty('opacity', '0');
  const holder = catInCell(r, c, furFor(i, board.n));
  const cat = catOf(holder);
  cat.dataset.mood = 'angry';
  board.quilt.fx.append(holder);
  const anim = cat.animate([
    { transform: 'scale(0.9)', opacity: 0, offset: 0 },
    { transform: 'scale(1.18)', opacity: 1, offset: 0.16 },
    { transform: 'translateX(-9%) scale(1.18)', offset: 0.26 },
    { transform: 'translateX(9%) scale(1.18)', offset: 0.36 },
    { transform: 'translateX(-7%) scale(1.18)', offset: 0.46 },
    { transform: 'translateX(7%) scale(1.18)', offset: 0.56 },
    { transform: 'translateX(0) scale(1.2)', opacity: 1, offset: 0.68 },
    { transform: 'scale(0.35)', opacity: 0, offset: 1 },
  ], { duration: 620, easing: 'ease-out', fill: 'both' });
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const puff = s('circle', { class: 'fx-puff', cx: c + 0.5, cy: r + 0.55, r: 0.13 });
    board.quilt.fx.append(puff);
    puff.animate([
      { transform: 'translate(0, 0) scale(0.4)', opacity: 0 },
      { transform: 'translate(0, 0) scale(0.6)', opacity: 0.9, offset: 0.2 },
      { transform: `translate(${Math.cos(a) * 0.42}px, ${Math.sin(a) * 0.42}px) scale(1.3)`, opacity: 0 },
    ], { duration: 320, delay: 440, easing: EASE_OUT, fill: 'both' }).onfinish = () => puff.remove();
  }
  return anim.finished.then(() => {
    holder.remove();
    if (mark) {
      mark.style.removeProperty('opacity');
      mark.animate([{ opacity: 0, transform: 'scale(0.7)' }, { opacity: 1, transform: 'none' }], { duration: 120, easing: EASE_OUT });
    }
  });
}

/** Every cat wakes up and hops, in a diagonal wave from the top-left corner. */
export function winWave(board) {
  const order = [...board.cats.keys()].sort((a, b) => (Math.floor(a / board.n) + a % board.n) - (Math.floor(b / board.n) + b % board.n));
  order.forEach((i, k) => {
    const cat = catOf(board.cats.get(i));
    if (!cat) return;
    setTimeout(() => { cat.dataset.mood = 'awake'; }, reducedMotion() ? 0 : k * 70);
    if (reducedMotion()) return;
    cat.animate([
      { transform: 'none' },
      { transform: 'scale(1.08, 0.9)', offset: 0.15 },
      { transform: 'translateY(-32%) scale(0.96, 1.06)', offset: 0.5 },
      { transform: 'scale(1.1, 0.9)', offset: 0.82 },
      { transform: 'none' },
    ], { duration: 500, delay: k * 70, easing: EASE_IN_OUT });
  });
}

export function startle(board) {
  board.cats.forEach((node) => {
    const cat = catOf(node);
    if (!cat) return;
    cat.dataset.mood = 'angry';
    setTimeout(() => { cat.dataset.mood = 'sleep'; }, 1400);
    if (reducedMotion()) return;
    cat.animate([{ transform: 'none' }, { transform: 'translateY(-26%) scale(1.1)', offset: 0.35 }, { transform: 'none' }],
      { duration: 380, delay: Math.random() * 120, easing: EASE_OUT });
  });
}

export function calmAll(board) {
  board.cats.forEach((node) => { const cat = catOf(node); if (cat) cat.dataset.mood = 'sleep'; });
}

/** Small ambient moments. Returns a stop function. */
export function startIdle(board, isPlaying) {
  const timer = setInterval(() => {
    if (document.hidden || reducedMotion() || !isPlaying() || !board.cats.size) return;
    const nodes = [...board.cats.values()];
    const cat = catOf(nodes[Math.floor(Math.random() * nodes.length)]);
    if (!cat || cat.dataset.mood !== 'sleep') return;
    const roll = Math.random();
    if (roll < 0.4) {
      cat.querySelector('.cat-tail').animate([{ transform: 'none' }, { transform: 'rotate(-16deg)' }, { transform: 'rotate(8deg)' }, { transform: 'none' }],
        { duration: 800, easing: EASE_IN_OUT });
    } else if (roll < 0.75) {
      const left = Math.random() < 0.5;
      cat.querySelector(left ? '.cat-ear-l' : '.cat-ear-r').animate(
        [{ transform: 'none' }, { transform: `rotate(${left ? -16 : 16}deg)` }, { transform: 'none' }], { duration: 220, easing: EASE_IN_OUT });
    } else {
      cat.dataset.mood = 'awake';
      setTimeout(() => { if (cat.dataset.mood === 'awake' && isPlaying()) cat.dataset.mood = 'sleep'; }, 900);
    }
  }, 2400);
  return () => clearInterval(timer);
}
