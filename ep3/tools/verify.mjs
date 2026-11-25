// 3편 퍼즐 검증: node tools/verify.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verify } from '../../shared/verify-core.mjs';
import { P } from '../js/puzzle.js';
import { CODES, RECIPES, CUPS, recipeCode, SLIPS, YUN_SONG, LP_COUNT } from '../js/content.js';

const yunSlips = SLIPS.filter((s) => s.who === '윤 씨');
verify({
  P,
  root: path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  checks: [
    [CODES.register === recipeCode(CUPS.second), `계산대 번호 = 둘째 잔(${CUPS.second})의 커피·설탕·프림 숟가락 수 ${CODES.register}`],
    [recipeCode(CUPS.yun) !== CODES.register, `윤 씨 블랙(${recipeCode(CUPS.yun)})으로 착각하면 틀림`],
    [new Set(RECIPES.map((r) => recipeCode(r.name))).size === RECIPES.length, '조리법마다 번호가 달라 하나로 정해짐'],
    [yunSlips.length >= 3 && yunSlips.every((s) => s.no === YUN_SONG && s.date === '8.19'), `윤 씨 신청곡은 매번 8.19에 ${YUN_SONG}번`],
    [YUN_SONG <= LP_COUNT, '판 선반에 해당 번호가 있음'],
  ],
  required: {
    read_board: '메모판 읽기', look_recipe: '조리법 카드', look_cup2: '둘째 잔 확인', open_register: '계산대 열기',
    open_kitchen: '주방 열기', take_net: '뜰채 챙기기', search_aquarium: '어항 뒤지기', open_dj: 'DJ박스 열기',
    look_slips: '신청곡 쪽지 확인', play_song: '판 틀기', open_cupboard: '찬장 열기', take_box: '상자 꺼내기',
  },
});
