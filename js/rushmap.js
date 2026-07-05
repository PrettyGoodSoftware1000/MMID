// Animation map for assets/rush.png (auto-sliced [row, index] refs, sheet faces LEFT).
// Uses the same animation names the player state machine requests, so Rush
// plugs into the same code path as X. Verify with tools/viewer.html.

export const RUSH_MAP = {
  teleport_in: { frames: r(8, [3, 2, 1, 0]), fps: 12, loop: false },
  idle:        { frames: r(2, [6, 7, 8]), fps: 3, loop: true },
  idle_shoot:  { frames: r(5, [0, 1]), fps: 8, loop: true },
  run:         { frames: r(1, [0, 1, 2, 3, 4, 5, 6, 7]), fps: 14, loop: true },
  run_shoot:   { frames: r(1, [0, 1, 2, 3, 4, 5, 6, 7]), fps: 14, loop: true },
  jump:        { frames: r(6, [4]), fps: 8, loop: false },
  fall:        { frames: r(6, [4]), fps: 8, loop: true },
  land:        { frames: r(2, [5]), fps: 12, loop: false },
  jump_shoot:  { frames: r(6, [4]), fps: 8, loop: true },
  fall_shoot:  { frames: r(6, [4]), fps: 8, loop: true },
  fly:         { frames: r(3, [3, 4, 5, 6]), fps: 12, loop: true },
  fly_shoot:   { frames: r(3, [3, 4, 5, 6]), fps: 12, loop: true },
  hurt:        { frames: r(6, [5]), fps: 8, loop: true },
  hit_spark:   { frames: r(9, [0]), fps: 10, loop: false },
  shot_lemon:  { frames: r(0, [4]), fps: 10, loop: true },
  shot_mid:    { frames: r(0, [3]), fps: 10, loop: true },
  shot_full:   { frames: r(0, [2]), fps: 10, loop: true },
  muzzle:      { frames: r(0, [0, 1]), fps: 20, loop: false },
};

function r(row, indices) { return indices.map(i => [row, i]); }
