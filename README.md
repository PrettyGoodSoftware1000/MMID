# MegaMan is Dead

A browser fan game in the style of the SNES Mega Man X series. Pure HTML/JS/Canvas, no build step, no dependencies — made for GitHub Pages. Non-commercial personal fan work.

## Run it

Canvas pixel access requires http(s), so use any static server locally:

```
python3 -m http.server 8000     # or: npx serve
```

Open `http://localhost:8000`. To deploy, push the repo to GitHub and enable Pages (Settings → Pages → deploy from branch). Double-clicking `index.html` from disk will NOT work (browser blocks pixel reads from `file://`).

## Characters & modes

The menu offers **1P — X**, **1P — RUSH**, and **2P — X & RUSH** (P1 is X, P2 is Rush). Capabilities live in `CFG.chars` in `js/config.js`:

- **X** — dash, wall slide/kick, charge buster.
- **Rush** — no dash or wall moves; instead, press jump again in mid-air to **fly**. Flight steers with left/right and up/down, burns the blue fuel gauge next to his health bar, and refills on the ground. Jump again (or run dry) to drop. He fires charge-able blasts from his mouth.

In 2P mode the camera follows the midpoint between both players; small edge arrows point to a partner who's offscreen. A downed player teleports back in next to the survivor; if both go down, the team restarts at the last checkpoint.

**Controller assignment:** with two controllers, P1 = keyboard + pad 1, P2 = pad 2. With one controller in 2P, P1 = keyboard and P2 = the pad. Pads can connect at any time, including mid-game.

## Controls

| Action | Keyboard | Gamepad (standard mapping) |
|---|---|---|
| Move | Arrows / WASD | D-pad or left stick |
| Jump / fly toggle (in air, Rush) | Z / Space | A (button 0) |
| Fire (hold to charge) | X / J | X (button 2) or B |
| Dash (X only) | C / Shift / K | RB or RT |
| Dash left (X only) | — | LB or LT |
| Start / back to menu | Enter | Start |

Jump height is variable: hold jump to climb higher, tap for a short hop (`jumpHoldGravity` / `jumpCutVel` in `js/config.js`).

Wall slide (X): hold toward a wall while falling. Wall kick: jump while sliding. Hold dash during a wall kick for a long dash-kick (needed to cross the wide shaft in the test level — Rush just flies over it).

## Level format

A level is a folder under `levels/` containing four same-sized PNGs plus one entry in `levels.json`. The files are named after the folder (e.g. the `test` level uses `test_background.png`):

| File | Role |
|---|---|
| `<name>_background.png` | Visual only, drawn behind with parallax |
| `<name>_playarea.png` | The collision layer — also drawn as the main stage art |
| `<name>_foreground.png` | Visual only, drawn in front of the player/enemies |
| `<name>_enemies.png` | Marker dots only, never drawn |

**playarea alpha semantics:** pixels with alpha ≥ 250 are solid; alpha 80–200 is a one-way platform (solid from above only); everything else is free space. So: paint your stage art at full opacity, paint one-way ledges at ~55% opacity, leave the rest transparent.

**enemies-layer marker colors** (exact RGB, any blob shape — the centroid is the spawn point):

| Color | Meaning |
|---|---|
| `#FFFF00` yellow | Player spawn |
| `#00FFFF` cyan | Checkpoint |
| `#FF0000` red | Walker |
| `#FF00FF` magenta | Flyer |
| `#0000FF` blue | Turret |

Add types by extending `CFG.markers` in `js/config.js` and `CATALOG` in `js/enemies.js`.

To add a level: create the folder, drop in the four PNGs, add `{ "name": "MY STAGE", "path": "levels/mystage" }` to `levels.json`. Optional `"spawn": {"x":…,"y":…}` overrides the yellow marker. (`levels.json` stays necessary: browsers can't list server folders, so the game needs a manifest to know which levels exist.)

## Sprite sheet system

Character sheets (`assets/x.png`, `assets/rush.png`) are auto-sliced at load: connected pixel regions become frames, grouped into rows. Animations in `js/spritemap.js` (X) and `js/rushmap.js` (Rush) reference frames as `[row, index]` (top-to-bottom, left-to-right). Opaque background colors (teal, blue, etc.) are knocked out automatically using the image's most common color as the key — corner sampling would fail on sheets with border frames.

**Open `tools/viewer.html`** (via the local server) to see every mapped animation for both characters playing. If one looks wrong, edit its `[row, index]` list in `spritemap.js` and refresh. This same slicer will drive enemy/weapon sheets later — enemy `CATALOG` entries already reserve `sheet`/`anims` fields.

**`tools/BadGuyMaker.html`** (also via the local server) builds enemy definitions graphically: load a sprite sheet and shot sheet, preview the sliced animations and a Mega Man-style health bar, set health / shot damage / speed / jump, and save the result as a `.json` to place under `enemies/<name>/`.

## Tuning

Everything lives in `js/config.js`: physics (gravity, run/dash speed, jump velocity, wall-kick), buster (charge times, damage, shots on screen), player HP/i-frames, marker colors, key bindings. `airDash: true` switches to X2-style movement.

## Current placeholders / roadmap

- Enemies use procedural pixel art; swap in real sheets via the slicer + a per-enemy map.
- No audio yet.
- Camera is free-follow; MMX-style locked camera zones can be added as rects in the level JSON.
- No boss, weapons menu, or armor pickups yet.

## A note on assets

The character sheets are rips of Capcom's copyrighted art, used here as a non-commercial fan work. Hosting it in a public repo carries takedown risk — consider a private repo, or keep art out of the repo and load it locally.
