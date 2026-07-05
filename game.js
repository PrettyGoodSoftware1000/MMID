// Auto-slices an irregular sprite sheet (transparent background) into rows of
// frame rects, so animations can be referenced as { row, index } instead of
// hand-measured pixel coordinates. Frames touching within 2px merge together.

export function sliceSheet(canvas, minPixels = 12) {
  const W = canvas.width, H = canvas.height;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const a = g.getImageData(0, 0, W, H).data;
  const solid = i => a[i * 4 + 3] > 10;
  const labels = new Int32Array(W * H).fill(-1);
  const boxes = [];
  let next = 0;

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    if (!solid(idx) || labels[idx] !== -1) continue;
    const stack = [idx];
    labels[idx] = next;
    let minX = x, maxX = x, minY = y, maxY = y, px = 0;
    while (stack.length) {
      const cur = stack.pop();
      const cx = cur % W, cy = (cur / W) | 0;
      px++;
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (!solid(ni) || labels[ni] !== -1) continue;
        labels[ni] = next; stack.push(ni);
      }
    }
    boxes.push({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, px });
    next++;
  }

  const good = boxes.filter(b => b.px >= minPixels);
  good.sort((p, q) => p.y - q.y || p.x - q.x);
  const rows = [];
  for (const b of good) {
    const r = rows.find(r => b.y <= r.maxY - 2 && b.y + b.h >= r.minY + 2);
    if (r) { r.items.push(b); r.minY = Math.min(r.minY, b.y); r.maxY = Math.max(r.maxY, b.y + b.h); }
    else rows.push({ minY: b.y, maxY: b.y + b.h, items: [b] });
  }
  rows.sort((p, q) => p.minY - q.minY);
  rows.forEach(r => r.items.sort((p, q) => p.x - q.x));
  return rows.map(r => r.items.map(({ x, y, w, h }) => ({ x, y, w, h })));
}
