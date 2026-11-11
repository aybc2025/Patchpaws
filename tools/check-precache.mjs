// Fails if a shipped file is missing from sw.js PRECACHE (or listed but absent).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));
const walk = (dir) => readdirSync(join(root, dir)).flatMap((f) => {
  const p = join(dir, f);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const shipped = ['js', 'css', 'fonts', 'icons', 'data'].flatMap(walk).filter((f) => !f.endsWith('.txt'));
const missing = shipped.filter((f) => !listed.has(f));
const absent = [...listed].filter((f) => !existsSync(join(root, f)));
if (missing.length) console.error('Not precached:', missing);
if (absent.length) console.error('Precached but missing:', absent);
console.log(`precache: ${listed.size} entries, ${missing.length + absent.length} problems`);
process.exit(missing.length || absent.length ? 1 : 0);
