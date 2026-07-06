// Level music. Tries a real track first — music/<levelfolder>.mp3 (or .ogg /
// .wav), then music/default.* — and falls back to a WebAudio-synthesized
// chiptune loop in the MMX spirit. Drop real rips into music/ (see
// music/README.md) and they take over automatically, same as sounds/.

import { CFG } from './config.js';
import { audioCtx } from './sound.js';

const EXTS = ['mp3', 'ogg', 'wav'];
let audioEl = null;      // current <audio> track, if a file was found
let synthOn = false;     // synth fallback loop running
let synthGain = null, synthTimer = null, synthStep = 0, synthNext = 0;

export async function playLevelMusic(levelPath) {
  stopMusic();
  const name = levelPath.split('/').pop();
  const src = (await findTrack(name)) || (await findTrack('default'));
  if (src) playFile(src);
  else startSynthLoop();
}

export function stopMusic() {
  if (audioEl) { audioEl.pause(); audioEl = null; }
  if (synthTimer) { clearInterval(synthTimer); synthTimer = null; }
  if (synthGain) { synthGain.disconnect(); synthGain = null; }
  synthOn = false;
}

async function findTrack(name) {
  for (const ext of EXTS) {
    const src = `music/${name}.${ext}`;
    try {
      const r = await fetch(src, { method: 'HEAD' });
      if (r.ok) return src;
    } catch { /* keep looking */ }
  }
  return null;
}

function playFile(src) {
  audioEl = new Audio(src);
  audioEl.loop = true;
  audioEl.volume = CFG.musicVolume ?? 0.4;
  const el = audioEl;
  // autoplay may be blocked until the page has been clicked/keyed — retry on
  // the next real input (gamepads never fire these, so keep them attached)
  const tryPlay = () => { if (audioEl === el) el.play().catch(() => {}); };
  tryPlay();
  for (const ev of ['keydown', 'mousedown', 'pointerdown', 'touchstart'])
    addEventListener(ev, tryPlay);
}

// ---------- synth fallback: a small looping chiptune ----------
// 32 eighth-note steps (4 bars) at 150bpm. E-minor riff: square lead,
// triangle bass, noise hats, sine kick — the classic SNES-adjacent palette.

const STEP_DUR = 60 / 150 / 2;
const BASS = [
  'E2', 'E2', 'E3', 'E2', 'E2', 'E3', 'E2', 'E3',
  'C2', 'C2', 'C3', 'C2', 'C2', 'C3', 'C2', 'C3',
  'D2', 'D2', 'D3', 'D2', 'D2', 'D3', 'D2', 'D3',
  'B1', 'B1', 'B2', 'B1', 'A1', 'A2', 'B1', 'B2',
];
const LEAD = [
  'E4', null, 'G4', 'E4', 'B4', null, 'A4', 'G4',
  'A4', null, 'C5', 'A4', 'G4', 'E4', 'G4', null,
  'D4', null, 'F#4', 'A4', 'D5', null, 'C5', 'A4',
  'B4', 'G4', 'E4', null, 'F#4', 'G4', 'F#4', 'D4',
];

function freq(n) {
  const SEMI = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const m = n.match(/^([A-G]#?)(\d)$/);
  return 440 * 2 ** ((SEMI[m[1]] + 12 * (+m[2] + 1) - 69) / 12);
}

function note(type, name, t, dur, gain) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq(name), t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(synthGain);
  o.start(t); o.stop(t + dur + 0.02);
}

function hat(t, gain) {
  const len = (0.03 * audioCtx.sampleRate) | 0;
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = audioCtx.createBufferSource(); s.buffer = buf;
  const f = audioCtx.createBiquadFilter();
  f.type = 'highpass'; f.frequency.value = 6000;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  s.connect(f); f.connect(g); g.connect(synthGain);
  s.start(t);
}

function kick(t) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(110, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g); g.connect(synthGain);
  o.start(t); o.stop(t + 0.14);
}

function scheduleStep(i, t) {
  if (BASS[i]) note('triangle', BASS[i], t, STEP_DUR * 0.9, 0.30);
  if (LEAD[i]) note('square', LEAD[i], t, STEP_DUR * 0.85, 0.12);
  hat(t, i % 2 === 1 ? 0.10 : 0.05);
  if (i % 4 === 0) kick(t);
}

function startSynthLoop() {
  if (!audioCtx) return;
  synthGain = audioCtx.createGain();
  synthGain.gain.value = CFG.musicVolume ?? 0.4;
  synthGain.connect(audioCtx.destination);
  synthOn = true;
  synthStep = 0;
  synthNext = audioCtx.currentTime + 0.1;
  // lookahead scheduler; while the context is suspended currentTime freezes,
  // so the loop just waits and picks up when audio unlocks
  synthTimer = setInterval(() => {
    if (!synthOn) return;
    while (synthNext < audioCtx.currentTime + 0.25) {
      scheduleStep(synthStep % BASS.length, synthNext);
      synthNext += STEP_DUR;
      synthStep++;
    }
  }, 80);
}
