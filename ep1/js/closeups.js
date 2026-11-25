// 조사 화면, 액자 사진, 벽에 맺히는 바깥 풍경 등을 캔버스에 그린다
import { CLOCK, BOTTLES, PROCESS, WALL_PAINT, PHOTO_BACK } from './content.js';

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const HAND = '"Nanum Pen Script", "Gaegu", cursive';
const SERIF = '"Nanum Myeongjo", serif';

function grain(ctx, w, h, amt, seed) {
  const r = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function vignette(ctx, w, h, strength = 0.6, color = '0,0,0') {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, `rgba(${color},0)`);
  g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// ───────── 시계 ─────────
export function drawClock(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height, cx = w / 2, cy = h / 2, R = w * 0.42;
  ctx.clearRect(0, 0, w, h);
  // 나무 테두리
  let g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R * 1.1);
  g.addColorStop(0, '#7a5434'); g.addColorStop(1, '#3a2414');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2); ctx.fill();
  // 문자판 (유리 없음, 손때)
  g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  g.addColorStop(0, '#efe4c8'); g.addColorStop(0.8, '#e0d0aa'); g.addColorStop(1, '#bfa77a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.94, 0, Math.PI * 2); ctx.fill();
  const r = rng(5);
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(90,60,30,${r() * 0.08})`;
    ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * R * 1.4, cy + (r() - 0.5) * R * 1.4, r() * R * 0.3, 0, Math.PI * 2); ctx.fill();
  }
  // 문자판 손때: 바늘 주변이 닳아 있음
  ctx.fillStyle = 'rgba(110,80,40,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2); ctx.fill();
  // 숫자 대신 돌기
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const big = i % 3 === 0;
    const rr = big ? R * 0.075 : R * 0.035;
    const x = cx + Math.cos(a) * R * 0.78, y = cy + Math.sin(a) * R * 0.78;
    const bg = ctx.createRadialGradient(x - rr * 0.4, y - rr * 0.4, rr * 0.1, x, y, rr);
    bg.addColorStop(0, '#fff6dc'); bg.addColorStop(0.6, '#b89a64'); bg.addColorStop(1, '#6e5530');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  }
  const hand = (angle, len, width, color) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 6; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(-width / 2, R * 0.08);
    ctx.lineTo(-width * 0.3, -len);
    ctx.lineTo(0, -len - width);
    ctx.lineTo(width * 0.3, -len);
    ctx.lineTo(width / 2, R * 0.08);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  const ha = ((CLOCK.hour % 12) + CLOCK.minute / 60) / 12 * Math.PI * 2;
  const ma = CLOCK.minute / 60 * Math.PI * 2;
  hand(ha, R * 0.45, R * 0.07, '#1e1812');
  hand(ma, R * 0.7, R * 0.045, '#1e1812');
  ctx.fillStyle = '#2a2018';
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.06, 0, Math.PI * 2); ctx.fill();
  grain(ctx, w, h, 10, 9);
}

// ───────── 약품 병 ─────────
export function drawBottles(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#1a0806';
  ctx.fillRect(0, 0, w, h);
  // 붉은 안전등 아래
  const g = ctx.createRadialGradient(w / 2, -h * 0.2, 0, w / 2, 0, h * 1.2);
  g.addColorStop(0, 'rgba(255,60,40,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // 선반
  ctx.fillStyle = '#3a1a12';
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
  const n = BOTTLES.length, slot = w / n;
  BOTTLES.forEach((b, i) => {
    const x = slot * i + slot / 2, bw = slot * 0.52, by = h * 0.34, bh = h * 0.52;
    // 병 몸통
    const bg = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    bg.addColorStop(0, shade(b.color, -40)); bg.addColorStop(0.35, shade(b.color, 20)); bg.addColorStop(1, shade(b.color, -60));
    ctx.fillStyle = bg;
    roundRect(ctx, x - bw / 2, by, bw, bh, bw * 0.18); ctx.fill();
    // 어깨와 목
    ctx.fillStyle = shade(b.color, -20);
    ctx.beginPath();
    ctx.moveTo(x - bw / 2, by + bw * 0.2);
    ctx.quadraticCurveTo(x - bw / 2, by - bw * 0.15, x - bw * 0.18, by - bw * 0.22);
    ctx.lineTo(x + bw * 0.18, by - bw * 0.22);
    ctx.quadraticCurveTo(x + bw / 2, by - bw * 0.15, x + bw / 2, by + bw * 0.2);
    ctx.fill();
    // 반사광
    ctx.fillStyle = 'rgba(255,210,200,0.18)';
    ctx.fillRect(x - bw * 0.32, by + bh * 0.08, bw * 0.08, bh * 0.75);
    // 라벨 (낡은 종이)
    ctx.fillStyle = '#d9c7a4';
    ctx.fillRect(x - bw * 0.42, by + bh * 0.3, bw * 0.84, bh * 0.36);
    ctx.fillStyle = '#2b1d12';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(bw * 0.2)}px ${SERIF}`;
    ctx.fillText(b.name, x, by + bh * 0.45);
    ctx.font = `${Math.round(bw * 0.12)}px ${SERIF}`;
    ctx.fillText(b.sub, x, by + bh * 0.57);
    // 뚜껑 (위에서 본 모습) + 칼로 판 홈
    const cy = by - bw * 0.42, cr = bw * 0.3;
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(x - cr, by - bw * 0.36, cr * 2, bw * 0.2);
    ctx.save();
    ctx.translate(x, cy);
    ctx.scale(1, 0.55);
    ctx.fillStyle = '#3d3d3d';
    ctx.beginPath(); ctx.arc(0, 0, cr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, cr, 0, Math.PI * 2); ctx.stroke();
    for (let k = 0; k < b.notches; k++) {
      const a = -Math.PI / 2 + (k - (b.notches - 1) / 2) * 0.42;
      ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * cr * 0.55, Math.sin(a) * cr * 0.55);
      ctx.lineTo(Math.cos(a) * cr * 1.0, Math.sin(a) * cr * 1.0);
      ctx.stroke();
    }
    ctx.restore();
  });
  ctx.fillStyle = 'rgba(255,90,70,0.12)';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 12, 21);
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ───────── 공정표 ─────────
export function drawChart(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#d6c49a';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.5, '90,60,20');
  ctx.fillStyle = '#2a1b10';
  ctx.textAlign = 'center';
  ctx.font = `bold ${w * 0.075}px ${SERIF}`;
  ctx.fillText('흑백 필름 현상 순서', w / 2, h * 0.13);
  ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w * 0.12, h * 0.17); ctx.lineTo(w * 0.88, h * 0.17); ctx.stroke();
  PROCESS.forEach((p, i) => {
    const y = h * 0.29 + i * h * 0.17;
    ctx.textAlign = 'left';
    ctx.font = `bold ${w * 0.065}px ${SERIF}`;
    ctx.fillText(`${i + 1}.  ${p.step}`, w * 0.14, y);
    ctx.textAlign = 'right';
    ctx.font = `${w * 0.055}px ${SERIF}`;
    ctx.fillText(p.time, w * 0.86, y);
    if (p.note) {
      ctx.textAlign = 'left';
      ctx.font = `${w * 0.05}px ${HAND}`;
      ctx.fillStyle = '#6a2a1a';
      ctx.fillText(p.note, w * 0.22, y + h * 0.06);
      ctx.fillStyle = '#2a1b10';
    }
    if (i < PROCESS.length - 1) {
      ctx.textAlign = 'center';
      ctx.font = `${w * 0.05}px ${SERIF}`;
      ctx.fillText('↓', w * 0.17, y + h * 0.1);
    }
  });
  grain(ctx, w, h, 16, 33);
}

