import * as THREE from 'three';
import { buildRoom, SHOP, BACK, MAIN_CHAIR, seatY } from './room.js';
import { Player } from './player.js';
import { ui } from './ui.js';
import { initAudio, sfx } from './audio.js';
import { createState, doAction, has, fogged } from './puzzle.js';
import { DOCS, CODES, CHAIR_LEVEL, MUGS, INTRO, ENDING, ENDING_LAST } from './content.js';
import {
  makeCanvas, drawPortrait, letterHTML, drawNote, drawLedger, drawCalendar, drawWallText, drawFog,
  drawMugs, drawMarks, drawHandMirrorView, drawEnvelope, drawNegative,
} from './closeups.js';

const $ = (id) => document.getElementById(id);

// ───────── 기본 설정 ─────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.03, 40);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

ui.names = { backKey: '뒷방 열쇠', mugKey: '작은 놋쇠 열쇠', handMirror: '손거울', envelope: '하루 봉투' };

const S = createState();
const notes = [];
const seen = {};
let refs, player;
let started = false, ended = false, startTime = 0;
let hovered = null;
let fog = 0;
let activeInput = null;
const anim = { cloth: 0, back: 0, cab: 0, ward: 0, door: 0, lift: seatY(1) };

const say = (t, ms) => ui.toast(t, ms);
const once = (k) => { if (seen[k]) return false; seen[k] = true; return true; };
function act(id) { const ok = doAction(S, id); ui.inventory(S.inv); return ok; }
function note(id) { if (!notes.includes(id)) notes.push(id); }

const LABELS = {
  entrance: '출입문', poleSwitch: '간판 스위치', warmer: '수건 온장고', mainMirror: '거울', card: '쪽지', note: '쪽지',
  mainChair: '이발 의자', coveredChair: '천 씌운 의자', coveredMirror: '덮어 둔 거울', clock: '벽시계', sink: '세면대',
  tools: '도구', cabinet: '컵장', ledger: '장부', calendar: '달력', marks: '문 옆 눈금', priceBoard: '가격표',
  envelope: '봉투', wallText: '벽 글씨', bench: '대기 의자', radio: '라디오', window: '창문', poster: '포스터',
  backDoor: '뒷방 문', diary: '일기장', wifePhoto: '사진', wardrobe: '장롱', tv: '텔레비전', bedding: '이불',
};

