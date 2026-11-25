// 4편 그림
import { makeCanvas, rng, grain, vignette, roundRect, HAND, SERIF, negativeFrame } from '../../shared/draw.js';
import { FOOTAGE, SEATS7 } from './content.js';

// 영사창에서 내려다본 7열 (금요일 필름 한 장면). i: 장면 번호, t: 시간(깜빡임)
export function drawFootage(c, i, t = 0) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const f = FOOTAGE[i];
  ctx.fillStyle = '#0c0a08'; ctx.fillRect(0, 0, w, h);
  // 흑백 필름 톤
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5a5650'); g.addColorStop(1, '#2a2824');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // 내려다본 좌석 줄들 (원근)
  for (let row = 0; row < 5; row++) {
    const y = h * (0.25 + row * 0.16), sc = 0.7 + row * 0.12;
    for (let s = 0; s < 12; s++) {
      const x = w / 2 + (s - 5.5) * w * 0.075 * sc + (s >= 6 ? w * 0.03 * sc : -w * 0.03 * sc);
      ctx.fillStyle = row === 2 ? '#4a4640' : '#3a3732';
      roundRect(ctx, x - w * 0.03 * sc, y - h * 0.05 * sc, w * 0.06 * sc, h * 0.08 * sc, 4); ctx.fill();
    }
  }
  // 7열(가운데 줄) 9번에 앉은 사람
  const sc = 0.7 + 2 * 0.12, y7 = h * (0.25 + 2 * 0.16);
  const seatX = (n) => w / 2 + (n - 1 - 5.5) * w * 0.075 * sc + w * 0.03 * sc;
  if (f.hair >= 0) {
    const x = seatX(9);
    const hair = Math.round(40 + f.hair * 160);
    ctx.fillStyle = `rgb(${hair},${hair},${hair - 6})`;
    ctx.beginPath(); ctx.ellipse(x, y7 - h * 0.08, w * 0.022, h * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1e1c1a'; ctx.fillRect(x - w * 0.028, y7 - h * 0.04, w * 0.056, h * 0.06);
    // 10번은 늘 비어 있음 (테두리만 강조)
    ctx.strokeStyle = 'rgba(230,225,210,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(seatX(10) - w * 0.03 * sc, y7 - h * 0.05 * sc, w * 0.06 * sc, h * 0.08 * sc);
  } else {
    // 마지막 장면: 7열 8번 의자 밑 깡통
    const x = seatX(8);
    ctx.fillStyle = '#c8c0b0'; ctx.beginPath(); ctx.ellipse(x, y7 + h * 0.06, w * 0.03, h * 0.02, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y7 + h * 0.03); ctx.lineTo(x - w * 0.06, y7 - h * 0.12); ctx.stroke();
    ctx.fillStyle = '#f0ece0'; ctx.font = `${h * 0.08}px ${HAND}`; ctx.textAlign = 'center';
    ctx.fillText(f.label, x - w * 0.1, y7 - h * 0.15);
    ctx.font = `${h * 0.05}px ${SERIF}`; ctx.fillText('7열 8번', x, y7 + h * 0.15);
  }
  // 날짜 자막
  if (f.date) {
    ctx.fillStyle = 'rgba(240,236,224,0.92)'; ctx.font = `bold ${h * 0.06}px ${SERIF}`; ctx.textAlign = 'left';
    ctx.fillText(f.date, w * 0.05, h * 0.92);
  }
  // 필름 긁힘과 깜빡임
  const r = rng(Math.floor(t * 12));
  for (let k = 0; k < 6; k++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.12})`; ctx.fillRect(r() * w, 0, 1 + r() * 2, h); }
  ctx.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.1})`; ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.75);
}

