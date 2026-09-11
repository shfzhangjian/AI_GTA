/* ============================================================
 * 共享材质 / 几何构造器（全场景复用，保证风格统一与性能）
 * ============================================================ */
import * as THREE from 'three';

/* ---------- 共享材质 ---------- */
export const MAT = {
  floor:      new THREE.MeshStandardMaterial({ color: 0x152238, roughness: .95 }),
  wall:       new THREE.MeshStandardMaterial({ color: 0x9fb4cc, roughness: .8, transparent: true, opacity: .96 }),
  wallDark:   new THREE.MeshStandardMaterial({ color: 0x33465e, roughness: .85 }),
  roof:       new THREE.MeshStandardMaterial({ color: 0x2a3d57, roughness: .8 }),
  glass:      new THREE.MeshStandardMaterial({ color: 0x66c8ff, transparent: true, opacity: .28, roughness: .15, metalness: .6 }),
  steel:      new THREE.MeshStandardMaterial({ color: 0x8fa4bd, metalness: .8, roughness: .35 }),
  steelDark:  new THREE.MeshStandardMaterial({ color: 0x4a5a72, metalness: .7, roughness: .45 }),
  robotArm:   new THREE.MeshStandardMaterial({ color: 0xff8c1a, metalness: .5, roughness: .4 }),
  robotArm2:  new THREE.MeshStandardMaterial({ color: 0x21ccff, metalness: .5, roughness: .4 }),
  conveyor:   new THREE.MeshStandardMaterial({ color: 0x22364f, metalness: .4, roughness: .6 }),
  belt:       new THREE.MeshStandardMaterial({ color: 0x101c2e, roughness: .9 }),
  carPaint:   [0xdfe8f0, 0x1c2733, 0xb4293c, 0x2f6bce, 0x9aa7b4].map(
                c => new THREE.MeshStandardMaterial({ color: c, metalness: .85, roughness: .22 })),
  carBody:    new THREE.MeshStandardMaterial({ color: 0x93a7bf, metalness: .75, roughness: .35 }),
  tire:       new THREE.MeshStandardMaterial({ color: 0x0c1119, roughness: .9 }),
  agv:        new THREE.MeshStandardMaterial({ color: 0xffb020, metalness: .4, roughness: .5 }),
  machine:    new THREE.MeshStandardMaterial({ color: 0x3d5f8a, metalness: .6, roughness: .5 }),
  machineHi:  new THREE.MeshStandardMaterial({ color: 0x1de9b6, metalness: .4, roughness: .4, emissive: 0x0a5c48 }),
  pipe:       new THREE.MeshStandardMaterial({ color: 0x55708c, metalness: .75, roughness: .4 }),
  crate:      new THREE.MeshStandardMaterial({ color: 0x37506f, roughness: .85 }),
  crateAlt:   new THREE.MeshStandardMaterial({ color: 0x2a4058, roughness: .85 }),
  road:       new THREE.MeshStandardMaterial({ color: 0x0a1424, roughness: .95 }),
  green:      new THREE.MeshStandardMaterial({ color: 0x114232, roughness: 1 }),
  trunk:      new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 1 }),
  leaf:       new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: .9 }),
  glowCyan:   new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
  glowGreen:  new THREE.MeshBasicMaterial({ color: 0x19e6a4 }),
  glowYellow: new THREE.MeshBasicMaterial({ color: 0xffc53d }),
  glowRed:    new THREE.MeshBasicMaterial({ color: 0xff4d6b }),
  window:     new THREE.MeshBasicMaterial({ color: 0x9fdcff }),
};

export const matForStatus = s =>
  s === 'running' ? MAT.glowGreen : s === 'idle' ? MAT.glowYellow : MAT.glowRed;

/** 深拷贝场景子树（材质独立、几何共享）。不复制灯光：避免场景灯光超出 uniform 上限 */
export function deepCloneTree(src) {
  const c = src.clone(true);
  c.traverse(o => {
    if (o.isLight) { o.intensity = 0; return; }
    if (o.isMesh || o.isLine || o.isPoints)
      o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
  });
  return c;
}

