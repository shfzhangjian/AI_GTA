/* ============================================================
   main.js — 3D 台球（Three.js）
   平面 2D 物理（球-球弹性碰撞 / 库边反弹 / 摩擦 / 落袋）
   + 3D 场景渲染 + 程序化音效 + 双人回合制（你 vs 电脑）
   ============================================================ */
import * as THREE from 'three';
import { Sound } from './sound.js';

/* ================= 常量（真实比例：球直径 2.5in ≈ 63.5mm，球半径 R=0.03175） ================= */
const R = 0.03175;              // 球半径（米）
const TABLE_W = 1.1875;         // 台面半宽（长 2.375m）
const TABLE_H = 0.5775;         // 台面半深（宽 1.155m）
const POCKET_R = 0.062;         // 袋口半径（略大于球半径的 2 倍口）
const FELT_Y = 0;               // 台面高度
const STOP_EPS = 0.008;         // 低于此速度视为停止
const REST_BALL = 0.95;         // 球间恢复系数
const REST_RAIL = 0.8;          // 库边恢复系数
const MAX_SPEED = 4.5;          // 最大出杆速度 m/s
const SUBSTEP = 1 / 480;        // 物理子步

// 6 个袋口（角袋 + 中袋）
const POCKETS = [
  [-TABLE_W, -TABLE_H], [0, -TABLE_H * 1.02], [TABLE_W, -TABLE_H],
  [-TABLE_W,  TABLE_H], [0,  TABLE_H * 1.02], [TABLE_W,  TABLE_H],
];

/* ================= 渲染器 / 场景 / 相机 ================= */
const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);
scene.fog = new THREE.Fog(0x0a0d12, 4, 10);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.05, 60);
camera.position.set(0, 1.9, 2.45);
camera.lookAt(0, 0, 0);
scene.add(camera); // 相机必须在场景图里，否则灯光先加、相机后加时背景不亮

/* ================= 灯光 ================= */
scene.add(new THREE.AmbientLight(0x8899bb, 0.5));

function makeShadowLight(x, y, z, intensity) {
  const d = new THREE.DirectionalLight(0xfff3e0, intensity);
  d.position.set(x, y, z);
  d.castShadow = true;
  d.shadow.mapSize.set(2048, 2048);
  const c = 1.5;
  d.shadow.camera.left = -c; d.shadow.camera.right = c;
  d.shadow.camera.top = c; d.shadow.camera.bottom = -c;
  d.shadow.camera.near = 0.5; d.shadow.camera.far = 8;
  d.shadow.bias = -0.0002;
  scene.add(d);
  return d;
}
makeShadowLight(-1.2, 2.6, 1.2, 1.2);
makeShadowLight(1.2, 2.2, -1.0, 0.5);

// 台球桌上方三盏吊灯的可见灯罩 + 聚光
const lampMat = new THREE.MeshStandardMaterial({
  color: 0x222831, metalness: 0.8, roughness: 0.35,
  emissive: 0xffdca0, emissiveIntensity: 0.25,
});
[-0.72, 0, 0.72].forEach(x => {
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.12, 24, 1, true), lampMat);
  shade.position.set(x, 1.0, 0);
  scene.add(shade);
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.75, 6),
    new THREE.MeshStandardMaterial({ color: 0x11141a, roughness: 0.8 }));
  cord.position.set(x, 1.44, 0);
  scene.add(cord);
  const spot = new THREE.SpotLight(0xffe9c4, 4.5, 4, Math.PI / 4.6, 0.5, 1.4);
  spot.position.set(x, 0.93, 0);
  spot.target.position.set(x * 1.15, 0, 0);
  scene.add(spot, spot.target);
  // 灯泡
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xfff2d0 }));
  bulb.position.set(x, 0.92, 0);
  scene.add(bulb);
});

/* ================= 台球桌 ================= */
const table = new THREE.Group();
scene.add(table);

// 台呢（green felt）
const feltMat = new THREE.MeshStandardMaterial({
  color: 0x1d7a44, roughness: 0.95, metalness: 0.0,
});
const felt = new THREE.Mesh(new THREE.BoxGeometry(TABLE_W * 2, 0.05, TABLE_H * 2), feltMat);
felt.position.y = -0.025;
felt.receiveShadow = true;
table.add(felt);

