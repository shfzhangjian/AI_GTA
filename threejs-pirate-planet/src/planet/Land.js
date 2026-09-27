/**
 * Land.js — 球面陆地（§13）
 *
 * 设计要点（解决「陆地错位浮空块」的根因）：
 *   1) 海陆掩码 / 高度只在 **CPU** 计算（makeHeightField）—— 唯一真相。
 *      港口、树木、建筑的落位与陆地的显示用的是同一份数值，绝不会各算各的导致错位。
 *   2) 陆地几何 = 等距柱状经纬网格（与海洋共用），高度与颜色**逐顶点烘焙**进几何，
 *      顶点着色器只做位移 + Lambert 光照 → GPU 不再重算噪声。
 *   3) 云层仍用 GLSL 噪声，掩码常量表由同一份 JS 配置注入（terrainGlsl），不重复配置。
 */
import * as THREE from 'three';
import { PLANET } from '../config.js';
import { latLonToVector3 } from '../utils/GeoUtils.js';

/* ══════════════════ CPU 噪声工具 ══════════════════ */
const fract = (v) => v - Math.floor(v);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (x, e0, e1) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
function normalize3(x, y, z) {
  const l = Math.hypot(x, y, z);
  return l > 0 ? [x / l, y / l, z / l] : [0, 0, 0];
}

/** 格点哈希（与 GLSL hash1 同式，保证 CPU/GPU 一致） */
function hash3(x, y, z) {
  const qx = fract(x * 0.1031), qy = fract(y * 0.1031), qz = fract(z * 0.1031);
  const d = qx * (qy + 33.33) + qy * (qz + 33.33) + qz * (qx + 33.33);
  return fract((qx + qy) * qz + d);
}
/** 3D 值噪声（约 -1..1） */
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = x - ix, fy = y - iy, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz);
  const n = (a, b, c) => hash3(ix + a, iy + b, iz + c);
  const x00 = lerp(n(0, 0, 0), n(1, 0, 0), ux);
  const x10 = lerp(n(0, 1, 0), n(1, 1, 0), ux);
  const x01 = lerp(n(0, 0, 1), n(1, 0, 1), ux);
  const x11 = lerp(n(0, 1, 1), n(1, 1, 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz) * 2 - 1;
}
function fbm(x, y, z, oct = 5) {
  let s = 0, a = 0.5, n = 0;
  let qx = x, qy = y, qz = z;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(qx, qy, qz); n += a;
    qx = qx * 2.03 + 13.1; qy = qy * 2.03 + 7.3; qz = qz * 2.03 + 4.7;
    a *= 0.5;
  }
  return s / (n || 1);
}
function ridged(x, y, z, oct = 5) {
  let s = 0, a = 0.5, n = 0;
  let qx = x, qy = y, qz = z;
  for (let i = 0; i < oct; i++) {
    const v = 1 - Math.abs(vnoise(qx, qy, qz));
    s += a * v * v; n += a;
    qx = qx * 2.07 + 3.7; qy = qy * 2.07 + 11.1; qz = qz * 2.07 + 5.3;
    a *= 0.5;
  }
  return s / (n || 1);
}
function gaussCap(d, c, sigma) {
  const cc = Math.max(-1, Math.min(1, d[0] * c[0] + d[1] * c[1] + d[2] * c[2]));
  return Math.exp(-Math.pow(Math.acos(cc) / sigma, 2));
}

/* ══════════════════ 掩码配置（唯一真相，CPU/GLSL 共用） ══════════════════ */
const CONTINENTS = [
  { dir: [0.28, 0.40, -0.87], w: 1.42, s: 0.60 },
  { dir: [-0.20, -0.10, 0.97], w: 1.34, s: 0.58 },
  { dir: [0.34, 0.62, 0.71], w: 1.36, s: 0.56 },
  { dir: [-0.68, 0.26, -0.68], w: 1.26, s: 0.56 },
  { dir: [0.02, -0.72, -0.30], w: 1.20, s: 0.54 },
  { dir: [0.86, -0.14, 0.22], w: 1.18, s: 0.50 },
];
const ISLANDS = [
  { dir: [0.40, 0.12, -0.12], w: 1.05, s: 0.17 },
  { dir: [-0.10, 0.44, -0.42], w: 1.00, s: 0.15 },
  { dir: [0.60, -0.34, 0.48], w: 1.10, s: 0.18 },
  { dir: [-0.54, -0.40, -0.60], w: 0.98, s: 0.15 },
  { dir: [0.08, -0.82, 0.44], w: 1.02, s: 0.16 },
  { dir: [0.84, 0.22, 0.16], w: 0.95, s: 0.14 },
  { dir: [-0.44, 0.70, -0.18], w: 1.00, s: 0.15 },
  { dir: [-0.86, -0.18, 0.14], w: 0.92, s: 0.13 },
  { dir: [0.46, 0.58, 0.80], w: 1.00, s: 0.15 },
  { dir: [-0.30, -0.52, -0.84], w: 0.94, s: 0.14 },
  { dir: [0.70, 0.04, 0.72], w: 0.90, s: 0.12 },
  { dir: [-0.56, 0.60, 0.58], w: 0.90, s: 0.12 },
  { dir: [0.16, 0.90, -0.40], w: 0.92, s: 0.12 },
  { dir: [-0.74, -0.44, 0.30], w: 0.88, s: 0.12 },
];

