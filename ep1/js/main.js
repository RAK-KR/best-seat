import * as THREE from 'three';
import { buildRoom, ROOM } from './room.js';
import { Player } from './player.js';
import { ui } from './ui.js';
import { initAudio, sfx, setPower, setOutside } from './audio.js';
import {
  createState, doAction, can, has, dark, projecting,
} from './puzzle.js';
import { LETTERS, CODES, INTRO, ENDING, ENDING_LAST } from './content.js';
import {
  makeCanvas, drawClock, drawBottles, drawChart, drawPhoto, drawPortrait, drawProjection, letterHTML,
} from './closeups.js';

const $ = (id) => document.getElementById(id);

// ───────── 기본 설정 ─────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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

const S = createState();
const notes = [];          // 수첩에 모인 문서
const seen = {};           // 처음 본 대사 기록
let refs, player;
let started = false, ended = false, startTime = 0;
let hovered = null;
let revealed = false;
const anim = { drawer: 0, darkDoor: 0, fuseDoor: 0, cloth: 0, lever: 0, door: 0 };
const projSrc = makeCanvas(768, 480);

const say = (t, ms) => ui.toast(t, ms);
const once = (key) => { if (seen[key]) return false; seen[key] = true; return true; };
function act(id) {
  const ok = doAction(S, id);
  ui.inventory(S.inv);
  return ok;
}
function note(id) { if (!notes.includes(id)) notes.push(id); }

// 이름표 (조준했을 때 뜨는 글)
const LABELS = {
  letter1: '편지', clock: '벽시계', drawer: '서랍', portraitGrandpa: '사진', portraits: '손님 사진들',
  window: '막힌 창문', camera: '사진기', chair: '의자', whiteWall: '하얀 벽', rope: '줄',
  knotDesk: '매듭', knotDark: '매듭', knotBackdrop: '매듭', switch: '전등 스위치', bulb: '전구', lamp: '스탠드',
  backdrop: '배경천', fusebox: '퓨즈함', darkroomDoor: '암실 문', trays: '현상 접시', bottles: '약품 병',
  chart: '공정표', photo: '사진', canister: '필름 통', letter3: '편지', screwdriver: '드라이버', door: '출입문', keypad: '번호판',
};

// ───────── 조사 화면 공통 ─────────
function openPanel(opts) {
  ui.panel({ ...opts, onClose: () => { activeInput = null; opts.onClose && opts.onClose(); resume(); } });
  if (player.locked) ui.cursor.show();
}
function resume() {
  ui.cursor.hide();
  if (!started || ended || document.pointerLockElement) return;
  setTimeout(() => { if (!ui.open) renderer.domElement.requestPointerLock?.(); }, 30);
}
function img(c, w) { return ui.canvasEl(c, w); }
function tooDark(id) {
  const lightNeeded = ['letter1', 'clock', 'portraitGrandpa', 'portraits', 'photo', 'chart', 'bottles', 'letter3', 'drawer', 'camera', 'trays', 'canister'];
  return dark(S) && lightNeeded.includes(id);
}

function showLetter(key, extra = '') {
  const L = LETTERS[key];
  sfx.paper();
  note(key);
  openPanel({ title: L.title, content: letterHTML(L), text: extra, wide: true });
}