// 木边框 + 库边（cushion）
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5a3320, roughness: 0.55, metalness: 0.15 });
const railMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 });
const FRAME = 0.085;    // 边框宽（含库边）
const RAIL_H = 0.032;   // 库边高（必须高于球心 R=0.0285，反弹才成立）
function railBox(w, h, d, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || woodMat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  table.add(m);
  return m;
}
// 外木框
railBox(TABLE_W * 2 + FRAME * 2 + 0.03, 0.07, 0.035, 0, -0.005, -(TABLE_H + FRAME / 2 + 0.02));
railBox(TABLE_W * 2 + FRAME * 2 + 0.03, 0.07, 0.035, 0, -0.005,  (TABLE_H + FRAME / 2 + 0.02));
railBox(0.035, 0.07, TABLE_H * 2 + FRAME * 2 + 0.03, -(TABLE_W + FRAME / 2 + 0.02), -0.005, 0);
railBox(0.035, 0.07, TABLE_H * 2 + FRAME * 2 + 0.03,  (TABLE_W + FRAME / 2 + 0.02), -0.005, 0);
// 内库边（带袋口缺口）：上下各三段、左右各一段
function cushionSegs(axis) {
  const gap = POCKET_R * 1.9;   // 袋口让位
  if (axis === 'h') {
    for (const z of [-TABLE_H - 0.02, TABLE_H + 0.02]) {
      const seg = (TABLE_W * 2 - gap * 2 - 0.04) / 2;
      railBox(seg, RAIL_H, 0.04, -(gap + 0.02 + seg / 2), RAIL_H / 2, z, railMat);
      railBox(seg, RAIL_H, 0.04,  (gap + 0.02 + seg / 2), RAIL_H / 2, z, railMat);
      const mid = TABLE_W - gap - 0.04;
      if (mid > 0.05) railBox(mid, RAIL_H, 0.04, 0, RAIL_H / 2, z, railMat);
    }
  } else {
    for (const x of [-TABLE_W - 0.02, TABLE_W + 0.02]) {
      const seg = TABLE_H * 2 - gap * 2 - 0.04;
      railBox(0.04, RAIL_H, seg, x, RAIL_H / 2, 0, railMat);
    }
  }
}
cushionSegs('h'); cushionSegs('v');

// 桌腿 + 地面
const legMat = new THREE.MeshStandardMaterial({ color: 0x3a2415, roughness: 0.6 });
for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.72, 12), legMat);
  leg.position.set(sx * (TABLE_W - 0.08), -0.41, sz * (TABLE_H - 0.06));
  leg.castShadow = true;
  table.add(leg);
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(24, 24),
  new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.95 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.78;
floor.receiveShadow = true;
scene.add(floor);

// 袋口（视觉：黑色圆盘 + 金属圈）
POCKETS.forEach(([x, z]) => {
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(POCKET_R, POCKET_R * 0.8, 0.04, 24),
    new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 1 }));
  hole.position.set(x, 0.008, z);
  table.add(hole);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(POCKET_R + 0.006, 0.007, 8, 28),
    new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.01, z);
  table.add(ring);
});

// 开球点 / 中线标记
const spot = new THREE.Mesh(
  new THREE.CircleGeometry(0.005, 20),
  new THREE.MeshBasicMaterial({ color: 0xdfe8df, transparent: true, opacity: 0.5 }));
spot.rotation.x = -Math.PI / 2; spot.position.set(-TABLE_W / 2, 0.002, 0);
scene.add(spot);

/* ================= 球 ================= */
const BALL_DEFS = [
  { id: 0, color: 0xffffff, stripe: false, label: '母球' },
  { id: 1, color: 0xf5c518, stripe: false },   // 黄
  { id: 2, color: 0x1e56c8, stripe: false },   // 蓝
  { id: 3, color: 0xd0342c, stripe: false },   // 红
  { id: 4, color: 0x6a2c91, stripe: false },   // 紫
  { id: 5, color: 0xe8701a, stripe: false },   // 橙
  { id: 6, color: 0x1a7a3c, stripe: false },   // 绿
  { id: 7, color: 0x7a2332, stripe: false },   // 酒红
  { id: 8, color: 0x111111, stripe: false },   // 8 黑
  { id: 9, color: 0xf5c518, stripe: true },
  { id: 10, color: 0x1e56c8, stripe: true },
  { id: 11, color: 0xd0342c, stripe: true },
  { id: 12, color: 0x6a2c91, stripe: true },
  { id: 13, color: 0xe8701a, stripe: true },
  { id: 14, color: 0x1a7a3c, stripe: true },
  { id: 15, color: 0x7a2332, stripe: true },
];

