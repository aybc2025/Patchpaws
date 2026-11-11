# Patchpaws — notes for Claude Code

A cat logic puzzle PWA (one cat per colour patch, row and column; cats can't touch, even diagonally).
Same rules as Meowdoku (Oakever Games), but every name, piece of art, sound and line of code here is original.
Never import Meowdoku's assets or name.

## On opening this repo, run automatically

There is **no build and no npm**: it is plain ES modules served as static files. To verify:

```bash
node tools/verify-levels.mjs        # all 300 levels: exactly one answer, solvable without guessing
node tools/check-precache.mjs       # every shipped file is listed in sw.js PRECACHE
python3 -m http.server 8765 --directory ..   # serve the parent dir, then:
python3 -I tools/smoke-test.py http://localhost:8765/<repo-folder>/ /tmp/shots   # plays the main flows, fails on console errors
python3 -I tools/check_install.py http://localhost:8765/<repo-folder>/            # PWA installability
```

All four passed at the time of the first release (smoke test: 0 console errors; install check: no manifest or
installability errors, SW `activated`; offline play of levels and daily verified).

## package-lock.json and CI

No `package.json` exists, so the lockfile / bootstrap-vs-locked rules don't apply. CI (`.github/workflows/verify.yml`)
runs the two Node checks on Node 22 with no install step. If a package.json is ever added, follow the
app-development skill's bootstrap → locked workflow rules.

## What you can NOT do here, even if asked

- Turn on GitHub Pages (owner: Settings → Pages → Deploy from a branch → `main` / root).
- Test the Android install itself (only desktop Chromium's installability check runs here).
- Push to `main` without being asked — every push to `main` is a live deploy.

## Architecture

| Folder | What lives there |
|---|---|
| `js/game/` | **Pure logic, no DOM** — also runs in Node. `rng` (seeded PRNG), `solver` (solution counter), `logic` (human-style deductions: powers hints AND level grading), `generator` (+ encode/decode), `hints`, `rules` (stars, hint wording), `levels` (loads `data/levels.json`), `daily` (date-seeded board via a Web Worker). |
| `js/state/` | The "hooks": `session.js` owns one game (actions → state + typed `lastEvent`), `session-store.js` (resume mid-game), `settings`, `progress`, `daily-progress`, `store` (tiny observable), `storage` (prefixed, defensive localStorage). |
| `js/ui/board/` | Quilt SVG (`quilt-svg`, `patterns`, `seams`), the cat (`cat.js`), `board.js` (diff-renders marks/cats), `input.js` (tap / double-tap / long-press / drag / keyboard). |
| `js/ui/hud/` | Hearts (crack animation), timer, toolbar, tap-mode switch, hint bubble. |
| `js/ui/sheets/` | Accessible bottom sheet base + win / lose / how-to / settings / difficulty picker. |
| `js/ui/screens/` | home, levels, game. `js/router.js` = hash routes `#/`, `#/levels`, `#/play/N`, `#/daily`. |
| `js/fx/` | **Effects observer** (`fx.js`) + `cat-fx`, `board-fx`, pooled `confetti`, `haptics`. |
| `js/audio/sfx.js` | Web Audio synth — no audio files. |
| `tools/` | Level generator/verifier, precache check, smoke + install tests. |
| `icon-design/make_icons.py` | Icon generator (renders SVG in Chromium at 8×, LANCZOS down). |

Non-obvious structure to keep:
- **Animation never touches game state.** `session.js` writes `lastEvent = { kind, cells, meta, nonce }`;
  `fx/fx.js` dedupes on `nonce` and plays effects. Add new effects there, not in the session.
- `js/game/*` must stay DOM-free so the Node tools and the daily Web Worker can import it
  (`daily.js` touches `localStorage` only inside `getDaily`, which the worker never calls).
- `daily.worker.js` is a module worker; `getDaily` falls back to generating on the main thread.

## Intentional decisions — do not revert without asking

- **Name: Patchpaws** (owner asked for a name other than Meowdoku). English only (owner's choice).
- **Vanilla ES modules, no React/Vite**: the build sandbox had no npm access, so a tested no-build app was chosen.
- **Difficulty** (owner's choice, one setting controls both):
  - Cozy (default): unlimited hints, but any hint caps the result at 2 stars; losing keeps cats and ✕ marks.
  - Classic: 3 hints per puzzle; losing restarts the board and timer.
- Stars: 3 − (any mistake) − (any hint), never below 1.
- A wrong cat costs a heart and leaves an ✕ on that square. ✕ marks are never judged; a hint flags an ✕ on an answer square first.
- Removing a cat leaves the auto-✕ marks around it (they're still correct, since only correct cats can be placed).
- Double-tap folds the first tap's toggle into the cat move (one undo step).
- Restart needs a second tap within 2.5 s.
- Levels: 300, deterministic (`node tools/generate-levels.mjs`), bands 5×5 (1–8), 6×6 (9–30), 7×7 (31–70), 8×8 (71–140), 9×9 (141–220), 10×10 (221–300); every 5th level within a band is a breather.
- Daily: size by weekday (Mon 7, Tue/Wed 8, Thu/Fri 9, Sat/Sun 10), seed `patchpaws-daily-YYYY-MM-DD` (player's local date).
- Patch colours are shuffled per puzzle (seeded by the puzzle code); each colour also has its own print (colour-blind support).
- Theme: night only (light theme was not requested).

## Visual system ("Midnight quilt") — source of truth is `css/tokens.css`

- Palette: Midnight `#23264A` (bg) · Dusk `#2F3366` (raised) · Dusk-hi `#3A3F7A` · Dusk-lo `#262A55` · Moonlight `#F4F2FF` (text) · Haze `#A7AAD9` (secondary) · **Yarn `#FFC54D` (the only accent)** · Hiss `#FF6F7D` (hearts/mistakes only) · Seam ink `#1C1E3D`.
- Patches: rose `#F6A6B9` · apricot `#FFC39E` · butter `#F8E59A` · mint `#A9E3BF` · lagoon `#93D3D6` · cornflower `#A3BEF4` · lilac `#C8B3F0` · pistachio `#CFDB9C` · coral `#F49A8E` · fog `#D9D3E8`, prints at 9% ink.
- Contrast: Moonlight/Midnight 13.9:1 · Haze/Midnight 6.5:1 · Haze/Dusk 5.1:1 · Ink/Yarn 10.6:1 · Hiss/Midnight 5.6:1 · Ink on patches ≥7.6:1.
- Type: Poppins 400/500/700 (woff subsets in `fonts/`), scale 12/14/16/20/25/31/46, sentence case, tabular numbers for times.
- Spacing 4px base (4/8/12/16/24/32/48). Radius: surfaces 20, sheets 28 top, controls pill, board 16 outside / square inside.
- Elevation: solid offset shadows (`0 5px 0` darker self), no blurred grey shadows.
- Motion: `--ease-out` (.23,1,.32,1) enter/exit · `--ease-in-out` (.77,0,.175,1) move · `--ease-drawer` (.32,.72,0,1) sheets · `--ease-pop` cat landings & stars only.
  Durations: tap 100 · ✕ 120 · toggles 200 · cat plop 320–340 · sheet 420 in / 240 out · screens 280 · stitch-in ≤ 700 · win ≈ 1.5 s.
- Frequency rules: drag-painting ✕ has no animation; single ✕ is a 120 ms pop. Reduced motion: no movement, events still flash (red for mistakes, yellow for hints), no confetti.
- Only `transform`/`opacity`/`filter` animate. Hover is gated behind `(hover: hover) and (pointer: fine)`.

## App icons

Concept: the app's own sleeping ginger cat on a four-patch quilt square (rose/butter/mint/cornflower, stitched seams) on Midnight —
the same motif as the board. Favicon uses a simplified cat (thicker strokes, no whiskers/stripes, no quilt).
Generated by `icon-design/make_icons.py` into `icons/`: 192, 512, 512-maskable (content scaled into the safe zone), apple-touch 180, favicon 32.
Viewed at full size, through a circular mask, and at 96/48 px before shipping.

## PWA install identity

- `manifest.webmanifest`: `id` = `./patchpaws-app` (deliberately different from `start_url`), `start_url` and `scope` = `./`.
- Cache names start with `patchpaws-` and the SW deletes only those (shared `github.io` origin). Storage keys start with `patchpaws:`.
- **Bump `VERSION` in `sw.js` on every release** so players get the "A new version is ready" toast.
- If the owner reports "This app is already installed" with no app: fix the cause, change the manifest `id`, remove the old shortcut,
  uninstall any leftover entry in Android Settings → Apps, then Chrome ⋮ → Install app.

## Deployment model

GitHub Pages, **Deploy from a branch → `main` / (root)**; `.nojekyll` is present. Every push to `main` goes live; no build step.
The CI workflow only verifies. No Netlify, no Firebase, no secrets.
