/**
 * PlayerAvatar —— 第一人称玩家的“实体化”：
 * - createPlayerAvatar()：世界中的玩家身体（跟随相机），头部放在 layer 2，
 *   自己的相机看不到头，但低头能看到躯干/双腿（有“身体”的存在感）；
 *   汽车碰撞、NPC 仇恨等都把这个位置当作实体。
 * - createFpHands()：挂在相机上的第一人称双手（闲置晃动 + 挥拳动画由外部驱动）。
 */
import * as THREE from 'three';
import { WORLD } from '../config.js';

/** 本次会话的玩家外观（身体与手保持一致） */
let look = null;
export function playerLook() {
  if (!look) {
    look = { skin: '#e8b98a', shirt: '#4a6f8f', pants: '#3a4552' };
  }
  return look;
}

const std = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

/** @returns {{group:THREE.Group, update:(dt,ratio,phase)=>void}} */
export function createPlayerAvatar() {
  const L = playerLook();
  const g = new THREE.Group();
  const shirt = std(L.shirt);
  const pants = std(L.pants);
  const skin = std(L.skin);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.28), shirt);
  torso.position.y = 1.0;
  torso.castShadow = true;
  g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), skin);
  head.position.y = 1.5;
  head.layers.set(2); // 自己的相机（layer 0）看不到头；低头只见躯干双腿
  g.add(head);

  const pivots = [];
  const limb = (geo, mat, px, pivotY, meshY) => {
    const p = new THREE.Group();
    p.position.set(px, pivotY, 0);
    const m = new THREE.Mesh(geo, mat);
    m.position.y = meshY;
    m.castShadow = true;
    p.add(m);
    g.add(p);
    pivots.push(p);
    return p;
  };
  const legGeo = new THREE.BoxGeometry(0.16, 0.72, 0.18);
  const armGeo = new THREE.BoxGeometry(0.13, 0.52, 0.14);
  limb(legGeo, pants, -0.12, 0.72, -0.36);
  limb(legGeo, pants, 0.12, 0.72, -0.36);
  limb(armGeo, shirt, -0.31, 1.26, -0.26);
  limb(armGeo, shirt, 0.31, 1.26, -0.26);
  const opposite = [1, -1, -1, 1]; // 四肢交叉摆动

  return {
    group: g,
    /** @param {number} ratio 移动强度 0~1 @param {number} phase 步态相位 */
    update(dt, ratio, phase) {
      const swing = Math.sin(phase) * 0.5 * ratio;
      pivots.forEach((p, i) => (p.rotation.x = swing * opposite[i]));
    },
  };
}

/**
 * 第一人称双手（挂在相机下的子物体组）。
 * @returns {{group:THREE.Group, update:(dt,ratio,phase,punch)=>void}} punch: {hand:0|1,t:0~1}|null
 */
export function createFpHands() {
  const L = playerLook();
  const group = new THREE.Group();
  const sleeve = std(L.shirt);
  const skin = std(L.skin);
  const hands = [];

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.42), sleeve);
    fore.rotation.x = -0.35;
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.17), skin);
    fist.position.set(0, -0.06, -0.3);
    arm.add(fore, fist);
    arm.userData.base = { x: side * 0.42, y: -0.52, z: -0.78 };
    arm.position.set(arm.userData.base.x, arm.userData.base.y, arm.userData.base.z);
    group.add(arm);
    hands.push(arm);
  }

  return {
    group,
    update(dt, ratio, phase, punch) {
      // 闲置：随行走节奏轻微起伏
      const bob = Math.sin(phase) * 0.022 * ratio;
      const sway = Math.cos(phase * 0.5) * 0.016 * ratio;
      hands.forEach((arm, i) => {
        const b = arm.userData.base;
        let x = b.x + (i === 0 ? sway : -sway);
        let y = b.y + (i === 0 ? bob : -bob);
        let z = b.z;
        if (punch && punch.hand === i) {
          const ext = Math.sin(Math.min(punch.t, 1) * Math.PI); // 伸出-收回
          x += (b.x > 0 ? -1 : 1) * 0.14 * ext;                 // 向中线打出
          z -= 0.52 * ext;                                       // 向前
          y += 0.1 * ext;
        }
        arm.position.set(x, y, z);
      });
    },
  };
}