/** 海平面高度：略低于海洋球半径 → 陆地与海洋在海岸处贴合，无白缝 */
const SEA_LEVEL = -0.04;
/**
 * 陆地最大起伏（世界单位）。刻意远小于 R=100：
 * 星球本身已提供大曲率，地表只需轻微起伏 → 卡通低多边形观感，且无锯齿悬崖。
 */
export const LAND_RELIEF = 5.2;

/** 陆地量系数 → 海陆阈值（值越大陆地越多） */
function landThreshold(landAmt) {
  return lerp(0.74, 0.66, clamp01(landAmt));
}

/* ══════════════════ 共享 GLSL（云层用；掩码表由配置注入） ══════════════════ */
function glslCaps(list) {
  return list
    .map((c) => {
      const d = normalize3(c.dir[0], c.dir[1], c.dir[2]);
      return `  m += ${c.w.toFixed(4)} * gaussCap(d, vec3(${d.map((v) => v.toFixed(6)).join(', ')}), ${c.s.toFixed(4)});`;
    })
    .join('\n');
}

const TERRAIN_GLSL_TEMPLATE = /* glsl */`
vec3 hash33v(vec3 p){
  vec3 v = vec3(dot(p, vec3(127.1,311.7,74.7)), dot(p, vec3(269.5,183.3,246.1)), dot(p, vec3(113.5,271.9,124.6)));
  return fract(sin(v) * 43758.5453123);
}
float hash1(vec3 p){
  vec3 q = fract(p * 0.1031);
  float d = dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z + d);
}
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash1(i), hash1(i + vec3(1.0,0.0,0.0)), u.x),
                mix(hash1(i + vec3(0.0,1.0,0.0)), hash1(i + vec3(1.0,1.0,0.0)), u.x), u.y);
  float b = mix(mix(hash1(i + vec3(0.0,0.0,1.0)), hash1(i + vec3(1.0,0.0,1.0)), u.x),
                mix(hash1(i + vec3(0.0,1.0,1.0)), hash1(i + vec3(1.0,1.0,1.0)), u.x), u.y);
  return mix(a, b, u.z) * 2.0 - 1.0;
}
float fbm5(vec3 p){
  float s = 0.0; float a = 0.5; float n = 0.0;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); n += a; p = p * 2.03 + vec3(13.1,7.3,4.7); a *= 0.5; }
  return s / max(n, 1e-4);
}
float ridged5(vec3 p){
  float s = 0.0; float a = 0.5; float n = 0.0;
  for (int i = 0; i < 5; i++) { float v = 1.0 - abs(vnoise(p)); s += a * v * v; n += a; p = p * 2.07 + vec3(3.7,11.1,5.3); a *= 0.5; }
  return s / max(n, 1e-4);
}
float gaussCap(vec3 d, vec3 dir, float sigma){
  float c = clamp(dot(d, dir), -1.0, 1.0);
  return exp(-pow(acos(c) / sigma, 2.0));
}
float continentMask(vec3 d){
  float m = 0.0;
__CONTINENT_CAPS__

  return m;
}
float islandMask(vec3 d){
  float m = 0.0;
__ISLAND_CAPS__

  return m;
}
float seaLandMask(vec3 d){
  return max(continentMask(d), islandMask(d));
}
`;

/** 云层等复用的最终 GLSL（掩码表已展开） */
export function terrainGlsl() {
  return TERRAIN_GLSL_TEMPLATE
    .replace('__CONTINENT_CAPS__', glslCaps(CONTINENTS))
    .replace('__ISLAND_CAPS__', glslCaps(ISLANDS));
}

/* ══════════════════ CPU 高度场（陆地形状 + 落位的唯一真相） ══════════════════ */
/**
 * @param {number} landAmt 陆地量系数
 */
