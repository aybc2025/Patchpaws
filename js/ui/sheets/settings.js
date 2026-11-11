// Settings: difficulty, sound, vibration, auto-✕, and a two-tap progress reset.
import { h } from '../dom.js';
import { openSheet } from './sheet.js';
import settings from '../../state/settings.js';
import { clearAll } from '../../state/storage.js';
import { createDifficultyPicker } from './difficulty-picker.js';

function toggle(key, label, note) {
  const sw = h('button', { type: 'button', role: 'switch', class: 'switch', 'aria-label': label, onclick: () => settings.set({ [key]: !settings.get()[key] }) },
    h('span', { class: 'switch-knob' }));
  const row = h('div', { class: 'setting-row' }, h('div', {}, h('b', {}, label), note && h('span', {}, note)), sw);
  const update = (st) => sw.setAttribute('aria-checked', String(!!st[key]));
  update(settings.get());
  return { row, unsub: settings.subscribe(update) };
}

export function openSettings({ onReset } = {}) {
  const picker = createDifficultyPicker();
  const toggles = [
    toggle('sound', 'Sound'),
    toggle('haptics', 'Vibration', 'Android only'),
    toggle('autoMark', 'Auto ✕', 'Cross out around each cat'),
  ];
  let armed = false;
  const reset = h('button', {
    type: 'button', class: 'btn btn-quiet danger',
    onclick: () => {
      if (!armed) { armed = true; reset.textContent = 'Tap again to erase all progress'; return; }
      clearAll();
      sheet.close().then(() => onReset?.());
    },
  }, 'Reset progress');

  const content = h('div', { class: 'sheet-body' },
    h('h2', { class: 'sheet-title' }, 'Settings'),
    h('div', { class: 'sheet-section' }, h('h3', { class: 'sheet-h3' }, 'Difficulty'), picker.el),
    h('div', { class: 'setting-list' }, toggles.map((t) => t.row)),
    h('button', { type: 'button', class: 'btn btn-primary', onclick: () => sheet.close() }, 'Done'),
    reset);

  const sheet = openSheet({
    label: 'Settings', content,
    onClose: () => { picker.destroy(); toggles.forEach((t) => t.unsub()); },
  });
  return sheet;
}
