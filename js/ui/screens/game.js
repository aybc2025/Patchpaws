// The play screen for a numbered level or today's daily puzzle.
import { h, formatTime } from '../dom.js';
import { icons } from '../icons.js';
import { getLevel, levelCount } from '../../game/levels.js';
import { getDaily, dateKey } from '../../game/daily.js';
import { createSession } from '../../state/session.js';
import { recordLevel } from '../../state/progress.js';
import daily, { recordDaily } from '../../state/daily-progress.js';
import { createBoard } from '../board/board.js';
import { createHearts } from '../hud/hearts.js';
import { createTimer } from '../hud/timer.js';
import { createToolbar } from '../hud/toolbar.js';
import { createModeSwitch } from '../hud/mode-switch.js';
import { createHintBubble } from '../hud/hint-bubble.js';
import { attachFx } from '../../fx/fx.js';
import { openWin } from '../sheets/win.js';
import { openLose } from '../sheets/lose.js';
import { openHowTo } from '../sheets/howto.js';
import { go } from '../../router.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function gameScreen({ levelNo = null, daily: isDaily = false }) {
  const key = isDaily ? dateKey() : null;
  const title = isDaily ? `Daily · ${MONTHS[Number(key.slice(5, 7)) - 1]} ${Number(key.slice(8))}` : `Level ${levelNo}`;
  const el = h('main', { class: 'screen game' },
    h('div', { class: 'loading', role: 'status' }, h('span', { class: 'loading-quilt', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')), isDaily ? 'Stitching today’s quilt…' : 'Laying out the quilt…'));
  const cleanups = [];
  let destroyed = false;

  const load = isDaily ? getDaily(key) : getLevel(levelNo);
  load.then((puzzle) => {
    if (destroyed) return;
    if (!puzzle) { go('#/levels'); return; }
    build(puzzle);
  }).catch(() => {
    el.replaceChildren(h('p', { class: 'loading' }, 'This puzzle couldn’t load. Check your connection and reload.'));
  });

  function build(puzzle) {
    const session = createSession({ key: isDaily ? `D${key}` : `L${levelNo}`, puzzle });
    const board = createBoard(session);
    const hearts = createHearts(session.store.get().hearts);
    const timer = createTimer(session);
    const toolbar = createToolbar({ session, onRules: () => openHowTo() });
    const modeSwitch = createModeSwitch();
    const bubble = createHintBubble({ session, patchName: board.patchName });

    el.replaceChildren(
      h('div', { class: 'topbar' },
        h('button', { type: 'button', class: 'iconbtn', 'aria-label': 'Back', onclick: () => go(isDaily ? '#/' : '#/levels') }, icons.back()),
        h('div', { class: 'topbar-title' }, h('h1', {}, title), timer.el),
        hearts.el),
      h('div', { class: 'board-area' }, board.el),
      h('div', { class: 'dock' }, bubble.el, modeSwitch.el, toolbar.el));

    const update = (state) => { board.render(state); toolbar.update(state); bubble.update(state); };
    const unsub = session.store.subscribe(update);
    update(session.store.get());

    const finishWin = () => {
      const { result } = session.store.get();
      let bestMs = result.ms, isNewBest = false;
      if (isDaily) {
        const prev = daily.get().days[key];
        recordDaily(key, result);
        bestMs = Math.min(prev?.ms ?? Infinity, result.ms);
        isNewBest = !!prev && result.ms < prev.ms;
      } else {
        const rec = recordLevel(levelNo, result);
        bestMs = rec.bestMs;
        isNewBest = !!rec.previousBestMs && result.ms < rec.previousBestMs;
      }
      const hasNext = !isDaily && levelNo < levelCount();
      openWin({
        title: isDaily ? 'Daily puzzle solved' : `Level ${levelNo} · ${formatTime(result.ms)}`,
        result, bestMs, isNewBest,
        primary: hasNext ? { label: `Next: level ${levelNo + 1}`, action: () => go(`#/play/${levelNo + 1}`) } : { label: 'Home', action: () => go('#/') },
        secondary: isDaily ? { label: 'Levels', action: () => go('#/levels') } : { label: 'Home', action: () => go('#/') },
      });
    };
    const showLose = () => openLose({ onRetry: () => session.actions.retry(), onHome: () => go('#/') });

    const detachFx = attachFx({ session, board, hearts, onWin: finishWin, onLose: showLose });
    if (session.store.get().status === 'lost') setTimeout(showLose, 400);

    cleanups.push(unsub, detachFx, () => board.destroy(), () => timer.destroy(), () => toolbar.destroy(),
      () => modeSwitch.destroy(), () => bubble.destroy(), () => session.persist());
  }

  return {
    el,
    destroy() {
      destroyed = true;
      cleanups.forEach((fn) => fn());
    },
  };
}
