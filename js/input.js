import { CFG } from './config.js';

const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'dash', 'start'];

class Input {
  constructor() {
    this.held = {}; this.prev = {};
    this.keyDown = new Set();
    ACTIONS.forEach(a => { this.held[a] = false; this.prev[a] = false; });
    addEventListener('keydown', e => { this.keyDown.add(e.code); if (this._mapped(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => this.keyDown.delete(e.code));
    addEventListener('blur', () => this.keyDown.clear());
  }
  _mapped(code) { return ACTIONS.some(a => CFG.keys[a] && CFG.keys[a].includes(code)); }

  poll() {
    ACTIONS.forEach(a => this.prev[a] = this.held[a]);
    const k = {};
    ACTIONS.forEach(a => k[a] = (CFG.keys[a] || []).some(c => this.keyDown.has(c)));
    // gamepad
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const b = i => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0, dz = CFG.pad.deadzone;
      k.left  = k.left  || ax < -dz || b(14);
      k.right = k.right || ax >  dz || b(15);
      k.up    = k.up    || ay < -dz || b(12);
      k.down  = k.down  || ay >  dz || b(13);
      k.jump  = k.jump  || b(CFG.pad.jump);
      k.fire  = k.fire  || b(CFG.pad.fire) || b(CFG.pad.fireAlt);
      k.dash  = k.dash  || b(CFG.pad.dash) || b(CFG.pad.dashAlt);
      k.start = k.start || b(CFG.pad.start);
      break; // first connected pad wins
    }
    ACTIONS.forEach(a => this.held[a] = !!k[a]);
  }
  pressed(a) { return this.held[a] && !this.prev[a]; }
  released(a) { return !this.held[a] && this.prev[a]; }
  down(a) { return this.held[a]; }
}
export const input = new Input();
