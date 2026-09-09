# Chaos Button

A polished, frontend-only reflex arcade game about adapting under pressure. Click the core, build a combo, survive increasingly strange events, and finish with the highest score you can.

## Game concept

**Chaos Button** starts as a calm reaction game and gradually adds movement, shape changes, distractor buttons, text swaps, screen shake, and other surprises. The run lasts 30 seconds. Every click scores points, while consecutive quick clicks build a combo multiplier.

## Features

- 30-second score attack with live timer bar
- Progressive difficulty system with uncapped level progression
- Main button movement that stays inside the playable arena
- Combo scoring with visual feedback
- Procedural chaos events: movement, resizing, shape-shifting, fake buttons, text swaps, and shake effects
- Fake button distractor that does not punish the player
- Dark and light themes, saved in `localStorage`
- Best score persistence, saved in `localStorage`
- Optional Web Audio API sound effects with mute control
- Click/touch-only gameplay, with keyboard access retained for interface controls
- `M` for sound and `T` for theme
- Touch-friendly responsive layout
- Two discoverable gameplay easter eggs: click 13 times or 42 times in a run
- Semantic buttons, visible focus states, live-region announcements, and reduced-motion support

## Technologies

This project intentionally uses only:

- HTML5
- CSS3
- Vanilla JavaScript
- Browser APIs: `localStorage`, Web Audio API, CSS animations, and DOM events

There are no frameworks, build tools, backend services, databases, API keys, external assets, analytics, or proprietary dependencies.

## How to run locally

No dependency installation is required.

### Option 1: Open directly

Double-click `index.html` in a modern browser. All gameplay features work from a local file, including localStorage in normal browser configurations.

### Option 2: Run a local static server

From the project directory:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Controls

| Control | Action |
| --- | --- |
| Mouse click / touch | Score while the game screen is active |
| `Space` or `Enter` | Activate the currently focused interface control; never scores gameplay |
| `M` | Toggle sound |
| `T` | Toggle dark/light theme |
| Quit run | End the current run early |

## How scoring works

A click starts or continues a combo when it lands within roughly 1.1 seconds of the previous click. Each combo level increases the points earned for the next click with no artificial maximum. Waiting too long resets the combo to `x1`. The level increases every 14 points without an upper cap, and later levels introduce more frequent chaos events.

The timer uses the browser's high-resolution performance clock, so it remains accurate even when the browser is busy. The game stops scoring immediately when the timer reaches zero.

## Project structure

```text
chaos-button/
├── index.html   # Semantic screen structure and game controls
├── style.css    # Responsive visual system, themes, effects, and animations
├── script.js    # Game state, scoring, timer, events, audio, and persistence
└── README.md    # Setup and project documentation
```

## High-score storage

The best score is stored locally in the browser under the key `chaos-button-best`. The theme preference is stored under `chaos-button-theme`, and sound preference under `chaos-button-sound`. No data leaves the browser. Clearing site data resets these values.

## Deployment

This is a static website with no server configuration. Upload the four project files to any static host, including:

- GitHub Pages
- Netlify
- Vercel static hosting
- Any ordinary web server

For GitHub Pages, place the files in a repository, enable Pages from the repository's main branch, and use the repository root as the publishing directory. No environment variables or secrets are needed.

## Future improvements

Possible additions include selectable round lengths, a local run history, additional fair challenge modes, a shareable score card, and an optional accessibility mode with larger targets and reduced visual chaos.

## Independence note

Chaos Button is fully self-contained and does not require any specific platform, account, API, backend, database, hosting provider, or proprietary service to run or deploy.
