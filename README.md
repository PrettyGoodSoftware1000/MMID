# MegaMan is Dead

A browser fan game in the style of the SNES Mega Man X series. Pure HTML/JS/Canvas, no build step, no dependencies — made for GitHub Pages. Non-commercial personal fan work.

## Run it

Canvas pixel access requires http(s), so use any static server locally:

```
python3 -m http.server 8000     # or: npx serve
```

Open `http://localhost:8000`. To deploy, push the repo to GitHub and enable Pages (Settings → Pages → deploy from branch). Double-clicking `index.html` from disk will NOT work (browser blocks pixel reads from `file://`).

## Controls

| Action | Keyboard | Gamepad (standard mapping) |
|---|---|---|
| Move | Arrows / WASD | D-pad or left stick |
| Jump | Z / Space | A (button 0) |
| Fire (hold to charge) | X / J | X (button 2) or B |
| Dash | C / Shift / K | RB or RT |
| Start / back to menu | Enter | Start |

Wall slide: hold toward a wall while falling. Wall kick: jump while sliding. Hold dash during a wall kick for a long dash-kick (needed to cross the wide shaft in the test level).

## Level format

A level is a folder under `levels/` containing four same-sized PNGs plus one entry in `levels.json`:

| File | Role |
|---|---|
| `bg.png` | Visual only, drawn behind with parallax |
| `game.png` | The collision layer — also drawn as the main stage art |
| `fg.png` | Visual only, drawn in front of the player/enemies |
| `enemies.png` | Marker dots only, never drawn |

**game.png alpha semantics:** pixels with alpha ≥ 250 are solid; alpha 80–200 is a one-way platform (solid from above only); everything else is free space. So: paint your stage art at full opacity, paint one-way ledges at ~55% opacity, leave the rest transparent.

**enemies.png marker colors** (exact RGB, any blob shape — the centroid is the spawn point):

| Color | Meaning |
|---|---|
| `#FFFF00` yellow | Player spawn |
| `#00FFFF` cyan | Checkpoint |
| `#FF0000` red | Walker |
| `#FF00FF` magenta | Flyer |
| `#0000FF` blue | Turret |

Add types by extending `CFG.markers` in `js/config.js` and `CATALOG` in `js/enemies.js`.

To add a level: create the folder, drop in the four PNGs, add `{ "name": "MY STAGE", "path": "levels/mystage" }` to `levels.json`. Optional `"spawn": {"x":…,"y":…}` overrides the yellow marker.

## Sprite sheet system

`assets/x.png` is auto-sliced at load: connected pixel regions become frames, grouped into rows. Animations in `js/spritemap.js` reference frames as `[row, index]` (top-to-bottom, left-to-right). Opaque background colors (like teal rips) are knocked out automatically using the top-left pixel as the key color.

**Open `tools/viewer.html`** (via the local server) to see every mapped animation playing. If one looks wrong, edit its `[row, index]` list in `spritemap.js` and refresh. This same slicer will drive enemy/weapon sheets later — enemy `CATALOG` entries already reserve `sheet`/`anims` fields.

## Tuning

Everything lives in `js/config.js`: physics (gravity, run/dash speed, jump velocity, wall-kick), buster (charge times, damage, shots on screen), player HP/i-frames, marker colors, key bindings. `airDash: true` switches to X2-style movement.

## Current placeholders / roadmap

- Enemies use procedural pixel art; swap in real sheets via the slicer + a per-enemy map.
- No audio yet.
- Camera is free-follow; MMX-style locked camera zones can be added as rects in the level JSON.
- No boss, weapons menu, or armor pickups yet.

## A note on assets

The player sheet is a rip of Capcom's copyrighted art, used here as a non-commercial fan work. Hosting it in a public repo carries takedown risk — consider a private repo, or keep art out of the repo and load it locally.
