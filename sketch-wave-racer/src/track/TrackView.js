// Sketch Wave Racer — 赛道可视化（Phase 2 程序化占位）
// 原则 Visual ≠ Collider：本文件只造"看得见"的东西；判界走 Track.nearest()。
// 组成：航道水面带、两侧浮标链、起终点横幅、检查点拱门、地标小岛、S 弯木桩。

import * as THREE from "three";
import { HALF_WIDTH } from "./Track.js";
import { CONFIG } from "../config.js";

const INK = 0x2e2a26;
const toon = (c) => new THREE.MeshToonMaterial({ color: c });
function outline(m, s = 0.05) {
  const o = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  o.scale.multiplyScalar(1 + s);
  m.add(o);
}

export function createTrackView(track, scene) {
  const group = new THREE.Group();
  scene.add(group);

  // ------------------------------------------------ 航道水带（浅色水域）
  {
    const N = 240;
    const pos = [], idx = [];
    const vs = 4; // 纵向细分让波动画得出来
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = track.curve.getPointAt(t);
      const tan = track.curve.getTangentAt(t);
      const nx = -tan.z, nz = tan.x;
      for (const s of [-1, 1]) {
        pos.push(p.x + nx * HALF_WIDTH * s, 0.02, p.z + nz * HALF_WIDTH * s);
      }
      if (i < N) {
        // 每格再细分几段（横向就 2 列，纵向靠采样密度）
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8fd8e8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const band = new THREE.Mesh(geo, mat);
    band.renderOrder = 1;
    group.add(band);
  }

  // ------------------------------------------------ 两侧浮标链
  const buoys = [];
  {
    const NB = 120;
    for (let i = 0; i < NB; i++) {
      const t = i / NB;
      const p = track.curve.getPointAt(t);
      const tan = track.curve.getTangentAt(t);
      const nx = -tan.z, nz = tan.x;
      for (const s of [-1, 1]) {
        // 起点线附近留口子
        const g = new THREE.Group();
        const isRed = s < 0;
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), toon(isRed ? 0xe4572e : 0x35b24c));
        body.position.y = 0.2;
        outline(body, 0.08);
        g.add(body);
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 5), toon(INK));
        pole.position.y = 1.0;
        g.add(pole);
        g.position.set(p.x + nx * HALF_WIDTH * s, 0, p.z + nz * HALF_WIDTH * s);
        g.userData.base = g.position.clone();
        group.add(g);
        buoys.push(g);
      }
    }
  }

  // ------------------------------------------------ 起终点线：横幅门 + 黑白格
  {
    const cp = track.startLine;
    const gate = new THREE.Group();
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 8), toon(0xe4572e));
      post.position.set(cp.normal.x * HALF_WIDTH * s, 4.5, cp.normal.z * HALF_WIDTH * s);
      outline(post, 0.04);
      gate.add(post);
    }
    const banner = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, 2.2, 0.4), toon(0xffffff));
    banner.position.y = 8.5;
    banner.rotation.y = Math.atan2(cp.tangent.x, cp.tangent.z);
    outline(banner, 0.03);
    gate.add(banner);
    // 黑白格（canvas 贴图，原创程序绘制）
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 64;
    const ctx = cv.getContext("2d");
    for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#2e2a26" : "#f6efe2";
      ctx.fillRect(x * 16, y * 16, 16, 16);
    }
    banner.material = [
      toon(0xffffff), toon(0xffffff), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }),
      toon(0xffffff), toon(0xffffff), toon(0xffffff),
    ];
    gate.position.copy(cp.pos);
    group.add(gate);

    // 水面黑白格线
    const lineGeo = new THREE.PlaneGeometry(HALF_WIDTH * 2, 1.6);
    lineGeo.rotateX(-Math.PI / 2);
    lineGeo.rotateY(Math.atan2(cp.tangent.x, cp.tangent.z));
    const line = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.9, depthWrite: false,
    }));
    line.position.set(cp.pos.x, 0.05, cp.pos.z);
    line.renderOrder = 2;
    group.add(line);
  }

  // ------------------------------------------------ 检查点拱门（半透明小门）
  {
    for (const cp of track.checkpoints) {
      if (cp.index === 0) continue;
      const gate = new THREE.Group();
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 5, 6), toon(0xf4b942));
        post.position.set(cp.normal.x * HALF_WIDTH * s, 2.5, cp.normal.z * HALF_WIDTH * s);
        outline(post, 0.06);
        gate.add(post);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 2, 0.5, 0.5), toon(0xf4b942));
      bar.position.y = 4.8;
      bar.rotation.y = Math.atan2(cp.tangent.x, cp.tangent.z);
      outline(bar, 0.06);
      gate.add(bar);
      gate.position.copy(cp.pos);
      gate.userData.cp = cp.index;
      group.add(gate);
    }
  }

  // ------------------------------------------------ 地标：中央大岛 + 椰子树
  {
    const island = new THREE.Group();
    const rock = new THREE.Mesh(new THREE.ConeGeometry(26, 22, 9), toon(0x8a9b6e));
    rock.position.y = 6;
    outline(rock, 0.02);
    island.add(rock);
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 2, 12), toon(0xf2dfae));
    beach.position.y = -0.5;
    island.add(beach);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 8, 6), toon(0x9c6b3f));
      palm.position.set(Math.cos(a) * 16, 6, Math.sin(a) * 16);
      palm.rotation.z = Math.cos(a) * 0.18;
      island.add(palm);
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 6), toon(0x35b24c));
      leaf.scale.y = 0.45;
      leaf.position.set(Math.cos(a) * 16 + Math.cos(a) * 1.4, 10.3, Math.sin(a) * 16 + Math.sin(a) * 1.4);
      outline(leaf, 0.05);
      island.add(leaf);
    }
    group.add(island); // 环心 (0,0) 附近
  }

  // ------------------------------------------------ S 弯障碍木桩（t≈0.55~0.7）
  // ⚠ 位置与 CollisionWorld 构造器中的木桩列表同一公式，改布局必须两边同步。
  {
    const stakes = [];
    for (let i = 0; i < 5; i++) {
      const t = 0.55 + i * 0.035;
      const p = track.curve.getPointAt(t);
      const tan = track.curve.getTangentAt(t);
      const nx = -tan.z, nz = tan.x;
      const s = i % 2 === 0 ? 1 : -1; // 左右交错
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 3.4, 7), toon(0x9c6b3f));
      st.position.set(p.x + nx * HALF_WIDTH * 0.45 * s, 1, p.z + nz * HALF_WIDTH * 0.45 * s);
      outline(st, 0.04);
      group.add(st);
      stakes.push(st);
    }
  }

  // ------------------------------------------------ Phase 3：跳台（t=0.30）
  {
    for (const r of CONFIG.trackFeatures.ramps) {
      const p = track.pointAt(r.t);
      const tan = track.tangentAt(r.t);
      const ramp = new THREE.Group();
      // 坡面：楔形（BoxGeometry 斜置近似），跨航道中部 60%
      const slope = new THREE.Mesh(
        new THREE.BoxGeometry(HALF_WIDTH * 1.2, 0.5, 10),
        toon(0xf2dfae)
      );
      slope.rotation.x = -Math.atan2(r.height, 10);
      slope.position.set(0, r.height / 2, -4 + r.height / 2 * 0.4);
      outline(slope, 0.03);
      ramp.add(slope);
      // 台顶跳板
      const lip = new THREE.Mesh(new THREE.BoxGeometry(HALF_WIDTH * 1.2, 0.6, 1.6), toon(0xe4572e));
      lip.position.set(0, r.height, 0.4);
      outline(lip, 0.05);
      ramp.add(lip);
      // 两侧警示旗
      for (const s of [-1, 1]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 5), toon(0x2e2a26));
        pole.position.set((HALF_WIDTH * 0.6) * s, r.height + 1.2, 0.4);
        ramp.add(pole);
        const flag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.06), toon(0xf4b942));
        flag.position.set((HALF_WIDTH * 0.6) * s + 0.6, r.height + 2.0, 0.4);
        ramp.add(flag);
      }
      ramp.position.set(p.x, 0, p.z);
      ramp.rotation.y = Math.atan2(tan.x, tan.z);
      group.add(ramp);
    }
  }

  // ------------------------------------------------ Phase 3：加速带（箭头水贴）
  {
    // 程序绘制箭头贴图（原创）
    const cv = document.createElement("canvas");
    cv.width = 128; cv.height = 256;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, 128, 256);
    ctx.fillStyle = "#f4b942";
    ctx.strokeStyle = "#2e2a26";
    ctx.lineWidth = 6;
    for (const y of [200, 120, 40]) { // 三个前指箭头（贴图 -Z 方向为前）
      ctx.beginPath();
      ctx.moveTo(64, y - 40); ctx.lineTo(112, y + 16); ctx.lineTo(84, y + 16);
      ctx.lineTo(84, y + 48); ctx.lineTo(44, y + 48); ctx.lineTo(44, y + 16);
      ctx.lineTo(16, y + 16); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(cv);
    for (const b of [0.10, 0.42, 0.80]) {
      const p = track.pointAt(b);
      const tan = track.tangentAt(b);
      const geo = new THREE.PlaneGeometry(CONFIG.trackFeatures.boost.padHalfWidth * 2, CONFIG.trackFeatures.boost.padLength);
      geo.rotateX(-Math.PI / 2);
      geo.rotateY(Math.atan2(tan.x, tan.z) + Math.PI); // 箭头指向行进方向
      const pad = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.85, depthWrite: false,
      }));
      pad.position.set(p.x, 0.06, p.z);
      pad.renderOrder = 2;
      group.add(pad);
    }
  }

  return {
    group,
    buoys,
    update(t) {
      for (const b of buoys) {
        const base = b.userData.base;
        // 浮标随波（用低频近似，避免 240 个全采样开销 —— Phase 6 统一接管）
        b.position.y = 0.15 + 0.5 * Math.sin(base.x * 0.15 + t * 1.1) * Math.cos(base.z * 0.13 + t * 0.9);
      }
    },
  };
}
