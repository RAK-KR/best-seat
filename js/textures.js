// 캔버스로 그리는 재질 텍스처 (외부 이미지 없이 생성)
import * as THREE from 'three';

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function noise(ctx, w, h, amount, r, alpha = 1) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
    d[i + 3] = d[i + 3] * alpha;
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx, w, h, r, count, color, maxR) {
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h, rad = maxR * (0.3 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

function toTex(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

export function floorTexture() {
  const w = 1024, h = 1024, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(7);
  const plankH = h / 8;
  for (let i = 0; i < 8; i++) {
    const base = 70 + r() * 25;
    ctx.fillStyle = `rgb(${base + 38},${base + 12},${base - 18})`;
    ctx.fillRect(0, i * plankH, w, plankH);
    // 나뭇결
    for (let g = 0; g < 60; g++) {
      ctx.strokeStyle = `rgba(${40 + r() * 30},${20 + r() * 15},${8},${0.08 + r() * 0.12})`;
      ctx.lineWidth = 1 + r() * 2;
      ctx.beginPath();
      const y0 = i * plankH + r() * plankH;
      ctx.moveTo(0, y0);
      for (let x = 0; x <= w; x += 64) ctx.lineTo(x, y0 + Math.sin(x * 0.01 + g) * 3 + (r() - 0.5) * 2);
      ctx.stroke();
    }
    // 이음매
    ctx.fillStyle = 'rgba(20,10,4,0.85)';
    ctx.fillRect(0, i * plankH, w, 3);
    const cut = r() * w;
    ctx.fillRect(cut, i * plankH, 3, plankH);
  }
  blotches(ctx, w, h, r, 30, 'rgba(30,15,5,0.18)', 120);
  noise(ctx, w, h, 18, r);
  return toTex(c, 3, 3);
}

export function wallpaperTexture() {
  const w = 512, h = 512, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(11);
  ctx.fillStyle = '#c9b996';
  ctx.fillRect(0, 0, w, h);
  // 오래된 마름모 무늬
  ctx.strokeStyle = 'rgba(120,96,60,0.28)';
  ctx.lineWidth = 2;
  for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 32, y + 8); ctx.lineTo(x + 56, y + 32); ctx.lineTo(x + 32, y + 56); ctx.lineTo(x + 8, y + 32);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = 'rgba(140,110,70,0.22)';
    ctx.beginPath(); ctx.arc(x + 32, y + 32, 4, 0, Math.PI * 2); ctx.fill();
  }
  // 세로 줄무늬
  for (let x = 0; x < w; x += 16) {
    ctx.fillStyle = `rgba(255,240,210,${0.04 + r() * 0.04})`;
    ctx.fillRect(x, 0, 6, h);
  }
  blotches(ctx, w, h, r, 10, 'rgba(110,80,40,0.08)', 140);
  noise(ctx, w, h, 14, r);
  return toTex(c, 4, 2);
}

export function plasterTexture() {
  const w = 512, h = 512, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(23);
  ctx.fillStyle = '#ecebe6';
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 6, 'rgba(215,212,204,0.05)', 120);
  noise(ctx, w, h, 8, r);
  return toTex(c, 2, 2);
}

export function ceilingTexture() {
  const w = 256, h = 256, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(31);
  ctx.fillStyle = '#b8ad97';
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 8, 'rgba(90,70,40,0.1)', 80);
  noise(ctx, w, h, 12, r);
  return toTex(c, 4, 4);
}

export function woodTexture(seed = 3, tone = [92, 58, 34]) {
  const w = 512, h = 512, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(seed);
  ctx.fillStyle = `rgb(${tone[0]},${tone[1]},${tone[2]})`;
  ctx.fillRect(0, 0, w, h);
  for (let g = 0; g < 140; g++) {
    ctx.strokeStyle = `rgba(30,15,5,${0.05 + r() * 0.12})`;
    ctx.lineWidth = 1 + r() * 2.5;
    ctx.beginPath();
    const y0 = r() * h;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y0 + Math.sin(x * 0.02 + g * 0.7) * 4);
    ctx.stroke();
  }
  noise(ctx, w, h, 14, r);
  return toTex(c);
}

export function roughBoardTexture() {
  const w = 512, h = 128, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(41);
  ctx.fillStyle = '#6f5a43';
  ctx.fillRect(0, 0, w, h);
  for (let g = 0; g < 80; g++) {
    ctx.strokeStyle = `rgba(35,25,15,${0.1 + r() * 0.2})`;
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    const y0 = r() * h;
    ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y0 + (r() - 0.5) * 3);
    ctx.stroke();
  }
  blotches(ctx, w, h, r, 8, 'rgba(20,15,10,0.3)', 40);
  noise(ctx, w, h, 22, r);
  return toTex(c);
}

export function metalTexture() {
  const w = 256, h = 256, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(51);
  ctx.fillStyle = '#6b6e6c';
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 16, 'rgba(110,70,40,0.35)', 40);
  noise(ctx, w, h, 20, r);
  return toTex(c);
}

export function clothTexture() {
  const w = 512, h = 512, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(61);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5d6266'); g.addColorStop(1, '#3d4144');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, r, 30, 'rgba(120,125,130,0.15)', 120);
  for (let x = 0; x < w; x += 3) {
    ctx.fillStyle = `rgba(0,0,0,${r() * 0.06})`;
    ctx.fillRect(x, 0, 1, h);
  }
  noise(ctx, w, h, 10, r);
  return toTex(c);
}

// 바닥·벽용 거칠기 맵 대신 쓰는 범용 노이즈
export function roughnessNoise() {
  const w = 256, h = 256, c = canvas(w, h), ctx = c.getContext('2d'), r = rng(71);
  ctx.fillStyle = '#bbbbbb';
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, 60, r);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function canvasTexture(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
