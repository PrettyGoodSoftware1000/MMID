import { CFG } from './config.js';

// Axis-aligned body anchored at feet-center: (x, y) = bottom middle.
// Collides against the level's pixel mask one axis at a time.
export class Body {
  constructor(w, h) { this.w = w; this.h = h; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.onGround = false; }

  left() { return this.x - this.w / 2; }
  right() { return this.x + this.w / 2 - 1; }
  top() { return this.y - this.h; }
  bottom() { return this.y - 1; }

  _colSolid(level, x, y0, y1) { for (let y = y0; y <= y1; y++) if (level.solidAt(x, y)) return true; return false; }
  _rowSolid(level, y, x0, x1) { for (let x = x0; x <= x1; x++) if (level.solidAt(x, y)) return true; return false; }
  _rowOneWay(level, y, x0, x1) { for (let x = x0; x <= x1; x++) if (level.oneWayAt(x, y)) return true; return false; }

  moveX(level, dx) {
    const dir = Math.sign(dx);
    let remaining = Math.abs(dx);
    let hitWall = false;
    while (remaining > 0) {
      const step = Math.min(1, remaining);
      const nx = this.x + step * dir;
      const edge = dir > 0 ? Math.floor(nx + this.w / 2 - 1) : Math.floor(nx - this.w / 2);
      if (this._colSolid(level, edge, Math.floor(this.top()), Math.floor(this.bottom()))) {
        // try stepping up a slope
        let climbed = false;
        if (this.onGround) {
          for (let up = 1; up <= CFG.stepUp; up++) {
            if (!this._colSolid(level, edge, Math.floor(this.top()) - up, Math.floor(this.bottom()) - up)) {
              this.y -= up; this.x = nx; climbed = true; break;
            }
          }
        }
        if (!climbed) { hitWall = true; break; }
      } else this.x = nx;
      remaining -= step;
    }
    return hitWall;
  }

  moveY(level, dy, dropThrough = false) {
    const dir = Math.sign(dy);
    let remaining = Math.abs(dy);
    let hit = false;
    this.onGround = false;
    while (remaining > 0) {
      const step = Math.min(1, remaining);
      const ny = this.y + step * dir;
      if (dir > 0) { // falling
        const foot = Math.floor(ny - 1);
        const x0 = Math.floor(this.left()), x1 = Math.floor(this.right());
        const solid = this._rowSolid(level, foot, x0, x1);
        // one-way: only stops you if your previous feet were above it
        const oneWay = !dropThrough && !this._rowOneWay(level, Math.floor(this.bottom()), x0, x1)
          && this._rowOneWay(level, foot, x0, x1);
        if (solid || oneWay) { hit = true; this.onGround = true; this.vy = 0; break; }
        this.y = ny;
      } else { // rising
        const head = Math.floor(ny - this.h);
        if (this._rowSolid(level, head, Math.floor(this.left()), Math.floor(this.right()))) {
          hit = true; this.vy = 0; break;
        }
        this.y = ny;
      }
      remaining -= step;
    }
    // grounded check when not moving down
    if (dir <= 0 && dy === 0) {
      const x0 = Math.floor(this.left()), x1 = Math.floor(this.right());
      this.onGround = this._rowSolid(level, Math.floor(this.bottom() + 1), x0, x1)
        || this._rowOneWay(level, Math.floor(this.bottom() + 1), x0, x1);
    }
    return hit;
  }

  touchingWall(level, dir) {
    const edge = dir > 0 ? Math.floor(this.right() + 1) : Math.floor(this.left() - 1);
    return this._colSolid(level, edge, Math.floor(this.top()) + 4, Math.floor(this.bottom()) - 4);
  }

  overlaps(o) {
    return this.left() < o.right() && this.right() > o.left() && this.top() < o.bottom() && this.bottom() > o.top();
  }
}
