// 3편 그림
import { makeCanvas, rng, grain, vignette, roundRect, shakyText, HAND, SERIF, negativeFrame, negClock } from '../../shared/draw.js';
import { BOARD, RECIPES, SLIPS } from './content.js';

// 메모판 (코르크판에 꽂힌 쪽지들)
export function drawBoard(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height, r = rng(3);
  ctx.fillStyle = '#a0784a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) { ctx.fillStyle = `rgba(${60 + r() * 60},${40 + r() * 30},20,0.25)`; ctx.fillRect(r() * w, r() * h, 2, 2); }
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14);
  const spots = [[0.05, 0.08, 0.5, 0.56], [0.6, 0.1, 0.35, 0.36], [0.6, 0.55, 0.34, 0.3], [0.1, 0.7, 0.38, 0.24]];
  BOARD.forEach((n, i) => {
    const [x, y, ww, hh] = spots[i];
    ctx.save();
    ctx.translate(w * (x + ww / 2), h * (y + hh / 2)); ctx.rotate((r() - 0.5) * 0.12);
    ctx.fillStyle = i === 0 ? '#f1ead2' : ['#f6e7a0', '#cfe6f0', '#f2c9c9'][i % 3];
    ctx.fillRect(-w * ww / 2, -h * hh / 2, w * ww, h * hh);
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, -h * hh / 2 + 10, 7, 0, Math.PI * 2); ctx.fill();
    const fs = Math.min(h * hh / (n.lines.length + 1), w * ww / 7);
    n.lines.forEach((l, k) => {
      const yy = -h * hh / 2 + fs * (k + 1.3);
      if (n.hand === 'big') shakyText(ctx, l, -w * ww / 2 + 14, yy, fs * 1.05, 11 + k);
      else { ctx.fillStyle = '#2a2a3a'; ctx.font = `${fs * 0.8}px ${SERIF}`; ctx.fillText(l, -w * ww / 2 + 14, yy); }
    });
    ctx.restore();
  });
  grain(ctx, w, h, 10, 5);
}

export function drawRecipe(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#f3ead2'; ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.25, '120,90,40');
  ctx.fillStyle = '#5a2a1a'; ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.09}px ${SERIF}`; ctx.fillText('커피 타는 법', w / 2, h * 0.14);
  ctx.font = `${h * 0.05}px ${SERIF}`; ctx.fillStyle = '#6a4a3a';
  ctx.fillText('(숟가락 기준: 커피 · 설탕 · 프림)', w / 2, h * 0.23);
  RECIPES.forEach((rc, i) => {
    const y = h * (0.38 + i * 0.2);
    ctx.textAlign = 'left'; ctx.fillStyle = '#2a1a10';
    ctx.font = `bold ${h * 0.075}px ${SERIF}`; ctx.fillText(rc.name, w * 0.1, y);
    ctx.font = `${h * 0.055}px ${SERIF}`;
    ctx.fillText(`커피 ${rc.coffee}  설탕 ${rc.sugar}  프림 ${rc.cream}`, w * 0.42, y);
  });
  grain(ctx, w, h, 10, 7);
}

// 둘째 잔 (머그 바닥)
export function drawCup2(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#3a2a1e'; ctx.fillRect(0, 0, w, h);
  const cx = w * 0.3, cy = h * 0.5, R = h * 0.36;
  ctx.fillStyle = '#efe9dc'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a478'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8b88c'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a4a3a'; ctx.font = `${h * 0.08}px ${SERIF}`; ctx.textAlign = 'center';
  ctx.fillText('안쪽: 연한 갈색 자국', cx, cy + R + h * 0.1);
  // 바닥
  const bx = w * 0.72;
  ctx.fillStyle = '#e8e2d4'; ctx.beginPath(); ctx.arc(bx, cy, R * 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8b0a0'; ctx.lineWidth = 6; ctx.stroke();
  shakyText(ctx, '순이', bx, cy + h * 0.04, h * 0.18, 21, '#c0392b', 'center');
  ctx.fillStyle = '#6a4a3a'; ctx.font = `${h * 0.08}px ${SERIF}`;
  ctx.fillText('바닥', bx, cy + R + h * 0.1);
  grain(ctx, w, h, 8, 9);
}

export function drawSlips(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height, r = rng(13);
  ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 0, w, h);
  SLIPS.forEach((s, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = w * (0.04 + col * 0.32), y = h * (0.05 + row * 0.31);
    ctx.save(); ctx.translate(x + w * 0.14, y + h * 0.13); ctx.rotate((r() - 0.5) * 0.1);
    ctx.fillStyle = '#f2ecd8'; ctx.fillRect(-w * 0.14, -h * 0.13, w * 0.28, h * 0.26);
    ctx.fillStyle = '#7a2a1a'; ctx.font = `bold ${h * 0.045}px ${SERIF}`; ctx.textAlign = 'left';
    ctx.fillText('신청곡', -w * 0.13, -h * 0.07);
    ctx.fillStyle = '#2a2a3a'; ctx.font = `${h * 0.06}px ${HAND}`;
    ctx.fillText(`${s.who}  ${s.date}`, -w * 0.13, h * 0.0);
    ctx.font = `${h * 0.075}px ${HAND}`;
    ctx.fillText(`${s.no}번`, -w * 0.13, h * 0.09);
    ctx.restore();
  });
  grain(ctx, w, h, 8, 15);
}

export function drawMenu(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2b3a2e'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c9b27a'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#efe4c4'; ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.14}px ${SERIF}`; ctx.fillText('청춘다방', w / 2, h * 0.2);
  const items = [['커피', '600원'], ['쌍화차', '900원'], ['율무차', '700원'], ['생강차', '700원'], ['생일 케이크', '예약']];
  ctx.font = `${h * 0.085}px ${SERIF}`;
  items.forEach(([a, b], i) => {
    ctx.textAlign = 'left'; ctx.fillText(a, w * 0.12, h * (0.38 + i * 0.12));
    ctx.textAlign = 'right'; ctx.fillText(b, w * 0.88, h * (0.38 + i * 0.12));
  });
  grain(ctx, w, h, 10, 17);
}

