/**
 * PortManager.js — 港口聚落（§15 / §35）
 *
 * 每个港口按「球面局部坐标系」布置：
 *   · 取港口中心的切空间（north / east / normal），把一张「港口平面图」铺到球面上
 *   · 所有模型用 GeoUtils.alignObjectToSurface 定位 → UP = 球面外法线（北极↑/赤道→/南极↓）
 *   · forward 用「朝海方向」或聚落内朝向 → 建筑/码头/旗帜朝向合理
 *   · 落位走 TerrainSampler（与陆地显示同一高度场）→ 不悬浮不陷地
 *
 * ⚠ 所有模型尺寸/朝向修正只在 ModelUtils.MODEL_SPECS，本文件不写裸 scale。
 */
import * as THREE from 'three';
import { PLANET, SHIPS } from '../config.js';
import { alignObjectToSurface } from '../utils/GeoUtils.js';
import { mulberry32 } from '../planet/Clouds.js';
import { surfaceFrameAt } from './TerrainSampler.js';
import { InstancedPropLayer, bakeInstancedAsset } from './InstancedPropLayer.js';

/**
 * 港口平面图（局部 2D：x=east, y=north；单位=世界单位）。
 * 「海」方向 = -y（朝向赤道外海）。这是美术布局参数，不是模型修正值。
 * major：主港（塔楼/城门/民居/码头/大炮/旗）；small：小渔村（民居/码头/旗/桶箱）。
 */
/**
 * 方形城墙生成器：沿矩形周长摆墙 + 角楼 + 正海大门。
 * 平面坐标 x=east, y=north（单位=世界单位，海在 -y 侧）。
 * 实测：castle-wall 宽 2×unit2.2 = 4.4 世界单位 → 间距 4.4 首尾相接；
 *      tower-base 占地 3.16×2 = 6.3 → 角楼放四角，墙在角楼内侧相接。
 * @param {{x1,y1,x2,y2:number, gate:'south', corner:{model:string, stack:number}[]}} rect
 */
function squareWallLayout(rect) {
  const { x1, y1, x2, y2 } = rect;
  const out = [];
  // castle-wall 模型宽 2 × unit2.2 = 4.4 世界单位 → 间距 4.4 首尾相接
  const WALL_PITCH = 4.4;
  const TOWER_INSET = 1.0;          // 角楼内缩（tower-base 占地半径 ≈3.2）

  /** 边上从 (ax,ay) 到 (bx,by) 铺 wall/window（间隔一个用 window  variation） */
  const edge = (ax, ay, bx, by, heading) => {
    const len = Math.hypot(bx - ax, by - ay);
    // 向上取整 → 短边至少一段，长边间隙 ≤ pitch（无缝感优先）
    const n = Math.max(1, Math.ceil(len / WALL_PITCH));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const model = i % 3 === 1 ? 'castle-window' : 'castle-wall';
      out.push({ model, x: ax + (bx - ax) * t, y: ay + (by - ay) * t, heading });
    }
  };

  // 四角角楼（tower-base + tower-top + tower-roof 三层一体）
  const corners = [
    [x1, y1, 45], [x2, y1, 315], [x1, y2, 135], [x2, y2, 225],
  ];
  for (const [cx, cy, hd] of corners) {
    out.push({ model: 'tower-base', x: cx, y: cy, heading: hd });
    out.push({ model: 'tower-top', x: cx, y: cy, heading: hd, stack: 3.9 });
    out.push({ model: 'tower-roof', x: cx, y: cy, heading: hd, stack: 9.5 });
  }

  const ix1 = x1 + TOWER_INSET, ix2 = x2 - TOWER_INSET;
  const iy1 = y1 + TOWER_INSET, iy2 = y2 - TOWER_INSET;

  // 南墙（朝海 -y 一侧）：正中被大门打断，两段墙 + 中央 castle-gate
  const gateW = 3.6;                        // castle-gate 宽 4×2.2 ≈ 8.8 → 门洞 3.6 + 两侧墙咬合
  edge(ix1, iy1, -gateW / 2, iy1, 180);
  edge(gateW / 2, iy1, ix2, iy1, 180);
  out.push({ model: 'castle-gate', x: 0, y: iy1, heading: 180, key: true });

  // 北墙 / 东墙 / 西墙（heading = 墙朝外的朝向：北墙 0（back to +y → 朝内 180 视觉一致）
  edge(ix1, iy2, ix2, iy2, 0);              // 北墙
  edge(ix2, iy1, ix2, iy2, 270);            // 东墙（朝 +x 外 = 270 视觉一致）
  edge(ix1, iy1, ix1, iy2, 90);             // 西墙

  return out;
}

