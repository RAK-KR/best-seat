// 1인칭 이동과 시점
import * as THREE from 'three';
import { ROOM, DARK, DARK_DOOR, SEAT } from './room.js';

const EYE = 1.6, RADIUS = 0.24, SPEED = 1.9;

export class Player {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.pos = new THREE.Vector3(0.85, EYE, 1.9);
    this.yaw = 0;          // -z 방향을 봄
    this.pitch = -0.05;
    this.keys = {};
    this.colliders = [];
    this.darkroomOpen = false;
    this.sitting = false;
    this.sitT = 0;
    this.bob = 0;
    this.sensitivity = 1;
    this.onStep = null;
    this.stepAcc = 0;
    this.locked = false;
    this.frozen = false;

    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || this.frozen) return;
      const s = 0.0022 * this.sensitivity;
      this.yaw -= e.movementX * s;
      this.pitch -= e.movementY * s;
      const lim = this.sitting ? 0.9 : 1.45;
      this.pitch = Math.max(-lim, Math.min(lim, this.pitch));
      if (this.sitting) {
        // 앉아 있을 때는 고개를 돌릴 수 있는 범위를 제한
        const base = -Math.PI / 2;
        this.yaw = Math.max(base - 1.2, Math.min(base + 1.2, this.yaw));
      }
    });
  }

  walkable(x, z) {
    const r = RADIUS;
    const inMain = x > ROOM.x0 + r && x < ROOM.x1 - r && z > ROOM.z0 + r && z < ROOM.z1 - r;
    const inDark = this.darkroomOpen && x > DARK.x0 + r && x < DARK.x1 - r && z > DARK.z0 + r && z < DARK.z1 + 0.01;
    const inGap = this.darkroomOpen && x > DARK_DOOR.x0 + r * 0.6 && x < DARK_DOOR.x1 - r * 0.6 && z > DARK.z1 - 0.6 && z < ROOM.z0 + 0.6;
    if (!inMain && !inDark && !inGap) return false;
    for (const c of this.colliders) {
      if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return false;
    }
    return true;
  }

  sit() {
    this.sitting = true;
    this.standPos = this.pos.clone();
    this.yaw = -Math.PI / 2;
    this.pitch = 0.04;
  }

  stand() {
    this.sitting = false;
    this.pos.set(SEAT.x - 0.6, EYE, SEAT.z);
  }

  update(dt) {
    const k = this.keys;
    if (!this.sitting && !this.frozen) {
      let fx = 0, fz = 0;
      if (k.KeyW || k.ArrowUp) fz -= 1;
      if (k.KeyS || k.ArrowDown) fz += 1;
      if (k.KeyA || k.ArrowLeft) fx -= 1;
      if (k.KeyD || k.ArrowRight) fx += 1;
      const len = Math.hypot(fx, fz);
      if (len > 0) {
        fx /= len; fz /= len;
        const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
        const dx = (fx * cos + fz * sin) * SPEED * dt;
        const dz = (-fx * sin + fz * cos) * SPEED * dt;
        const before = this.pos.clone();
        if (this.walkable(this.pos.x + dx, this.pos.z)) this.pos.x += dx;
        if (this.walkable(this.pos.x, this.pos.z + dz)) this.pos.z += dz;
        const moved = before.distanceTo(this.pos);
        this.bob += moved * 9;
        this.stepAcc += moved;
        if (this.stepAcc > 0.62) { this.stepAcc = 0; this.onStep && this.onStep(); }
      }
    }
    // 앉기 전환
    this.sitT += ((this.sitting ? 1 : 0) - this.sitT) * Math.min(1, dt * 5);
    const standEye = new THREE.Vector3(this.pos.x, EYE + Math.sin(this.bob) * 0.018, this.pos.z);
    const eye = standEye.lerp(SEAT, this.sitT);
    this.camera.position.copy(eye);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
