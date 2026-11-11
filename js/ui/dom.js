// Tiny DOM helpers. Text always goes in as text nodes; null/false children are skipped.
const SVG_NS = 'http://www.w3.org/2000/svg';

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false || child === true) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function applyProps(el, props, isSvg) {
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.setAttribute('class', value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'style') for (const [p, v] of Object.entries(value)) el.style.setProperty(p, v);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (key === 'text') el.textContent = value;
    else if (!isSvg && key in el && typeof value !== 'string') el[key] = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
}

/** h('button', { class: 'btn', onclick }, 'Label') */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  applyProps(el, props, false);
  return append(el, children);
}

/** s('path', { d: '…' }) — SVG element */
export function s(tag, props, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  applyProps(el, props, true);
  return append(el, children);
}

export function mount(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Promise that resolves after ms, or immediately when reduced motion is on and skip=true. */
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = String(total % 60).padStart(2, '0');
  return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