const PORT_LAYOUT = {
  major: [
    // ── 中央要塞（零件五层堆叠成一座整体主塔） ──
    // 实测层高：tower-base 2u=4.0 / tower-middle 1.96u=3.9 / tower-top 2.78u=5.6 / tower-roof 3.44u=6.9
    { model: 'tower-base-door', x: 0, y: 13, heading: 180, key: true },
    { model: 'tower-middle', x: 0, y: 13, heading: 180, stack: 4.0 },
    { model: 'tower-middle-windows', x: 0, y: 13, heading: 180, stack: 7.9 },
    { model: 'tower-top', x: 0, y: 13, heading: 180, stack: 11.8 },
    { model: 'tower-roof', x: 0, y: 13, heading: 180, stack: 17.4 },

    // ── 方形城墙（主港）：角楼 ×4 + 墙/窗墙相间 + 南面正海大门 ──
    // 用户要求长宽 ≥2× → 34×26 世界单位（R=100 下 ≈19.5°×14.9°）；
    // resolvePortsOnLand 已按此尺寸给每港选「整块陆地」放墙圈
    ...squareWallLayout({ x1: -17, y1: 0, x2: 17, y2: 26 }),

    // ⚠ 城堡 ↔ 民居分区（用户：不能重叠）：主港布局 = 纯城堡区
    //   （主塔 + 城墙圈 17×13 + 角楼 + 大门 + 码头 + 大炮）；民居不进墙圈。
    //   民居散落职责由 CivilianManager（每岛随机民居 = 岛民数）承担。
    // 码头伸向海面（-y 方向，城门正前方）
    { model: 'platform-planks', x: 0, y: -5, heading: 180 },
    { model: 'structure-platform-dock', x: 0, y: -13, heading: 180, key: true },
    // 防御与装饰（大炮移进城门内侧守门）
    { model: 'cannon', x: -4, y: 3, heading: 180 },
    { model: 'cannon', x: 4, y: 3, heading: 180 },
    { model: 'flag-pirate-high', x: 0, y: 13, heading: 0, key: true, stack: 24.3 },  // 主塔尖顶旗
    { model: 'flag-pennant', x: -17, y: 0, heading: 135, stack: 13.1 },              // 西南角楼旗
    { model: 'flag-pennant', x: 17, y: 0, heading: 225, stack: 13.1 },               // 东南角楼旗
    { model: 'structure-fence', x: -12, y: -11, heading: 120 },
    { model: 'structure-fence', x: 12, y: -11, heading: 240 },
  ],
  small: [
    // ── 小港不再建城堡/城墙/固定民居 ──
    // 用户要求「每大陆只有一个城堡」+「民居随机散落且与城堡分开」：
    //   小港只保留码头、防御/标识；民居统一由 CivilianManager 按岛民数散落。
    { model: 'structure-platform-dock-small', x: 0, y: -8, heading: 180, key: true },
    { model: 'flag-pirate-high', x: 0, y: 4, heading: 0, key: true },
    { model: 'cannon', x: -3, y: 2.5, heading: 180 },
  ],
};

