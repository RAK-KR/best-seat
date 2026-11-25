// 조사 화면, 액자 사진, 벽에 맺히는 바깥 풍경 등을 캔버스에 그린다

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
  const cls = letter.hand === 'neat' ? 'paper neat' : 'paper';
  return `<div class="${cls}" style="font-size:${fs.toFixed(1)}px">
    ${letter.date ? `<div class="date">${letter.date}</div>` : ''}${lines}</div>`;
}

// ════════════ 2편 전용 그림 ════════════
import { LEDGER, MUGS, WALL_TEXT, FOG_TEXT, ENVELOPE_LABEL } from './content.js';

// 크고 삐뚤빼뚤한 글씨 (눈이 거의 안 보이는 사람이 쓴 글씨)
function shakyText(ctx, text, x, y, size, seed, color = '#2b2238', align = 'left') {
  const r = rng(seed);
  ctx.save();
  ctx.font = `${size}px ${HAND}`;
  const total = ctx.measureText(text).width * 1.05;
  let cx = align === 'center' ? x - total / 2 : x;
  for (const ch of text) {
    const cw = ctx.measureText(ch).width * 1.05;
    ctx.save();
    ctx.translate(cx + cw / 2, y + (r() - 0.5) * size * 0.18);
    ctx.rotate((r() - 0.5) * 0.3);
    ctx.font = `${size * (0.88 + r() * 0.28)}px ${HAND}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    cx += cw;
  }
  ctx.restore();
}

// 종이 쪽지 (거울·물건에 붙은 것)
export function drawNote(c, lines, seed = 1, size = 0) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#ece3c9';
  ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.25, '120,90,40');
  // 테이프
  ctx.fillStyle = 'rgba(230,220,180,0.75)';
  ctx.fillRect(w * 0.38, -4, w * 0.24, h * 0.09);
  const fs = size || Math.min(h / (lines.length + 1) * 0.92, w / Math.max(...lines.map((l) => l.length)) * 1.6);
  lines.forEach((l, i) => shakyText(ctx, l, w * 0.07, (i + 1) * (h / (lines.length + 0.8)), fs, seed * 7 + i));
  grain(ctx, w, h, 10, seed + 3);
}

// 손님 장부
export function drawLedger(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#efe6cc'; ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.3, '120,90,40');
  ctx.strokeStyle = 'rgba(80,110,160,0.35)'; ctx.lineWidth = 1;
  for (let y = 70; y < h; y += 34) { ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke(); }
  ctx.fillStyle = '#2a2a3a';
  ctx.font = `bold 26px ${SERIF}`;
  ctx.fillText('단골 손님', 30, 44);
  ctx.font = `25px ${HAND}`;
  const cols = [30, 150, 290, 380];
  ['손님', '요일·시간', '의자', '면도 컵'].forEach((t, i) => ctx.fillText(t, cols[i], 96));
  ctx.strokeStyle = '#2a2a3a'; ctx.beginPath(); ctx.moveTo(24, 104); ctx.lineTo(w - 24, 104); ctx.stroke();
  LEDGER.forEach((l, i) => {
    const y = 136 + i * 34;
    ctx.fillText(l.name, cols[0], y);
    ctx.fillText(l.day, cols[1], y);
    ctx.fillText(`${l.chair}칸`, cols[2], y);
    ctx.fillText(l.cup, cols[3], y);
  });
  ctx.font = `bold 24px ${SERIF}`;
  ctx.fillText('예약', 30, 316);
  ctx.font = `25px ${HAND}`;
  const rows = ['10월 21일 화  14:00  윤 씨', '10월 28일 화  14:00  윤 씨', '11월 4일 화  14:00  윤 씨', '11월 11일 화  14:00  윤 씨', '11월 18일 화  14:00  윤 씨', '11월 25일 화  14:00  윤 씨'];
  rows.forEach((t, i) => ctx.fillText(t, 30, 352 + i * 34));
  ctx.fillStyle = 'rgba(160,40,30,0.85)';
  ctx.font = `23px ${HAND}`;
  ctx.fillText('(오늘)', 330, 352 + 5 * 34);
  grain(ctx, w, h, 10, 5);
}

// 달력
export function drawCalendar(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#f3efe4'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b02a22'; ctx.fillRect(0, 0, w, h * 0.16);
  ctx.fillStyle = '#fff'; ctx.font = `bold ${h * 0.09}px ${SERIF}`; ctx.textAlign = 'center';
  ctx.fillText('11월', w / 2, h * 0.115);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const cw = w / 7, top = h * 0.24, rh = (h - top) / 6;
  ctx.font = `${h * 0.045}px ${SERIF}`;
  days.forEach((d, i) => { ctx.fillStyle = i === 0 ? '#b02a22' : '#333'; ctx.fillText(d, cw * i + cw / 2, top - h * 0.02); });
  // 2026년 11월 1일은 일요일
  for (let d = 1; d <= 30; d++) {
    const idx = d - 1, col = idx % 7, row = Math.floor(idx / 7);
    const x = cw * col + cw / 2, y = top + rh * row + rh * 0.55;
    ctx.fillStyle = col === 0 ? '#b02a22' : '#333';
    ctx.fillText(String(d), x, y);
    if (col === 2) {
      ctx.strokeStyle = 'rgba(40,40,140,0.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, y - rh * 0.15, cw * 0.38, rh * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(40,40,140,0.9)'; ctx.font = `${h * 0.032}px ${HAND}`;
      ctx.fillText('2시 윤', x, y + rh * 0.38);
      ctx.font = `${h * 0.045}px ${SERIF}`;
    }
  }
  grain(ctx, w, h, 8, 9);
}

// 뒷벽에 거꾸로 써 둔 글씨 (mirrored=true면 벽에 칠한 그대로, 즉 좌우 반전)
export function drawWallText(c, mirrored = true) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  if (mirrored) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  const r = rng(17);
  WALL_TEXT.lines.forEach((line, i) => {
    const size = i === 0 ? h * 0.22 : h * 0.17;
    ctx.font = `${size}px "Nanum Myeongjo", serif`;
    ctx.textAlign = 'left';
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = `rgba(30,50,90,${0.3 + k * 0.2})`;
      ctx.fillText(line, w * 0.04 + (r() - 0.5) * 2, h * (0.27 + i * 0.32) + (r() - 0.5) * 2);
    }
  });
  ctx.restore();
}

// 김 서린 거울 (strength 0~1). 손가락으로 쓴 자리는 김이 서리지 않는다
export function drawFog(c, strength) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  if (strength <= 0) return;
  const g = ctx.createLinearGradient(0, h, 0, 0);
  g.addColorStop(0, `rgba(235,240,240,${0.92 * strength})`);
  g.addColorStop(1, `rgba(235,240,240,${0.55 * strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = rng(29);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(255,255,255,${0.12 * strength * r()})`;
    ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 10, 0, Math.PI * 2); ctx.fill();
  }
  // 손가락 글씨 (김을 지운다)
  ctx.globalCompositeOperation = 'destination-out';
  ctx.filter = 'blur(2px)';
  FOG_TEXT.forEach((line, i) => shakyText(ctx, line, w * 0.5, h * (0.36 + i * 0.3), h * 0.2, 41 + i, 'rgba(0,0,0,1)', 'center'));
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
}

// 면도 컵 선반
export function drawMugs(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#5a4630'); bg.addColorStop(1, '#3a2c1c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a1f14'; ctx.fillRect(0, h * 0.8, w, h * 0.2);
  const slot = w / MUGS.length;
  MUGS.forEach((m, i) => {
    const x = slot * i + slot / 2, mw = slot * 0.5, my = h * 0.38, mh = h * 0.42;
    // 손잡이
    ctx.strokeStyle = '#e9e4da'; ctx.lineWidth = mw * 0.13;
    ctx.beginPath(); ctx.ellipse(x + mw * 0.55, my + mh * 0.45, mw * 0.22, mh * 0.26, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    if (m.notches) {
      ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 3;
      for (let k = 0; k < m.notches; k++) {
        const a = -0.6 + k * 0.6;
        const px = x + mw * 0.55 + Math.cos(a) * mw * 0.22, py = my + mh * 0.45 + Math.sin(a) * mh * 0.26;
        ctx.beginPath(); ctx.moveTo(px - 5, py); ctx.lineTo(px + 9, py); ctx.stroke();
      }
    }
    // 몸통
    const g = ctx.createLinearGradient(x - mw / 2, 0, x + mw / 2, 0);
    g.addColorStop(0, '#cfc9bd'); g.addColorStop(0.35, '#faf7f0'); g.addColorStop(1, '#b8b2a6');
    ctx.fillStyle = g;
    roundRect(ctx, x - mw / 2, my, mw, mh, mw * 0.1); ctx.fill();
    if (m.stripe) { ctx.fillStyle = '#3d6fa8'; ctx.fillRect(x - mw / 2, my + mh * 0.25, mw, mh * 0.1); ctx.fillRect(x - mw / 2, my + mh * 0.45, mw, mh * 0.1); }
    if (m.label) { ctx.fillStyle = '#2a2a3a'; ctx.font = `bold ${mw * 0.42}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText(m.label, x, my + mh * 0.62); }
    // 거품 자국
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(x, my + 4, mw * 0.45, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8dcc0'; ctx.font = `${h * 0.06}px ${SERIF}`; ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, x, h * 0.93);
  });
  grain(ctx, w, h, 10, 61);
}

// 문틀의 키 재기 눈금
export function drawMarks(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#d8cfb8'; ctx.fillRect(0, 0, w, h);
  vignette(ctx, w, h, 0.25, '90,70,40');
  const marks = [['준호 6살', 0.62], ['민지 7살', 0.5], ['하루 8살 — 8.19', 0.42], ['수빈 9살', 0.3], ['하루 10살', 0.22]];
  marks.forEach(([t, y], i) => {
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * 0.08, h * y); ctx.lineTo(w * 0.42, h * y); ctx.stroke();
    ctx.fillStyle = '#2a2a3a'; ctx.font = `${w * 0.09}px ${HAND}`; ctx.textAlign = 'left';
    ctx.fillText(t, w * 0.46, h * y + w * 0.03);
  });
  grain(ctx, w, h, 10, 71);
}

