/** WebAudio synthesis: jump, land, wisps, power-ups, crash, night pad. */
let context = null;
let master = null;
let pad = null;
let started = false;

function ctx() {
  if (!context) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    context = new AC();
    master = context.createGain();
    master.gain.value = 0.22;
    master.connect(context.destination);
  }
  return context;
}

function tone(frequency, duration, type, gainValue, when, slide) {
  const audio = ctx();
  if (!audio || !master) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, when);
  if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slide), when + duration);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  oscillator.connect(gain);
  gain.connect(master);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function noiseBurst(duration, gainValue, when, highpass) {
  const audio = ctx();
  if (!audio || !master) return;
  const length = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainValue, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(when);
  source.stop(when + duration);
}

function startPad() {
  const audio = ctx();
  if (!audio || !master || pad) return;
  const make = (frequency, type, detune) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.detune.value = detune;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    return { oscillator, gain };
  };
  pad = [make(110, 'sine', 0), make(165, 'triangle', 8), make(220, 'sine', -6)];
}

export function unlockAudio() {
  const audio = ctx();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  if (!started) {
    started = true;
    startPad();
  }
}

export function playJump() {
  const audio = ctx();
  if (!audio) return;
  const when = audio.currentTime;
  tone(420, 0.14, 'triangle', 0.2, when, 680);
  tone(210, 0.1, 'sine', 0.08, when, 360);
}

export function playLand() {
  const audio = ctx();
  if (!audio) return;
  noiseBurst(0.08, 0.12, audio.currentTime, 400);
  tone(90, 0.09, 'sine', 0.1, audio.currentTime, 60);
}

export function playWisp() {
  const audio = ctx();
  if (!audio) return;
  const when = audio.currentTime;
  tone(880, 0.16, 'sine', 0.14, when, 1320);
  tone(1320, 0.2, 'triangle', 0.08, when + 0.04, 1760);
}

export function playPower(kind) {
  const audio = ctx();
  if (!audio) return;
  const when = audio.currentTime;
  const base = kind === 'shield' ? 392 : kind === 'magnet' ? 523 : 659;
  tone(base, 0.18, 'triangle', 0.16, when, base * 2);
  tone(base * 1.5, 0.22, 'sine', 0.1, when + 0.08, base * 2.2);
}

export function playCrash() {
  const audio = ctx();
  if (!audio) return;
  const when = audio.currentTime;
  noiseBurst(0.32, 0.28, when, 180);
  tone(220, 0.4, 'sawtooth', 0.12, when, 70);
}

export function playStart() {
  const audio = ctx();
  if (!audio) return;
  const when = audio.currentTime;
  tone(392, 0.16, 'triangle', 0.12, when, 392);
  tone(523, 0.18, 'sine', 0.1, when + 0.1, 523);
  tone(784, 0.28, 'triangle', 0.1, when + 0.2, 784);
}

export function mutePad(muted) {
  if (!pad) return;
  for (const voice of pad) voice.gain.gain.value = muted ? 0 : 0.04;
}
