/* ============================================================
 * 工厂外部全景：厂区地面、五大车间、道路、AGV 物流、
 * 停车/发运场、绿化、烟囱、飞行物流线
 * ============================================================ */
import * as THREE from 'three';
import {
  MAT, box, factoryShell, techGround, roadMesh, makeCar, makeAGV,
  makeTree, makeLampPole, makeChimney, makeRack, Mover,
} from './builders.js';

/* ---------- 数字孪生数据地坪：径向光晕 + 同心圆 + 流动刻度 ---------- */
function dataFloorTexture() {
  const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const cx = S / 2, cy = S / 2;
  // 底色渐变
  const bg = g.createRadialGradient(cx, cy, 40, cx, cy, S / 2);
  bg.addColorStop(0, 'rgba(20,70,150,.9)');
  bg.addColorStop(.45, 'rgba(10,32,72,.75)');
  bg.addColorStop(.8, 'rgba(5,14,34,.35)');
  bg.addColorStop(1, 'rgba(4,10,26,0)');
  g.fillStyle = bg; g.fillRect(0, 0, S, S);
  // 同心圆刻度
  g.strokeStyle = 'rgba(60,160,255,.5)';
  for (const r of [150, 260, 380, 470]) {
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  }
  g.setLineDash([4, 10]); g.strokeStyle = 'rgba(0,229,255,.55)'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy, 320, 0, Math.PI * 2); g.stroke();
  g.setLineDash([]);
  // 放射刻度
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2, l = i % 4 === 0 ? 34 : 16;
    g.strokeStyle = i % 4 === 0 ? 'rgba(120,220,255,.7)' : 'rgba(60,140,230,.35)';
    g.lineWidth = i % 4 === 0 ? 2.4 : 1.2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * 470, cy + Math.sin(a) * 470);
    g.lineTo(cx + Math.cos(a) * (470 - l), cy + Math.sin(a) * (470 - l));
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 车间建筑布置表（与 data.js SHOPS 对应） */
export const LAYOUT = {
  stamping:  { x: -78, z: -46, w: 52, d: 34, h: 12, roof: 'saw',  label: '冲压车间' },
  welding:   { x:   0, z: -46, w: 60, d: 34, h: 14, roof: 'saw',  label: '焊装车间' },
  painting:  { x:  78, z: -46, w: 52, d: 34, h: 13, roof: 'flat', label: '涂装车间' },
  assembly:  { x:  10, z:  30, w: 96, d: 40, h: 15, roof: 'flat', label: '总装车间' },
  logistics: { x: 118, z:  30, w: 40, d: 40, h: 11, roof: 'flat', label: '仓储物流中心' },
};

