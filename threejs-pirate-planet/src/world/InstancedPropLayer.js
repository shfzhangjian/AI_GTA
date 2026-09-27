/**
 * InstancedPropLayer.js — 通用 InstancedMesh 道具层（§34 性能要求）
 *
 * 同类道具（棕榈 / 岩石 / 草 / 木箱 / 木桶…）合并成 1~k 个 DrawCall，
 * 避免成百上千独立 Mesh 打爆 DrawCall。
 *
 * 落位一律走 TerrainSampler（与陆地显示共用高度场）→ 不会悬浮 / 陷地。
 * 姿态一律走 GeoUtils.alignObjectToSurface（UP = 球面外法线）→ 沿球面生长。
 */
import * as THREE from 'three';
import { alignObjectToSurface } from '../utils/GeoUtils.js';

const _dummy = new THREE.Object3D();

export class InstancedPropLayer {
  /**
   * @param {{name?:string, capacity?:number, material?:THREE.Material, castShadow?:boolean}} opts
   */
  constructor(opts = {}) {
    this.name = opts.name || 'Props';
    this.capacity = Math.max(1, opts.capacity ?? 256);
    this.castShadow = opts.castShadow !== false;
    /** @type {Array<{geometry:THREE.BufferGeometry, mesh:THREE.InstancedMesh, count:number}>} */
    this.variants = [];
    this.group = new THREE.Group();
    this.group.name = this.name;
    this.material = opts.material || null;
    this._built = false;
    this.total = 0;
  }

  /**
   * 注册一个变体（一种几何）。同一层可有多个变体（如 直棕榈 / 弯棕榈）。
   * @param {THREE.BufferGeometry} geometry 已归一化并烘进局部空间的几何（+Y = up）
   * @param {string} label
   */
  addVariant(geometry, label, material) {
    const mat = material || this.material;
    if (!mat) throw new Error('[InstancedPropLayer] 需要 material（构造或 addVariant 传入）');
    const mesh = new THREE.InstancedMesh(geometry, mat, this.capacity);
    mesh.name = this.name + ':' + (label || this.variants.length);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.castShadow = this.castShadow;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;      // 实例分布全球，包围球不可靠
    mesh.count = 0;
    mesh.userData.model = label;
    mesh.userData.layer = this;
    this.variants.push({ geometry, mesh, label, count: 0 });
    this.group.add(mesh);
    return this;
  }

  /**
   * 追加一个实例
   * @param {THREE.Vector3} position 世界坐标（地表点）
   * @param {object} [opts]
   * @param {number} [opts.variant=0]
   * @param {number} [opts.scale=1]
   * @param {number} [opts.scaleY] 纵向单独缩放（压扁/拉长）
   * @param {number} [opts.heading=0] 切平面内自转（弧度）
   * @param {THREE.Vector3} [opts.forward] 期望朝向（缺省用正北）
   */
  push(position, opts = {}) {
    const vi = opts.variant ?? 0;
    const v = this.variants[vi];
    if (!v) throw new Error('[InstancedPropLayer] 变体 ' + vi + ' 未注册');
    if (v.count >= this.capacity) return false;

    _dummy.position.copy(position);
    // ⭐ UP = 球面外法线（§14）：模型像真正「长在星球上」
    alignObjectToSurface(_dummy, position, opts.forward || null, { upAxis: 'y', forwardAxis: 'z' });
    if (opts.heading) _dummy.rotateY(opts.heading);

    const s = opts.scale ?? 1;
    _dummy.scale.set(s, opts.scaleY ?? s, s);
    _dummy.updateMatrix();

    v.mesh.setMatrixAt(v.count, _dummy.matrix);
    v.count++;
    v.mesh.count = v.count;
    v.mesh.instanceMatrix.needsUpdate = true;
    this.total++;
    return true;
  }

  /** 紧凑化（把 count 固化，供渲染统计） */
  finish() {
    for (const v of this.variants) {
      v.mesh.count = v.count;
      v.mesh.instanceMatrix.needsUpdate = true;
    }
    this._built = true;
    return this.layer || this;
  }

  /** 供外部按名字索引 */
  get layer() {
    return this;
  }

  /** DrawCall 数（= 变体数） */
  get drawCalls() {
    return this.variants.length;
  }

  dispose() {
    for (const v of this.variants) v.mesh.dispose();
    this.variants.length = 0;
    this.total = 0;
  }
}

/**
 * 把「归一化模型」（ModelUtils.normalizeModel 的 group）烘成单一几何 + 共享材质，
 * 供 InstancedMesh 使用。Kenney 模型共用一张 512² 图集 → 同材质可安全合并。
 *
 * @param {THREE.Group} normalizedGroup normalizeModel().group
 * @param {string} name manifest key（日志用）
 * @returns {{geometry:THREE.BufferGeometry, material:THREE.Material, tris:number}}
 */
export function bakeInstancedAsset(normalizedGroup, name) {
  normalizedGroup.updateMatrixWorld(true);

  const positions = [];
  const normals = [];
  const uvs = [];
  let material = null;
  let tris = 0;

  const invRoot = new THREE.Matrix4().copy(normalizedGroup.matrixWorld).invert();
  const local = new THREE.Matrix4();
  const nm = new THREE.Matrix3();

  normalizedGroup.traverse((o) => {
    if (!o.isMesh) return;
    const srcMat = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!material) material = srcMat;
    else if (srcMat && srcMat.uuid !== material.uuid) {
      // Kenney 单图集：取第一个材质并告警（避免静默错材质）
      console.warn('[Instanced] ' + name + ' 有多个材质，实例将统一用第一个:', srcMat && srcMat.name);
    }

    local.copy(o.matrixWorld).premultiply(invRoot);
    nm.getNormalMatrix(local);

    const g = o.geometry;
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const uv = g.attributes.uv;
    const v = new THREE.Vector3();
    const nvec = new THREE.Vector3();

    const pushVertex = (i) => {
      v.fromBufferAttribute(pos, i).applyMatrix4(local);
      positions.push(v.x, v.y, v.z);
      if (nor) {
        nvec.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize();
        normals.push(nvec.x, nvec.y, nvec.z);
      }
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
    };

    if (g.index) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i += 3) {
        pushVertex(idx.getX(i));
        pushVertex(idx.getX(i + 1));
        pushVertex(idx.getX(i + 2));
        tris += 1;
      }
    } else {
      for (let i = 0; i < pos.count; i++) pushVertex(i);
      tris += Math.floor(pos.count / 3);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  else geometry.computeVertexNormals();
  if (uvs.length * 3 === positions.length * 2) geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();

  return { geometry, material: material || new THREE.MeshLambertMaterial({ color: 0xffffff }), tris, name };
}
