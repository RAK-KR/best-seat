// 4편 퍼즐 진행
import { makePuzzle } from '../../shared/puzzle-core.js';
import { CODES } from './content.js';

export function createState() {
  return { inv: [], boothOpen: false, power: false, mounted: false, running: false, canOpen: false, done: false, k: {} };
}
const flavor = (k, req = () => true) => ({ req, learn: [k], flavor: true });
const has = (s, i) => s.inv.includes(i);

export const ACTIONS = {
  look_screen: flavor('k_screen'),
  look_seat9: flavor('k_seat9'),
  read_notice: { req: () => true, learn: ['k_notice'] },
  look_row7: { req: () => true, learn: ['k_row7'] },
  take_boothKey: { req: (s) => !has(s, 'boothKey') && !s.boothOpen, needs: ['k_notice', 'k_row7'], apply: (s) => { s.inv.push('boothKey'); } },
  open_booth: { req: (s) => !s.boothOpen && has(s, 'boothKey'), apply: (s) => { s.boothOpen = true; } },
  toggle_power: { req: (s) => s.boothOpen, apply: (s) => { s.power = !s.power; if (!s.power) s.running = false; } },
  read_log: { req: (s) => s.boothOpen, learn: ['k_log'] },
  look_tickets: flavor('k_tickets', (s) => s.boothOpen),
  take_reel: { req: (s) => s.boothOpen && !has(s, 'reel') && !s.mounted, needs: ['k_cans'], apply: (s) => { s.inv.push('reel'); } },
  look_cans: { req: (s) => s.boothOpen, learn: ['k_cans'] },
  mount_reel: { req: (s) => has(s, 'reel') && !s.mounted, apply: (s) => { s.mounted = true; s.inv = s.inv.filter((i) => i !== 'reel'); } },
  run_projector: { req: (s) => s.mounted && s.power && !s.running, apply: (s) => { s.running = true; } },
  stop_projector: { req: (s) => s.running, apply: (s) => { s.running = false; } },
  view_footage: { req: (s) => s.running, learn: ['k_footage'] },
  take_can: { req: (s) => !has(s, 'can'), needs: ['k_footage'], apply: (s) => { s.inv.push('can'); } },
  open_can: { req: (s) => has(s, 'can') && !s.canOpen, needs: ['k_log'], code: () => CODES.can, apply: (s) => { s.canOpen = true; }, learn: ['k_letter'] },
  leave: { req: (s) => s.canOpen && !s.done, apply: (s) => { s.done = true; } },
};

export const P = makePuzzle(ACTIONS, createState);
export const { can, doAction } = P;
