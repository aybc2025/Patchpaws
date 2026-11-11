// Builds the daily board off the main thread (a 10×10 can take a few hundred ms).
import { buildDaily } from '../game/daily.js';

self.onmessage = ({ data }) => {
  self.postMessage({ key: data.key, code: buildDaily(data.key) });
};
