// Animation map for assets/misc/misc_sprites.png (dash smoke, wall dust, charge sparks).
// This sheet's label text sits inside the same bands as several frames, so the
// auto-sliced [row, index] refs are unreliable here — frames are given as
// explicit {x, y, w, h} rects instead (the Animator accepts both forms).
// Verify with tools/viewer.html (press V in-game).

export const MISC_MAP = {
  // "Dash Smoke Effect" row — puff dissipating
  dash_dust: {
    frames: [
      { x: 0, y: 183, w: 12, h: 30 },
      { x: 17, y: 183, w: 8, h: 17 },
      { x: 31, y: 183, w: 9, h: 17 },
      { x: 44, y: 181, w: 10, h: 11 },
      { x: 58, y: 180, w: 10, h: 11 },
    ], fps: 15, loop: false,
  },
  // "Wall Slide Effect" row — dust burst, used for wall kicks and slides
  wall_dust: {
    frames: [
      { x: 0, y: 228, w: 8, h: 8 },
      { x: 12, y: 227, w: 10, h: 11 },
      { x: 29, y: 226, w: 13, h: 13 },
      { x: 49, y: 226, w: 14, h: 14 },
      { x: 70, y: 226, w: 14, h: 14 },
    ], fps: 15, loop: false,
  },
  // "Charging level 1" row — vertical beam sparks (reserved for a charge aura later)
  charge_spark: { frames: r(1, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), fps: 20, loop: true },
  idle: { frames: [{ x: 0, y: 228, w: 8, h: 8 }], fps: 10, loop: true },  // Animator default fallback
};

function r(row, indices) { return indices.map(i => [row, i]); }
