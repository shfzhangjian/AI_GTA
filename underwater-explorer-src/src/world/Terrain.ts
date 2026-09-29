/**
 * 基础海床地形（阶段 2）：程序化正弦叠加高度场，沙地色块 + 深色断面。
 * 世界坐标：水面 y=0，向下为负；1 unit = 0.1 m（UNITS_PER_METER）。
 * 地形沿相机横向范围平铺（回收池复用 Mesh）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';

export const UNITS_PER_METER = 10;
export const MAX_DEPTH_UNITS = -3000; // 世界底界 ≈ -300m
/** 潜水员世界活动范围（左右边界） */
export const WORLD_X_LIMIT = 1500;

interface TerrainInternals {
  rebuild(camX: number, halfW: number): void;
}

export interface Terrain extends TerrainInternals {
  groundYAt(x: number): number;
  getSegmentCount(): number;
}

const SEG_W = 40;

export function createTerrain(engine: Engine): Terrain {
  const group = engine.layers.terrain;
  const geoQuad = new THREE.PlaneGeometry(1, 1);
  const matSand = new THREE.MeshBasicMaterial({ color: 0xcfb97f });
  const matSandDark = new THREE.MeshBasicMaterial({ color: 0xb39a5e });

  function groundYAt(x: number): number {
    // 海床深度分层：横向位置决定大尺度海床带（浅滩 ≈ -31m ↔ 深槽 ≈ -78m），
    // 叠加中短波起伏；潜水员横游即穿越不同深度环境层
    const band = -540 + Math.sin(x * 0.0011) * 240 + Math.sin(x * 0.00037 + 2.0) * 90;
    return (
      band +
      Math.sin(x * 0.004) * 45 +
      Math.sin(x * 0.013 + 2.1) * 20 +
      Math.sin(x * 0.031 + 5.3) * 7
    );
  }

  const pool: THREE.Mesh[] = [];
  let lastSpan = '';

  function rebuild(camX: number, halfW: number): void {
    const span = `${Math.round(camX)}|${Math.round(halfW)}`;
    if (span === lastSpan) return;
    lastSpan = span;

    // 回收旧段
    for (const c of group.children.slice()) {
      const m = c as THREE.Mesh;
      if (m.userData.kind === 'terrainSeg') {
        group.remove(m);
        m.visible = false;
        if (pool.length < 200) pool.push(m);
      }
    }

    const x0 = Math.floor((camX - halfW) / SEG_W) * SEG_W;
    const x1 = camX + halfW + SEG_W;

    for (let x = x0; x < x1; x += SEG_W) {
      const gy = groundYAt(x + SEG_W / 2);
      const h = -MAX_DEPTH_UNITS - gy + 80;

      const top = pool.pop() ?? new THREE.Mesh(geoQuad, matSand);
      top.visible = true;
      top.material = matSand;
      top.userData = { kind: 'terrainSeg' };
      top.scale.set(SEG_W + 0.5, h, 1);
      top.position.set(x + SEG_W / 2, gy - h / 2, 0);
      group.add(top);

      const bot = pool.pop() ?? new THREE.Mesh(geoQuad, matSandDark);
      bot.visible = true;
      bot.material = matSandDark;
      bot.userData = { kind: 'terrainSeg' };
      bot.scale.set(SEG_W + 0.5, 14, 1);
      bot.position.set(x + SEG_W / 2, gy + 7, 0);
      group.add(bot);
    }
  }

  // 每帧根据相机范围平铺
  engine.addUpdate(() => {
    const cam = engine.camera;
    rebuild(cam.position.x, (cam.right - cam.left) / 2);
  });

  return {
    rebuild,
    groundYAt,
    getSegmentCount() {
      let n = 0;
      group.children.forEach((c) => {
        if ((c as THREE.Mesh).userData.kind === 'terrainSeg') n++;
      });
      return n;
    },
  };
}