// ───────── 상호작용 ─────────
const H = {
  letter1() { act('read_l1'); showLetter('l1'); },

  clock() {
    act('look_clock');
    const c = makeCanvas(520, 520); drawClock(c);
    openPanel({
      title: '벽시계', content: img(c, 400),
      text: '유리도 숫자도 없다. 숫자 자리마다 작은 돌기만 오돌토돌 튀어나와 있다.<br>바늘은 멈춰 있고, 문자판 가운데가 손때로 닳아 있다.',
    });
  },

  drawer() {
    if (S.drawerOpen) { showLetter('l2', '서랍 속 편지를 다시 읽었다.'); return; }
    const lock = ui.dialLock(3, (v, el) => {
      if (v === CODES.drawer && act('open_drawer')) {
        sfx.unlock(); setTimeout(() => sfx.drawer(), 150);
        anim.drawer = 1;
        refs.drawerKey.visible = false;
        ui.close();
        setTimeout(() => {
          act('read_l2');
          showLetter('l2', '편지 밑에 작은 쇠 열쇠가 있다. <b>암실 열쇠</b>를 챙겼다.');
          sfx.key();
        }, 500);
      } else { sfx.wrong(); ui.shake(el); }
    });
    openPanel({ title: '책상 서랍', content: lock, text: '서랍에 세 자리 다이얼 자물쇠가 달려 있다.<br><span class="keyhelp">숫자 키로 바로 입력 · Enter 당기기</span>' });
    activeInput = lock;
  },

  portraitGrandpa() {
    act('look_portrait');
    const c = makeCanvas(320, 400); drawPortrait(c, 'grandpa', 4);
    const r = makeCanvas(320, 400); const x = r.getContext('2d');
    x.translate(320, 400); x.rotate(Math.PI); x.drawImage(c, 0, 0);
    let t = '손님 사진들 사이에 할아버지 사진이 하나 있다. 이것만 거꾸로 걸려 있다.';
    if (S.k.k_l2) t += '<br>일부러 거꾸로 걸었다고 했다. 거꾸로 보는 연습이라고.';
    openPanel({ title: '할아버지 사진', content: img(r, 280), text: t });
  },

  portraits() {
    const wrap = document.createElement('div');
    wrap.className = 'row';
    ['woman', 'couple', 'child'].forEach((w, i) => { const c = makeCanvas(200, 250); drawPortrait(c, w, i + 3); wrap.appendChild(img(c, 160)); });
    openPanel({ title: '손님 사진들', content: wrap, text: '빛나 사진관 손님들. 모두 같은 배경 앞, 같은 자리에서 찍었다.' });
  },

  window() {
    act('look_window');
    let t, btn = [];
    if (S.capOn) {
      t = '창문을 판자로 막아 두었다. 판자 틈마다 검은 테이프가 빈틈없이 붙어 있다. 빛이 한 줄기도 새지 않게.<br>가운데에 동전만 한 놋쇠 마개가 나사 두 개로 박혀 있다.';
      if (has(S, 'screwdriver')) btn.push({ label: '드라이버로 마개 열기', onClick: () => { toggleCap(); ui.close(); } });
      else t += '<br>손으로는 안 빠진다.';
    } else {
      t = '마개를 떼어 낸 자리에 작은 구멍이 나 있다. 구멍 안에 둥근 유리알이 끼워져 있다.<br>사진기 앞판에서 빠진 바로 그 렌즈다.';
      if (!dark(S)) t += '<br>구멍으로 들어온 빛이 맞은편 하얀 벽에 희미한 얼룩을 만든다. 방이 너무 밝아서 그 이상은 보이지 않는다.';
      btn.push({ label: '마개 다시 닫기', onClick: () => { toggleCap(); ui.close(); } });
    }
    openPanel({ title: '막힌 창문', text: t, buttons: btn });
  },

  camera() {
    let t = '오래된 대형 사진기. 주름 상자는 멀쩡한데 앞판의 렌즈가 빠져 구멍만 남았다.<br>렌즈 없는 사진기를 왜 아직 세워 두었을까.';
    if (!S.capOn) t = '오래된 대형 사진기. 여기서 빠진 렌즈는 창문 구멍에 끼워져 있었다.';
    openPanel({ title: '사진기', text: t });
  },

  chair() {
    if (player.sitting) { standUp(); return; }
    player.sit();
    sfx.sit();
    if (once('chair')) say('의자에 앉았다. 정면에 하얀 벽이 있다. 바닥에는 의자 다리 자국이 깊게 패어 있다. (E: 일어나기)', 6000);
    else if (projecting(S)) say('제일 좋은 자리.', 3000);
    else if (dark(S)) say('깜깜하다. 아무것도 보이지 않는다.');
    else say('하얀 벽뿐이다. (E: 일어나기)');
  },

  whiteWall() {
    if (projecting(S)) { say('하얀 벽에 바깥 거리가 거꾸로 맺혀 있다. 움직이고 있다.', 4500); return; }
    if (dark(S)) { say('깜깜해서 아무것도 보이지 않는다.'); return; }
    say(S.capOn ? '아무것도 걸려 있지 않은 하얀 벽. 방에서 이 벽만 새로 칠했다. 가운데 의자는 이 벽을 보고 있다.'
      : '하얀 벽에 희미한 빛 얼룩이 있다. 방이 밝아서 흐릿하다.', 5000);
  },

  rope() {
    act('look_rope');
    say(dark(S) ? '깜깜한 중에도 줄은 손에 잡힌다. 이걸 따라가면 길을 잃지 않는다.'
      : '벽을 따라 허리 높이로 줄이 매여 있다. 문에서 시작해 방을 한 바퀴 돈다. 손때가 묻어 반들반들하다.', 5000);
  },
  knotDesk() { act('look_rope'); say('줄에 매듭이 지어져 있다. 바로 옆이 책상이다.'); },
  knotDark() { act('look_rope'); say('줄에 매듭이 지어져 있다. 바로 옆이 붉은 문이다.'); },
  knotBackdrop() {
    act('look_rope');
    say(S.backdropUp ? '매듭. 바로 옆이 퓨즈함이다.' : '줄에 매듭이 지어져 있다. 바로 옆에 회색 배경천이 드리워져 있다. 천 뒤 벽에 뭔가 각진 게 붙어 있는 듯하다.', 5000);
  },

  switch() {
    act('try_switch');
    say(dark(S) ? '눌러도 소용없다. 퓨즈를 뽑아 두었다.' : '딸깍, 딸깍. 스위치가 안에서 부서져 있다. 전구는 꺼지지 않는다.');
  },
  bulb() { say(dark(S) ? '전구가 꺼져 있다.' : '천장에 매달린 전구 하나. 이 방에 하나뿐인 불이다.'); },
  lamp() { say('책상 스탠드. 전구가 빠져 있다. 할아버지에게 스탠드는 필요 없었나 보다.'); },

  backdrop() {
    if (!S.backdropUp) {
      act('lift_backdrop'); sfx.cloth(); anim.cloth = 1;
      say('배경천을 말아 올렸다. 뒤 벽에 철제 퓨즈함이 붙어 있다.');
    } else if (!S.fuseboxOpen) {
      act('lower_backdrop'); sfx.cloth(); anim.cloth = 0;
      say('배경천을 다시 내렸다.');
    }
  },

  fusebox() {
    if (!S.backdropUp) return;
    if (!S.fuseboxOpen) {
      const lock = ui.dialLock(4, (v, el) => {
        if (v === CODES.fusebox && act('open_fusebox')) {
          sfx.unlock(); anim.fuseDoor = 1;
          ui.close();
          setTimeout(() => H.fusebox(), 400);
        } else { sfx.wrong(); ui.shake(el); }
      });
      openPanel({
        title: '퓨즈함', content: lock,
        text: '네 자리 다이얼 자물쇠. 다이얼 옆에 손톱으로 긁어 쓴 글씨가 있다.<br><b>"약 쓰는 순서"</b><br><span class="keyhelp">숫자 키로 바로 입력 · Enter 당기기</span>',
      });
      activeInput = lock;
      return;
    }
    const lbl = S.fuseIn ? '주 퓨즈 뽑기' : '주 퓨즈 꽂기';
    const t = S.fuseIn ? '퓨즈함 안에 주 퓨즈와 레버가 있다. 이걸 뽑으면 방 전체의 전기가 끊긴다.<br>문짝 안쪽에 크고 삐뚤빼뚤한 글씨가 있다. <b>"스위치는 내가 망가뜨렸다. 다 보고 나서 꺼라."</b>'
      : '주 퓨즈가 빠져 있다. 손으로 더듬어 자리를 찾을 수 있다.';
    openPanel({ title: '퓨즈함', text: t, buttons: [{ label: lbl, onClick: () => {
      if (S.fuseIn && S.capOn) {
        ui.setText('불을 끄기 전에 할 일이 남은 것 같다.<br><b>창문 가운데 놋쇠 마개가 아직 닫혀 있다.</b> 지금 불을 끄면 아무것도 보이지 않을 것이다.');
        return;
      }
      toggleFuse(); ui.close();
    } }] });
  },

  darkroomDoor() {
    if (S.darkroomOpen) return;
    if (has(S, 'darkroomKey')) {
      act('open_darkroom'); sfx.unlock(); setTimeout(() => sfx.door(), 200);
      anim.darkDoor = 1;
      player.darkroomOpen = true;
      say('암실 열쇠로 문을 열었다. 안쪽에 붉은 안전등이 켜져 있다.');
    } else say('잠겨 있다. 문에 "암실"이라고 적혀 있다.');
  },

  trays() { say('현상 접시 세 개. 약품은 오래전에 말라붙었다.'); },

  canister() {
    openPanel({
      title: '필름 통',
      text: '작은 필름 통. 붙어 있는 종이에 또박또박한 할아버지 글씨가 있다.<br><b>"8. 19 — 현상하지 말 것"</b><br>뚜껑을 열어 보니 안은 비어 있다.',
    });
  },

  bottles() {
    act('look_bottles');
    const c = makeCanvas(760, 480); drawBottles(c);
    openPanel({
      title: '약품 병', content: img(c, 620), wide: true,
      text: '약품 병 네 개. 라벨은 바래서 겨우 읽힌다.<br>뚜껑마다 칼로 판 홈이 있다. 눈으로 보지 않고 손으로 더듬어 구별하려던 것 같다.',
    });
  },

  chart() {
    act('look_chart');
    const c = makeCanvas(420, 546); drawChart(c);
    openPanel({ title: '공정표', content: img(c, 340), text: '벽에 붙은 현상 공정표. 이것만은 또박또박한 글씨다. 오래전에 쓴 것이다.' });
  },

  photo() {
    act('look_photo');
    note('photo');
    const wrap = document.createElement('div'); wrap.className = 'row';
    const a = makeCanvas(480, 360); drawPhoto(a);
    const b = makeCanvas(480, 360); drawPhoto(b, true);
    wrap.append(img(a, 340), img(b, 340));
    openPanel({
      title: '건조줄의 사진', content: wrap, wide: true,
      text: '어두운 방. 의자에 앉은 노인과 무릎 위 아이의 뒷모습. 둘 다 텅 빈 하얀 벽을 보고 있다.<br>아이는 벽을 가리키며 웃는 것 같다.',
    });
  },

  letter3() { act('read_l3'); showLetter('l3', '글씨가 종이 밖으로 넘칠 만큼 크고, 심하게 떨린다.'); },

  screwdriver() {
    if (has(S, 'screwdriver')) return;
    act('take_screwdriver');
    refs.screwdriver.visible = false;
    sfx.key();
    say('일자 드라이버를 챙겼다.');
  },

  door() { say('문이 잠겨 있다. 손잡이 옆에 네 자리 번호판이 붙어 있다.'); },

  keypad() {
    const kp = ui.keypad((v, el) => {
      if (v === CODES.door && act('open_door')) { ui.close(); finish(); }
      else { sfx.wrong(); ui.shake(el); ui.setText('삑. 아니다.'); }
    });
    openPanel({
      title: '번호판', content: kp, text: dark(S) ? '버튼이 희미하게 보인다.' : '네 자리 번호를 눌러야 한다.',
    });
    activeInput = kp;
  },
};
let activeInput = null;   // 키보드로 입력받는 자물쇠·번호판

