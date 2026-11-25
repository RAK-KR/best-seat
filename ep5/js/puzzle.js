// 5편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';
import { CODES } from './content.js';

export function createState() {
  return { inv: ['negatives'], millOpen: false, power: false, shutterUp: false, officeOpen: false, safeOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);

export const ACTIONS = {
  look_wall: flavor('k_wall'),
  look_studio: flavor('k_studio'),
  take_millKey: { req: (s) => !has(s, 'millKey') && !s.millOpen, apply: (s) => { s.inv.push('millKey'); } },
  open_mill: { req: (s) => !s.millOpen && has(s, 'millKey'), apply: (s) => { s.millOpen = true; } },
  toggle_power: { req: (s) => s.millOpen, apply: (s) => { s.power = !s.power; } },
  toggle_shutter: { req: (s) => s.millOpen && s.power, apply: (s) => { s.shutterUp = !s.shutterUp; }, flavor: true },
  read_ledger: { req: (s) => s.millOpen && s.power, learn: ['k_ledger'] },
  take_officeKey: { req: (s) => s.millOpen && s.power && !has(s, 'officeKey') && !s.officeOpen, needs: ['k_ledger'], apply: (s) => { s.inv.push('officeKey'); } },
  open_office: { req: (s) => !s.officeOpen && has(s, 'officeKey'), apply: (s) => { s.officeOpen = true; } },
  take_neg5: { req: (s) => s.officeOpen && !has(s, 'neg5'), apply: (s) => { s.inv.push('neg5'); }, learn: ['k_request'] },
  look_calendar: flavor('k_calendar', (s) => s.officeOpen),
  order_negatives: { req: (s) => s.officeOpen && has(s, 'neg5'), needs: ['k_request'], learn: ['k_order'] },
  open_safe: { req: (s) => s.officeOpen && !s.safeOpen, needs: ['k_order'], code: () => CODES.safe, apply: (s) => { s.safeOpen = true; }, learn: ['k_letter'] },
  leave: { req: (s) => s.safeOpen && !s.done, apply: (s) => { s.done = true; } },
};

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
