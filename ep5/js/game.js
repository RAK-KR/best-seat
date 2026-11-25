// 5편 "8월 19일" — 상호작용과 진행
import { run } from '../../shared/engine.js';
import { createState, doAction } from './puzzle.js';
import { buildRoom } from './room.js';
import { DOCS, CODES, NEGS, SHUFFLED, ORDERED, EDGE, KEY_SACK, INTRO, ENDING, ENDING_LAST } from './content.js';
import { makeCanvas, drawNeg, drawStrip, drawLastFrame, drawCalendar2008, drawFence, drawSacks } from './draw.js';
import { drawPortrait, letterHTML } from '../../shared/draw.js';

const anim = { side: 0, office: 0, shut: 0, drawer: 0, safe: 0 };
let placed = [];

const game = {
  epLabel: '5편',
  createState, doAction,
  docs: DOCS,
  intro: INTRO, ending: ENDING, endingLast: ENDING_LAST, endingStep: 2.6,
  endingImage: () => { const c = makeCanvas(560, 320); drawLastFrame(c); return c; },
  nextLink: { label: '시리즈 처음으로', href: '../' },
  startPos: { x: 0, z: 7.3, yaw: 0 },
  itemNames: { negatives: '필름 세 컷', millKey: '정미소 열쇠', officeKey: '사무실 열쇠', neg5: '넷째 컷' },
  labels: {
    fence: '담벼락', studio: '길 건너 사진관', mailbox: '우편함', sideDoor: '옆문', shutter: '셔터', breaker: '두꺼비집',
    shutterSwitch: '셔터 단추', ledger: '작업 장부', sacks: '쌀 포대', scale: '저울', machine: '정미기', photo: '사진',
    officeDoor: '사무실 문', drawer: '책상 서랍', lightbox: '라이트박스', phone: '전화기', safe: '금고', calendar: '달력',
  },
  buildRoom,
  showDoc(key, ctx) { if (key === 'letter') { ctx.__readLetter(0); return true; } return false; },
  titleCamera(camera, t) {
    camera.position.set(-1 + Math.sin(t * 0.08) * 1.2, 1.6, 7.3);
    camera.rotation.set(0.0, Math.sin(t * 0.06) * 0.25, 0, 'YXZ');
  },
  hoverFilter(id, ctx) {
    if (id === 'sideDoor' && ctx.S.millOpen && !ctx.S.safeOpen) return null;
    if (id === 'officeDoor' && ctx.S.officeOpen) return null;
    return id;
  },
  onStart(ctx) { setTimeout(() => ctx.say('[E] 살펴보기 · [Tab] 수첩 · [H] 힌트 · 가방에는 필름 세 컷이 있다', 6000), 7000); },

  handlers(ctx) {
    const { S, say, act, has, img, openPanel, showDoc, ui, sfx, sfx2 } = ctx;
    const dark = () => !S.power;
    function lightbox() {
      const render = () => { const c = makeCanvas(1120, 320); drawStrip(c, [0, 1, 2, 3].map((i) => placed[i])); return img(c, 720); };
      const name = (id) => NEGS.find((n) => n.id === id).from;
      const status = () => {
        if (placed.length < 4) return `컷을 시간 순서대로 왼쪽부터 놓아 보자. (${placed.length}/4)`;
        const edge = EDGE(placed);
        if (placed.join() === ORDERED.join()) return `가장자리 글씨가 하나로 이어졌다. <b>${edge}</b>.<br>오후 3시 40분. 사진관 벽시계가 멈춰 있던 그 시각.`;
        return `가장자리 글씨가 "${edge}". 이어지지 않는다. 순서가 틀린 것 같다.`;
      };
      const refresh = () => {
        const body = document.getElementById('panel-body');
        body.innerHTML = ''; body.appendChild(render());
        ui.setText(status());
        if (placed.length === 4 && placed.join() === ORDERED.join() && !S.k.k_order) { act('order_negatives'); sfx.reveal(); }
      };
      openPanel({
        title: '라이트박스', content: render(), wide: true, text: status(),
        buttons: [
          ...SHUFFLED.map((id) => ({
            label: `${name(id)} 컷`, onClick: () => {
              if (placed.includes(id) || placed.length >= 4) return;
              placed.push(id); sfx.paper(); refresh();
            },
          })),
          { label: '다시 놓기', onClick: () => { placed = []; refresh(); } },
        ],
      });
    }
    // 마지막 편지는 길어서 세 장으로 나눠 보여 준다
    function readLetter(p) {
      const d = DOCS.letter, [a, b] = d.pages[p];
      ctx.note('letter'); sfx.paper();
      const last = p === d.pages.length - 1;
      openPanel({
        title: `${d.title} (${p + 1}/${d.pages.length})`, wide: true,
        content: letterHTML({ ...d, body: d.body.slice(a, b) }),
        buttons: [last ? { label: '접는다', onClick: () => ui.close() } : { label: '다음 장', onClick: () => { ui.close(); setTimeout(() => readLetter(p + 1), 60); } }],
        onClose: last ? () => setTimeout(() => say('…이제 정미소를 나가자.', 5000), 400) : null,
      });
    }
    ctx.__readLetter = readLetter;
    function safePanel() {
      const lock = ui.dialLock(4, (v, el) => {
        if (v === CODES.safe || v === '0340') {
          act('open_safe'); sfx.unlock(); sfx.door(); ui.close();
          setTimeout(() => {
            const c = makeCanvas(560, 320); drawLastFrame(c);
            openPanel({
              title: '금고', content: img(c, 420),
              text: '금고가 열렸다. 안에는 마지막 필름 한 컷과, 크고 삐뚤빼뚤한 글씨의 편지.',
              buttons: [{ label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => readLetter(0), 60); } }],
            });
          }, 400);
        } else { sfx.wrong(); ui.shake(el); }
      });
      openPanel({ title: '금고', content: lock, text: '무거운 금고. 다이얼 대신 시계 문자판이 달려 있다. 시와 분 네 자리.<br><span class="keyhelp">숫자 키로 바로 입력 · Enter 당기기</span>' });
      ctx.setInput(lock);
    }
    return {
      fence() {
        act('look_wall');
        const c = makeCanvas(1600, 480); drawFence(c);
        openPanel({ title: '담벼락', content: img(c, 700), wide: true, text: '흰 페인트로 쓴 커다란 글씨. 사진관 2층 벽에 거꾸로 맺혔던 바로 그 글씨다.<br>똑바로 보는 건 처음이다.' });
      },
      studio() { act('look_studio'); say('길 건너 빛나 사진관. 2층 창은 판자로 막혀 있고, 한가운데 작은 놋쇠 마개가 반짝인다. 저 안에서 이 담벼락을 봤었다.', 6500); },
      mailbox() {
        if (has('millKey') || S.millOpen) { say('빈 우편함.'); return; }
        act('take_millKey'); sfx.key(); say('우편함에 열쇠가 있다. <정미소 옆문>.');
      },
      sideDoor() {
        if (S.safeOpen) { act('leave'); ctx.finish(); return; }
        if (S.millOpen) return;
        if (has('millKey')) { act('open_mill'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('옆문을 열었다. 안은 어둡다. 쌀겨 냄새.'); }
        else say('정미소 옆문. 잠겨 있다.');
      },
      shutter() { say(S.shutterUp ? '셔터가 올라가 있다.' : '셔터가 내려져 있다. 녹슨 자국이 길게 흘렀다.'); },
      breaker() {
        act('toggle_power'); sfx.unlock(); if (S.power) sfx2.machine();
        say(S.power ? '두꺼비집을 올렸다. 천장 등이 하나씩 켜진다.' : '두꺼비집을 내렸다.');
      },
      shutterSwitch() {
        if (!S.power) { say('셔터 단추. 눌러도 반응이 없다. 전기가 안 들어온다.'); return; }
        act('toggle_shutter'); sfx2.shutter();
        say(S.shutterUp ? '셔터가 덜컹거리며 올라간다. 오후 햇빛이 쏟아져 들어온다.' : '셔터를 내렸다.');
      },
      ledger() { if (dark()) { say('어두워서 글씨가 안 보인다.'); return; } act('read_ledger'); showDoc('ledger'); },
      sacks() {
        if (dark()) { say('어두워서 포대 번호가 안 보인다.'); return; }
        const c = makeCanvas(900, 420); drawSacks(c);
        const lock = ui.dialLock(2, (v, el) => {
          const n = +v;
          if (n < 1 || n > 24) { sfx.wrong(); ui.shake(el); ui.setText('포대는 1번부터 24번까지다.'); return; }
          if (n === KEY_SACK) {
            if (has('officeKey') || S.officeOpen) { ui.setText('19번 포대. 이제 쌀뿐이다.'); return; }
            act('take_officeKey'); sfx.key(); ui.setText('19번 포대 주둥이를 풀자, 쌀 위에 열쇠 하나. <b>사무실 열쇠</b>를 챙겼다.');
            return;
          }
          sfx.dial(); ui.setText(`${n}번 포대. 쌀뿐이다.`);
        });
        const wrap = document.createElement('div'); wrap.appendChild(img(c, 520)); wrap.appendChild(lock);
        wrap.style.display = 'flex'; wrap.style.flexDirection = 'column'; wrap.style.alignItems = 'center'; wrap.style.gap = '10px';
        openPanel({ title: '쌀 포대', content: wrap, wide: true, text: '번호 붙은 쌀 포대 스물네 개. 몇 번 포대를 열어 볼까.' });
        ctx.setInput(lock);
      },
      scale() { say('쌀 다는 저울. 바늘이 0에 멈춰 있다.'); },
      machine() { say(S.power ? '정미기. 전기가 들어왔지만 쌀은 넣지 않았다.' : '커다란 정미기. 깔때기 속이 비어 있다.'); },
      photo() {
        const c = makeCanvas(300, 380); drawPortrait(c, 'couple', 61);
        openPanel({ title: '사진', content: img(c, 240), text: '정미소 앞에 나란히 선 강 할머니와 할아버지. 구석에 "빛나 사진관" 도장.' });
      },
      officeDoor() {
        if (S.officeOpen) return;
        if (has('officeKey')) { act('open_office'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('사무실 문을 열었다.'); }
        else say('사무실 문. 잠겨 있다.');
      },
      drawer() {
        if (!has('neg5')) { act('take_neg5'); sfx.paper(); }
        const c = makeCanvas(560, 320); drawNeg(c, 'n5');
        openPanel({
          title: '책상 서랍', content: img(c, 420),
          text: '서랍 안에 필름 한 컷과 쪽지. 셔터를 내린 정미소 담 앞. 담 위 시계는 3시 20분.<br>가장자리에 마커로 쓴 숫자 "0"이 반쯤 잘려 있다.',
          buttons: [{ label: '쪽지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('request'), 60); } }],
        });
      },
      lightbox() {
        if (!has('neg5')) { say('라이트박스. 필름을 올려놓고 비춰 보는 판이다.'); return; }
        lightbox();
      },
      phone() { say('검은 전화기. 수화기를 들어 보니 신호음만 길게 울린다.'); },
      safe() { if (S.safeOpen) { say('열린 금고. 비어 있다.'); return; } safePanel(); },
      calendar() {
        const c = makeCanvas(400, 520); drawCalendar2008(c);
        openPanel({ title: '달력', content: img(c, 300), text: '2008년 8월에서 넘기지 않은 달력. 19일에 동그라미, "휴업".' });
      },
    };
  },

  hintText(S) {
    const k = S.k, has = (i) => S.inv.includes(i);
    if (!S.millOpen) return has('millKey') ? '마당 안쪽, 정미소 옆문을 여세요.' : '강 할머니가 열쇠는 우편함에 넣었다고 했습니다. 대문 기둥을 보세요.';
    if (!S.power) return '안이 어둡습니다. 옆문 근처 벽의 두꺼비집을 올리세요.';
    if (!k.k_ledger) return '저울 옆 책상의 작업 장부를 읽어 보세요.';
    if (!S.officeOpen) return has('officeKey') ? '북쪽 벽의 사무실 문을 여세요.' : '장부에 사무실 열쇠는 19번 포대에 둔다고 했습니다.';
    if (!has('neg5')) return '사무실 책상 서랍을 열어 보세요.';
    if (!k.k_order) return '라이트박스에 네 컷을 찍힌 시각 순서대로 놓으세요. 이발소 10시, 다방 12시 반, 극장 1시와 3시, 정미소 3시 20분.';
    if (!S.safeOpen) return '이어진 가장자리 글씨가 금고 번호입니다. 1540.';
    return '옆문으로 나가면 됩니다.';
  },

  update(ctx, dt) {
    const { S, refs } = ctx;
    if (!refs) return;
    const e = (k, target, sp = 4) => { anim[k] += (target - anim[k]) * Math.min(1, dt * sp); return anim[k]; };
    refs.sideDoor.rotation.y = -e('side', S.millOpen ? 1 : 0) * 1.6;
    refs.officeDoor.rotation.y = e('office', S.officeOpen ? 1 : 0) * 1.6;
    refs.shutter.scale.y = Math.max(0.04, 1 - e('shut', S.shutterUp ? 1 : 0, 0.8) * 0.96);
    refs.drawer.position.z = 0.34 + e('drawer', has(S, 'neg5') ? 1 : 0) * 0.25;
    refs.safeDoor.rotation.y = -e('safe', S.safeOpen ? 1 : 0, 2) * 1.7;
    refs.breakerLever.position.y = S.power ? 0.06 : -0.06;
    refs.lamps.forEach(({ bm, l }) => { bm.emissiveIntensity = S.power ? 3 : 0; l.intensity = S.power ? 6 : 0; });
    refs.officeBulb.mat.emissiveIntensity = S.power ? 3 : 0;
    refs.officeBulb.light.intensity = S.power ? 3.5 : 0;
    refs.lbMat.emissiveIntensity = S.power ? 1.6 : 0.15;
  },
};
function has(S, i) { return S.inv.includes(i); }

run(game);
