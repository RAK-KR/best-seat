// 명수 이발소(가게)와 뒷방
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import * as T from './textures.js';
import {
  makeCanvas, drawPortrait, drawNote, drawWallText, drawFog, drawMarks, drawNewspaper, drawPriceBoard, drawCalendar,
} from './closeups.js';
import { MUGS, DOCS } from './content.js';

export const SHOP = { x0: -3.5, x1: 3.5, z0: -2.5, z1: 2.5, h: 2.7 };
export const BACK = { x0: 3.5, x1: 6.3, z0: -2.5, z1: 0.5 };
export const BACK_DOOR = { z0: -1.7, z1: -0.9 };
export const MAIN_CHAIR = { x: 0.8, z: -1.25 };
export const MIRROR = { x: 0.8, y: 1.55, w: 1.8, h: 1.2 };
export const seatY = (level) => 0.48 + (level - 1) * 0.03;

export function buildRoom(scene) {
  const refs = {};
  const colliders = [];
  const { x0, x1, z0, z1, h } = SHOP;

  const M = {
    checker: new THREE.MeshStandardMaterial({ map: T.checkerTexture(), roughness: 0.35 }),
    tile: new THREE.MeshStandardMaterial({ map: T.tileTexture(), roughness: 0.25 }),
    paint: new THREE.MeshStandardMaterial({ map: T.paintTexture(), roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ map: T.paintTexture('#e4e0d4', 93), roughness: 1 }),
    wallpaper: new THREE.MeshStandardMaterial({ map: T.wallpaperTexture(), roughness: 0.92 }),
    lino: new THREE.MeshStandardMaterial({ map: T.linoleumTexture(), roughness: 0.6 }),
    marble: new THREE.MeshStandardMaterial({ map: T.marbleTexture(), roughness: 0.3 }),
    wood: new THREE.MeshStandardMaterial({ map: T.woodTexture(3), roughness: 0.6 }),
    darkWood: new THREE.MeshStandardMaterial({ map: T.woodTexture(9, [58, 36, 22]), roughness: 0.55 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd8dcdf, roughness: 0.18, metalness: 1 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x8e1f1c, roughness: 0.45 }),
    pinkLeather: new THREE.MeshStandardMaterial({ color: 0xc77b86, roughness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.5 }),
    black: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xbfd6d8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18 }),
    cloth: new THREE.MeshStandardMaterial({ map: T.clothTexture(), color: 0xd8d4c8, roughness: 1, side: THREE.DoubleSide }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ map: T.metalTexture(), roughness: 0.5, metalness: 0.6 }),
  };
  const hitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

  const add = (mesh, x, y, z, parent = scene) => {
    mesh.position.set(x, y, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (w, hh, d, mat, x, y, z, parent) => add(new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat), x, y, z, parent);
  const cyl = (rt, rb, hh, mat, x, y, z, parent, seg = 24) => add(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, hh, seg), mat), x, y, z, parent);
  const plane = (w, hh, mat, x, y, z, ry = 0, rx = 0, parent) => {
    if (!mat.transparent) mat.shadowSide = THREE.DoubleSide;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), mat);
    m.rotation.set(rx, ry, 0);
    return add(m, x, y, z, parent);
  };
  const tex = (c) => T.canvasTexture(c);
  const canvasPlane = (c, w, hh, x, y, z, ry = 0, rough = 0.85, parent) => {
    const m = plane(w, hh, new THREE.MeshStandardMaterial({ map: tex(c), roughness: rough, transparent: true }), x, y, z, ry, 0, parent);
    m.castShadow = false;
    return m;
  };
  const hit = (id, w, hh, d, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), hitMat);
    m.position.set(x, y, z); m.userData.id = id; scene.add(m);
    return m;
  };
  const tag = (obj, id) => { obj.traverse((o) => { o.userData.id = id; }); return obj; };
  const collide = (a, b, c, d, off) => colliders.push({ x0: a, x1: b, z0: c, z1: d, off });
  const repeatMat = (mat, rx, ry) => { const m = mat.clone(); m.map = mat.map.clone(); m.map.repeat.set(rx, ry); m.map.needsUpdate = true; return m; };

  // 벽 한 조각: 아래는 타일(1.2m), 위는 페인트. facing: 'n','s','e','w' = 벽이 바라보는 방향
  const TILE_H = 1.2;
  function wallSeg(a, b, y0, y1, fixed, facing, mats = 'shop') {
    const len = b - a, mid = (a + b) / 2;
    const ry = { s: Math.PI, n: 0, e: Math.PI / 2, w: -Math.PI / 2 }[facing];
    const put = (yy0, yy1, mat) => {
      if (yy1 <= yy0) return;
      const m = repeatMat(mat, Math.max(0.3, len / 1.0), Math.max(0.2, (yy1 - yy0) / 0.6));
      const hh = yy1 - yy0;
      if (facing === 'n' || facing === 's') plane(len + 0.04, hh + 0.02, m, mid, (yy0 + yy1) / 2, fixed, ry);
      else plane(len + 0.04, hh + 0.02, m, fixed, (yy0 + yy1) / 2, mid, ry);
    };
    if (mats === 'back') { put(y0, y1, M.wallpaper); return; }
    put(y0, Math.min(y1, TILE_H), M.tile);
    put(Math.max(y0, TILE_H), y1, M.paint);
  }

  // ── 바닥·천장 ──
  plane(x1 - x0 + 0.04, z1 - z0 + 0.04, M.checker, 0, 0, 0, 0, -Math.PI / 2);
  plane(x1 - x0 + 0.04, z1 - z0 + 0.04, M.ceiling, 0, h, 0, 0, Math.PI / 2);
  const bw = BACK.x1 - BACK.x0, bd = BACK.z1 - BACK.z0, bcx = (BACK.x0 + BACK.x1) / 2, bcz = (BACK.z0 + BACK.z1) / 2;
  plane(bw + 0.04, bd + 0.04, M.lino, bcx, 0.001, bcz, 0, -Math.PI / 2);
  plane(bw + 0.04, bd + 0.04, M.ceiling, bcx, h, bcz, 0, Math.PI / 2);

  // ── 가게 벽 ──
  // 북쪽 (거울 벽)
  wallSeg(x0, x1, 0, h, z0, 'n');
  // 서쪽
  wallSeg(z0, z1, 0, h, x0, 'e');
  // 남쪽: 출입문(x -2.9~-1.9), 창문(x -1.1~0.7, y 0.95~2.05)
  wallSeg(x0, -2.9, 0, h, z1, 's');
  wallSeg(-1.9, -1.1, 0, h, z1, 's');
  wallSeg(0.7, x1, 0, h, z1, 's');
  wallSeg(-2.9, -1.9, 2.1, h, z1, 's');
  wallSeg(-1.1, 0.7, 0, 0.95, z1, 's');
  wallSeg(-1.1, 0.7, 2.05, h, z1, 's');
  // 동쪽: 뒷방 문(z -1.7~-0.9)
  wallSeg(z0, BACK_DOOR.z0, 0, h, x1, 'w');
  wallSeg(BACK_DOOR.z1, z1, 0, h, x1, 'w');
  wallSeg(BACK_DOOR.z0, BACK_DOOR.z1, 2.05, h, x1, 'w');
  // 뒷방 벽 (벽지)
  wallSeg(BACK.x0, BACK.x1, 0, h, BACK.z0, 'n', 'back');
  wallSeg(BACK.x0, BACK.x1, 0, h, BACK.z1, 's', 'back');
  wallSeg(BACK.z0, BACK.z1, 0, h, BACK.x1, 'w', 'back');
  wallSeg(BACK.z0, BACK_DOOR.z0, 0, h, BACK.x0 + 0.01, 'e', 'back');
  wallSeg(BACK_DOOR.z1, BACK.z1, 0, h, BACK.x0 + 0.01, 'e', 'back');
  wallSeg(BACK_DOOR.z0, BACK_DOOR.z1, 2.05, h, BACK.x0 + 0.01, 'e', 'back');
  // 걸레받이
  box(x1 - x0, 0.1, 0.02, M.darkWood, 0, 0.05, z0 + 0.01);
  box(0.02, 0.1, z1 - z0, M.darkWood, x0 + 0.01, 0.05, 0);

  // ── 바깥 풍경 (창과 문 유리 너머) ──
  const out = makeCanvas(1024, 512);
  {
    const c = out.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, 300);
    sky.addColorStop(0, '#9cc0dc'); sky.addColorStop(1, '#f1e6c8');
    c.fillStyle = sky; c.fillRect(0, 0, 1024, 512);
    c.fillStyle = '#b9ad98'; c.fillRect(0, 170, 1024, 260);
    c.fillStyle = '#8f8473';
    for (let i = 0; i < 6; i++) c.fillRect(40 + i * 170, 210, 90, 120);
    c.fillStyle = '#6b6457'; c.fillRect(0, 160, 1024, 14);
    c.fillStyle = '#8a8478'; c.fillRect(0, 430, 1024, 82);
    c.fillStyle = '#3d5a6e'; c.fillRect(600, 180, 260, 44);
    c.fillStyle = '#efe6cf'; c.font = 'bold 30px serif'; c.textAlign = 'center'; c.fillText('동네 슈퍼', 730, 212);
  }
  const outMat = new THREE.MeshBasicMaterial({ map: tex(out) });
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5), outMat);
  outside.position.set(-1, 1.6, z1 + 2.5); outside.rotation.y = Math.PI;
  scene.add(outside);

  // 창문 + 블라인드
  box(1.86, 0.06, 0.12, M.white, -0.2, 0.95, z1 - 0.02);
  box(1.86, 0.06, 0.12, M.white, -0.2, 2.05, z1 - 0.02);
  box(0.06, 1.16, 0.12, M.white, -1.1, 1.5, z1 - 0.02);
  box(0.06, 1.16, 0.12, M.white, 0.7, 1.5, z1 - 0.02);
  const winGlass = plane(1.8, 1.1, M.glass, -0.2, 1.5, z1, Math.PI);
  winGlass.castShadow = false;
  for (let i = 0; i < 14; i++) {
    const s = box(1.76, 0.004, 0.05, M.white, -0.2, 1.06 + i * 0.07, z1 - 0.1);
    s.rotation.x = 0.7;
  }
  tag(hit('window', 1.8, 1.1, 0.15, -0.2, 1.5, z1 - 0.1), 'window');

  // 간판 (창 밖에서 보이는 회전 간판)
  const poleC = makeCanvas(128, 256);
  {
    const c = poleC.getContext('2d');
    c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 128, 256);
    for (let i = -4; i < 8; i++) {
      c.fillStyle = i % 2 ? '#c0262a' : '#2a4aa0';
      c.beginPath(); c.moveTo(0, i * 64); c.lineTo(128, i * 64 - 64); c.lineTo(128, i * 64 - 32); c.lineTo(0, i * 64 + 32); c.fill();
    }
  }
  const poleTex = tex(poleC); poleTex.wrapS = poleTex.wrapT = THREE.RepeatWrapping;
  const poleMat = new THREE.MeshStandardMaterial({ map: poleTex, emissive: 0xffffff, emissiveMap: poleTex, emissiveIntensity: 0, roughness: 0.3 });
  const pole = cyl(0.09, 0.09, 0.7, poleMat, 0.45, 1.6, z1 + 0.35, scene, 24);
  cyl(0.11, 0.11, 0.06, M.chrome, 0.45, 1.98, z1 + 0.35);
  cyl(0.11, 0.11, 0.06, M.chrome, 0.45, 1.22, z1 + 0.35);
  refs.poleTex = poleTex; refs.poleMat = poleMat;

  // 출입문 (유리 달린 나무 문)
  const door = new THREE.Group();
  box(0.98, 0.9, 0.05, M.darkWood, 0.49, 0.45, 0, door);
  box(0.98, 0.12, 0.05, M.darkWood, 0.49, 2.04, 0, door);
  box(0.1, 1.1, 0.05, M.darkWood, 0.05, 1.45, 0, door);
  box(0.1, 1.1, 0.05, M.darkWood, 0.93, 1.45, 0, door);
  const dg = plane(0.8, 1.1, M.glass, 0.49, 1.45, 0, Math.PI, 0, door); dg.castShadow = false;
  box(0.14, 0.03, 0.05, M.brass, 0.85, 1.0, -0.05, door);
  door.position.set(-2.89, 0, z1 - 0.03);
  scene.add(door);
  tag(door, 'entrance');
  refs.door = door;
  box(1.06, 0.08, 0.1, M.darkWood, -2.4, 2.12, z1 - 0.04);
  box(0.06, 2.12, 0.1, M.darkWood, -2.93, 1.06, z1 - 0.04);
  box(0.06, 2.12, 0.1, M.darkWood, -1.87, 1.06, z1 - 0.04);
  // 키 재기 눈금 (문 옆 벽)
  const marksC = makeCanvas(256, 768); drawMarks(marksC);
  tag(canvasPlane(marksC, 0.26, 0.78, -1.68, 1.25, z1 - 0.005, Math.PI), 'marks');
  // 간판 스위치
  const sw = new THREE.Group();
  box(0.09, 0.13, 0.015, M.white, 0, 0, 0, sw);
  const lever = box(0.025, 0.05, 0.025, M.white, 0, -0.015, -0.015, sw);
  sw.position.set(-1.3, 1.3, z1 - 0.01);
  scene.add(sw);
  tag(sw, 'poleSwitch');
  hit('poleSwitch', 0.16, 0.2, 0.06, -1.3, 1.3, z1 - 0.03);
  refs.switchLever = lever;
  const swNote = makeCanvas(256, 128); drawNote(swNote, ['간판'], 3);
  tag(canvasPlane(swNote, 0.14, 0.07, -1.3, 1.45, z1 - 0.006, Math.PI), 'poleSwitch');

  // 가격표 판과 그 위의 봉투
  const pbC = makeCanvas(768, 230); drawPriceBoard(pbC);
  const pb = new THREE.Group();
  box(1.2, 0.36, 0.04, M.darkWood, 0, 0, 0, pb);
  const pbFace = plane(1.14, 0.32, new THREE.MeshStandardMaterial({ map: tex(pbC), roughness: 0.7 }), 0, 0, -0.021, Math.PI, 0, pb);
  pbFace.castShadow = false;
  box(1.2, 0.025, 0.12, M.darkWood, 0, 0.19, 0.04, pb);
  // 윗면 앞쪽 테두리: 바닥에서 올려다보면 윗면(봉투)이 가려진다
  box(1.2, 0.05, 0.015, M.darkWood, 0, 0.2275, -0.0125, pb);
  pb.position.set(-2.4, 2.36, z1 - 0.1);
  pb.rotation.x = 0.12;
  scene.add(pb);
  tag(pb, 'priceBoard');
  // 봉투는 테두리 뒤 윗면에 납작하게 눕혀 둔다 (테두리보다 낮음)
  const env = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.08), new THREE.MeshStandardMaterial({ color: 0xe6d8b6, roughness: 0.8 }));
  env.position.set(0.08, 0.2065, 0.05);
  env.rotation.set(0, 0.15, 0);
  pb.add(env);
  refs.envelope = env;
  refs.envHit = hit('envelope', 0.4, 0.2, 0.3, -2.32, 2.56, z1 - 0.12);

  // 뒷벽 거꾸로 쓴 글씨 + 대기 의자
  const wtC = makeCanvas(1024, 400); drawWallText(wtC, true);
  tag(canvasPlane(wtC, 1.9, 0.74, 2.25, 1.85, z1 - 0.005, Math.PI, 0.95), 'wallText');
  const bench = new THREE.Group();
  box(2.0, 0.05, 0.4, M.wood, 0, 0.45, 0, bench);
  box(2.0, 0.4, 0.04, M.wood, 0, 0.7, 0.18, bench);
  for (const bx of [-0.9, 0.9]) box(0.05, 0.45, 0.36, M.chrome, bx, 0.225, 0, bench);
  bench.position.set(2.25, 0, z1 - 0.25);
  scene.add(bench);
  tag(bench, 'bench');
  collide(1.2, 3.3, z1 - 0.46, z1);
  // 낡은 라디오
  const radio = new THREE.Group();
  box(0.34, 0.2, 0.14, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.5 }), 0, 0.1, 0, radio);
  box(0.14, 0.12, 0.005, M.black, -0.07, 0.11, -0.072, radio);
  cyl(0.025, 0.025, 0.02, M.chrome, 0.1, 0.12, -0.075, radio).rotation.x = Math.PI / 2;
  radio.position.set(2.9, 0.475, z1 - 0.3);
  scene.add(radio);
  tag(radio, 'radio');

  // ── 북쪽: 대리석 선반, 거울 두 개, 온장고, 세면대, 시계 ──
  box(6.0, 0.06, 0.5, M.marble, 0, 0.85, z0 + 0.25);
  box(6.0, 0.8, 0.46, M.wood, 0, 0.4, z0 + 0.23);
  collide(-3.0, 3.0, z0, z0 + 0.5);
  // 진짜 거울 (실시간 반사)
  const mirror = new Reflector(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), {
    clipBias: 0.003,
    textureWidth: Math.min(1600, window.innerWidth * Math.min(window.devicePixelRatio, 1.5)),
    textureHeight: Math.min(1000, window.innerHeight * Math.min(window.devicePixelRatio, 1.5)),
    color: 0xb8c0c0,
  });
  mirror.position.set(MIRROR.x, MIRROR.y, z0 + 0.03);
  mirror.userData.id = 'mainMirror';
  scene.add(mirror);
  refs.mirror = mirror;
  const frame = (cx, w, hh) => {
    box(w + 0.1, 0.05, 0.04, M.chrome, cx, MIRROR.y + hh / 2 + 0.025, z0 + 0.02);
    box(w + 0.1, 0.05, 0.04, M.chrome, cx, MIRROR.y - hh / 2 - 0.025, z0 + 0.02);
    box(0.05, hh, 0.04, M.chrome, cx - w / 2 - 0.025, MIRROR.y, z0 + 0.02);
    box(0.05, hh, 0.04, M.chrome, cx + w / 2 + 0.025, MIRROR.y, z0 + 0.02);
  };
  frame(MIRROR.x, MIRROR.w, MIRROR.h);
  frame(-1.8, MIRROR.w, MIRROR.h);
  // 김 서림 덮개
  const fogC = makeCanvas(768, 512);
  const fogTex = tex(fogC);
  const fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), new THREE.MeshBasicMaterial({ map: fogTex, transparent: true, depthWrite: false }));
  fogMesh.position.set(MIRROR.x, MIRROR.y, z0 + 0.034);
  fogMesh.userData.id = 'mainMirror';
  scene.add(fogMesh);
  refs.fogC = fogC; refs.fogTex = fogTex; refs.drawFog = (s) => { drawFog(fogC, s); fogTex.needsUpdate = true; };
  // 거울에 붙은 쪽지들
  const cardC = makeCanvas(400, 520);
  drawNote(cardC, DOCS.card.body.filter((l) => l), 5);
  tag(canvasPlane(cardC, 0.3, 0.39, MIRROR.x - 0.68, MIRROR.y - 0.36, z0 + 0.037), 'card');
  const noteC = makeCanvas(480, 160); drawNote(noteC, ['이 사람은 나다'], 9);
  tag(canvasPlane(noteC, 0.36, 0.12, MIRROR.x, MIRROR.y + 0.5, z0 + 0.037), 'note');
  // 덮어 둔 거울 (신문지)
  const npC = makeCanvas(768, 512); drawNewspaper(npC);
  tag(canvasPlane(npC, MIRROR.w, MIRROR.h, -1.8, MIRROR.y, z0 + 0.03), 'coveredMirror');

  // 온장고 (수건 데우는 상자)
  const warmer = new THREE.Group();
  box(0.38, 0.4, 0.32, M.white, 0, 0.2, 0, warmer);
  const wDoor = plane(0.3, 0.26, new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.1, transparent: true, opacity: 0.55 }), 0, 0.22, 0.161, 0, 0, warmer);
  wDoor.castShadow = false;
  for (let i = 0; i < 3; i++) box(0.24, 0.05, 0.2, M.white, 0, 0.12 + i * 0.07, 0, warmer);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2200, emissiveIntensity: 0 }));
  lamp.position.set(0.14, 0.05, 0.165); warmer.add(lamp);
  warmer.position.set(2.0, 0.88, z0 + 0.27);
  warmer.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(warmer);
  tag(warmer, 'warmer');
  refs.warmerLamp = lamp.material;
  const wNote = makeCanvas(400, 120); drawNote(wNote, ['수건은 세 번 접는다'], 11);
  tag(canvasPlane(wNote, 0.3, 0.09, 2.0, 1.33, z0 + 0.44), 'warmer');
  // 김 (입자)
  const steamN = 90;
  const sg = new THREE.BufferGeometry();
  const sp = new Float32Array(steamN * 3);
  const sv = [];
  for (let i = 0; i < steamN; i++) { sp[i * 3] = 2; sp[i * 3 + 1] = 1.3; sp[i * 3 + 2] = z0 + 0.3; sv.push(Math.random()); }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const dotC = makeCanvas(64, 64);
  { const c = dotC.getContext('2d'); const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); }
  const steamMat = new THREE.PointsMaterial({ size: 0.18, map: new THREE.CanvasTexture(dotC), transparent: true, opacity: 0, depthWrite: false });
  const steam = new THREE.Points(sg, steamMat);
  steam.raycast = () => {};
  scene.add(steam);
  refs.steam = { geo: sg, mat: steamMat, seeds: sv };

  // 세면대
  const sink = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.12, 24, 1, true), M.white);
  bowl.position.y = 0.84; sink.add(bowl);
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 16, Math.PI), M.chrome);
  faucet.position.set(0, 0.98, -0.12); sink.add(faucet);
  sink.position.set(2.65, 0, z0 + 0.28);
  sink.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(sink);
  tag(sink, 'sink');
  hit('sink', 0.45, 0.3, 0.45, 2.65, 0.95, z0 + 0.28);

  // 선반 위 도구들 (가위·빗·토닉) — 이름표가 붙어 있다
  const tools = new THREE.Group();
  const bottleCols = [0x2f7a4a, 0x9a5a1a, 0x3a4a8a, 0x8a2a3a];
  bottleCols.forEach((col, i) => {
    const b = cyl(0.035, 0.04, 0.2, new THREE.MeshStandardMaterial({ color: col, roughness: 0.15, transparent: true, opacity: 0.85 }), -0.2 + i * 0.1, 0.98, 0, tools, 14);
    b.castShadow = true;
  });
  box(0.18, 0.006, 0.03, M.black, 0.3, 0.885, 0.05, tools);
  box(0.12, 0.004, 0.06, M.chrome, 0.55, 0.885, 0.04, tools);
  tools.position.set(-0.45, 0, z0 + 0.32);
  scene.add(tools);
  tag(tools, 'tools');
  const tNote = makeCanvas(320, 110); drawNote(tNote, ['가위  빗'], 13);
  tag(canvasPlane(tNote, 0.2, 0.07, 0.05, 0.92, z0 + 0.49, 0), 'tools');

  // 시계 (10분 빠름)
  const clockC = makeCanvas(256, 256);
  const clockTex = tex(clockC);
  const clock = new THREE.Group();
  const cb = cyl(0.18, 0.18, 0.05, M.darkWood, 0, 0, 0, clock, 32); cb.rotation.x = Math.PI / 2;
  const cf = plane(0.33, 0.33, new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.6, transparent: true }), 0, 0, 0.026, 0, 0, clock);
  cf.castShadow = false;
  clock.position.set(2.5, 2.2, z0 + 0.03);
  scene.add(clock);
  tag(clock, 'clock');
  refs.clockC = clockC; refs.clockTex = clockTex;
  const cNote = makeCanvas(420, 140); drawNote(cNote, ['10분 빠름', '너 늘 늦잖아'], 15);
  tag(canvasPlane(cNote, 0.28, 0.093, 2.5, 1.92, z0 + 0.01), 'clock');

  // ── 이발 의자 ──
  function barberChair(mat) {
    const g = new THREE.Group();
    cyl(0.26, 0.3, 0.06, M.chrome, 0, 0.03, 0, g, 32);
    const lift = new THREE.Group();
    g.add(lift);
    cyl(0.06, 0.06, 0.5, M.chrome, 0, -0.25, 0, lift, 16);
    box(0.52, 0.12, 0.5, mat, 0, 0, 0, lift);
    const back = box(0.52, 0.62, 0.1, mat, 0, 0.36, 0.26, lift);
    back.rotation.x = -0.12;
    box(0.3, 0.14, 0.08, mat, 0, 0.78, 0.31, lift);
    for (const sx of [-0.3, 0.3]) {
      box(0.08, 0.05, 0.46, mat, sx, 0.2, 0.02, lift);
      box(0.03, 0.2, 0.03, M.chrome, sx, 0.09, -0.18, lift);
    }
    box(0.4, 0.03, 0.14, M.chrome, 0, -0.32, -0.36, lift);
    box(0.03, 0.3, 0.03, M.chrome, 0, -0.18, -0.28, lift);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { g, lift };
  }
  const main = barberChair(M.leather);
  main.g.position.set(MAIN_CHAIR.x, 0, MAIN_CHAIR.z);
  main.lift.position.y = seatY(1);
  scene.add(main.g);
  tag(main.g, 'mainChair');
  refs.mainLift = main.lift;
  collide(MAIN_CHAIR.x - 0.36, MAIN_CHAIR.x + 0.36, MAIN_CHAIR.z - 0.45, MAIN_CHAIR.z + 0.36);
  // 정자 자리 (천을 씌워 둔 의자)
  const cov = barberChair(M.pinkLeather);
  cov.g.position.set(-1.8, 0, MAIN_CHAIR.z);
  cov.lift.position.y = seatY(2);
  scene.add(cov.g);
  tag(cov.g, 'coveredChair');
  const clothGeo = new THREE.BoxGeometry(0.82, 1.25, 0.82, 8, 10, 8);
  const cp = clothGeo.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const y = cp.getY(i);
    const spread = 1 + Math.max(0, -y) * 0.25;
    cp.setX(i, cp.getX(i) * spread + Math.sin(y * 9 + cp.getZ(i) * 5) * 0.015);
    cp.setZ(i, cp.getZ(i) * spread + Math.cos(y * 8 + cp.getX(i) * 6) * 0.015);
  }
  clothGeo.computeVertexNormals();
  const cloth = new THREE.Mesh(clothGeo, M.cloth);
  cloth.position.set(-1.8, 0.63, MAIN_CHAIR.z);
  cloth.castShadow = true; cloth.receiveShadow = true;
  cloth.userData.id = 'coveredChair';
  scene.add(cloth);
  refs.cloth = cloth;
  const fold = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.35), M.cloth);
  fold.position.set(-2.55, 0.04, -0.3); fold.visible = false; scene.add(fold);
  refs.clothFold = fold;
  collide(-2.25, -1.35, MAIN_CHAIR.z - 0.45, MAIN_CHAIR.z + 0.4);

  // ── 서쪽: 컵장, 장부 책상, 달력 ──
  const cab = new THREE.Group();
  box(0.3, 0.9, 0.95, M.darkWood, 0, 0, 0, cab);
  box(0.26, 0.02, 0.88, M.wood, 0.02, -0.1, 0, cab);
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.35 });
  MUGS.forEach((m, i) => {
    const mug = cyl(0.04, 0.036, 0.09, mugMat, 0.04, -0.045, -0.34 + i * 0.17, cab, 16);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.006, 6, 12), mugMat);
    hd.position.set(0.04, -0.045, -0.34 + i * 0.17 + 0.045); hd.rotation.y = Math.PI / 2; cab.add(hd);
    if (m.stripe) cyl(0.0405, 0.0405, 0.012, new THREE.MeshStandardMaterial({ color: 0x3d6fa8 }), 0.04, -0.03, -0.34 + i * 0.17, cab, 16);
  });
  const cabDoor = new THREE.Group();
  box(0.03, 0.86, 0.04, M.darkWood, 0, 0, 0.45, cabDoor);
  box(0.03, 0.86, 0.04, M.darkWood, 0, 0, -0.45, cabDoor);
  box(0.03, 0.04, 0.9, M.darkWood, 0, 0.43, 0, cabDoor);
  box(0.03, 0.04, 0.9, M.darkWood, 0, -0.43, 0, cabDoor);
  const cg = plane(0.86, 0.82, M.glass, 0.005, 0, 0, Math.PI / 2, 0, cabDoor); cg.castShadow = false;
  const padlock = box(0.04, 0.06, 0.05, M.brass, 0.03, 0, 0.38, cabDoor);
  const cabPivot = new THREE.Group();
  cabPivot.position.set(0.165, 0, -0.475);
  cabDoor.position.set(0, 0, 0.475);
  cabPivot.add(cabDoor);
  cab.add(cabPivot);
  cab.position.set(x0 + 0.15, 1.5, -1.05);
  cab.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(cab);
  tag(cab, 'cabinet');
  hit('cabinet', 0.4, 0.95, 1.0, x0 + 0.2, 1.5, -1.05);
  refs.cabPivot = cabPivot; refs.padlock = padlock;
  // 장부 책상
  const desk = new THREE.Group();
  box(0.55, 0.05, 1.0, M.wood, 0, 0.88, 0, desk);
  box(0.5, 0.85, 0.95, M.darkWood, 0, 0.43, 0, desk);
  desk.position.set(x0 + 0.28, 0, 0.8);
  scene.add(desk);
  collide(x0, x0 + 0.58, 0.28, 1.32);
  const ledger = new THREE.Group();
  box(0.28, 0.02, 0.4, new THREE.MeshStandardMaterial({ color: 0x3a2a4a, roughness: 0.6 }), 0, 0, 0, ledger);
  box(0.26, 0.012, 0.38, M.paper, 0, 0.015, 0, ledger);
  ledger.position.set(x0 + 0.3, 0.915, 0.95);
  ledger.rotation.y = 0.1;
  scene.add(ledger);
  tag(ledger, 'ledger');
  hit('ledger', 0.36, 0.08, 0.46, x0 + 0.3, 0.93, 0.95);
  // 달력
  const calC = makeCanvas(400, 520);
  drawCalendar(calC);
  tag(canvasPlane(calC, 0.38, 0.5, x0 + 0.005, 1.65, 0.75, Math.PI / 2, 0.9), 'calendar');
  // 포스터 (동쪽 벽)
  const posterC = makeCanvas(300, 420);
  drawPortrait(posterC, 'man', 21);
  const pctx = posterC.getContext('2d');
  pctx.fillStyle = 'rgba(240,230,200,0.9)'; pctx.fillRect(0, 340, 300, 80);
  pctx.fillStyle = '#2a2a2a'; pctx.font = 'bold 34px serif'; pctx.textAlign = 'center'; pctx.fillText('신사 머리', 150, 392);
  tag(canvasPlane(posterC, 0.45, 0.63, x1 - 0.005, 1.6, 1.3, -Math.PI / 2), 'poster');

  // ── 뒷방 문 ──
  const bPivot = new THREE.Group();
  bPivot.position.set(x1, 0, BACK_DOOR.z1);
  const bDoor = new THREE.Group();
  box(0.05, 2.03, 0.8, M.wood, 0, 1.015, -0.4, bDoor);
  box(0.05, 0.03, 0.12, M.brass, -0.04, 1.0, -0.7, bDoor);
  bPivot.add(bDoor);
  scene.add(bPivot);
  tag(bPivot, 'backDoor');
  refs.backPivot = bPivot;

  // ── 뒷방 ──
  const table = new THREE.Group();
  box(0.85, 0.04, 0.6, M.wood, 0, 0.34, 0, table);
  for (const [dx, dz] of [[-0.38, -0.25], [0.38, -0.25], [-0.38, 0.25], [0.38, 0.25]]) box(0.04, 0.32, 0.04, M.darkWood, dx, 0.16, dz, table);
  table.position.set(4.9, 0, -1.2);
  scene.add(table);
  collide(4.45, 5.35, -1.52, -0.88);
  const diary = new THREE.Group();
  box(0.2, 0.03, 0.28, new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.6 }), 0, 0, 0, diary);
  diary.position.set(4.8, 0.375, -1.2); diary.rotation.y = -0.3;
  scene.add(diary);
  tag(diary, 'diary');
  hit('diary', 0.3, 0.08, 0.34, 4.8, 0.39, -1.2);
  const gl = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.003, 6, 16), M.black);
  gl.position.set(5.05, 0.365, -1.1); gl.rotation.x = Math.PI / 2; scene.add(gl);
  // 정자 할머니 사진
  const wifeC = makeCanvas(256, 320); drawPortrait(wifeC, 'woman', 31);
  const wf = new THREE.Group();
  box(0.36, 0.44, 0.03, M.darkWood, 0, 0, 0, wf);
  canvasPlane(wifeC, 0.3, 0.38, 0, 0, 0.017, 0, 0.5, wf);
  wf.position.set(4.9, 1.6, BACK.z0 + 0.02);
  scene.add(wf);
  tag(wf, 'wifePhoto');
  // 장롱
  const ward = new THREE.Group();
  box(0.45, 1.9, 1.2, M.darkWood, 0, 0.95, 0, ward);
  const wl = new THREE.Group(); const wr = new THREE.Group();
  box(0.03, 1.8, 0.58, M.wood, 0, 0.95, 0.29, wl);
  box(0.03, 1.8, 0.58, M.wood, 0, 0.95, -0.29, wr);
  box(0.02, 0.12, 0.03, M.brass, -0.02, 1.0, 0.54, wl);
  box(0.02, 0.12, 0.03, M.brass, -0.02, 1.0, -0.54, wr);
  wl.position.set(-0.24, 0, -0.6); wr.position.set(-0.24, 0, 0.6);
  ward.add(wl, wr);
  // 안쪽: 흰 가운과 상자
  const gown = box(0.06, 0.9, 0.4, M.white, 0, 1.3, 0.2, ward);
  const boxIn = box(0.3, 0.18, 0.3, new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.8 }), 0, 0.3, -0.3, ward);
  ward.position.set(BACK.x1 - 0.23, 0, -1.8);
  ward.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(ward);
  tag(ward, 'wardrobe');
  refs.wardL = wl; refs.wardR = wr;
  collide(BACK.x1 - 0.47, BACK.x1, -2.42, -1.18);
  // TV와 이불
  const tv = new THREE.Group();
  box(0.6, 0.45, 0.4, new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 0.5 }), 0, 0.62, 0, tv);
  box(0.46, 0.34, 0.01, new THREE.MeshStandardMaterial({ color: 0x1a2020, roughness: 0.1, metalness: 0.3 }), -0.02, 0.63, -0.2, tv);
  box(0.7, 0.4, 0.45, M.wood, 0, 0.2, 0, tv);
  tv.position.set(5.6, 0, 0.22);
  scene.add(tv);
  tag(tv, 'tv');
  collide(5.2, 6.0, -0.05, 0.5);
  const bed = new THREE.Group();
  ['#c96a6a', '#6a8ac9', '#e0c070'].forEach((col, i) => box(0.9, 0.12, 0.5, new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }), 0, 0.06 + i * 0.12, 0, bed));
  bed.position.set(4.05, 0, 0.18);
  scene.add(bed);
  tag(bed, 'bedding');
  collide(3.55, 4.55, -0.1, 0.5);

  // ── 조명 ──
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xeaf4ff, emissiveIntensity: 2.2 });
  for (const tx of [-1.6, 1.4]) {
    box(1.2, 0.04, 0.12, M.white, tx, h - 0.03, -0.3);
    const tube = box(1.1, 0.025, 0.04, tubeMat, tx, h - 0.06, -0.3);
    tube.castShadow = false;
    const l = new THREE.PointLight(0xeef4ff, 5.5, 0, 1.6);
    l.position.set(tx, h - 0.15, -0.3);
    if (tx > 0) { l.castShadow = true; l.shadow.mapSize.set(512, 512); l.shadow.bias = -0.002; l.shadow.radius = 3; }
    scene.add(l);
  }
  const hemi = new THREE.HemisphereLight(0xfff4e0, 0x404038, 0.45);
  scene.add(hemi);
  // 오후 햇빛 (창과 문 유리로 들어옴)
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.6);
  sun.position.set(-3.5, 4.2, 8);
  sun.target.position.set(0.2, 0, 0.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 20 });
  sun.shadow.bias = -0.0015;
  scene.add(sun, sun.target);
  // 뒷방 백열등
  const bb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd08a, emissiveIntensity: 3 }));
  bb.position.set(4.9, h - 0.35, -1.0); scene.add(bb);
  const bl = new THREE.PointLight(0xffc98a, 4.5, 4.2, 1.6);
  bl.position.set(4.9, h - 0.45, -1.0);
  scene.add(bl);

  // 걸을 수 있는 구역
  const areas = [
    { x0, x1, z0, z1 },
    { x0: BACK.x0 - 0.05, x1: BACK.x1, z0: BACK.z0, z1: BACK.z1, open: () => refs.backOpenFn() },
    { x0: x1 - 0.7, x1: BACK.x0 + 0.7, z0: BACK_DOOR.z0 + 0.12, z1: BACK_DOOR.z1 - 0.12, open: () => refs.backOpenFn(), tight: true },
  ];

  return { refs, colliders, areas };
}