/* ---------- 基础盒体便捷函数（每网格独立材质，支持车间级透视控制） ---------- */
export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.clone());
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
/** 通用：网格 + 独立材质 */
export function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat.clone());
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

/* ---------- 工业厂房外壳（钢架 + 半透明墙 + 屋顶采光带） ----------
 * opts: { w,d,h, wallMat, roof: 'flat'|'saw', glowColor }
 */
export function factoryShell(w, d, h, opts = {}) {
  const g = new THREE.Group();
  const wallMat = opts.wallMat || MAT.wall;
  const t = 0.25; // 墙厚
  // 四面墙（前后墙留大门洞由调用方装饰）
  box(w, h, t, wallMat, 0, h / 2, -d / 2, g);
  box(w, h, t, wallMat, 0, h / 2, d / 2, g);
  box(t, h, d, wallMat, -w / 2, h / 2, 0, g);
  box(t, h, d, wallMat, w / 2, h / 2, 0, g);
  // 钢柱
  const colGeo = new THREE.BoxGeometry(.5, h, .5);
  for (let i = 0; i <= 4; i++) {
    const x = -w / 2 + (w / 4) * i;
    mesh(colGeo, MAT.steelDark, x, h / 2, -d / 2 + .3, g);
    mesh(colGeo, MAT.steelDark, x, h / 2, d / 2 - .3, g);
  }
  // 屋顶
  if (opts.roof === 'saw') {
    // 锯齿形屋顶：北采光带
    const n = 5, seg = w / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + seg * (i + .5);
      const slope = box(seg * .92, .3, d, MAT.roof, x, h + seg * .13, 0, g);
      slope.rotation.z = 0.24;
      box(.9, seg * .26, d - .6, MAT.glass, x - seg * .40, h + seg * .27, 0, g); // 采光带
    }
    box(w, .35, d, MAT.roof, 0, h - .1, 0, g);
  } else {
    box(w + .6, .4, d + .6, MAT.roof, 0, h + .2, 0, g);
    // 屋顶采光带 + 通风管
    for (let i = 0; i < 3; i++)
      box(w * .7, .18, 1.4, MAT.glass, 0, h + .5, -d / 3 + (d / 3) * i, g);
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, w * .8, 8), MAT.pipe);
    vent.rotation.z = Math.PI / 2; vent.position.set(0, h + 1.1, d / 2 - 1.6); g.add(vent);
  }
  // 屋檐发光描边
  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    new THREE.LineBasicMaterial({ color: opts.glowColor ?? 0x1e90ff, transparent: true, opacity: .55 }));
  edge.position.y = h / 2; g.add(edge);
  return g;
}

/* ---------- 地面网格线（科技感） ---------- */
export function techGround(size = 600, div = 60) {
  const grid = new THREE.GridHelper(size, div, 0x124a7a, 0x0b2547);
  grid.material.transparent = true; grid.material.opacity = .5;
  return grid;
}

/* ---------- 厂区道路（中线虚线 + 边线） ---------- */
export function roadMesh(len, wid = 9, dir = 'x') {
  const g = new THREE.Group();
  const [w, d] = dir === 'x' ? [len, wid] : [wid, len];
  const r = box(w, .06, d, MAT.road, 0, .03, 0, g);
  r.receiveShadow = true;
  // 中线条纹
  const dashGeo = new THREE.PlaneGeometry(dir === 'x' ? 2.4 : .28, dir === 'x' ? .28 : 2.4);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0x35689e });
  const n = Math.floor(len / 5);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(dashGeo, dashMat);   // 厂区道路：共享材质，不参与车间透视
    m.rotation.x = -Math.PI / 2;
    const t = -len / 2 + 2.5 + i * 5;
    m.position.set(dir === 'x' ? t : 0, .08, dir === 'x' ? 0 : t);
    g.add(m);
  }
  return g;
}

