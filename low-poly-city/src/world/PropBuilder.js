/**
 * PropBuilder —— 路灯、长椅，以及沿车道循环行驶的动态车流。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';
import { normalizeCarClone } from './CarModel.js';

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ---------------- 路灯（杆 + 发光球头） ---------------- */

function createStreetlight() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.4, 6), std(PALETTE.metal, { metalness: 0.4 }));
  pole.position.y = 2.2;
  pole.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8),
    new THREE.MeshBasicMaterial({ color: PALETTE.lampGlow }));
  head.position.y = 4.55;
  g.add(pole, head);
  return g;
}

/** 沿两条主路的人行道边缘等距布置路灯（避开路口） */
export function buildStreetlights(scene, addCircle) {
  const g = new THREE.Group();
  const off = WORLD.roadHalf + WORLD.walk - 1; // 人行道靠草侧
  for (let p = -56; p <= 56; p += 14) {
    if (Math.abs(p) < 12) continue;
    const spots = [
      [p,  off], [p, -off],
      [ off, p], [-off, p],
    ];
    for (const [x, z] of spots) {
      const lamp = createStreetlight();
      lamp.position.set(x, WORLD.surfGrass, z);
      g.add(lamp);
      addCircle(x, z, 0.25);
    }
  }
  scene.add(g);
  return g;
}

/* ---------------- 长椅 ---------------- */

export function buildBench(scene, x, z, rotY = 0) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.55), std(PALETTE.wood));
  seat.position.y = 0.46;
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), std(PALETTE.wood));
  back.position.set(0, 0.75, -0.22);
  const legMat = std(PALETTE.metal);
  for (const lx of [-0.7, 0.7]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.46, 0.5), legMat);
    leg.position.set(lx, 0.23, 0);
    g.add(leg);
  }
  g.add(seat, back);
  g.children.forEach((m) => { m.castShadow = true; });
  g.position.set(x, WORLD.surfGrass, z);
  g.rotation.y = rotY;
  scene.add(g);
}

/* ---------------- 汽车与车流 ---------------- */

const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 10);

/** 车头朝 +x。返回的 Group 原点在“地面接触面”；尾随尾灯材质单独暴露用于刹车点亮。 */
function createCar(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.7, 1.6), std(color, { roughness: 0.5 }));
  body.position.y = 0.85;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 1.42),
    std(0x2f3a46, { metalness: 0.3, roughness: 0.35 }));
  cabin.position.set(-0.15, 1.42, 0);
  cabin.castShadow = true;
  const wheelMat = std(0x2a2e33);
  for (const [wx, wz] of [[1.15, 0.78], [1.15, -0.78], [-1.15, 0.78], [-1.15, -0.78]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2; // 轴转向 z（车宽方向）
    wheel.position.set(wx, 0.3, wz);
    g.add(wheel);
  }
  const tailMat = new THREE.MeshBasicMaterial({ color: TAIL_OFF });
  for (const tz of [-0.45, 0.45]) { // 车尾（-x）两枚尾灯
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.22), tailMat);
    tl.position.set(-1.73, 0.92, tz);
    g.add(tl);
  }
  g.add(body, cabin);
  return { group: g, tailMat };
}

const TAIL_OFF = '#5a1010'; // 尾灯熄灭（暗红）
const TAIL_ON = '#ff3b30';  // 刹车点亮（亮红）

function rotFor(axis, dir) {
  if (axis === 'x') return dir > 0 ? 0 : Math.PI;
  return dir > 0 ? -Math.PI / 2 : Math.PI / 2; // 车头朝 ±z
}

/**
 * 创建循环车流（带让行刹车）。lane 定义：axis=行驶轴，lane=横向坐标，dir=方向。
 * 刹车条件：① 车道正前方 5.4m 内有行人/狗（attachAvoid 注入）；② 同车道同向前车 <6m（防追尾）。
 * @returns {{update:(dt:number)=>void, attachAvoid:(list:Array)=>void}}
 */
