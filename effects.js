import { CFG } from './config.js';

export class Camera {
  constructor(level) { this.level = level; this.x = 0; this.y = 0; this.look = 0; }
  snap(px, py) { this._target(px, py, true); }
  update(px, py, facing) {
    // lookahead drifts toward facing direction
    this.look += ((facing * 28) - this.look) * 0.06;
    this._target(px + this.look, py, false);
  }
  _target(px, py, snap) {
    const vw = CFG.view.w, vh = CFG.view.h;
    let tx = px - vw / 2;
    let ty = py - vh * 0.58;
    tx = Math.max(0, Math.min(this.level.w - vw, tx));
    ty = Math.max(0, Math.min(this.level.h - vh, ty));
    if (snap) { this.x = tx; this.y = ty; }
    else {
      this.x += (tx - this.x) * 0.18;
      this.y += (ty - this.y) * 0.14;
    }
  }
  get ix() { return Math.round(this.x); }
  get iy() { return Math.round(this.y); }
}