// ───────── 사진 (암실 건조줄) ─────────
export function drawPhoto(c, back = false) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  if (back) {
    ctx.fillStyle = '#e8e1d2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#3a3a52';
    ctx.font = `${w * 0.07}px ${HAND}`;
    ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(w * 0.1, h * 0.3);
    ctx.rotate(-0.03);
    ctx.fillText(PHOTO_BACK, 0, 0);
    ctx.restore();
    grain(ctx, w, h, 10, 44);
    return;
  }
  // 어둑한 방, 하얀 벽을 바라보는 노인과 아이의 뒷모습
  ctx.fillStyle = '#1b1712';
  ctx.fillRect(0, 0, w, h);
  // 벽 (희미하게 밝은 사각형)
  const wg = ctx.createLinearGradient(0, h * 0.1, 0, h * 0.7);
  wg.addColorStop(0, '#5d564a'); wg.addColorStop(1, '#3e392f');
  ctx.fillStyle = wg;
  ctx.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.62);
  // 벽에 아주 희미한 무언가
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#9a9078';
  ctx.fillRect(w * 0.2, h * 0.38, w * 0.6, h * 0.18);
  ctx.fillRect(w * 0.55, h * 0.12, w * 0.04, h * 0.3);
  ctx.globalAlpha = 1;
  // 바닥
  ctx.fillStyle = '#2a2219';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  // 의자
  ctx.fillStyle = '#120e0a';
  ctx.fillRect(w * 0.34, h * 0.66, w * 0.32, h * 0.05);
  ctx.fillRect(w * 0.36, h * 0.71, w * 0.025, h * 0.2);
  ctx.fillRect(w * 0.615, h * 0.71, w * 0.025, h * 0.2);
  // 노인 뒷모습
  ctx.fillStyle = '#0d0a08';
  ctx.beginPath(); ctx.ellipse(w * 0.44, h * 0.43, w * 0.065, h * 0.085, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.34, h * 0.68); ctx.quadraticCurveTo(w * 0.34, h * 0.5, w * 0.44, h * 0.5);
  ctx.quadraticCurveTo(w * 0.54, h * 0.5, w * 0.54, h * 0.68); ctx.fill();
  // 아이 (무릎 위)
  ctx.beginPath(); ctx.ellipse(w * 0.56, h * 0.52, w * 0.045, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.68); ctx.quadraticCurveTo(w * 0.5, h * 0.57, w * 0.56, h * 0.57);
  ctx.quadraticCurveTo(w * 0.62, h * 0.57, w * 0.62, h * 0.68); ctx.fill();
  // 아이가 벽을 가리키는 팔
  ctx.strokeStyle = '#0d0a08'; ctx.lineWidth = w * 0.018; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w * 0.59, h * 0.6); ctx.lineTo(w * 0.68, h * 0.47); ctx.stroke();
  soften(c, 1.4);
  // 세피아 톤
  ctx.fillStyle = 'rgba(120,80,30,0.25)';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.7);
  grain(ctx, w, h, 26, 45);
  // 흰 테두리
  ctx.strokeStyle = '#e8e1d2'; ctx.lineWidth = w * 0.04;
  ctx.strokeRect(0, 0, w, h);
}

