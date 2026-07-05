import { CFG } from './config.js';

export function drawHUD(g, player) {
  const max = CFG.player.hp, hp = player.hp;
  const x = 8, yTop = 28, cellH = 4, w = 10;
  // frame
  g.fillStyle = '#101018';
  g.fillRect(x - 2, yTop - 8, w + 4, max * cellH + 14);
  g.fillStyle = '#e8e8f0';
  g.fillRect(x, yTop - 6, w, 4); // cap
  for (let i = 0; i < max; i++) {
    const filled = i < hp;
    g.fillStyle = filled ? '#ffe9c9' : '#2a2a34';
    g.fillRect(x, yTop + (max - 1 - i) * cellH, w, cellH - 1);
    if (filled) { g.fillStyle = '#ff9d5c'; g.fillRect(x, yTop + (max - 1 - i) * cellH + cellH - 2, w, 1); }
  }
}
