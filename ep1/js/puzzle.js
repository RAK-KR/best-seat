// 퍼즐 진행 상태와 행동 정의.
// 게임 화면과 무관한 순수 로직이라 검증 스크립트가 그대로 시뮬레이션한다.
// - k_* : 플레이어가 알게 된 정보 (단서를 봤는지)
// - 나머지 : 방의 물리 상태

import { CLOCK, BOTTLES, PROCESS, WALL_PAINT, CODES } from './content.js';

export function createState() {
  return {
    inv: [],              // 'darkroomKey', 'screwdriver'
    drawerOpen: false,
    darkroomOpen: false,
    backdropUp: false,
    fuseboxOpen: false,
    fuseIn: true,         // 퓨즈가 꽂혀 있으면 방에 전기가 들어온다
    capOn: true,          // 창문 판자의 놋쇠 마개
    doorOpen: false,
    k: {},                // 알게 된 단서
  };
}

export const has = (s, item) => s.inv.includes(item);
export const dark = (s) => !s.fuseIn;
export const projecting = (s) => !s.fuseIn && !s.capOn;

// 정답은 반드시 단서 데이터에서 계산되어야 한다 (검증 스크립트가 CODES와 비교)
export function deriveDrawerCode() {
  return `${CLOCK.hour}${String(CLOCK.minute).padStart(2, '0')}`;
}
export function deriveFuseCode() {
  return PROCESS.map((p) => {
    const b = BOTTLES.find((x) => x.name === p.step || x.name === p.step + '액');
    return b ? String(b.notches) : '?';
  }).join('');
}
export function deriveDoorCode() {
  return WALL_PAINT.digits;
}
// 180도 뒤집힌 숫자를 모양 그대로 읽었을 때 나오는 오답
export function naiveInvertedReading(digits) {
  const rot = { 0: '0', 1: '1', 2: '2', 5: '5', 6: '9', 8: '8', 9: '6' };
  return digits.split('').reverse().map((d) => rot[d] ?? '?').join('');
}

// 행동 목록. req: 물리적으로 가능한 조건, needs: 정답을 '알 수 있으려면' 먼저 봐야 하는 단서
// (게임은 req와 입력한 번호만 확인하고, 검증 스크립트는 needs까지 확인한다), apply: 결과
// learn: 이 행동으로 알게 되는 단서
export const ACTIONS = {
  read_l1:        { req: () => true, learn: ['k_l1'] },
  look_clock:     { req: () => true, learn: ['k_clock'] },
  look_portrait:  { req: () => true, learn: ['k_portrait'] },
  look_window:    { req: () => true, learn: ['k_window'] },
  look_rope:      { req: () => true, learn: ['k_rope'] },
  try_switch:     { req: () => true, learn: ['k_switchBroken'] },

  // 서랍: 시계를 봤고, 시계가 번호라는 걸 알아야 한다
  open_drawer: {
    req: (s) => !s.drawerOpen,
    needs: ['k_clock', 'k_l1'],
    code: () => CODES.drawer,
    apply: (s) => { s.drawerOpen = true; s.inv.push('darkroomKey'); },
  },
  read_l2: { req: (s) => s.drawerOpen, learn: ['k_l2'] },

  lift_backdrop: {
    req: (s) => !s.backdropUp,
    apply: (s) => { s.backdropUp = true; },
    learn: ['k_fuseboxSeen'],
  },
  lower_backdrop: {
    req: (s) => s.backdropUp && !s.fuseboxOpen,
    apply: (s) => { s.backdropUp = false; },
  },

  open_darkroom: {
    req: (s) => !s.darkroomOpen && has(s, 'darkroomKey'),
    apply: (s) => { s.darkroomOpen = true; },
  },
  // 암실 안의 것들은 불이 켜져 있어야(안전등) 읽을 수 있다
  read_l3:       { req: (s) => s.darkroomOpen && !dark(s), learn: ['k_l3'] },
  look_chart:    { req: (s) => s.darkroomOpen && !dark(s), learn: ['k_chart'] },
  look_bottles:  { req: (s) => s.darkroomOpen && !dark(s), learn: ['k_bottles'] },
  look_photo:    { req: (s) => s.darkroomOpen && !dark(s), learn: ['k_photo'] },
  take_screwdriver: {
    req: (s) => s.darkroomOpen && !has(s, 'screwdriver'),
    apply: (s) => { s.inv.push('screwdriver'); },
  },

  open_fusebox: {
    req: (s) => s.backdropUp && !s.fuseboxOpen,
    needs: ['k_chart', 'k_bottles'],
    code: () => CODES.fusebox,
    apply: (s) => { s.fuseboxOpen = true; },
  },
  toggle_fuse: {
    // 마개가 닫혀 있으면 퓨즈를 뽑을 수 없다 (깜깜해지면 창문을 못 찾는 문제 방지)
    req: (s) => s.fuseboxOpen && (!s.fuseIn || !s.capOn),
    apply: (s) => { s.fuseIn = !s.fuseIn; },
  },

  toggle_cap: {
    req: (s) => has(s, 'screwdriver'),
    apply: (s) => { s.capOn = !s.capOn; },
  },

  // 어둡고 마개가 열려 있으면 하얀 벽에 바깥 풍경이 맺힌다
  view_projection: { req: (s) => projecting(s), learn: ['k_projection'] },

  open_door: {
    req: (s) => !s.doorOpen,
    needs: ['k_projection'],
    code: () => CODES.door,
    apply: (s) => { s.doorOpen = true; },
  },
};

export function can(s, id, strict = false) {
  const a = ACTIONS[id];
  if (!a || !a.req(s)) return false;
  if (strict && a.needs && !a.needs.every((k) => s.k[k])) return false;
  return true;
}

export function doAction(s, id, strict = false) {
  const a = ACTIONS[id];
  if (!can(s, id, strict)) return false;
  if (a.apply) a.apply(s);
  if (a.learn) a.learn.forEach((k) => { s.k[k] = true; });
  return true;
}

export function cloneState(s) {
  return { ...s, inv: [...s.inv], k: { ...s.k } };
}

export function stateKey(s) {
  const k = Object.keys(s.k).sort().join(',');
  return [s.inv.slice().sort().join('+'), s.drawerOpen, s.darkroomOpen, s.backdropUp,
    s.fuseboxOpen, s.fuseIn, s.capOn, s.doorOpen, k].join('|');
}
