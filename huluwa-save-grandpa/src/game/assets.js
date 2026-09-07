import * as THREE from '../../libs/three.module.js';

export const SPRITES = Object.freeze({
  hero: {
    idle: [
      './assets/sprites/hero-idle-0.png',
      './assets/sprites/hero-idle-1.png',
      './assets/sprites/hero-idle-2.png',
      './assets/sprites/hero-idle-1.png',
    ],
    shoot: [
      './assets/sprites/hero-shoot-0.png',
      './assets/sprites/hero-shoot-1.png',
      './assets/sprites/hero-shoot-2.png',
    ],
  },
  enemies: {
    walk: [
      './assets/sprites/monster-walk-0.png',
      './assets/sprites/monster-walk-1.png',
      './assets/sprites/monster-walk-2.png',
      './assets/sprites/monster-walk-3.png',
    ],
    eye: [
      './assets/sprites/monster-eye-0.png',
      './assets/sprites/monster-eye-1.png',
    ],
  },
  grandpa: {
    idle: ['./assets/sprites/grandpa-stand.png'],
  },
});

const textureCache = new Map();

export function getSpriteTexture(src, options = {}) {
  const key = `${src}:${options.pixelated ? 'pixel' : 'smooth'}`;
  if (textureCache.has(key)) {
    return textureCache.get(key);
  }

  const texture = new THREE.TextureLoader().load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = options.pixelated ? THREE.NearestFilter : THREE.LinearMipMapLinearFilter;
  texture.magFilter = options.pixelated ? THREE.NearestFilter : THREE.LinearFilter;
  texture.generateMipmaps = !options.pixelated;
  textureCache.set(key, texture);
  return texture;
}

export class AnimatedSprite {
  constructor({
    frames,
    width,
    height,
    fps = 6,
    loop = true,
    pixelated = false,
    color = 0xffffff,
    opacity = 1,
    z = 0,
  }) {
    this.pixelated = pixelated;
    this.textures = frames.map((frame) => getSpriteTexture(frame, { pixelated }));
    this.fps = fps;
    this.loop = loop;
    this.elapsed = 0;
    this.frameIndex = 0;
    this.onDone = null;

    const material = new THREE.MeshBasicMaterial({
      map: this.textures[0],
      color,
      transparent: true,
      opacity,
      alphaTest: 0.03,
      depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    this.mesh.position.z = z;
  }

  setSequence(frames, options = {}) {
    this.textures = frames.map((frame) => getSpriteTexture(frame, { pixelated: this.pixelated }));
    this.fps = options.fps ?? this.fps;
    this.loop = options.loop ?? true;
    this.elapsed = 0;
    this.frameIndex = 0;
    this.onDone = options.onDone ?? null;
    this.mesh.material.map = this.textures[0];
    this.mesh.material.needsUpdate = true;
  }

  update(dt) {
    if (this.textures.length <= 1) {
      return;
    }

    this.elapsed += dt;
    const rawIndex = Math.floor(this.elapsed * this.fps);
    let nextIndex = rawIndex;

    if (this.loop) {
      nextIndex %= this.textures.length;
    } else if (nextIndex >= this.textures.length) {
      nextIndex = this.textures.length - 1;
      const done = this.onDone;
      this.onDone = null;
      done?.();
    }

    if (nextIndex !== this.frameIndex) {
      this.frameIndex = nextIndex;
      this.mesh.material.map = this.textures[this.frameIndex];
      this.mesh.material.needsUpdate = true;
    }
  }
}