export function makeHeightField(landAmt = 1.0) {
  const thr = landThreshold(landAmt);
  const conts = CONTINENTS.map((c) => ({ ...c, n: normalize3(c.dir[0], c.dir[1], c.dir[2]) }));
  const isles = ISLANDS.map((c) => ({ ...c, n: normalize3(c.dir[0], c.dir[1], c.dir[2]) }));

  function toDir(input) {
    if (input && typeof input.lat === 'number') {
      const d = latLonToVector3(input.lat, input.lon, 1, new THREE.Vector3());
      return [d.x, d.y, d.z];
    }
    const x = input.x ?? input[0], y = input.y ?? input[1], z = input.z ?? input[2];
    return normalize3(x, y, z);
  }

  /** 海陆掩码（>阈值 = 陆地）。低频 fbm 扰动 → 大陆轮廓有机，不再是圆斑 */
  function mask(d) {
    let m = 0;
    for (const c of conts) m += c.w * gaussCap(d, c.n, c.s);
    let im = 0;
    for (const c of isles) im += c.w * gaussCap(d, c.n, c.s);
    const coast = fbm(d[0] * 1.6, d[1] * 1.6, d[2] * 1.6) * 0.34
                + fbm(d[0] * 3.3, d[1] * 3.3, d[2] * 3.3) * 0.12;
    return Math.max(m, im) + coast;
  }

  /** 0..1 归一化地表高度 */
  function normalized(input) {
    const d = toDir(input);
    const base = mask(d);
    const land = smoothstep(base, thr, thr + 0.20);
    if (land <= 0) return 0;
    // 内陆高度：随深度平滑上升（海岸→内陆），叠加很轻的低频起伏
    const depth = clamp01((base - thr) / (1.10 - thr));      // 0=海岸 1=内陆深处
    const fine = fbm(d[0] * 2.2, d[1] * 2.2, d[2] * 2.2);     // 低频
    const mountBand = Math.max(fbm(d[0] * 1.1 + 9.1, d[1] * 1.1 - 2.3, d[2] * 1.1 + 5.6) - 0.12, 0);
    const mount = clamp01(mountBand * 2.0);
    const r = ridged(d[0] * 1.9 + 2.3, d[1] * 1.9 - 5.1, d[2] * 1.9 + 8.4);
    const mountGate = smoothstep(mount, 0.15, 0.55);
    const inland = 0.30 + depth * 0.55;                      // 平滑爬升（不再随机 0.52 抖）
    return clamp01(land * inland + fine * 0.07 * land + mountGate * r * 0.42 * land);
  }

  /** 高度（世界单位）：海 = SEA_LEVEL，陆地 0..LAND_RELIEF */
  function sample(input) {
    const n = normalized(input);
    if (n <= 0) return SEA_LEVEL;
    return n * LAND_RELIEF;
  }
  /** 是否可建造陆地 */
  function isLand(input, minH = 0.6) {
    return sample(input) >= minH;
  }

  return { sample, isLand, normalized, mask, threshold: thr };
}

/* ══════════════════ 经纬网格（与海洋共用拓扑） ══════════════════ */
/**
 * 等距柱状经纬球面网格。
 * 顶点在经纬上均匀分布 → 不会出现 SphereGeometry 极点三角化导致的阶梯块。
 */
