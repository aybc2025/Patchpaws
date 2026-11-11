// Hash router: #/ · #/levels · #/play/24 · #/daily. Slides screens in (deeper = forward).
import { closeAllSheets } from './ui/sheets/sheet.js';
import { stopConfetti } from './fx/confetti.js';

let routes = null;
let current = null; // { screen, depth }
let app = null;

export function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function resolve(hash) {
  const path = hash.replace(/^#/, '') || '/';
  const play = path.match(/^\/play\/(\d+)$/);
  if (play) return { depth: 2, make: () => routes.game({ levelNo: Number(play[1]) }) };
  if (path === '/daily') return { depth: 2, make: () => routes.game({ daily: true }) };
  if (path === '/levels') return { depth: 1, make: () => routes.levels() };
  return { depth: 0, make: () => routes.home() };
}

function render() {
  const { depth, make } = resolve(location.hash);
  closeAllSheets();
  stopConfetti();
  document.getElementById('app')?.removeAttribute('inert');
  const next = make();
  const back = current && depth < current.depth;
  next.el.classList.add('is-entering');
  if (back) next.el.classList.add('is-back');
  next.el.addEventListener('animationend', () => next.el.classList.remove('is-entering', 'is-back'), { once: true });
  if (current) {
    const old = current.screen;
    old.destroy?.();
    old.el.classList.add('is-leaving');
    setTimeout(() => old.el.remove(), 200);
  }
  app.append(next.el);
  current = { screen: next, depth };
  document.title = depth === 0 ? 'Patchpaws' : depth === 1 ? 'Levels · Patchpaws' : 'Playing · Patchpaws';
}

export function startRouter(container, screenFactories) {
  app = container;
  routes = screenFactories;
  window.addEventListener('hashchange', render);
  render();
}