// ───────── 초상 사진 ─────────
const PEOPLE = {
  grandpa: { hair: 'bald', glasses: true, coat: '#2a2420' },
  woman: { hair: 'long', glasses: false, coat: '#3b2c2c' },
  child: { hair: 'short', glasses: false, coat: '#4a3c2a', small: true },
  man: { hair: 'short', glasses: false, coat: '#25262a' },
  couple: { couple: true },
};

export function drawPortrait(c, who, seed = 1) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const bg = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h / 2, w * 0.8);
  bg.addColorStop(0, '#b9a585'); bg.addColorStop(1, '#5e4e38');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const p = PEOPLE[who];
  if (p.couple) {
    figure(ctx, w * 0.36, h, w * 0.85, PEOPLE.man);
    figure(ctx, w * 0.66, h, w * 0.78, PEOPLE.woman);
  } else {
    figure(ctx, w / 2, h, p.small ? w * 0.8 : w, p);
  }
  soften(c, 1.6);
  ctx.fillStyle = 'rgba(110,70,25,0.26)';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.65);
  grain(ctx, w, h, 26, seed * 13);
}

// 오래된 인화지처럼 살짝 흐리게
function soften(c, px) {
  const tmp = makeCanvas(c.width, c.height);
  const t = tmp.getContext('2d');
  t.filter = `blur(${px}px) sepia(0.35) contrast(0.92)`;
  t.drawImage(c, 0, 0);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.drawImage(tmp, 0, 0);
}