function interact(id) {
  if (!id || !H[id]) return;
  if (tooDark(id)) {
    say('너무 어두워서 보이지 않는다.');
    return;
  }
  H[id]();
}

function standUp() { player.stand(); sfx.sit(); }

function toggleCap() {
  act('toggle_cap');
  sfx.screw();
  setOutside(!S.capOn);
  if (!S.capOn) say(dark(S) ? '마개를 열었다.' : '나사를 풀고 마개를 떼어 냈다. 구멍으로 바깥 빛이 가늘게 들어온다.', 4500);
  else say('마개를 다시 닫았다.');
}

function toggleFuse() {
  if (S.fuseIn && S.capOn) return;
  act('toggle_fuse');
  sfx.fuse();
  setPower(S.fuseIn);
  anim.lever = S.fuseIn ? 0 : 1;
  if (!S.fuseIn) say(S.capOn ? '퓨즈를 뽑았다. 방이 완전히 깜깜해졌다.' : '퓨즈를 뽑았다. 불이 꺼졌다.', 4000);
  else say('퓨즈를 다시 꽂았다. 불이 들어왔다.');
}

// ───────── 수첩 / 힌트 ─────────
function notebook() {
  if (!notes.length) { say('아직 수첩에 적힌 게 없다.'); return; }
  const list = document.createElement('div');
  list.className = 'notes';
  notes.forEach((n) => {
    const b = document.createElement('button');
    b.textContent = n === 'photo' ? '건조줄의 사진' : `${LETTERS[n].title} (${LETTERS[n].date})`;
    b.onclick = (e) => {
      e.stopPropagation(); ui.close();
      setTimeout(() => (n === 'photo' ? H.photo() : showLetter(n)), 50);
    };
    list.appendChild(b);
  });
  openPanel({ title: '수첩', content: list, text: '읽은 것들을 다시 볼 수 있다.' });
}