// 덮어 둔 거울의 신문지
export function drawNewspaper(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#d9d2bf'; ctx.fillRect(0, 0, w, h);
  const r = rng(13);
  ctx.fillStyle = '#3a3630';
  ctx.font = `bold ${h * 0.08}px ${SERIF}`; ctx.fillText('동네 소식', w * 0.05, h * 0.12);
  ctx.font = `${h * 0.035}px ${SERIF}`; ctx.fillText('2009년 3월 12일 목요일', w * 0.6, h * 0.11);
  for (let col = 0; col < 3; col++) for (let i = 0; i < 18; i++) {
    ctx.fillStyle = `rgba(50,45,40,${0.35 + r() * 0.3})`;
    ctx.fillRect(w * (0.05 + col * 0.31), h * (0.2 + i * 0.042), w * (0.26 - r() * 0.05), h * 0.016);
  }
  ctx.fillStyle = 'rgba(60,50,40,0.25)'; ctx.fillRect(w * 0.36, h * 0.2, w * 0.28, h * 0.3);
  ctx.strokeStyle = 'rgba(80,60,30,0.3)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, h * 0.55); ctx.lineTo(w, h * 0.52); ctx.stroke();
  grain(ctx, w, h, 14, 15);
}

// 가격표 판
export function drawPriceBoard(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2f4a3a'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c9b27a'; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#efe4c4'; ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.2}px ${SERIF}`; ctx.fillText('명수 이발소', w / 2, h * 0.3);
  ctx.font = `${h * 0.13}px ${SERIF}`;
  ctx.fillText('이발 8,000   면도 5,000   염색 15,000', w / 2, h * 0.58);
  ctx.fillText('어린이 이발 5,000', w / 2, h * 0.8);
  grain(ctx, w, h, 12, 19);
}