export function buildLatLonSphere(radius, segLon = 360, segLat = 180) {
  const positions = [];
  const indices = [];
  for (let j = 0; j <= segLat; j++) {
    const lat = 90 - (j / segLat) * 180;
    const phi = (90 - lat) * (Math.PI / 180);
    const sy = Math.cos(phi);
    const sr = Math.sin(phi);
    for (let i = 0; i <= segLon; i++) {
      const lon = -180 + (i / segLon) * 360;
      const th = (lon + 180) * (Math.PI / 180);
      positions.push(-sr * Math.cos(th) * radius, sy * radius, sr * Math.sin(th) * radius);
    }
  }
  const row = segLon + 1;
  for (let j = 0; j < segLat; j++) {
    for (let i = 0; i < segLon; i++) {
      const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}

/* ══════════════════ 烘焙 ══════════════════ */
/** 生物带调色板（线性空间，片元里 gamma） */
const PALETTE = [
  { h: 0.03, c: new THREE.Color(0.700, 0.620, 0.400) },  // 湿沙
  { h: 0.16, c: new THREE.Color(0.918, 0.843, 0.604) },  // 沙滩（很窄）
  { h: 0.80, c: new THREE.Color(0.298, 0.706, 0.298) },  // 草原（迅速）
  { h: 2.00, c: new THREE.Color(0.153, 0.545, 0.243) },  // 深草
  { h: 3.20, c: new THREE.Color(0.063, 0.373, 0.180) },  // 森林
  { h: 4.50, c: new THREE.Color(0.478, 0.459, 0.400) },  // 岩石
  { h: 5.20, c: new THREE.Color(0.949, 0.976, 1.000) },  // 雪
];
function colorForHeight(h, out) {
  if (h <= PALETTE[0].h) return out.copy(PALETTE[0].c);
  for (let i = 0; i < PALETTE.length - 1; i++) {
    const a = PALETTE[i], b = PALETTE[i + 1];
    if (h <= b.h) return out.copy(a.c).lerp(b.c, smoothstep(h, a.h, b.h));
  }
  return out.copy(PALETTE[PALETTE.length - 1].c);
}

/**
 * 把 CPU 高度场烘焙进几何：位移 + 顶点色 + 法线。
 * 「陆地形状」与「港口 / 树木落点」从此共用同一份高度场数值。
 */
export function bakeLandHeights(geo, field, radius, heightScale = 1) {
  const pos = geo.attributes.position;
  const n = pos.count;
  const heights = new Float32Array(n);
  const colors = new Float32Array(n * 3);
  const c = new THREE.Color();
  const snow = PALETTE[PALETTE.length - 1].c;

  for (let i = 0; i < n; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const l = Math.hypot(x, y, z) || 1;
    const d = [x / l, y / l, z / l];
    const h = field.sample(d);
    heights[i] = h;

    const r = radius + h * heightScale;
    pos.setXYZ(i, d[0] * r, d[1] * r, d[2] * r);

    colorForHeight(h, c);
    const polar = smoothstep(Math.abs(d[1]), 0.86, 0.95);
    if (polar > 0) c.lerp(snow, polar);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/* ══════════════════ 着色器（只做位移 + 光照） ══════════════════ */
const LAND_VERT = /* glsl */`
uniform float uLandRadius;
attribute float aHeight;   // CPU 高度场烘焙（世界单位，0 = 海面）
attribute vec3 color;      // 烘焙顶点色
varying vec3 vColorL;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vIsLand;

void main(){
  vec3 d = normalize(position);
  // 海底压到海面之下（-0.25）：与不透明海洋球(100)拉开深度差，杜绝共面 z-fighting 闪动
  float h = aHeight > 0.0 ? aHeight : -0.25;
  vIsLand = aHeight > 0.0 ? 1.0 : 0.0;
  vec3 p = d * (uLandRadius + h);
  vColorL = color;
  vec3 n = normalize(normal);

  vec4 wp = modelMatrix * vec4(p, 1.0);
  vPosW = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const LAND_FRAG = /* glsl */`
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform float uNight;
uniform vec3 uAtmoColor;     // 海底（海面下）输出大气辉光色 → 与海洋无硬边
varying vec3 vColorL;
varying vec3 vNormalW;
varying vec3 vPosW;
varying float vIsLand;

void main(){
  if (vIsLand < 0.5) discard;            // 海底不画（已在顶点压到海面下）→ 双保险消除共面
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uSunDir);
  float diff = clamp(dot(N, L), 0.0, 1.0);
  float wrap = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);   // 卡通柔和
  vec3 col = vColorL * (uAmbient + uSunColor * (diff * 0.85 + wrap * 0.30));
  vec3 nightC = col * vec3(0.30, 0.38, 0.62) + vec3(0.02, 0.03, 0.07);
  col = mix(col, nightC, uNight);
  col *= 0.92 + 0.08 * clamp(N.y, 0.0, 1.0);
  col = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));       // gamma
  gl_FragColor = vec4(col, 1.0);
}
`

/**
 * @param {number} radius
 * @param {{landAmt?, segments?, field?}} opts
 */
export function createLand(radius = PLANET.RADIUS, opts = {}) {
  const landAmt = opts.landAmt ?? 1.0;
  const segLon = opts.segments || 512;
  const segLat = Math.round(segLon * 0.5);
  const field = opts.field || makeHeightField(landAmt);
  const thr = field.threshold;

  const geo = buildLatLonSphere(radius, segLon, segLat);
  bakeLandHeights(geo, field, radius);   // 高度/颜色/法线一次烘焙

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uLandRadius: { value: radius },
      uSunDir: { value: new THREE.Vector3(1, 0.35, 0.6).normalize() },
      uSunColor: { value: new THREE.Color(0xfff0d4) },
      uAmbient: { value: new THREE.Color(0.20, 0.28, 0.40) },
      uNight: { value: 0 },
      uAtmoColor: { value: new THREE.Color(0.20, 0.42, 0.78) },
    },
    vertexShader: LAND_VERT,
    fragmentShader: LAND_FRAG,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'Land';
  mesh.userData.field = field;
  mesh.userData.material = mat;
  mesh.setSun = (dir) => mat.uniforms.uSunDir.value.copy(dir).normalize();
  mesh.setNight = (n) => (mat.uniforms.uNight.value = THREE.MathUtils.clamp(n, 0, 1));
  return mesh;
}