function figure(ctx, cx, h, scale, p) {
  const s = scale / 300;
  const headY = h * (p.small ? 0.5 : 0.4);
  // 몸
  ctx.fillStyle = p.coat;
  ctx.beginPath();
  ctx.moveTo(cx - 110 * s, h);
  ctx.quadraticCurveTo(cx - 100 * s, headY + 80 * s, cx, headY + 70 * s);
  ctx.quadraticCurveTo(cx + 100 * s, headY + 80 * s, cx + 110 * s, h);
  ctx.fill();
  // 옷깃
  ctx.fillStyle = '#d8d0c0';
  ctx.beginPath();
  ctx.moveTo(cx - 22 * s, headY + 72 * s); ctx.lineTo(cx, headY + 110 * s); ctx.lineTo(cx + 22 * s, headY + 72 * s);
  ctx.fill();
  // 목
  ctx.fillStyle = '#b58d68';
  ctx.fillRect(cx - 16 * s, headY + 40 * s, 32 * s, 36 * s);
  // 머리카락 (긴 머리는 얼굴 뒤)
  if (p.hair === 'long') {
    ctx.fillStyle = '#1e1610';
    ctx.beginPath(); ctx.ellipse(cx, headY + 10 * s, 58 * s, 85 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
  // 얼굴
  const fg = ctx.createRadialGradient(cx - 12 * s, headY - 10 * s, 5 * s, cx, headY, 60 * s);
  fg.addColorStop(0, '#e0bf98'); fg.addColorStop(1, '#a37b58');
  ctx.fillStyle = fg;
  ctx.beginPath(); ctx.ellipse(cx, headY, 44 * s, 56 * s, 0, 0, Math.PI * 2); ctx.fill();
  // 머리
  ctx.fillStyle = p.hair === 'bald' ? '#cfcac0' : '#1e1610';
  if (p.hair === 'bald') {
    ctx.beginPath(); ctx.ellipse(cx - 40 * s, headY - 10 * s, 10 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 40 * s, headY - 10 * s, 10 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(cx, headY - 34 * s, 46 * s, 28 * s, 0, Math.PI, Math.PI * 2); ctx.fill();
  }
  // 눈
  ctx.fillStyle = '#2a1c12';
  ctx.beginPath(); ctx.ellipse(cx - 16 * s, headY - 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 16 * s, headY - 4 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
  if (p.glasses) {
    ctx.strokeStyle = '#1a120c'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.arc(cx - 17 * s, headY - 4 * s, 13 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 17 * s, headY - 4 * s, 13 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4 * s, headY - 5 * s); ctx.lineTo(cx + 4 * s, headY - 5 * s); ctx.stroke();
  }
  // 입 (살짝 웃음)
  ctx.strokeStyle = '#6a3e2a'; ctx.lineWidth = 2.5 * s;
  ctx.beginPath(); ctx.arc(cx, headY + 22 * s, 12 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
}

// ───────── 바깥 풍경 (건너편 정미소 담벼락) ─────────
// 정상 방향으로 그린다. 벽에 맺힐 때는 호출하는 쪽에서 180도 뒤집는다.
const street = { r: rng(77) };

function paintText(ctx, text, x, y, size, seed, font) {
  const r = rng(seed);
  ctx.save();
  ctx.font = `900 ${size}px ${font}`;
  const total = ctx.measureText(text).width * 1.08;
  let cx = x - total / 2;
  for (const ch of text) {
    const cw = ctx.measureText(ch).width * 1.08;
    const sz = size * (0.86 + r() * 0.3);
    const rot = (r() - 0.5) * 0.22;
    const dy = (r() - 0.5) * size * 0.16;
    ctx.save();
    ctx.translate(cx + cw / 2, y + dy);
    ctx.rotate(rot);
    ctx.font = `900 ${sz}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // 붓 자국: 여러 겹 겹쳐 칠하기
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = `rgba(245,242,230,${0.35 + k * 0.15})`;
      ctx.fillText(ch, (r() - 0.5) * sz * 0.04, (r() - 0.5) * sz * 0.04);
    }
    // 흘러내린 페인트
    if (ch.trim() && r() < 0.5) {
      ctx.fillStyle = 'rgba(240,238,228,0.85)';
      const dx = (r() - 0.5) * sz * 0.4;
      ctx.fillRect(dx, 0, sz * 0.03, sz * (0.12 + r() * 0.25));
    }
    ctx.restore();
    cx += cw;
  }
  ctx.restore();
}

export function drawStreet(ctx, w, h, t) {
  // 하늘 (오후)
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  sky.addColorStop(0, '#8fb2d0'); sky.addColorStop(1, '#e6d9b8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.35);
  // 구름이 천천히 흐름
  for (let i = 0; i < 4; i++) {
    const cx = ((t * 6 + i * 330) % (w + 400)) - 200;
    const cy = h * (0.06 + i * 0.05);
    ctx.fillStyle = 'rgba(255,252,240,0.75)';
    for (let k = 0; k < 5; k++) {
      ctx.beginPath(); ctx.ellipse(cx + k * 34, cy + Math.sin(k) * 8, 50, 18, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 먼 지붕들
  ctx.fillStyle = '#6a6458';
  for (let i = 0; i < 9; i++) {
    const x = i * w / 8 - 40, rw = w / 7;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.35); ctx.lineTo(x + rw * 0.15, h * (0.24 + (i % 3) * 0.02));
    ctx.lineTo(x + rw * 0.85, h * (0.24 + (i % 3) * 0.02)); ctx.lineTo(x + rw, h * 0.35); ctx.fill();
  }
  // 정미소 담벼락 (시멘트 블록)
  const wallTop = h * 0.32, wallBot = h * 0.86;
  const wg = ctx.createLinearGradient(0, wallTop, 0, wallBot);
  wg.addColorStop(0, '#9a958a'); wg.addColorStop(1, '#7c776c');
  ctx.fillStyle = wg;
  ctx.fillRect(0, wallTop, w, wallBot - wallTop);
  ctx.strokeStyle = 'rgba(60,55,48,0.35)'; ctx.lineWidth = 2;
  const bh = (wallBot - wallTop) / 9;
  for (let row = 0; row < 9; row++) {
    const y = wallTop + row * bh;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    for (let x = (row % 2) * 60; x < w; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke();
    }
  }
  // 얼룩
  const r = rng(91);
  for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(50,45,35,${0.05 + r() * 0.1})`;
    ctx.fillRect(r() * w, wallTop, 8 + r() * 30, (wallBot - wallTop) * (0.2 + r() * 0.8));
  }
  // 간판
  ctx.fillStyle = '#3c5a6e';
  ctx.fillRect(w * 0.06, wallTop - h * 0.075, w * 0.26, h * 0.07);
  ctx.fillStyle = '#efe6cf';
  ctx.font = `bold ${h * 0.05}px ${SERIF}`;
  ctx.textAlign = 'center';
  ctx.fillText('새마을 정미소', w * 0.19, wallTop - h * 0.023);
  // 페인트 글씨
  paintText(ctx, WALL_PAINT.line1, w * 0.36, wallTop + h * 0.17, h * 0.13, 3, '"Black Han Sans", "Gothic A1", sans-serif');
  paintText(ctx, WALL_PAINT.line2, w * 0.4, wallTop + h * 0.33, h * 0.11, 8, '"Black Han Sans", "Gothic A1", sans-serif');
  paintText(ctx, WALL_PAINT.digits, w * 0.78, wallTop + h * 0.3, h * 0.24, 12, '"Arial Black", "Gothic A1", sans-serif');
  // 전봇대와 전선
  ctx.fillStyle = '#3a3027';
  ctx.fillRect(w * 0.62, h * 0.02, w * 0.018, h * 0.86);
  ctx.fillRect(w * 0.595, h * 0.07, w * 0.07, h * 0.012);
  ctx.strokeStyle = 'rgba(30,25,20,0.8)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (0.1 + i * 0.02));
    ctx.quadraticCurveTo(w * 0.31, h * (0.16 + i * 0.02), w * 0.6, h * (0.075 + i * 0.002));
    ctx.quadraticCurveTo(w * 0.8, h * (0.13 + i * 0.02), w, h * (0.09 + i * 0.02));
    ctx.stroke();
  }
  // 길
  const rg = ctx.createLinearGradient(0, wallBot, 0, h);
  rg.addColorStop(0, '#5f5a50'); rg.addColorStop(1, '#4a463e');
  ctx.fillStyle = rg;
  ctx.fillRect(0, wallBot, w, h - wallBot);
  // 담 그림자
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, wallBot, w, h * 0.025);
  // 감나무 가지 (바람에 흔들림)
  const sway = Math.sin(t * 0.9) * 6;
  ctx.strokeStyle = '#2e2218'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(w, h * 0.05); ctx.quadraticCurveTo(w * 0.93, h * 0.12 + sway, w * 0.86 + sway, h * 0.2); ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(w * 0.93, h * 0.1 + sway * 0.6); ctx.lineTo(w * 0.9 + sway, h * 0.03); ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const a = i * 1.7;
    const x = w * (0.86 + (i % 5) * 0.03) + sway * (0.5 + (i % 3) * 0.3);
    const y = h * (0.04 + (i % 4) * 0.045) + Math.sin(t * 1.3 + i) * 2;
    ctx.fillStyle = i % 4 === 0 ? '#d9762a' : '#4d6a2e';
    ctx.beginPath(); ctx.ellipse(x, y, i % 4 === 0 ? 9 : 14, i % 4 === 0 ? 9 : 7, a, 0, Math.PI * 2); ctx.fill();
  }
  // 지나가는 사람 (자전거) — 벽에 맺힌 상이 '살아 있다'는 걸 보여 준다
  const period = 26;
  const ph = (t % period) / period;
  if (ph < 0.55) {
    const x = -80 + (w + 160) * (ph / 0.55);
    const y = h * 0.93;
    ctx.fillStyle = '#1d1a16';
    ctx.strokeStyle = '#1d1a16'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x - 26, y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 26, y, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x, y - 22); ctx.lineTo(x + 26, y); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 2, y - 52, 10, 26, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 2, y - 86, 10, 0, Math.PI * 2); ctx.fill();
  }
}

