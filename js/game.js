import { CFG } from './config.js';
import { Input, connectedPads } from './input.js';
import { loadSheet } from './assets.js';
import { sliceSheet } from './slicer.js';
import { X_MAP, Animator } from './spritemap.js';
import { RUSH_MAP } from './rushmap.js';
import { Level } from './level.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Enemy } from './enemies.js';
import { Effects } from './effects.js';
import { drawHUD } from './hud.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

const MODES = [
  { label: '1P — X', chars: ['x'] },
  { label: '1P — RUSH', chars: ['rush'] },
  { label: '2P — X & RUSH', chars: ['x', 'rush'] },
];

const sheets = {}, rows = {};
let levelsDef, state = 'menu', phase = 'mode', modeIdx = 0, levelIdx = 0;
let level, cam, players = [], fx, enemies = [], checkpoint = null, fade = 0;
const inputs = [new Input(true, 0), new Input(false, 1)];

async function boot() {
  levelsDef = await (await fetch('levels.json')).json();
  for (const id of Object.keys(CFG.chars)) {
    sheets[id] = await loadSheet(CFG.chars[id].sheet);
    rows[id] = sliceSheet(sheets[id]);
  }
  requestAnimationFrame(loop);
}

const MAPS = { x: X_MAP, rush: RUSH_MAP };
const makeAnim = id => new Animator(sheets[id], rows[id], MAPS[id]);

async function startLevel(def, chars) {
  state = 'loading';
  level = await Level.load(def);
  fx = new Effects(() => makeAnim('x'));
  players = chars.map((id, i) => new Player(id, makeAnim(id), fx, inputs[i]));
  checkpoint = { ...level.spawn };
  cam = new Camera(level);
  fullRespawn();
  state = 'play';
}

function fullRespawn() {
  enemies = level.enemySpawns.map(s => new Enemy(s.id, s.x, s.y));
  players.forEach((p, i) => {
    p.place(checkpoint.x + i * 20, checkpoint.y);
    p.respawnT = 0;
  });
  cam.snap(checkpoint.x, checkpoint.y - 14);
  fade = 30;
}

function assignPads() {
  const n = connectedPads().length;
  if (players.length === 2) {
    if (n >= 2) { inputs[0].padIndex = 0; inputs[1].padIndex = 1; inputs[0].useKeyboard = true; }
    else { inputs[0].padIndex = -1; inputs[0].useKeyboard = true; inputs[1].padIndex = n ? 0 : -1; }
  } else { inputs[0].padIndex = n ? 0 : -1; inputs[0].useKeyboard = true; }
}

function focusPoint() {
  const alive = players.filter(p => p.state !== 'dead');
  const list = alive.length ? alive : players;
  const fx_ = list.reduce((s, p) => s + p.x, 0) / list.length;
  const fy = list.reduce((s, p) => s + p.y, 0) / list.length;
  return { x: fx_, y: fy - 14 };
}

function update() {
  assignPads();
  inputs.forEach(i => i.poll());
  const in1 = inputs[0];

  if (state === 'menu') {
    const items = phase === 'mode' ? MODES : levelsDef.levels;
    const idx = phase === 'mode' ? modeIdx : levelIdx;
    let next = idx;
    if (in1.pressed('down')) next = (idx + 1) % items.length;
    if (in1.pressed('up')) next = (idx + items.length - 1) % items.length;
    if (phase === 'mode') modeIdx = next; else levelIdx = next;
    if (in1.pressed('start') || in1.pressed('jump')) {
      if (phase === 'mode') phase = 'level';
      else startLevel(levelsDef.levels[levelIdx], MODES[modeIdx].chars);
    }
    if (in1.pressed('dash') && phase === 'level') phase = 'mode'; // back
    return;
  }
  if (state !== 'play') return;
  if (fade > 0) fade--;

  players.forEach(p => p.update(level));

  const f = focusPoint();
  cam.update(f.x, f.y, players.length === 1 ? players[0].facing : 0);

  // checkpoints (any player can claim)
  for (const c of level.checkpoints) {
    for (const p of players) {
      if (p.alive && Math.abs(p.x - c.x) < 12 && Math.abs(p.y - c.y) < 40) checkpoint = { ...c };
    }
  }

  // enemies
  for (const e of enemies) {
    if (Math.abs(e.x - (cam.x + CFG.view.w / 2)) > CFG.view.w * 1.5) continue;
    e.update(level, players);
    for (const p of players) {
      for (const s of p.shots) {
        if (s.hit) continue;
        if (Math.abs(s.x - e.x) < e.spec.w / 2 + 4 && s.y > e.body.top() - 4 && s.y < e.body.bottom() + 4) {
          e.damage(s.dmg); s.hit = true;
          fx.spawn('hit_spark', s.x, s.y + 12, 1);
        }
      }
      p.shots = p.shots.filter(s => !s.hit || s.kind === 'full');
      if (e.alive && p.state === 'play' && p.body.overlaps(e.body)) p.hit(e.spec.dmg, e.x);
      for (const s of e.shots) {
        if (Math.abs(s.x - p.x) < 8 && s.y > p.body.top() && s.y < p.body.bottom()) {
          p.hit(e.spec.dmg, s.x); s.life = 0;
        }
      }
    }
    if (!e.alive && !e.exploded) { e.exploded = true; fx.explode(e.x, e.y - e.spec.h / 2); }
  }
  enemies = enemies.filter(e => e.alive);

  fx.update();

  // respawns: solo death restarts at checkpoint; co-op partner teleports in
  // next to the survivor; both down = full checkpoint restart
  const deadAll = players.every(p => p.state === 'dead');
  if (deadAll) {
    if (players.every(p => p.dead)) fullRespawn();
  } else {
    for (const p of players) {
      if (!p.dead) continue;
      if (players.length === 1) { fullRespawn(); break; }
      const buddy = players.find(q => q !== p && q.state !== 'dead');
      if (buddy) p.place(buddy.x, buddy.y - 4);
    }
  }

  if (in1.pressed('start')) { state = 'menu'; phase = 'mode'; }
}