// ───────── 조사 창 ─────────
function openPanel(opts) {
  ui.panel({ ...opts, onClose: () => { activeInput = null; opts.onClose && opts.onClose(); resume(); } });
  if (player.locked) ui.cursor.show();
}
function resume() {
  ui.cursor.hide();
  if (!started || ended || document.pointerLockElement) return;
  setTimeout(() => { if (!ui.open) renderer.domElement.requestPointerLock?.(); }, 30);
}
const img = (c, w) => ui.canvasEl(c, w);
function showDoc(key, extra = '') {
  sfx.paper(); note(key);
  openPanel({ title: DOCS[key].title, content: letterHTML(DOCS[key]), text: extra, wide: true });
}
function shopTime() {
  const mins = 14 * 60 + Math.floor((performance.now() - (startTime || performance.now())) / 60000);
  return [Math.floor(mins / 60), mins % 60];
}
function drawClockFace(c) {
  const ctx = c.getContext('2d'), w = c.width, cx = w / 2, R = w * 0.46;
  ctx.clearRect(0, 0, w, w);
  ctx.fillStyle = '#f2ead6'; ctx.beginPath(); ctx.arc(cx, cx, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = w * 0.03; ctx.stroke();
  ctx.fillStyle = '#2a2a2a'; ctx.font = `bold ${w * 0.1}px "Nanum Myeongjo", serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2 - Math.PI / 2; ctx.fillText(i, cx + Math.cos(a) * R * 0.78, cx + Math.sin(a) * R * 0.78); }
  const [hh, mm] = shopTime();
  const hand = (a, len, wd) => { ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = wd; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cx); ctx.lineTo(cx + Math.cos(a - Math.PI / 2) * len, cx + Math.sin(a - Math.PI / 2) * len); ctx.stroke(); };
  hand(((hh % 12) + mm / 60) / 12 * Math.PI * 2, R * 0.5, w * 0.035);
  hand(mm / 60 * Math.PI * 2, R * 0.72, w * 0.022);
}

// ───────── 상호작용 ─────────
const H = {
  card() { act('read_card'); showDoc('card', S.k.k_diary ? '이 커다란 글씨는 명수 할아버지 일기장의 글씨와 다르다.' : '거울 왼쪽 아래에 붙은 쪽지. 크고 삐뚤빼뚤한 글씨.'); },

  note() {
    act('look_note');
    const c = makeCanvas(600, 200); drawNote(c, ['이 사람은 나다'], 9);
    openPanel({
      title: '거울 위 쪽지', content: img(c, 420),
      text: S.k.k_diary ? '윤 씨가 붙이고 갔다고 했다. 자기는 거울을 못 보면서.' : '거울 한가운데 위에 붙은 쪽지. 거울 속 사람이 누군지 잊지 않으려고 붙인 걸까.',
    });
  },

  mainMirror() {
    if (fog > 0.55) {
      if (!S.k.k_fog) fogSeenAt = performance.now() / 1000;
      act('view_fog');
      const c = makeCanvas(768, 512);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#5a6466'; ctx.fillRect(0, 0, 768, 512);
      const f = makeCanvas(768, 512); drawFog(f, 1); ctx.drawImage(f, 0, 0);
      openPanel({ title: '김 서린 거울', content: img(c, 560), text: '김이 서린 거울에 손가락으로 쓴 글씨가 떠올랐다. 크고 삐뚤빼뚤하다.' });
      return;
    }
    say('오래된 이발소 거울. 쪽지가 두 장 붙어 있다. 거울 속 가게가 실제보다 조금 더 밝아 보인다.');
  },

  poleSwitch() {
    act('toggle_power'); sfx.dial(); sfx.unlock();
    say(S.power ? '스위치를 올렸다. 창밖 간판이 빙글빙글 돌기 시작한다. 선반 쪽에서도 딸깍 소리가 났다.' : '스위치를 내렸다. 간판이 멈췄다.');
  },

  window() { say(S.power ? '창밖에서 간판이 돌고 있다.' : '블라인드 사이로 오후 햇빛이 들어온다. 창밖 간판은 멈춰 있다.'); },

  warmer() {
    if (!S.power) { say('수건 온장고. 눌러도 불이 안 들어온다. 전기가 안 오는 것 같다.'); return; }
    act('toggle_warmer'); sfx.dial();
    say(S.warmer ? '온장고를 켰다. 빨간 불이 들어오고, 안에서 수건이 데워지기 시작한다.' : '온장고를 껐다.');
  },

  coveredChair() {
    if (!S.clothUp) {
      act('lift_cloth'); sfx.cloth();
      say('천을 걷었다. 분홍 가죽 의자. 팔걸이에 작은 글씨가 새겨져 있다. "정자 자리".', 5000);
      return;
    }
    openPanel({
      title: '정자 자리', text: '분홍 가죽 이발 의자. 앉는 자리에 방석이 놓여 있다. 오랫동안 아무도 앉지 않은 것 같다.',
      buttons: [{
        label: '방석 밑을 들춰 본다', onClick: () => {
          if (has(S, 'backKey')) { ui.setText('방석 밑에는 이제 아무것도 없다.'); return; }
          act('take_backKey'); sfx.key();
          ui.setText('방석 밑에 열쇠가 하나 있다. 손잡이에 "뒷방"이라고 적힌 테이프. <b>뒷방 열쇠</b>를 챙겼다.');
        },
      }],
    });
  },

  coveredMirror() { say('이 거울만 신문지로 덮여 있다. 2009년 3월 12일 신문. 풀로 단단히 붙여 놨다.', 4500); },

  clock() {
    act('look_clock');
    const c = makeCanvas(400, 400); drawClockFace(c);
    const [hh, mm] = shopTime();
    openPanel({
      title: '벽시계', content: img(c, 300),
      text: `${hh - 12}시 ${mm}분. 들어올 때가 1시 50분이었는데.<br>밑에 쪽지가 붙어 있다. <b>"10분 빠름. 너 늘 늦잖아."</b>`,
    });
  },

  sink() { say('세면대. 물을 틀자 녹물이 조금 나오다 맑아진다.'); },
  tools() { say('선반 위 가위와 빗마다 이름표가 붙어 있다. "가위", "빗". 평생 가위를 잡은 사람에게 가위 이름표라니.', 5000); },

  cabinet() {
    if (!S.cabinetOpen) {
      const lock = ui.dialLock(3, (v, el) => {
        if (v === CODES.cabinet && act('open_cabinet')) { sfx.unlock(); ui.close(); setTimeout(() => H.cabinet(), 400); }
        else { sfx.wrong(); ui.shake(el); }
      });
      openPanel({ title: '컵장', content: lock, text: '유리문 달린 컵장. 손님들 면도 컵이 나란히 있다. 작은 세 자리 자물쇠가 걸려 있다.<br><span class="keyhelp">숫자 키로 바로 입력 · Enter 당기기</span>' });
      activeInput = lock;
      return;
    }
    const c = makeCanvas(800, 360); drawMugs(c);
    const msgs = {
      kim: '파란 줄무늬 컵. 김 씨 컵이다. 굳은 비누뿐이다.',
      park: '"박"이라고 쓰인 컵. 안은 비어 있다.',
      choi: '"최"라고 쓰인 컵. 솔이 하나 꽂혀 있을 뿐이다.',
      blank: '이름도 표시도 없는 새 컵. 한 번도 안 쓴 것 같다.',
    };
    openPanel({
      title: '면도 컵', content: img(c, 600), wide: true, text: '어느 컵을 꺼낼까.',
      buttons: MUGS.map((m, i) => ({
        label: `${i + 1}번`, onClick: () => {
          sfx.dial();
          if (m.id !== 'yun') { ui.setText(msgs[m.id]); return; }
          if (has(S, 'mugKey')) { ui.setText('손잡이에 홈이 파인 컵. 이미 열쇠를 꺼냈다.'); return; }
          act('take_yunMug'); sfx.key();
          ui.setText('이름 대신 손잡이에 홈이 세 개 파인 컵. 손으로 더듬어 알아보라고 판 홈이다.<br>사진관 암실의 약병 뚜껑에도 이런 홈이 있었다.<br>컵 안에 오소리털 솔과 <b>작은 놋쇠 열쇠</b>가 들어 있다.');
        },
      })),
    });
  },

  ledger() {
    act('look_ledger');
    const c = makeCanvas(560, 560); drawLedger(c);
    openPanel({ title: '손님 장부', content: img(c, 440), text: '작고 단정한 글씨. 맨 아래까지 매주 화요일 두 시 윤 씨.' });
  },

  calendar() {
    act('look_calendar');
    const c = makeCanvas(400, 520); drawCalendar(c);
    openPanel({ title: '달력', content: img(c, 300), text: '화요일마다 동그라미. 오늘도 화요일이다.' });
  },

  marks() {
    act('look_marks');
    const c = makeCanvas(256, 768); drawMarks(c);
    openPanel({ title: '문 옆 눈금', content: img(c, 150), text: '동네 아이들 키를 잰 눈금. <b>"하루 8살 — 8.19"</b>. 내 생일이다.<br>여기서 키를 쟀던 기억은 없다.' });
  },

  priceBoard() { say('출입문 바로 위에 걸린 가격표. 너무 높아서 윗면은 보이지 않는다.'); },

  envelope() {
    if (!S.k.k_envSeen) return;
    if (!has(S, 'envelope')) { act('take_envelope'); sfx.paper(); }
    const c = makeCanvas(600, 300); drawEnvelope(c);
    openPanel({
      title: '하루 거', content: img(c, 420),
      text: '까치발을 하고 가격표 위로 손을 뻗었다. 명수 할아버지 글씨의 봉투.<br>안에는 아이 머리카락 한 줌, 잘라 낸 필름 한 컷, 접힌 편지가 들어 있다.',
      buttons: [
        { label: '필름을 빛에 비춰 본다', onClick: () => { ui.close(); setTimeout(showNegative, 60); } },
        { label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } },
      ],
    });
  },

  wallText() {
    act('look_wallText');
    const c = makeCanvas(1024, 400);
    const ctx = c.getContext('2d'); ctx.fillStyle = '#d9d2bd'; ctx.fillRect(0, 0, 1024, 400);
    const t = makeCanvas(1024, 400); drawWallText(t, true); ctx.drawImage(t, 0, 0);
    openPanel({
      title: '벽 글씨', content: img(c, 640), wide: true,
      text: S.k.k_diary ? '거울 보고 일하니까 뒷벽에 거꾸로 써 뒀다고 했다. 거울에 비치면 바로 읽힌다.' : '대기 의자 위 벽에 글씨가 좌우로 뒤집혀 쓰여 있다. 왜 일부러 거꾸로 썼을까.',
    });
  },

  bench() { say('손님 대기 의자. 오래 앉아 닳은 자리가 반들반들하다.'); },
  radio() { sfx.screw(); say('라디오를 켜 봤다. 지지직 소리뿐이다.'); },
  poster() { say('"신사 머리" 포스터. 색이 다 바랬다.'); },

  backDoor() {
    if (S.backOpen) return;
    if (has(S, 'backKey')) { act('open_back'); sfx.unlock(); setTimeout(() => sfx.door(), 200); say('뒷방 열쇠로 문을 열었다.'); }
    else say('뒷방 문. 잠겨 있다.');
  },

  diary() { act('read_diary'); showDoc('diary', '작고 단정한 글씨. 장부의 글씨와 같다.'); },

  wifePhoto() {
    act('look_photo');
    const c = makeCanvas(256, 320); drawPortrait(c, 'woman', 31);
    openPanel({ title: '사진', content: img(c, 220), text: '단정한 할머니 사진. 뒷면에 "정자. 빛나 사진관에서."<br>할아버지 사진관 도장이 찍혀 있다.' });
  },

  wardrobe() {
    if (!S.wardrobeOpen) {
      if (has(S, 'mugKey')) { act('open_wardrobe'); sfx.unlock(); say('작은 놋쇠 열쇠가 장롱 자물쇠에 꼭 맞는다.'); }
      else say('장롱. 작은 열쇠 구멍이 있다. 잠겨 있다.');
      return;
    }
    openPanel({
      title: '장롱', text: '흰 이발 가운이 걸려 있고, 아래에 나무 상자가 있다.',
      buttons: [
        {
          label: '가운 주머니를 뒤진다', onClick: () => {
            if (has(S, 'handMirror')) { ui.setText('주머니는 비어 있다.'); return; }
            act('take_handMirror'); sfx.key();
            ui.setText('주머니에서 둥근 <b>손거울</b>이 나왔다. 손잡이에 쪽지가 감겨 있다. 크고 삐뚤빼뚤한 글씨.<br><b>"뒤는 꼭 보여 줘라. 나는 못 봐도."</b>');
          },
        },
        {
          label: '상자를 연다', onClick: () => {
            act('look_box'); sfx.paper();
            ui.setText('작은 봉투가 가득하다. 봉투마다 아이 이름과 날짜. 동네 아이들 첫 이발 머리카락이다.<br>"하루" 봉투만 없다.');
          },
        },
      ],
    });
  },

  tv() { say('오래된 텔레비전. 화면에 먼지가 앉았다.'); },
  bedding() { say('개어 둔 이불. 한 사람 몫이다.'); },

  mainChair() {
    const panel = () => {
      const lvl = Math.round((anim.liftTarget - seatY(1)) / 0.03) + 1;
      return `빨간 가죽 이발 의자. 발판 페달로 높이를 맞춘다.<br>지금 높이: <b>${lvl}칸</b>`;
    };
    openPanel({
      title: '이발 의자', text: panel(),
      buttons: [
        { label: '페달 밟기 (올리기)', onClick: () => { setChair(S.chair + 1); ui.setText(panel()); } },
        { label: '내리기', onClick: () => { setChair(S.chair - 1); ui.setText(panel()); } },
        { label: '앉기', onClick: () => { ui.close(); sitDown(); } },
      ],
    });
  },

  entrance() {
    if (has(S, 'envelope')) { act('leave'); finish(); return; }
    say('"하루 거 내줘야 돼." 아직 그걸 못 찾았다.');
  },
};

function setChair(lvl) {
  lvl = Math.max(1, Math.min(8, lvl));
  if (lvl === S.chair) return;
  S.chair = lvl;
  anim.liftTarget = seatY(lvl);
  sfx.dial(); sfx.drawer();
}

function sitDown() {
  const eye = new THREE.Vector3(MAIN_CHAIR.x, seatY(S.chair) + 0.68, MAIN_CHAIR.z + 0.05);
  S.seated = true;
  player.sit(eye, 0);
  sfx.sit();
  if (once('sit')) say('의자에 앉았다. 거울 속에 가게가 통째로 비친다. 뒷벽 글씨가 바로 읽힌다.', 5500);
  if (has(S, 'handMirror')) setTimeout(() => say('[Q] 손거울로 뒤 비추기 · [E] 일어나기', 5000), once('sitq') ? 5600 : 0);
}
function standUp() {
  S.seated = false;
  player.stand(MAIN_CHAIR.x + 0.75, MAIN_CHAIR.z + 0.3);
  sfx.sit();
}

function showBack() {
  if (!S.seated || !has(S, 'handMirror')) return;
  sfx.paper();
  if (S.chair < CHAIR_LEVEL) { say('손거울을 들어 뒤를 비췄다. 의자가 낮아서 가격표 판 앞면만 겨우 보인다.'); return; }
  if (S.chair > CHAIR_LEVEL) { say('손거울을 들어 뒤를 비췄다. 의자가 높아서 손거울에 비친 모습이 큰 거울 밖으로 벗어난다.'); return; }
  const first = !S.k.k_envSeen;
  act('show_back');
  const c = makeCanvas(480, 520); drawHandMirrorView(c);
  if (first) sfx.reveal();
  openPanel({
    title: '손거울', content: img(c, 300),
    text: '손거울에 비친 뒤쪽이 큰 거울에 다시 비친다. 윤 씨 자리 높이에서만 보이는 각도.<br>출입문 위 가격표 판 꼭대기에… <b>봉투가 얹혀 있다.</b>',
  });
}

function showNegative() {
  const c = makeCanvas(560, 320); drawNegative(c);
  openPanel({
    title: '필름 한 컷', content: img(c, 420),
    text: '빛에 비춰 보니 이발 의자에 앉은 작은 아이. 벽시계는 10시를 가리킨다.<br>할아버지가 찍은 필름이다. 사진관 암실에 있던 빈 필름 통이 떠올랐다.',
    buttons: [{ label: '편지를 읽는다', onClick: () => { ui.close(); setTimeout(() => showDoc('letter'), 60); } }],
  });
}

function interact(id) { if (id && H[id]) H[id](); }

// ───────── 수첩 / 힌트 ─────────
function notebook() {
  if (!notes.length) { say('아직 수첩에 적힌 게 없다.'); return; }
  const list = document.createElement('div'); list.className = 'notes';
  notes.forEach((n) => {
    const b = document.createElement('button');
    b.textContent = DOCS[n].title;
    b.onclick = (e) => { e.stopPropagation(); ui.close(); setTimeout(() => showDoc(n), 50); };
    list.appendChild(b);
  });
  openPanel({ title: '수첩', content: list, text: '읽은 것들을 다시 볼 수 있다.' });
}

function hintText() {
  const k = S.k;
  if (!k.k_card) return '거울에 붙은 쪽지부터 읽어 보세요. 순서가 적혀 있습니다.';
  if (!S.power) return '쪽지의 1번은 "간판부터 켠다"입니다. 출입문 옆 스위치를 보세요.';
  if (!S.warmer) return '쪽지의 2번은 "수건을 데운다"입니다. 거울 오른쪽 선반의 온장고를 켜 보세요.';
  if (!k.k_fog) return '온장고가 데워지면 김이 올라옵니다. 거울을 잘 보세요.';
  if (!has(S, 'backKey')) return '거울에 떠오른 글씨대로, 천 씌운 의자의 천을 걷고 방석 밑을 보세요.';
  if (!S.backOpen) return '뒷방 문은 가게 동쪽 벽에 있습니다.';
  if (!S.cabinetOpen) return k.k_wallText ? '뒷벽 글씨는 좌우가 뒤집혀 있습니다. 거울에 비춰 보거나, 숫자 순서까지 뒤집어 읽어 보세요.' : '대기 의자 위 벽 글씨를 살펴보세요. 컵장 번호가 있습니다.';
  if (!has(S, 'mugKey')) return k.k_ledger ? '장부에서 윤 씨 컵의 표시를 확인하세요. 이름이 없는 컵이 두 개입니다.' : '출입문 옆 책상의 장부를 보세요. 손님마다 컵 표시가 있습니다.';
  if (!S.wardrobeOpen) return '작은 놋쇠 열쇠는 뒷방 장롱에 맞습니다.';
  if (!has(S, 'handMirror')) return '장롱 안 가운 주머니를 뒤져 보세요.';
  if (!k.k_envSeen) {
    if (S.chair !== CHAIR_LEVEL) return '쪽지 3번: "의자는 손님 키에 맞춘다". 오늘 손님은 윤 씨입니다. 장부를 보세요.';
    return '쪽지 5번: "뒤를 거울로 보여 줘라". 의자에 앉아서 손거울을 써 보세요 (Q).';
  }
  if (!has(S, 'envelope')) return '손거울로 본 곳, 출입문 위 가격표 꼭대기를 살펴보세요.';
  return '이제 가게를 나가면 됩니다.';
}
function hint() {
  openPanel({
    title: '힌트', text: '힌트를 보면 다음 단계가 드러납니다. 볼까요?',
    buttons: [{ label: '보기', onClick: () => ui.setText(hintText()) }, { label: '안 볼래요', onClick: () => ui.close() }],
  });
}

// ───────── 입력 ─────────
const ray = new THREE.Raycaster();
ray.far = 2.6;
const center = new THREE.Vector2(0, 0);
function findId(o) { while (o) { if (o.userData && o.userData.id) return o.userData.id; o = o.parent; } return null; }

function updateHover() {
  if (!player.locked || ui.open) { hovered = null; ui.prompt(''); ui.crosshair(false); return; }
  if (player.sitting) {
    ui.prompt(has(S, 'handMirror') ? '[Q] 손거울로 뒤 비추기 · [E] 일어나기' : '[E] 일어나기');
    ui.crosshair(false); hovered = null; return;
  }
  ray.setFromCamera(center, camera);
  const hits = ray.intersectObjects(scene.children, true);
  let id = null;
  for (const h of hits) {
    if (h.object.isPoints) continue;
    id = findId(h.object);
    if (id === 'envelope' && !S.k.k_envSeen) { id = 'priceBoard'; }
    break;
  }
  if (id === 'backDoor' && S.backOpen) id = null;
  hovered = id;
  ui.prompt(id ? `[E] ${LABELS[id] || ''}` : '');
  ui.crosshair(!!id);
}

function onUse() {
  if (!started || ended) return;
  if (ui.open) { ui.close(); return; }
  if (!player.locked) return;
  if (player.sitting) { standUp(); return; }
  if (hovered) interact(hovered);
}

document.addEventListener('keydown', (e) => {
  if (!started || ended) return;
  if (activeInput && ui.open && /^([0-9]|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key)) { activeInput.press(e.key); e.preventDefault(); return; }
  if (ui.open && !activeInput && e.key === 'Enter') { const b = document.querySelector('#panel-buttons button'); if (b) { b.click(); e.preventDefault(); return; } }
  if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); onUse(); }
  else if (e.code === 'KeyQ' && !ui.open && player.sitting) showBack();
  else if (e.code === 'Escape' && ui.open) ui.close();
  else if (e.code === 'Tab') { e.preventDefault(); if (ui.open) ui.close(); else notebook(); }
  else if (e.code === 'KeyH' && !ui.open) hint();
});
renderer.domElement.addEventListener('mousedown', (e) => {
  if (!started || ended || e.button !== 0) return;
  if (ui.open && player.locked) { ui.cursor.click(); return; }
  if (!player.locked) { if (!ui.open) renderer.domElement.requestPointerLock?.(); return; }
  onUse();
});
document.addEventListener('mousemove', (e) => { if (ui.open && player.locked) ui.cursor.move(e.movementX, e.movementY); });
renderer.domElement.addEventListener('wheel', (e) => { if (ui.open && player.locked) ui.cursor.wheel(e.deltaY); });
$('overlay').addEventListener('mousedown', (e) => { if (e.target.id === 'overlay') ui.close(); });
document.addEventListener('pointerlockerror', () => { if (started && !ended && !ui.open) $('pause').classList.add('show'); });
$('pause').addEventListener('click', () => { renderer.domElement.requestPointerLock?.(); });
document.addEventListener('pointerlockchange', () => {
  player.locked = document.pointerLockElement === renderer.domElement;
  if (!player.locked) ui.cursor.hide();
  $('pause').classList.toggle('show', started && !ended && !player.locked && !ui.open);
});
$('sens').addEventListener('input', (e) => { player.sensitivity = +e.target.value; try { localStorage.setItem('bestseat-sens', e.target.value); } catch (_) {} });

// ───────── 진행 / 엔딩 ─────────
function finish() {
  ended = true;
  document.exitPointerLock?.();
  ui.prompt('');
  sfx.door();
  anim.doorTarget = 1;
  setTimeout(() => ui.fade(true, '#fff8ea', 2400), 700);
  setTimeout(showEnding, 3300);
}

function showEnding() {
  sfx.ending();
  const el = $('ending'), body = $('ending-lines');
  body.innerHTML = '';
  el.classList.add('show');
  ENDING.forEach((t, i) => {
    const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.6 + i * 2.1}s`; body.appendChild(p);
  });
  const neg = makeCanvas(560, 320); drawNegative(neg);
  const pimg = ui.canvasEl(neg, 320); pimg.classList.add('end-photo');
  pimg.style.animationDelay = `${0.6 + ENDING.length * 2.1}s`;
  body.appendChild(pimg);
  const last = document.createElement('p'); last.className = 'last'; last.textContent = ENDING_LAST;
  last.style.animationDelay = `${1.8 + ENDING.length * 2.1}s`; body.appendChild(last);
  const secs = Math.round((performance.now() - startTime) / 1000);
  const meta = document.createElement('p'); meta.className = 'meta';
  meta.innerHTML = `2편 플레이 시간 ${Math.floor(secs / 60)}분 ${secs % 60}초<br><button id="again">처음부터</button> <button id="toEp1">1편으로</button><br><span class="next">3편은 준비 중입니다</span>`;
  meta.style.animationDelay = `${3.6 + ENDING.length * 2.1}s`;
  body.appendChild(meta);
  $('again').onclick = () => location.reload();
  $('toEp1').onclick = () => { location.href = '../'; };
  el.onmousedown = () => body.classList.add('all');
  ui.fade(false, '#fff8ea', 2000);
}

