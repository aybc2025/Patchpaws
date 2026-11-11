# Patchpaws

A cozy cat logic puzzle you can install on your phone. Put one cat in every colour patch of the quilt — one per row, one per column, and no two cats may touch, not even at the corners.

**Play:** https://aybc2025.github.io/Patchpaws/

- 300 levels from 5×5 to 10×10, every one with a single answer you can reach without guessing
- A daily puzzle, the same for everyone that day, with a streak
- Cozy or Classic difficulty, 3 hearts, step-by-step hints
- Works offline; installs as an app from Chrome's ⋮ menu → **Install app**

Plain HTML, CSS and JavaScript modules — no build step, no accounts, no tracking. Progress stays on your device.

## Develop

```bash
python3 -m http.server 8765        # then open http://localhost:8765/
node tools/verify-levels.mjs       # prove all levels
node tools/check-precache.mjs      # service-worker file list is complete
node tools/generate-levels.mjs     # rebuild data/levels.json (deterministic)
python3 icon-design/make_icons.py  # rebuild the icon set
```

See `CLAUDE.md` for architecture and design decisions.

Font: Poppins (SIL Open Font License, see `fonts/OFL.txt`). Art, sounds and code are original.