function draw() {
  const vw = CFG.view.w, vh = CFG.view.h;
  g.fillStyle = '#06060a'; g.fillRect(0, 0, vw, vh);

  if (state === 'menu') { drawMenu(); return; }
  if (state !== 'play') return;

  if (level.bg) {
    const px = -Math.round(cam.x * 0.4) % level.bg.width;
    const py = -Math.round(Math.max(0, cam.y * 0.25));
    for (let x = px - level.bg.width; x < vw; x += level.bg.width)
      g.drawImage(level.bg, x, Math.max(py, vh - level.bg.height));
  }
  g.drawImage(level.game, -cam.ix, -cam.iy);
  for (const e of enemies) e.draw(g, cam);
  players.forEach(p => p.draw(g, cam));
  fx.draw(g, cam);
  if (level.fg) g.drawImage(level.fg, -cam.ix, -cam.iy);

  drawHUD(g, players);
  drawOffscreenArrows();

  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade / 30})`; g.fillRect(0, 0, vw, vh); }
}

// edge arrows pointing to partners who left the screen
function drawOffscreenArrows() {
  if (players.length < 2) return;
  for (const p of players) {
    if (p.state === 'dead') continue;
    const sx = p.x - cam.ix, sy = p.y - 14 - cam.iy;
    if (sx >= 0 && sx <= CFG.view.w && sy >= 0 && sy <= CFG.view.h) continue;
    const cx = Math.max(6, Math.min(CFG.view.w - 6, sx));
    const cy = Math.max(6, Math.min(CFG.view.h - 6, sy));
    const a = Math.atan2(sy - cy, sx - cx);
    g.save();
    g.translate(cx, cy); g.rotate(a);
    g.fillStyle = p.charId === 'rush' ? '#ff6a5e' : '#6fb8ff';
    g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -4); g.lineTo(-4, 4); g.closePath(); g.fill();
    g.restore();
  }
}

function drawMenu() {
  g.fillStyle = '#0a1420'; g.fillRect(0, 0, CFG.view.w, CFG.view.h);
  g.fillStyle = '#1a2c44';
  for (let i = 0; i < 8; i++) g.fillRect(0, 30 + i * 26, CFG.view.w, 2);
  g.textAlign = 'center';
  g.fillStyle = '#7ec8ff'; g.font = 'bold 16px monospace';
  g.fillText('MEGAMAN IS DEAD', CFG.view.w / 2, 52);
  g.fillStyle = '#38506e'; g.font = '8px monospace';
  g.fillText('a nonprofit fan work', CFG.view.w / 2, 66);
  g.font = '10px monospace';
  const items = phase === 'mode' ? MODES.map(m => m.label) : levelsDef.levels.map(l => l.name);
  const idx = phase === 'mode' ? modeIdx : levelIdx;
  g.fillStyle = '#586a80';
  g.fillText(phase === 'mode' ? 'SELECT MODE' : 'SELECT STAGE', CFG.view.w / 2, 88);
  items.forEach((label, i) => {
    g.fillStyle = i === idx ? '#ffe08a' : '#8aa0b8';
    g.fillText((i === idx ? '> ' : '') + label, CFG.view.w / 2, 108 + i * 16);
  });
  g.fillStyle = '#586a80';
  const pads = connectedPads().length;
  g.fillText(`${pads} controller${pads === 1 ? '' : 's'} connected`, CFG.view.w / 2, CFG.view.h - 46);
  g.fillText('ENTER / START to confirm' + (phase === 'level' ? ' · C back' : ''), CFG.view.w / 2, CFG.view.h - 32);
  g.fillText('Z jump (again in air = fly) · X fire · C dash', CFG.view.w / 2, CFG.view.h - 18);
  g.textAlign = 'left';
}

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / CFG.view.w, innerHeight / CFG.view.h)));
  canvas.style.width = CFG.view.w * scale + 'px';
  canvas.style.height = CFG.view.h * scale + 'px';
}
addEventListener('resize', fit);

// Fixed 60fps simulation regardless of display refresh rate. rAF fires at the
// monitor's rate (120/144Hz+), so stepping once per frame ran everything fast.
const STEP = 1000 / 60;
let last = null, acc = 0;
function loop(now) {
  if (last === null) last = now;
  acc = Math.min(acc + (now - last), 250);   // cap catch-up after tab-out
  last = now;
  while (acc >= STEP) { update(); acc -= STEP; }
  draw();
  requestAnimationFrame(loop);
}

canvas.width = CFG.view.w; canvas.height = CFG.view.h;
fit();
boot();