// 共享几何
const ballGeo = new THREE.SphereGeometry(R, 40, 28);
// 花球白色底（用圆柱贴图感：两条白条带用 canvas 画纹理更真实）
function ballTexture(def) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const g = cv.getContext('2d');
  const hex = '#' + def.color.toString(16).padStart(6, '0');
  if (def.stripe) {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = hex; g.fillRect(0, 30, 256, 68);
  } else {
    g.fillStyle = hex; g.fillRect(0, 0, 256, 128);
  }
  // 数字白圆
  if (def.id > 0) {
    g.fillStyle = '#f6f3ec';
    g.beginPath(); g.arc(64, 64, 22, 0, 7); g.fill();
    g.arc(192, 64, 22, 0, 7); g.fill();
    g.fillStyle = '#111';
    g.font = 'bold 26px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(def.id), 64, 66);
    g.fillText(String(def.id), 192, 66);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const balls = [];
function makeBall(def) {
  const mat = new THREE.MeshStandardMaterial({
    map: ballTexture(def), roughness: 0.18, metalness: 0.0,
    envMapIntensity: 0.8,
  });
  const mesh = new THREE.Mesh(ballGeo, mat);
  mesh.castShadow = true;
  mesh.visible = false;
  scene.add(mesh);
  return {
    id: def.id, mesh,
    pos: new THREE.Vector3(), vel: new THREE.Vector3(),
    spin: new THREE.Vector3(),   // 视觉自转轴速度
    alive: false, sinking: 0,
    def,
  };
}
BALL_DEFS.forEach(d => balls.push(makeBall(d)));
const cueBall = balls[0];
const objBalls = () => balls.slice(1);

/* 标准三角摆位 */
function rackBalls() {
  const order = [1, 2, 3, 4, 5, 6, 8, 7, 9, 10, 11, 12, 13, 14, 15];
  // 说明：三角阵第 6 个位置（第三排中间）必须是 8 号；上面这个排列恰好把 8 放在那里。
  // 顺序三角摆位：8 号在第三排中间（第 6 个位置）
  const byId = new Map(balls.map(b => [b.id, b]));
  const apexX = TABLE_W * 0.52;
  const d = R * 2.02;
  let k = 0;
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      const b = byId.get(order[k++]);
      if (!b) continue;
      b.pos.set(apexX + row * d * Math.cos(Math.PI / 6), R, (i - row / 2) * d);
      b.vel.set(0, 0, 0); b.alive = true; b.sinking = 0;
      b.mesh.visible = true;
      b.mesh.position.copy(b.pos);
      b.mesh.rotation.set(0, 0, 0);
    }
  }
  cueBall.pos.set(-TABLE_W / 2, R, 0);   // 开球点：桌面中线、头半区中央
  cueBall.vel.set(0, 0, 0); cueBall.alive = true; cueBall.sinking = 0;
  cueBall.mesh.visible = true;
  cueBall.mesh.position.copy(cueBall.pos);
}
rackBalls();

/* ================= 球杆 ================= */
const cueGroup = new THREE.Group();
const cueShaft = new THREE.Mesh(
  new THREE.CylinderGeometry(0.006, 0.0095, 0.72, 16),
  new THREE.MeshStandardMaterial({ color: 0xc89b5e, roughness: 0.4, metalness: 0.1 }));
cueShaft.rotation.z = Math.PI / 2;
cueGroup.add(cueShaft);
const cueButt = new THREE.Mesh(
  new THREE.CylinderGeometry(0.011, 0.013, 0.24, 16),
  new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.5 }));
cueButt.rotation.z = Math.PI / 2; cueButt.position.x = -0.47;
cueGroup.add(cueButt);
const cueTip = new THREE.Mesh(
  new THREE.CylinderGeometry(0.0068, 0.0068, 0.01, 12),
  new THREE.MeshStandardMaterial({ color: 0x3a6fd8, roughness: 0.8 }));
cueTip.rotation.z = Math.PI / 2; cueTip.position.x = 0.366;
cueGroup.add(cueTip);
cueGroup.position.y = R;
scene.add(cueGroup);