function start() {
  initAudio();
  $('title').classList.remove('show');
  const intro = $('intro');
  intro.classList.add('show');
  const box = $('intro-lines');
  box.innerHTML = '';
  INTRO.forEach((t) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = '0.2s'; box.appendChild(p); });
  const go = () => {
    if (started) return;
    started = true;
    intro.classList.remove('show');
    startTime = performance.now();
    sfx.door();
    renderer.domElement.requestPointerLock?.();
    setTimeout(() => say('[E] 또는 클릭으로 살펴보기 · [Tab] 수첩 · [H] 힌트', 6000), 800);
  };
  $('intro-skip').onclick = go;
  window.__skipIntro = go;
}

// ───────── 매 프레임 상태 반영 ─────────
let clockAcc = 99;
let fogSeenAt = 0;
function update(dt, t) {
  const ease = (cur, target, speed) => cur + (target - cur) * Math.min(1, dt * speed);
  // 간판
  refs.poleMat.emissiveIntensity = ease(refs.poleMat.emissiveIntensity, S.power ? 0.45 : 0, 4);
  if (S.power) refs.poleTex.offset.y -= dt * 0.35;
  refs.switchLever.position.y = S.power ? 0.015 : -0.015;
  refs.warmerLamp.emissiveIntensity = S.power && S.warmer ? 3 : 0;
  // 김 서림
  const target = fogged(S) ? 1 : 0;
  const prev = fog;
  fog += (target - fog) * Math.min(1, dt * (target ? 0.32 : 0.12));
  if (Math.abs(fog - prev) > 0.002 || (fog < 0.01 && prev >= 0.01)) refs.drawFog(fog < 0.01 ? 0 : fog);
  const st = refs.steam;
  st.mat.opacity = ease(st.mat.opacity, fogged(S) ? 0.35 : 0, 2);
  if (st.mat.opacity > 0.01) {
    const p = st.geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const life = (t * 0.25 + st.seeds[i]) % 1;
      p.setXYZ(i, 2.0 + Math.sin(i * 1.7 + t) * 0.12 * life - life * 0.9, 1.3 + life * 1.1, SHOP.z0 + 0.3 + Math.cos(i) * 0.05);
    }
    p.needsUpdate = true;
  }
  if (fog > 0.6 && !S.k.k_fog && started) {
    const d = new THREE.Vector3(); camera.getWorldDirection(d);
    if (d.z < -0.6 && camera.position.z < 1.2) {
      act('view_fog'); sfx.reveal();
      say('온장고에서 올라온 김이 거울에 서렸다. 김 사이로… 손가락으로 쓴 글씨가 떠오른다.', 6000);
      fogSeenAt = t;
    }
  }
  // 다 데워지면 온장고가 저절로 꺼지고 김이 걷힌다
  if (fogSeenAt && S.warmer && t - fogSeenAt > 15) {
    act('toggle_warmer'); sfx.dial();
    say('딸깍. 수건이 다 데워져 온장고가 저절로 꺼졌다. 거울의 김이 천천히 걷힌다.');
    fogSeenAt = 0;
  }
  // 시계 (실제 시간 + 10분 빠름 = 2시부터)
  clockAcc += dt;
  if (clockAcc > 1) { clockAcc = 0; drawClockFace(refs.clockC); refs.clockTex.needsUpdate = true; }
  // 움직이는 것들
  anim.lift = ease(anim.lift, anim.liftTarget, 6);
  refs.mainLift.position.y = anim.lift;
  anim.cloth = ease(anim.cloth, S.clothUp ? 1 : 0, 5);
  refs.cloth.visible = anim.cloth < 0.95;
  refs.cloth.scale.y = 1 - anim.cloth * 0.9;
  refs.cloth.position.y = 0.63 - anim.cloth * 0.55;
  refs.clothFold.visible = anim.cloth > 0.95;
  anim.back = ease(anim.back, S.backOpen ? 1 : 0, 4);
  refs.backPivot.rotation.y = -anim.back * 1.6;
  anim.cab = ease(anim.cab, S.cabinetOpen ? 1 : 0, 4);
  refs.cabPivot.rotation.y = anim.cab * 1.5;
  refs.padlock.visible = !S.cabinetOpen;
  anim.ward = ease(anim.ward, S.wardrobeOpen ? 1 : 0, 4);
  refs.wardL.rotation.y = anim.ward * 1.4; refs.wardR.rotation.y = -anim.ward * 1.4;
  anim.door = ease(anim.door, anim.doorTarget || 0, 2);
  refs.door.rotation.y = anim.door * 1.2;
  refs.envelope.visible = !has(S, 'envelope');
}