export function createTraffic(scene, lanes) {
  const cars = [];
  const g = new THREE.Group();
  for (const lane of lanes) {
    for (let i = 0; i < lane.count; i++) {
      const color = PALETTE.car[(i + Math.round(Math.abs(lane.lane))) % PALETTE.car.length];
      const { group: mesh, tailMat } = createCar(color);
      mesh.rotation.y = rotFor(lane.axis, lane.dir);
      if (lane.axis === 'x') mesh.position.z = lane.lane;
      else mesh.position.x = lane.lane;
      mesh.position.y = WORLD.surfRoad;
      g.add(mesh);
      const dir = lane.dir;
      const p0 = -58 + (i * 116) / lane.count + Math.random() * 6; // 沿线初始位置
      if (lane.axis === 'x') mesh.position.x = p0;
      else mesh.position.z = p0;
      cars.push({
        mesh, tailMat, color,
        axis: lane.axis,
        laneCoord: lane.lane,
        p: p0,
        v: lane.speed * dir * (0.8 + Math.random() * 0.4),
        f: lane.axis === 'x' ? { x: dir, z: 0 } : { x: 0, z: dir },   // 前进单位向量
        s: lane.axis === 'x' ? { x: 0, z: 1 } : { x: 1, z: 0 },       // 横向单位向量
        dead: false,      // 被火箭弹摧毁
        deadT: 0,         // 残骸剩余存在时间
      });
    }
  }
  scene.add(g);

  let avoidList = []; // 行人/狗列表（AgentBuilder.list）
  const wrap = (p) => (p > 61 ? p - 122 : p < -61 ? p + 122 : p);
  const _axis = new THREE.Vector3(); // 车轮滚动轴复用量
  const _fwdv = new THREE.Vector3();

  return {
    attachAvoid(list) { avoidList = list || []; },

    /** 所有车辆的轴对齐矩形（车只以 90° 倍数转向，投影恒为 AABB），供玩家碰撞阻挡 */
    carRects() {
      const out = [];
      for (const c of cars) {
        const p = c.mesh.position;
        if (c.axis === 'x') out.push({ x: p.x, z: p.z, hx: 1.85, hz: 1.0 });
        else out.push({ x: p.x, z: p.z, hx: 1.0, hz: 1.85 });
      }
      return out;
    },

    /**
     * 用 simple-muscle-car GLB 模板替换全部在用车辆的程序化占位模型（逐车换漆 + 保留尾灯）。
     * @param {THREE.Object3D} template loadMuscleCarTemplate() 结果
     */
    setCarTemplate(template) {
      for (const c of cars) {
        if (c.dead) continue;
        const wrap2 = normalizeCarClone(template, 4.3, c.color);
        for (const tz of [-0.45, 0.45]) { // 尾灯跟到新模型车尾（-x）
          const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.22), c.tailMat);
          tl.position.set(-2.05, 0.8, tz);
          wrap2.add(tl);
        }
        const old = c.mesh;
        wrap2.position.copy(old.position);
        wrap2.rotation.y = old.rotation.y;
        g.remove(old);
        g.add(wrap2);
        c.mesh = wrap2;
        c.wheels = wrap2.userData.wheels || null; // 供逐帧滚动
        c.wheelR = wrap2.userData.wheelRadius || 0.33;
      }
    },

    /**
     * 爆炸摧毁附近车辆：烧黑、抛锚成路障（仍阻挡玩家/后车），约 25s 后塌缩消失。
     * @returns {Array<{mesh:THREE.Object3D}>} 本次新摧毁的车辆（供挂燃烧特效）
     */
    damageAt(x, z, radius = 6) {
      const wrecks = [];
      for (const c of cars) {
        if (c.dead) continue;
        const p = c.mesh.position;
        if (Math.hypot(p.x - x, p.z - z) > radius + 1.6) continue;
        c.dead = true;
        c.deadT = 25;
        c.tailMat.color.set('#3a0d0d'); // 烧毁尾灯
        c.mesh.traverse((m) => {
          if (m.isMesh && m.material.isMeshStandardMaterial) {
            m.material.color.set(0x24262a); // 碳黑残骸
            m.material.roughness = 0.98;
            m.material.metalness = 0;
          }
        });
        wrecks.push(c);
      }
      return wrecks;
    },

    update(dt) {
      // 残骸超时移除（避免永久堵路）；末期缩小淡出，表现"烧穿塌掉"
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i];
        if (!c.dead) continue;
        c.deadT -= dt;
        if (c.deadT <= 0) {
          g.remove(c.mesh);
          cars.splice(i, 1);
        } else if (c.deadT < 1.5) {
          c.mesh.scale.setScalar(Math.max(0.02, c.deadT / 1.5));
        }
      }

      for (const c of cars) {
        if (c.dead) continue; // 残骸静止，仍作为防追尾障碍与玩家碰撞体
        let blocked = false;

        // ① 让行：车道正前方近距离内有行人/狗
        const px = c.mesh.position.x;
        const pz = c.mesh.position.z;
        for (const a of avoidList) {
          const rx = a.x - px;
          const rz = a.z - pz;
          const lon = rx * c.f.x + rz * c.f.z;
          if (lon > 0.3 && lon < 5.4 && Math.abs(rx * c.s.x + rz * c.s.z) < 1.7) {
            blocked = true;
            break;
          }
        }

        // ② 防追尾：同车道同向前车过近（处理回绕边界）
        if (!blocked) {
          for (const o of cars) {
            if (o === c || o.axis !== c.axis || o.laneCoord !== c.laneCoord) continue;
            if (Math.sign(o.v) !== Math.sign(c.v)) continue;
            let lon = (o.p - c.p) * Math.sign(c.v);
            if (lon < -61) lon += 122;
            if (lon > 0.5 && lon < 6) {
              blocked = true;
              break;
            }
          }
        }

        c.tailMat.color.set(blocked ? TAIL_ON : TAIL_OFF);
        if (blocked) continue; // 刹停，目标离开后自动恢复

        c.p = wrap(c.p + c.v * dt);
        if (c.axis === 'x') c.mesh.position.x = c.p;
        else c.mesh.position.z = c.p;

        // GLB 车轮真实滚动：ω_world = up × forward · v/r（与行驶方向自动匹配）
        if (c.wheels) {
          const ang = (Math.abs(c.v) * dt) / (c.wheelR || 0.33);
          _axis.set(0, 1, 0).cross(_fwdv.set(c.f.x, 0, c.f.z)).multiplyScalar(Math.sign(c.v));
          for (const w of c.wheels) w.rotateOnWorldAxis(_axis, ang);
        }
      }
    },
  };
}
