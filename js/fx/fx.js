// The effects observer. Watches the session's lastEvent (deduped by nonce) and plays
// the matching motion, sound and vibration. It never writes game state.
import { reducedMotion } from '../ui/dom.js';
import { sfx } from '../audio/sfx.js';
import { buzz } from './haptics.js';
import { burst } from './confetti.js';
import * as catFx from './cat-fx.js';
import * as boardFx from './board-fx.js';

export function attachFx({ session, board, hearts, onWin, onLose }) {
  let seen = session.store.get().lastEvent?.nonce ?? 0;
  const timers = new Set();
  const later = (ms, fn) => { const t = setTimeout(() => { timers.delete(t); fn(); }, reducedMotion() ? Math.min(ms, 250) : ms); timers.add(t); };

  function confettiFromBoard() {
    if (reducedMotion()) return;
    const r = board.el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.55, 100);
  }

  const handlers = {
    mark: (e) => { boardFx.popMark(board, e.cells[0]); sfx.mark(); },
    cat: (e) => {
      catFx.plop(board, e.cells[0]);
      boardFx.ripple(board, e.meta.auto);
      sfx.cat(); buzz(12);
    },
    autoMark: (e) => { e.cells.forEach((i, k) => boardFx.popMark(board, i, Math.min(140, k * 18))); sfx.mark(); },
    mistake: (e) => {
      sfx.hiss(); buzz([30, 40, 70]);
      boardFx.shake(board);
      hearts.crack(e.meta.heartsLeft);
      catFx.hissAndPoof(board, e.cells[0]).then(() => sfx.poof());
    },
    lost: (e) => {
      handlers.mistake(e);
      later(700, () => { catFx.startle(board); sfx.sad(); });
      later(1250, onLose);
    },
    won: (e) => {
      catFx.plop(board, e.cells[0]);
      boardFx.ripple(board, e.meta.auto);
      sfx.cat(); buzz([15, 60, 15, 60, 40]);
      later(380, () => {
        catFx.winWave(board);
        boardFx.shimmer(board);
        sfx.chime();
      });
      later(620, confettiFromBoard);
      later(1500, onWin);
    },
    hint: (e) => { boardFx.showFocus(board, e.meta.step); buzz(8); },
    retry: () => { catFx.calmAll(board); hearts.set(session.store.get().hearts); },
    restart: () => { catFx.calmAll(board); hearts.set(3); boardFx.stitchIn(board); },
  };

  const unsubscribe = session.store.subscribe((state) => {
    if (!state.hint) boardFx.clearFocus(board);
    const e = state.lastEvent;
    if (!e || e.nonce === seen) return;
    seen = e.nonce;
    handlers[e.kind]?.(e);
  });

  boardFx.stitchIn(board);
  const stopIdle = catFx.startIdle(board, () => session.store.get().status === 'playing');

  return () => {
    unsubscribe();
    stopIdle();
    timers.forEach(clearTimeout);
  };
}
