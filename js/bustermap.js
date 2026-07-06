// Animation map for assets/x_buster_shots.png (auto-sliced [row, index] refs).
// The sheet has label text baked in ("x shot", "low charge", …); those text
// blobs slice as frames at the start of each row, so the indices below skip
// them. Verify with tools/viewer.html (press V in-game).
// Shots face RIGHT on the sheet; impacts are symmetric.

export const BUSTER_MAP = {
  shot_lemon:    { frames: r(0, [4]), fps: 10, loop: true },
  impact_lemon:  { frames: r(0, [13, 14, 15]), fps: 20, loop: false },
  shot_mid:      { frames: r(1, [9, 10, 11, 12]), fps: 15, loop: true },
  impact_mid:    { frames: r(1, [19, 21, 23, 25]), fps: 15, loop: false },
  shot_full:     { frames: r(2, [8, 9, 10]), fps: 12, loop: true },
  impact_full:   { frames: r(2, [20, 21, 22, 23, 24, 26]), fps: 15, loop: false },
  muzzle:        { frames: r(0, [13, 14, 15]), fps: 20, loop: false },
  idle:          { frames: r(0, [4]), fps: 10, loop: true },  // Animator default fallback
};

function r(row, indices) { return indices.map(i => [row, i]); }