/* ---------- 简易载具汽车（低多边形） ---------- */
export function makeCar(paintSet = MAT.carPaint) {
  const g = new THREE.Group();
  const paint = paintSet[Math.floor(Math.random() * paintSet.length)];
  box(4.4, .55, 1.9, paint, 0, .72, 0, g);                 // 车身
  box(2.4, .55, 1.7, paint, -.25, 1.25, 0, g);             // 车顶
  box(2.3, .42, 1.72, MAT.glass, -.25, 1.26, 0, g);        // 玻璃圈
  box(.9, .4, 1.5, MAT.glass, 1.35, 1.15, 0, g);           // 前挡近似
  const wg = new THREE.CylinderGeometry(.42, .42, .32, 14);
  for (const [x, z] of [[1.4,.95],[1.4,-.95],[-1.4,.95],[-1.4,-.95]]) {
    const w = new THREE.Mesh(wg, MAT.tire); w.rotation.x = Math.PI / 2; w.position.set(x, .42, z); g.add(w);
  }
  return g;
}

/* ---------- 白车身（焊装用，无覆盖件骨架感） ---------- */
export function makeBodyInWhite() {
  const g = new THREE.Group();
  box(4.2, .3, 1.8, MAT.carBody, 0, .5, 0, g);
  box(2.2, .9, 1.6, MAT.carBody, -.2, 1.1, 0, g);
  box(.14, 1.4, 1.7, MAT.carBody, 1.5, .85, 0, g);   // 前风挡柱
  box(.14, 1.2, 1.6, MAT.carBody, -1.9, .9, 0, g);
  return g;
}

/* ---------- 底盘 + 车轮（总装合装用） ---------- */
export function makeChassis() {
  const g = new THREE.Group();
  box(4.2, .22, 1.7, MAT.steelDark, 0, .45, 0, g);
  box(1.6, .3, 1.3, MAT.machine, -.3, .62, 0, g);
  const wg = new THREE.CylinderGeometry(.42, .42, .32, 14);
  for (const [x, z] of [[1.4,.95],[1.4,-.95],[-1.4,.95],[-1.4,-.95]]) {
    const w = new THREE.Mesh(wg, MAT.tire); w.rotation.x = Math.PI / 2; w.position.set(x, .42, z); g.add(w);
  }
  return g;
}

/* ---------- 工业机械臂（两段 + 关节，可驱动） ---------- */
export function makeRobot(matArm = MAT.robotArm, scale = 1) {
  const g = new THREE.Group();
  g.add(box(1.0, .35, 1.0, MAT.steelDark, 0, .18, 0));
  const yaw = new THREE.Group(); yaw.position.y = .4; g.add(yaw);
  yaw.add(box(.62, .55, .62, matArm, 0, .25, 0));
  const shoulder = new THREE.Group(); shoulder.position.set(0, .55, 0); yaw.add(shoulder);
  const upper = box(.42, 1.6, .42, matArm, 0, .8, 0); shoulder.add(upper);
  const elbow = new THREE.Group(); elbow.position.set(0, 1.6, 0); shoulder.add(elbow);
  const fore = box(.32, 1.3, .32, matArm, 0, .62, 0); elbow.add(fore);
  const wrist = new THREE.Group(); wrist.position.set(0, 1.25, 0); elbow.add(wrist);
  wrist.add(box(.24, .3, .5, MAT.steelDark, 0, .1, .15));
  // 焊枪 / 喷枪头
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.09, .4, 8), MAT.glowCyan);
  tip.position.set(0, -.05, .5); tip.rotation.x = Math.PI / 2; wrist.add(tip);
  g.scale.setScalar(scale);
  return { group: g, yaw, shoulder, elbow, wrist, tip };
}

/** 让机械臂做拟人作业摆动 */
export function driveRobot(r, t, phase = 0, speed = 1) {
  const s = t * speed + phase;
  r.yaw.rotation.y = Math.sin(s * .55) * 1.15;
  r.shoulder.rotation.x = Math.sin(s * 1.1) * .45 - .25;
  r.elbow.rotation.x = Math.sin(s * 1.1 + 1.6) * .6 + .5;
  r.wrist.rotation.x = Math.sin(s * 2.2) * .3;
}

