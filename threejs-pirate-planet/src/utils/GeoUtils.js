/**
 * GeoUtils.js — 球面数学的唯一来源（§38）
 *
 * 铁律：任何 lat/lon 转换、表面法线、球面对齐、大圆弧、球面插值
 * 只能出现在本文件。业务代码中再次实现这些数学即视为违规。
 *
 * 坐标约定（与 Three.js 默认一致）：
 *   +Y = 北极
 *   lat ∈ [-90, 90]（北纬为正）
 *   lon ∈ [-180, 180]（东经为正），本初子午线（lon=0）指向 +Z
 *   因此 lon 增加方向为 自 +Z 转向 -X（逆时针俯视北极）
 */
import * as THREE from 'three';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

/** 复用临时对象，避免每帧分配 */
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _m = new THREE.Matrix4();

/**
 * 经纬度 → 球面位置
 * @param {number} lat 纬度（度）
 * @param {number} lon 经度（度）
 * @param {number} radius 半径
 * @param {THREE.Vector3} [out]
 * @returns {THREE.Vector3}
 */
export function latLonToVector3(lat, lon, radius = 1, out = new THREE.Vector3()) {
  const phi = (90 - lat) * DEG;   // 极角，自 +Y 起
  const theta = (lon + 180) * DEG;
  const sinPhi = Math.sin(phi);
  return out.set(
    -sinPhi * Math.cos(theta),
    Math.cos(phi),
    sinPhi * Math.sin(theta),
  ).multiplyScalar(radius);
}

/**
 * 球面位置 → 经纬度（度）
 * @param {THREE.Vector3} position 不要求归一化
 * @returns {{lat:number, lon:number, radius:number}}
 */
export function vector3ToLatLon(position) {
  const radius = position.length();
  if (radius < 1e-9) return { lat: 0, lon: 0, radius: 0 };
  const n = _v1.copy(position).divideScalar(radius);
  const lat = Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) * RAD;
  let lon = Math.atan2(n.z, -n.x) * RAD - 180;
  // 归一化到 (-180, 180]
  lon = ((lon + 180) % 360 + 360) % 360 - 180;
  return { lat, lon, radius };
}

/**
 * 球面某点的 outward 表面法线（单位向量）
 * 假定球心在原点。
 * @param {THREE.Vector3} position
 * @param {THREE.Vector3} [out]
 */
export function getSurfaceNormal(position, out = new THREE.Vector3()) {
  return out.copy(position).normalize();
}

/**
 * 求大圆在 start 处指向 end 的起始切线（单位向量，位于切平面内）
 * @returns {THREE.Vector3}
 */
export function greatCircleTangent(start, end, out = new THREE.Vector3()) {
  const n = getSurfaceNormal(start, _v1);
  // end 在切平面上的投影方向
  out.copy(end).addScaledVector(n, -end.dot(n));
  if (out.lengthSq() < 1e-12) {
    // 对跖点退化：取任意切向量
    _v2.set(0, 1, 0);
    if (Math.abs(n.dot(_v2)) > 0.99) _v2.set(1, 0, 0);
    out.crossVectors(n, _v2);
  }
  return out.normalize();
}

/**
 * 把物体「种」在球面上：UP = 表面法线，FORWARD 尽量贴合给定朝向。
 *
 * 不使用 rotation.set(0,0,0)，也不使用 lookAt（lookAt 的 up 会抖动）。
 * 做法：构造正交基 (right, up, forward) 写入 Matrix4 → quaternion。
 *
 * @param {THREE.Object3D} object
 * @param {THREE.Vector3} position 球面位置（决定 UP 与落点）
 * @param {THREE.Vector3} [forwardHint] 期望的 forward 世界方向（如航线切线）；
 *        缺省时取该点指向「北方」的切向量
 * @param {object} [opts]
 * @param {'x'|'y'|'z'|'-x'|'-y'|'-z'} [opts.upAxis='y']    模型局部 UP 轴
 * @param {'x'|'y'|'z'|'-x'|'-y'|'-z'} [opts.forwardAxis='z'] 模型局部 FORWARD 轴
 * @param {number} [opts.roll=0] 额外绕 forward 的滚转（弧度）
 * @returns {THREE.Object3D} object（便于链式调用）
 */
