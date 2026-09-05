/**
 * BuildingFactory —— 依据布局数据生成各种低多边形建筑。
 *
 * 每种建筑是一个纯函数：spec -> THREE.Group（已放到世界坐标、基准面为草地顶）。
 * 需要参与第一人称碰撞的“主体”网格会打上 userData.collider = 'box'，
 * CityBuilder 会在场景组装完成后统一换算成 AABB。
 */
import * as THREE from 'three';
import { PALETTE, WORLD } from '../config.js';
import { facadeTexture, glassTexture, cylinderFacadeTexture } from './textures.js';

const std = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.02, ...opts });

/** 立面配色变体（对应参考图中的白蓝塔楼 / 灰色公寓 / 橙色中层） */
const VARIANTS = {
  whiteBlue: { wall: PALETTE.wallWhite, win: PALETTE.winBlue, roof: PALETTE.roofBlue },
  gray:      { wall: PALETTE.wallGray,  win: PALETTE.winGray, roof: PALETTE.roofGray },
  orange:    { wall: PALETTE.wallOrange, win: PALETTE.winCream, roof: PALETTE.roofOrange },
};

function markCollider(mesh) {
  mesh.userData.collider = 'box';
  return mesh;
}

/** 六面材质：±z 用正面窗格（对应宽度 w），±x 用侧面窗格（对应进深 d） */
function facadeMaterials(v, w, h, d) {
  const rows = Math.max(3, Math.round(h / 3.6));
  const front = new THREE.MeshStandardMaterial({
    map: facadeTexture({ wall: v.wall, win: v.win, cols: Math.max(3, Math.round(w / 3.4)), rows }),
    roughness: 0.9,
  });
  const side = new THREE.MeshStandardMaterial({
    map: facadeTexture({ wall: v.wall, win: v.win, cols: Math.max(3, Math.round(d / 3.4)), rows }),
    roughness: 0.9,
  });
  const plain = std(v.wall);
  // BoxGeometry 材质顺序：[+x, -x, +y, -y, +z, -z]
  return [side, side.clone(), plain, plain, front, front.clone()];
}

function glassMaterial(w, h) {
  return new THREE.MeshStandardMaterial({
    map: glassTexture(Math.max(4, Math.round(w / 2.6)), Math.max(4, Math.round(h / 3))),
    roughness: 0.28,
    metalness: 0.15,
  });
}

/** 屋顶压顶：一圈略大于主体的彩色薄盒（参考图标志性的“彩色屋顶边”） */
function roofCap(w, d, color, y) {
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.7, d + 0.6), std(color));
  cap.position.y = y + 0.35;
  cap.castShadow = true;
  return cap;
}

function antenna(h) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 6, 6), std(PALETTE.metal));
  pole.position.y = h + 3;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff5a4e }));
  tip.position.y = h + 6.1;
  g.add(pole, tip);
  return g;
}

/* ------------------------------------------------------------------ */
/* 各类建筑                                                             */
/* ------------------------------------------------------------------ */

/** 高层塔楼：彩色屋顶边，可选侧翼彩板 / 天线 / 屋顶机房 */
function tower(spec) {
  const v = VARIANTS[spec.variant || 'whiteBlue'];
  const { w, d, h } = spec;
  const g = new THREE.Group();

  const body = markCollider(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), facadeMaterials(v, w, h, d)));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body, roofCap(w, d, v.roof, h));

  if (spec.wing) { // 贴附在西侧的橙色竖向彩板（参考图标志性元素）
    const ww = w * 0.42;
    const wing = markCollider(new THREE.Mesh(
      new THREE.BoxGeometry(ww, h * 0.96, d * 0.85), std(PALETTE.wallOrange)));
    wing.position.set(-(w / 2 + ww / 2) + 0.15, h * 0.48, 0);
    wing.castShadow = true;
    const cap = roofCap(ww, d * 0.85, PALETTE.roofOrange, h * 0.96);
    cap.position.x = wing.position.x;
    g.add(wing, cap);
  }
  if (spec.antenna) g.add(antenna(h));
  if (spec.roofUnit) { // 屋顶机房小方块
    const unit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.2), std(PALETTE.wallGray));
    unit.position.set(w * 0.2, h + 1.25, -d * 0.18);
    unit.castShadow = true;
    g.add(unit);
  }
  return g;
}

/** 橙色中层办公楼（塔楼的简化变体） */
function midRise(spec) {
  return tower({ ...spec, variant: 'orange', roofUnit: true });
}

