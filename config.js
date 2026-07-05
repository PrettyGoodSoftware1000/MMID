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

// If the top-left pixel is opaque, treat its color as the background key
// and make every matching pixel transparent. Returns a new canvas.
export function knockoutKeyColor(canvas) {
  const g = canvas.getContext('2d', { willReadFrequently: true });
  const im = g.getImageData(0, 0, canvas.width, canvas.height);
  const d = im.data;
  if (d[3] < 250) return canvas; // already transparent bg
  const kr = d[0], kg = d[1], kb = d[2];
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === kr && d[i + 1] === kg && d[i + 2] === kb) d[i + 3] = 0;
  }
  g.putImageData(im, 0, 0);
  return canvas;
}

export async function loadSheet(src) {
  return knockoutKeyColor(toCanvas(await loadImage(src)));
}
