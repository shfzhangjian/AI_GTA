// Sketch Wave Racer — 道具可视化（Phase 5）
// Visual ≠ Collider：判定全在 ItemSystem，本文件只造程序化卡通网格并跟随状态。
// 资产（原创占位）：道具箱 = 描边礼盒方块；水弹 = 蓝色小鱼雷 + 拖尾；
// 水牢泡 = 半透明泡泡；护盾 = 半透明球壳；音爆波 = 扩散圆环；
// 连续星星/闪电/巨大化水环 = 即时状态可视化。

import * as THREE from "three";
import { CONFIG } from "../config.js";

const INK = 0x2e2a26;
const toon = (c) => new THREE.MeshToonMaterial({ color: c });
function outline(m, s = 0.06) {
  const o = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
  o.scale.multiplyScalar(1 + s);
  m.add(o);
}

const ITEM_COLORS = {
  speed: 0xf4b942, missile: 0x3a86ff, bubble: 0x9be8ff,
  shield: 0x35b24c, wave: 0xb06ad8, turbo: 0xe4572e,
  lightning: 0xfff066, giant: 0xff8a3d, star: 0xffdf3d, bomb: 0x333333,
};

function createStarMesh() {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), toon(ITEM_COLORS.star));
  outline(core, 0.08);
  g.add(core);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.78, 1.08, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.renderOrder = 3;
  g.add(halo);
  return g;
}

function createLightningBolt() {
  const pts = [
    new THREE.Vector3(0.0, 3.2, 0.0),
    new THREE.Vector3(0.42, 2.35, 0.0),
    new THREE.Vector3(0.08, 2.35, 0.0),
    new THREE.Vector3(0.5, 1.2, 0.0),
    new THREE.Vector3(-0.08, 2.05, 0.0),
    new THREE.Vector3(0.24, 2.05, 0.0),
    new THREE.Vector3(0.0, 3.2, 0.0),
  ];
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: ITEM_COLORS.lightning, transparent: true, opacity: 0.95 })
  );
  bolt.renderOrder = 4;
  bolt.visible = false;
  return bolt;
}

function fxMat(color, opacity = 0.55) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide });
}

function createItemIcon(type) {
  const color = ITEM_COLORS[type] || 0xffffff;
  const g = new THREE.Group();
  g.userData.type = type;
  if (type === "speed" || type === "lightning") {
    const pts = [
      new THREE.Vector3(-0.2, 0.55, 0),
      new THREE.Vector3(0.18, 0.08, 0),
      new THREE.Vector3(-0.02, 0.08, 0),
      new THREE.Vector3(0.22, -0.55, 0),
    ];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })));
  } else if (type === "missile") {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.9, 8), fxMat(color, 0.62));
    m.rotation.x = Math.PI / 2;
    g.add(m);
  } else if (type === "bubble") {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8), fxMat(color, 0.38)));
  } else if (type === "shield") {
    g.add(new THREE.Mesh(new THREE.RingGeometry(0.28, 0.46, 18), fxMat(color, 0.55)));
  } else if (type === "wave") {
    for (const r of [0.26, 0.46]) g.add(new THREE.Mesh(new THREE.RingGeometry(r, r + 0.035, 22), fxMat(color, 0.45)));
  } else if (type === "turbo") {
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.8, 8), fxMat(color, 0.62));
    flame.rotation.x = Math.PI;
    g.add(flame);
  } else if (type === "giant") {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.55, 4), fxMat(color, 0.62));
    arrow.position.y = 0.2;
    g.add(arrow);
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 0.18), fxMat(color, 0.5));
    stem.position.y = -0.2;
    g.add(stem);
  } else if (type === "bomb") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 8), fxMat(0x222222, 0.62));
    g.add(body);
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 6), fxMat(0xfff066, 0.7));
    fuse.position.set(0.25, 0.36, 0);
    fuse.rotation.z = -0.75;
    g.add(fuse);
  } else {
    g.add(new THREE.Mesh(new THREE.RingGeometry(0.26, 0.42, 16), fxMat(color, 0.5)));
  }
  g.position.y = 2.35;
  g.renderOrder = 4;
  return g;
}

function setBoxIcon(boxGroup, type) {
  if (boxGroup.userData.iconType === type) return;
  if (boxGroup.userData.icon) boxGroup.remove(boxGroup.userData.icon);
  const icon = createItemIcon(type);
  boxGroup.add(icon);
  boxGroup.userData.icon = icon;
  boxGroup.userData.iconType = type;
}