// 핀홀로 맺힌 상: 뒤집고, 흐리게, 따뜻하게
export function drawProjection(target, src, t) {
  const sctx = src.getContext('2d');
  drawStreet(sctx, src.width, src.height, t);
  const ctx = target.getContext('2d'), w = target.width, h = target.height;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.translate(w, h);
  ctx.rotate(Math.PI);
  ctx.filter = 'blur(2px) saturate(0.85)';
  ctx.drawImage(src, 0, 0, w, h);
  ctx.restore();
  ctx.filter = 'none';
  // 가장자리로 갈수록 어두워짐
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// 손글씨 편지 HTML (글씨 크기와 떨림)
export function letterHTML(letter) {
  const r = rng(letter.size * 7);
  const lines = letter.body.map((line) => {
    if (!line) return '<div class="line empty"></div>';
    const chars = [...line].map((ch) => {
      if (ch === ' ') return ' ';
      const rot = (r() - 0.5) * 18 * letter.shake;
      const dy = (r() - 0.5) * 10 * letter.shake;
      const sc = 1 + (r() - 0.5) * 0.4 * letter.shake;
      return `<span style="display:inline-block;transform:translateY(${dy.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sc.toFixed(2)})">${ch}</span>`;
    }).join('');
    const indent = (r() - 0.5) * 30 * letter.shake;
    return `<div class="line" style="margin-left:${indent.toFixed(0)}px">${chars}</div>`;
  }).join('');
  // 화면 높이에 맞춰 글씨 크기를 줄인다 (편지가 잘리지 않게)
  const full = letter.body.filter((l) => l).length, empty = letter.body.length - full;
  const avail = (typeof window !== 'undefined' ? window.innerHeight : 900) * 0.92 - 190;
  const fs = Math.min(letter.size, avail / (full * 1.36 + empty * 0.6 + 1.4));
  return `<div class="paper" style="font-size:${fs.toFixed(1)}px">
    <div class="date">${letter.date}</div>${lines}</div>`;
}