/* ---------- 传送带（皮带 + 支腿），皮带可滚动贴图感用横纹 ---------- */
export function conveyorBelt(length, dir = 'x', parent) {
  const g = new THREE.Group();
  const horiz = dir === 'x';
  const [w, d] = horiz ? [length, 1.2] : [1.2, length];
  box(w, .5, d, MAT.conveyor, 0, .78, 0, g);
  box(w, .16, d * 1.12, MAT.steelDark, 0, .52, 0, g);
  // 皮带横纹（滚动动画用）
  const slats = [];
  const n = Math.floor(length / 1.1);
  for (let i = 0; i < n; i++) {
    const s = box(horiz ? .14 : 1.2, .06, horiz ? 1.2 : .14,
      new THREE.MeshBasicMaterial({ color: 0x2c4a70 }),
      horiz ? -length / 2 + i * 1.1 + .5 : 0, 1.05, horiz ? 0 : -length / 2 + i * 1.1 + .5, g);
    slats.push(s);
  }
  // 支腿
  const legN = Math.max(2, Math.floor(length / 8));
  for (let i = 0; i <= legN; i++) {
    const t = -length / 2 + (length / legN) * i;
    box(.18, .8, .18, MAT.steelDark, horiz ? t : -.45, .4, horiz ? -.45 : t, g);
    box(.18, .8, .18, MAT.steelDark, horiz ? t : .45, .4, horiz ? .45 : t, g);
  }
  parent && parent.add(g);
  return { group: g, slats };
}

/** 皮带滚动动画：slats 沿方向循环 */
export function driveBelt(belt, length, dir = 'x', speed = 1.6) {
  const step = 1.1;
  for (const s of belt.slats) {
    if (dir === 'x') {
      s.position.x += speed * .016;
      if (s.position.x > length / 2) s.position.x -= Math.floor(length / step) * step;
    } else {
      s.position.z += speed * .016;
      if (s.position.z > length / 2) s.position.z -= Math.floor(length / step) * step;
    }
  }
}

/* ---------- 沿路径移动的工装 / 工件队列 ---------- */
export class Mover {
  /** path: THREE.CatmullRomCurve3；items: Object3D[]；spacing 0~1 */
  constructor(curve, items, spacing = 0.08, speed = 0.02, loop = true) {
    this.curve = curve; this.items = items; this.spacing = spacing;
    this.speed = speed; this.loop = loop; this.t = 0;
    this.done = 0;
  }
  update(dt) {
    this.t += this.speed * dt;
    if (!this.loop && this.t > 1 + this.spacing * this.items.length) { this.done++; return; }
    this.items.forEach((it, i) => {
      let u = this.t - i * this.spacing;
      if (this.loop) { u = ((u % 1) + 1) % 1; }
      else if (u < 0 || u > 1) { it.visible = false; return; }
      it.visible = true;
      const p = this.curve.getPointAt(Math.min(Math.max(u, 0), 1));
      const tan = this.curve.getTangentAt(Math.min(Math.max(u, 0.0001), 0.9999));
      it.position.copy(p);
      it.rotation.y = Math.atan2(-tan.z, tan.x);
    });
  }
}

/* ---------- 压力机（冲压机） ---------- */
export function makePress(scale = 1) {
  const g = new THREE.Group();
  box(3.4, 4.2, 3.0, MAT.machine, 0, 2.1, 0, g);
  box(4.0, .8, 3.4, MAT.steelDark, 0, 4.5, 0, g);
  const ram = box(2.2, 1.1, 2.0, MAT.steel, 0, 2.8, 0, g);   // 滑块（动画）
  box(1.4, .5, 1.4, MAT.machineHi, 0, 1.0, 0, g);           // 模具台
  const lamp = box(.16, .16, .16, MAT.glowGreen, 1.6, 4.0, 1.5, g);
  g.scale.setScalar(scale);
  return { group: g, ram, lamp };
}