export function createItemView(track, scene, items) {
  const group = new THREE.Group();
  scene.add(group);

  // ------------------------------------------------ 道具箱：赛道点横排描边礼盒 + 半透明效果图标
  const boxMeshes = items.boxes.map((box) => {
    const g = new THREE.Group();
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.7, 1.7), toon(ITEM_COLORS[box.type]));
    cube.position.y = 0.9;
    outline(cube, 0.05);
    g.add(cube);
    // 十字缎带
    for (const rot of [0, Math.PI / 2]) {
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.34, 0.34), toon(INK));
      ribbon.position.y = 0.9;
      ribbon.rotation.y = rot;
      g.add(ribbon);
    }
    g.position.copy(box.pos);
    g.userData.cube = cube;
    setBoxIcon(g, box.type);
    group.add(g);
    return g;
  });

  // ------------------------------------------------ 动态实体对象池
  const missileMeshes = new Map(); // projectile -> mesh
  const bubbleMeshes = new Map();
  const bombMeshes = new Map();
  const starMeshes = new Map(); // star -> mesh
  // 玩家/护盾/被困 的附着体：按 entry id 管理
  const attach = new Map(); // id -> {shieldDome?, trapBubble?}

  function ensureAttach(id) {
    if (attach.has(id)) return attach.get(id);
    const rec = {};
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0x8fe8a8, transparent: true, opacity: 0.35, depthWrite: false })
    );
    dome.visible = false;
    dome.renderOrder = 3;
    group.add(dome);
    rec.shieldDome = dome;
    const trap = new THREE.Mesh(
      new THREE.SphereGeometry(2.4, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xbdefff, transparent: true, opacity: 0.45, depthWrite: false })
    );
    trap.visible = false;
    trap.renderOrder = 3;
    group.add(trap);
    rec.trapBubble = trap;
    const bolt = createLightningBolt();
    group.add(bolt);
    rec.lightningBolt = bolt;
    const giantRingGeo = new THREE.RingGeometry(2.0, 2.55, 30);
    giantRingGeo.rotateX(-Math.PI / 2);
    const giantRing = new THREE.Mesh(giantRingGeo, new THREE.MeshBasicMaterial({
      color: ITEM_COLORS.giant, transparent: true, opacity: 0.55, depthWrite: false,
    }));
    giantRing.visible = false;
    giantRing.renderOrder = 3;
    group.add(giantRing);
    rec.giantRing = giantRing;
    attach.set(id, rec);
    return rec;
  }

  let waveRings = []; // {mesh, age, life, x, z}

  return {
    group,
    // 新一局重开（main.resetRace 调用）：清 fx 附着引用/飞行体网格/音爆环
    reset() {
      for (const [, m] of missileMeshes) group.remove(m);
      missileMeshes.clear();
      for (const [, m] of bubbleMeshes) group.remove(m);
      bubbleMeshes.clear();
      for (const [, m] of bombMeshes) group.remove(m);
      bombMeshes.clear();
      for (const [, m] of starMeshes) group.remove(m);
      starMeshes.clear();
      for (const { mesh } of waveRings) group.remove(mesh);
      waveRings = [];
      for (const e of items.race.entries) {
        const rec = attach.get(e.id);
        if (rec) {
          rec.shieldDome.visible = false;
          rec.trapBubble.visible = false;
          rec.lightningBolt.visible = false;
          rec.giantRing.visible = false;
        }
      }
    },
    update(dt, t) {
      // 道具箱：呼吸旋转；冷却中半透明；到货变色
      boxMeshes.forEach((g, i) => {
        const box = items.boxes[i];
        const cube = g.userData.cube;
        cube.rotation.y = t * 1.2 + i;
        cube.position.y = 0.9 + Math.sin(t * 2 + i * 1.7) * 0.25;
        const col = ITEM_COLORS[box.type] || 0xf4b942;
        if (cube.material.color.getHex() !== col) cube.material.color.setHex(col);
        setBoxIcon(g, box.type);
        if (g.userData.icon) {
          g.userData.icon.rotation.y = -g.rotation.y + Math.sin(t * 1.4 + i) * 0.2;
          g.userData.icon.scale.setScalar(1 + Math.sin(t * 4 + i) * 0.08);
        }
        g.visible = box.respawn <= 0;
      });

      // 水弹/追踪水牢泡/炸弹飞行体
      for (const p of items.projectiles) {
        const pool = p.kind === "missile" ? missileMeshes : (p.kind === "bubble" ? bubbleMeshes : bombMeshes);
        let m = pool.get(p);
        if (!m) {
          if (p.kind === "missile") {
            m = (() => {
              const g = new THREE.Group();
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 7), toon(0x3a86ff));
              outline(body, 0.1);
              g.add(body);
              const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.4, 6), toon(0x9be8ff));
              tail.rotation.x = Math.PI / 2;
              tail.position.z = 0.9;
              g.add(tail);
              group.add(g);
              return g;
            })();
          } else if (p.kind === "bubble") {
            m = (() => {
              const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8),
                new THREE.MeshBasicMaterial({ color: 0xbdefff, transparent: true, opacity: 0.5, depthWrite: false }));
              m2.renderOrder = 3;
              group.add(m2);
              return m2;
            })();
          } else {
            m = (() => {
              const g = new THREE.Group();
              const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8), toon(0x2e2a26));
              outline(body, 0.08);
              g.add(body);
              const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), toon(0xfff066));
              cap.position.set(0.35, 0.45, 0);
              cap.rotation.z = -0.7;
              g.add(cap);
              group.add(g);
              return g;
            })();
          }
          pool.set(p, m);
        }
        m.visible = true;
        if (p.kind === "bomb") {
          const fuseK = Math.max(0, 1 - p.age / Math.max(0.01, p.fuse || 2));
          m.position.set(p.x, 0.44 + Math.sin(t * 9) * 0.04, p.z);
          m.rotation.y = t * 5 + p.travelled * 0.15;
          m.scale.setScalar(1 + (1 - fuseK) * 0.18 + Math.sin(t * 18) * 0.035);
        } else {
          m.position.set(p.x, 0.5 + Math.sin(t * 6 + p.travelled) * 0.12, p.z);
          if (p.kind === "missile") m.rotation.y = Math.atan2(-p.dx, -p.dz);
          else m.scale.setScalar(1 + Math.sin(t * 9 + p.travelled) * 0.08);
        }
      }
      // 回收已消亡飞行体网格
      for (const [p, m] of [...missileMeshes, ...bubbleMeshes, ...bombMeshes]) {
        if (!p.alive) {
          group.remove(m);
          (p.kind === "missile" ? missileMeshes : (p.kind === "bubble" ? bubbleMeshes : bombMeshes)).delete(p);
        }
      }

      // 连续星星：水面上方旋转发光，拾取后回收
      for (const s of items.stars || []) {
        let m = starMeshes.get(s);
        if (!m) {
          m = createStarMesh();
          group.add(m);
          starMeshes.set(s, m);
        }
        const pulse = 1 + Math.sin(t * 7 + s.id) * 0.12;
        m.visible = true;
        m.position.set(s.x, (s.y || 0.8) + Math.sin(t * 4 + s.id) * 0.18, s.z);
        m.rotation.y = t * 3.2 + s.id;
        m.rotation.z = Math.sin(t * 2 + s.id) * 0.25;
        m.scale.setScalar(pulse);
      }
      const liveStars = new Set(items.stars || []);
      for (const [s, m] of [...starMeshes]) {
        if (!liveStars.has(s) || !s.alive) { group.remove(m); starMeshes.delete(s); }
      }

      // 附着体（护盾/被困泡）
      for (const e of items.race.entries) {
        const b = e.boat;
        const needs = b.shield > 0 || b.trapped > 0 || b.lightningSlow > 0 || b.giantScale > 1.01;
        const rec = attach.get(e.id) || (needs ? ensureAttach(e.id) : null);
        if (!rec) continue;
        rec.shieldDome.visible = b.shield > 0;
        if (rec.shieldDome.visible) {
          rec.shieldDome.position.set(b.position.x, b.position.y + 0.5, b.position.z);
          rec.shieldDome.material.opacity = 0.22 + 0.13 * Math.sin(t * 5);
        }
        rec.trapBubble.visible = b.trapped > 0;
        if (rec.trapBubble.visible) {
          rec.trapBubble.position.set(b.position.x, b.position.y + 0.9, b.position.z);
          rec.trapBubble.scale.setScalar(1 + Math.sin(t * 4) * 0.06);
        }
        rec.lightningBolt.visible = b.lightningSlow > 0;
        if (rec.lightningBolt.visible) {
          rec.lightningBolt.position.set(b.position.x, b.position.y, b.position.z);
          rec.lightningBolt.rotation.y = t * 8 + e.id.length;
          rec.lightningBolt.material.opacity = 0.45 + 0.5 * Math.abs(Math.sin(t * 18));
          rec.lightningBolt.scale.setScalar(1 + Math.sin(t * 12) * 0.18);
        }
        rec.giantRing.visible = b.giantScale > 1.01;
        if (rec.giantRing.visible) {
          rec.giantRing.position.set(b.position.x, b.position.y + 0.12, b.position.z);
          rec.giantRing.scale.setScalar(0.75 + (b.giantScale || 1) * 0.3 + Math.sin(t * 6) * 0.04);
          rec.giantRing.material.opacity = 0.25 + 0.25 * Math.sin(t * 5) ** 2;
        }
      }

      // 音爆波扩散环
      for (const fx of items.effects) {
        if (fx.__ring) continue;
        if (!Number.isFinite(fx.x) || !Number.isFinite(fx.z)) { fx.__ring = "skip"; continue; }
        const geo = new THREE.RingGeometry(1, 2.2, 28);
        geo.rotateX(-Math.PI / 2);
        const ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
          color: fx.color ?? (fx.type === "explosion" ? 0xff6b2c : 0xb06ad8),
          transparent: true, opacity: 0.8, depthWrite: false,
        }));
        ring.position.set(fx.x, 0.35, fx.z);
        ring.renderOrder = 3;
        group.add(ring);
        fx.__ring = ring;
        waveRings.push({ mesh: ring, fx });
      }
      waveRings = waveRings.filter(({ mesh, fx }) => {
        const k = fx.age / fx.life;
        if (k >= 1) { group.remove(mesh); return false; }
        mesh.scale.setScalar(1 + k * (fx.radius ?? CONFIG.items.wave.radius));
        mesh.material.opacity = 0.8 * (1 - k);
        return true;
      });
    },
  };
}
