/* ============================================================
 * 魔方引擎（纯逻辑，无 DOM）
 * 坐标约定：x=右(+)/左(-)，y=上(+)/下(-)，z=前(+)/后(-)
 * 该文件同时供浏览器与 node 测试使用。
 * ============================================================ */

const AXES = ['x', 'y', 'z'];
const SIGNS = [1, -1];

/** 3x3 整数矩阵工具：行主序数组 */
function matMul(a, b) {
  const r = new Array(9).fill(0);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += a[i * 3 + k] * b[k * 3 + j];
      r[i * 3 + j] = s;
    }
  return r;
}

function matVec(m, v) {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** 绕某轴旋转 90*n 度的整数矩阵（右手系，theta 为度数） */
function rotAxis(axis, deg) {
  const rad = (deg * Math.PI) / 180;
  const c = Math.round(Math.cos(rad));
  const s = Math.round(Math.sin(rad));
  if (axis === 'x') return [1, 0, 0, 0, c, -s, 0, s, c];
  if (axis === 'y') return [c, 0, s, 0, 1, 0, -s, 0, c];
  return [c, -s, 0, s, c, 0, 0, 0, 1]; // z
}

const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/* ---------- 面定义 ---------- */
// 每个面：法向量 axis+sign、中文名、顺时针转动对应的旋转轴与角度
const FACES = {
  U: { axis: 'y', sign: 1,  cn: '上',  label: '上面的黄色面' },
  D: { axis: 'y', sign: -1, cn: '下',  label: '下面的白色面' },
  R: { axis: 'x', sign: 1,  cn: '右',  label: '右侧面' },
  L: { axis: 'x', sign: -1, cn: '左',  label: '左侧面' },
  F: { axis: 'z', sign: 1,  cn: '前',  label: '前面' },
  B: { axis: 'z', sign: -1, cn: '后',  label: '背面' },
};

/* ---------- 初始色块定义（每个酷比的位置、朝向、贴纸颜色） ---------- */
// 家坐标下的贴纸：朝某个轴方向
const HOME_FACES = {
  // 中心块
  U: ['U'], D: ['D'], R: ['R'], L: ['L'], F: ['F'], B: ['B'],
};

// 贴纸颜色 -> 面
const COLOR_OF_FACE = { U: 'Y', D: 'W', R: 'R', L: 'O', F: 'G', B: 'B' };

const COLOR_NAMES = {
  W: { zh: '白色', hex: '#ffffff' },
  Y: { zh: '黄色', hex: '#ffd93d' },
  R: { zh: '红色', hex: '#e74c3c' },
  O: { zh: '橙色', hex: '#f39c12' },
  G: { zh: '绿色', hex: '#2ecc71' },
  B: { zh: '蓝色', hex: '#3498db' },
};

/* "顺时针/逆时针"面转：绕面的外法线轴转 -90（右手系） */
function faceTurnMatrix(face, turns = 1) {
  // 归一化 turns 到 -1, 1, 2
  let t = turns;
  while (t > 2) t -= 4;
  while (t < -2) t += 4;
  return rotAxis(FACES[face].axis, -90 * t);
}

/* ---------------- Cube 类 ---------------- */
class Cube {
  /**
   * @param {Array<{pos:number[], rot:number[], colors:Object<string,string>}>} cubies
   * colors: 面(如 'U','D','R') -> 颜色代码(如 'W','Y'...)
   */
  constructor(cubies) {
    this.cubies = cubies;
    this.rotation = I3; // 整体视角旋转（用于展示，不参与求解逻辑）
  }

  static identity() { return new Cube(Cube.buildSolved()); }

  static buildSolved() {
    const cubies = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (x === 0 && y === 0 && z === 0) continue; // 内核
          const k = Math.abs(x) + Math.abs(y) + Math.abs(z);
          let colors = {};
          let rot = I3.slice();
          // 贴纸对应的“家面”法线
          let faces = [];
          if (x !== 0) faces.push(x > 0 ? 'R' : 'L');
          if (y !== 0) faces.push(y > 0 ? 'U' : 'D');
          if (z !== 0) faces.push(z > 0 ? 'F' : 'B');
          for (const f of faces) colors[f] = COLOR_OF_FACE[f];
          cubies.push({ pos: [x, y, z], rot, colors, type: k });
        }
      }
    }
    return cubies;
  }

  clone() {
    return new Cube(this.cubies.map((c) => ({
      pos: c.pos.slice(),
      rot: c.rot.slice(),
      colors: { ...c.colors },
      type: c.type,
    })));
  }

  /* 应用一次 90° 面转 */
  applyMove(face, turns = 1) {
    const t = ((turns + 4) % 4);
    // 想要的标准角度：顺时针 1 次 => -90
    let deg = t === 0 ? 0 : t === 1 ? -90 : t === 2 ? -180 : -270;
    const m = rotAxis(FACES[face].axis, deg);
    const fAxisIdx = AXES.indexOf(FACES[face].axis);
    const fSign = FACES[face].sign;

    for (const c of this.cubies) {
      if (c.pos[fAxisIdx] === fSign) {
        c.pos = matVec(m, c.pos).map((v) => Math.round(v));
        c.rot = matMul(m, c.rot);   // 左乘：贴纸朝向随方块绕轴旋转
      }
    }
  }

  /* 依据面的“世界朝向”判断贴纸颜色 */
  colorOf(pos, worldNormal) {
    const cubie = this.cubies.find((c) => c.pos[0] === pos[0] && c.pos[1] === pos[1] && c.pos[2] === pos[2]);
    if (!cubie) return null;
    // worldNormal 是在当前世界坐标下的方向，反转回来得到局部面
    let best = null;
    for (const [localFace, color] of Object.entries(cubie.colors)) {
      const n = localFaceNormal(localFace);
      const wn = matVec(cubie.rot, n).map((v) => Math.round(v));
      if (wn[0] === worldNormal[0] && wn[1] === worldNormal[1] && wn[2] === worldNormal[2]) best = color;
    }
    return best;
  }

  /* 立方体已经复原？ */
  isSolved() {
    for (const c of this.cubies) {
      for (const [face, color] of Object.entries(c.colors)) {
        const n = localFaceNormal(face);
        const wn = matVec(c.rot, n).map((v) => Math.round(v));
        const expected = COLOR_OF_FACE[cubeFaceOfNormal(wn)];
        if (color !== expected) return false;
      }
    }
    return true;
  }
}

const FACE_NORMALS = {
  U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1],
};
function localFaceNormal(f) { return FACE_NORMALS[f]; }
function cubeFaceOfNormal(n) {
  if (n[1] === 1) return 'U';
  if (n[1] === -1) return 'D';
  if (n[0] === 1) return 'R';
  if (n[0] === -1) return 'L';
  if (n[2] === 1) return 'F';
  return 'B';
}

if (typeof module !== 'undefined') {
  module.exports = { Cube, matMul, matVec, rotAxis, I3, FACES, COLOR_OF_FACE, COLOR_NAMES, FACE_NORMALS, localFaceNormal, cubeFaceOfNormal, AXES };
}
