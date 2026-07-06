import { CFG } from './config.js';

const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'dash', 'start'];
const keyDown = new Set();
addEventListener('keydown', e => {
  keyDown.add(e.code);
  if (ACTIONS.some(a => CFG.keys[a] && CFG.keys[a].includes(e.code))) e.preventDefault();
});
addEventListener('keyup', e => keyDown.delete(e.code));
addEventListener('blur', () => keyDown.clear());

export function connectedPads() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  return [...list].filter(p => p && p.connected);
}

// One Input per player. useKeyboard merges keyboard state; padIndex points
// into the *connected* pad list (-1 = no pad). game.js reassigns padIndex
// each frame so pads can connect late or in any order.
export class Input {
  constructor(useKeyboard, padIndex) {
    this.useKeyboard = useKeyboard;
    this.padIndex = padIndex;
    this.held = {}; this.prev = {};
    ACTIONS.forEach(a => { this.held[a] = false; this.prev[a] = false; });
  }
  poll() {
    ACTIONS.forEach(a => this.prev[a] = this.held[a]);
    const k = {};
    ACTIONS.forEach(a => k[a] = this.useKeyboard && (CFG.keys[a] || []).some(c => keyDown.has(c)));
    const p = this.padIndex >= 0 ? connectedPads()[this.padIndex] : null;
    if (p) {
      const b = i => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0, dz = CFG.pad.deadzone;
      k.left  = k.left  || ax < -dz || b(14);
      k.right = k.right || ax >  dz || b(15);
      k.up    = k.up    || ay < -dz || b(12);
      k.down  = k.down  || ay >  dz || b(13);
      k.jump  = k.jump  || b(CFG.pad.jump);
      k.fire  = k.fire  || b(CFG.pad.fire) || b(CFG.pad.fireAlt);
      k.dash  = k.dash  || CFG.pad.dashButtons.some(i => b(i));
      k.start = k.start || b(CFG.pad.start);
    }
    ACTIONS.forEach(a => this.held[a] = !!k[a]);
  }
  pressed(a) { return this.held[a] && !this.prev[a]; }
  released(a) { return !this.held[a] && this.prev[a]; }
  down(a) { return this.held[a]; }
}
