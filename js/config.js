// MegaMan is Dead — all tunables live here.
// Physics values are per-frame at 60fps, in source pixels.
export const CFG = {
  view: { w: 256, h: 224 },          // internal SNES-style resolution
  animSpeed: 1.0,                    // global animation-rate multiplier (0.5 = half speed)
  sfxVolume: 0.35,                   // master sound-effect volume (0-1)
  gravity: 0.25,
  maxFall: 5.75,
  runSpeed: 1.5,
  dashSpeed: 3.5,
  dashFrames: 32,                    // ground dash duration
  airDash: false,                    // X1 has none; flip for X2 feel
  jumpVel: -4.95,
  jumpHoldGravity: 0.65,             // gravity multiplier while rising with jump held
  jumpCutVel: -1.5,                  // upward speed clamps to this when jump is released
  wallSlideMaxFall: 1.2,
  wallKick: { vx: 1.5, vxDash: 3.5, vy: -4.95, lockFrames: 9 },
  stepUp: 4,                         // slope tolerance (px auto-climb)
  player: { hp: 16, iFrames: 90, hurtKnockX: 1.0, hurtFrames: 24 },
  // Character capability definitions. flipBase = which way the sheet faces (1 right, -1 left).
  chars: {
    x:    { name: 'X', sheet: 'assets/x.png', hitW: 12, hitH: 28, flipBase: 1,
            dash: true, wallKick: true, fly: false, charge: true, shootX: 12, shootY: -24 },
    rush: { name: 'RUSH', sheet: 'assets/Rush2.png', hitW: 22, hitH: 24, flipBase: 1,
            dash: false, wallKick: false, fly: true, charge: true, shootX: 16, shootY: -18,
            flight: { speed: 2.0, vSpeed: 1.6, drift: 0.25, fuel: 240, regen: 3, minFuel: 30 } },
  },
  effects: {
    sheet: 'assets/misc_sprites.png',    // dash smoke, wall dust, charge sparks (see miscmap.js)
  },
  buster: {
    sheet: 'assets/x_buster_shots.png',  // shot + impact animations (see bustermap.js)
    maxOnScreen: 3,
    lemon: { speed: 6, dmg: 1 },
    mid:   { speed: 7, dmg: 2, chargeAt: 30 },   // frames of holding fire
    full:  { speed: 8, dmg: 4, chargeAt: 85, scale: 0.8 },  // scale shrinks the drawn sprite
    shootPose: 24,                   // frames the blaster-hand (shoot-variant) anim lingers
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
  // Standard gamepad mapping indices. All four shoulder buttons dash (facing direction).
  pad: { jump: 0, fire: 2, fireAlt: 1, dashButtons: [4, 5, 6, 7], start: 9, deadzone: 0.35 },
};