export function alignObjectToSurface(object, position, forwardHint = null, opts = {}) {
  const upAxis = parseAxis(opts.upAxis || 'y');
  const forwardAxis = parseAxis(opts.forwardAxis || 'z');

  const normal = getSurfaceNormal(position, _v1);

  // 世界空间期望 forward
  let desiredF;
  if (forwardHint) {
    desiredF = _v2.copy(forwardHint);
  } else {
    // 缺省朝向：该点的「正北」切线
    _v3.set(0, 1, 0);
    desiredF = _v2.crossVectors(_v3, normal);
    if (desiredF.lengthSq() < 1e-8) {
      _v3.set(0, 0, 1);
      desiredF = _v2.crossVectors(_v3, normal);
    }
  }
  // 投影到切平面并归一化 → 真实 forward
  const f = desiredF.clone();
  f.addScaledVector(normal, -f.dot(normal));
  if (f.lengthSq() < 1e-12) {
    greatCircleTangent(position, _v3.set(0, 1, 0), f);
  }
  f.normalize();

  const up = normal.clone();
  const right = new THREE.Vector3().crossVectors(f, up).normalize();
  // 重新正交化 forward（消数值误差）
  const fwd = new THREE.Vector3().crossVectors(up, right).normalize();

  // 额外滚转
  if (opts.roll) f.applyAxisAngle(up, opts.roll);

  // 局部轴 → 世界轴的旋转矩阵：
  // 世界基向量的列 = 各局部基向量在世界中的方向
  const localUp = axisVector(upAxis, _v3);
  const localF = axisVector(forwardAxis, new THREE.Vector3());
  const localR = new THREE.Vector3().crossVectors(localF, localUp).normalize();
  const localUpFix = new THREE.Vector3().crossVectors(localR, localF).normalize();

  // M 满足 M * localR = right, M * localUp = up, M * localF = fwd
  // M = worldBasis * localBasis^-1（局部基为正交 → 转置即逆）
  _m.makeBasis(localR, localUpFix, localF);
  _m.transpose();

  const worldBasis = new THREE.Matrix4().makeBasis(right, up, fwd);
  const rot = worldBasis.multiply(_m);

  object.quaternion.setFromRotationMatrix(rot);
  object.position.copy(position);
  return object;
}

/**
 * 沿球面的大圆插值：start→end 单位向量按 t 插值后 × radius。
 * 与 THREE.Vector3.slerp 不同：这里输入可不在球面上，输出严格在半径 radius 的球面上。
 * @returns {THREE.Vector3}
 */
export function slerpOnSphere(start, end, t, radius = 1, out = new THREE.Vector3()) {
  const a = _v1.copy(start).normalize();
  const b = _v2.copy(end).normalize();
  let d = THREE.MathUtils.clamp(a.dot(b), -1, 1);
  const omega = Math.acos(d);
  if (omega < 1e-6) {
    // 几乎同点：线性近似
    return out.copy(a).lerp(b, t).normalize().multiplyScalar(radius);
  }
  const sinOmega = Math.sin(omega);
  const s1 = Math.sin((1 - t) * omega) / sinOmega;
  const s2 = Math.sin(t * omega) / sinOmega;
  return out.copy(a).multiplyScalar(s1).addScaledVector(b, s2).normalize().multiplyScalar(radius);
}

/**
 * 生成两点间大圆弧上的离散点（贴合半径 radius 的球面）
 * @param {THREE.Vector3} start
 * @param {THREE.Vector3} end
 * @param {number} radius
 * @param {number} segments 分段数（点数 = segments + 1）
 * @param {number} [lift=0] 额外抬升（航线避免穿球，§19）
 * @returns {THREE.Vector3[]}
 */
export function createGreatCirclePoints(start, end, radius = 1, segments = 48, lift = 0) {
  const pts = [];
  const r = radius + lift;
  for (let i = 0; i <= segments; i++) {
    pts.push(slerpOnSphere(start, end, i / segments, r, new THREE.Vector3()));
  }
  return pts;
}

