/**
 * SpriteSheet 工具（阶段 3）：把横向帧图切成逐帧 Texture。
 * 帧几何由数据驱动（src/data/diverClips.ts），不做视觉猜测。
 */
import * as THREE from 'three';

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 帧锚点（生成数据只存 x/y + 共享 w/h） */
export interface FramePos {
  x: number;
  y: number;
}

export interface ClipDef {
  url: string;
  frameWidth: number;
  frameHeight: number;
  fps: number;
  loop: boolean;
  frames: FramePos[];
}

/** 由帧位置切帧；共享 image，逐帧生成子纹理 */
export function framesToTextures(
  img: HTMLImageElement,
  frames: FramePos[],
  w: number,
  h: number,
  flipX = false,
): THREE.Texture[] {
  return frames.map((f) => {
    const t = new THREE.Texture(img);
    t.repeat.set((flipX ? -w : w) / img.width, h / img.height);
    t.offset.set((flipX ? f.x + w : f.x) / img.width, 1 - (f.y + h) / img.height);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.needsUpdate = true;
    return t;
  });
}

/** 帧动画播放器（SpriteMaterial 版） */
export class ClipPlayer {
  private t = 0;
  private _name = '';
  constructor(
    private clips: Record<string, THREE.Texture[]>,
    private defs: Record<string, ClipDef>,
    private material: THREE.SpriteMaterial,
  ) {}

  get clipName(): string {
    return this._name;
  }

  play(name: string): void {
    if (this._name !== name && this.clips[name]?.length) {
      this._name = name;
      this.t = 0;
    }
  }

  update(dt: number): void {
    const baseName = this._name.split(':')[0];
    const def = this.defs[baseName];
    const frames = this.clips[this._name];
    if (!def || !frames?.length) return;
    this.t += dt * def.fps;
    let i = Math.floor(this.t);
    if (def.loop) i %= frames.length;
    else i = Math.min(i, frames.length - 1);
    this.material.map = frames[i];
  }
}
