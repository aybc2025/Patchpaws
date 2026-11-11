// Touch, mouse and keyboard input for the board.
// Tap = ✕ (or cat in cat mode) · double-tap = cat · long-press = cat · drag = paint ✕ / erase.
// Arrow keys move, Space/Enter taps, C places a cat, Backspace clears.
const DOUBLE_TAP_MS = 320;
const LONG_PRESS_MS = 420;

export function attachInput(grid, buttons, n, session) {
  const { actions, store } = session;
  let press = null;     // { id, start, cell, dragging, longFired, timer }
  let lastTap = { cell: -1, t: 0 };

  const cellAt = (x, y) => {
    const first = buttons[0].getBoundingClientRect();
    const last = buttons[buttons.length - 1].getBoundingClientRect();
    const c = Math.floor(((x - first.left) / (last.right - first.left)) * n);
    const r = Math.floor(((y - first.top) / (last.bottom - first.top)) * n);
    return r >= 0 && r < n && c >= 0 && c < n ? r * n + c : -1;
  };

  function onDown(e) {
    if (e.button > 0 || press) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell < 0 || store.get().status !== 'playing') return;
    grid.setPointerCapture?.(e.pointerId);
    press = { id: e.pointerId, cell, dragging: false, longFired: false };
    press.timer = setTimeout(() => {
      if (!press || press.dragging) return;
      press.longFired = true;
      actions.placeCat(press.cell);
    }, LONG_PRESS_MS);
  }

  function onMove(e) {
    if (!press || e.pointerId !== press.id || press.longFired) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (cell < 0 || cell === press.cell && !press.dragging) return;
    if (!press.dragging) {
      press.dragging = true;
      clearTimeout(press.timer);
      actions.beginStroke(press.cell);
    }
    actions.paint(cell);
  }

  function onUp(e) {
    if (!press || e.pointerId !== press.id) return;
    clearTimeout(press.timer);
    const { cell, dragging, longFired } = press;
    press = null;
    if (dragging) { actions.endStroke(); return; }
    if (longFired) return;
    const now = performance.now();
    const isDouble = lastTap.cell === cell && now - lastTap.t < DOUBLE_TAP_MS;
    if (isDouble) {
      lastTap = { cell: -1, t: 0 };
      if (store.get().cells[cell] !== 2) actions.placeCat(cell, { mergeLast: true });
    } else {
      lastTap = { cell, t: now };
      actions.tap(cell);
    }
    focusCell(cell, false);
  }

  function onCancel() {
    if (!press) return;
    clearTimeout(press.timer);
    if (press.dragging) actions.endStroke();
    press = null;
  }

  function focusCell(i, move = true) {
    buttons.forEach((b, k) => { b.tabIndex = k === i ? 0 : -1; });
    if (move) buttons[i].focus();
  }

  function onKey(e) {
    const i = Number(e.target.dataset?.i);
    if (Number.isNaN(i)) return;
    const r = Math.floor(i / n), c = i % n;
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (moves[e.key]) {
      const [dr, dc] = moves[e.key];
      const rr = Math.min(n - 1, Math.max(0, r + dr)), cc = Math.min(n - 1, Math.max(0, c + dc));
      focusCell(rr * n + cc);
    } else if (e.key === ' ' || e.key === 'Enter') actions.tap(i);
    else if (e.key === 'c' || e.key === 'C') actions.placeCat(i);
    else if (e.key === 'x' || e.key === 'X') { if (store.get().cells[i] === 0) actions.tap(i, 'mark'); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { if (store.get().cells[i] !== 0) actions.tap(i, 'mark'); }
    else return;
    e.preventDefault();
  }

  // Clicks are fully handled by pointer events; swallow the synthetic click.
  const onClick = (e) => { if (e.detail > 0) e.preventDefault(); };

  grid.addEventListener('pointerdown', onDown);
  grid.addEventListener('pointermove', onMove);
  grid.addEventListener('pointerup', onUp);
  grid.addEventListener('pointercancel', onCancel);
  grid.addEventListener('keydown', onKey);
  grid.addEventListener('click', onClick);
  grid.addEventListener('contextmenu', (e) => e.preventDefault());

  return () => {
    onCancel();
    grid.removeEventListener('pointerdown', onDown);
    grid.removeEventListener('pointermove', onMove);
    grid.removeEventListener('pointerup', onUp);
    grid.removeEventListener('pointercancel', onCancel);
    grid.removeEventListener('keydown', onKey);
    grid.removeEventListener('click', onClick);
  };
}