// ───────── 시작 ─────────
async function boot() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); } catch (_) {}
  const built = buildRoom(scene);
  refs = built.refs;
  refs.backOpenFn = () => S.backOpen;
  anim.liftTarget = seatY(1);
  player = new Player(camera);
  player.areas = built.areas;
  player.colliders = built.colliders;
  player.onStep = () => sfx.step();
  try { const s = localStorage.getItem('bestseat-sens'); if (s) { player.sensitivity = +s; $('sens').value = s; } } catch (_) {}
  ui.inventory(S.inv);
  refs.drawFog(0);
  $('loading').classList.remove('show');
  $('title').classList.add('show');
  $('start').onclick = start;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (started) { player.frozen = ui.open || ended; player.update(dt); }
    else {
      const t = now / 1000;
      camera.position.set(-1.2 + Math.sin(t * 0.1) * 0.4, 1.55, 1.6);
      camera.rotation.set(-0.05, 0.35 + Math.sin(t * 0.07) * 0.3, 0, 'YXZ');
    }
    update(dt, now / 1000);
    updateHover();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  window.__game = {
    S, H, player, ui, camera, interact, showBack, setChair, sitDown, standUp,
    get hovered() { player.sitT = player.sitting ? 1 : 0; player.update(0); camera.updateMatrixWorld(); updateHover(); return hovered; },
    get fog() { return fog; },
  };
}
boot();
