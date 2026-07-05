import { CFG } from './config.js';

// P1 bar on the left edge, P2 on the right. Rush also gets a small fuel bar.
export function drawHUD(g, players) {
  players.forEach((p, i) => {
    const right = i === 1;
    const x = right ? CFG.view.w - 8 - 10 : 8;
    drawBar(g, x, p, right);
  });
}

function drawBar(g, x, player, right) {
  const max = CFG.player.hp, hp = player.hp;
  const yTop = 28, cellH = 4, w = 10;
  g.fillStyle = '#101018';
  g.fillRect(x - 2, yTop - 8, w + 4, max * cellH + 14);
  g.fillStyle = '#e8e8f0';
  g.fillRect(x, yTop - 6, w, 4);
  for (let i = 0; i < max; i++) {
    const filled = i < hp;
    g.fillStyle = filled ? '#ffe9c9' : '#2a2a34';
    g.fillRect(x, yTop + (max - 1 - i) * cellH, w, cellH - 1);
    if (filled) { g.fillStyle = '#ff9d5c'; g.fillRect(x, yTop + (max - 1 - i) * cellH + cellH - 2, w, 1); }
  }
  // fuel bar for flyers
  if (player.fuelMax > 0) {
    const fh = max * cellH, fx = right ? x - 6 : x + w + 2;
    g.fillStyle = '#101018'; g.fillRect(fx - 1, yTop - 1, 6, fh + 2);
    const fill = Math.round(fh * player.fuel / player.fuelMax);
    g.fillStyle = '#2a2a34'; g.fillRect(fx, yTop, 4, fh);
    g.fillStyle = player.flying ? '#ffd75e' : '#6fb8ff';
    g.fillRect(fx, yTop + fh - fill, 4, fill);
  }
}
