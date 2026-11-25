// 중앙극장 객석과 영사실
import * as THREE from 'three';
import { makeKit, commonMats } from '../../shared/build.js';
import * as T from '../../shared/textures.js';
import { makeCanvas, drawPortrait } from '../../shared/draw.js';

export const HALL = { x0: -4.5, x1: 4.5, z0: -5, z1: 4.4, h: 4.0 };
export const BOOTH = { x0: -2.2, x1: 2.2, z0: 4.4, z1: 7.2, h: 3.2 };
export const BDOOR = { x0: 1.2, x1: 2.0 };
export const PORT = { x: 0, y: 2.25, z: 4.4 };
export const rowZ = (r) => -2.6 + (r - 1) * 0.62;
export const seatX = (n) => (n <= 6 ? -3.5 + (n - 1) * 0.52 : 0.9 + (n - 7) * 0.52);

export function buildRoom(scene, ctx) {
  const K = makeKit(scene);
  const M = commonMats();
  const refs = {};
  const { x0, x1, z0, z1, h } = HALL;

  const carpetC = makeCanvas(512, 512);
  {
    const c = carpetC.getContext('2d');
    c.fillStyle = '#4a1418'; c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) { c.fillStyle = `rgba(${90 + Math.random() * 60},20,26,0.3)`; c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
    c.strokeStyle = 'rgba(200,150,60,0.15)'; c.lineWidth = 3;
    for (let x = 0; x < 512; x += 64) for (let y = 0; y < 512; y += 64) { c.beginPath(); c.moveTo(x + 32, y + 8); c.lineTo(x + 56, y + 32); c.lineTo(x + 32, y + 56); c.lineTo(x + 8, y + 32); c.closePath(); c.stroke(); }
  }
  const carpet = K.std({ map: K.tex(carpetC), roughness: 1 });
  carpet.map.wrapS = carpet.map.wrapT = THREE.RepeatWrapping; carpet.map.repeat.set(5, 5);
  const fabricC = makeCanvas(256, 256);
  { const c = fabricC.getContext('2d'); c.fillStyle = '#2a1a22'; c.fillRect(0, 0, 256, 256); for (let x = 0; x < 256; x += 16) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, 0, 3, 256); } }
  const fabric = K.std({ map: K.tex(fabricC), roughness: 1 });
  fabric.map.wrapS = fabric.map.wrapT = THREE.RepeatWrapping;
  const darkPanel = K.std({ map: T.woodTexture(31, [50, 30, 22]), roughness: 0.6 });
  const red = K.std({ color: 0x8a1c22, roughness: 0.7 });
  const velvet = K.std({ color: 0x6a0f16, roughness: 0.95, side: THREE.DoubleSide });

  // ── 객석 바닥·천장·벽 ──
  K.floor(x0, x1, z0, z1, carpet);
  K.ceiling(x0, x1, z0, z1, K.std({ color: 0x1a1414, roughness: 1 }), h);
  const W = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, fabric, darkPanel, 1.1);
  W(z0, z1, 0, h, x0, 'e');
  W(z0, z1, 0, h, x1, 'w');
  W(x0, x1, 0, h, z0, 'n');
  // 뒷벽: 영사실 문(x 1.2~2.0)과 영사창
  W(x0, BDOOR.x0, 0, PORT.y - 0.17, z1, 's');
  W(BDOOR.x1, x1, 0, h, z1, 's');
  W(BDOOR.x0, BDOOR.x1, 2.05, h, z1, 's');
  W(x0, PORT.x - 0.25, PORT.y - 0.17, h, z1, 's');
  W(PORT.x + 0.25, BDOOR.x0, PORT.y - 0.17, h, z1, 's');
  W(PORT.x - 0.25, PORT.x + 0.25, PORT.y + 0.17, h, z1, 's');

  // ── 무대와 스크린 ──
  K.box(9, 0.6, 1.2, darkPanel, 0, 0.3, z0 + 0.6);
  K.collide(x0, x1, z0, z0 + 1.25);
  const screenBase = K.plane(6.4, 2.8, K.std({ color: 0xd8d6d0, roughness: 0.9 }), 0, 2.3, z0 + 0.05);
  K.tag(screenBase, 'screen');
  const footC = makeCanvas(1024, 448);
  const footTex = K.tex(footC);
  const foot = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.8), new THREE.MeshBasicMaterial({ map: footTex, transparent: true, opacity: 0, toneMapped: false }));
  foot.position.set(0, 2.3, z0 + 0.07); foot.userData.id = 'screen'; scene.add(foot);
  refs.footC = footC; refs.footTex = footTex; refs.foot = foot;
  for (const sx of [-3.6, 3.6]) {
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.6, 14, 1), velvet);
    const p = curtain.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.06);
    curtain.geometry.computeVertexNormals();
    curtain.position.set(sx, 2.4, z0 + 0.2); scene.add(curtain);
  }
  K.box(9, 0.5, 0.3, velvet, 0, 3.75, z0 + 0.2);

  // ── 좌석 (인스턴스) ──
  const seatGeo = new THREE.BoxGeometry(0.46, 0.12, 0.42);
  const backGeo = new THREE.BoxGeometry(0.46, 0.55, 0.08);
  const armGeo = new THREE.BoxGeometry(0.05, 0.25, 0.45);
  const N = 10 * 12;
  const seats = new THREE.InstancedMesh(seatGeo, red, N);
  const backs = new THREE.InstancedMesh(backGeo, red, N);
  const arms = new THREE.InstancedMesh(armGeo, M.black, N);
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 1; r <= 10; r++) for (let n = 1; n <= 12; n++, i++) {
    const x = seatX(n), z = rowZ(r);
    m.makeTranslation(x, 0.42, z); seats.setMatrixAt(i, m);
    m.makeRotationX(-0.12); m.setPosition(x, 0.72, z + 0.24); backs.setMatrixAt(i, m);
    m.makeTranslation(x - 0.26, 0.55, z + 0.02); arms.setMatrixAt(i, m);
  }
  [seats, backs, arms].forEach((im) => { im.castShadow = true; im.receiveShadow = true; im.userData.noHit = true; scene.add(im); });
  for (let r = 1; r <= 10; r++) {
    const z = rowZ(r);
    K.collide(-3.8, -0.62, z - 0.27, z + 0.32);
    K.collide(0.62, 3.8, z - 0.27, z + 0.32);
    // 줄 번호 표 (통로 쪽 끝)
    const pc = makeCanvas(128, 128);
    { const c = pc.getContext('2d'); c.fillStyle = '#c9a55a'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#2a1a0a'; c.font = 'bold 64px serif'; c.textAlign = 'center'; c.fillText(`${r}`, 64, 86); }
    const plate = K.canvasPlane(pc, 0.12, 0.12, 0.645, 0.62, z, -Math.PI / 2, 0.4);
    K.canvasPlane(pc, 0.12, 0.12, -0.645, 0.62, z, Math.PI / 2, 0.4);
    if (r === 7) K.tag(plate, 'row7');
  }
  // 7열 8·9·10번 (조사용)
  const z7 = rowZ(7);
  [8, 9, 10].forEach((n) => K.hit(`seat${n}`, 0.46, 0.4, 0.46, seatX(n), 0.55, z7));
  // 9번: 반들반들 닳은 가죽, 10번: 새것 (비닐)
  K.box(0.44, 0.02, 0.4, K.std({ color: 0xb04048, roughness: 0.25 }), seatX(9), 0.49, z7).userData.noHit = true;
  const film = K.box(0.47, 0.13, 0.43, K.std({ color: 0xe0f0f8, roughness: 0.05, transparent: true, opacity: 0.3 }), seatX(10), 0.42, z7);
  film.userData.noHit = true; film.castShadow = false;
  // 7열 8번 밑 깡통
  const can = K.cyl(0.13, 0.13, 0.05, K.std({ color: 0x9a9a98, roughness: 0.35, metalness: 0.7 }), seatX(8), 0.03, z7 - 0.02);
  can.userData.noHit = true;
  refs.can = can;
  // 통로 바닥등
  for (let r = 1; r <= 10; r++) for (const sx of [-0.58, 0.58]) K.box(0.06, 0.03, 0.06, K.std({ color: 0x302010, emissive: 0xffa040, emissiveIntensity: 1.2 }), sx, 0.05, rowZ(r) + 0.3).castShadow = false;

  // ── 비상구 표시등과 벽등 ──
  const exitC = makeCanvas(256, 96);
  { const c = exitC.getContext('2d'); c.fillStyle = '#0e6a2e'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#e8ffe8'; c.font = 'bold 50px sans-serif'; c.textAlign = 'center'; c.fillText('비 상 구', 128, 66); }
  K.glowPlane(exitC, 0.5, 0.19, x0 + 0.02, 2.45, 3.6, Math.PI / 2);
  const sconces = [];
  for (const sz of [-3, -0.5, 2]) for (const [sx, ry] of [[x0 + 0.08, Math.PI / 2], [x1 - 0.08, -Math.PI / 2]]) {
    K.box(0.12, 0.25, 0.1, K.std({ color: 0xf0d0a0, emissive: 0xffb060, emissiveIntensity: 1.5 }), sx, 2.6, sz).castShadow = false;
    sconces.push(K.pointLight(0xffb060, 1.2, sx + (sx < 0 ? 0.3 : -0.3), 2.6, sz));
  }
  refs.sconces = sconces;
  // 출입문 (서쪽 벽 뒤편)
  refs.entrance = K.door(x0 + 0.03, 4.1, 'z', 0.9, darkPanel, 'entrance', M.brass);

  // ── 영사실 ──
  const B = BOOTH;
  K.floor(B.x0, B.x1, B.z0, B.z1, M.lino);
  K.ceiling(B.x0, B.x1, B.z0, B.z1, K.std({ color: 0x3a3a38, roughness: 1 }), B.h);
  const bw = (a, b, y0, y1, f, dir) => K.wall(a, b, y0, y1, f, dir, K.std({ map: T.paintTexture('#6a6c62', 95), roughness: 0.9 }), null);
  bw(B.x0, B.x1, 0, B.h, B.z1, 's');
  bw(B.z0, B.z1, 0, B.h, B.x0, 'e');
  bw(B.z0, B.z1, 0, B.h, B.x1, 'w');
  bw(B.x0, PORT.x - 0.25, 0, B.h, B.z0 + 0.01, 'n');
  bw(PORT.x + 0.25, BDOOR.x0, 0, B.h, B.z0 + 0.01, 'n');
  bw(BDOOR.x1, B.x1, 0, B.h, B.z0 + 0.01, 'n');
  bw(PORT.x - 0.25, PORT.x + 0.25, 0, PORT.y - 0.17, B.z0 + 0.01, 'n');
  bw(PORT.x - 0.25, PORT.x + 0.25, PORT.y + 0.17, B.h, B.z0 + 0.01, 'n');
  bw(BDOOR.x0, BDOOR.x1, 2.05, B.h, B.z0 + 0.01, 'n');
  refs.boothDoor = K.door(BDOOR.x0, z1, 'x', BDOOR.x1 - BDOOR.x0, darkPanel, 'boothDoor', M.brass);
  const dnC = makeCanvas(320, 200);
  { const c = dnC.getContext('2d'); c.fillStyle = '#f2ead2'; c.fillRect(0, 0, 320, 200); c.fillStyle = '#7a1a1a'; c.font = 'bold 40px "Nanum Myeongjo", serif'; c.textAlign = 'center'; c.fillText('영 사 실', 160, 60); c.fillStyle = '#2a2a3a'; c.font = '30px "Nanum Myeongjo", serif'; c.fillText('관계자 외 출입 금지', 160, 120); c.font = '24px "Nanum Pen Script", cursive'; c.fillText('+ 쪽지 한 장', 160, 170); }
  K.tag(K.canvasPlane(dnC, 0.4, 0.25, (BDOOR.x0 + BDOOR.x1) / 2, 1.6, z1 - 0.06, Math.PI), 'notice');
  // 영사기
  const proj = new THREE.Group();
  K.box(0.3, 1.85, 0.3, M.black, 0, 0.925, 0.25, proj);
  K.box(0.55, 0.5, 1.0, K.std({ color: 0x3a4a3a, roughness: 0.45, metalness: 0.4 }), 0, 2.15, 0.2, proj);
  const lens = K.cyl(0.08, 0.1, 0.3, M.chrome, 0, 2.25, -0.4, proj); lens.rotation.x = Math.PI / 2;
  const reelA = K.cyl(0.32, 0.32, 0.04, M.metal, 0, 2.78, 0.5, proj, 32); reelA.rotation.z = Math.PI / 2;
  const reelB = K.cyl(0.32, 0.32, 0.04, M.metal, 0, 2.62, -0.15, proj, 32); reelB.rotation.z = Math.PI / 2; reelB.visible = false;
  const lampBox = K.box(0.35, 0.45, 0.4, K.std({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 }), 0, 2.15, 0.85, proj);
  const lampGlow = K.box(0.06, 0.06, 0.02, K.std({ color: 0x220000, emissive: 0xffd080, emissiveIntensity: 0 }), 0.18, 2.2, 0.85, proj);
  proj.position.set(PORT.x, 0, z1 + 0.55);
  scene.add(proj); K.tag(proj, 'projector');
  K.collide(-0.4, 0.4, z1 + 0.2, z1 + 1.55);
  refs.reelA = reelA; refs.reelB = reelB; refs.lampGlow = lampGlow.material;
  // 빛줄기
  const len = z1 - z0 - 0.1;
  const beamGeo = new THREE.ConeGeometry(1, len, 32, 1, true);
  beamGeo.rotateX(-Math.PI / 2); beamGeo.translate(0, 0, -len / 2);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.scale.set(3.2, 1.4, 1); beam.position.set(PORT.x, PORT.y, z1 + 0.05);
  beam.userData.noHit = true; beam.raycast = () => {};
  scene.add(beam);
  refs.beamMat = beamMat;
  // 영사창 (조사용)
  K.hit('porthole', 0.5, 0.4, 0.2, PORT.x, PORT.y, z1 + 0.15);
  // 전원 스위치
  const sw = new THREE.Group();
  K.box(0.2, 0.3, 0.08, M.metal, 0, 0, 0, sw);
  const lever = K.box(0.04, 0.14, 0.04, K.std({ color: 0x8a1b14 }), 0, 0, 0.06, sw);
  sw.position.set(B.x1 - 0.05, 1.4, z1 + 0.6); sw.rotation.y = -Math.PI / 2; scene.add(sw); K.tag(sw, 'power');
  refs.lever = lever;
  // 필름 통 선반 (동쪽 벽)
  const shelf = new THREE.Group();
  K.box(0.4, 1.8, 1.3, darkPanel, 0, 0.9, 0, shelf);
  for (let rr = 0; rr < 4; rr++) for (let k = 0; k < 4; k++) {
    const cn = K.cyl(0.16, 0.16, 0.05, K.std({ color: 0x8a8a88, roughness: 0.4, metalness: 0.6 }), -0.02, 0.35 + rr * 0.4, -0.45 + k * 0.3, shelf, 20);
    cn.rotation.z = Math.PI / 2;
  }
  shelf.position.set(B.x1 - 0.22, 0, 6.3); scene.add(shelf); K.tag(shelf, 'cans');
  K.collide(B.x1 - 0.42, B.x1, 5.65, 6.95);
  // 책상: 일지, 표 뭉치
  const desk = new THREE.Group();
  K.box(0.7, 0.05, 1.2, M.wood, 0, 0.78, 0, desk);
  K.box(0.66, 0.76, 1.15, darkPanel, 0, 0.38, 0, desk);
  desk.position.set(B.x0 + 0.36, 0, 6.2); scene.add(desk);
  K.collide(B.x0, B.x0 + 0.72, 5.6, 6.8);
  const logb = new THREE.Group();
  K.box(0.26, 0.04, 0.36, K.std({ color: 0x1a2a4a }), 0, 0, 0, logb);
  logb.position.set(B.x0 + 0.38, 0.825, 5.95); logb.rotation.y = 0.2; scene.add(logb); K.tag(logb, 'log');
  K.hit('log', 0.32, 0.1, 0.4, B.x0 + 0.38, 0.84, 5.95);
  const tin = K.box(0.2, 0.12, 0.14, K.std({ color: 0x8a2a2a, roughness: 0.4, metalness: 0.4 }), B.x0 + 0.4, 0.86, 6.5);
  K.tag(tin, 'tickets'); K.hit('tickets', 0.26, 0.18, 0.2, B.x0 + 0.4, 0.88, 6.5);
  // 되감기 작업대 (분위기)
  const rw = new THREE.Group();
  K.box(1.0, 0.05, 0.5, M.wood, 0, 0.9, 0, rw);
  K.box(0.96, 0.88, 0.46, darkPanel, 0, 0.44, 0, rw);
  const rr1 = K.cyl(0.25, 0.25, 0.03, M.metal, -0.3, 1.2, 0, rw, 24); rr1.rotation.x = Math.PI / 2;
  const rr2 = K.cyl(0.25, 0.25, 0.03, M.metal, 0.3, 1.2, 0, rw, 24); rr2.rotation.x = Math.PI / 2;
  rw.position.set(-0.9, 0, B.z1 - 0.3); scene.add(rw); K.tag(rw, 'rewind');
  K.collide(-1.45, -0.35, B.z1 - 0.6, B.z1);
  // 덕배 아저씨 사진
  const pc = makeCanvas(256, 320); drawPortrait(pc, 'man', 51);
  K.tag(K.canvasPlane(pc, 0.3, 0.38, 0.9, 1.7, B.z1 - 0.01, Math.PI, 0.5), 'portrait');
  // 영사실 백열등
  refs.boothBulb = K.bulb(0.6, B.h - 0.35, 6.0, 0xffd08a, 3.5, true);

  scene.add(new THREE.HemisphereLight(0xffe8d0, 0x201010, 0.12));
  const hallLight = K.pointLight(0xffd0a0, 2.0, 0, 3.6, 0.5);
  refs.hallLight = hallLight;

  const areas = [
    { x0, x1, z0, z1 },
    { x0: B.x0, x1: B.x1, z0: B.z0 - 0.05, z1: B.z1, open: () => ctx.S.boothOpen },
    { x0: BDOOR.x0 + 0.1, x1: BDOOR.x1 - 0.1, z0: z1 - 0.6, z1: z1 + 0.6, open: () => ctx.S.boothOpen, tight: true },
  ];
  return { refs, colliders: K.colliders, areas };
}