export function drawCandles(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e8d8b0'; ctx.fillRect(w * 0.08, h * 0.25, w * 0.84, h * 0.65);
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4; ctx.strokeRect(w * 0.08, h * 0.25, w * 0.84, h * 0.65);
  for (let i = 0; i < 9; i++) {
    const x = w * (0.16 + (i % 5) * 0.17), y = h * (i < 5 ? 0.45 : 0.72);
    ctx.fillStyle = ['#e85a7a', '#5aa0e8', '#f0c04a'][i % 3];
    ctx.font = `bold ${h * 0.2}px ${SERIF}`; ctx.textAlign = 'center';
    ctx.fillText('8', x, y);
  }
  ctx.fillStyle = '#efe4c4'; ctx.font = `${h * 0.07}px ${HAND}`; ctx.textAlign = 'left';
  ctx.fillText('생일 초 — 윤 씨 것', w * 0.1, h * 0.17);
  grain(ctx, w, h, 8, 19);
}

export function drawBox(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f0e6d2'; roundRect(ctx, w * 0.12, h * 0.15, w * 0.76, h * 0.7, 10); ctx.fill();
  ctx.strokeStyle = '#c86a7a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.15); ctx.lineTo(w * 0.5, h * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.5); ctx.lineTo(w * 0.88, h * 0.5); ctx.stroke();
  ctx.fillStyle = '#2a2a3a'; ctx.font = `${h * 0.08}px ${HAND}`; ctx.textAlign = 'center';
  ctx.fillText('케이크 상자 — 하루 8.19', w * 0.5, h * 0.35);
  grain(ctx, w, h, 8, 23);
}

// 숨은 컷: 케이크 앞의 아이, 8자 초, 시계 12시 반
export function drawNegative(c) {
  negativeFrame(c, (ctx, x, y, w, h) => {
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(x, y + h * 0.62, w, h * 0.38);
    ctx.fillStyle = '#f2d9a8'; ctx.fillRect(x + w * 0.3, y + h * 0.46, w * 0.4, h * 0.2);
    ctx.fillStyle = '#4a2a0a'; ctx.font = `bold ${h * 0.24}px serif`; ctx.textAlign = 'center';
    ctx.fillText('8', x + w * 0.5, y + h * 0.46);
    ctx.fillStyle = '#2a1405'; ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h * 0.3, w * 0.025, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f0c98a';
    ctx.beginPath(); ctx.ellipse(x + w * 0.22, y + h * 0.42, w * 0.08, h * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.12, y + h * 0.52, w * 0.2, h * 0.22);
    negClock(ctx, x + w * 0.86, y + h * 0.2, h * 0.13, 12, 30);
  }, '5');
}
export { makeCanvas };
