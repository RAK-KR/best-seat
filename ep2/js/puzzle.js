// 2편 퍼즐 진행 상태와 행동 정의 (화면과 분리된 순수 로직)
// req: 물리적으로 가능한 조건 / needs: 정답을 알 수 있으려면 먼저 봐야 하는 단서
import { LEDGER, YUN, MUGS, WALL_TEXT, CODES, CHAIR_LEVEL } from './content.js';

export function createState() {
  return {
    inv: [],              // backKey, mugKey, handMirror, envelope
    power: false,         // 간판 스위치 (가게 콘센트 회로)
    warmer: false,        // 수건 온장고
    clothUp: false,       // 정자 자리 덮개
    backOpen: false,      // 뒷방 문
    cabinetOpen: false,   // 컵장
    wardrobeOpen: false,  // 뒷방 장롱
    chair: 1,             // 이발 의자 높이 (1~8)
    seated: false,
    done: false,
    k: {},
  };
}

export const has = (s, i) => s.inv.includes(i);
export const fogged = (s) => s.power && s.warmer;

export function deriveCabinetCode() { return WALL_TEXT.cabinet; }
export function deriveChairLevel() { return YUN.chair; }
export function yunMugIndex() { return MUGS.findIndex((m) => m.notches > 0); }
// 거꾸로 쓴 숫자를 모양 그대로 왼쪽부터 읽으면 나오는 오답
export function naiveMirrorReading(d) { return d.split('').reverse().join(''); }

const flag = (k) => ({ req: () => true, learn: [k] });
// 분위기용 조사 (풀이에 필요 없음). 검증 탐색에서 상태 수를 줄이려고 표시해 둔다
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });

export const ACTIONS = {
  read_card: flag('k_card'),
  look_ledger: flag('k_ledger'),
  look_wallText: flag('k_wallText'),
  look_note: flavor('k_note'),
  look_clock: flavor('k_clock'),
  look_calendar: flavor('k_calendar'),
  look_marks: flavor('k_marks'),

  toggle_power: { req: () => true, apply: (s) => { s.power = !s.power; } },
  toggle_warmer: { req: (s) => s.power, apply: (s) => { s.warmer = !s.warmer; } },
  // 온장고가 데워지면 거울에 김이 서리고 손가락 글씨가 떠오른다
  view_fog: { req: (s) => fogged(s), learn: ['k_fog'] },

  lift_cloth: { req: (s) => !s.clothUp, apply: (s) => { s.clothUp = true; } },
  take_backKey: {
    req: (s) => s.clothUp && !has(s, 'backKey'),
    needs: ['k_fog'],
    apply: (s) => { s.inv.push('backKey'); },
  },
  open_back: { req: (s) => !s.backOpen && has(s, 'backKey'), apply: (s) => { s.backOpen = true; } },
  read_diary: flavor('k_diary', (s) => s.backOpen),
  look_photo: flavor('k_photo', (s) => s.backOpen),

  open_cabinet: {
    req: (s) => !s.cabinetOpen,
    needs: ['k_wallText'],
    code: () => CODES.cabinet,
    apply: (s) => { s.cabinetOpen = true; },
  },
  take_yunMug: {
    req: (s) => s.cabinetOpen && !has(s, 'mugKey'),
    needs: ['k_ledger'],
    apply: (s) => { s.inv.push('mugKey'); },
  },
  open_wardrobe: {
    req: (s) => s.backOpen && !s.wardrobeOpen && has(s, 'mugKey'),
    apply: (s) => { s.wardrobeOpen = true; },
  },
  take_handMirror: {
    req: (s) => s.wardrobeOpen && !has(s, 'handMirror'),
    apply: (s) => { s.inv.push('handMirror'); },
  },
  look_box: flavor('k_box', (s) => s.wardrobeOpen),

  // 의자 높이: 검증에서는 장부의 윤 씨 높이로 맞추는 행동 하나로 본다
  set_chair_yun: {
    req: (s) => !s.seated && s.chair !== CHAIR_LEVEL,
    needs: ['k_ledger'],
    apply: (s) => { s.chair = CHAIR_LEVEL; },
  },
  set_chair_other: {
    req: (s) => !s.seated && s.chair === CHAIR_LEVEL,
    apply: (s) => { s.chair = CHAIR_LEVEL === 1 ? 2 : 1; },
  },
  sit: { req: (s) => !s.seated, apply: (s) => { s.seated = true; } },
  stand: { req: (s) => s.seated, apply: (s) => { s.seated = false; } },

  // 손님 키 높이에 앉아 손거울로 뒤를 비추면 간판 위 봉투가 보인다
  show_back: {
    req: (s) => s.seated && s.chair === CHAIR_LEVEL && has(s, 'handMirror'),
    needs: ['k_card'],
    learn: ['k_envSeen'],
  },
  take_envelope: {
    req: (s) => !s.seated && s.k.k_envSeen && !has(s, 'envelope'),
    apply: (s) => { s.inv.push('envelope'); },
    learn: ['k_letter'],
  },
  leave: { req: (s) => has(s, 'envelope') && !s.done, apply: (s) => { s.done = true; } },
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

export function cloneState(s) { return { ...s, inv: [...s.inv], k: { ...s.k } }; }

export function stateKey(s) {
  return [s.inv.slice().sort().join('+'), s.power, s.warmer, s.clothUp, s.backOpen, s.cabinetOpen,
    s.wardrobeOpen, s.chair, s.seated, s.done, Object.keys(s.k).sort().join(',')].join('|');
}

export { LEDGER };
