// Home: wordmark with a peeking cat, continue button, daily puzzle card, shortcuts.
import { h, s, formatTime, reducedMotion } from '../dom.js';
import { icons } from '../icons.js';
import { makeCat, catInCell, furFor } from '../board/cat.js';
import { buildQuilt, paletteFor } from '../board/quilt-svg.js';
import { getLevel, levelCount, loadLevels } from '../../game/levels.js';
import { dateKey, dailySize } from '../../game/daily.js';
import progress, { totalStars } from '../../state/progress.js';
import daily, { currentStreak, weekStrip } from '../../state/daily-progress.js';
import { hasSession } from '../../state/session-store.js';
import { openSettings } from '../sheets/settings.js';
import { openHowTo } from '../sheets/howto.js';
import { go } from '../../router.js';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function logo() {
  const cat = makeCat(0);
  cat.dataset.mood = 'awake';
  const peek = s('svg', { class: 'logo-cat', viewBox: '0 0 100 100', 'aria-hidden': 'true' }, cat);
  const el = h('h1', { class: 'logo' }, h('span', { class: 'logo-peek' }, peek), h('span', { class: 'logo-word' }, 'Patchpaws'));
  let t = null;
  const blink = () => {
    cat.dataset.mood = 'sleep';
    setTimeout(() => { cat.dataset.mood = 'awake'; }, 160);
    t = setTimeout(blink, 2600 + Math.random() * 3200);
  };
  t = setTimeout(blink, reducedMotion() ? 3000 : 1500);
  return { el, destroy: () => clearTimeout(t) };
}

async function quiltPreview(holder) {
  const p = await getLevel(9);
  if (!p) return;
  const q = buildQuilt({ n: p.n, regions: p.regions, palette: paletteFor(p.code, p.n), className: 'quilt home-quilt' });
  [1, 4].forEach((r) => q.cats.append(catInCell(r, p.solution[r], furFor(r * p.n + p.solution[r], p.n))));
  holder.replaceChildren(q.svg);
}

function dailyCard() {
  const key = dateKey();
  const done = daily.get().days[key];
  const streak = currentStreak();
  const n = dailySize(key);
  const sub = done
    ? `Solved in ${formatTime(done.ms)} · ${streak}-day streak`
    : `${WEEKDAYS[new Date().getDay()]} · ${n}×${n}${streak ? ` · ${streak}-day streak` : ''}`;
  const week = weekStrip(key).map((d) => h('span', {
    class: `day${d.done ? ' is-done' : ''}${d.today ? ' is-today' : ''}`, 'aria-label': `${d.key}${d.done ? ', solved' : ''}`,
  }, d.done ? icons.paw() : d.label));
  return h('button', { type: 'button', class: 'daily-card', onclick: () => go('#/daily') },
    h('span', { class: 'daily-text' }, h('b', {}, 'Daily puzzle'), h('span', {}, sub)),
    h('span', { class: 'daily-play', 'aria-hidden': 'true' }, done ? icons.check() : icons.play()),
    h('span', { class: 'week', 'aria-hidden': 'true' }, week));
}

export function homeScreen() {
  const brand = logo();
  const quiltHolder = h('div', { class: 'home-quilt-holder', 'aria-hidden': 'true' });
  const playBtn = h('button', { type: 'button', class: 'btn btn-primary btn-big' }, 'Play');
  const starsTile = h('button', { type: 'button', class: 'tile', onclick: () => go('#/levels') }, icons.star(true), '0 stars');

  const el = h('main', { class: 'screen home' },
    h('div', { class: 'topbar' }, h('span'),
      h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Settings', onclick: () => openSettings({ onReset: () => location.reload() }) }, icons.settings())),
    h('div', { class: 'home-hero' }, brand.el, quiltHolder),
    h('div', { class: 'home-actions' },
      playBtn,
      dailyCard(),
      h('div', { class: 'home-tiles' },
        h('button', { type: 'button', class: 'tile', onclick: () => go('#/levels') }, icons.levels(), 'Levels'),
        h('button', { type: 'button', class: 'tile', onclick: () => openHowTo() }, icons.rules(), 'How to play'),
        starsTile)));

  loadLevels().then(() => {
    const next = Math.min(progress.get().unlocked, levelCount());
    const allDone = progress.get().unlocked > levelCount();
    playBtn.textContent = allDone ? 'Pick a level' : `${hasSession(`L${next}`) ? 'Continue' : 'Play'} level ${next}`;
    playBtn.onclick = () => go(allDone ? '#/levels' : `#/play/${next}`);
    starsTile.lastChild.textContent = `${totalStars()} stars`;
    quiltPreview(quiltHolder);
  }).catch(() => { playBtn.textContent = 'Couldn’t load levels — reload'; playBtn.onclick = () => location.reload(); });

  if (!progress.get().seenHowTo) {
    setTimeout(() => openHowTo({ firstRun: true, onClose: () => progress.set({ seenHowTo: true }) }), 650);
  }

  return { el, destroy: brand.destroy };
}