/* 瞄准线（延长线 +  ghost 球） */
const aimLineMat = new THREE.LineDashedMaterial({
  color: 0xfff4d6, dashSize: 0.025, gapSize: 0.02, transparent: true, opacity: 0.85,
});
const aimGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const aimLine = new THREE.Line(aimGeo, aimLineMat);
aimLine.computeLineDistances();
aimLine.position.y = 0.004;
scene.add(aimLine);

const ghost = new THREE.Mesh(
  new THREE.RingGeometry(R * 0.94, R, 40),
  new THREE.MeshBasicMaterial({ color: 0xfff4d6, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
ghost.rotation.x = -Math.PI / 2;
ghost.position.y = 0.004;
scene.add(ghost);

/* ================= 音效 ================= */
const sound = new Sound();
const soundQueue = [];   // 物理子步 → 渲染帧 的待播球碰撞强度

/* ================= 游戏状态 ================= */
const G = {
  started: false,
  turn: 'you',            // 'you' | 'ai'
  phase: 'aim',           // aim | charging | rolling | ballInHand | ai_think | over
  power: 0,
  aimAngle: 0,            // 母球出球方向（弧度，XZ 平面）
  potted: [],             // 本回合落袋 id
  scores: { you: 0, ai: 0 },
  rollingT: 0,
  aiTimer: 0,
  ghostBall: true,        // 母球落袋后自由球
};

const $ = id => document.getElementById(id);
const ui = {
  status: $('status'), turnWho: $('turnWho'),
  you: $('scoreYou'), ai: $('scoreAi'),
  tray: $('tray'), pw: $('powerwrap'), pf: $('powerfill'), pl: $('powerlabel'),
};

function setStatus(html, warn = false) {
  ui.status.innerHTML = warn ? `<span class="warn">${html}</span>` : html;
}
function updateScores() {
  ui.you.textContent = G.scores.you;
  ui.ai.textContent = G.scores.ai;
  ui.turnWho.textContent = G.turn === 'you' ? '你' : '电脑';
}
function updateTray() {
  ui.tray.querySelectorAll('.tb').forEach(n => n.remove());
  G.potted.forEach(id => {
    const def = BALL_DEFS.find(d => d.id === id);
    const n = document.createElement('span');
    n.className = 'tb';
    n.style.background = '#' + def.color.toString(16).padStart(6, '0');
    ui.tray.appendChild(n);
  });
}

/* ================= 物理 ================= */
function allStopped() {
  return balls.every(b => !b.alive || b.sinking > 0 || b.vel.lengthSq() < STOP_EPS * STOP_EPS);
}

function physicsStep(dt) {
  const impact = [];
  // 移动 + 摩擦（指数阻尼模型：与时间步无关，更稳定，手感类似真实滚动阻力）
  const decay = Math.exp(-1.35 * dt);
  for (const b of balls) {
    if (!b.alive || b.sinking > 0) continue;
    const v = b.vel;
    const sp = v.length();
    if (sp > 0) {
      const ns = sp * decay;
      if (ns < STOP_EPS) v.set(0, 0, 0);
      else v.multiplyScalar(ns / sp);
    }
    b.pos.x += v.x * dt;
    b.pos.z += v.z * dt;
    // 视觉滚动
    if (sp > 0) {
      b.spin.set(v.z / R, 0, -v.x / R);
    }
  }

  // 库边反弹（袋口区域放行）
  const cushions = [];
  for (const b of balls) {
    if (!b.alive || b.sinking > 0) continue;
    const nearPocket = POCKETS.some(([px, pz]) => Math.hypot(b.pos.x - px, b.pos.z - pz) < POCKET_R * 1.7);
    if (!nearPocket) {
      if (b.pos.x > TABLE_W - R) { b.pos.x = TABLE_W - R; if (b.vel.x > 0) { cushions.push(Math.abs(b.vel.x)); b.vel.x = -b.vel.x * REST_RAIL; } }
      if (b.pos.x < -TABLE_W + R) { b.pos.x = -TABLE_W + R; if (b.vel.x < 0) { cushions.push(Math.abs(b.vel.x)); b.vel.x = -b.vel.x * REST_RAIL; } }
      if (b.pos.z > TABLE_H - R) { b.pos.z = TABLE_H - R; if (b.vel.z > 0) { cushions.push(Math.abs(b.vel.z)); b.vel.z = -b.vel.z * REST_RAIL; } }
      if (b.pos.z < -TABLE_H + R) { b.pos.z = -TABLE_H + R; if (b.vel.z < 0) { cushions.push(Math.abs(b.vel.z)); b.vel.z = -b.vel.z * REST_RAIL; } }
    } else {
      // 已经越过台面边缘之外太远 → 判落袋（防止从袋口滑出）
      if (Math.abs(b.pos.x) > TABLE_W + 0.06 || Math.abs(b.pos.z) > TABLE_H + 0.07) {
        pocketBall(b);
      }
    }
  }

  // 球-球碰撞
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i];
    if (!a.alive || a.sinking > 0) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j];
      if (!b.alive || b.sinking > 0) continue;
      let dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0 && dist < 2 * R) {
        const nx = dx / dist, nz = dz / dist;
        const overlap = 2 * R - dist;
        a.pos.x -= nx * overlap / 2; a.pos.z -= nz * overlap / 2;
        b.pos.x += nx * overlap / 2; b.pos.z += nz * overlap / 2;
        const van = (a.vel.x - b.vel.x) * nx + (a.vel.z - b.vel.z) * nz;
        if (van > 0) {
          const imp = van * (1 + REST_BALL) / 2;
          a.vel.x -= imp * nx; a.vel.z -= imp * nz;
          b.vel.x += imp * nx; b.vel.z += imp * nz;
          impact.push(van);
        }
      }
    }
  }

  // 落袋检测
  for (const b of balls) {
    if (!b.alive || b.sinking > 0) continue;
    for (const [px, pz] of POCKETS) {
      const d = Math.hypot(b.pos.x - px, b.pos.z - pz);
      if (d < POCKET_R * 0.92) { pocketBall(b); break; }
      if (d < POCKET_R * 1.45) {
        // 临近袋口的轻微吸引
        const k = 1.6 * dt;
        b.vel.x += (px - b.pos.x) / Math.max(d, 1e-4) * k;
        b.vel.z += (pz - b.pos.z) / Math.max(d, 1e-4) * k;
      }
    }
  }

  // 批量发声：本帧所有碰撞合成 1~2 个声源（物理子步内只记录，渲染帧统一播放）
  if (impact.length) {
    const loud = impact.filter(v => v > 0.05);
    if (loud.length) {
      const strongest = Math.max(...loud);
      sound.ballHit(Math.min(1, strongest / 2.2 + 0.15));
      if (loud.length >= 2)
        sound.ballHit(Math.min(1, (strongest * 0.55 + Math.max(loud[0] === strongest ? loud[1] : loud[0]) * 0.45) / 2.2 + 0.1));
    }
  }
  // 库边撞击声（同样批量化）
  if (cushions.length) {
    const cStrong = Math.max(...cushions);
    if (cStrong > 0.06) sound.cushion(Math.min(1, cStrong / 2.2 + 0.2));
  }
}

