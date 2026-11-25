// 3~5편 공통 엔진: 렌더러, 입력, 조사 창, 수첩, 힌트, 인트로·엔딩, 매 프레임 루프
// 편마다 다른 것(방, 퍼즐, 상호작용, 대사)은 game 객체로 받는다.
import * as THREE from 'three';
import { Player } from './player.js';
import { ui } from './ui.js';
import { initAudio, sfx, sfx2 } from './audio.js';
import { makeCanvas, letterHTML } from './draw.js';

const $ = (id) => document.getElementById(id);

export function run(game) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = game.exposure || 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('game').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.03, 60);
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  ui.names = game.itemNames;
  const S = game.createState();
  const notes = [];
  const seen = {};
  let refs, player;
  let started = false, ended = false, startTime = 0;
  let hovered = null;
  let activeInput = null;

  const ctx = {
    THREE, scene, camera, renderer, ui, sfx, sfx2, S,
    get refs() { return refs; },
    get player() { return player; },
    get startTime() { return startTime; },
    get started() { return started; },
    say: (t, ms) => ui.toast(t, ms),
    once: (k) => { if (seen[k]) return false; seen[k] = true; return true; },
    act(id) { const ok = game.doAction(S, id); ui.inventory(S.inv); return ok; },
    has: (i) => S.inv.includes(i),
    img: (c, w) => ui.canvasEl(c, w),
    makeCanvas,
    note(id) { if (!notes.includes(id)) notes.push(id); },
    openPanel(opts) {
      ui.panel({ ...opts, onClose: () => { activeInput = null; opts.onClose && opts.onClose(); resume(); } });
      if (player.locked) ui.cursor.show();
    },
    setInput(el) { activeInput = el; },
    showDoc(key, extra = '') {
      if (game.showDoc && game.showDoc(key, ctx)) return;
      const d = game.docs[key];
      sfx.paper(); ctx.note(key);
      ctx.openPanel({ title: d.title, content: letterHTML(d), text: extra, wide: true });
    },
    dial(n, code, onOpen, title, text) {
      const lock = ui.dialLock(n, (v, el) => {
        if (v === code && onOpen()) { sfx.unlock(); ui.close(); }
        else { sfx.wrong(); ui.shake(el); }
      });
      ctx.openPanel({ title, content: lock, text: `${text}<br><span class="keyhelp">숫자 키로 바로 입력 · Enter 당기기</span>` });
      activeInput = lock;
    },
    finish,
  };

  function resume() {
    ui.cursor.hide();
    if (!started || ended || document.pointerLockElement) return;
    setTimeout(() => { if (!ui.open) renderer.domElement.requestPointerLock?.(); }, 30);
  }

  const H = game.handlers(ctx);

  // ───────── 수첩 / 힌트 ─────────
  function notebook() {
    if (!notes.length) { ctx.say('아직 수첩에 적힌 게 없다.'); return; }
    const list = document.createElement('div'); list.className = 'notes';
    notes.forEach((n) => {
      const b = document.createElement('button');
      b.textContent = game.docs[n].title;
      b.onclick = (e) => { e.stopPropagation(); ui.close(); setTimeout(() => ctx.showDoc(n), 50); };
      list.appendChild(b);
    });
    ctx.openPanel({ title: '수첩', content: list, text: '읽은 것들을 다시 볼 수 있다.' });
  }
  function hint() {
    ctx.openPanel({
      title: '힌트', text: '힌트를 보면 다음 단계가 드러납니다. 볼까요?',
      buttons: [{ label: '보기', onClick: () => ui.setText(game.hintText(S)) }, { label: '안 볼래요', onClick: () => ui.close() }],
    });
  }

  // ───────── 조준 ─────────
  const ray = new THREE.Raycaster();
  ray.far = 2.6;
  const center = new THREE.Vector2(0, 0);
  const findId = (o) => { while (o) { if (o.userData && o.userData.id) return o.userData.id; o = o.parent; } return null; };

  function updateHover() {
    if (!player.locked || ui.open) { hovered = null; ui.prompt(''); ui.crosshair(false); return; }
    if (player.sitting) { ui.prompt(game.seatedPrompt ? game.seatedPrompt(ctx) : '[E] 일어나기'); ui.crosshair(false); hovered = null; return; }
    ray.setFromCamera(center, camera);
    const hits = ray.intersectObjects(scene.children, true);
    let id = null;
    for (const h of hits) {
      if (h.object.isPoints || h.object.userData.noHit) continue;
      id = findId(h.object);
      break;
    }
    if (game.hoverFilter) id = game.hoverFilter(id, ctx);
    hovered = id;
    ui.prompt(id ? `[E] ${game.labels[id] || ''}` : '');
    ui.crosshair(!!id);
  }

  function onUse() {
    if (!started || ended) return;
    if (ui.open) { ui.close(); return; }
    if (!player.locked) return;
    if (player.sitting) { game.onStand ? game.onStand(ctx) : player.stand(player.pos.x, player.pos.z); sfx.sit(); return; }
    if (hovered && H[hovered]) H[hovered]();
  }

  document.addEventListener('keydown', (e) => {
    if (!started || ended) return;
    if (activeInput && ui.open && /^([0-9]|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(e.key)) { activeInput.press(e.key); e.preventDefault(); return; }
    if (ui.open && !activeInput && e.key === 'Enter') { const b = document.querySelector('#panel-buttons button'); if (b) { b.click(); e.preventDefault(); return; } }
    if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); onUse(); }
    else if (e.code === 'KeyQ' && !ui.open && game.onQ) game.onQ(ctx);
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

  // ───────── 엔딩 ─────────
  function finish() {
    ended = true;
    document.exitPointerLock?.();
    ui.prompt('');
    sfx.door();
    setTimeout(() => ui.fade(true, '#fff8ea', 2400), 700);
    setTimeout(showEnding, 3300);
  }
  function showEnding() {
    window.BSP && window.BSP.markCleared(game.epNum);
    sfx.ending();
    const el = $('ending'), body = $('ending-lines');
    body.innerHTML = '';
    el.classList.add('show');
    const step = game.endingStep || 2.1;
    game.ending.forEach((t, i) => {
      const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = `${0.6 + i * step}s`; body.appendChild(p);
    });
    let n = game.ending.length;
    if (game.endingImage) {
      const c = game.endingImage();
      const im = ui.canvasEl(c, 340); im.classList.add('end-photo');
      im.style.animationDelay = `${0.6 + n * step}s`; body.appendChild(im);
    }
    const last = document.createElement('p'); last.className = 'last'; last.textContent = game.endingLast;
    last.style.animationDelay = `${1.8 + n * step}s`; body.appendChild(last);
    const secs = Math.round((performance.now() - startTime) / 1000);
    const meta = document.createElement('p'); meta.className = 'meta';
    meta.innerHTML = `${game.epLabel} 플레이 시간 ${Math.floor(secs / 60)}분 ${secs % 60}초<br><button id="again">처음부터</button>${game.nextLink ? ` <button id="toNext">${game.nextLink.label}</button>` : ''} <button id="toHub">목록으로</button>`;
    meta.style.animationDelay = `${3.6 + n * step}s`;
    body.appendChild(meta);
    $('again').onclick = () => location.reload();
    if (game.nextLink) $('toNext').onclick = () => { location.href = game.nextLink.href; };
    $('toHub').onclick = () => { location.href = '../'; };
    el.onmousedown = (e) => { if (e.target.tagName !== 'BUTTON') body.classList.add('all'); };
    ui.fade(false, '#fff8ea', 2000);
  }

  function start() {
    initAudio();
    $('title').classList.remove('show');
    const intro = $('intro');
    intro.classList.add('show');
    const box = $('intro-lines');
    box.innerHTML = '';
    game.intro.forEach((t) => { const p = document.createElement('p'); p.textContent = t; p.style.animationDelay = '0.2s'; box.appendChild(p); });
    const go = () => {
      if (started) return;
      started = true;
      intro.classList.remove('show');
      startTime = performance.now();
      sfx.door();
      renderer.domElement.requestPointerLock?.();
      setTimeout(() => ctx.say(game.startHint || '[E] 또는 클릭으로 살펴보기 · [Tab] 수첩 · [H] 힌트', 6000), 800);
      game.onStart && game.onStart(ctx);
    };
    $('intro-skip').onclick = go;
    window.__skipIntro = go;
  }

  async function boot() {
    try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))]); } catch (_) {}
    const built = game.buildRoom(scene, ctx);
    refs = built.refs;
    player = new Player(camera);
    player.areas = built.areas;
    player.colliders = built.colliders;
    player.pos.set(game.startPos.x, 1.6, game.startPos.z);
    player.yaw = game.startPos.yaw || 0;
    player.onStep = () => sfx.step();
    try { const s = localStorage.getItem('bestseat-sens'); if (s) { player.sensitivity = +s; $('sens').value = s; } } catch (_) {}
    ui.inventory(S.inv);
    game.onBuilt && game.onBuilt(ctx);
    $('loading').classList.remove('show');
    $('title').classList.add('show');
    $('start').onclick = start;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (started) { player.frozen = ui.open || ended; player.update(dt); }
      else game.titleCamera(camera, now / 1000);
      game.update && game.update(ctx, dt, now / 1000);
      updateHover();
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    window.__game = {
      S, H, player, ui, camera, ctx,
      get hovered() { player.sitT = player.sitting ? 1 : 0; player.update(0); camera.updateMatrixWorld(); updateHover(); return hovered; },
    };
  }
  boot();
}