// 손거울로 비춘 뒤쪽 (간판 위 봉투)
export function drawHandMirrorView(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.44, h * 0.46, 0, 0, Math.PI * 2); ctx.clip();
  // 천장과 벽
  ctx.fillStyle = '#d8d0b8'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c8c0a6'; ctx.fillRect(0, 0, w, h * 0.25);
  // 가격표 판 윗면과 봉투
  ctx.fillStyle = '#2f4a3a'; ctx.fillRect(w * 0.12, h * 0.5, w * 0.76, h * 0.4);
  ctx.fillStyle = '#c9b27a'; ctx.fillRect(w * 0.12, h * 0.48, w * 0.76, h * 0.04);
  ctx.save();
  ctx.translate(w * 0.5, h * 0.44); ctx.rotate(-0.06);
  ctx.fillStyle = '#e9dcbc'; ctx.fillRect(-w * 0.2, -h * 0.07, w * 0.4, h * 0.12);
  ctx.strokeStyle = 'rgba(80,60,30,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-w * 0.2, -h * 0.07); ctx.lineTo(0, 0); ctx.lineTo(w * 0.2, -h * 0.07); ctx.stroke();
  ctx.restore();
  vignette(ctx, w, h, 0.5);
  ctx.restore();
  // 테두리
  ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = w * 0.04;
  ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.44, h * 0.46, 0, 0, Math.PI * 2); ctx.stroke();
  grain(ctx, w, h, 10, 23);
}

