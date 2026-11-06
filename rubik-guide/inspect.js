/* 调试/测试工具：把 Cube 状态转成面网格，便于断言 */
const { matVec, FACE_NORMALS } = require('./engine.js');

// 每个面从外部看：right = 右方向的世界向量, down = 下方向
const FACE_VIEW = {
  U: { norm: [0, 1, 0], right: [1, 0, 0], down: [0, 0, -1] },
  D: { norm: [0, -1, 0], right: [1, 0, 0], down: [0, 0, 1] },
  R: { norm: [1, 0, 0], right: [0, 0, -1], down: [0, -1, 0] },
  L: { norm: [-1, 0, 0], right: [0, 0, 1], down: [0, -1, 0] },
  F: { norm: [0, 0, 1], right: [1, 0, 0], down: [0, -1, 0] },
  B: { norm: [0, 0, -1], right: [-1, 0, 0], down: [0, -1, 0] },
};

function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

/** 返回 face -> 3x3 数组（行从上到下，列从左到右，从外部看） */
function faceGrids(cube) {
  const out = {};
  for (const [f, v] of Object.entries(FACE_VIEW)) {
    const ai = v.norm.findIndex(x => x !== 0);
    const grid = [[null, null, null], [null, null, null], [null, null, null]];
    for (const c of cube.cubies) {
      if (c.pos[ai] !== v.norm[ai]) continue;
      for (const [lf, col] of Object.entries(c.colors)) {
        const n = matVec(c.rot, FACE_NORMALS[lf]).map(x => Math.round(x));
        if (dot(n, v.norm) !== 1) continue;
        const colI = dot(c.pos, v.right) + 1;
        const rowI = dot(c.pos, v.down) + 1;
        grid[rowI][colI] = col;
      }
    }
    out[f] = grid;
  }
  return out;
}

/** 一行一行打印所有面（方便肉眼检查） */
function printFace(f, grid) {
  return grid.map(r => r.map(c => (c || '.')).join('')).join(' | ');
}

module.exports = { faceGrids, printFace, FACE_VIEW };