export function buildFactory(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const anim = { robots: [], movers: [], chimneys: [], belts: [], lights: [] };

  /* ---- 地面 ---- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 500),
    new THREE.MeshStandardMaterial({ color: 0x0a1730, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; root.add(ground);
  const grid = techGround(700, 70); grid.position.y = .02; root.add(grid);
  // 数字孪生数据地坪（厂区中心光晕盘）
  const disc = new THREE.Mesh(new THREE.CircleGeometry(240, 96),
    new THREE.MeshBasicMaterial({ map: dataFloorTexture(), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = .06; root.add(disc);

  /* ---- 主环路 ---- */
  const addRoad = (len, wid, dir, x, z) => {
    const r = roadMesh(len, wid, dir); r.position.set(x, 0, z); root.add(r);
  };
  addRoad(300, 10, 'x', 10, -8);
  addRoad(140, 9, 'z', -128, -10);
  addRoad(140, 9, 'z', 158, -10);
  addRoad(260, 9, 'x', 10, 62);

  /* ---- 车间建筑 ---- */
  const shells = {};
  for (const [id, L] of Object.entries(LAYOUT)) {
    const shell = factoryShell(L.w, L.d, L.h, { roof: L.roof, glowColor: 0x1e90ff });
    shell.position.set(L.x, 0, L.z);
    root.add(shell);
    shells[id] = shell;
    // 大门 + 厂牌
    const gate = box(8, L.h * .48, .6, new THREE.MeshBasicMaterial({ color: 0x0d2c52 }),
      L.x - L.w * .28, L.h * .24, L.z + L.d / 2 + .2, root);
    const sign = box(6, 1.6, .3, new THREE.MeshBasicMaterial({ color: 0x0a2440 }),
      L.x + L.w * .2, 4.6, L.z + L.d / 2 + .5, root);
    box(5.6, 1.1, .32, new THREE.MeshBasicMaterial({ color: 0x1d7fe0 }),
      L.x + L.w * .2, 4.6, L.z + L.d / 2 + .55, root);
    // 建筑周边警戒发光条
    const skirt = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-L.w/2, .1, -L.d/2), new THREE.Vector3(L.w/2, .1, -L.d/2),
        new THREE.Vector3(L.w/2, .1, L.d/2),  new THREE.Vector3(-L.w/2, .1, L.d/2)]),
      new THREE.LineBasicMaterial({ color: 0x00c8ff, transparent: true, opacity: .8 }));
    skirt.position.set(L.x, 0, L.z); root.add(skirt);
  }

  /* ---- 车间间连廊 / 传输线（顶视可视化流程） ---- */
  const _pulse = [];
  function transferLine(from, to, y = 6.5, color = 0x00e5ff) {
    const a = new THREE.Vector3(LAYOUT[from].x, y, LAYOUT[from].z);
    const b = new THREE.Vector3(LAYOUT[to].x, y, LAYOUT[to].z);
    a.y = b.y = y;
    const g = new THREE.Group(); root.add(g);
    // 桁架
    const dir = b.clone().sub(a); const len = dir.length();
    box(len, .5, 1.4, MAT.steelDark, 0, 0, 0, g);
    g.position.copy(a.clone().add(b).multiplyScalar(.5));
    g.rotation.y = Math.atan2(-dir.z, dir.x);
    for (let i = 0; i <= len; i += 4) {
      box(.25, .9, .25, MAT.steel, -len/2 + i, .5, 0, g);
    }
    // 流动光带（沿桁架滑动发光条）
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85 });
    const flow = box(5, .7, 1.7, glowMat, 0, .5, 0, g);
    // 移动工件
    const items = [];
    for (let i = 0; i < 4; i++) {
      const it = box(1.6, .5, 1.0, new THREE.MeshBasicMaterial({ color }), 0, .8, 0, g);
      items.push(it);
    }
    const curve = new THREE.CatmullRomCurve3(
      [new THREE.Vector3(-len/2, 0, 0), new THREE.Vector3(len/2, 0, 0)]);
    anim.movers.push(new Mover(curve, items, .26, .06));
    _pulse.push({ flow, len, speed: 14 + Math.random() * 6, t: Math.random() * len });
    return { group: g, from, to };
  }
  transferLine('stamping', 'welding');
  transferLine('welding', 'painting');
  transferLine('painting', 'assembly', 7.5, 0x19e6a4);
  transferLine('assembly', 'logistics', 6, 0xb388ff);

  /* ---- AGV 环形物流（总装↔物流↔焊装） ---- */
  const agvPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-40, .0, 8), new THREE.Vector3(60, .0, 8),
    new THREE.Vector3(118, .0, 8), new THREE.Vector3(140, .0, 20),
    new THREE.Vector3(140, .0, 52), new THREE.Vector3(60, .0, 52),
    new THREE.Vector3(-40, .0, 52), new THREE.Vector3(-70, .0, 30),
  ], true, 'catmullrom', .4);
  // 路径可视化
  const pv = new THREE.BufferGeometry().setFromPoints(agvPath.getPoints(160));
  root.add(new THREE.Line(pv, new THREE.LineDashedMaterial({
    color: 0x00e5ff, dashSize: 1.6, gapSize: 1.2, transparent: true, opacity: .5 })));
  const agvs = [];
  for (let i = 0; i < 6; i++) {
    const a = makeAGV(i % 2 === 0); a.position.y = .05; root.add(a); agvs.push(a);
  }
  anim.movers.push(new Mover(agvPath, agvs, .16, .035));

  /* ---- 月台装卸（物流中心南面） ---- */
  for (let i = 0; i < 4; i++) {
    const dock = box(7, 1.2, 3, MAT.steelDark, 100 + i * 10, .6, 52, root);
    const truck = new THREE.Group(); root.add(truck);
    box(6, 2.6, 2.4, new THREE.MeshStandardMaterial({ color: 0xdde6ee, roughness: .6 }), 0, 2, 0, truck);
    box(2.2, 1.8, 2.4, new THREE.MeshStandardMaterial({ color: 0x2f6bce }), 4.2, 1.6, 0, truck);
    const wg = new THREE.CylinderGeometry(.5, .5, .3, 10);
    for (const [x, z] of [[1.5,1.2],[1.5,-1.2],[-1.8,1.2],[-1.8,-1.2]]) {
      const w = new THREE.Mesh(wg, MAT.tire); w.rotation.x = Math.PI/2; w.position.set(x, .5, z); truck.add(w);
    }
    truck.position.set(100 + i * 10, 0, 57 + (i % 2) * 1.5);
    truck.rotation.y = Math.PI / 2;
  }

  /* ---- 成品发运场（总装东南） ---- */
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 8; c++) {
      const car = makeCar();
      car.position.set(-30 + c * 6, 0, 44 + r * 4.6);
      car.rotation.y = Math.PI / 2 + (Math.random() - .5) * .08;
      car.scale.setScalar(.8); root.add(car);
    }

  /* ---- 原料堆场（冲压西侧：板料卷） ---- */
  const coilGeo = new THREE.CylinderGeometry(1.6, 1.6, 2.6, 18);
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 5; c++) {
      const coil = new THREE.Mesh(coilGeo, MAT.steel);
      coil.rotation.x = Math.PI / 2;
      coil.position.set(-120 + c * 5, 1.6, -30 + r * 6);
      root.add(coil);
    }

  /* ---- 办公楼（入口区） ---- */
  (function office() {
    const g = new THREE.Group(); g.position.set(-96, 0, 46); root.add(g);
    box(26, 18, 14, MAT.wallDark, 0, 9, 0, g);
    // 发光窗阵
    const winGeo = new THREE.PlaneGeometry(1.6, 1.1);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });
    const winMatOff = new THREE.MeshBasicMaterial({ color: 0x16324f });
    for (let ix = 0; ix < 8; ix++)
      for (let iy = 0; iy < 5; iy++) {
        const w = new THREE.Mesh(winGeo, Math.random() < .62 ? winMat : winMatOff);
        w.position.set(-10.5 + ix * 3, 3.5 + iy * 3.1, 7.05, g); g.add(w);
      }
    box(8, 3.4, 2, MAT.glass, 0, 1.7, 7.4, g); // 门厅玻璃
    box(30, .4, 18, MAT.roof, 0, 18.2, 0, g);
    const logo = box(10, 1.6, .3, new THREE.MeshBasicMaterial({ color: 0x00e5ff }), 0, 16.4, 7.3, g);
  })();

  /* ---- 能源站：烟囱 ×2 + 罐区 ---- */
  for (const [x, z] of [[150, -60], [162, -52]]) {
    const ch = makeChimney(30);
    ch.group.position.set(x, 0, z); root.add(ch.group); anim.chimneys.push(ch);
  }
  const tankGeo = new THREE.CylinderGeometry(3.4, 3.4, 6, 16);
  for (let i = 0; i < 3; i++) {
    const t = new THREE.Mesh(tankGeo, MAT.steel);
    t.position.set(140 + i * 8, 3, -70); root.add(t);
    box(7, .3, 1.6, MAT.pipe, 140 + i * 8, .5, -70 + 3, root);
  }

  /* ---- 绿化 & 路灯 ---- */
  for (let i = 0; i < 26; i++) {
    const t = makeTree(2.6 + Math.random() * 2);
    t.position.set(-150 + Math.random() * 320, 0, 68 + Math.random() * 16); root.add(t);
  }
  for (let i = 0; i < 10; i++) {
    const lp = makeLampPole(6.5);
    lp.position.set(-105 + i * 24, 0, 2); root.add(lp);
  }
  // 车间周边草坪带
  for (const [x, z, w, d] of [[-78,-24,52,6],[0,-24,60,6],[78,-24,52,6]]) {
    const lawn = box(w, .12, d, MAT.green, x, .06, z, root);
  }

  /* ---- 厂区围栏 ---- */
  (function fence() {
    const pts = [[-170,-90],[190,-90],[190,90],[-170,90]];
    const fm = new THREE.LineBasicMaterial({ color: 0x1d7fe0, transparent: true, opacity: .45 });
    for (let i = 0; i < 4; i++) {
      const a = new THREE.Vector3(...pts[i], .0), b = new THREE.Vector3(...pts[(i+1)%4], .0);
      a.y = 1.6; b.y = 1.6;
      root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), fm));
    }
  })();

  /** 每帧更新 */
  function update(t, dt) {
    for (const m of anim.movers) m.update(dt);
    for (const p of _pulse) {
      p.t = (p.t + p.speed * dt) % (p.len + 10);
      p.flow.position.x = -p.len / 2 + p.t - 5;
    }
    for (const ch of anim.chimneys) {
      const pos = ch.pos, N = pos.count;
      for (let i = 0; i < N; i++) {
        let y = pos.getY(i) + dt * (1.6 + (i % 5) * .25);
        let x = pos.getX(i) + dt * .5;
        if (y > 16) { y = 0; x = (Math.random() - .5) * 2; pos.setZ(i, (Math.random() - .5) * 2); }
        pos.setY(i, y); pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
  }

  return { root, shells: shells, layout: LAYOUT, update, anim };
}
