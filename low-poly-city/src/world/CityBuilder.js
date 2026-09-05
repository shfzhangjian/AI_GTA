/**
 * CityBuilder —— 把布局数据装配成完整城市：
 * 地面/道路 -> 建筑 -> 植被/道具/车流，并汇总碰撞体与“进入区域”标记。
 */
import * as THREE from 'three';
import { WORLD } from '../config.js';
import { BUILDINGS, TREES, BUSHES, BENCHES, LANES, ZONES } from '../data/cityLayout.js';
import * as GroundBuilder from './GroundBuilder.js';
import * as RoadBuilder from './RoadBuilder.js';
import { buildBuilding } from './BuildingFactory.js';
import { buildTrees, buildBushes } from './NatureBuilder.js';
import { buildStreetlights, buildBench, createTraffic } from './PropBuilder.js';
import { buildAgents } from './AgentBuilder.js';

/**
 * @param {THREE.Scene} scene
 * @param {{carTemplate?:THREE.Object3D|null}} [opts] 肌肉车 GLB 模板（给定则车流第一帧即真模型）
 */
export function buildCity(scene, opts = {}) {
  /** 第一人称碰撞体：建筑用 AABB(Box3)，树/路灯用圆形 */
  const colliders = { boxes: [], circles: [] };
  const addCircle = (x, z, r) => colliders.circles.push({ x, z, r });

  const ground = GroundBuilder.build(scene);
  RoadBuilder.build(scene);

  BUILDINGS.forEach((spec) => scene.add(buildBuilding(spec)));
  buildTrees(scene, TREES, addCircle);
  buildBushes(scene, BUSHES);
  buildStreetlights(scene, addCircle);
  BENCHES.forEach((b) => buildBench(scene, b.x, b.z, b.rotY));
  const traffic = createTraffic(scene, LANES, opts.carTemplate ?? null);

  // 场景图矩阵更新后，把带 collider 标记的主体网格换算成世界 AABB
  scene.updateMatrixWorld(true);
  scene.traverse((m) => {
    if (m.userData.collider === 'box') {
      colliders.boxes.push(new THREE.Box3().setFromObject(m));
    }
  });

  // 随机行人与狗（依赖碰撞体做目标采样，须在汇总之后创建）
  const agents = buildAgents(scene, colliders);
  traffic.attachAvoid(agents.list); // 车流为行人/狗让行刹车

  // ---- 四个“点击进入”区域标记（发光圆环）----
  const zonesGroup = new THREE.Group();
  scene.add(zonesGroup);
  const zones = ZONES.map((z) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.16, 10, 42),
      new THREE.MeshBasicMaterial({ color: 0x2f8fff, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = -Math.PI / 2;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x2f8fff, transparent: true, opacity: 0.12, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    const mesh = new THREE.Group();
    mesh.add(ring, disc);
    mesh.position.set(z.x, WORLD.surfGrass + 0.06, z.z);
    zonesGroup.add(mesh);
    return { ...z, ring, disc, mesh };
  });

  /** 圆环呼吸动画；hovered 为当前悬停区域（加亮） */
  const pulse = (t, hovered) => {
    zones.forEach((z, i) => {
      const act = z === hovered;
      const s = act ? 1 + Math.sin(t * 5) * 0.12 : 1 + Math.sin(t * 2 + i * 1.7) * 0.05;
      z.mesh.scale.set(s, 1, s);
      z.ring.material.opacity = act ? 0.95 : 0.45;
      z.disc.material.opacity = act ? 0.3 : 0.12;
    });
  };

  return { groundPicker: ground.picker, zonesGroup, zones, colliders, traffic, agents, pulse };
}
