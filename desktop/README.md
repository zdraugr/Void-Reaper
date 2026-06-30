# Void Reaper — desktop (Electron) packaging

Wraps the root `index.html` game in [Electron](https://electronjs.org) to produce native
Windows / Linux / macOS builds (the path toward a Steam release).

The game source stays the source of truth at the repo root (`index.html`, `music/`, `sfx/`).
`scripts/sync-assets.mjs` copies them into `app/` before each build and flips `DEV=true` →
`DEV=false` (cheats/overlay off, real saves persist). `app/`, `node_modules/`, and `dist/`
are gitignored.

## Why a custom `game://` protocol
The SFX loader uses `fetch("sfx/*.mp3")`, and Chromium blocks `fetch()` on `file://`. We
serve the app from a privileged `game://` scheme (see `main.js`) so fetch works and
`localStorage` gets a stable origin (saves persist across launches).

## Build locally
Requires Node 18+.

```bash
cd desktop
npm install          # downloads Electron (~100 MB), writes package-lock.json
npm start            # run the game in a dev window
npm run dist:linux   # -> dist/Void Reaper-<ver>.AppImage
npm run dist:win     # -> dist/*.exe   (needs wine on Linux; easier via CI)
npm run dist:mac     # -> dist/*.dmg   (macOS only)
```

## Build all platforms via CI
Push a `v*` tag or run the **desktop-build** workflow from the GitHub Actions tab. It builds
Windows / Linux / macOS on native runners and uploads the installers as artifacts.

## Not done yet (Steam release follow-ups)
- Steamworks SDK (achievements, cloud saves, overlay) — needs a Steam partner account + appid.
- Code signing (Windows cert, Apple Developer ID) to silence SmartScreen / Gatekeeper.
- Real key art replacing the placeholder `build/icon.png`.
