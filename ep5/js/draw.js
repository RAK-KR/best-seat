// 5편 그림
import { makeCanvas, rng, grain, vignette, roundRect, HAND, SERIF, negativeFrame, negClock } from '../../shared/draw.js';
import { drawNegative as neg2 } from '../../ep2/js/closeups.js';
import { drawNegative as neg3 } from '../../ep3/js/draw.js';
import { drawNegative as neg4 } from '../../ep4/js/draw.js';
import { NEGS } from './content.js';

// 정미소 담 앞 (셔터 내림, 시계 3시 20분, 긴 그림자)
export function neg5(c) {
  negativeFrame(c, (ctx, x, y, w, h) => {
    ctx.fillStyle = '#7a5a2a'; ctx.fillRect(x, y + h * 0.15, w, h * 0.6);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = i % 2 ? '#6a4a1a' : '#8a6a3a'; ctx.fillRect(x + w * 0.25, y + h * (0.2 + i * 0.05), w * 0.45, h * 0.05); }
    ctx.fillStyle = 'rgba(60,30,5,0.6)';
    ctx.beginPath(); ctx.moveTo(x, y + h * 0.75); ctx.lineTo(x + w, y + h * 0.75); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w * 0.4, y + h); ctx.fill();
    negClock(ctx, x + w * 0.12, y + h * 0.28, h * 0.12, 3, 20);
  }, '0');
}

export function drawNeg(c, id) { ({ n2: neg2, n3: neg3, n4: neg4, n5: neg5 })[id](c); }

// 라이트박스: 네 컷을 이어 놓은 모습
export function drawStrip(c, order) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#f4f2ea'; ctx.fillRect(0, 0, w, h);
  const fw = w / 4;
  order.forEach((id, i) => {
    if (!id) {
      ctx.strokeStyle = '#b8b2a0'; ctx.setLineDash([8, 6]); ctx.lineWidth = 3;
      ctx.strokeRect(i * fw + 8, 8, fw - 16, h - 16); ctx.setLineDash([]);
      ctx.fillStyle = '#9a9480'; ctx.font = `${h * 0.12}px ${SERIF}`; ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, i * fw + fw / 2, h * 0.55);
      return;
    }
    const f = makeCanvas(560, 320); drawNeg(f, id);
    ctx.drawImage(f, i * fw, 0, fw, h);
  });
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  g.addColorStop(0, 'rgba(255,255,240,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

// 마지막 컷: 의자에서 거꾸로 뜬 거리를 보며 웃는 아이 (현상하지 않은 네거티브)
export function drawLastFrame(c) {
  negativeFrame(c, (ctx, x, y, w, h) => {
    ctx.fillStyle = '#e0b878'; ctx.fillRect(x, y, w, h);
    // 벽에 뒤집혀 맺힌 거리 (네거티브라 어둡게)
    ctx.save(); ctx.translate(x + w * 0.5, y + h * 0.35); ctx.rotate(Math.PI);
    ctx.fillStyle = '#5a3a14'; ctx.fillRect(-w * 0.42, -h * 0.25, w * 0.84, h * 0.5);
    ctx.fillStyle = '#3a2208'; ctx.font = `bold ${h * 0.12}px serif`; ctx.textAlign = 'center';
    ctx.fillText('0819', w * 0.2, h * 0.05);
    ctx.restore();
    // 의자와 아이
    ctx.fillStyle = '#f2d39a';
    ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h * 0.7, w * 0.06, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.42, y + h * 0.78, w * 0.16, h * 0.22);
    ctx.strokeStyle = '#f2d39a'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x + w * 0.55, y + h * 0.82); ctx.lineTo(x + w * 0.66, y + h * 0.6); ctx.stroke();
  }, '');
}

export function drawCalendar2008(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#efe8d4'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a5a8a'; ctx.fillRect(0, 0, w, h * 0.16);
  ctx.fillStyle = '#fff'; ctx.font = `bold ${h * 0.08}px ${SERIF}`; ctx.textAlign = 'center';
  ctx.fillText('2008년 8월', w / 2, h * 0.11);
  const cw = w / 7, top = h * 0.24, rh = (h - top) / 6;
  ctx.font = `${h * 0.045}px ${SERIF}`;
  ['일', '월', '화', '수', '목', '금', '토'].forEach((d, i) => { ctx.fillStyle = i ? '#333' : '#b02a22'; ctx.fillText(d, cw * i + cw / 2, top - h * 0.02); });
  // 2008년 8월 1일은 금요일
  for (let d = 1; d <= 31; d++) {
    const idx = d + 4, col = idx % 7, row = Math.floor(idx / 7);
    const x = cw * col + cw / 2, yy = top + rh * row + rh * 0.55;
    ctx.fillStyle = col ? '#333' : '#b02a22'; ctx.fillText(String(d), x, yy);
    if (d === 19) { ctx.strokeStyle = '#b02a22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, yy - rh * 0.15, rh * 0.42, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#b02a22'; ctx.font = `${h * 0.03}px ${HAND}`; ctx.fillText('휴업', x, yy + rh * 0.35); ctx.font = `${h * 0.045}px ${SERIF}`; }
  }
  grain(ctx, w, h, 8, 3);
}