export function drawRow7(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#1a1412'; ctx.fillRect(0, 0, w, h);
  [8, 9, 10].forEach((n, i) => {
    const x = w * (0.18 + i * 0.32), y = h * 0.2;
    const worn = n === 9, fresh = n === 10;
    ctx.fillStyle = worn ? '#a03a3a' : fresh ? '#c8343a' : '#7a2a2a';
    roundRect(ctx, x - w * 0.12, y, w * 0.24, h * 0.5, 14); ctx.fill();
    if (worn) { ctx.fillStyle = 'rgba(255,230,220,0.25)'; ctx.beginPath(); ctx.ellipse(x, y + h * 0.3, w * 0.07, h * 0.1, 0, 0, Math.PI * 2); ctx.fill(); }
    if (fresh) { ctx.strokeStyle = 'rgba(230,240,250,0.6)'; ctx.lineWidth = 3; ctx.strokeRect(x - w * 0.115, y + 4, w * 0.23, h * 0.49); }
    ctx.fillStyle = '#c9a55a'; roundRect(ctx, x - w * 0.04, y + h * 0.53, w * 0.08, h * 0.08, 4); ctx.fill();
    ctx.fillStyle = '#2a1a0a'; ctx.font = `bold ${h * 0.055}px ${SERIF}`; ctx.textAlign = 'center';
    ctx.fillText(`${n}`, x, y + h * 0.595);
    ctx.fillStyle = '#d8ccb8'; ctx.font = `${h * 0.05}px ${SERIF}`;
    ctx.fillText(SEATS7[n], x, y + h * 0.75);
  });
  ctx.fillStyle = '#f0e6d0'; ctx.font = `bold ${h * 0.065}px ${SERIF}`; ctx.textAlign = 'left';
  ctx.fillText('7열', w * 0.03, h * 0.1);
  grain(ctx, w, h, 10, 7);
}

export function drawCans(c, labels) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a241e'; ctx.fillRect(0, 0, w, h);
  labels.forEach((l, i) => {
    const y = h * (0.08 + i * 0.18);
    ctx.fillStyle = '#8a8a88'; roundRect(ctx, w * 0.06, y, w * 0.88, h * 0.14, 10); ctx.fill();
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(w * 0.12, y + h * 0.03, w * 0.76, h * 0.08);
    ctx.fillStyle = '#2a2a3a'; ctx.font = `${h * 0.055}px ${HAND}`; ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${l.label}`, w * 0.14, y + h * 0.09);
  });
  grain(ctx, w, h, 10, 9);
}

export function drawStubs(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a2018'; ctx.fillRect(0, 0, w, h);
  ['13:00', '15:00'].forEach((t, i) => {
    ctx.save(); ctx.translate(w * (0.28 + i * 0.44), h * 0.5); ctx.rotate(i ? 0.06 : -0.05);
    ctx.fillStyle = '#e9d9b0'; ctx.fillRect(-w * 0.2, -h * 0.3, w * 0.4, h * 0.6);
    ctx.fillStyle = '#7a1a1a'; ctx.font = `bold ${h * 0.09}px ${SERIF}`; ctx.textAlign = 'center';
    ctx.fillText('중앙극장', 0, -h * 0.15);
    ctx.fillStyle = '#2a2a2a'; ctx.font = `${h * 0.08}px ${SERIF}`;
    ctx.fillText(`8월 19일  ${t}`, 0, 0);
    ctx.fillText('7열 8번', 0, h * 0.13);
    ctx.restore();
  });
  grain(ctx, w, h, 10, 11);
}

// 숨은 컷: 객석의 아이와 할아버지 뒷모습, 스크린 빛
export function drawNegative(c) {
  negativeFrame(c, (ctx, x, y, w, h) => {
    ctx.fillStyle = '#3a2208'; ctx.fillRect(x + w * 0.15, y + h * 0.05, w * 0.7, h * 0.4);
    ctx.fillStyle = '#f2d39a';
    ctx.beginPath(); ctx.ellipse(x + w * 0.4, y + h * 0.66, w * 0.06, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.32, y + h * 0.74, w * 0.16, h * 0.26);
    ctx.beginPath(); ctx.ellipse(x + w * 0.6, y + h * 0.58, w * 0.08, h * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + w * 0.5, y + h * 0.69, w * 0.2, h * 0.31);
  }, ':4');
}
export { makeCanvas };