function pocketBall(b) {
  b.sinking = 0.001;
  b.vel.set(0, 0, 0);
  sound.pocket();
  if (b.id === 0) {
    G.potted.push(0);
  } else {
    G.potted.push(b.id);
  }
}

/* 落袋下沉动画 + 球体同步（渲染层） */
function syncBalls(dt) {
  for (const b of balls) {
    if (b.sinking > 0) {
      b.sinking += dt;
      const t = Math.min(1, b.sinking / 0.45);
      b.mesh.position.y = R - t * (R + 0.12);
      b.mesh.scale.setScalar(1 - t * 0.4);
      if (t >= 1) {
        b.alive = false; b.sinking = 0; b.mesh.visible = false;
      }
      continue;
    }
    if (!b.alive) continue;
    b.mesh.position.copy(b.pos);
    // 纯滚动旋转（绕垂直于速度的水平轴）
    if (b.spin.lengthSq() > 1e-6) {
      const axis = b.spin.clone();
      const ang = axis.length() * dt;
      axis.normalize();
      b.mesh.rotateOnWorldAxis(axis, ang);
      b.spin.multiplyScalar(0.99);
    }
  }
}

/* ================= 回合逻辑 ================= */
function shoot(angle, power) {
  const sp = power * MAX_SPEED;
  cueBall.vel.set(Math.cos(angle) * sp, 0, Math.sin(angle) * sp);
  G.phase = 'rolling';
  G.potted = [];
  G.rollingT = 0;
  sound.cueStrike(power);
  setPowerUI(power);
  ui.pw.classList.remove('on'); ui.pl.classList.remove('on');
  setStatus('击球！');
}