function hintText() {
  const k = S.k;
  if (!k.k_l1) return '책상 위를 살펴보세요.';
  if (!S.drawerOpen) return k.k_clock ? '편지 추신에 서랍 번호는 시계한테 맡겼다고 했습니다. 멈춘 시각을 세 자리 숫자로 넣어 보세요.' : '편지 추신을 다시 읽어 보세요. 시계는 책상 위 벽에 있습니다.';
  if (!S.darkroomOpen) return '서랍에서 나온 열쇠는 북쪽 벽의 붉은 문에 맞습니다.';
  if (!S.fuseboxOpen) {
    if (!S.backdropUp) return '편지에 매듭이 있는 곳에는 꼭 뭔가 있다고 했습니다. 회색 배경천 옆에도 매듭이 있습니다.';
    if (!(k.k_chart && k.k_bottles)) return '퓨즈함 옆 글씨는 "약 쓰는 순서"입니다. 암실을 살펴보세요.';
    return '공정표의 순서대로, 각 약품 병뚜껑에 판 홈의 개수를 읽어 보세요. 선반에 놓인 순서가 아닙니다.';
  }
  if (!has(S, 'screwdriver')) return '암실 조리대 위에 공구가 있습니다.';
  if (S.capOn) return '창문 가운데 놋쇠 마개는 드라이버로 열 수 있습니다.';
  if (S.fuseIn) return '할아버지는 "구멍 하나, 어두운 상자 하나"라고 했습니다. 방을 어둡게 만들어야 합니다. 스위치는 고장 났습니다.';
  if (!k.k_projection) return '의자에 앉아 하얀 벽을 보세요.';
  return '렌즈를 지난 상은 위아래와 좌우가 모두 뒤집힙니다. 할아버지 사진이 왜 거꾸로 걸려 있었는지 떠올려 보세요.';
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

function findId(obj) {
  while (obj) { if (obj.userData && obj.userData.id) return obj.userData.id; obj = obj.parent; }
  return null;
}

function updateHover() {
  if (!player.locked || ui.open) { hovered = null; ui.prompt(''); ui.crosshair(false); return; }
  ray.setFromCamera(center, camera);
  const hits = ray.intersectObjects(scene.children, true);
  let id = null;
  for (const h of hits) {
    if (h.object.isPoints) continue;
    id = findId(h.object);
    break;
  }
  if (id === 'fusebox' && !S.backdropUp) id = 'backdrop';
  if (id === 'darkroomDoor' && S.darkroomOpen) id = null;
  if (id === 'screwdriver' && has(S, 'screwdriver')) id = null;
  if (id === 'backdrop' && S.backdropUp && S.fuseboxOpen) id = null;
  hovered = id;
  if (player.sitting) { ui.prompt('[E] 일어나기'); ui.crosshair(false); return; }
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
document.addEventListener('pointerlockerror', () => {
  if (started && !ended && !ui.open) $('pause').classList.add('show');
});
$('pause').addEventListener('click', () => { renderer.domElement.requestPointerLock?.(); });
document.addEventListener('pointerlockchange', () => {
  player.locked = document.pointerLockElement === renderer.domElement;
  if (!player.locked) ui.cursor.hide();   // Esc로 잠금이 풀리면 실제 마우스로 조작
  $('pause').classList.toggle('show', started && !ended && !player.locked && !ui.open);
});
$('sens').addEventListener('input', (e) => { player.sensitivity = +e.target.value; try { localStorage.setItem('bestseat-sens', e.target.value); } catch (_) {} });
  window.addEventListener('bestseat-sens', (e) => { if (player) player.sensitivity = e.detail; });

// ───────── 진행 / 엔딩 ─────────
function finish() {
  ended = true;
  document.exitPointerLock?.();
  ui.prompt('');
  sfx.unlock();
  setTimeout(() => sfx.door(), 300);
  anim.door = 1;
  refs.outside.intensity = 0;
  refs.outsideTarget = 40;
  setTimeout(() => ui.fade(true, '#fff8ea', 2600), 900);
  setTimeout(() => showEnding(), 3800);
}

function showEnding() {
  window.BSP && window.BSP.markCleared(1);
  sfx.ending();
  const el = $('ending');
  const body = $('ending-lines');
  body.innerHTML = '';
  el.classList.add('show');
  const lines = [...ENDING];
  lines.forEach((t, i) => {
    const p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = `${0.6 + i * 2.1}s`;
    body.appendChild(p);
  });
  const ph = makeCanvas(480, 360); drawPhoto(ph);
  const pimg = ui.canvasEl(ph, 300);
  pimg.classList.add('end-photo');
  pimg.style.animationDelay = `${0.6 + lines.length * 2.1}s`;
  body.appendChild(pimg);
  const last = document.createElement('p');
  last.className = 'last';
  last.textContent = ENDING_LAST;
  last.style.animationDelay = `${1.8 + lines.length * 2.1}s`;
  body.appendChild(last);
  const secs = Math.round((performance.now() - startTime) / 1000);
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.innerHTML = `플레이 시간 ${Math.floor(secs / 60)}분 ${secs % 60}초<br><button id="again">처음부터</button> <button id="toEp2">2편: 늘 하던 대로</button> <button id="toHub">목록으로</button>`;
  meta.style.animationDelay = `${3.6 + lines.length * 2.1}s`;
  body.appendChild(meta);
  $('again').onclick = () => location.reload();
  $('toEp2').onclick = () => { location.href = '../ep2/'; };
  $('toHub').onclick = () => { location.href = '../'; };
  el.onmousedown = () => body.classList.add('all');
  ui.fade(false, '#fff8ea', 2000);
}

async function start() {
  initAudio();
  $('title').classList.remove('show');
  const intro = $('intro');
  intro.classList.add('show');
  const box = $('intro-lines');
  box.innerHTML = '';
  INTRO.forEach((t, i) => {
    const p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = '0.2s';
    box.appendChild(p);
  });
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

// ───────── 조명 상태 반영 ─────────
let projOpacity = 0;
function updateLights(dt, t) {
  const p = S.fuseIn;
  const ease = (cur, target, speed) => cur + (target - cur) * Math.min(1, dt * speed);
  refs.bulbLight.intensity = ease(refs.bulbLight.intensity, p ? 9 : 0, 18);
  refs.bulbMat.emissiveIntensity = ease(refs.bulbMat.emissiveIntensity, p ? 3 : 0, 10);
  refs.safeLight.intensity = ease(refs.safeLight.intensity, p ? 2.4 : 0, 18);
  refs.safeMat.emissiveIntensity = p ? 2 : 0;
  refs.hemi.intensity = ease(refs.hemi.intensity, p ? 0.35 : 0.035, 18);
  const proj = projecting(S);
  const target = proj ? 1 : (!S.capOn ? 0.018 : 0);
  projOpacity = ease(projOpacity, target, proj ? 0.6 : 4);
  refs.projMat.opacity = projOpacity;
  refs.projLight.intensity = proj ? projOpacity * 1.4 : 0;
  refs.beamMat.opacity = proj ? projOpacity * 0.022 : 0;
  refs.dustMat.opacity = proj ? projOpacity * 0.6 : 0;
  refs.hole.visible = !S.capOn;
  refs.capDisc.visible = S.capOn;
  if (projOpacity > 0.01) {
    drawProjection(refs.projCanvas, projSrc, t);
    refs.projTex.needsUpdate = true;
  }
  if (proj) {
    const pos = refs.dust.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) + Math.sin(t * 0.3 + i) * 0.0004);
    pos.needsUpdate = true;
  }
  // 처음으로 벽에 맺힌 상을 본 순간
  if (proj && !S.k.k_projection && projOpacity > 0.5) {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    if (dir.x > 0.6 && camera.position.x > -1.5) {
      act('view_projection');
      if (!revealed) {
        revealed = true;
        sfx.reveal();
        say('하얀 벽에…… 바깥 거리가 떠올라 있다. 거꾸로 뒤집힌 채, 움직이고 있다.', 7000);
      }
    }
  }
  if (refs.outsideTarget) refs.outside.intensity = ease(refs.outside.intensity, refs.outsideTarget, 1.5);
}

function updateAnims(dt) {
  const k = Math.min(1, dt * 4);
  for (const key of Object.keys(anim)) {
    const target = key === 'drawer' ? (S.drawerOpen ? 1 : 0) : key === 'darkDoor' ? (S.darkroomOpen ? 1 : 0)
      : key === 'fuseDoor' ? (S.fuseboxOpen ? 1 : 0) : key === 'cloth' ? (S.backdropUp ? 1 : 0)
        : key === 'lever' ? (S.fuseIn ? 0 : 1) : (S.doorOpen ? 1 : 0);
    anim[key] += (target - anim[key]) * k;
  }
  refs.drawer.position.x = ROOM.x0 + 0.69 + anim.drawer * 0.34;
  refs.darkPivot.rotation.y = anim.darkDoor * 1.75;
  refs.fuseDoor.rotation.y = -anim.fuseDoor * 1.9;
  refs.cloth.scale.y = 1 - anim.cloth * 0.92;
  refs.fuseLever.rotation.x = anim.lever * 2.4;
  refs.fusePlug.position.z = 0.06 + anim.lever * 0.12;
  refs.fusePlug.visible = anim.lever < 0.9;
  refs.door.rotation.y = -anim.door * 1.4;
}

// ───────── 시작 ─────────
async function boot() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); } catch (_) {}
  const built = buildRoom(scene);
  refs = built.refs;
  // 문 밖 햇빛 (엔딩용)
  refs.outside = new THREE.PointLight(0xfff1d6, 0, 0, 1.2);
  refs.outside.position.set(0.85, 1.6, ROOM.z1 + 0.6);
  scene.add(refs.outside);
  player = new Player(camera, renderer.domElement);
  player.colliders = built.colliders;
  player.onStep = () => sfx.step();
  try { const s = localStorage.getItem('bestseat-sens'); if (s) { player.sensitivity = +s; $('sens').value = s; } } catch (_) {}
  ui.inventory(S.inv);
  $('loading').classList.remove('show');
  $('title').classList.add('show');
  $('start').onclick = start;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (started) {
      player.frozen = ui.open || ended;
      player.update(dt);
    } else {
      // 타이틀 화면: 천천히 둘러보는 카메라
      const t = now / 1000;
      camera.position.set(0.4 + Math.sin(t * 0.1) * 0.3, 1.5, 1.8);
      camera.rotation.set(-0.08, -0.5 + Math.sin(t * 0.07) * 0.35, 0, 'YXZ');
    }
    updateLights(dt, now / 1000);
    updateAnims(dt);
    updateHover();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // 자동 플레이 테스트용 연결
  window.__game = {
    S, H, player, ui, camera, interact, toggleCap, toggleFuse,
    look(yaw, pitch) { player.yaw = yaw; player.pitch = pitch; },
    get hovered() { player.update(0); camera.updateMatrixWorld(); updateHover(); return hovered; },
  };
}
boot();