/** 玻璃幕墙面：裙房 + 退台塔楼 + 屋顶绿化 + 白色女儿墙 */
function glassOffice(spec) {
  const { w, d, h } = spec;
  const g = new THREE.Group();

  const podium = markCollider(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMaterial(w, h)));
  podium.position.y = h / 2;
  podium.castShadow = podium.receiveShadow = true;
  g.add(podium);

  const t = spec.tower;
  const towerMesh = markCollider(new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), glassMaterial(t.w, t.h)));
  towerMesh.position.set(t.dx, t.h / 2, t.dz);
  towerMesh.castShadow = true;
  g.add(towerMesh);

  // 裙房屋顶：绿化板块 + 四周白色女儿墙
  const deck = spec.deck;
  const green = new THREE.Mesh(new THREE.BoxGeometry(deck.w, 0.7, deck.d), std(PALETTE.roofGreen));
  green.position.set(deck.dx, h + 0.35, deck.dz);
  green.castShadow = true;
  g.add(green);

  const parapetMat = std('#eef2f6');
  const edge = (pw, pd, px, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.55, pd), parapetMat);
    m.position.set(px, h + 0.28, pz);
    return m;
  };
  g.add(edge(w + 0.4, 0.3, 0, d / 2), edge(w + 0.4, 0.3, 0, -d / 2),
        edge(0.3, d + 0.4, w / 2, 0), edge(0.3, d + 0.4, -w / 2, 0));
  return g;
}

/** 阶梯退台公寓：逐层收分，每级屋顶带绿化种植带 */
function stepped(spec) {
  const v = VARIANTS.gray;
  const g = new THREE.Group();
  let y = 0;
  spec.steps.forEach((s, i) => {
    const body = markCollider(new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), facadeMaterials(v, s.w, s.h, s.d)));
    body.position.y = y + s.h / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);

    const last = i === spec.steps.length - 1;
    g.add(roofCap(s.w, s.d, PALETTE.roofGray, y + s.h));
    if (!last) { // 退台上的一条绿化种植带
      const next = spec.steps[i + 1];
      const planter = new THREE.Mesh(
        new THREE.BoxGeometry(s.w * 0.7, 0.55, (s.d - next.d) / 2 - 0.4), std(PALETTE.roofGreen));
      planter.position.set(0, y + s.h + 0.3, (s.d + next.d) / 4);
      planter.castShadow = true;
      g.add(planter);
    }
    y += s.h;
  });
  return g;
}

/** 红顶小镇房：白墙 + 三棱山墙屋顶 + 木门 */
function house(spec) {
  const { w, d, h } = spec;
  const v = VARIANTS.whiteBlue;
  const g = new THREE.Group();

  const body = markCollider(new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d), facadeMaterials(v, w, h, d)));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  // 山墙屋顶：三角形沿 z 挤出
  const shape = new THREE.Shape();
  shape.moveTo(-(w / 2 + 0.6), 0);
  shape.lineTo(0, 2.4);
  shape.lineTo(w / 2 + 0.6, 0);
  shape.closePath();
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: d + 1.0, bevelEnabled: false });
  roofGeo.translate(0, 0, -(d + 1) / 2);
  const roof = new THREE.Mesh(roofGeo, std('#e8622c', { flatShading: true }));
  roof.position.y = h;
  roof.castShadow = true;
  g.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.14), std('#6b4a2f'));
  door.position.set(-w * 0.18, 1.1, d / 2 + 0.07);
  g.add(door);
  return g;
}

/** 圆角塔楼：圆柱主体 + 通高玻璃带纹理 + 蓝色圆顶盖 */
function roundTower(spec) {
  const { r, h } = spec;
  const g = new THREE.Group();

  const mat = new THREE.MeshStandardMaterial({
    map: cylinderFacadeTexture({
      wall: PALETTE.wallWhite, glass: PALETTE.winBlue,
      cols: Math.max(8, Math.round((2 * Math.PI * r) / 3)),
      rows: Math.max(6, Math.round(h / 3.4)),
    }),
    roughness: 0.85,
  });
  const body = markCollider(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), mat));
  body.position.y = h / 2;
  body.castShadow = body.receiveShadow = true;
  g.add(body);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.7, 16), std(PALETTE.roofBlue));
  cap.position.y = h + 0.35;
  cap.castShadow = true;
  g.add(cap);

  if (spec.antenna) g.add(antenna(h));
  return g;
}

/* ------------------------------------------------------------------ */

const FACTORY = { tower, midRise, glassOffice, stepped, house, roundTower };

/** 布局数据 -> 场景节点。 @param {object} spec cityLayout.js 中的建筑条目 */
export function buildBuilding(spec) {
  const fn = FACTORY[spec.type];
  if (!fn) throw new Error(`未知建筑类型: ${spec.type}`);
  const g = fn(spec);
  g.position.set(spec.x, WORLD.surfGrass, spec.z);
  return g;
}
