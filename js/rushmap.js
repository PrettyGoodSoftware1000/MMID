// Animation map for assets/Rush/Rush2.png (auto-sliced [row, index] refs, sheet faces LEFT).
// The sheet has label text baked in ("INTRO:", "STAND:", …). Labels sit on their
// own lines, so they slice into their own rows — the even-numbered text/bracket
// rows below are skipped entirely. Verify with tools/viewer.html (press V in-game).
//
// Sliced rows: 0 "INTRO:" | 1 intro frames | 2 "STAND:" | 3 stand/idle frames
// 4 idle bracket line | 5 "WALKING:" | 6 walk frames | 7 "RUNNING:" | 8 run frames
// 9 "SPECIAL MOVES:" | 10 "RUSH COIL:" | 11 coil frames | 12 "RUSH JET:" | 13 jet frames

export const RUSH_MAP = {
  teleport_in: { frames: r(1, [0, 1, 2, 3, 4, 5, 6]), fps: 12, loop: false },
  idle:        { frames: r(3, [1, 2, 3, 4, 5]), fps: 3, loop: true },
  idle_shoot:  { frames: r(3, [1, 2, 3, 4, 5]), fps: 3, loop: true },
  land:        { frames: r(3, [0]), fps: 12, loop: false },
  walk:        { frames: r(6, [0, 1, 2, 3, 4, 5]), fps: 10, loop: true },
  run:         { frames: r(8, [0, 1, 2, 3, 4, 5]), fps: 14, loop: true },
  run_shoot:   { frames: r(8, [0, 1, 2, 3, 4, 5]), fps: 14, loop: true },
  // Jump borrows the last 3 run frames (the spring/coil frames on row 11 are
  // saved for the actual Rush Coil later); fall holds the run's final frame.
  jump:        { frames: r(8, [3, 4, 5]), fps: 10, loop: false },
  fall:        { frames: r(8, [5]), fps: 8, loop: false },
  jump_shoot:  { frames: r(8, [3, 4, 5]), fps: 10, loop: false },
  fall_shoot:  { frames: r(8, [5]), fps: 8, loop: false },
  coil:        { frames: r(11, [0, 1, 2, 3, 4]), fps: 10, loop: false },
  fly:         { frames: r(13, [1, 2, 3, 4]), fps: 10, loop: true },
  fly_shoot:   { frames: r(13, [1, 2, 3, 4]), fps: 10, loop: true },
  jet:         { frames: r(13, [0, 1, 2, 3, 4]), fps: 10, loop: false },
  hurt:        { frames: r(3, [0]), fps: 8, loop: true },   // no dedicated hurt frames on this sheet
};

function r(row, indices) { return indices.map(i => [row, i]); }
