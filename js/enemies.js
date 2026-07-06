import { Body } from './body.js';
import { CFG } from './config.js';

// Enemy catalog. `sheet`/`anims` are reserved for real sprite sheets later
// (they'll flow through the same slicer + Animator as the player); until then
// each type has a small procedural pixel look drawn in draw().
export const CATALOG = {
  walker: { hp: 3, dmg: 3, w: 20, h: 32, speed: 0.6 },
  flyer:  { hp: 2, dmg: 2, w: 16, h: 14, speed: 0.9 },
  turret: { hp: 5, dmg: 2, w: 18, h: 18, fireEvery: 100, shotSpeed: 2.2 },
};

export class Enemy {
  constructor(id, x, y) {
    this.id = id; this.spec = CATALOG[id];
    this.body = new Body(this.spec.w, this.spec.h);
    this.body.x = x; this.body.y = y + this.spec.h / 2;
    this.hp = this.spec.hp;
    this.dir = -1; this.t = Math.random() * 60 | 0;
    this.baseY = this.body.y;
    this.flash = 0;
    this.shots = [];
    this.alive = true;
  }
  get x() { return this.body.x; } get y() { return this.body.y; }

  damage(d) { this.hp -= d; this.flash = 6; if (this.hp <= 0) this.alive = false; }

  update(level, players) {
    // target the nearest player that can be interacted with
    const live = players.filter(p => p.alive);
    const player = live.sort((a, b) =>
      Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0] || players[0];
    this.t++;
    if (this.flash > 0) this.flash--;
    const b = this.body;
    if (this.id === 'walker') {
      b.vy = Math.min(b.vy + CFG.gravity, CFG.maxFall);
      b.moveY(level, b.vy);
      if (b.onGround) {
        const aheadX = this.dir > 0 ? b.right() + 2 : b.left() - 2;
        const ledge = !level.solidAt(aheadX, b.bottom() + 3) && !level.oneWayAt(aheadX, b.bottom() + 3);
        const wall = b.moveX(level, this.dir * this.spec.speed);
        if (wall || ledge) { this.dir *= -1; }
      }
    } else if (this.id === 'flyer') {
      const dx = player.x - this.x, dy = (player.y - 14) - this.y;
      const near = Math.abs(dx) < 110 && Math.abs(dy) < 90 && player.alive;
      if (near) {
        b.x += Math.sign(dx) * this.spec.speed;
        b.y += Math.sign(dy) * this.spec.speed * 0.7;
        this.dir = Math.sign(dx) || this.dir;
      } else {
        b.x += Math.cos(this.t / 40) * 0.5;
        b.y = this.baseY + Math.sin(this.t / 24) * 8;
      }
    } else if (this.id === 'turret') {
      if (this.t % this.spec.fireEvery === 0 && Math.abs(player.x - this.x) < 180 && player.alive) {
        const a = Math.atan2((player.y - 14) - (this.y - 9), player.x - this.x);
        this.shots.push({ x: this.x, y: this.y - 9, vx: Math.cos(a) * this.spec.shotSpeed, vy: Math.sin(a) * this.spec.shotSpeed, life: 240 });
      }
    }
    for (const s of this.shots) { s.x += s.vx; s.y += s.vy; s.life--; }
    this.shots = this.shots.filter(s => s.life > 0 && !level.solidAt(s.x, s.y));
  }

  draw(g, cam) {
    const x = Math.round(this.x - cam.ix), y = Math.round(this.y - cam.iy);
    const w = this.spec.w, h = this.spec.h;
    g.save();
    if (this.flash > 0) g.filter = 'brightness(3)';
    if (this.id === 'walker') {
      g.fillStyle = '#b8443c'; g.fillRect(x - w / 2, y - h, w, h - 4);
      g.fillStyle = '#7a2a24'; g.fillRect(x - w / 2, y - 4, w, 4);
      g.fillStyle = '#ffe08a'; g.fillRect(x + this.dir * 4 - 2, y - h + 4, 4, 4); // eye
      const step = (this.t >> 3) % 2 ? 2 : 0;
      g.fillStyle = '#3c3c46'; g.fillRect(x - w / 2 + 2 + step, y - 3, 5, 3); g.fillRect(x + w / 2 - 7 - step, y - 3, 5, 3);
    } else if (this.id === 'flyer') {
      const flap = (this.t >> 2) % 2 ? -3 : 3;
      g.fillStyle = '#7a5bd6'; g.fillRect(x - w / 2, y - h, w, h - 3);
      g.fillStyle = '#c9b8ff'; g.fillRect(x - w / 2 - 5, y - h + 4 + flap, 5, 3); g.fillRect(x + w / 2, y - h + 4 - flap, 5, 3);
      g.fillStyle = '#ffe08a'; g.fillRect(x + this.dir * 3 - 2, y - h + 4, 4, 3);
    } else if (this.id === 'turret') {
      g.fillStyle = '#4f6b4a'; g.fillRect(x - w / 2, y - h, w, h);
      g.fillStyle = '#2e402c'; g.fillRect(x - w / 2 + 2, y - h + 2, w - 4, h - 8);
      g.fillStyle = '#ff5e5e'; g.fillRect(x - 2, y - h + 5, 4, 4);
      g.fillStyle = this.t % this.spec.fireEvery < 12 ? '#ffd75e' : '#8a8a96';
      g.fillRect(x - 3, y - h - 3, 6, 3);
    }
    g.restore();
    g.fillStyle = '#ffd75e';
    for (const s of this.shots) g.fillRect(Math.round(s.x - cam.ix) - 2, Math.round(s.y - cam.iy) - 2, 4, 4);
  }
}