// 봉투 겉면
export function drawEnvelope(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#e6d8b6'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(100,80,40,0.45)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w / 2, h * 0.5); ctx.lineTo(w, 0); ctx.stroke();
  ctx.fillStyle = '#2a2a3a'; ctx.font = `${h * 0.13}px ${HAND}`; ctx.textAlign = 'center';
  ctx.fillText(ENVELOPE_LABEL, w / 2, h * 0.78);
  grain(ctx, w, h, 10, 27);
}

// 네거티브 필름 한 컷 (빛에 비춘 모습)
export function drawNegative(c) {
  const ctx = c.getContext('2d'), w = c.width, h = c.height;
  ctx.fillStyle = '#2a1f12'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#c87a2a';
  for (let x = 8; x < w; x += 26) { ctx.fillRect(x, 6, 12, 10); ctx.fillRect(x, h - 16, 12, 10); }
  const fx = w * 0.1, fy = h * 0.18, fw = w * 0.8, fh = h * 0.64;
  // 네거티브는 명암이 반대: 밝은 곳이 어둡게
  ctx.fillStyle = '#d9a35a'; ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = '#7a4a1a';
  // 거울과 의자, 아이
  ctx.fillRect(fx + fw * 0.15, fy + fh * 0.08, fw * 0.7, fh * 0.45);
  ctx.fillStyle = '#f0c98a';
  ctx.beginPath(); ctx.ellipse(fx + fw * 0.5, fy + fh * 0.62, fw * 0.1, fh * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(fx + fw * 0.36, fy + fh * 0.72, fw * 0.28, fh * 0.26);
  // 벽시계 (10시)
  const cx = fx + fw * 0.88, cy = fy + fh * 0.2, cr = fh * 0.12;
  ctx.fillStyle = '#5a3410'; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#f2d39a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - cr * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(Math.PI * (2 / 3) * -1 - Math.PI / 2 + Math.PI * 2) * cr * 0.5, cy + Math.sin(-Math.PI / 2 - Math.PI / 3) * cr * 0.5); ctx.stroke();
  grain(ctx, w, h, 18, 31);
}
