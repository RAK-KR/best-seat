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
  master.gain.value = 0.8;
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
