import { CFG } from './config.js';
import { input } from './input.js';
import { loadSheet } from './assets.js';
import { sliceSheet } from './slicer.js';
import { X_MAP, Animator } from './spritemap.js';
import { Level } from './level.js';
import { Camera } from './camera.js';
import { Player } from './player.js';
import { Enemy } from './enemies.js';
import { Effects } from './effects.js';
import { drawHUD } from './hud.js';

const canvas = document.getElementById('game');
const g = canvas.getContext('2d');
g.imageSmoothingEnabled = false;

let sheet, rows, levelsDef, state = 'menu', menuIdx = 0;
let level, cam, player, fx, enemies = [], checkpoint = null, fade = 0;

async function boot() {
  const res = await fetch('levels.json');
  levelsDef = await res.json();
  sheet = await loadSheet('assets/x.png');
  rows = sliceSheet(sheet);
  requestAnimationFrame(loop);
}

async function startLevel(def) {
  state = 'loading';
  level = await Level.load(def);
  fx = new Effects(() => new Animator(sheet, rows, X_MAP));
  player = new Player(new Animator(sheet, rows, X_MAP), fx);
  checkpoint = { ...level.spawn };
  cam = new Camera(level);
  respawn();
  state = 'play';
}

function respawn() {
  enemies = level.enemySpawns.map(s => new Enemy(s.id, s.x, s.y));
  player.place(checkpoint.x, checkpoint.y - 120 < 0 ? checkpoint.y : checkpoint.y);
  player.body.y = checkpoint.y;
  // drop-in start: lift X above his spawn for the teleport landing
  player.body.y -= 0; player.body.vy = 0;
  player.body.x = checkpoint.x;
  player.state = 'spawn';
  cam.snap(player.x, player.y);
  fade = 30;
}

function update() {
  input.poll();
  if (state === 'menu') {
    if (input.pressed('down')) menuIdx = (menuIdx + 1) % levelsDef.levels.length;
    if (input.pressed('up')) menuIdx = (menuIdx + levelsDef.levels.length - 1) % levelsDef.levels.length;
    if (input.pressed('start') || input.pressed('jump')) startLevel(levelsDef.levels[menuIdx]);
    return;
  }
  if (state !== 'play') return;
  if (fade > 0) fade--;

  player.update(level);
  cam.update(player.x, player.y - 14, player.facing);

  // checkpoints
  for (const c of level.checkpoints) {
    if (Math.abs(player.x - c.x) < 12 && Math.abs(player.y - c.y) < 40) checkpoint = { ...c };
  }

  // enemies
  const viewPad = 60;
  for (const e of enemies) {
    if (Math.abs(e.x - (cam.x + CFG.view.w / 2)) > CFG.view.w / 2 + viewPad * 2) continue; // sleep offscreen
    e.update(level, player);
    // player shots vs enemy
    for (const s of player.shots) {
      if (s.hit) continue;
      if (Math.abs(s.x - e.x) < e.spec.w / 2 + 4 && s.y > e.body.top() - 4 && s.y < e.body.bottom() + 4) {
        e.damage(s.dmg);
        s.hit = true;
        fx.spawn('hit_spark', s.x, s.y + 12, 1);
      }
    }
    player.shots = player.shots.filter(s => !s.hit || s.kind === 'full'); // full pierces
    // contact + enemy bullets vs player
    if (e.alive && player.state === 'play' && player.body.overlaps(e.body)) player.hit(e.spec.dmg, e.x);
    for (const s of e.shots) {
      if (Math.abs(s.x - player.x) < 8 && s.y > player.body.top() && s.y < player.body.bottom()) {
        player.hit(e.spec.dmg, s.x); s.life = 0;
      }
    }
    if (!e.alive && !e.exploded) { e.exploded = true; fx.explode(e.x, e.y - e.spec.h / 2); }
  }
  enemies = enemies.filter(e => e.alive);

  fx.update();

  if (player.dead) respawn();
  if (input.pressed('start')) state = 'menu';
}

function draw() {
  const vw = CFG.view.w, vh = CFG.view.h;
  g.fillStyle = '#06060a'; g.fillRect(0, 0, vw, vh);

  if (state === 'menu') { drawMenu(); return; }
  if (state !== 'play') return;

  // bg with parallax
  if (level.bg) {
    const px = -Math.round(cam.x * 0.4) % level.bg.width;
    const py = -Math.round(Math.max(0, cam.y * 0.25));
    for (let x = px - level.bg.width; x < vw; x += level.bg.width)
      g.drawImage(level.bg, x, Math.max(py, vh - level.bg.height));
  }
  g.drawImage(level.game, -cam.ix, -cam.iy);
  for (const e of enemies) e.draw(g, cam);
  player.draw(g, cam);
  fx.draw(g, cam);
  if (level.fg) g.drawImage(level.fg, -cam.ix, -cam.iy);

  drawHUD(g, player);

  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade / 30})`; g.fillRect(0, 0, vw, vh); }
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
  levelsDef.levels.forEach((l, i) => {
    g.fillStyle = i === menuIdx ? '#ffe08a' : '#8aa0b8';
    g.fillText((i === menuIdx ? '> ' : '') + l.name, CFG.view.w / 2, 104 + i * 16);
  });
  g.fillStyle = '#586a80';
  g.fillText('ENTER / START to play', CFG.view.w / 2, CFG.view.h - 32);
  g.fillText('Z jump · X fire (hold=charge) · C dash', CFG.view.w / 2, CFG.view.h - 18);
  g.textAlign = 'left';
}

function fit() {
  const scale = Math.max(1, Math.floor(Math.min(innerWidth / CFG.view.w, innerHeight / CFG.view.h)));
  canvas.style.width = CFG.view.w * scale + 'px';
  canvas.style.height = CFG.view.h * scale + 'px';
}
addEventListener('resize', fit);

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

canvas.width = CFG.view.w; canvas.height = CFG.view.h;
fit();
boot();
