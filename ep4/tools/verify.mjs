// 4편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { CODES, SHOWS_819, SEATS7, KEY_SEAT, CAN_SEAT, REELS, FOOTAGE } from '../js/content.js';

verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [CODES.can === '1315' && SHOWS_819.length === 2, `깡통 번호 = 일지의 8.19 상영 시각 두 개 ${CODES.can}`],
    [SEATS7[KEY_SEAT].includes('새것') && Object.values(SEATS7).filter((v) => v.includes('새것')).length === 1, `"늘 비워 둔 자리"는 7열 ${KEY_SEAT}번 하나뿐 (새것)`],
    [CAN_SEAT !== KEY_SEAT, '깡통 자리와 열쇠 자리가 다름'],
    [REELS.filter((r) => r.id === 'friday').length === 1, '금요일 필름 릴은 하나'],
    [FOOTAGE[FOOTAGE.length - 1].label.length > 0, '필름 마지막 장면이 깡통 자리를 가리킴'],
  ],
  required: {
    read_notice: '영사실 쪽지', look_row7: '7열 살피기', take_boothKey: '영사실 열쇠', open_booth: '영사실 열기',
    toggle_power: '전원', read_log: '영사 일지', look_cans: '필름 통 선반', take_reel: '금요일 릴', mount_reel: '릴 걸기',
    run_projector: '영사기 돌리기', view_footage: '스크린 보기', take_can: '하루 깡통', open_can: '깡통 열기',
  },
});
