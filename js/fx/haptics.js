// Vibration where the device supports it (Android). iOS ignores it silently.
import settings from '../state/settings.js';

export function buzz(pattern) {
  if (!settings.get().haptics || !navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}
