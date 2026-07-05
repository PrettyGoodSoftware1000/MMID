// MegaMan is Dead — all tunables live here.
// Physics values are per-frame at 60fps, in source pixels.
export const CFG = {
  view: { w: 256, h: 224 },          // internal SNES-style resolution
  gravity: 0.25,
  maxFall: 5.75,
  runSpeed: 1.5,
  dashSpeed: 3.5,
  dashFrames: 32,                    // ground dash duration
  airDash: false,                    // X1 has none; flip for X2 feel
  jumpVel: -4.95,
  wallSlideMaxFall: 1.2,
  wallKick: { vx: 1.5, vxDash: 3.5, vy: -4.95, lockFrames: 9 },
  stepUp: 4,                         // slope tolerance (px auto-climb)
  player: { hitW: 12, hitH: 28, hp: 16, iFrames: 90, hurtKnockX: 1.0, hurtFrames: 24 },
  buster: {
    maxOnScreen: 3,
    lemon: { speed: 6, dmg: 1 },
    mid:   { speed: 7, dmg: 2, chargeAt: 30 },   // frames of holding fire
    full:  { speed: 8, dmg: 4, chargeAt: 85 },
    shootPose: 16,                   // frames the shoot-variant anim lingers
  },
  // Enemy-layer marker colors (exact match, RGB)
  markers: {
    'FFFF00': { type: 'spawn' },
    '00FFFF': { type: 'checkpoint' },
    'FF0000': { type: 'enemy', id: 'walker' },
    'FF00FF': { type: 'enemy', id: 'flyer' },
    '0000FF': { type: 'enemy', id: 'turret' },
  },
  // game-layer alpha semantics
  solidAlpha: 250,                   // >= this -> solid
  oneWayAlphaMin: 80,                // [min,max] -> one-way platform (solid from above)
  oneWayAlphaMax: 200,
  keys: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['KeyZ', 'Space'], fire: ['KeyX', 'KeyJ'], dash: ['KeyC', 'ShiftLeft', 'KeyK'],
    start: ['Enter'],
  },
  // Standard gamepad mapping indices
  pad: { jump: 0, fire: 2, fireAlt: 1, dash: 5, dashAlt: 7, start: 9, deadzone: 0.35 },
};
