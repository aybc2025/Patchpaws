// One game in progress. Owns the truth (cells, hearts, history) and writes a typed
// `lastEvent` ({ kind, cells, meta, nonce }) that the effects layer observes.
// It knows nothing about animation.
import { createStore } from './store.js';
import { geometry, attackedBy } from '../game/logic.js';
import { findHint, ringDistance, EMPTY, MARK, CAT } from '../game/hints.js';
import { starsFor } from '../game/rules.js';
import settings, { rulesFor } from './settings.js';
import { loadSession, saveSession, dropSession } from './session-store.js';

export function createSession({ key, puzzle }) {
  const { n, regions, solution } = puzzle;
  const geo = geometry(n, regions);
  const fresh = () => ({ cells: new Array(n * n).fill(EMPTY), hearts: 3, mistakes: 0, hintsUsed: 0, elapsedMs: 0, history: [], status: 'playing' });
  const saved = loadSession(key, n * n);
  const store = createStore({ ...fresh(), ...saved, hint: null, lastEvent: null });
  let nonce = 0;
  let stroke = null;

  const get = store.get;
  const isAnswer = (i) => solution[Math.floor(i / n)] === i % n;
  const persist = () => {
    const s = get();
    if (s.status === 'won') dropSession(key);
    else saveSession(key, { cells: s.cells, hearts: s.hearts, mistakes: s.mistakes, hintsUsed: s.hintsUsed, elapsedMs: Math.round(s.elapsedMs), history: s.history.slice(-200), status: s.status });
  };
  const commit = (patch, kind, cells = [], meta = {}) => {
    store.set({ ...patch, lastEvent: { kind, cells, meta, nonce: ++nonce } });
    persist();
  };
  const change = (cells, changes, i, value) => { changes.push([i, cells[i]]); cells[i] = value; };
  const playing = () => get().status === 'playing';

  function tap(i, mode = settings.get().tapMode) {
    if (!playing()) return;
    if (mode === 'cat' && get().cells[i] !== CAT) return placeCat(i);
    const cells = get().cells.slice();
    const changes = [];
    const from = cells[i];
    change(cells, changes, i, from === EMPTY ? MARK : EMPTY);
    const kind = from === EMPTY ? 'mark' : from === CAT ? 'uncat' : 'unmark';
    commit({ cells, history: [...get().history, changes], hint: null }, kind, [i]);
  }

  function placeCat(i, { mergeLast = false } = {}) {
    if (!playing()) return;
    let cells = get().cells.slice();
    let history = get().history;
    if (mergeLast && history.length) { // double-tap: fold the first tap's toggle into this move
      for (const [j, prev] of history[history.length - 1]) cells[j] = prev;
      history = history.slice(0, -1);
    }
    if (cells[i] === CAT) return;
    const changes = [];
    if (!isAnswer(i)) {
      change(cells, changes, i, MARK);
      const hearts = get().hearts - 1;
      const status = hearts <= 0 ? 'lost' : 'playing';
      return commit({ cells, history: [...history, changes], hearts, mistakes: get().mistakes + 1, status, hint: null },
        status === 'lost' ? 'lost' : 'mistake', [i], { heartsLeft: hearts });
    }
    change(cells, changes, i, CAT);
    const auto = [];
    if (settings.get().autoMark) {
      for (const j of attackedBy(geo, i)) {
        if (cells[j] === EMPTY) { change(cells, changes, j, MARK); auto.push([j, ringDistance(n, i, j)]); }
      }
    }
    const won = cells.filter((v) => v === CAT).length === n;
    const patch = { cells, history: [...history, changes], hint: null };
    if (!won) return commit(patch, 'cat', [i], { auto });
    const s = get();
    const stars = starsFor(s);
    commit({ ...patch, status: 'won', result: { stars, ms: s.elapsedMs, mistakes: s.mistakes, hintsUsed: s.hintsUsed } },
      'won', [i], { auto, stars });
  }

  function beginStroke(i) {
    if (!playing()) return;
    stroke = { value: get().cells[i] === MARK ? EMPTY : MARK, changes: [], cells: get().cells.slice() };
    paint(i);
  }
  function paint(i) {
    if (!stroke) return;
    const c = stroke.cells;
    if (c[i] === CAT || c[i] === stroke.value) return;
    change(c, stroke.changes, i, stroke.value);
    store.set({ cells: c.slice(), hint: null, lastEvent: { kind: 'paint', cells: [i], meta: { value: stroke.value }, nonce: ++nonce } });
  }
  function endStroke() {
    if (!stroke) return;
    if (stroke.changes.length) commit({ history: [...get().history, stroke.changes] }, 'strokeEnd', []);
    stroke = null;
  }

  function undo() {
    if (!playing() || !get().history.length) return;
    const cells = get().cells.slice();
    const last = get().history[get().history.length - 1];
    for (let k = last.length - 1; k >= 0; k--) cells[last[k][0]] = last[k][1];
    commit({ cells, history: get().history.slice(0, -1), hint: null }, 'undo', last.map(([j]) => j));
  }

  function restart() { commit({ ...fresh(), hint: null }, 'restart'); }

  function retry() {
    if (get().status !== 'lost') return;
    if (rulesFor().keepOnRetry) commit({ hearts: 3, status: 'playing', hint: null }, 'retry');
    else restart();
  }

  function hint() {
    if (!playing()) return;
    if (get().hint) return dismissHint();
    if (get().hintsUsed >= rulesFor().hints) return commit({}, 'hintEmpty');
    const step = findHint(geo, get().cells, solution);
    if (!step) return;
    commit({ hint: step, hintsUsed: get().hintsUsed + 1 }, 'hint', step.targets, { step });
  }

  function applyHint() {
    const step = get().hint;
    if (!step || !playing()) return;
    if (step.clear != null) return tap(step.clear, 'mark');
    if (step.place != null) return placeCat(step.place);
    const cells = get().cells.slice();
    const changes = [];
    const marked = step.xs.filter((i) => cells[i] === EMPTY);
    marked.forEach((i) => change(cells, changes, i, MARK));
    commit({ cells, history: [...get().history, changes], hint: null }, 'autoMark', marked);
  }

  function dismissHint() { if (get().hint) commit({ hint: null }, 'hintClose'); }

  function tick(dt) {
    if (!playing()) return;
    store.set({ elapsedMs: get().elapsedMs + dt });
    if (Math.floor(get().elapsedMs / 5000) !== Math.floor((get().elapsedMs - dt) / 5000)) persist();
  }

  return {
    key, puzzle, geo, store, persist,
    actions: { tap, placeCat, beginStroke, paint, endStroke, undo, restart, retry, hint, applyHint, dismissHint, tick },
  };
}
