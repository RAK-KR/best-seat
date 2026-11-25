// 청춘다방 홀과 주방
import * as THREE from 'three';
import { makeKit, commonMats } from '../../shared/build.js';
import * as T from '../../shared/textures.js';
import { makeCanvas, drawNote, drawPortrait } from '../../shared/draw.js';
import { drawBoard, drawMenu, drawRecipe } from './draw.js';

export const HALL = { x0: -4, x1: 4, z0: -3, z1: 3, h: 2.8 };
export const KIT = { x0: -3.5, x1: 0.5, z0: -5.6, z1: -3 };
export const KDOOR = { x0: -2.6, x1: -1.8 };
export const BOOTH = { x0: 2.4, x1: 4, z0: -3, z1: -1.5, dx0: 2.6, dx1: 3.3 };

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = commonMats();
  const refs = {};
  const { x0, x1, z0, z1, h } = HALL;
  const velvet = K.std({ color: 0x7a1a22, roughness: 0.85 });
  const panel = K.std({ map: T.woodTexture(21, [86, 52, 30]), roughness: 0.6 });
  const floralC = makeCanvas(512, 512);
  {
    const c = floralC.getContext('2d');
    c.fillStyle = '#d9c4a0'; c.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) for (let x = (y / 64) % 2 * 32; x < 512; x += 64) {
      c.fillStyle = 'rgba(160,70,60,0.35)';
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.beginPath(); c.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7, 4, a, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(200,150,60,0.5)'; c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill();
      c.strokeStyle = 'rgba(80,110,60,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 10, y + 10); c.quadraticCurveTo(x + 22, y + 20, x + 30, y + 14); c.stroke();
    }
  }
  const floral = K.std({ map: K.tex(floralC), roughness: 0.9 });
  floral.map.wrapS = floral.map.wrapT = THREE.RepeatWrapping;

  // ── 바닥·천장 ──
  const wf = K.repeat(M.floor, 4, 3);
  K.floor(x0, x1, z0, z1, wf);
  K.ceiling(x0, x1, z0, z1, M.ceiling, h);
  K.floor(KIT.x0, KIT.x1, KIT.z0, KIT.z1, M.lino);
  K.ceiling(KIT.x0, KIT.x1, KIT.z0, KIT.z1, M.ceiling, h);

  // ── 홀 벽 (아래 나무 판벽, 위 꽃무늬 벽지) ──
  const W = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, floral, panel, 1.0);
  // 남쪽: 창문 두 개 (x -3~-1, 0.5~2.5 / y 1.0~2.2)
  W(x0, -3, 0, h, z1, 's'); W(-1, 0.5, 0, h, z1, 's'); W(2.5, x1, 0, h, z1, 's');
  for (const [a, b] of [[-3, -1], [0.5, 2.5]]) { W(a, b, 0, 1.0, z1, 's'); W(a, b, 2.2, h, z1, 's'); }
  // 서쪽: 출입문 z 1.6~2.5
  W(z0, 1.6, 0, h, x0, 'e'); W(2.5, z1, 0, h, x0, 'e'); W(1.6, 2.5, 2.1, h, x0, 'e');
  // 동쪽
  W(z0, z1, 0, h, x1, 'w');
  // 북쪽: 주방 문 x -2.6~-1.8
  W(x0, KDOOR.x0, 0, h, z0, 'n'); W(KDOOR.x1, x1, 0, h, z0, 'n'); W(KDOOR.x0, KDOOR.x1, 2.05, h, z0, 'n');
  // 주방 벽
  const kw = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, M.plaster, M.tile, 1.2);
  kw(KIT.x0, KIT.x1, 0, h, KIT.z0, 'n');
  kw(KIT.z0, KIT.z1, 0, h, KIT.x0, 'e');
  kw(KIT.z0, KIT.z1, 0, h, KIT.x1, 'w');
  kw(KIT.x0, KDOOR.x0, 0, h, KIT.z1 - 0.01, 's'); kw(KDOOR.x1, KIT.x1, 0, h, KIT.z1 - 0.01, 's'); kw(KDOOR.x0, KDOOR.x1, 2.05, h, KIT.z1 - 0.01, 's');

  // ── 창밖 (2층에서 내려다본 맞은편 거리) ──
  const out = makeCanvas(1400, 600);
  {
    const c = out.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, '#9cc0dc'); sky.addColorStop(1, '#f1e6c8');
    c.fillStyle = sky; c.fillRect(0, 0, 1400, 600);
    const shops = [['빛나 사진관', '#3d5a6e', 60], ['명수 이발소', '#2f4a3a', 380], ['새마을 정미소', '#5a4a3a', 700], ['중앙극장', '#6e2a2a', 1030]];
    shops.forEach(([name, col, x]) => {
      c.fillStyle = '#b9ad98'; c.fillRect(x, 110, 290, 360);
      c.fillStyle = '#8f8473'; for (let k = 0; k < 3; k++) c.fillRect(x + 20 + k * 90, 150, 60, 80);
      c.fillStyle = col; c.fillRect(x + 20, 270, 250, 50);
      c.fillStyle = '#efe6cf'; c.font = 'bold 30px serif'; c.textAlign = 'center'; c.fillText(name, x + 145, 306);
    });
    c.fillStyle = '#7a7468'; c.fillRect(0, 470, 1400, 130);
  }
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshBasicMaterial({ map: K.tex(out) }));
  outside.position.set(0, 0.8, z1 + 5); outside.rotation.y = Math.PI; scene.add(outside);
  for (const [a, b] of [[-3, -1], [0.5, 2.5]]) {
    const cx = (a + b) / 2;
    K.box(b - a + 0.08, 0.06, 0.14, M.darkWood, cx, 1.0, z1 - 0.04);
    K.box(b - a + 0.08, 0.06, 0.14, M.darkWood, cx, 2.2, z1 - 0.04);
    K.box(0.05, 1.2, 0.1, M.darkWood, cx, 1.6, z1 - 0.03);
    K.plane(b - a, 1.2, M.glass, cx, 1.6, z1, Math.PI).castShadow = false;
    // 레이스 커튼 (양옆으로 묶음)
    const lace = K.std({ color: 0xf4efe2, roughness: 1, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    K.plane(0.35, 1.3, lace, a + 0.2, 1.6, z1 - 0.12, Math.PI);
    K.plane(0.35, 1.3, lace, b - 0.2, 1.6, z1 - 0.12, Math.PI);
  }
  K.tag(K.hit('window', 4.2, 1.2, 0.2, -0.25, 1.6, z1 - 0.15), 'window');

  // ── 출입문 ──
  const door = K.door(x0 + 0.03, 2.5, 'z', 0.9, M.darkWood, 'entrance', M.brass);
  refs.door = door;

  // ── 탁자와 소파 ──
  function table(x, z, glassTop = true) {
    const g = new THREE.Group();
    K.cyl(0.05, 0.05, 0.68, M.black, 0, 0.34, 0, g, 12);
    K.cyl(0.25, 0.28, 0.03, M.black, 0, 0.015, 0, g, 24);
    K.box(0.8, 0.04, 0.8, M.darkWood, 0, 0.7, 0, g);
    if (glassTop) { const gl = K.box(0.82, 0.012, 0.82, K.std({ color: 0xcfe0e0, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 0.728, 0, g); gl.castShadow = false; }
    g.position.set(x, 0, z); scene.add(g);
    K.collide(x - 0.42, x + 0.42, z - 0.42, z + 0.42);
    return g;
  }
  function armchair(x, z, ry) {
    const g = new THREE.Group();
    K.box(0.62, 0.42, 0.6, velvet, 0, 0.21, 0, g);
    K.box(0.62, 0.55, 0.14, velvet, 0, 0.62, 0.24, g);
    K.box(0.12, 0.25, 0.6, velvet, -0.28, 0.52, 0, g);
    K.box(0.12, 0.25, 0.6, velvet, 0.28, 0.52, 0, g);
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    K.collide(x - 0.33, x + 0.33, z - 0.33, z + 0.33);
    return g;
  }
  // 윤 씨 자리 (창가)
  const seat = table(1.5, 2.3);
  K.tag(seat, 'seat');
  K.tag(armchair(0.82, 2.3, -Math.PI / 2), 'seat');
  K.tag(armchair(2.18, 2.3, Math.PI / 2), 'seat');
  const cupMat = K.std({ color: 0xf4f1ea, roughness: 0.3 });
  const cupA = new THREE.Group();
  K.cyl(0.075, 0.075, 0.01, cupMat, 0, 0, 0, cupA);
  K.cyl(0.04, 0.032, 0.06, cupMat, 0, 0.035, 0, cupA, 16);
  K.cyl(0.036, 0.036, 0.002, K.std({ color: 0x1a0d05 }), 0, 0.064, 0, cupA, 16);
  cupA.position.set(1.28, 0.74, 2.3); scene.add(cupA); K.tag(cupA, 'cupA');
  K.hit('cupA', 0.16, 0.12, 0.16, 1.28, 0.78, 2.3);
  const cupB = new THREE.Group();
  K.cyl(0.042, 0.04, 0.09, K.std({ color: 0xe8d0a0, roughness: 0.4 }), 0, 0.045, 0, cupB, 16);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.006, 6, 12), K.std({ color: 0xe8d0a0 }));
  hd.position.set(0.05, 0.05, 0); cupB.add(hd);
  K.cyl(0.038, 0.038, 0.002, K.std({ color: 0xb08a5a }), 0, 0.088, 0, cupB, 16);
  cupB.position.set(1.72, 0.74, 2.3); scene.add(cupB); K.tag(cupB, 'cupB');
  K.hit('cupB', 0.16, 0.14, 0.16, 1.72, 0.79, 2.3);
  const signC = makeCanvas(300, 140);
  { const c = signC.getContext('2d'); c.fillStyle = '#f4ecd6'; c.fillRect(0, 0, 300, 140); c.fillStyle = '#7a1a22'; c.font = 'bold 42px "Nanum Myeongjo", serif'; c.textAlign = 'center'; c.fillText('예 약', 150, 58); c.font = '30px "Nanum Myeongjo", serif'; c.fillText('12시 · 두 분', 150, 108); }
  const sign = new THREE.Group();
  K.canvasPlane(signC, 0.16, 0.075, 0, 0.04, 0.012, 0, 0.8, sign);
  K.canvasPlane(signC, 0.16, 0.075, 0, 0.04, -0.012, Math.PI, 0.8, sign);
  sign.position.set(1.5, 0.735, 2.42); scene.add(sign); K.tag(sign, 'seat');
  // 다른 자리들
  table(-2.0, 2.2, false); armchair(-2.68, 2.2, -Math.PI / 2); armchair(-1.32, 2.2, Math.PI / 2);
  table(-1.9, -0.6, false); armchair(-2.58, -0.6, -Math.PI / 2); armchair(-1.22, -0.6, Math.PI / 2);
  table(1.0, -0.2, false); armchair(0.32, -0.2, -Math.PI / 2); armchair(1.68, -0.2, Math.PI / 2);

  // ── 계산대 ──
  K.box(3.2, 1.0, 0.6, panel, 0.2, 0.5, z0 + 0.95);
  K.box(3.3, 0.05, 0.7, M.marble, 0.2, 1.02, z0 + 0.95);
  K.collide(-1.45, 1.85, z0 + 0.6, z0 + 1.3);
  // 뒤 선반의 잔들
  K.box(3.0, 0.03, 0.25, M.darkWood, 0.2, 1.5, z0 + 0.13);
  K.box(3.0, 0.03, 0.25, M.darkWood, 0.2, 1.85, z0 + 0.13);
  for (let i = 0; i < 12; i++) K.cyl(0.035, 0.03, 0.07, cupMat, -1.1 + i * 0.24, 1.55 + (i % 2) * 0.35, z0 + 0.13, scene, 12);
  // 금전 등록기
  const reg = new THREE.Group();
  K.box(0.36, 0.2, 0.32, K.std({ color: 0x6a6a5a, roughness: 0.4, metalness: 0.5 }), 0, 0.1, 0, reg);
  K.box(0.3, 0.12, 0.05, M.black, 0, 0.26, -0.1, reg);
  const drawer = K.box(0.32, 0.06, 0.3, M.metal, 0, 0.0, 0.02, reg);
  reg.position.set(1.35, 1.05, z0 + 0.95); scene.add(reg); K.tag(reg, 'register');
  K.hit('register', 0.42, 0.36, 0.4, 1.35, 1.2, z0 + 1.0);
  refs.regDrawer = drawer;
  // 전화기 + 자동응답기
  const phone = new THREE.Group();
  K.box(0.2, 0.08, 0.22, K.std({ color: 0x8a1a1a, roughness: 0.4 }), 0, 0.04, 0, phone);
  K.box(0.22, 0.04, 0.06, K.std({ color: 0x8a1a1a, roughness: 0.4 }), 0, 0.1, 0, phone);
  const mach = K.box(0.2, 0.06, 0.16, M.black, 0.24, 0.03, 0, phone);
  const led = K.sphere(0.008, K.std({ color: 0x220000, emissive: 0xff2200, emissiveIntensity: 2 }), 0.3, 0.065, -0.05, phone);
  phone.position.set(-1.0, 1.045, z0 + 0.95); scene.add(phone); K.tag(phone, 'machine');
  K.hit('machine', 0.5, 0.2, 0.3, -0.88, 1.1, z0 + 0.95);
  refs.led = led;
  // 전표철
  const ord = new THREE.Group();
  K.box(0.2, 0.06, 0.28, K.std({ color: 0x3a2a1a }), 0, 0.03, 0, ord);
  K.box(0.18, 0.01, 0.26, M.paper, 0, 0.065, 0, ord);
  ord.position.set(-0.2, 1.045, z0 + 0.95); scene.add(ord); K.tag(ord, 'orders');
  K.hit('orders', 0.26, 0.12, 0.32, -0.2, 1.08, z0 + 0.95);
  // 조리법 카드
  const rc = makeCanvas(360, 480); drawRecipe(rc);
  const rcp = K.canvasPlane(rc, 0.18, 0.24, 0.5, 1.17, z0 + 0.82, 0);
  rcp.rotation.x = -0.25; K.tag(rcp, 'recipe');
  K.hit('recipe', 0.22, 0.28, 0.1, 0.5, 1.17, z0 + 0.82);
  // 차림표
  const mc = makeCanvas(600, 520); drawMenu(mc);
  K.tag(K.canvasPlane(mc, 1.0, 0.86, 0.2, 2.2, z0 + 0.02), 'menu');

  // ── 메모판 (서쪽 벽) ──
  const bc = makeCanvas(900, 720); drawBoard(bc);
  K.tag(K.canvasPlane(bc, 1.1, 0.88, x0 + 0.02, 1.55, -0.6, Math.PI / 2), 'board');

  // ── 어항 ──
  const aq = new THREE.Group();
  K.box(0.75, 0.8, 0.42, M.darkWood, 0, 0.4, 0, aq);
  const glassT = K.std({ color: 0xcfe6e8, roughness: 0.05, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
  K.box(0.7, 0.42, 0.38, glassT, 0, 1.01, 0, aq).castShadow = false;
  K.box(0.68, 0.08, 0.36, K.std({ color: 0xc8b89a, roughness: 1 }), 0, 0.84, 0, aq);
  const plant = K.std({ color: 0x3a7a3a, roughness: 0.6 });
  for (let i = 0; i < 4; i++) K.box(0.02, 0.18 + i * 0.03, 0.06, plant, -0.2 + i * 0.12, 0.95, 0.05, aq);
  const glint = K.box(0.03, 0.006, 0.012, M.brass, 0.18, 0.885, -0.05, aq);
  aq.position.set(-3.45, 0, -2.6); scene.add(aq); K.tag(aq, 'aquarium');
  K.collide(-3.85, -3.05, -2.85, -2.35);
  refs.aqKey = glint;

  // ── 시계, 달력 (동쪽 벽) ──
  const clockC = makeCanvas(256, 256);
  const clockTex = K.tex(clockC);
  const clock = new THREE.Group();
  const cb = K.cyl(0.2, 0.2, 0.05, M.darkWood, 0, 0, 0, clock, 32); cb.rotation.x = Math.PI / 2;
  K.plane(0.37, 0.37, K.std({ map: clockTex, transparent: true }), 0, 0, 0.026, 0, 0, clock).castShadow = false;
  clock.position.set(x1 - 0.03, 2.2, 0.6); clock.rotation.y = -Math.PI / 2; scene.add(clock); K.tag(clock, 'clock');
  refs.clockC = clockC; refs.clockTex = clockTex;
  const pc = makeCanvas(300, 380); drawPortrait(pc, 'couple', 41);
  K.tag(K.canvasPlane(pc, 0.4, 0.5, x1 - 0.01, 1.55, 1.6, -Math.PI / 2, 0.5), 'photoWall');

  // ── DJ박스 (북동쪽 유리방) ──
  const B = BOOTH;
  const glassB = K.std({ color: 0xbfd6d8, roughness: 0.05, transparent: true, opacity: 0.22 });
  // 아래는 나무, 위는 유리
  const zm = (B.z0 + B.z1) / 2, zl = B.z1 - B.z0;
  K.box(0.05, 0.9, zl, M.darkWood, B.x0, 0.45, zm);
  K.plane(zl, 1.3, glassB, B.x0, 1.55, zm, -Math.PI / 2).castShadow = false;
  K.box(0.06, 0.06, zl, M.darkWood, B.x0, 2.2, zm);
  for (const [a, b] of [[B.x0, B.dx0], [B.dx1, B.x1]]) {
    K.box(b - a, 0.9, 0.05, M.darkWood, (a + b) / 2, 0.45, B.z1);
    K.plane(b - a, 1.3, glassB, (a + b) / 2, 1.55, B.z1, 0).castShadow = false;
  }
  K.box(B.x1 - B.x0, 0.06, 0.06, M.darkWood, (B.x0 + B.x1) / 2, 2.2, B.z1);
  K.box(B.x1 - B.x0, 0.57, 0.05, M.darkWood, (B.x0 + B.x1) / 2, 2.515, B.z1);
  K.box(0.05, 0.57, zl, M.darkWood, B.x0, 2.515, zm);
  K.collide(B.x0 - 0.05, B.x0 + 0.05, B.z0, B.z1);
  K.collide(B.x0, B.dx0, B.z1 - 0.05, B.z1 + 0.05);
  K.collide(B.dx1, B.x1, B.z1 - 0.05, B.z1 + 0.05);
  K.collide(B.dx0, B.dx1, B.z1 - 0.05, B.z1 + 0.05, () => ctx.S.djOpen);
  const djSign = makeCanvas(256, 80);
  { const c = djSign.getContext('2d'); c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#ffb347'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.fillText('D J', 128, 56); }
  K.glowPlane(djSign, 0.4, 0.12, (B.x0 + B.x1) / 2, 2.5, B.z1 + 0.03);
  const djDoor = new THREE.Group();
  const dd = new THREE.Group();
  K.box(B.dx1 - B.dx0, 2.0, 0.04, M.darkWood, (B.dx1 - B.dx0) / 2, 1.0, 0, dd);
  K.plane(B.dx1 - B.dx0 - 0.16, 1.0, glassB, (B.dx1 - B.dx0) / 2, 1.4, 0.022, 0, 0, dd).castShadow = false;
  K.box(0.03, 0.12, 0.05, M.brass, B.dx1 - B.dx0 - 0.08, 1.0, 0.04, dd);
  djDoor.add(dd); djDoor.position.set(B.dx0, 0, B.z1); scene.add(djDoor); K.tag(djDoor, 'djDoor');
  refs.djDoor = djDoor;
  // 판 선반
  const lp = new THREE.Group();
  K.box(0.9, 1.2, 0.3, M.darkWood, 0, 0.6, 0, lp);
  const sleeveCols = [0x8a2a2a, 0x2a4a8a, 0xd8a03a, 0x2a6a4a, 0x6a2a6a, 0xcfcfcf];
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) K.box(0.02, 0.32, 0.26, K.std({ color: sleeveCols[(r * 8 + i) % 6], roughness: 0.7 }), -0.38 + i * 0.1, 0.22 + r * 0.38, 0.0, lp);
  lp.position.set(2.95, 0, B.z0 + 0.18); scene.add(lp); K.tag(lp, 'lpShelf');
  K.collide(2.5, 3.4, B.z0, B.z0 + 0.35);
  // 전축
  const tt = new THREE.Group();
  K.box(0.5, 0.9, 0.5, M.darkWood, 0, 0.45, 0, tt);
  K.box(0.46, 0.06, 0.4, M.black, 0, 0.93, 0, tt);
  const platter = K.cyl(0.15, 0.15, 0.02, K.std({ color: 0x111111, roughness: 0.3 }), -0.05, 0.97, 0, tt, 32);
  const label = K.cyl(0.04, 0.04, 0.022, K.std({ color: 0xc0392b }), -0.05, 0.972, 0, tt, 16);
  K.box(0.02, 0.02, 0.22, M.chrome, 0.15, 0.99, 0.02, tt).rotation.y = 0.3;
  tt.position.set(3.65, 0, -2.2); scene.add(tt); K.tag(tt, 'turntable');
  K.collide(3.4, 3.9, -2.45, -1.95);
  refs.platter = platter; refs.label = label;
  // 신청곡 쪽지함
  const sb = new THREE.Group();
  K.box(0.22, 0.12, 0.16, M.wood, 0, 0.06, 0, sb);
  for (let i = 0; i < 6; i++) K.box(0.08, 0.002, 0.05, M.paper, -0.05 + (i % 3) * 0.05, 0.125 + i * 0.002, (i % 2) * 0.03 - 0.02, sb);
  sb.position.set(3.65, 0.96, -2.62); scene.add(sb); K.tag(sb, 'slips');
  K.hit('slips', 0.28, 0.2, 0.22, 3.65, 1.02, -2.62);
  // 스피커
  K.box(0.35, 0.5, 0.3, M.darkWood, 3.75, 2.2, -2.8);

  // ── 주방 문 ──
  const kd = K.door(KDOOR.x0, z0, 'x', KDOOR.x1 - KDOOR.x0, M.wood, 'kitchenDoor', M.brass);
  refs.kDoor = kd;

  // ── 주방 ──
  K.box(3.0, 0.9, 0.6, M.white, -1.5, 0.45, KIT.z0 + 0.3);
  K.box(3.05, 0.04, 0.62, M.marble, -1.5, 0.92, KIT.z0 + 0.3);
  K.collide(-3.0, 0.0, KIT.z0, KIT.z0 + 0.62);
  // 커피 통 세 개
  const jars = new THREE.Group();
  [['커피', 0x4a2a1a], ['설탕', 0xf4f4f0], ['프림', 0xf0e6d0]].forEach(([n, col], i) => {
    K.cyl(0.07, 0.07, 0.2, K.std({ color: 0xcfe0e0, roughness: 0.05, transparent: true, opacity: 0.45 }), i * 0.2, 0.1, 0, jars, 18).castShadow = false;
    K.cyl(0.065, 0.065, 0.14, K.std({ color: col, roughness: 0.9 }), i * 0.2, 0.07, 0, jars, 18);
    K.cyl(0.072, 0.072, 0.02, M.brass, i * 0.2, 0.21, 0, jars, 18);
  });
  jars.position.set(-2.4, 0.94, KIT.z0 + 0.3); scene.add(jars); K.tag(jars, 'jars');
  // 개수대
  K.box(0.5, 0.05, 0.4, M.chrome, -0.9, 0.93, KIT.z0 + 0.3);
  K.tag(K.hit('sink', 0.55, 0.2, 0.45, -0.9, 1.0, KIT.z0 + 0.3), 'sink');
  // 초 상자 선반
  K.box(1.2, 0.03, 0.25, M.wood, -1.5, 1.6, KIT.z0 + 0.13);
  const cbx = K.box(0.25, 0.1, 0.15, K.std({ color: 0xd85a7a, roughness: 0.7 }), -1.2, 1.67, KIT.z0 + 0.13);
  K.tag(cbx, 'candles'); K.hit('candles', 0.3, 0.18, 0.22, -1.2, 1.68, KIT.z0 + 0.15);
  // 찬장 (동쪽 벽, 잠김)
  const cup = new THREE.Group();
  K.box(0.35, 0.9, 1.0, M.wood, 0, 0, 0, cup);
  const cupDoor = new THREE.Group();
  K.box(0.03, 0.86, 0.48, M.darkWood, 0, 0, 0.24, cupDoor);
  K.box(0.02, 0.1, 0.03, M.brass, -0.02, 0, 0.42, cupDoor);
  const cupPivot = new THREE.Group(); cupPivot.position.set(-0.19, 0, -0.5); cupPivot.add(cupDoor); cup.add(cupPivot);
  const cupDoor2 = K.box(0.03, 0.86, 0.48, M.darkWood, -0.19, 0, 0.25, cup);
  const cakeBox = K.box(0.25, 0.14, 0.25, K.std({ color: 0xf0e6d2, roughness: 0.8 }), 0, -0.3, -0.22, cup);
  cup.position.set(KIT.x1 - 0.2, 1.55, -4.4); scene.add(cup); K.tag(cup, 'cupboard');
  K.hit('cupboard', 0.45, 0.95, 1.05, KIT.x1 - 0.25, 1.55, -4.4);
  refs.cupPivot = cupPivot; refs.cakeBox = cakeBox;
  // 앞치마 (서쪽 벽 고리)
  const apron = K.plane(0.5, 0.75, K.std({ color: 0xc86a6a, roughness: 1, side: THREE.DoubleSide }), KIT.x0 + 0.04, 1.35, -4.0, Math.PI / 2);
  K.tag(apron, 'apron');
  K.box(0.04, 0.04, 0.1, M.brass, KIT.x0 + 0.02, 1.75, -4.0);
  // 냉장고
  const fr = K.box(0.65, 1.7, 0.6, K.std({ color: 0xe8e4da, roughness: 0.3 }), KIT.x0 + 0.38, 0.85, -3.5);
  K.tag(fr, 'fridge'); K.collide(KIT.x0, KIT.x0 + 0.72, -3.85, -3.15);
  // 뜰채 (구석)
  const net = new THREE.Group();
  K.cyl(0.008, 0.008, 1.0, M.wood, 0, 0.5, 0, net, 6);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 16), M.chrome); ring.position.y = 1.05; net.add(ring);
  net.position.set(KIT.x1 - 0.12, 0, KIT.z1 - 0.25); net.rotation.z = 0.15; scene.add(net); K.tag(net, 'net');
  K.hit('net', 0.25, 1.1, 0.25, KIT.x1 - 0.15, 0.6, KIT.z1 - 0.25);
  refs.net = net;

  // ── 조명 ──
  for (const [lx, lz, sh] of [[1.5, 2.3, true], [-2.0, 2.2, false], [-1.9, -0.6, false], [1.0, -0.2, false]]) {
    const shade = K.std({ color: 0x8a5a2a, emissive: 0x2a1a08, roughness: 0.6, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.18, 20, 1, true), shade);
    cone.position.set(lx, 2.05, lz); scene.add(cone);
    K.cyl(0.004, 0.004, 0.6, M.black, lx, 2.45, lz, scene, 6);
    K.sphere(0.04, K.std({ color: 0xfff1d0, emissive: 0xffc070, emissiveIntensity: 3 }), lx, 1.98, lz).castShadow = false;
    K.pointLight(0xffc27a, 3.2, lx, 1.9, lz, sh);
  }
  K.pointLight(0xffd8a0, 2.0, 0.2, 2.4, -2.0);
  K.pointLight(0xffb070, 1.8, 3.2, 2.3, -2.3);
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x3a2a20, 0.4));
  const sun = new THREE.DirectionalLight(0xffe2b0, 2.2);
  sun.position.set(2, 5, 9); sun.target.position.set(0, 0, 0.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 });
  sun.shadow.bias = -0.0015;
  scene.add(sun, sun.target);
  K.bulb(-1.5, h - 0.35, -4.3, 0xffd08a, 4.0);

  const areas = [
    { x0, x1, z0, z1 },
    { x0: KIT.x0, x1: KIT.x1, z0: KIT.z0, z1: KIT.z1 + 0.05, open: () => ctx.S.kitchenOpen },
    { x0: KDOOR.x0 + 0.1, x1: KDOOR.x1 - 0.1, z0: KIT.z1 - 0.6, z1: z0 + 0.6, open: () => ctx.S.kitchenOpen, tight: true },
  ];
  return { refs, colliders: K.colliders, areas };
}
