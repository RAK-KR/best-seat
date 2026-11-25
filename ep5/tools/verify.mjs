// 5편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { CODES, NEGS, ORDERED, SHUFFLED, EDGE, KEY_SACK, SACKS } from '../js/content.js';

verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [EDGE(ORDERED) === '15:40', `시간순으로 놓으면 가장자리가 "${EDGE(ORDERED)}" (1편 시계가 멈춘 3시 40분)`],
    [CODES.safe === '1540', `금고 번호 ${CODES.safe}`],
    [EDGE(SHUFFLED) !== '15:40', `처음 놓인 순서로는 "${EDGE(SHUFFLED)}" (읽히지 않음)`],
    [new Set(NEGS.map((n) => n.time)).size === NEGS.length, '컷마다 시각이 달라 순서가 하나로 정해짐'],
    [KEY_SACK <= SACKS, `사무실 열쇠 포대 ${KEY_SACK}번이 존재`],
  ],
  required: {
    take_millKey: '정미소 열쇠', open_mill: '정미소 열기', toggle_power: '전기 올리기', read_ledger: '작업 장부',
    take_officeKey: '사무실 열쇠', open_office: '사무실 열기', take_neg5: '서랍의 컷', order_negatives: '컷 순서 맞추기', open_safe: '금고 열기',
  },
});