/** 两点间大圆角距（弧度） */
export function greatCircleAngle(start, end) {
  const a = _v1.copy(start).normalize();
  const b = _v2.copy(end).normalize();
  return Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
}

/** 两点间大圆弧长 */
export function greatCircleDistance(start, end, radius = 1) {
  return greatCircleAngle(start, end) * radius;
}

/** 沿大圆从 a 向 b 偏移 distance 后的位置（用于按航速推进） */
export function offsetAlongGreatCircle(a, b, distance, radius = 1, out = new THREE.Vector3()) {
  const total = greatCircleDistance(a, b, radius);
  const t = total < 1e-9 ? 0 : THREE.MathUtils.clamp(distance / total, 0, 1);
  return slerpOnSphere(a, b, t, radius, out);
}

/**
 * 在切平面内相对 forward 偏航 yaw（弧度）得到的切向量（用于局部视角看向侧面）
 */
export function rotateInTangentPlane(forward, normal, yaw, out = new THREE.Vector3()) {
  const n = getSurfaceNormal(normal, _v1);
  const f = _v2.copy(forward);
  f.addScaledVector(n, -f.dot(n)).normalize();
  const r = _v3.crossVectors(f, n).normalize();
  return out.copy(f).multiplyScalar(Math.cos(yaw)).addScaledVector(r, Math.sin(yaw)).normalize();
}

/**
 * 四元数球面插值（自实现，含最短路径处理）— 用于船只 / 相机姿态平滑。
 * 对应 §17 允许「自己实现球面插值算法」。
 * @param {THREE.Quaternion} qa
 * @param {THREE.Quaternion} qb
 * @param {number} t 0..1
 * @param {THREE.Quaternion} [out]
 */
export function quatSlerp(qa, qb, t, out = new THREE.Quaternion()) {
  let { x, y, z, w } = qa;
  let bx = qb.x, by = qb.y, bz = qb.z, bw = qb.w;

  let cosHalf = w * bw + x * bx + y * by + z * bz;

  // 取最短路径
  if (cosHalf < 0) {
    bx = -bx; by = -by; bz = -bz; bw = -bw;
    cosHalf = -cosHalf;
  }

  if (cosHalf >= 1.0 - 1e-9) {
    return out.set(x, y, z, w);
  }

  const sqrSinHalf = 1.0 - cosHalf * cosHalf;
  if (sqrSinHalf <= Number.EPSILON) {
    const s = 1 - t;
    return out.set(s * x + t * bx, s * y + t * by, s * z + t * bz, s * w + t * bw).normalize();
  }

  const sinHalf = Math.sqrt(sqrSinHalf);
  const halfTheta = Math.atan2(sinHalf, cosHalf);
  const rA = Math.sin((1 - t) * halfTheta) / sinHalf;
  const rB = Math.sin(t * halfTheta) / sinHalf;

  return out.set(
    x * rA + bx * rB,
    y * rA + by * rB,
    z * rA + bz * rB,
    w * rA + bw * rB,
  );
}

/**
 * 平滑把物体当前姿态朝目标姿态插值（每帧调用，避免姿态跳变）
 * @param {THREE.Object3D} object
 * @param {THREE.Quaternion} target
 * @param {number} t 每帧插值系数（建议 1 - exp(-k*dt)）
 */
export function smoothAlignQuaternion(object, target, t) {
  return quatSlerp(object.quaternion, target, THREE.MathUtils.clamp(t, 0, 1), object.quaternion);
}

/** 解析 '-x' / 'y' 形式轴名 */
function parseAxis(name) {
  const s = String(name).toLowerCase().trim();
  const neg = s.startsWith('-');
  const axis = neg ? s.slice(1) : s;
  if (!['x', 'y', 'z'].includes(axis)) return { axis: 'y', sign: 1 };
  return { axis, sign: neg ? -1 : 1 };
}

/** 写入轴单位向量 */
function axisVector({ axis, sign }, out) {
  out.set(axis === 'x' ? sign : 0, axis === 'y' ? sign : 0, axis === 'z' ? sign : 0);
  return out;
}

export { DEG, RAD };
