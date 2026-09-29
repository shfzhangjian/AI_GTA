/**
 * 鼠标输入（阶段 7）：屏幕坐标追踪 + 世界坐标换算 + 左键。
 * 世界换算：正交相机投影范围是相机本地坐标，需叠加 camera.position。
 */
import type * as THREE from 'three';

export interface MouseState {
  /** CSS 像素（视口） */
  screenX(): number;
  screenY(): number;
  /** 世界坐标（每帧调用，实时读相机） */
  worldX(cam: THREE.OrthographicCamera): number;
  worldY(cam: THREE.OrthographicCamera): number;
  leftDown(): boolean;
  /** 消费一次性的左键按下事件（发射触发用） */
  consumeLeftPress(): boolean;
  dispose(): void;
}

export function createMouse(): MouseState {
  let sx = window.innerWidth / 2;
  let sy = window.innerHeight / 2;
  let down = false;
  let pressQueued = false;

  const mm = (e: MouseEvent) => {
    sx = e.clientX;
    sy = e.clientY;
  };
  const md = (e: MouseEvent) => {
    if (e.button === 0) {
      down = true;
      pressQueued = true;
    }
  };
  const mu = (e: MouseEvent) => {
    if (e.button === 0) down = false;
  };
  window.addEventListener('mousemove', mm);
  window.addEventListener('mousedown', md);
  window.addEventListener('mouseup', mu);

  return {
    screenX: () => sx,
    screenY: () => sy,
    worldX(cam) {
      return cam.position.x + cam.left + (sx / window.innerWidth) * (cam.right - cam.left);
    },
    worldY(cam) {
      return cam.position.y + cam.top - (sy / window.innerHeight) * (cam.top - cam.bottom);
    },
    leftDown: () => down,
    consumeLeftPress() {
      const v = pressQueued;
      pressQueued = false;
      return v;
    },
    dispose() {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mousedown', md);
      window.removeEventListener('mouseup', mu);
    },
  };
}
