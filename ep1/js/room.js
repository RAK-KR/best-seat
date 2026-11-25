// 사진관 2층 스튜디오와 암실을 만든다
import * as THREE from 'three';
import * as T from './textures.js';
import { makeCanvas, drawPortrait, drawClock, drawPhoto, drawChart } from './closeups.js';
import { BOTTLES } from './content.js';

export const ROOM = { x0: -3, x1: 3, z0: -2.5, z1: 2.5, h: 2.8 };
export const DARK = { x0: -3, x1: -0.8, z0: -4.5, z1: -2.5 };
export const DARK_DOOR = { x0: -2.3, x1: -1.5 };
export const PINHOLE = new THREE.Vector3(-2.93, 1.55, -0.3);
export const SEAT = new THREE.Vector3(1.4, 1.12, -0.3);

export function buildRoom(scene) {
  const refs = {};
  const colliders = [];
  const rough = T.roughnessNoise();

  const M = {
    floor: new THREE.MeshStandardMaterial({ map: T.floorTexture(), roughness: 0.78 }),
    wallpaper: new THREE.MeshStandardMaterial({ map: T.wallpaperTexture(), roughness: 0.92 }),
    plaster: new THREE.MeshStandardMaterial({ map: T.plasterTexture(), roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ map: T.ceilingTexture(), roughness: 1 }),
    wood: new THREE.MeshStandardMaterial({ map: T.woodTexture(3), roughness: 0.6, roughnessMap: rough }),
    darkWood: new THREE.MeshStandardMaterial({ map: T.woodTexture(9, [58, 36, 22]), roughness: 0.55 }),
    board: new THREE.MeshStandardMaterial({ map: T.roughBoardTexture(), roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ map: T.metalTexture(), roughness: 0.5, metalness: 0.6 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.3, metalness: 0.9 }),
    black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }),
    tape: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4 }),
    cloth: new THREE.MeshStandardMaterial({ map: T.clothTexture(), roughness: 1, side: THREE.DoubleSide }),
    rope: new THREE.MeshStandardMaterial({ color: 0xa88e64, roughness: 1 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.9 }),
    darkWall: new THREE.MeshStandardMaterial({ color: 0x1e1a18, roughness: 0.95 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.7 }),
  };
  const hitMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

  const add = (mesh, pos, parent = scene) => {
    mesh.position.copy(pos);
    mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (w, h, d, mat, x, y, z, parent) => add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), new THREE.Vector3(x, y, z), parent);
  const plane = (w, h, mat, x, y, z, ry = 0, rx = 0, parent) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.set(rx, ry, 0);
    return add(m, new THREE.Vector3(x, y, z), parent);
  };
  const hit = (id, w, h, d, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hitMat);
    m.position.set(x, y, z);
    m.userData.id = id;
    m.castShadow = false;
    parent.add(m);
    return m;
  };
  const tag = (obj, id) => { obj.traverse((o) => { o.userData.id = id; }); return obj; };
  const collide = (x0, x1, z0, z1, key) => colliders.push({ x0, x1, z0, z1, key });

  const { x0, x1, z0, z1, h } = ROOM;

  // ── 바닥·천장 ──
  const floorMat = M.floor.clone();
  floorMat.map = M.floor.map.clone(); floorMat.map.repeat.set(3, 3); floorMat.map.needsUpdate = true;
  plane(x1 - x0, z1 - z0, floorMat, 0, 0, 0, 0, -Math.PI / 2).castShadow = false;
  plane(x1 - x0, z1 - z0, M.ceiling, 0, h, 0, 0, Math.PI / 2).castShadow = false;
  const dw = DARK.x1 - DARK.x0, dd = DARK.z1 - DARK.z0;
  const dFloor = M.floor.clone(); dFloor.map = M.floor.map.clone(); dFloor.map.repeat.set(1.1, 1); dFloor.map.needsUpdate = true;
  plane(dw, dd, dFloor, (DARK.x0 + DARK.x1) / 2, 0, (DARK.z0 + DARK.z1) / 2, 0, -Math.PI / 2).castShadow = false;
  plane(dw, dd, M.darkWall, (DARK.x0 + DARK.x1) / 2, h, (DARK.z0 + DARK.z1) / 2, 0, Math.PI / 2).castShadow = false;

  // ── 벽 ──
  // 남쪽 (출입문)
  plane(x1 - x0, h, M.wallpaper, 0, h / 2, z1, Math.PI);
  // 서쪽 (창문)
  plane(z1 - z0, h, M.wallpaper, x0, h / 2, 0, Math.PI / 2);
  // 동쪽 (하얀 벽)
  const white = plane(z1 - z0, h, M.plaster, x1, h / 2, 0, -Math.PI / 2);
  tag(white, 'whiteWall');
  // 북쪽 (암실 문 자리를 비움)
  const nL = DARK_DOOR.x0 - x0, nR = x1 - DARK_DOOR.x1;
  plane(nL, h, M.wallpaper, x0 + nL / 2, h / 2, z0);
  plane(nR, h, M.wallpaper, DARK_DOOR.x1 + nR / 2, h / 2, z0);
  plane(DARK_DOOR.x1 - DARK_DOOR.x0, h - 2.05, M.wallpaper, (DARK_DOOR.x0 + DARK_DOOR.x1) / 2, 2.05 + (h - 2.05) / 2, z0);
  // 북쪽 벽 뒷면 (암실 쪽)
  plane(nL, h, M.darkWall, x0 + nL / 2, h / 2, z0 - 0.01, Math.PI);
  plane(DARK.x1 - DARK_DOOR.x1, h, M.darkWall, DARK_DOOR.x1 + (DARK.x1 - DARK_DOOR.x1) / 2, h / 2, z0 - 0.01, Math.PI);
  plane(DARK_DOOR.x1 - DARK_DOOR.x0, h - 2.05, M.darkWall, (DARK_DOOR.x0 + DARK_DOOR.x1) / 2, 2.05 + (h - 2.05) / 2, z0 - 0.01, Math.PI);
  // 암실 벽
  plane(dd, h, M.darkWall, DARK.x0 + 0.001, h / 2, (DARK.z0 + DARK.z1) / 2, Math.PI / 2);
  plane(dd, h, M.darkWall, DARK.x1, h / 2, (DARK.z0 + DARK.z1) / 2, -Math.PI / 2);
  plane(dw, h, M.darkWall, (DARK.x0 + DARK.x1) / 2, h / 2, DARK.z0);
  // 걸레받이
  box(x1 - x0, 0.1, 0.02, M.darkWood, 0, 0.05, z1 - 0.01);
  box(0.02, 0.1, z1 - z0, M.darkWood, x0 + 0.01, 0.05, 0);
  box(0.02, 0.1, z1 - z0, M.darkWood, x1 - 0.01, 0.05, 0);
  box(nR, 0.1, 0.02, M.darkWood, DARK_DOOR.x1 + nR / 2, 0.05, z0 + 0.01);
  box(nL, 0.1, 0.02, M.darkWood, x0 + nL / 2, 0.05, z0 + 0.01);

  // ── 출입문 ──
  const door = new THREE.Group();
  box(0.92, 2.05, 0.06, M.darkWood, 0, 1.025, 0, door);
  box(0.8, 0.85, 0.02, M.wood, 0, 1.5, -0.035, door);
  box(0.8, 0.85, 0.02, M.wood, 0, 0.55, -0.035, door);
  const handle = box(0.12, 0.03, 0.05, M.brass, -0.34, 1.0, -0.07, door);
  door.position.set(0.85, 0, z1 - 0.03);
  scene.add(door);
  tag(door, 'door');
  refs.door = door;
  box(1.04, 0.08, 0.08, M.darkWood, 0.85, 2.09, z1 - 0.04);
  box(0.06, 2.1, 0.08, M.darkWood, 0.36, 1.05, z1 - 0.04);
  box(0.06, 2.1, 0.08, M.darkWood, 1.34, 1.05, z1 - 0.04);
  // 번호판
  const kp = new THREE.Group();
  box(0.16, 0.22, 0.03, M.metal, 0, 0, 0, kp);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) box(0.032, 0.03, 0.012, M.black, -0.045 + c * 0.045, 0.06 - r * 0.042, -0.02, kp);
  kp.position.set(1.58, 1.3, z1 - 0.02);
  scene.add(kp);
  tag(kp, 'keypad');
  hit('keypad', 0.22, 0.28, 0.08, 1.58, 1.3, z1 - 0.04);
  // 전등 스위치
  const sw = new THREE.Group();
  box(0.08, 0.12, 0.015, M.paper, 0, 0, 0, sw);
  box(0.02, 0.04, 0.02, M.paper, 0, 0.01, -0.012, sw);
  sw.position.set(0.12, 1.3, z1 - 0.01);
  scene.add(sw);
  tag(sw, 'switch');
  hit('switch', 0.14, 0.18, 0.06, 0.12, 1.3, z1 - 0.03);

  // ── 서쪽: 판자로 막은 창문 + 놋쇠 마개 ──
  const win = new THREE.Group();
  box(0.06, 1.3, 1.16, M.darkWood, 0, 0, 0, win);
  for (let i = 0; i < 5; i++) {
    const b = box(0.04, 0.22, 1.08, M.board, 0.04, -0.5 + i * 0.245, (i % 2 ? 0.01 : -0.015), win);
    b.rotation.x = (i % 2 ? 0.01 : -0.012);
  }
  // 틈마다 붙인 검은 테이프
  for (let i = 0; i < 4; i++) box(0.005, 0.035, 1.1, M.tape, 0.065, -0.378 + i * 0.245, 0, win);
  box(0.005, 1.2, 0.035, M.tape, 0.065, 0, 0.53, win);
  box(0.005, 1.2, 0.035, M.tape, 0.065, 0, -0.53, win);
  // 못
  for (let i = 0; i < 5; i++) for (const zz of [-0.45, 0.45]) {
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8), M.metal);
    n.rotation.z = Math.PI / 2; n.position.set(0.065, -0.5 + i * 0.245, zz); win.add(n);
  }
  win.position.set(x0 + 0.03, PINHOLE.y, PINHOLE.z);
  scene.add(win);
  tag(win, 'window');
  // 마개 (가운데)
  const capG = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 12, 32), M.brass);
  ring.rotation.y = Math.PI / 2;
  capG.add(ring);
  const capDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.025, 32), M.brass);
  capDisc.rotation.z = Math.PI / 2; capDisc.position.x = 0.012;
  capG.add(capDisc);
  for (const a of [0, Math.PI]) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.01, 8), M.metal);
    s.rotation.z = Math.PI / 2; s.position.set(0.027, Math.sin(a) * 0.025, Math.cos(a) * 0.025); capG.add(s);
  }
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }));
  hole.rotation.y = Math.PI / 2; hole.position.x = 0.005; hole.visible = false;
  capG.add(hole);
  capG.position.set(x0 + 0.1, PINHOLE.y, PINHOLE.z);
  scene.add(capG);
  tag(capG, 'window');
  refs.capDisc = capDisc; refs.hole = hole;
  hit('window', 0.25, 1.3, 1.2, x0 + 0.1, PINHOLE.y, PINHOLE.z);

  // ── 책상 + 서랍 + 편지 ──
  const desk = new THREE.Group();
  box(0.65, 0.04, 1.3, M.wood, 0, 0.76, 0, desk);
  for (const [dx, dz] of [[-0.28, -0.6], [0.28, -0.6], [-0.28, 0.6], [0.28, 0.6]]) box(0.05, 0.74, 0.05, M.darkWood, dx, 0.37, dz, desk);
  box(0.6, 0.16, 1.2, M.darkWood, 0, 0.66, 0, desk);
  desk.position.set(x0 + 0.36, 0, 1.4);
  scene.add(desk);
  collide(x0, x0 + 0.72, 0.72, 2.08, 'desk');
  // 서랍 (앞으로 빠짐)
  const drawer = new THREE.Group();
  box(0.02, 0.13, 0.5, M.wood, 0, 0, 0, drawer);
  box(0.03, 0.025, 0.12, M.brass, 0.02, 0, 0, drawer);
  const lockFace = box(0.01, 0.05, 0.09, M.metal, 0.014, -0.045, 0.16, drawer);
  const inner = box(0.5, 0.1, 0.46, M.darkWood, -0.26, 0, 0, drawer);
  const l2 = box(0.18, 0.004, 0.24, M.paper, -0.25, 0.052, -0.05, drawer);
  l2.rotation.y = 0.2;
  const key = box(0.06, 0.008, 0.02, M.brass, -0.2, 0.054, 0.12, drawer);
  drawer.position.set(x0 + 0.69, 0.66, 1.4);
  scene.add(drawer);
  tag(drawer, 'drawer');
  refs.drawer = drawer; refs.drawerKey = key;
  hit('drawer', 0.12, 0.16, 0.55, x0 + 0.72, 0.66, 1.4);
  // 편지 1
  const l1 = box(0.2, 0.003, 0.28, M.paper, x0 + 0.42, 0.782, 1.25);
  l1.rotation.y = -0.25;
  tag(l1, 'letter1');
  hit('letter1', 0.3, 0.06, 0.35, x0 + 0.42, 0.8, 1.25);
  // 전구 빠진 스탠드
  const lamp = new THREE.Group();
  const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 20), M.brass); lb.position.y = 0.015; lamp.add(lb);
  const lp = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.35, 8), M.brass); lp.position.y = 0.19; lamp.add(lp);
  const ls = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.13, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x3d5a40, side: THREE.DoubleSide, roughness: 0.6 }));
  ls.position.set(0.04, 0.36, 0); ls.rotation.z = -0.4; lamp.add(ls);
  lamp.position.set(x0 + 0.25, 0.78, 1.85);
  lamp.traverse((o) => { o.castShadow = true; });
  scene.add(lamp);
  tag(lamp, 'lamp');
  // 시계 (유리 없음)
  const clockC = makeCanvas(512, 512);
  drawClock(clockC);
  const clockTex = T.canvasTexture(clockC);
  const clock = new THREE.Group();
  const cbody = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 40), M.darkWood);
  cbody.rotation.z = Math.PI / 2; clock.add(cbody);
  const cface = new THREE.Mesh(new THREE.CircleGeometry(0.225, 40), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.8, transparent: true }));
  cface.rotation.y = Math.PI / 2; cface.position.x = 0.026; clock.add(cface);
  clock.position.set(x0 + 0.03, 1.95, 1.4);
  scene.add(clock);
  tag(clock, 'clock');
  hit('clock', 0.12, 0.5, 0.5, x0 + 0.06, 1.95, 1.4);

  // ── 남쪽 벽: 손님 사진들 (할아버지 사진만 거꾸로) ──
  const portraits = [
    ['woman', -2.45, 1.75], ['child', -1.8, 1.75], ['grandpa', -1.15, 1.75],
    ['couple', -0.5, 1.75], ['man', -2.12, 1.15], ['child', -0.82, 1.15],
  ];
  portraits.forEach(([who, x, y], i) => {
    const pc = makeCanvas(256, 320);
    drawPortrait(pc, who, i + 2);
    const g = new THREE.Group();
    box(0.44, 0.54, 0.03, M.darkWood, 0, 0, 0, g);
    const pm = plane(0.36, 0.45, new THREE.MeshStandardMaterial({ map: T.canvasTexture(pc), roughness: 0.5 }), 0, 0, -0.017, Math.PI, 0, g);
    pm.castShadow = false;
    g.position.set(x, y, z1 - 0.03);
    if (who === 'grandpa') { g.rotation.z = Math.PI; refs.grandpaFrame = g; }
    else g.rotation.z = (i % 2 ? 0.015 : -0.02);
    scene.add(g);
    tag(g, who === 'grandpa' ? 'portraitGrandpa' : 'portraits');
  });

  // ── 의자 (하얀 벽을 향함) ──
  const chair = new THREE.Group();
  box(0.46, 0.05, 0.46, M.wood, 0, 0.46, 0, chair);
  for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) box(0.04, 0.46, 0.04, M.darkWood, dx, 0.23, dz, chair);
  box(0.04, 0.5, 0.42, M.wood, -0.21, 0.74, 0, chair);
  box(0.05, 0.06, 0.46, M.darkWood, -0.21, 1.0, 0, chair);
  chair.position.set(SEAT.x, 0, SEAT.z);
  scene.add(chair);
  tag(chair, 'chair');
  collide(SEAT.x - 0.28, SEAT.x + 0.28, SEAT.z - 0.28, SEAT.z + 0.28, 'chair');
  // 의자 다리 자리에 남은 바닥 자국 (오래 그 자리에 있었다)
  const mark = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false });
  for (const [dx, dz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), mark);
    m.rotation.x = -Math.PI / 2; m.position.set(SEAT.x + dx, 0.002, SEAT.z + dz); scene.add(m);
  }

  // ── 렌즈 빠진 대형 사진기 ──
  const cam = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 1.3, 8), M.darkWood);
    leg.position.set(Math.cos(a) * 0.22, 0.62, Math.sin(a) * 0.22);
    leg.rotation.set(Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32);
    cam.add(leg);
  }
  const camBody = new THREE.Group();
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.3), M.darkWood); back.position.x = -0.2; camBody.add(back);
  const bellows = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 0.24), M.leather); camBody.add(bellows);
  const front = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.27, 0.27), M.darkWood); front.position.x = 0.17; camBody.add(front);
  const lensHole = new THREE.Mesh(new THREE.CircleGeometry(0.055, 24), M.black); lensHole.position.x = 0.196; lensHole.rotation.y = Math.PI / 2; camBody.add(lensHole);
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), M.brass); lensRing.position.x = 0.197; lensRing.rotation.y = Math.PI / 2; camBody.add(lensRing);
  camBody.position.y = 1.38;
  cam.add(camBody);
  cam.position.set(-1.0, 0, -1.4);
  cam.rotation.y = -0.6;
  cam.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(cam);
  tag(cam, 'camera');
  collide(-1.3, -0.7, -1.7, -1.1, 'camera');

  // ── 배경천과 그 뒤의 퓨즈함 ──
  const fuse = new THREE.Group();
  box(0.42, 0.52, 0.12, M.metal, 0, 0, 0, fuse);
  const fuseDoor = new THREE.Group();
  box(0.4, 0.5, 0.02, M.metal, 0.2, 0, 0, fuseDoor);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20), M.black);
  dial.rotation.x = Math.PI / 2; dial.position.set(0.33, 0, 0.02); fuseDoor.add(dial);
  fuseDoor.position.set(-0.2, 0, 0.07);
  fuse.add(fuseDoor);
  const lever = new THREE.Group();
  const lb2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.04), M.black); lever.add(lb2);
  const lh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.03), new THREE.MeshStandardMaterial({ color: 0x8a1b14, roughness: 0.5 }));
  lh.position.set(0, 0.06, 0.04); lever.add(lh);
  lever.position.set(0, 0, 0.05);
  fuse.add(lever);
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12), new THREE.MeshStandardMaterial({ color: 0xd8d2c0, roughness: 0.4 }));
  plug.position.set(0.12, -0.14, 0.06);
  fuse.add(plug);
  fuse.position.set(1.45, 1.45, z0 + 0.07);
  fuse.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(fuse);
  tag(fuse, 'fusebox');
  refs.fuseDoor = fuseDoor; refs.fuseLever = lh; refs.fusePlug = plug;
  const fuseHit = hit('fusebox', 0.46, 0.56, 0.2, 1.45, 1.45, z0 + 0.1);
  refs.fuseHit = fuseHit;

  const stand = new THREE.Group();
  for (const sx of [0.5, 2.4]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.6, 8), M.metal);
    pole.position.set(sx, 1.3, z0 + 0.32); stand.add(pole);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.03, 16), M.metal);
    foot.position.set(sx, 0.015, z0 + 0.32); stand.add(foot);
  }
  const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.0, 16), M.darkWood);
  roller.rotation.z = Math.PI / 2; roller.position.set(1.45, 2.58, z0 + 0.32); stand.add(roller);
  stand.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(stand);
  const clothGeo = new THREE.PlaneGeometry(1.9, 2.5, 20, 1);
  const pos = clothGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.025);
  clothGeo.computeVertexNormals();
  clothGeo.translate(0, -1.25, 0);
  const cloth = new THREE.Mesh(clothGeo, M.cloth);
  cloth.position.set(1.45, 2.56, z0 + 0.34);
  cloth.castShadow = true; cloth.receiveShadow = true;
  cloth.userData.id = 'backdrop';
  scene.add(cloth);
  refs.cloth = cloth;
  collide(0.35, 2.55, z0, z0 + 0.48, 'backdrop');

  // ── 벽을 따라 맨 줄과 매듭 ──
  const ropeY = 0.95;
  const runs = [
    [[0.33, z1 - 0.06], [x0 + 0.06, z1 - 0.06], [x0 + 0.06, z0 + 0.06], [DARK_DOOR.x0 - 0.04, z0 + 0.06]],
    [[DARK_DOOR.x1 + 0.04, z0 + 0.06], [0.42, z0 + 0.06]],
  ];
  runs.forEach((run) => {
    const pts = [];
    for (let i = 0; i < run.length - 1; i++) {
      const [ax, az] = run[i], [bx, bz] = run[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const seg = Math.max(1, Math.round(len / 0.9));
      for (let s = 0; s < seg; s++) {
        for (let k = 0; k < 6; k++) {
          const t = (s + k / 6) / seg;
          const sag = Math.sin((k / 6) * Math.PI) * 0.035;
          pts.push(new THREE.Vector3(ax + (bx - ax) * t, ropeY - sag, az + (bz - az) * t));
        }
      }
    }
    pts.push(new THREE.Vector3(run[run.length - 1][0], ropeY, run[run.length - 1][1]));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 3, 0.009, 6, false), M.rope);
    tube.castShadow = true;
    tube.userData.id = 'rope';
    scene.add(tube);
    // 고리
    run.forEach(([rx, rz]) => {
      const hk = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12), M.metal);
      hk.position.set(rx, ropeY, rz); scene.add(hk);
    });
  });
  const knot = (id, x, z) => {
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), M.rope);
    k.scale.set(1, 0.8, 1); k.position.set(x, ropeY - 0.005, z); k.castShadow = true;
    k.userData.id = id; scene.add(k);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.004, 0.1, 6), M.rope);
    tail.position.set(x, ropeY - 0.06, z); tail.rotation.z = 0.2; tail.userData.id = id; scene.add(tail);
    hit(id, 0.16, 0.2, 0.16, x, ropeY, z);
  };
  knot('knotDesk', x0 + 0.06, 0.62);
  knot('knotDark', DARK_DOOR.x0 - 0.1, z0 + 0.06);
  knot('knotBackdrop', 0.38, z0 + 0.06);

  // ── 천장 전구 ──
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 6), M.black);
  cord.position.set(0, h - 0.2, 0.3); scene.add(cord);
  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.06, 12), M.black);
  socket.position.set(0, h - 0.42, 0.3); scene.add(socket);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd08a, emissiveIntensity: 3 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), bulbMat);
  bulb.position.set(0, h - 0.48, 0.3); scene.add(bulb);
  bulb.userData.id = 'bulb';
  const bulbLight = new THREE.PointLight(0xffc98a, 9, 0, 1.6);
  bulbLight.position.copy(bulb.position).add(new THREE.Vector3(0, -0.06, 0));
  bulbLight.castShadow = true;
  bulbLight.shadow.mapSize.set(1024, 1024);
  bulbLight.shadow.bias = -0.002;
  bulbLight.shadow.radius = 3;
  scene.add(bulbLight);
  refs.bulbMat = bulbMat; refs.bulbLight = bulbLight;

  // ── 암실 문 ──
  const dPivot = new THREE.Group();
  dPivot.position.set(DARK_DOOR.x0, 0, z0);
  const dDoor = new THREE.Group();
  box(0.8, 2.03, 0.05, M.darkWood, 0.4, 1.015, 0, dDoor);
  const sign = makeCanvas(256, 96);
  const sctx = sign.getContext('2d');
  sctx.fillStyle = '#7a1812'; sctx.fillRect(0, 0, 256, 96);
  sctx.fillStyle = '#f3e6cc'; sctx.font = 'bold 50px "Nanum Myeongjo", serif'; sctx.textAlign = 'center';
  sctx.fillText('암실', 128, 64);
  plane(0.3, 0.11, new THREE.MeshStandardMaterial({ map: T.canvasTexture(sign) }), 0.4, 1.6, 0.027, 0, 0, dDoor);
  box(0.04, 0.12, 0.05, M.brass, 0.72, 1.0, 0.04, dDoor);
  dPivot.add(dDoor);
  scene.add(dPivot);
  tag(dPivot, 'darkroomDoor');
  refs.darkPivot = dPivot;

  // ── 암실 내부 ──
  const counter = new THREE.Group();
  box(0.6, 0.06, 1.8, M.darkWood, 0, 0.88, 0, counter);
  box(0.56, 0.85, 1.76, M.darkWall, 0, 0.42, 0, counter);
  counter.position.set(DARK.x0 + 0.3, 0, -3.6);
  scene.add(counter);
  collide(DARK.x0, DARK.x0 + 0.62, DARK.z0, -2.66, 'counter');
  // 현상 접시 3개
  const trayCols = [0xd9d4c8, 0xc23a30, 0x3a5a8a];
  trayCols.forEach((col, i) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.42), new THREE.MeshStandardMaterial({ color: col, roughness: 0.4 }));
    t.position.set(DARK.x0 + 0.3, 0.935, -2.95 - i * 0.48); t.castShadow = true; scene.add(t);
    t.userData.id = 'trays';
    const liquid = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.05, metalness: 0.2 }));
    liquid.rotation.x = -Math.PI / 2; liquid.position.set(t.position.x, 0.95, t.position.z); scene.add(liquid);
    liquid.userData.id = 'trays';
  });
  // 선반과 병
  box(0.3, 0.03, 1.6, M.darkWood, DARK.x0 + 0.15, 1.5, -3.6);
  const bottleIds = [];
  BOTTLES.forEach((b, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 20), new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 }));
    body.position.y = 0.11; g.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.06, 16), body.material); neck.position.y = 0.25; g.add(neck);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.035, 16), M.black); cap.position.y = 0.295; g.add(cap);
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0605, 0.0605, 0.09, 20, 1, true, -0.9, 1.8), M.paper); label.position.y = 0.11; g.add(label);
    g.position.set(DARK.x0 + 0.15, 1.515, -3.0 - i * 0.38);
    g.rotation.y = Math.PI / 2;
    g.traverse((o) => { o.castShadow = true; o.userData.id = 'bottles'; });
    scene.add(g);
    bottleIds.push(g);
  });
  hit('bottles', 0.3, 0.4, 1.6, DARK.x0 + 0.15, 1.7, -3.6);
  // 공정표
  const chartC = makeCanvas(400, 520);
  drawChart(chartC);
  const chart = plane(0.42, 0.55, new THREE.MeshStandardMaterial({ map: T.canvasTexture(chartC), roughness: 0.9 }), -1.85, 1.55, DARK.z0 + 0.01);
  chart.userData.id = 'chart';
  // 건조줄과 사진
  const lineCurve = new THREE.LineCurve3(new THREE.Vector3(DARK.x0 + 0.05, 2.05, -3.75), new THREE.Vector3(DARK.x1 - 0.05, 2.05, -3.75));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 4, 0.004, 4, false), M.black));
  const photoC = makeCanvas(320, 240);
  drawPhoto(photoC);
  const photoBackC = makeCanvas(320, 240);
  drawPhoto(photoBackC, true);
  const photo = new THREE.Group();
  const pf = plane(0.24, 0.18, new THREE.MeshStandardMaterial({ map: T.canvasTexture(photoC), roughness: 0.4 }), 0, 0, 0.001, 0, 0, photo);
  const pb = plane(0.24, 0.18, new THREE.MeshStandardMaterial({ map: T.canvasTexture(photoBackC), roughness: 0.6 }), 0, 0, -0.001, Math.PI, 0, photo);
  pf.castShadow = pb.castShadow = false;
  box(0.02, 0.04, 0.012, M.wood, 0, 0.1, 0, photo);
  photo.position.set(-1.6, 1.94, -3.75);
  photo.rotation.x = 0.05;
  scene.add(photo);
  tag(photo, 'photo');
  hit('photo', 0.3, 0.26, 0.06, -1.6, 1.94, -3.75);
  // 편지 3
  const l3 = box(0.22, 0.003, 0.3, M.paper, DARK.x0 + 0.33, 0.913, -4.2);
  l3.rotation.y = 0.15;
  tag(l3, 'letter3');
  hit('letter3', 0.32, 0.06, 0.36, DARK.x0 + 0.33, 0.93, -4.2);
  // 필름 통 (시리즈 씨앗: 이 편 안에서는 풀리지 않는 유일한 소품)
  const can = new THREE.Group();
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 }));
  can.add(cb);
  const cl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 16), new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.5 }));
  cl.position.y = 0.028; can.add(cl);
  const ct = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.02, 16, 1, true), M.paper);
  can.add(ct);
  can.position.set(DARK.x0 + 0.09, 0.938, -4.42);
  can.traverse((o) => { o.castShadow = true; });
  scene.add(can);
  tag(can, 'canister');
  hit('canister', 0.09, 0.09, 0.09, DARK.x0 + 0.09, 0.94, -4.42);
  // 드라이버
  const sd = new THREE.Group();
  const sdh = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xc8a020, roughness: 0.4 }));
  sdh.rotation.z = Math.PI / 2; sd.add(sdh);
  const sds = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.11, 6), M.metal);
  sds.rotation.z = Math.PI / 2; sds.position.x = 0.1; sd.add(sds);
  sd.position.set(DARK.x0 + 0.45, 0.93, -3.95);
  sd.rotation.y = 0.8;
  scene.add(sd);
  tag(sd, 'screwdriver');
  refs.screwdriver = sd;
  hit('screwdriver', 0.25, 0.08, 0.25, DARK.x0 + 0.45, 0.94, -3.95);
  // 안전등
  const safeMat = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff2010, emissiveIntensity: 2 });
  const safe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), safeMat);
  safe.position.set(DARK.x1 - 0.05, 2.25, -3.5); scene.add(safe);
  const safeLight = new THREE.PointLight(0xff2a14, 2.4, 0, 1.6);
  safeLight.position.set(DARK.x1 - 0.2, 2.2, -3.5);
  scene.add(safeLight);
  refs.safeMat = safeMat; refs.safeLight = safeLight;

  // ── 하얀 벽에 맺히는 상 ──
  const projCanvas = makeCanvas(768, 480);
  const projTex = T.canvasTexture(projCanvas);
  const projMat = new THREE.MeshBasicMaterial({ map: projTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const proj = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 2.45), projMat);
  proj.position.set(x1 - 0.01, PINHOLE.y, PINHOLE.z);
  proj.rotation.y = -Math.PI / 2;
  proj.userData.id = 'whiteWall';
  scene.add(proj);
  refs.projCanvas = projCanvas; refs.projTex = projTex; refs.projMat = projMat;
  const projLight = new THREE.PointLight(0xe8dcc0, 0, 0, 1.8);
  projLight.position.set(x1 - 0.8, PINHOLE.y, PINHOLE.z);
  scene.add(projLight);
  refs.projLight = projLight;
  // 빛줄기 (먼지에 비친)
  const len = x1 - PINHOLE.x;
  const beamGeo = new THREE.ConeGeometry(1.25, len, 32, 1, true);
  beamGeo.rotateZ(Math.PI / 2);
  beamGeo.translate(len / 2, 0, 0);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0d0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.scale.set(1, 1, 1.55);
  beam.position.copy(PINHOLE);
  beam.raycast = () => {};
  scene.add(beam);
  refs.beamMat = beamMat;
  // 먼지
  const dustN = 260;
  const dg = new THREE.BufferGeometry();
  const dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    const t = Math.random();
    dp[i * 3] = PINHOLE.x + t * len;
    dp[i * 3 + 1] = PINHOLE.y + (Math.random() - 0.5) * 2 * t * 1.1;
    dp[i * 3 + 2] = PINHOLE.z + (Math.random() - 0.5) * 2 * t * 1.7;
  }
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 32;
  const dctx = dotC.getContext('2d');
  const dgr = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  dgr.addColorStop(0, 'rgba(255,255,255,1)'); dgr.addColorStop(1, 'rgba(255,255,255,0)');
  dctx.fillStyle = dgr; dctx.fillRect(0, 0, 32, 32);
  const dustMat = new THREE.PointsMaterial({ color: 0xfff3dc, size: 0.007, map: new THREE.CanvasTexture(dotC), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const dust = new THREE.Points(dg, dustMat);
  dust.raycast = () => {};
  scene.add(dust);
  refs.dust = dust; refs.dustMat = dustMat;

  // ── 조명 ──
  const hemi = new THREE.HemisphereLight(0xffe8c8, 0x302418, 0.35);
  scene.add(hemi);
  refs.hemi = hemi;

  return { refs, colliders };
}
