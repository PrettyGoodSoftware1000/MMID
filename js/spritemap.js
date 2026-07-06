// Animation map for assets/X/x.png, referencing auto-sliced frames as [row, index].
// Verify/adjust with tools/viewer.html — each entry is one line to fix.
// fps = animation speed, loop = wraps, ox/oy = draw offset from feet-center anchor.

import { CFG } from './config.js';

export const X_MAP = {
  teleport_in: { frames: r(1, [0, 1, 2, 3, 4, 5, 6]), fps: 14, loop: false },
  idle:        { frames: r(2, [1, 2, 3, 4, 5]), fps: 4, loop: true },
  jump:        { frames: r(3, [0, 1, 2]), fps: 12, loop: false },       // launch/rise
  fall:        { frames: r(3, [3, 4]), fps: 10, loop: false }, // freezes on last frame until landing
  land:        { frames: r(3, [5]), fps: 12, loop: false },
  jump_shoot:  { frames: r(4, [1, 2]), fps: 10, loop: true },
  fall_shoot:  { frames: r(4, [3, 4]), fps: 10, loop: false },
  run:         { frames: r(5, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), fps: 14, loop: true },
  run_shoot:   { frames: r(6, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), fps: 14, loop: true },
  idle_shoot:  { frames: r(6, [0]), fps: 8, loop: true },
  dash:        { frames: r(7, [1, 2]), fps: 10, loop: true },
  dash_start:  { frames: r(7, [0]), fps: 12, loop: false },
  dash_shoot:  { frames: r(8, [1, 2]), fps: 10, loop: true },
  // Wall moves come from the dedicated assets/X/x_wallslide.png sheet (one row
  // of 8 frames: 0-1 slide, 2-3 jump-off, 4-7 shooting variants). `sheet`
  // names an extra sheet registered with the Animator (see game.js boot).
  wall_slide:  { frames: r(0, [0, 1]), fps: 8, loop: true, sheet: 'wallslide' },
  wall_kick:   { frames: r(0, [2, 3]), fps: 10, loop: false, sheet: 'wallslide' },
  hurt:        { frames: r(11, [1, 2]), fps: 10, loop: true },
  hit_spark:   { frames: r(11, [5]), fps: 10, loop: false },
  // shots + muzzle live on the buster sheet (bustermap.js);
  // dash smoke + wall dust live on the misc sheet (miscmap.js)
};

function r(row, indices) { return indices.map(i => [row, i]); }

// Resolves [row,index] refs against sliced rows and plays animations.
// `extras` maps a name to { sheet, rows }; animations with a `sheet` field
// pull their frames from that extra sheet instead of the main one.
export class Animator {
  constructor(sheet, rows, map, extras = {}) {
    this.sheet = sheet; this.rows = rows; this.map = map; this.extras = extras;
    this.set('idle');
  }
  _src(name) {
    const s = (this.map[name] || {}).sheet;
    return (s && this.extras[s]) || this;   // has .sheet and .rows
  }
  set(name, restart = false) {
    if (this.name === name && !restart) return;
    this.name = name; this.t = 0; this.frame = 0;
    this.def = this.map[name] || this.map.idle;
  }
  tick() {
    this.t += this.def.fps * CFG.animSpeed / 60;
    const n = this.def.frames.length;
    if (this.t >= 1) {
      this.t -= 1;
      if (this.frame < n - 1) this.frame++;
      else if (this.def.loop) this.frame = 0;
      else this.done = true;
    }
  }
  get finished() { return !this.def.loop && this.frame >= this.def.frames.length - 1 && this.t > 0.5; }
  rect(name = this.name, frame = this.frame) {
    const f = this.map[name].frames[Math.min(frame, this.map[name].frames.length - 1)];
    if (!Array.isArray(f)) return f;               // explicit {x,y,w,h} rect
    const r = (this._src(name).rows[f[0]] || [])[f[1]];
    return r || { x: 0, y: 0, w: 1, h: 1 };
  }
  // Draw anchored at feet-center (x = center, y = feet), flipped when facing < 0.
  // opts.center anchors at the sprite's middle instead (projectiles);
  // opts.scale shrinks/grows around the anchor.
  draw(g, x, y, facing = 1, name = this.name, frame = this.frame, opts = {}) {
    const r = this.rect(name, frame);
    const def = this.map[name] || {};
    const ox = def.ox || 0, oy = def.oy || 0;
    const scale = opts.scale || 1;
    g.save();
    g.translate(Math.round(x), Math.round(y));
    if (facing < 0) g.scale(-1, 1);
    if (scale !== 1) g.scale(scale, scale);
    const top = opts.center ? -r.h / 2 : -r.h;
    g.drawImage(this._src(name).sheet, r.x, r.y, r.w, r.h, Math.round(-r.w / 2 + ox), Math.round(top + oy), r.w, r.h);
    g.restore();
  }
}
