// 퍼즐 검증 스크립트: node tools/verify.mjs
// 1) 정답이 단서 데이터에서 실제로 계산되는지
// 2) 처음부터 탈출까지 풀리는 경로가 있는지
// 3) 어떤 상태에서도 더 이상 못 푸는 막힘 상태가 없는지
// 4) 핵심 단계를 건너뛰고 탈출할 수 있는 허점이 없는지
// 5) 게임 파일에 한자가 섞이지 않았는지

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIONS, createState, doAction, can, cloneState, stateKey,
  deriveCabinetCode, deriveChairLevel, yunMugIndex, naiveMirrorReading,
} from '../js/puzzle.js';
import { CODES, MUGS, LEDGER, YUN, CHAIR_LEVEL } from '../js/content.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`); if (!cond) failed++; };

// 1. 정답 유도
ok(deriveCabinetCode() === CODES.cabinet, `컵장 번호 = 뒷벽 거꾸로 쓴 글씨 ${deriveCabinetCode()}`);
const naive = naiveMirrorReading(CODES.cabinet);
ok(naive !== CODES.cabinet, `거꾸로 쓴 숫자를 왼쪽부터 모양대로 읽으면 ${naive} (정답과 다름)`);
ok(deriveChairLevel() === CHAIR_LEVEL, `의자 높이 = 장부의 윤 씨 칸 ${CHAIR_LEVEL}`);
ok(new Set(LEDGER.map((l) => l.chair)).size === LEDGER.length, '장부의 의자 높이가 손님마다 달라 하나로 정해짐');
ok(MUGS.filter((m) => m.notches > 0).length === 1 && YUN.cup.includes('홈'), `홈 있는 컵은 하나뿐 (선반 ${yunMugIndex() + 1}번째) = 장부의 윤 씨 컵`);
ok(MUGS.filter((m) => !m.label && !m.notches).length >= 1, '이름도 홈도 없는 헷갈리는 컵이 있어 이름 없는 컵을 아무거나 고르면 틀림');

// 2~3. 전체 상태 탐색 (단서를 봐야만 번호를 입력할 수 있는 엄격 모드)
const ids = Object.keys(ACTIONS).filter((id) => !ACTIONS[id].flavor);
function explore(banned = new Set()) {
  const start = createState();
  const seen = new Map([[stateKey(start), start]]);
  const edges = new Map();
  const queue = [start];
  let win = null;
  while (queue.length) {
    const s = queue.shift();
    const key = stateKey(s);
    edges.set(key, []);
    for (const id of ids) {
      if (banned.has(id) || !can(s, id, true)) continue;
      const n = cloneState(s);
      doAction(n, id, true);
      const nk = stateKey(n);
      if (nk === key) continue;
      edges.get(key).push(nk);
      if (!seen.has(nk)) {
        n._path = [...(s._path || []), id];
        seen.set(nk, n);
        queue.push(n);
        if (n.done && !win) win = n;
      }
    }
  }
  return { seen, edges, win };
}

const all = explore();
ok(!!all.win, `탈출 가능 (최단 ${all.win?._path.length}단계, 상태 ${all.seen.size}개 탐색)`);
console.log('      최단 경로: ' + all.win?._path.join(' → '));

// 막힘 검사: 역방향으로 탈출 상태에 닿을 수 있는지
const rev = new Map();
for (const [k, outs] of all.edges) for (const o of outs) {
  if (!rev.has(o)) rev.set(o, []);
  rev.get(o).push(k);
}
const good = new Set();
const q = [...all.seen.values()].filter((s) => s.done).map(stateKey);
q.forEach((k) => good.add(k));
while (q.length) {
  const k = q.shift();
  for (const p of rev.get(k) || []) if (!good.has(p)) { good.add(p); q.push(p); }
}
const stuck = [...all.seen.keys()].filter((k) => !good.has(k));
ok(stuck.length === 0, `막힘 상태 없음 (${stuck.length}개)`);

// 4. 핵심 단계 필수 검사: 하나라도 빼면 탈출이 불가능해야 한다
const required = {
  toggle_power: '간판 켜기',
  toggle_warmer: '온장고 켜기',
  view_fog: '김 서린 거울 글씨 보기',
  take_backKey: '뒷방 열쇠 찾기',
  open_back: '뒷방 열기',
  open_cabinet: '컵장 열기',
  take_yunMug: '윤 씨 컵 꺼내기',
  open_wardrobe: '장롱 열기',
  take_handMirror: '손거울 챙기기',
  set_chair_yun: '의자를 윤 씨 높이로',
  show_back: '손거울로 뒤 비추기',
  take_envelope: '봉투 꺼내기',
};
for (const [id, label] of Object.entries(required)) {
  const r = explore(new Set([id]));
  ok(!r.win, `'${label}' 없이는 탈출 불가`);
}

// 단서 추적표
console.log('\n단서 추적표');
for (const [id, a] of Object.entries(ACTIONS)) {
  if (a.code) console.log(`  ${id.padEnd(14)} 번호 ${a.code()}  ← 필요한 단서: ${a.needs.join(', ')}`);
}

// 5. 한자 검사
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (f === 'node_modules' || f.startsWith('.')) continue;
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(js|mjs|html|css|md)$/.test(f)) files.push(p);
  }
})(root);
const HAN = new RegExp('[' + String.fromCharCode(0x4e00) + '-' + String.fromCharCode(0x9fff) + String.fromCharCode(0x3400) + '-' + String.fromCharCode(0x4dbf) + ']');
const han = files.filter((f) => HAN.test(fs.readFileSync(f, 'utf8')));
ok(han.length === 0, `한자 없음 (${files.length}개 파일 검사)${han.length ? ': ' + han.join(', ') : ''}`);

console.log(failed ? `\n실패 ${failed}건` : '\n모든 검사 통과');
process.exit(failed ? 1 : 0);
