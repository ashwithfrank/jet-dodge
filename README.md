# JET//DODGE

A browser-based 2D arcade survival game. Pilot a futuristic jet through the void, dodge falling hazards, and last as long as you can.

**Survive the void.**

## Features

- Polished home screen with a living starfield
- Procedurally drawn sci-fi jet with engine glow, exhaust, and bank-on-strafe
- Five hazard types: asteroids, debris, energy blocks, enemy drones, laser gates
- Smooth difficulty curve from Easy through Extreme
- Survival scoring, near-miss bonuses, and milestone fanfare
- High score saved in `localStorage`
- Pause, restart, and home without reloading the page
- Procedural sound via the Web Audio API (no audio files)
- Mute / SFX / engine drone / reduced-effects settings
- Keyboard, touch paddles, drag-to-steer, and gamepad
- Works offline after the page has loaded

## Controls

| Action | Desktop | Mobile |
| --- | --- | --- |
| Move left | `A` or `←` | Left paddle or drag |
| Move right | `D` or `→` | Right paddle or drag |
| Pause | `ESC` or `P` | Pause button |
| Mute | `M` | Mute button |

## How to play

1. Press **PLAY**.
2. After the countdown, the jet flies upward automatically.
3. Strafe to avoid everything falling from the top.
4. The longer you survive, the faster and denser the field becomes.
5. One hit ends the run. Beat your best.

## Project structure

```text
├── index.html              # App shell (hosted build)
├── src/game/               # Game engine, rendering, audio, UI
├── src/routes/             # App route that mounts the game
├── public/                 # Favicon and share images
├── standalone/             # Zero-build copy for GitHub Pages
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/favicon.svg
├── screenshots/
└── README.md
```

The `standalone/` folder is a complete static site: HTML, CSS, and a single JavaScript file. No Node.js, npm, or bundler is required to run it.

## Run locally

Open `standalone/index.html` in a modern browser, or serve the folder with any static file server.

If you are running the full workspace app, the same game is mounted at the site root.

## Deploy on GitHub Pages

1. Create a GitHub repository.
2. Copy the contents of `standalone/` to the repository root (so `index.html` sits at the root).
3. In the repo: **Settings → Pages**.
4. Set source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
5. Save. The game will be live at `https://<user>.github.io/<repo>/`.

Use relative paths only — the standalone build already does.

## Technologies

- HTML5 Canvas
- CSS
- TypeScript / vanilla JavaScript
- Web Audio API (procedural SFX)
- `localStorage` for high score and settings

No backend, database, accounts, or third-party game engine.

## Credits

Designed as a small indie-style browser arcade game. Starfield, jet, and hazards are drawn in code. Audio is generated at runtime.

## License

MIT — see [LICENSE](./LICENSE).