function endOfRoll() {
  const potted = G.potted.filter(i => i !== 0);   // 目标球
  const cueScratch = G.potted.includes(0);         // 母球摔袋
  G.potted = potted.slice();
  const turn = G.turn;

  if (potted.length > 0) {
    G.scores[turn] += potted.length;
    updateTray();
    const names = potted.map(i => `${i} 号球`).join('、');
    setStatus(`${turn === 'you' ? '你' : '电脑'}击落 ${potted.length} 颗：${names}` +
      (cueScratch ? ' —— 但母球摔袋，交换球权！' : '，继续击球！'));
  } else if (cueScratch) {
    setStatus('母球摔袋！犯规 -1 分，交换球权', true);
  } else {
    setStatus(`${turn === 'you' ? '你' : '电脑'}未进，交换球权`);
  }

  if (cueScratch) {
    G.scores[turn] = Math.max(0, G.scores[turn] - 1);
    sound.foul();
  }
  updateScores();

  // 胜负判定
  const remain = objBalls().filter(b => b.alive).length;
  if (remain === 0) {
    finish();
    return;
  }

  // 交换球权？进球且未摔袋 → 同一人继续
  const continueTurn = potted.length > 0 && !cueScratch;
  if (!continueTurn) G.turn = G.turn === 'you' ? 'ai' : 'you';

  // 母球复位
  if (!cueBall.alive) respawnCue();

  // 若本轮已有战报（击球方进球），保留该提示，只补一句球权
  const reportShown = potted.length > 0 && ui.status.textContent.includes('击落');
  if (G.turn === 'you') {
    G.phase = 'aim';
    if (!reportShown) setStatus(continueTurn ? '轮到你 · 继续击球' : '轮到你，请瞄准');
  } else {
    G.phase = 'ai_think';
    G.aiTimer = 0.8 + Math.random() * 0.7;
    if (!reportShown) setStatus('电脑瞄准中…');
  }
}

function respawnCue() {
  cueBall.alive = true; cueBall.sinking = 0;
  cueBall.mesh.visible = true;
  cueBall.mesh.scale.setScalar(1);
  // 从开球点起，若被占则往左找空位
  let x = -TABLE_W / 2;
  for (let t = 0; t < 80; t++) {
    const clash = objBalls().some(b => b.alive && Math.hypot(b.pos.x - x, b.pos.z) < 2.1 * R);
    if (!clash) break;
    x -= 0.03;
  }
  cueBall.pos.set(x, R, 0);
  cueBall.vel.set(0, 0, 0);
}

function finish() {
  G.phase = 'over';
  const win = G.scores.you >= G.scores.ai;
  const tie = G.scores.you === G.scores.ai;
  const ov = $('overlay');
  $('overmsg').innerHTML = tie
    ? `打平了？！那就再来一局！`
    : (win
      ? `🏆 你赢了！ ${G.scores.you} : ${G.scores.ai}<br>清台大师就是你！`
      : `电脑赢了 ${G.scores.ai} : ${G.scores.you}<br>摩拳擦掌，再来一局！`);
  $('startbtn').textContent = '再来一局';
  ov.classList.remove('hide');
  sound.fanfare(win);
}

/* ================= AI ================= */
function aiShoot() {
  const targets = objBalls().filter(b => b.alive);
  if (targets.length === 0) { endOfRoll(); return; }
  let best = null;
  for (const t of targets) {
    for (const [px, pz] of POCKETS) {
      // 母球 → 目标球 → 袋口 的几何解
      const tpx = px - t.pos.x, tpz = pz - t.pos.z;
      const dTP = Math.hypot(tpx, tpz);
      if (dTP < 1e-4) continue;
      const ux = tpx / dTP, uz = tpz / dTP;
      // 假想接触点
      const gx = t.pos.x - ux * 2 * R, gz = t.pos.z - uz * 2 * R;
      const cgx = gx - cueBall.pos.x, cgz = gz - cueBall.pos.z;
      const dCG = Math.hypot(cgx, cgz);
      if (dCG < 1e-4) continue;
      const cx = cgx / dCG, cz = cgz / dCG;
      const cut = cx * ux + cz * uz;          // 切割角余弦
      if (cut < 0.25) continue;               // 太薄，切不进
      if (!pathClear(cueBall.pos, { x: gx, z: gz }, t)) continue;
      if (!pathClear(t.pos, { x: px, z: pz }, null)) continue;
      const score = cut * 2 - dTP * 0.35 - dCG * 0.2 + Math.random() * 0.15;
      if (!best || score > best.score) best = { score, angle: Math.atan2(cz, cx), dCG };
    }
  }
  let power = 0.5, angle = G.aimAngle;
  if (best) {
    angle = best.angle + (Math.random() - 0.5) * 0.02;  // 微扰，电脑也会失误
    power = Math.min(0.85, 0.4 + best.dCG * 0.28);
  } else {
    // 没有可行进球：安全瞎打一杆
    const t = targets[0];
    angle = Math.atan2(t.pos.z - cueBall.pos.z, t.pos.x - cueBall.pos.x)
      + (Math.random() - 0.5) * 0.5;
    power = 0.5;
  }
  shoot(angle, power);
}

