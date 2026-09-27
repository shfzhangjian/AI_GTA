/**
 * AssetManager.js — 资产加载（唯一入口，强制清单校验）
 *
 * 铁律：只允许加载 src/assets/manifest.json 中实测存在的模型 key。
 * 任何不存在的 key 直接抛错 —— 从根上杜绝「虚构 GLB 路径」。
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ASSETS, miniManifest, petsManifest } from '../config.js';
import { assertKnownModel, normalizeModel, cloneNormalizedModel } from '../utils/ModelUtils.js';

export class AssetManager {
  constructor() {
    this.manifest = ASSETS.manifest;
    this.atlasUrl = ASSETS.manifest.atlas;

    this.gltfLoader = new GLTFLoader();

    /** @type {Map<string, THREE.Group>} 原始 GLTF scene（归一化由 ModelUtils 负责） */
    this.models = new Map();
    /** @type {Map<string, THREE.AnimationClip[]>} 每模型动画 clips（mini-characters 自带 walk/sprint/idle…） */
    this.animations = new Map();
    /** @type {Map<string, THREE.Texture>} */
    this.textures = new Map();

    this.loading = false;
    this.progress = 0;
    this.total = 0;
    this.loadedCount = 0;
    /** @type {Array<{name:string,file:string,error:string}>} */
    this.errors = [];
  }

  /** 共享图集（实测 72 个 GLB 共用同一张 512 colormap.png） */
  loadAtlas() {
    if (this.textures.has('atlas')) return Promise.resolve(this.textures.get('atlas'));
    return this._loadTex('atlas', this.atlasUrl);
  }

  /** mini-characters 独立图集（实测：与 pirate 图集是两张不同的 colormap.png） */
  loadMiniAtlas() {
    if (this.textures.has('miniAtlas')) return Promise.resolve(this.textures.get('miniAtlas'));
    return this._loadTex('miniAtlas', miniManifest.atlas);
  }

  /** cube-pets 独立图集（第三张 colormap.png） */
  loadPetsAtlas() {
    if (this.textures.has('petsAtlas')) return Promise.resolve(this.textures.get('petsAtlas'));
    return this._loadTex('petsAtlas', petsManifest.atlas);
  }

  _loadTex(key, url) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.anisotropy = 4;
          this.textures.set(key, tex);
          resolve(tex);
        },
        undefined,
        (e) => reject(e),
      );
    });
  }

  /**
   * 加载单个模型（原始 GLTF scene，未归一化）。
   * @param {string} name manifest key
   * @param {{url?:string}} [opts] url：显式资产路径（mini-characters 用独立贴图图集时用）；
   *        缺省走 manifest 中记录的真实路径
   */
  loadModel(name, opts = {}) {
    const entry = assertKnownModel(name); // 清单里没有 → 立即抛错
    if (this.models.has(name)) return Promise.resolve(this.models.get(name));

    const file = opts.url || entry.file;
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        file,
        (gltf) => {
          const model = gltf.scene;
          model.name = name;
          model.userData.source = entry;
          this.models.set(name, model);
          if (gltf.animations && gltf.animations.length) this.animations.set(name, gltf.animations);
          this.loadedCount++;
          this.progress = this.total ? this.loadedCount / this.total : 1;
          resolve(model);
        },
        undefined,
        (err) => {
          this.errors.push({ name, file, error: String(err) });
          reject(new Error('加载失败 "' + name + '" -> ' + file + '（manifest 记录的真实路径）'));
        },
      );
    });
  }

  /**
   * 批量加载。单个失败不中断整体，但记录并汇总报错。
   * @param {string[]} names
   */
  async loadAll(names) {
    this.loading = true;
    this.total = names.length;
    this.loadedCount = 0;
    this.progress = 0;

    await this.loadAtlas().catch((e) => {
      this.errors.push({ name: 'atlas', file: this.atlasUrl, error: String(e) });
    });

    const results = await Promise.allSettled(names.map((n) => this.loadModel(n)));
    this.loading = false;

    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason && r.reason.message);
    if (failed.length) console.error('[AssetManager] 加载失败：\n' + failed.join('\n'));

    return { loaded: this.models.size, total: names.length, failed };
  }

  /**
   * 加载 mini-characters 模型（miniManifest 实测清单）。
   * 贴图：mini 拷贝目录内 Textures/colormap.png 已随模型一起复制，
   * GLTFLoader 按 GLB 相对路径（Textures/…）自动解析，无需手工换图。
   * 单个失败不中断整体，但记录并汇总报错。
   * @param {string[]} names miniManifest key
   */
  async loadMiniCharacters(names) {
    await this.loadMiniAtlas().catch((e) => {
      this.errors.push({ name: 'miniAtlas', file: miniManifest.atlas, error: String(e) });
    });
    const pending = names.filter((n) => !this.models.has(n));
    const results = await Promise.allSettled(pending.map((n) => this.loadModel(n)));
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason && r.reason.message);
    if (failed.length) console.error('[AssetManager] mini-characters 加载失败：\n' + failed.join('\n'));
    return { loaded: names.filter((n) => this.models.has(n)).length, total: names.length, failed };
  }

  /**
   * 加载 cube-pets 模型（petsManifest 实测清单，第三张 colormap 图集，
   * GLTFLoader 按 GLB 相对路径自动取 Textures/colormap.png）。
   * @param {string[]} names petsManifest key
   */
  async loadPets(names) {
    await this.loadPetsAtlas().catch((e) => {
      this.errors.push({ name: 'petsAtlas', file: petsManifest.atlas, error: String(e) });
    });
    const pending = names.filter((n) => !this.models.has(n));
    const results = await Promise.allSettled(pending.map((n) => this.loadModel(n)));
    const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason && r.reason.message);
    if (failed.length) console.error('[AssetManager] cube-pets 加载失败：\n' + failed.join('\n'));
    return { loaded: names.filter((n) => this.models.has(n)).length, total: names.length, failed };
  }

  /** 取已加载模型（缺失抛错，避免 undefined 向下游扩散） */
  get(name) {
    const m = this.models.get(name);
    if (!m) throw new Error('[AssetManager] 模型尚未加载或不存在："' + name + '"');
    return m;
  }

  get atlas() {
    return this.textures.get('atlas') || null;
  }

  /** 是否已加载 */
  has(name) {
    return this.models.has(name);
  }

  /** 已加载 key 列表（控制台验证「未引用虚构模型」） */
  listLoaded() {
    return [...this.models.keys()].sort();
  }

  /**
   * 归一化模板（ModelUtils.normalizeModel 结果）+ 缓存。
   * ⚠ 原始 GLTF Object3D 只能被归一化一次（normalizeModel 会把它塞进新 group），
   *   重复归一化会导致 group 自嵌套 → 因此同 name+opts 只归一化一次。
   *   需要多个实例时用 cloneNormalizedModel / instance()。
   */
  normalized(name, opts = {}) {
    this._normCache = this._normCache || new Map();
    const key = name + '|' + JSON.stringify(opts);
    if (this._normCache.has(key)) return this._normCache.get(key);
    const norm = normalizeModel(this.get(name), name, opts);
    this._normCache.set(key, norm);
    return norm;
  }

  /** 取一个可直接摆进场景的实例 */
  instance(name, opts = {}) {
    const norm = this.normalized(name, opts);
    const g = cloneNormalizedModel(norm.group, name);
    g.userData.model = name;
    g.userData.spec = norm.spec;
    return g;
  }

  /**
   * Shader 编译自检：把 GLSL 失败暴露到控制台。
   * three 编译失败时 renderer.info.programs[i].diagnostics 有内容。
   * ⚠ 必须在至少渲染过一帧之后调用（否则 programs 为空）。
   */
  reportShaderErrors(renderer) {
    const bad = [];
    for (const p of renderer.info.programs || []) {
      if (p.diagnostics) bad.push((p.name || 'ShaderMaterial') + ': ' + JSON.stringify(p.diagnostics));
    }
    if (bad.length) console.error('[Shader 自检] GLSL 编译失败：\n' + bad.join('\n'));
    else console.log('[Shader 自检] 通过 — ' + (renderer.info.programs || []).length + ' 个 program 全部编译成功');
    return bad;
  }
}
