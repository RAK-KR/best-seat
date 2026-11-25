// 3편 퍼즐 진행 (req: 물리 조건 / needs: 정답을 알려면 봐야 하는 단서)
import { makePuzzle } from '../../shared/puzzle-core.js';
import { CODES } from './content.js';

export function createState() {
  return { inv: [], registerOpen: false, kitchenOpen: false, djOpen: false, cupboardOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);

export const ACTIONS = {
  look_seat: flavor('k_seat'),
  look_machine: flavor('k_machine'),
  look_orders: flavor('k_orders'),
  look_menu: flavor('k_menu'),
  read_board: { req: () => true, learn: ['k_board'] },
  look_recipe: { req: () => true, learn: ['k_recipe'] },
  look_cup2: { req: () => true, learn: ['k_cup2'] },
  open_register: {
    req: (s) => !s.registerOpen, needs: ['k_board', 'k_recipe', 'k_cup2'], code: () => CODES.register,
    apply: (s) => { s.registerOpen = true; s.inv.push('kitchenKey'); },
  },
  open_kitchen: { req: (s) => !s.kitchenOpen && has(s, 'kitchenKey'), apply: (s) => { s.kitchenOpen = true; } },
  read_diary: flavor('k_diary', (s) => s.kitchenOpen),
  look_candles: flavor('k_candles', (s) => s.kitchenOpen),
  take_net: { req: (s) => s.kitchenOpen && !has(s, 'net'), apply: (s) => { s.inv.push('net'); } },
  search_aquarium: { req: (s) => has(s, 'net') && !has(s, 'djKey') && !s.djOpen, needs: ['k_board'], apply: (s) => { s.inv.push('djKey'); } },
  open_dj: { req: (s) => !s.djOpen && has(s, 'djKey'), apply: (s) => { s.djOpen = true; } },
  look_slips: { req: (s) => s.djOpen, learn: ['k_slips'] },
  play_song: { req: (s) => s.djOpen && !has(s, 'cupKey'), needs: ['k_slips'], apply: (s) => { s.inv.push('cupKey'); }, learn: ['k_song'] },
  open_cupboard: { req: (s) => s.kitchenOpen && !s.cupboardOpen && has(s, 'cupKey'), apply: (s) => { s.cupboardOpen = true; } },
  take_box: { req: (s) => s.cupboardOpen && !has(s, 'box'), apply: (s) => { s.inv.push('box'); }, learn: ['k_letter'] },
  leave: { req: (s) => has(s, 'box') && !s.done, apply: (s) => { s.done = true; } },
};

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction, cloneState, stateKey } = P;
