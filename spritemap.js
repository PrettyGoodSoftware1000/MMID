import { CFG } from './config.js';
import { loadImage, toCanvas } from './assets.js';

// A level is a folder of same-sized PNGs: bg (visual, parallax), game (collision
// + visual), fg (visual, drawn over entities), enemies (marker dots, never drawn).
// game.png alpha: >=solidAlpha solid, oneWay range = platform solid from above.

const EMPTY = 0, SOLID = 1, ONEWAY = 2;

export class Level {
  static async load(def) {
    const base = def.path.replace(/\/$/, '') + '/';
    const [bg, game, fg, enemies] = await Promise.all(
      ['bg', 'game', 'fg', 'enemies'].map(n =>
        loadImage(base + n + '.png').then(toCanvas).catch(() => null))
    );
    if (!game) throw new Error('level missing game.png');
    return new Level(def, bg, game, fg, enemies);
  }

  constructor(def, bg, game, fg, enemies) {
    this.def = def;
    this.bg = bg; this.game = game; this.fg = fg;
    this.w = game.width; this.h = game.height;
    this._buildMask(game);
    this.spawn = { x: 40, y: this.h - 40 };
    this.checkpoints = [];
    this.enemySpawns = [];
    if (enemies) this._scanMarkers(enemies);
    if (def.spawn) this.spawn = { ...def.spawn };
  }

  _buildMask(game) {
    const d = game.getContext('2d', { willReadFrequently: true })
      .getImageData(0, 0, this.w, this.h).data;
    const m = new Uint8Array(this.w * this.h);
    for (let i = 0; i < m.length; i++) {
      const a = d[i * 4 + 3];
      if (a >= CFG.solidAlpha) m[i] = SOLID;
      else if (a >= CFG.oneWayAlphaMin && a <= CFG.oneWayAlphaMax) m[i] = ONEWAY;
    }
    this.mask = m;
  }

  _scanMarkers(enemies) {
    const d = enemies.getContext('2d', { willReadFrequently: true })
      .getImageData(0, 0, this.w, this.h).data;
    const seen = new Uint8Array(this.w * this.h);
    const hex = n => n.toString(16).padStart(2, '0').toUpperCase();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x;
      if (seen[i] || d[i * 4 + 3] < 200) continue;
      // flood-fill this marker blob to find its centroid
      const key = hex(d[i * 4]) + hex(d[i * 4 + 1]) + hex(d[i * 4 + 2]);
      const stack = [i]; seen[i] = 1;
      let sx = 0, sy = 0, n = 0;
      while (stack.length) {
        const c = stack.pop(); const cx = c % this.w, cy = (c / this.w) | 0;
        sx += cx; sy += cy; n++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
          const ni = ny * this.w + nx;
          if (seen[ni] || d[ni * 4 + 3] < 200) continue;
          const same = hex(d[ni * 4]) + hex(d[ni * 4 + 1]) + hex(d[ni * 4 + 2]) === key;
          if (!same) continue;
          seen[ni] = 1; stack.push(ni);
        }
      }
      const cx = Math.round(sx / n), cy = Math.round(sy / n);
      const mk = CFG.markers[key];
      if (!mk) continue;
      if (mk.type === 'spawn') this.spawn = { x: cx, y: cy };
      else if (mk.type === 'checkpoint') this.checkpoints.push({ x: cx, y: cy });
      else if (mk.type === 'enemy') this.enemySpawns.push({ id: mk.id, x: cx, y: cy });
    }
  }

  at(x, y) {
    x |= 0; y |= 0;
    if (x < 0 || x >= this.w) return SOLID;      // level sides are walls
    if (y < 0) return EMPTY;                      // open sky above
    if (y >= this.h) return EMPTY;                // open pit below (death)
    return this.mask[y * this.w + x];
  }
  solidAt(x, y) { return this.at(x, y) === SOLID; }
  oneWayAt(x, y) { return this.at(x, y) === ONEWAY; }
}