/* ---------- 烘干炉 / 喷漆室（发光观察窗） ---------- */
export function makeBooth(w, h, d, glow = 0x21ccff) {
  const g = new THREE.Group();
  box(w, h, d, MAT.wallDark, 0, h / 2, 0, g);
  for (let i = 0; i < Math.floor(w / 3); i++) {
    const win = box(1.6, h * .45, d + .06, new THREE.MeshBasicMaterial({
      color: glow, transparent: true, opacity: .55 }),
      -w / 2 + 2 + i * 3, h * .55, 0, g);
  }
  box(w * .6, .5, .5, MAT.pipe, 0, h + .5, 0, g);
  return g;
}

/* ---------- 货架 / 托盘垛 ---------- */
export function makeRack(w, h, d, levels = 3, parent) {
  const g = new THREE.Group();
  box(.15, h, .15, MAT.steelDark, -w/2, h/2, -d/2, g);
  box(.15, h, .15, MAT.steelDark,  w/2, h/2, -d/2, g);
  box(.15, h, .15, MAT.steelDark, -w/2, h/2,  d/2, g);
  box(.15, h, .15, MAT.steelDark,  w/2, h/2,  d/2, g);
  for (let l = 0; l < levels; l++) {
    const y = (h / levels) * (l + .5);
    box(w, .1, d, MAT.steel, 0, y - h/levels * .4, 0, g);
    const n = 2 + (l % 2);
    for (let i = 0; i < n; i++) {
      const c = box(w/n * .8, h/levels * .62, d * .8,
        (i + l) % 2 ? MAT.crate : MAT.crateAlt,
        -w/2 + (w/n) * (i + .5), y, 0, g);
    }
  }
  parent && parent.add(g);
  return g;
}

/* ---------- AGV 小车 ---------- */
export function makeAGV(withCrate = true) {
  const g = new THREE.Group();
  box(1.7, .45, 1.15, MAT.agv, 0, .35, 0, g);
  box(1.5, .12, 1.0, MAT.steelDark, 0, .62, 0, g);
  if (withCrate) box(1.2, .8, .9, MAT.crate, 0, 1.05, 0, g);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 8), MAT.glowCyan);
  lamp.position.set(0, .78, 0); g.add(lamp);
  const wheel = new THREE.CylinderGeometry(.18, .18, .1, 10);
  for (const [x, z] of [[.6,.55],[.6,-.55],[-.6,.55],[-.6,-.55]]) {
    const w = new THREE.Mesh(wheel, MAT.tire); w.rotation.x = Math.PI / 2; w.position.set(x, .18, z); g.add(w);
  }
  return g;
}

/* ---------- 绿化树 ---------- */
export function makeTree(h = 3) {
  const g = new THREE.Group();
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, h * .45, 6), MAT.trunk);
  tr.position.y = h * .22; g.add(tr);
  const c = new THREE.Mesh(new THREE.ConeGeometry(h * .3, h * .65, 7), MAT.leaf);
  c.position.y = h * .62; g.add(c);
  return g;
}

/* ---------- 路灯 ---------- */
export function makeLampPole(h = 7) {
  const g = new THREE.Group();
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, h, 6), MAT.steelDark);
  p.position.y = h / 2; g.add(p);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
  head.position.y = h; g.add(head);
  const l = new THREE.PointLight(0xffe0a0, 8, 26, 1.8);
  l.position.y = h - .3; g.add(l);
  return g;
}

/* ---------- 烟囱（带烟雾粒子） ---------- */
export function makeChimney(h = 26) {
  const g = new THREE.Group();
  box(3.2, h, 3.2, MAT.wallDark, 0, h / 2, 0, g);
  box(3.8, 1.2, 3.8, MAT.steelDark, 0, h, 0, g);
  // 条纹
  for (let i = 0; i < 3; i++)
    box(3.3, .8, 3.3, new THREE.MeshBasicMaterial({ color: 0x1e90ff, transparent: true, opacity: .3 }),
      0, h * .35 + i * 3, 0, g);
  // 烟雾粒子
  const N = 26, pos = new Float32Array(N * 3), life = new Float32Array(N);
  for (let i = 0; i < N; i++) { life[i] = Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const smoke = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x7f9dbf, size: 2.6, transparent: true, opacity: .3, depthWrite: false }));
  smoke.position.y = h + 1; g.add(smoke);
  return { group: g, smoke, life, pos: geo.attributes.position };
}