// 路径上是否有其它球阻挡
function pathClear(from, to, ignore) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const len = Math.hypot(dx, dz);
  const nx = dx / len, nz = dz / len;
  for (const b of objBalls()) {
    if (!b.alive || b === ignore) continue;
    const px = b.pos.x - from.x, pz = b.pos.z - from.z;
    const t = px * nx + pz * nz;
    if (t <= 0.02 || t >= len - 0.02) continue;
    const d = Math.abs(px * nz - pz * nx);
    if (d < 2 * R - 0.01) return false;
  }
  return true;
}

/* ================= 输入 ================= */
const ray = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R); // 过球心的水平面
const hitPt = new THREE.Vector3();

function pointerAim(e) {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1,
            -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  if (ray.ray.intersectPlane(tablePlane, hitPt)) {
    const dx = hitPt.x - cueBall.pos.x, dz = hitPt.z - cueBall.pos.z;
    if (Math.hypot(dx, dz) > 0.02) G.aimAngle = Math.atan2(dz, dx);
  }
}

renderer.domElement.addEventListener('pointermove', e => {
  if (!G.started || (G.phase !== 'aim' && G.phase !== 'charging')) return;
  if (G.phase === 'aim') pointerAim(e);
});
renderer.domElement.addEventListener('pointerdown', e => {
  if (!G.started || G.phase !== 'aim') return;
  G.phase = 'charging'; G.power = 0;
  ui.pw.classList.add('on'); ui.pl.classList.add('on');
});
addEventListener('pointerup', () => {
  if (G.phase === 'charging' && G.power > 0.03) shoot(G.aimAngle, G.power);
  else if (G.phase === 'charging') { G.phase = 'aim'; ui.pw.classList.remove('on'); }
});
addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') { if (G.phase === 'aim' || G.phase === 'charging') respawnCue(); }
  if (e.key === '0') rackBalls();
});

$('resetBtn').addEventListener('click', () => { sound.click(); location.reload(); });
$('muteBtn').addEventListener('click', () => {
  sound.setMuted(!sound.muted);
  $('muteBtn').textContent = sound.muted ? '🔇 静音' : '🔊 声音';
});
$('startbtn').addEventListener('click', () => {
  sound.resume(); sound.click();
  $('overlay').classList.add('hide');
  if (!G.started) { G.started = true; G.phase = 'aim'; updateScores(); sound.ambience(); }
  else location.reload();
});

/* ================= 蓄力与 UI ================= */
function setPowerUI(p) { ui.pf.style.width = (p * 100).toFixed(0) + '%'; }

