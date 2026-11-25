// 3편 "커피 두 잔" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { createState, doAction } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, MACHINE, YUN_SONG, INTRO, ENDING, ENDING_LAST } from './content.js';
import { makeCanvas, drawBoard, drawRecipe, drawCup2, drawSlips, drawMenu, drawCandles, drawBox, drawNegative } from './draw.js';
import { drawPortrait } from '../../shared/draw.js';

let playing = 0;      // 판이 도는 남은 시간
const anim = { reg: 0, kd: 0, dj: 0, cup: 0 };

const game = {
  epLabel: '3편',
  epNum: 3,
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST,
  endingImage: () => { const c = makeCanvas(560, 320); drawNegative(c); return c; },
  nextLink: { label: '4편: 두 번째 상영', href: '../ep4/' },
  startPos: { x: -3.4, z: 2.05, yaw: -Math.PI / 2 },
  itemNames: { kitchenKey: '주방 열쇠', net: '뜰채', djKey: 'DJ박스 열쇠', cupKey: '찬장 열쇠', box: '케이크 상자' },
  labels: {
    entrance: '출입문', seat: '창가 자리', cupA: '커피잔', cupB: '머그잔', board: '메모판', recipe: '조리법 카드',
    orders: '전표철', machine: '전화기', register: '금전 등록기', menu: '차림표', kitchenDoor: '주방 문',
    aquarium: '어항', net: '뜰채', djDoor: 'DJ박스 문', slips: '신청곡 쪽지', lpShelf: '판 선반', turntable: '전축',
    clock: '벽시계', photoWall: '사진', window: '창밖', jars: '커피 통', sink: '개수대', fridge: '냉장고',
    candles: '초 상자', apron: '앞치마', cupboard: '찬장',
  },
  buildRoom,
  titleCamera(camera, t) {
    camera.position.set(-1.0 + Math.sin(t * 0.1) * 0.6, 1.5, 1.2);
    camera.rotation.set(-0.08, -0.9 + Math.sin(t * 0.07) * 0.4, 0, 'YXZ');
  },
  hoverFilter(id, ctx) {
    if (id === 'kitchenDoor' && ctx.S.kitchenOpen) return null;
    if (id === 'djDoor' && ctx.S.djOpen) return null;
    if (id === 'net' && ctx.has('net')) return null;
    return id;
  },
  onStart(ctx) { setTimeout(() => ctx.showDoc('parcel'), 400); },

  handlers(ctx) {
    const { S, say, act, has, img, openPanel, showDoc, ui, sfx, sfx2 } = ctx;
    const H = {
      entrance() {
        if (has('box')) { act('leave'); ctx.finish(); return; }
        say('아직 할아버지가 맡긴 걸 못 찾았다.');
      },
      seat() {
        act('look_seat');
        say('창가 자리. 예약 팻말에 "12시 · 두 분". 커피잔 두 개가 마주 놓여 있다. 유리판 밑에 빛바랜 영수증들이 끼워져 있다.', 6000);
      },
      cupA() { say('창 쪽 자리의 잔. 바닥에 검은 커피 자국. 설탕도 프림도 없이 마셨다.'); },
      cupB() {
        act('look_cup2');
        const c = makeCanvas(640, 320); drawCup2(c);
        openPanel({
          title: '맞은편 잔', content: img(c, 520),
          text: '손님용 잔이 아니라 머그잔이다. 바닥에 빨간 매직으로 <b>"순이"</b>.<br>안쪽엔 연한 갈색 자국. 설탕과 프림을 넣은 커피다.',
        });
      },
      board() {
        act('read_board');
        const c = makeCanvas(900, 720); drawBoard(c);
        openPanel({ title: '메모판', content: img(c, 640), wide: true, text: '왼쪽 위 쪽지만 크고 삐뚤빼뚤한 글씨다. 할아버지 글씨.' });
      },
      recipe() {
        act('look_recipe');
        const c = makeCanvas(560, 420); drawRecipe(c);
        openPanel({ title: '조리법 카드', content: img(c, 460), text: '계산대 옆에 세워 둔 카드. 숟가락 수가 적혀 있다.' });
      },
      orders() { act('look_orders'); showDoc('orders'); },
      machine() {
        act('look_machine');
        let i = 0;
        const next = () => {
          if (i >= MACHINE.length) { ui.setText('(삐) 메시지가 더 없습니다.'); return; }
          sfx2.beep();
          ui.setText(MACHINE[i++]);
        };
        openPanel({
          title: '전화기와 자동응답기', text: '빨간 불이 깜빡인다. 남은 메시지 4개.',
          buttons: [{ label: '다음 메시지 듣기', onClick: next }],
        });
      },
      register() {
        if (S.registerOpen) { say('서랍은 비어 있다. 동전 몇 개뿐.'); return; }
        ctx.dial(3, CODES.register, () => {
          if (!act('open_register')) return false;
          setTimeout(() => { sfx.drawer(); sfx.key(); say('딸깍, 서랍이 튀어나왔다. 안에 열쇠 하나. 꼬리표에 "주방".', 5000); }, 200);
          return true;
        }, '금전 등록기', '금전 등록기. 서랍에 세 자리 번호 잠금이 걸려 있다.');
      },
      menu() { act('look_menu'); const c = makeCanvas(600, 520); drawMenu(c); openPanel({ title: '차림표', content: img(c, 420), text: '맨 아래 줄만 가격 대신 "예약".' }); },
      kitchenDoor() {
        if (S.kitchenOpen) return;
        if (has('kitchenKey')) { act('open_kitchen'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('주방 문을 열었다.'); }
        else say('주방 문. 잠겨 있다.');
      },
      aquarium() {
        if (S.djOpen || has('djKey')) { say('물 빠진 빈 어항. 플라스틱 수초만 남았다.'); return; }
        if (!has('net')) { say('물 빠진 어항. 자갈 사이에 뭔가 반짝이는데, 어항이 깊어서 손이 안 닿는다.'); return; }
        act('search_aquarium'); sfx.key();
        ctx.refs.aqKey.visible = false;
        say('뜰채로 자갈을 떴다. 작은 열쇠가 걸려 나왔다. 꼬리표에 "DJ".', 5000);
      },
      net() { if (!has('net')) { act('take_net'); sfx.key(); ctx.refs.net.visible = false; say('어항 청소용 뜰채를 챙겼다.'); } },
      djDoor() {
        if (S.djOpen) return;
        if (has('djKey')) { act('open_dj'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('DJ박스 문을 열었다.'); }
        else say('유리로 된 DJ박스. 문이 잠겨 있다. 안에 전축과 판 선반이 보인다.');
      },
      slips() {
        act('look_slips');
        const c = makeCanvas(900, 600); drawSlips(c);
        openPanel({ title: '신청곡 쪽지', content: img(c, 640), wide: true, text: '손님들이 써 낸 신청곡 쪽지가 수북하다.' });
      },
      lpShelf() {
        const lock = ui.dialLock(2, (v, el) => {
          const n = +v;
          if (n < 1 || n > 24) { sfx.wrong(); ui.shake(el); ui.setText('선반에는 1번부터 24번까지 있다.'); return; }
          if (n === YUN_SONG) {
            ui.close();
            if (!has('cupKey')) act('play_song');
            const len = sfx2.birthday();
            playing = len;
            say('19번 판을 전축에 올렸다. 바늘이 내려가자… 생일 축하 노래가 흘러나왔다.', 6000);
            setTimeout(() => { sfx.key(); say('판 봉투 안쪽에 작은 열쇠가 테이프로 붙어 있었다. 꼬리표에 "찬장".', 6000); }, 6500);
            return;
          }
          sfx.dial();
          ui.setText(`${n}번 판. 봉투 안에는 판뿐이다. 다시 꽂아 두었다.`);
        });
        openPanel({ title: '판 선반', content: lock, text: '판 봉투마다 번호가 붙어 있다. 몇 번을 꺼낼까.<br><span class="keyhelp">숫자 키로 바로 입력 · Enter 꺼내기</span>' });
        ctx.setInput(lock);
      },
      turntable() { say(playing > 0 ? '판이 돌고 있다.' : '낡은 전축. 판은 선반에서 골라 올리면 된다.'); },
      clock() { say('벽시계. 째깍째깍 아직 잘 간다.'); },
      photoWall() {
        const c = makeCanvas(300, 380); drawPortrait(c, 'couple', 41);
        openPanel({ title: '사진', content: img(c, 240), text: '젊은 순이 이모와 이모부. 구석에 "빛나 사진관" 도장.' });
      },
      window() { say('창밖 맞은편에 빛나 사진관, 명수 이발소, 정미소, 극장 간판이 나란히 보인다. 할아버지는 40년 동안 이 자리에서 이 거리를 봤다.', 6500); },
      jars() { say('커피, 설탕, 프림 통. 통마다 숟가락이 꽂혀 있다.'); },
      sink() { say('개수대. 잔 몇 개가 엎어져 말라 있다.'); },
      fridge() { say('냉장고. 비어 있다. 우유 냄새가 희미하게 남았다.'); },
      candles() {
        act('look_candles');
        const c = makeCanvas(500, 360); drawCandles(c);
        openPanel({ title: '초 상자', content: img(c, 400), text: '숫자 초가 가득한데, 전부 "8"이다.' });
      },
      apron() { act('read_diary'); showDoc('diary', '앞치마 주머니에서 나온 작은 수첩. 순이 이모 글씨.'); },
      cupboard() {
        if (!S.cupboardOpen) {
          if (has('cupKey')) { act('open_cupboard'); sfx.unlock(); say('찬장을 열었다. 맨 아래 칸에 케이크 상자가 있다.'); }
          else say('찬장. 작은 자물쇠가 달려 있다.');
          return;
        }
        if (!has('box')) { act('take_box'); sfx.paper(); ctx.refs.cakeBox.visible = false; }
        const c = makeCanvas(500, 360); drawBox(c);
        openPanel({
          title: '케이크 상자', content: img(c, 380),
          text: '빈 케이크 상자. 안에는 "8"자 초 하나, 잘라 낸 필름 한 컷, 접힌 편지.',
          buttons: [
            { label: '필름을 빛에 비춰 본다', onClick: () => { ui.close(); setTimeout(showNegative, 60); } },
            { label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } },
          ],
        });
      },
    };
    function showNegative() {
      const c = makeCanvas(560, 320); drawNegative(c);
      openPanel({
        title: '필름 한 컷', content: img(c, 420),
        text: '케이크 앞의 작은 아이. 초는 "8". 벽시계는 12시 반.<br>가장자리에 마커로 쓴 숫자 "5"가 반쯤 잘려 있다.',
        buttons: [{ label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } }],
      });
    }
    return H;
  },

  hintText(S) {
    const k = S.k, has = (i) => S.inv.includes(i);
    if (!S.registerOpen) {
      if (!k.k_board) return '서쪽 벽 메모판을 보세요. 할아버지 글씨의 쪽지가 있습니다.';
      if (!k.k_cup2) return '"네가 매일 마시던 커피"는 누구의 커피일까요? 창가 자리의 맞은편 잔을 살펴보세요.';
      if (!k.k_recipe) return '계산대 옆 조리법 카드에 커피 종류마다 숟가락 수가 있습니다.';
      return '맞은편 잔은 순이 이모의 둘둘둘. 커피·설탕·프림 숟가락 수를 차례로 넣어 보세요.';
    }
    if (!S.kitchenOpen) return '계산대에서 나온 열쇠로 북쪽의 주방 문을 여세요.';
    if (!has('net') && !has('djKey') && !S.djOpen) return '메모판에 DJ박스 열쇠는 "금붕어 집"에 있다고 했습니다. 어항은 깊어서 도구가 필요합니다. 주방을 둘러보세요.';
    if (!S.djOpen) return has('djKey') ? 'DJ박스 문을 여세요.' : '뜰채로 어항 자갈을 떠 보세요.';
    if (!k.k_slips) return 'DJ박스 안 신청곡 쪽지를 보세요. 할아버지가 신청한 곡이 있습니다.';
    if (!has('cupKey')) return '할아버지는 매년 같은 날 같은 번호를 신청했습니다. 그 판을 선반에서 꺼내 트세요.';
    if (!S.cupboardOpen) return '"찬장" 열쇠는 주방 동쪽 벽 찬장에 맞습니다.';
    if (!has('box')) return '찬장 안 케이크 상자를 꺼내세요.';
    return '이제 다방을 나가면 됩니다.';
  },

  update(ctx, dt, t) {
    const { S, refs } = ctx;
    if (!refs) return;
    const e = (k, target, sp = 4) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.regDrawer.position.z = 0.02 + e('reg', S.registerOpen ? 1 : 0) * 0.22;
    refs.kDoor.rotation.y = e('kd', S.kitchenOpen ? 1 : 0) * 1.6;
    refs.djDoor.rotation.y = -e('dj', S.djOpen ? 1 : 0) * 1.5;
    refs.cupPivot.rotation.y = -e('cup', S.cupboardOpen ? 1 : 0) * 1.7;
    refs.led.material.emissiveIntensity = S.k.k_machine ? 0.3 : (Math.sin(t * 5) > 0 ? 2.5 : 0.1);
    if (playing > 0) { playing -= dt; refs.platter.rotation.y += dt * 3.5; refs.label.rotation.y += dt * 3.5; }
  },
};

run(game);
