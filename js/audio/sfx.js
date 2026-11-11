// All sounds are synthesised with Web Audio — no audio files to download.
import settings from '../state/settings.js';

let ctx = null;
let noiseBuf = null;

function audio() {
  if (!settings.get().sound) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Browsers only allow audio after a user gesture — call once from the first tap. */
export function unlockAudio() { audio(); }

function env(g, t, peak, attack, release) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

function tone(freqs, { type = 'sine', peak = 0.15, attack = 0.01, release = 0.2, at = 0 } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqs[0], t);
  freqs.slice(1).forEach(([f, dt]) => osc.frequency.exponentialRampToValueAtTime(f, t + dt));
  env(g, t, peak, attack, release);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + attack + release + 0.05);
}

function noise({ peak = 0.2, attack = 0.02, release = 0.4, freq = 3000, type = 'highpass', at = 0 } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  const f = a.createBiquadFilter();
  f.type = type; f.frequency.value = freq;
  const g = a.createGain();
  env(g, t, peak, attack, release);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
  src.stop(t + attack + release + 0.05);
}

export const sfx = {
  /** cross-stitch tick */
  mark: () => tone([2200, [1600, 0.03]], { type: 'triangle', peak: 0.035, attack: 0.003, release: 0.04 }),
  /** a small rising "mrrp" */
  cat: () => {
    tone([430, [760, 0.09], [600, 0.2]], { type: 'triangle', peak: 0.16, attack: 0.02, release: 0.2 });
    tone([860, [1500, 0.09], [1200, 0.2]], { type: 'sine', peak: 0.04, attack: 0.02, release: 0.18 });
  },
  hiss: () => noise({ peak: 0.16, attack: 0.03, release: 0.45, freq: 2800 }),
  poof: () => tone([320, [110, 0.08]], { peak: 0.12, attack: 0.005, release: 0.1 }),
  chime: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, k) =>
    tone([f], { peak: 0.12, attack: 0.01, release: 0.6, at: k * 0.09 })),
  star: (k) => tone([880 * 2 ** (k * 4 / 12)], { peak: 0.1, attack: 0.005, release: 0.35 }),
  sad: () => [392, 349.23, 293.66].forEach((f, k) => tone([f], { type: 'triangle', peak: 0.08, attack: 0.01, release: 0.4, at: k * 0.16 })),
};