/* ================= 主循环 ================= */
const clock = new THREE.Clock();
let acc = 0;

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 蓄力
  if (G.phase === 'charging') {
    G.power = 0.5 + 0.5 * Math.sin(t * 4.2 - Math.PI / 2);
    setPowerUI(G.power);
  }

  // 物理
  if (G.phase === 'rolling' || G.phase === 'ai_think') {
    acc += dt;
    while (acc >= SUBSTEP) { physicsStep(SUBSTEP); acc -= SUBSTEP; }
    if (G.phase === 'rolling') G.rollingT += dt;
    if (G.phase === 'rolling' && (allStopped() || G.rollingT > 12)) endOfRoll();
    if (G.phase === 'ai_think') {
      G.aiTimer -= dt;
      if (G.aiTimer <= 0 && allStopped()) aiShoot();
    }
  }
  syncBalls(dt);

  // 瞄准辅助 + 球杆（仅在已开局、白球存活、轮到玩家时显示）
  const aiming = G.started && (G.phase === 'aim' || G.phase === 'charging') && cueBall.alive && G.turn === 'you';
  cueGroup.visible = aiming;
  aimLine.visible = ghost.visible = aiming;
  if (aiming) {
    const dir = new THREE.Vector3(Math.cos(G.aimAngle), 0, Math.sin(G.aimAngle));
    // 球杆：杆尖在母球瞄准反方向 R+gap 处。rotation.y=θ 把局部 +X 映到 (cosθ,0,-sinθ)，
    // 故取 θ=-aimAngle 时杆身指向世界 dir；杆尾下倾 ~5°（局部 Z 轴）更像真实架杆
    const gap = 0.006 + (G.phase === 'charging' ? G.power * 0.14 : 0.012 + Math.sin(t * 2) * 0.004);
    cueGroup.position.set(
      cueBall.pos.x - dir.x * (R + gap),
      R + 0.008,
      cueBall.pos.z - dir.z * (R + gap));
    cueGroup.rotation.set(0, -G.aimAngle, -0.09);
    // 瞄准线：打到目标球就停；虚线从白球边缘起画，不穿过球体
    ray.set(new THREE.Vector3(cueBall.pos.x, 0.01, cueBall.pos.z), dir);
    let end = cueBall.pos.clone().addScaledVector(dir, 1.6);
    let hitB = null, minT = Infinity;
    for (const b of objBalls()) {
      if (!b.alive || b.sinking > 0) continue;
      const ox = b.pos.x - cueBall.pos.x, oz = b.pos.z - cueBall.pos.z;
      const proj = ox * dir.x + oz * dir.z;
      if (proj <= 0) continue;
      const perp = Math.abs(ox * dir.z - oz * dir.x);
      if (perp < 2 * R) {
        const tHit = proj - Math.sqrt(Math.max(0, 4 * R * R - perp * perp));
        if (tHit < minT) { minT = tHit; hitB = b; }
      }
    }
    if (hitB) {
      end = cueBall.pos.clone().addScaledVector(dir, Math.max(R + 0.01, minT));
      ghost.position.set(end.x, 0.004, end.z);
      ghost.visible = true;
    } else {
      ghost.visible = false;
    }
    const start = cueBall.pos.clone().addScaledVector(dir, R + 0.004);
    const pts = aimGeo.attributes.position;
    pts.setXYZ(0, start.x, 0.004, start.z);
    pts.setXYZ(1, end.x, 0.004, end.z);
    pts.needsUpdate = true;
    aimLine.computeLineDistances();
  }

  // 相机轻微呼吸感
  if (G.started && G.phase !== 'over') {
    camera.position.x = Math.sin(t * 0.1) * 0.06;
    camera.position.y = 1.9 + Math.sin(t * 0.13) * 0.03;
  }
  camera.lookAt(0, 0.04, 0);

  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

updateScores();
setStatus('点击「开局」开始');

/* ================= 调试 API（供自动化冒烟测试） ================= */
const params = new URLSearchParams(location.search);
function installDBG() {
  window.__DBG = {
    G, balls,
    shoot: (a, p) => { if (!G.started) { G.started = true; G.phase = 'aim'; } shoot(a, p); },
    physicsStep, SUBSTEP, R, TABLE_W, TABLE_H,
    cue: () => ({ group: cueGroup.position.toArray(), visible: cueGroup.visible }),
    state: () => ({ phase: G.phase, turn: G.turn, scores: G.scores,
      alive: balls.filter(b => b.alive).length,
      potted: G.potted.slice(), cue: cueBall.pos.toArray() }),
    audit: () => {
      const pts = balls.filter(b => b.alive).map(b => [b.id, +b.pos.x.toFixed(4), +b.pos.z.toFixed(4)]);
      let minPair = Infinity;
      const A = balls.filter(b => b.alive);
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++)
        minPair = Math.min(minPair, Math.hypot(A[i].pos.x - A[j].pos.x, A[i].pos.z - A[j].pos.z));
      return { R, TABLE_W, TABLE_H, minPair: +minPair.toFixed(4), want: 2 * R, pts };
    },
  };
}
installDBG();   // 模块顶层立即挂载（headless 里 rAF 未必会跑第一帧）
if (params.get('autostart') === '1') {
  G.started = true; G.phase = 'aim';
  const ov = document.getElementById('overlay');
  if (ov) ov.classList.add('hide');
}
