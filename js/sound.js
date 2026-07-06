// Sound engine. For each sound it first tries to load a real sample from
// sounds/<name>.wav (drop authentic rips there and they take over
// automatically); otherwise it falls back to a WebAudio-synthesized
// approximation of the classic Mega Man X effect.
// Browsers block audio until the first user input; the context resumes then.

import { CFG } from './config.js';

const AC = window.AudioContext || window.webkitAudioContext;
const ctx = AC ? new AC() : null;
export { ctx as audioCtx };   // shared by the music engine (music.js)
let master = null;
if (ctx) {
  master = ctx.createGain();
  master.gain.value = CFG.sfxVolume ?? 0.35;
  master.connect(ctx.destination);
  // Persistent unlock (not once:true): gamepad input never fires these events,
  // so keep listening — the first click/keypress after pad-only play resumes
  // audio. playSfx also retries, covering "clicked earlier, padded ever since".
  const unlock = () => { if (ctx.state === 'suspended') ctx.resume(); };
  for (const ev of ['keydown', 'mousedown', 'pointerdown', 'touchstart'])
    addEventListener(ev, unlock);
}

export const SOUND_NAMES = [
  'lemon', 'mid_shot', 'full_shot', 'charge_mid', 'charge_full',
  'dash', 'hurt', 'explosion', 'impact', 'teleport',
  'menu_move', 'menu_select',
];

const samples = {};   // decoded sounds/<name>.wav buffers, if present

export async function loadSounds() {
  if (!ctx) return;
  await Promise.all(SOUND_NAMES.map(async n => {
    try {
      const r = await fetch('sounds/' + n + '.wav');
      if (!r.ok) return;
      samples[n] = await ctx.decodeAudioData(await r.arrayBuffer());
    } catch { /* no sample — synth fallback */ }
  }));
}

export function playSfx(name) {
  if (!ctx) return;
  // resume works whenever the page has ever been clicked/keyed (sticky
  // activation) — covers gamepad players whose pad input can't unlock audio
  if (ctx.state === 'suspended') { ctx.resume(); return; }
  if (ctx.state !== 'running') return;
  if (samples[name]) {
    const s = ctx.createBufferSource();
    s.buffer = samples[name];
    s.connect(master);
    s.start();
    return;
  }
  const synth = SYNTH[name];
  if (synth) synth();
}

// ---------- synthesis helpers ----------

// oscillator sweep: type, frequency from->to, duration, peak gain
function tone(type, f0, f1, dur, gain = 0.5, delay = 0) {
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

// filtered noise burst: duration, lowpass sweep from->to
function noise(dur, lp0, lp1, gain = 0.5, delay = 0) {
  const t = ctx.currentTime + delay;
  const len = Math.max(1, (dur * ctx.sampleRate) | 0);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(lp0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(10, lp1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t);
}

const SYNTH = {
  lemon:       () => { tone('square', 1800, 400, 0.07, 0.35); },
  mid_shot:    () => { tone('square', 900, 160, 0.18, 0.45); noise(0.1, 4000, 800, 0.25); },
  full_shot:   () => { tone('sawtooth', 220, 950, 0.12, 0.5); tone('sawtooth', 950, 120, 0.28, 0.5, 0.1); noise(0.3, 5000, 300, 0.35); },
  charge_mid:  () => { tone('triangle', 320, 850, 0.09, 0.3); },
  charge_full: () => { tone('triangle', 550, 1300, 0.08, 0.35); tone('triangle', 700, 1600, 0.08, 0.35, 0.07); },
  dash:        () => { noise(0.16, 3200, 350, 0.4); },
  hurt:        () => { tone('square', 420, 90, 0.16, 0.45); },
  explosion:   () => { noise(0.5, 1600, 90, 0.6); tone('sine', 90, 35, 0.45, 0.5); },
  impact:      () => { noise(0.06, 6000, 1500, 0.3); },
  teleport:    () => { tone('sawtooth', 1600, 180, 0.22, 0.35); },
  menu_move:   () => { tone('square', 700, 700, 0.045, 0.25); },
  menu_select: () => { tone('square', 900, 1500, 0.07, 0.3); },
};
