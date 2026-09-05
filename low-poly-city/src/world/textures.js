/**
 * Canvas 程序化纹理工厂 —— 不需要任何外部图片资源。
 * 所有建筑立面（窗格、玻璃幕墙）都在这里生成。
 */
import * as THREE from 'three';

const CELL = 26; // 每个窗户单元的像素尺寸
const PAD = 7;   // 窗户四周留白

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(4, w);
  cv.height = Math.max(4, h);
  return [cv, cv.getContext('2d')];
}

function toTexture(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * 普通住宅立面：纯色墙面 + 规则窗格阵列。
 * @param {{wall:string, win:string, cols:number, rows:number}} p
 */
export function facadeTexture({ wall, win, cols = 6, rows = 8 }) {
  const [cv, ctx] = makeCanvas(cols * CELL, rows * CELL);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, cv.width, cv.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * CELL + PAD;
      const y = r * CELL + PAD;
      const w = CELL - PAD * 2;
      const h = CELL - PAD * 2 - 4;
      ctx.fillStyle = win;
      ctx.fillRect(x, y, w, h);
      // 窗户上半部的高光，增加层次
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x, y, w, h * 0.38);
    }
    // 楼层之间的分隔线
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, r * CELL + CELL - 4, cv.width, 2);
  }
  return toTexture(cv);
}

/**
 * 玻璃幕墙：蓝色底 + 竖向亮色竖梃 + 楼层横带 + 随机反光。
 */
export function glassTexture(cols = 8, rows = 10) {
  const [cv, ctx] = makeCanvas(cols * CELL, rows * CELL);
  ctx.fillStyle = '#5b9bd5';
  ctx.fillRect(0, 0, cv.width, cv.height);

  // 随机反光面板
  for (let i = 0; i < cols * rows * 0.18; i++) {
    const c = Math.floor(Math.random() * cols);
    const r = Math.floor(Math.random() * rows);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.1})`;
    ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
  }
  // 楼层横带（深）与竖梃（亮）
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = 'rgba(35,80,130,0.5)';
    ctx.fillRect(0, r * CELL + CELL - 5, cv.width, 5);
  }
  for (let c = 0; c <= cols; c++) {
    ctx.fillStyle = 'rgba(210,235,252,0.75)';
    ctx.fillRect(c * CELL - 1.5, 0, 3, cv.height);
  }
  return toTexture(cv);
}

/**
 * 圆柱塔楼立面：白色墙板之间夹通高的蓝色玻璃竖带。
 */
export function cylinderFacadeTexture({ wall = '#f5f7f9', glass = '#7fb2df', cols = 10, rows = 10 }) {
  const [cv, ctx] = makeCanvas(cols * CELL, rows * CELL);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, cv.width, cv.height);

  for (let c = 0; c < cols; c++) {
    if (c % 2 === 1) { // 奇数列画通高玻璃带
      const x = c * CELL + 5;
      ctx.fillStyle = glass;
      ctx.fillRect(x, 4, CELL - 10, cv.height - 8);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(x, 4, (CELL - 10) * 0.35, cv.height - 8);
    } else { // 偶数列画楼层线
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = 'rgba(0,0,0,0.07)';
        ctx.fillRect(c * CELL + 4, r * CELL + CELL - 4, CELL - 8, 2);
      }
    }
  }
  return toTexture(cv);
}
