// Lightweight one-shot visual effects: sheet-animated (dash dust, muzzle flash,
// hit spark) and procedural particles (enemy explosions).

export class Effects {
  constructor(animFactory) { this.animFactory = animFactory; this.list = []; this.parts = []; }

  spawn(name, x, y, facing = 1, follow = null) {
    const a = this.animFactory();
    a.set(name, true);
    this.list.push({ a, x, y, facing, follow });
  }

  explode(x, y, color = '#ffd75e', n = 10) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 2.2;
      this.parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1, life: 26 + Math.random() * 14, color });
    }
  }

  update() {
    for (const e of this.list) {
      e.a.tick();
      if (e.follow) { e.x = e.follow.x + (e.followOx || 0); e.y = e.follow.y; }
    }
    this.list = this.list.filter(e => !e.a.finished);
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--; }
    this.parts = this.parts.filter(p => p.life > 0);
  }

  draw(g, cam) {
    for (const e of this.list) e.a.draw(g, e.x - cam.ix, e.y - cam.iy, e.facing);
    for (const p of this.parts) {
      g.fillStyle = p.life % 6 < 3 ? p.color : '#ffffff';
      const s = p.life > 14 ? 3 : 2;
      g.fillRect(Math.round(p.x - cam.ix), Math.round(p.y - cam.iy), s, s);
    }
  }
}
