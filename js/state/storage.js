// Prefixed, defensive localStorage. Keys are namespaced so other apps on the
// shared github.io origin can't collide with ours. Corrupt data falls back to defaults.
const PREFIX = 'patchpaws:';

export function load(key, fallback, validate = (v) => v && typeof v === 'object') {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return structuredClone(fallback);
    const value = JSON.parse(raw);
    return validate(value) ? value : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

export function save(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* storage full or blocked */ }
}

export function remove(key) {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export function clearAll() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
