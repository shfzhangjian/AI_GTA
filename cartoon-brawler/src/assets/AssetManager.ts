/**
 * AssetManager: GLTF loading (with DRACO/KTX2 wiring), progress reporting,
 * graceful per-asset fallback so a missing file never bricks the game.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { ASSET_REGISTRY } from './AssetRegistry';

export interface LoadedModel {
  template: THREE.Group;
  clips: THREE.AnimationClip[];
  fromFile: boolean;
}

export type ProgressCb = (fraction: number, label: string) => void;

export class AssetManager {
  private loader: GLTFLoader;
  private models = new Map<string, LoadedModel>();
  private draco: DRACOLoader | null = null;
  private ktx2: KTX2Loader | null = null;
  /** Assets that failed to load — consumers must mark TODO Replace Asset. */
  readonly failed = new Set<string>();

  constructor(renderer: THREE.WebGLRenderer) {
    this.loader = new GLTFLoader();
    try {
      this.draco = new DRACOLoader();
      this.draco.setDecoderPath('./draco/'); // optional local decoder; harmless if unused
      this.loader.setDRACOLoader(this.draco);
    } catch { /* draco unavailable */ }
    try {
      this.ktx2 = new KTX2Loader();
      this.ktx2.setTranscoderPath('./basis/').detectSupport(renderer);
      this.loader.setKTX2Loader(this.ktx2);
    } catch { /* ktx2 unavailable */ }
  }

  /** Load every registered model asset; failures are recorded, not thrown. */
  loadAll(onProgress: ProgressCb): Promise<void> {
    const entries = Object.values(ASSET_REGISTRY).filter((a) => a.kind === 'model' && a.url);
    let done = 0;
    const total = Math.max(entries.length, 1);
    return Promise.all(
      entries.map((entry) =>
        this.loadModel(entry.id, entry.url!).then(() => {
          done++;
          onProgress(done / total, entry.id);
        }),
      ),
    ).then(() => undefined);
  }

  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  private withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {

    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`timeout ${label}`)), ms);
      this.timeouts.set(label, t);
      p.then(
        (v) => { clearTimeout(t); this.timeouts.delete(label); resolve(v); },
        (e) => { clearTimeout(t); this.timeouts.delete(label); reject(e); },
      );
    });
  }

  private loadedOnce = new Set<string>();

  async loadModel(id: string, url: string): Promise<LoadedModel> {
    // retry once on failure (dev server first-byte can stall under virtual time)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.loadModelOnce(id, url);
      } catch (e) {
        if (attempt === 1) throw e;
        console.warn(`[AssetManager] retrying ${url}`);
      }
    }
    throw new Error('unreachable');
  }

  private async loadModelOnce(id: string, url: string): Promise<LoadedModel> {
    if (this.loadedOnce.has(url)) throw new Error('already loaded');
    this.loadedOnce.add(url);
    try {
      const gltf = await this.withTimeout(this.loader.loadAsync(url), 25000, url);
      const template = gltf.scene;
      template.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = false;
        }
      });
      const model: LoadedModel = { template, clips: gltf.animations ?? [], fromFile: true };
      this.models.set(id, model);
      return model;
    } catch (err) {
      console.warn(`[AssetManager] failed to load "${url}" — using procedural fallback. TODO Replace Asset`, err);
      this.failed.add(id);
      const fallback = buildPlaceholderTemplate();
      const model: LoadedModel = { template: fallback, clips: [], fromFile: false };
      this.models.set(id, model);
      return model;
    }
  }

  get(id: string): LoadedModel | undefined {
    return this.models.get(id);
  }

  has(id: string): boolean {
    const m = this.models.get(id);
    return !!m && m.fromFile;
  }

  dispose(): void {
    this.draco?.dispose();
    this.ktx2?.dispose();
  }
}

/** Minimal rigged-looking placeholder used when a GLB is missing. */
function buildPlaceholderTemplate(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.0, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9a066, roughness: 0.9 }),
  );
  m.position.y = 0.9;
  g.add(m);
  return g;
}
