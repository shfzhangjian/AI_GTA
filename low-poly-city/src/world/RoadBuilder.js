/**
 * RoadBuilder —— 十字沥青路、虚线中心线、斑马线、西南角停车场。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';
import { boxToTop } from './GroundBuilder.js';

const std = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 });

export function build(scene) {
  const g = new THREE.Group();
  const H = WORLD.half;
  const rw = WORLD.roadHalf * 2;      // 路宽
  const asphalt = std(PALETTE.asphalt);
  const paint = new THREE.MeshBasicMaterial({ color: PALETTE.paint });

  // ---- 两条主路（顶面 surfRoad）----
  for (const horiz of [true, false]) {
    const m = boxToTop(horiz ? H * 2 : rw, horiz ? rw : H * 2, WORLD.surfRoad, 0.5, asphalt);
    g.add(m);
  }

  // ---- 虚线中心线（跳过路口区域）----
  for (let i = -7; i <= 7; i++) {
    const p = i * 8.5;
    if (Math.abs(p) < 11) continue;
    const a = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 0.2), paint);
    a.position.set(p, WORLD.surfRoad + 0.02, 0);
    g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 3), paint);
    b.position.set(0, WORLD.surfRoad + 0.02, p);
    g.add(b);
  }

  // ---- 斑马线：在路口东西南北四个方向各一条 ----
  const stripeX = (cx) => {          // 行人横穿“东西向道路”（沿 z 方向铺白条）
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 12.6), paint);
      s.position.set(cx - 2 + i * 0.8, WORLD.surfRoad + 0.03, 0);
      g.add(s);
    }
  };
  const stripeZ = (cz) => {          // 行人横穿“南北向道路”
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.03, 0.42), paint);
      s.position.set(0, WORLD.surfRoad + 0.03, cz - 2 + i * 0.8);
      g.add(s);
    }
  };
  stripeX(13); stripeX(-13); stripeZ(13); stripeZ(-13);

  // ---- 西南角停车场（沥青地坪 + 白色车位线）----
  const pad = boxToTop(18, 12, WORLD.surfGrass + 0.02, 0.5, asphalt);
  pad.position.set(-46, pad.position.y, 46);
  g.add(pad);
  for (let i = 0; i < 6; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 4.8), paint);
    line.position.set(-52 + i * 2.4, WORLD.surfGrass + 0.04, 43.4);
    g.add(line);
  }
  const border = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.03, 0.16), paint);
  border.position.set(-46, WORLD.surfGrass + 0.04, 41);
  g.add(border);

  scene.add(g);
  return g;
}
