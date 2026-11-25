// 새마을 정미소: 길가, 마당, 정미소 안, 사무실
import * as THREE from 'three';
import { makeKit, commonMats } from '../../shared/build.js';
import * as T from '../../shared/textures.js';
import { makeCanvas, drawPortrait } from '../../shared/draw.js';
import { drawFence, drawStudio, drawCalendar2008 } from './draw.js';

export const MILL = { x0: -4, x1: 4, z0: -3, z1: 3, h: 4.0 };
export const OFFICE = { x0: -4, x1: -0.6, z0: -6, z1: -3, h: 3.0 };
export const ODOOR = { x0: -2.6, x1: -1.8 };
export const SIDE = { x0: 2.6, x1: 3.4 };
export const SHUT = { x0: -1.6, x1: 1.6, h: 2.8 };
export const GATE = { x0: 2.4, x1: 3.4 };

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = commonMats();
  const refs = {};
  scene.background = new THREE.Color(0x9cc0dc);
  const concrete = K.std({ map: T.plasterTexture(), color: 0xa8a49a, roughness: 1 });
  const asphalt = K.std({ map: T.plasterTexture(), color: 0x55524c, roughness: 1 });
  const ext = K.std({ map: T.paintTexture('#bdb3a0', 97), roughness: 0.95 });
  const blockC = makeCanvas(512, 256);
  { const c = blockC.getContext('2d'); c.fillStyle = '#9a958a'; c.fillRect(0, 0, 512, 256); c.strokeStyle = 'rgba(60,55,48,0.4)'; c.lineWidth = 2; for (let y = 0; y < 256; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); for (let x = (y / 32) % 2 * 32; x < 512; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } } }
  const block = K.std({ map: K.tex(blockC), roughness: 1 });
  block.map.wrapS = block.map.wrapT = THREE.RepeatWrapping;
  const millWall = K.std({ map: T.paintTexture('#8a8270', 99), roughness: 1 });
  const woodPlank = K.std({ map: T.roughBoardTexture(), roughness: 0.9 });

  // ── 길가와 마당 ──
  K.floor(-6, 6, 6, 9, K.repeat(asphalt, 4, 1));
  K.floor(-4, 4, 3, 6, K.repeat(concrete, 3, 1));
  // 이웃 담 (양옆)
  for (const sx of [-4, 4]) {
    K.wall(3, 7.6, 0, 2.6, sx, sx < 0 ? 'e' : 'w', block);
  }
  // 담 (안쪽 면은 블록, 바깥 면은 페인트 글씨)
  const fz = 6;
  K.box(GATE.x0 + 4, 1.9, 0.18, block, (-4 + GATE.x0) / 2, 0.95, fz);
  K.box(4 - GATE.x1, 1.9, 0.18, block, (GATE.x1 + 4) / 2, 0.95, fz);
  const fc = makeCanvas(1600, 480); drawFence(fc);
  K.tag(K.canvasPlane(fc, GATE.x0 + 4, 1.9, (-4 + GATE.x0) / 2, 0.95, fz + 0.092, 0, 0.95), 'fence');
  K.collide(-4, GATE.x0, fz - 0.12, fz + 0.12);
  K.collide(GATE.x1, 4, fz - 0.12, fz + 0.12);
  // 우편함 (대문 기둥)
  const mb = new THREE.Group();
  K.box(0.28, 0.36, 0.16, K.std({ color: 0xb0302a, roughness: 0.5 }), 0, 0, 0, mb);
  K.box(0.2, 0.02, 0.01, M.black, 0, 0.08, 0.085, mb);
  mb.position.set(GATE.x0 - 0.2, 1.45, fz + 0.18); scene.add(mb); K.tag(mb, 'mailbox');
  // 맞은편 사진관 건물
  const sc = makeCanvas(1200, 1100); drawStudio(sc);
  const studio = new THREE.Mesh(new THREE.PlaneGeometry(11, 10), new THREE.MeshBasicMaterial({ map: K.tex(sc) }));
  studio.position.set(0, 4.4, 10.5); studio.rotation.y = Math.PI; studio.userData.id = 'studio'; scene.add(studio);
  K.hit('studio', 8, 6, 0.05, 0, 3, 7.75);

  // ── 정미소 건물 바깥 (마당 쪽 면) ──
  K.wall(-4, SHUT.x0, 0, MILL.h, MILL.z1 + 0.01, 'n', ext);
  K.wall(SHUT.x1, SIDE.x0, 0, MILL.h, MILL.z1 + 0.01, 'n', ext);
  K.wall(SIDE.x1, 4, 0, MILL.h, MILL.z1 + 0.01, 'n', ext);
  K.wall(SHUT.x0, SHUT.x1, SHUT.h, MILL.h, MILL.z1 + 0.01, 'n', ext);
  K.wall(SIDE.x0, SIDE.x1, 2.1, MILL.h, MILL.z1 + 0.01, 'n', ext);
  const signC = makeCanvas(1024, 160);
  { const c = signC.getContext('2d'); c.fillStyle = '#3c5a6e'; c.fillRect(0, 0, 1024, 160); c.fillStyle = '#efe6cf'; c.font = 'bold 96px "Nanum Myeongjo", serif'; c.textAlign = 'center'; c.fillText('새마을 정미소', 512, 118); }
  K.canvasPlane(signC, 3.6, 0.56, 0, 3.35, MILL.z1 + 0.04, 0);
  // 셔터 (양면)
  const shutC = makeCanvas(256, 512);
  { const c = shutC.getContext('2d'); for (let y = 0; y < 512; y += 16) { c.fillStyle = y % 32 ? '#8a8a84' : '#6e6e68'; c.fillRect(0, y, 256, 16); } }
  const shutMat = K.std({ map: K.tex(shutC), roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide });
  const shutter = new THREE.Mesh(new THREE.PlaneGeometry(SHUT.x1 - SHUT.x0, SHUT.h), shutMat);
  shutter.geometry.translate(0, -SHUT.h / 2, 0);
  shutter.position.set(0, SHUT.h, MILL.z1); shutter.castShadow = true; shutter.userData.id = 'shutter';
  scene.add(shutter); refs.shutter = shutter;
  K.collide(SHUT.x0, SHUT.x1, MILL.z1 - 0.05, MILL.z1 + 0.05, () => ctx.S.shutterUp);
  // 옆문
  refs.sideDoor = K.door(SIDE.x0, MILL.z1, 'x', SIDE.x1 - SIDE.x0, woodPlank, 'sideDoor', M.brass);
  K.hit('sideDoor', SIDE.x1 - SIDE.x0, 2.0, 0.08, (SIDE.x0 + SIDE.x1) / 2, 1.0, MILL.z1);

  // ── 정미소 안 ──
  K.floor(MILL.x0, MILL.x1, MILL.z0, MILL.z1, K.repeat(concrete, 3, 3), 0.002);
  K.ceiling(MILL.x0, MILL.x1, MILL.z0, MILL.z1, woodPlank, MILL.h);
  const iw = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, millWall);
  iw(MILL.z0, MILL.z1, 0, MILL.h, MILL.x0 + 0.01, 'e');
  iw(MILL.z0, MILL.z1, 0, MILL.h, MILL.x1 - 0.01, 'w');
  iw(MILL.x0, ODOOR.x0, 0, MILL.h, MILL.z0, 'n');
  iw(ODOOR.x1, MILL.x1, 0, MILL.h, MILL.z0, 'n');
  iw(ODOOR.x0, ODOOR.x1, 2.05, MILL.h, MILL.z0, 'n');
  iw(-4, SHUT.x0, 0, MILL.h, MILL.z1 - 0.01, 's');
  iw(SHUT.x1, SIDE.x0, 0, MILL.h, MILL.z1 - 0.01, 's');
  iw(SIDE.x1, 4, 0, MILL.h, MILL.z1 - 0.01, 's');
  iw(SHUT.x0, SHUT.x1, SHUT.h, MILL.h, MILL.z1 - 0.01, 's');
  iw(SIDE.x0, SIDE.x1, 2.1, MILL.h, MILL.z1 - 0.01, 's');
  // 정미기
  const mach = new THREE.Group();
  const green = K.std({ color: 0x3a6a4a, roughness: 0.5, metalness: 0.4 });
  K.box(1.6, 1.4, 1.2, green, 0, 0.7, 0, mach);
  const hopper = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.15, 0.9, 4, 1, true), K.std({ color: 0x5a7a5a, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide }));
  hopper.position.set(0, 1.85, 0); hopper.rotation.y = Math.PI / 4; mach.add(hopper);
  K.box(0.3, 0.3, 1.6, M.metal, 0.9, 1.1, 0.4, mach).rotation.x = 0.3;
  K.cyl(0.25, 0.25, 0.1, M.black, -0.85, 0.9, 0.3, mach, 24).rotation.z = Math.PI / 2;
  mach.position.set(1.4, 0, -1.3); scene.add(mach); K.tag(mach, 'machine');
  K.collide(0.5, 2.4, -2.0, -0.6);
  // 쌀 포대
  const sackMat = K.std({ color: 0xe0d4b4, roughness: 1 });
  for (let i = 0; i < 24; i++) {
    const col = i % 4, row = Math.floor(i / 4) % 3, lay = Math.floor(i / 12);
    const s = K.box(0.5, 0.28, 0.7, sackMat, -3.6 + lay * 0.55, 0.15 + row * 0.29, -1.2 + col * 0.72);
    s.rotation.y = (i % 3 - 1) * 0.05;
  }
  K.tag(K.hit('sacks', 1.1, 0.95, 2.9, -3.32, 0.5, -0.12), 'sacks');
  K.collide(-4, -2.75, -1.6, 1.5);
  // 저울과 장부 책상
  const scale = new THREE.Group();
  K.box(0.7, 0.12, 0.7, M.metal, 0, 0.06, 0, scale);
  K.box(0.08, 1.1, 0.08, M.metal, 0, 0.6, -0.3, scale);
  const dial = K.cyl(0.18, 0.18, 0.05, M.white, 0, 1.2, -0.28, scale, 24); dial.rotation.x = Math.PI / 2;
  scale.position.set(-1.1, 0, 1.9); scene.add(scale); K.tag(scale, 'scale');
  K.collide(-1.5, -0.7, 1.5, 2.3);
  const desk = new THREE.Group();
  K.box(1.0, 0.05, 0.55, M.wood, 0, 0.8, 0, desk);
  K.box(0.95, 0.78, 0.5, M.darkWood, 0, 0.39, 0, desk);
  desk.position.set(-2.8, 0, 2.6); scene.add(desk);
  K.collide(-3.32, -2.28, 2.3, 3.0);
  const led = K.box(0.3, 0.04, 0.4, K.std({ color: 0x5a3a24 }), -2.85, 0.845, 2.6);
  K.tag(led, 'ledger'); K.hit('ledger', 0.36, 0.1, 0.44, -2.85, 0.86, 2.6);
  // 두꺼비집 (전기)
  const bx = new THREE.Group();
  K.box(0.35, 0.45, 0.1, M.metal, 0, 0, 0, bx);
  const lev = K.box(0.05, 0.16, 0.05, K.std({ color: 0x8a1b14 }), 0, 0, 0.07, bx);
  bx.position.set(MILL.x1 - 0.06, 1.5, 1.8); bx.rotation.y = -Math.PI / 2; scene.add(bx); K.tag(bx, 'breaker');
  refs.breakerLever = lev;
  // 셔터 단추
  const sb = new THREE.Group();
  K.box(0.12, 0.2, 0.06, K.std({ color: 0xe0c040, roughness: 0.5 }), 0, 0, 0, sb);
  K.box(0.05, 0.05, 0.03, K.std({ color: 0x2a8a2a }), 0, 0.04, 0.04, sb);
  K.box(0.05, 0.05, 0.03, K.std({ color: 0x8a2a2a }), 0, -0.04, 0.04, sb);
  sb.position.set(SHUT.x1 + 0.3, 1.3, MILL.z1 - 0.05); sb.rotation.y = Math.PI; scene.add(sb); K.tag(sb, 'shutterSwitch');
  // 강 할머니와 할아버지 사진
  const pc = makeCanvas(300, 380); drawPortrait(pc, 'couple', 61);
  K.tag(K.canvasPlane(pc, 0.4, 0.5, -2.8, 1.7, MILL.z1 - 0.02, Math.PI, 0.5), 'photo');
  // 공장 등
  refs.lamps = [];
  for (const lx of [-1.5, 1.5]) {
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 20, 1, true), K.std({ color: 0x3a4a3a, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }));
    shade.position.set(lx, 3.3, 0); scene.add(shade);
    const bm = K.std({ color: 0xfff1d0, emissive: 0xffd08a, emissiveIntensity: 0 });
    K.sphere(0.06, bm, lx, 3.22, 0).castShadow = false;
    const l = K.pointLight(0xffd8a0, 0, lx, 3.1, 0, lx > 0, 1024);
    refs.lamps.push({ bm, l });
  }
  refs.dimLight = K.pointLight(0xa0b0c0, 0.6, 0, 2.5, 1.5);

  // ── 사무실 ──
  const O = OFFICE;
  K.floor(O.x0, O.x1, O.z0, O.z1, M.lino, 0.003);
  K.ceiling(O.x0, O.x1, O.z0, O.z1, M.ceiling, O.h);
  const ow = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, M.wallpaper);
  ow(O.x0, O.x1, 0, O.h, O.z0, 'n');
  ow(O.z0, O.z1, 0, O.h, O.x0 + 0.01, 'e');
  ow(O.z0, O.z1, 0, O.h, O.x1, 'w');
  ow(O.x0, ODOOR.x0, 0, O.h, O.z1 - 0.01, 's'); ow(ODOOR.x1, O.x1, 0, O.h, O.z1 - 0.01, 's'); ow(ODOOR.x0, ODOOR.x1, 2.05, O.h, O.z1 - 0.01, 's');
  refs.officeDoor = K.door(ODOOR.x0, MILL.z0, 'x', ODOOR.x1 - ODOOR.x0, woodPlank, 'officeDoor', M.brass);
  // 책상 + 라이트박스 + 서랍
  const od = new THREE.Group();
  K.box(1.3, 0.05, 0.7, M.wood, 0, 0.78, 0, od);
  K.box(1.25, 0.76, 0.65, M.darkWood, 0, 0.38, 0, od);
  const drawer = K.box(0.5, 0.14, 0.04, M.wood, 0.3, 0.62, 0.34, od);
  od.position.set(-2.3, 0, O.z0 + 0.7); scene.add(od);
  K.collide(-2.98, -1.62, O.z0 + 0.33, O.z0 + 1.07);
  K.tag(K.hit('drawer', 0.55, 0.2, 0.2, -2.0, 0.62, O.z0 + 1.07), 'drawer');
  refs.drawer = drawer;
  const lbMat = K.std({ color: 0xffffff, emissive: 0xfff8e8, emissiveIntensity: 0.15, roughness: 0.3 });
  const lb = new THREE.Group();
  K.box(0.7, 0.06, 0.45, M.metal, 0, 0, 0, lb);
  K.box(0.64, 0.01, 0.39, lbMat, 0, 0.035, 0, lb);
  lb.position.set(-2.45, 0.84, O.z0 + 0.65); scene.add(lb); K.tag(lb, 'lightbox');
  refs.lbMat = lbMat;
  // 전화기
  const ph = K.box(0.2, 0.09, 0.22, K.std({ color: 0x1a1a1a, roughness: 0.4 }), -1.8, 0.85, O.z0 + 0.6);
  K.tag(ph, 'phone');
  // 금고 (시계 다이얼)
  const safe = new THREE.Group();
  K.box(0.7, 0.85, 0.6, K.std({ color: 0x2a3a3a, roughness: 0.4, metalness: 0.6 }), 0, 0.425, 0, safe);
  const sd = new THREE.Group();
  K.box(0.62, 0.75, 0.04, K.std({ color: 0x334444, roughness: 0.35, metalness: 0.7 }), 0.31, 0, 0, sd);
  const face = K.cyl(0.11, 0.11, 0.03, M.white, 0.31, 0.12, 0.03, sd, 32); face.rotation.x = Math.PI / 2;
  K.box(0.12, 0.03, 0.04, M.brass, 0.5, -0.15, 0.03, sd);
  const sdp = new THREE.Group(); sdp.position.set(-0.31, 0.43, 0.31); sdp.add(sd); safe.add(sdp);
  safe.position.set(-0.95, 0, O.z0 + 0.45); scene.add(safe); K.tag(safe, 'safe');
  K.collide(-1.32, -0.58, O.z0, O.z0 + 0.8);
  refs.safeDoor = sdp;
  // 달력 (2008년 8월)
  const cc = makeCanvas(400, 520); drawCalendar2008(cc);
  K.tag(K.canvasPlane(cc, 0.4, 0.52, O.x0 + 0.02, 1.65, -4.4, Math.PI / 2, 0.9), 'calendar');
  refs.officeBulb = K.bulb(-2.3, O.h - 0.35, -4.4, 0xffd08a, 0, false);

  // ── 해 ──
  scene.add(new THREE.HemisphereLight(0xdbe8f4, 0x6a6050, 0.55));
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.8);
  sun.position.set(-6, 7, 12); sun.target.position.set(0, 0, 3);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 30 });
  sun.shadow.bias = -0.0015;
  scene.add(sun, sun.target);

  const S = ctx.S;
  const areas = [
    { x0: -4, x1: 4, z0: 6, z1: 7.6 },
    { x0: -4, x1: 4, z0: 3.02, z1: 6.0 },
    { x0: GATE.x0 + 0.1, x1: GATE.x1 - 0.1, z0: 5.5, z1: 6.5, tight: true },
    { x0: MILL.x0, x1: MILL.x1, z0: MILL.z0, z1: MILL.z1 - 0.02, open: () => S.millOpen },
    { x0: SIDE.x0 + 0.1, x1: SIDE.x1 - 0.1, z0: MILL.z1 - 0.6, z1: MILL.z1 + 0.6, open: () => S.millOpen, tight: true },
    { x0: SHUT.x0 + 0.1, x1: SHUT.x1 - 0.1, z0: MILL.z1 - 0.6, z1: MILL.z1 + 0.6, open: () => S.shutterUp, tight: true },
    { x0: O.x0, x1: O.x1, z0: O.z0, z1: O.z1 + 0.02, open: () => S.officeOpen },
    { x0: ODOOR.x0 + 0.1, x1: ODOOR.x1 - 0.1, z0: O.z1 - 0.6, z1: MILL.z0 + 0.6, open: () => S.officeOpen, tight: true },
  ];
  return { refs, colliders: K.colliders, areas };
}