/** 码头边的小道具（Instanced 批量） */
const DOCK_PROPS = ['barrel', 'crate', 'chest', 'crate-bottles'];

export class PortManager {
  /**
   * @param {{sceneManager, assets, sampler, registry?, damageSystem?, group?}} deps
   */
  constructor(deps) {
    this.sm = deps.sceneManager;
    this.assets = deps.assets;
    this.sampler = deps.sampler;
    this.registry = deps.registry || null;
    this.damage = deps.damageSystem || null;
    this.rng = mulberry32(deps.seed ?? 13579);
    this.occupancy = deps.occupancy || null;
    this.group = deps.group || this.sm.ports;
    this.group.name = 'Ports';

    /** @type {Array<object>} 港口记录（供 Mini Globe / 悬停 / 船只航线复用） */
    this.ports = [];
    this.propsLayer = null;
    this.stats = { ports: 0, buildings: 0, props: 0 };
  }

  /**
   * 建造全部港口。
   * @param {Array<{id,name,lat,lon,kind,groundH?}>} resolvedPorts resolvePortsOnLand 结果
   */
  build(resolvedPorts) {
    this._preparePropsLayer();

    // ⭐ 用户要求「每大陆只有一个城堡」：用 sampler.continentOf（纯 GeoUtils 球面数学，
    //   按 CONTINENTS 高斯中心最近邻分区）去重 —— 同大陆第 2+ 个 major 降级 small
    //   （只去方形城墙圈，主塔/码头/旗保留 → 航线/落位/Mini Globe 全不受影响）。
    //   ⚠ 不用 TerrainSampler.continentOf（BFS 在「不可建造但高度>0」连续场里
    //   会连通所有陆地 → 六港同 id 全灭，已证伪）。
    const kindOf = new Map();
    const castleCount = new Map();
    const CONT_CENTERS = [
      [0.28, 0.4, -0.87], [-0.2, -0.1, 0.97], [0.34, 0.62, 0.71],
      [-0.68, 0.26, -0.68], [0.02, -0.72, -0.3], [0.86, -0.14, 0.22],
    ];
    const dirAt = (lat, lon) => {
      const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
      return [-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
    };
    const continentByCenter = (lat, lon) => {
      const d = dirAt(lat, lon);
      let best = 0, bestDot = -2;
      CONT_CENTERS.forEach((c, i) => {
        const dot = d[0] * c[0] + d[1] * c[1] + d[2] * c[2];
        if (dot > bestDot) { bestDot = dot; best = i; }
      });
      return best;
    };
    for (const p of resolvedPorts) {
      if (p.kind !== 'major') { kindOf.set(p, 'small'); continue; }
      const cid = continentByCenter(p.lat, p.lon);
      const n = castleCount.get(cid) || 0;
      if (n < SHIPS.CASTLES_PER_CONTINENT) {
        castleCount.set(cid, n + 1);
        kindOf.set(p, 'major');
      } else {
        kindOf.set(p, 'small');
        console.log('[PortManager] ' + p.name + ' 与大陆 #' + cid + ' 已有城堡 → 降级为无城墙小聚落');
      }
    }

    for (const p of resolvedPorts) {
      const spot = this.sampler.nearestBuildable(p.lat, p.lon, 26, 1.2);
      if (!spot) {
        console.warn('[PortManager] 港口 ' + p.name + ' 找不到可建造陆地，跳过');
        continue;
      }
      const kind = kindOf.get(p) || p.kind;
      this._buildOne(p, spot, kind);
    }

    if (this.propsLayer) this.propsLayer.finish();
    return this;
  }

  _preparePropsLayer() {
    const baked = DOCK_PROPS
      .filter((n) => this.assets.has(n))
      .map((n) => ({ name: n, ...bakeInstancedAsset(this.assets.normalized(n, { shadows: false }).group, n) }));
    if (!baked.length) return;
    this.propsLayer = new InstancedPropLayer({ name: 'DockProps', capacity: 512, material: baked[0].material });
    for (const b of baked) this.propsLayer.addVariant(b.geometry, b.name, b.material);
    this.propsLayer.group.name = 'DockProps';
    this.group.add(this.propsLayer.group);
  }

  /**
   * 把一张港口平面图铺到球面。
   * 平面坐标 (x=east, y=north) → 用「绕表面法线旋转」投影到球面：
   *   1) 先取港口中心的切空间
   *   2) 每个点位按其到中心的偏移算出「偏移经纬度」→ 再取该点地表高度
   *   3) alignObjectToSurface 摆放，forward = 朝海（-north）方向旋 heading
   */
  _buildOne(port, spot, kind) {
    const layout = PORT_LAYOUT[kind] || PORT_LAYOUT.small;
    const center = this.sampler.frameAt(spot.lat, spot.lon);
    const R = this.sampler.radius;

    // 度/世界单位换算（球面局部近似）
    const degPerUnit = 180 / Math.PI / R;
    const cosLat = Math.max(0.2, Math.cos(THREE.MathUtils.degToRad(spot.lat)));

    const portGroup = new THREE.Group();
    portGroup.name = 'Port:' + port.id;
    portGroup.userData.port = port.id;
    portGroup.userData.isPort = true;

    const placed = [];
    let buildings = 0;

    // 城堡墙圈内部是城堡专属区：禁止后续树木、岩石、民居、小人出生点落入。
    // occupancy 在 ports.build 后会被 NatureManager / CivilianManager 复用。
    if (kind === 'major') this._reserveCastleInterior(spot, cosLat, degPerUnit);

    for (const item of layout) {
      if (!this.assets.has(item.model)) {
        console.warn('[PortManager] 模型未加载，跳过：' + item.model);
        continue;
      }
      // 平面图坐标 → 经纬度偏移
      const east = item.x, north = item.y;
      const lat = spot.lat + north * degPerUnit;
      const lon = spot.lon + (east * degPerUnit) / cosLat;

      // 该点是否仍在陆地（避免码头/小船放到深海；近海允许，远海丢弃）
      const h = this.sampler.heightAt(lat, lon);
      const isDock = /dock|planks|boat|barrel|crate|chest/.test(item.model);
      if (!isDock && h < 0.05) continue;            // 建筑不能在海水里
      if (isDock && h < -6) continue;               // 码头允许略微临海

      const obj = this.assets.instance(item.model, { shadows: false });
      // 建筑尺度由 MODEL_SPECS.unit 决定（R=100 星球已按此配）；此处只做贴地高度微调，不重复缩放
      // stack = 城堡零件堆叠抬升（世界单位，来自布局表——把 base/middle/top/roof 拼成整体塔）
      const groundOffset = (item.stack || 0) + (/boat|dock|planks/.test(item.model) ? -0.1 : -0.4);
      const frame = surfaceFrameAt(this.sampler, lat, lon, (item.heading || 0) + 180, groundOffset);
      alignObjectToSurface(obj, frame.position, frame.forward, { upAxis: 'y', forwardAxis: 'z' });
      obj.userData.model = item.model;
      obj.userData.port = port.id;
      obj.userData.isPortPart = true;
      if (item.key) obj.userData.isLandmark = true;
      this._registerPart(obj, item, port.id);

      // 船只/浮具不埋地：贴海面即可
      if (/boat/.test(item.model)) {
        const p2 = latLonPos(this.sampler, lat, lon, 0.1);
        alignObjectToSurface(obj, p2, frame.forward, { upAxis: 'y', forwardAxis: 'z' });
      }

      portGroup.add(obj);
      placed.push(item);
      buildings++;

      // 防穿模：建筑 / 码头 / 大炮等注册占地（小人、动物落位避让）
      // 同点位的城堡零件（stack>0）占地已在首件注册，不重复
      if (this.occupancy && !(item.stack > 0)) {
        const big = /tower|castle|structure$|structure-/.test(item.model) ? 3.4
          : /dock|planks|fence/.test(item.model) ? 1.6 : 1.1;
        this.occupancy.add(lat, lon, big);
      }

      // 码头两侧撒木桶/木箱（Instanced）
      if (/dock/.test(item.model) && this.propsLayer) {
        this._scatterDockProps(lat, lon, cosLat, degPerUnit, port.id);
      }
    }

    // 港口中心点（贴地）用于 Mini Globe Marker / 悬停
    const centerPos = this.sampler.positionAt(spot.lat, spot.lon, 0.5, new THREE.Vector3());
    portGroup.userData.anchor = centerPos.clone();
    portGroup.userData.center = { lat: spot.lat, lon: spot.lon, h: spot.h };

    this.group.add(portGroup);
    this.ports.push({
      id: port.id,
      name: port.name,
      kind: kind,
      lat: spot.lat,
      lon: spot.lon,
      groundH: spot.h,
      position: centerPos.clone(),
      group: portGroup,
      landmarks: placed.filter((p) => p.key).map((p) => p.model),
    });
    this.stats.ports++;
    this.stats.buildings += buildings;
  }

  _registerPart(obj, item, portId) {
    if (!this.registry) return;
    const isBoat = /boat/.test(item.model);
    const isDock = /dock|planks/.test(item.model);
    const type = isBoat ? 'boat' : isDock ? 'dock' : 'building';
    const tags = ['port', type, item.model];
    if (item.key) tags.push('landmark');
    const entity = this.registry.register(obj, {
      type,
      tags,
      port: portId,
      model: item.model,
      damageable: true,
      maxHp: item.key ? 160 : isDock ? 90 : 110,
    });
    if (this.damage) this.damage.makeDamageable(obj, { maxHp: entity.maxHp });
  }

  _reserveCastleInterior(spot, cosLat, degPerUnit) {
    if (!this.occupancy) return;
    for (const x of [-12, 0, 12]) {
      for (const y of [5, 13, 21]) {
        const lat = spot.lat + y * degPerUnit;
        const lon = spot.lon + (x * degPerUnit) / cosLat;
        this.occupancy.add(lat, lon, 5.2);
      }
    }
  }

  _scatterDockProps(lat, lon, cosLat, degPerUnit, portId) {
    if (!this.propsLayer || !this.propsLayer.variants.length) return;
    const n = 5 + Math.floor(this.rng() * 5);
    for (let i = 0; i < n; i++) {
      const ex = (this.rng() * 2 - 1) * 13;
      const ny = (this.rng() * 2 - 1) * 12 - 4;
      const la = lat + ny * degPerUnit;
      const lo = lon + (ex * degPerUnit) / cosLat;
      const h = this.sampler.heightAt(la, lo);
      if (h < 0.05) continue;                       // 只放陆地
      const pos = this.sampler.positionAt(la, lo, -0.05);
      const variant = Math.floor(this.rng() * this.propsLayer.variants.length);
      const s = 0.85 + this.rng() * 0.5;
      this.propsLayer.push(pos, { variant, scale: s, heading: this.rng() * Math.PI * 2 });
      this.stats.props++;
    }
    void portId;
  }

  /** 供 Mini Globe / 相机 FlyTo 用 */
  getPortById(id) {
    return this.ports.find((p) => p.id === id) || null;
  }

  summary() {
    return {
      ports: this.ports.length,
      buildings: this.stats.buildings,
      dockProps: this.propsLayer ? this.propsLayer.total : 0,
      drawCalls: (this.group.children.length) + (this.propsLayer ? 1 : 0),
    };
  }
}

/** 按指定半径放置（不叠加地形高度）——船只/浮具用 */
function latLonPos(sampler, lat, lon, extra = 0) {
  return sampler.positionAt(lat, lon, extra, new THREE.Vector3());
}
