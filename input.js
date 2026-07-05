// Image loading utilities. Sheets with an opaque background color (like the
// classic teal rips) get that color knocked out to transparent automatically.

export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('failed to load ' + src));
    img.src = src;
  });
}

export function toCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0);
  return c;
}

// Knocks the sheet's background color out to transparent. The key color is
// the most common opaque color in the image (backgrounds dominate rips) —
// safer than sampling a corner, which may hit a border instead.
export function knockoutKeyColor(canvas) {
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const im = g.getImageData(0, 0, canvas.width, canvas.height);
  const d = im.data;
  let transparent = 0;
  const counts = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 250) { transparent++; continue; }
    const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = -1, bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { bestN = n; best = k; }
  // already transparent-backed, or no dominant color: leave it alone
  if (transparent > bestN || best < 0) return canvas;
  const kr = best >> 16, kg = (best >> 8) & 255, kb = best & 255;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === kr && d[i + 1] === kg && d[i + 2] === kb) d[i + 3] = 0;
  }
  g.putImageData(im, 0, 0);
  return canvas;
}

export async function loadSheet(src) {
  return knockoutKeyColor(toCanvas(await loadImage(src)));
}