// 담 바깥면 (페인트 글씨) — 1편에서 거꾸로 봤던 그 글씨
export function drawFence(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height, r = rng(91);
  ctx.fillStyle = '#8d887d'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(60,55,48,0.35)'; ctx.lineWidth = 2;
  const bh = h / 9;
  for (let row = 0; row < 9; row++) {
    const y = row * bh;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    for (let x = (row % 2) * 60; x < w; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); }
  }
  for (let i = 0; i < 26; i++) { ctx.fillStyle = `rgba(50,45,35,${0.04 + r() * 0.1})`; ctx.fillRect(r() * w, 0, 8 + r() * 30, h * (0.2 + r() * 0.8)); }
  const paint = (text, x, y, size, seed, font) => {
    const rr = rng(seed);
    ctx.font = `900 ${size}px ${font}`;
    const total = ctx.measureText(text).width * 1.08;
    let cx = x - total / 2;
    for (const ch of text) {
      const cw = ctx.measureText(ch).width * 1.08;
      const sz = size * (0.86 + rr() * 0.3);
      ctx.save(); ctx.translate(cx + cw / 2, y + (rr() - 0.5) * size * 0.16); ctx.rotate((rr() - 0.5) * 0.22);
      ctx.font = `900 ${sz}px ${font}`; ctx.textAlign = 'center';
      for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(245,242,230,${0.35 + k * 0.15})`; ctx.fillText(ch, (rr() - 0.5) * sz * 0.04, (rr() - 0.5) * sz * 0.04); }
      if (ch.trim() && rr() < 0.5) { ctx.fillStyle = 'rgba(240,238,228,0.85)'; ctx.fillRect((rr() - 0.5) * sz * 0.4, 0, sz * 0.03, sz * (0.12 + rr() * 0.25)); }
      ctx.restore(); cx += cw;
    }
  };
  const F = '"Black Han Sans", "Gothic A1", sans-serif';
  paint('하루야', w * 0.3, h * 0.36, h * 0.24, 3, F);
  paint('생일 축하한다', w * 0.34, h * 0.68, h * 0.2, 8, F);
  paint('0819', w * 0.78, h * 0.6, h * 0.42, 12, '"Arial Black", "Gothic A1", sans-serif');
}

// 맞은편 빛나 사진관 건물
export function drawStudio(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.3); sky.addColorStop(0, '#8fb2d0'); sky.addColorStop(1, '#e6d9b8');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8ab92'; ctx.fillRect(w * 0.2, h * 0.12, w * 0.6, h * 0.88);
  ctx.fillStyle = '#a89c84'; ctx.fillRect(0, h * 0.3, w * 0.2, h * 0.7); ctx.fillRect(w * 0.8, h * 0.25, w * 0.2, h * 0.75);
  // 2층 판자 창 + 놋쇠 마개
  const wx = w * 0.38, wy = h * 0.2, ww = w * 0.24, wh = h * 0.22;
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#6f5a43' : '#7d6750'; ctx.fillRect(wx, wy + i * wh / 5, ww, wh / 5 - 3); }
  ctx.fillStyle = '#111'; for (let i = 1; i < 5; i++) ctx.fillRect(wx, wy + i * wh / 5 - 3, ww, 3);
  ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(wx + ww / 2, wy + wh / 2, w * 0.012, 0, Math.PI * 2); ctx.fill();
  // 1층 가게
  ctx.fillStyle = '#3d5a6e'; ctx.fillRect(w * 0.26, h * 0.52, w * 0.48, h * 0.09);
  ctx.fillStyle = '#efe6cf'; ctx.font = `bold ${h * 0.06}px ${SERIF}`; ctx.textAlign = 'center';
  ctx.fillText('빛나 사진관', w / 2, h * 0.585);
  ctx.fillStyle = '#5a4a3a'; ctx.fillRect(w * 0.3, h * 0.64, w * 0.4, h * 0.3);
  ctx.fillStyle = '#9ab0b8'; ctx.fillRect(w * 0.32, h * 0.66, w * 0.16, h * 0.2); ctx.fillRect(w * 0.52, h * 0.66, w * 0.16, h * 0.2);
  ctx.fillStyle = '#6a6458'; ctx.fillRect(0, h * 0.94, w, h * 0.06);
  grain(ctx, w, h, 8, 5);
}

export function drawSacks(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a241c'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 24; i++) {
    const col = i % 8, row = Math.floor(i / 8);
    const x = w * (0.03 + col * 0.12), y = h * (0.06 + row * 0.31);
    ctx.fillStyle = '#e8dcc0'; roundRect(ctx, x, y, w * 0.11, h * 0.27, 10); ctx.fill();
    ctx.fillStyle = '#2a5a2a'; ctx.font = `bold ${h * 0.05}px ${SERIF}`; ctx.textAlign = 'center';
    ctx.fillText('쌀', x + w * 0.055, y + h * 0.1);
    ctx.fillStyle = '#2a2a3a'; ctx.font = `${h * 0.08}px ${HAND}`;
    ctx.fillText(`${i + 1}`, x + w * 0.055, y + h * 0.22);
  }
  grain(ctx, w, h, 8, 7);
}
export { makeCanvas, NEGS };
