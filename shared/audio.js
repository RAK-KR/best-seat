// 효과음과 방 소리 (WebAudio로 직접 합성)
let ctx = null, master = null, roomGain = null, outsideGain = null;

function noiseBuffer(sec = 2) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return b;
}
function whiteBuffer(sec = 1) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function initAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = window.BSSettings ? window.BSSettings.get('vol') : 0.8;
  window.addEventListener('bestseat-vol', (e) => { master.gain.setTargetAtTime(e.detail, ctx.currentTime, 0.03); });
  master.connect(ctx.destination);
  // 방 안의 낮은 웅웅거림 (전기가 들어와 있을 때)
  const hum = ctx.createOscillator();
  hum.frequency.value = 60;
  const hum2 = ctx.createOscillator();
  hum2.frequency.value = 120;
  roomGain = ctx.createGain();
  roomGain.gain.value = 0.012;
  hum.connect(roomGain); hum2.connect(roomGain);
  roomGain.connect(master);
  hum.start(); hum2.start();
  // 바깥 소리 (마개를 열면 조금 들린다)
  const n = ctx.createBufferSource();
  n.buffer = noiseBuffer(4); n.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 700;
  outsideGain = ctx.createGain();
  outsideGain.gain.value = 0.015;
  n.connect(lp); lp.connect(outsideGain); outsideGain.connect(master);
  n.start();
}

export function setPower(on) {
  if (!ctx) return;
  roomGain.gain.setTargetAtTime(on ? 0.012 : 0, ctx.currentTime, 0.05);
}
export function setOutside(open) {
  if (!ctx) return;
  outsideGain.gain.setTargetAtTime(open ? 0.05 : 0.015, ctx.currentTime, 0.4);
}

function burst({ freq = 1000, q = 1, dur = 0.08, gain = 0.3, type = 'bandpass', delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource();
  s.buffer = whiteBuffer(dur + 0.05);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur + 0.05);
}
function tone({ freq = 200, dur = 0.2, gain = 0.2, type = 'sine', delay = 0, slide = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

export const sfx = {
  step() { burst({ freq: 180 + Math.random() * 60, q: 0.8, dur: 0.09, gain: 0.12, type: 'lowpass' }); burst({ freq: 900, q: 3, dur: 0.03, gain: 0.03, delay: 0.02 }); },
  paper() { burst({ freq: 3000, q: 0.6, dur: 0.18, gain: 0.08, type: 'highpass' }); burst({ freq: 2400, q: 0.6, dur: 0.12, gain: 0.05, type: 'highpass', delay: 0.12 }); },
  dial() { burst({ freq: 2600, q: 8, dur: 0.025, gain: 0.12 }); },
  wrong() { tone({ freq: 140, dur: 0.18, gain: 0.12, type: 'square' }); burst({ freq: 400, q: 2, dur: 0.06, gain: 0.1 }); },
  unlock() { burst({ freq: 1800, q: 6, dur: 0.04, gain: 0.2 }); burst({ freq: 900, q: 4, dur: 0.08, gain: 0.2, delay: 0.08 }); tone({ freq: 90, dur: 0.15, gain: 0.15, delay: 0.08 }); },
  drawer() { burst({ freq: 300, q: 0.5, dur: 0.4, gain: 0.12, type: 'lowpass' }); },
  door() { tone({ freq: 70, dur: 0.6, gain: 0.12, type: 'sawtooth', slide: 0.7 }); burst({ freq: 500, q: 1, dur: 0.5, gain: 0.06 }); },
  key() { burst({ freq: 4200, q: 10, dur: 0.05, gain: 0.08 }); burst({ freq: 5200, q: 10, dur: 0.05, gain: 0.06, delay: 0.06 }); },
  fuse() { tone({ freq: 55, dur: 0.4, gain: 0.35, type: 'triangle', slide: 0.5 }); burst({ freq: 200, q: 1, dur: 0.2, gain: 0.3, type: 'lowpass' }); burst({ freq: 3000, q: 2, dur: 0.05, gain: 0.1 }); },
  screw() { for (let i = 0; i < 6; i++) burst({ freq: 3500 + Math.random() * 800, q: 12, dur: 0.03, gain: 0.05, delay: i * 0.09 }); },
  cloth() { burst({ freq: 800, q: 0.4, dur: 0.5, gain: 0.08 }); },
  sit() { tone({ freq: 110, dur: 0.25, gain: 0.06, type: 'triangle', slide: 0.8 }); burst({ freq: 300, q: 1, dur: 0.15, gain: 0.05 }); },
  reveal() {
    // 낮고 넓은 화음 (공개 순간)
    [130.8, 196, 261.6, 329.6].forEach((f, i) => tone({ freq: f, dur: 5, gain: 0.05, type: 'sine', delay: i * 0.35 }));
  },
  ending() {
    const notes = [261.6, 329.6, 392, 523.3, 392, 440, 349.2, 392];
    notes.forEach((f, i) => { tone({ freq: f, dur: 1.6, gain: 0.05, delay: i * 0.6 }); tone({ freq: f / 2, dur: 2.2, gain: 0.03, delay: i * 0.6 }); });
  },
};

// ───── 3~5편 추가 소리 ─────
export const sfx2 = {
  ring() { for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) tone({ freq: i % 2 ? 1300 : 1100, dur: 0.04, gain: 0.05, type: 'square', delay: k * 0.6 + i * 0.035 }); },
  beep() { tone({ freq: 880, dur: 0.25, gain: 0.08, type: 'sine' }); },
  // 생일 축하 노래 (퍼블릭 도메인 "Happy Birthday to You", 원곡 음정 그대로)
  birthday() {
    const G4 = 392, A4 = 440, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;
    const q = 0.42;
    const song = [
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [C5, 1], [B4, 2],
      [G4, 0.75], [G4, 0.25], [A4, 1], [G4, 1], [D5, 1], [C5, 2],
      [G4, 0.75], [G4, 0.25], [G5, 1], [E5, 1], [C5, 1], [B4, 1], [A4, 2],
      [F5, 0.75], [F5, 0.25], [E5, 1], [C5, 1], [D5, 1], [C5, 2.5],
    ];
    let t = 0.2;
    song.forEach(([f, d]) => {
      tone({ freq: f, dur: d * q * 0.95, gain: 0.07, type: 'triangle', delay: t });
      tone({ freq: f / 2, dur: d * q * 0.9, gain: 0.025, type: 'sine', delay: t });
      t += d * q;
    });
    return t;
  },
  projector(on) {
    if (!ctx) return;
    if (on && !this._p) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 24;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      const g = ctx.createGain(); g.gain.value = 0.05;
      o.connect(f); f.connect(g); g.connect(master); o.start();
      this._p = { o, g };
    } else if (!on && this._p) { this._p.g.gain.setTargetAtTime(0, ctx.currentTime, 0.1); const p = this._p; setTimeout(() => p.o.stop(), 500); this._p = null; }
  },
  machine() { tone({ freq: 60, dur: 1.2, gain: 0.2, type: 'sawtooth', slide: 1.4 }); burst({ freq: 200, q: 0.5, dur: 1.0, gain: 0.15, type: 'lowpass' }); },
  shutter() { for (let i = 0; i < 14; i++) burst({ freq: 900 + (i % 3) * 200, q: 2, dur: 0.05, gain: 0.08, delay: i * 0.07 }); },
};
