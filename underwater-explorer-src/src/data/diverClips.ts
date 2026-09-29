/**
 * 潜水员动画帧数据（数据驱动，勿手改）。
 * 由 scripts/gen-diver-frames.py 从素材 alpha 通道分析生成（等宽帧 + 居中包围盒）。
 * 素材：ansimuz Underwater Diving Pack（CC0，登记见 docs/ASSET_LICENSES.md）。
 */
import type { ClipDef } from '../utils/spritesheet';

export const DIVER_CLIPS: Record<string, ClipDef> = {
  swim: {
    url: '/assets/player/diver_swimming.png',
    frameWidth: 49,
    frameHeight: 25,
    fps: 10,
    loop: true,
    frames: [
      { x: 15, y: 29 },
      { x: 95, y: 27 },
      { x: 174, y: 26 },
      { x: 255, y: 27 },
      { x: 335, y: 29 },
      { x: 415, y: 27 },
      { x: 494, y: 26 },
    ],
  },
  idle: {
    url: '/assets/player/diver_idle.png',
    frameWidth: 39,
    frameHeight: 51,
    fps: 6,
    loop: true,
    frames: [
      { x: 24, y: 14 },
      { x: 104, y: 15 },
      { x: 184, y: 16 },
      { x: 264, y: 18 },
      { x: 344, y: 16 },
      { x: 424, y: 15 },
    ],
  },
  hurt: {
    url: '/assets/player/diver_hurt.png',
    frameWidth: 38,
    frameHeight: 49,
    fps: 8,
    loop: true,
    frames: [
      { x: 25, y: 16 },
      { x: 107, y: 12 },
      { x: 185, y: 11 },
      { x: 259, y: 15 },
      { x: 344, y: 20 },
    ],
  },
  fast: {
    url: '/assets/player/diver_fast.png',
    frameWidth: 50,
    frameHeight: 19,
    fps: 12,
    loop: true,
    frames: [
      { x: 15, y: 28 },
      { x: 96, y: 30 },
      { x: 176, y: 29 },
      { x: 256, y: 29 },
      { x: 334, y: 28 },
    ],
  },
  rush: {
    url: '/assets/player/diver_rush.png',
    frameWidth: 59,
    frameHeight: 27,
    fps: 12,
    loop: true,
    frames: [
      { x: 10, y: 25 },
      { x: 95, y: 29 },
      { x: 178, y: 28 },
      { x: 260, y: 31 },
      { x: 341, y: 25 },
      { x: 412, y: 26 },
      { x: 489, y: 26 },
    ],
  },
};
