/**
 * 环境装饰（阶段 4）：海草摆动 / 珊瑚与沉船构件 / 岩石，程序化散布。
 *
 * 性能规范：
 *  - 每张源贴图只加载一次（getSheet 去重）；切片克隆共享 GPU 上传
 *  - 实例对象池 + 距离休眠（frustum-suspend）：只激活视野内对象
 *  - 世界锚定：海底遗迹/珊瑚/海草都固定在海床世界坐标，不跟随镜头漂移
 *  - 散布确定性（mulberry32 固定种子），可复跑
 * 数据驱动：SHEETS 表 + CORAL_SLICES（scripts 分析生成）。
 */
import * as THREE from 'three';
import type { Engine } from '../core/engine';
import type { Terrain } from './Terrain';
import { WORLD_X_LIMIT } from './Terrain';
import { setDebug, reportError } from '../core/debug';

interface Slice {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DecorDef {
  url: string;
  /** props_coral 连通域切片表；null=整图 */
  useSlices?: Slice[];
  /** 等分列切片数（无 useSlices 时） */
  slices?: number;
  scale: number;
  density: number; // 每 400u 宽度数量
  anchor: 'ground' | 'float';
  sway?: number; // 摆动幅度 rad
  parallax: 'far' | 'mid' | 'near';
  flipChance?: number;
}

/** props_coral（1024×496）连通域切片：拱门×2、图腾×2、柱廊、碎石×2、珊瑚丛×3 */
const CORAL_SLICES: Slice[] = [
  { x: 752, y: 70, w: 245, h: 186 }, // 柱廊
  { x: 176, y: 275, w: 198, h: 205 }, // 拱门大
  { x: 177, y: 34, w: 198, h: 205 }, // 拱门（同图变体）
  { x: 596, y: 41, w: 120, h: 231 }, // 图腾+珊瑚
  { x: 432, y: 41, w: 92, h: 231 }, // 图腾
  { x: 49, y: 95, w: 85, h: 98 }, // 碎石
  { x: 33, y: 334, w: 85, h: 98 }, // 碎石
  { x: 434, y: 332, w: 46, h: 51 }, // 黄珊瑚
  { x: 614, y: 317, w: 52, h: 67 }, // 紫珊瑚
  { x: 514, y: 327, w: 48, h: 56 }, // 深色海扇
];

const SHEETS: DecorDef[] = [
  // 海草（近景，摆动）
  { url: '/assets/environment/seaweed/seaweed_green_a.png', scale: 3, density: 5, anchor: 'ground', sway: 0.08, parallax: 'near', flipChance: 0.5 },
  { url: '/assets/environment/seaweed/seaweed_pink_b.png', scale: 3, density: 2, anchor: 'ground', sway: 0.1, parallax: 'near', flipChance: 0.5 },
  { url: '/assets/environment/seaweed/seaweed_orange_a.png', scale: 2.6, density: 2, anchor: 'ground', sway: 0.09, parallax: 'near', flipChance: 0.5 },
  // 岩石
  { url: '/assets/environment/rocks/rock_a.png', scale: 2.6, density: 3, anchor: 'ground', parallax: 'near', flipChance: 0.5 },
  { url: '/assets/environment/rocks/rock_b_outline.png', scale: 2.2, density: 2, anchor: 'ground', parallax: 'near', flipChance: 0.5 },
  // 珊瑚/沉船构件：远景大构件（柱廊/拱门）
  { url: '/assets/environment/coral/props_coral.png', useSlices: [CORAL_SLICES[0], CORAL_SLICES[1], CORAL_SLICES[3]], scale: 4.5, density: 0.8, anchor: 'ground', parallax: 'far', flipChance: 0.4 },
  // 中景图腾
  { url: '/assets/environment/coral/props_coral.png', useSlices: [CORAL_SLICES[2], CORAL_SLICES[4]], scale: 3.2, density: 1.0, anchor: 'ground', parallax: 'mid', flipChance: 0.4 },
  // 近景小珊瑚丛
  { url: '/assets/environment/coral/props_coral.png', useSlices: [CORAL_SLICES[7], CORAL_SLICES[8], CORAL_SLICES[9]], scale: 2.2, density: 3, anchor: 'ground', parallax: 'near', flipChance: 0.5 },
  // 漂浮远景剪影（碎石/海扇做悬浮暗色块）
  { url: '/assets/environment/coral/props_coral.png', useSlices: [CORAL_SLICES[5], CORAL_SLICES[9]], scale: 2.6, density: 1.2, anchor: 'float', parallax: 'far', flipChance: 0.6 },
];

const SEG_W = 400;
const DECOR_X_LIMIT = WORLD_X_LIMIT;
interface Placed {
  sprite: THREE.Sprite;
  def: DecorDef;
  baseX: number;
  baseY: number;
  phase: number;
  flipped: boolean;
  baseW: number;
  baseH: number;
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sliceTexture(base: THREE.Texture, s: Slice): THREE.Texture {
  const t = base.clone(); // 共享源图（GPU 纹理复用），仅 uv 不同
  const img = base.image as HTMLImageElement;
  t.repeat.set(s.w / img.width, s.h / img.height);
  t.offset.set(s.x / img.width, 1 - (s.y + s.h) / img.height);
  t.needsUpdate = true;
  return t;
}

export interface Decorations {
  getPlacedCount(): number;
  getActiveCount(): number;
}

export function createDecorations(engine: Engine, terrain: Terrain): Decorations {
  const rand = mulberry(1337);
  const groups: Record<DecorDef['parallax'], THREE.Group> = {
    far: new THREE.Group(),
    mid: new THREE.Group(),
    near: new THREE.Group(),
  };
  groups.far.name = 'decorFarLayer';
  groups.mid.name = 'decorMidLayer';
  groups.near.name = 'decorNearLayer';
  // 保持在各自 Layer z 带内：远→water，中→terrain，近→entity 之前（terrain 后）
  engine.layers.water.add(groups.far);
  engine.layers.terrain.add(groups.mid, groups.near);

  const sheets = new Map<string, Promise<THREE.Texture>>();
  const placed: Placed[] = [];
  let loaded = false;

  function getSheet(url: string): Promise<THREE.Texture> {
    let p = sheets.get(url);
    if (!p) {
      p = new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          url,
          (t) => {
            t.magFilter = THREE.NearestFilter;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            resolve(t);
          },
          undefined,
          reject,
        );
      });
      sheets.set(url, p);
    }
    return p;
  }

  async function generate(): Promise<void> {
    for (const def of SHEETS) {
      let tex: THREE.Texture;
      try {
        tex = await getSheet(def.url);
      } catch (err) {
        reportError('decor.load ' + def.url, err);
        continue;
      }
      const imgBase = tex.image as HTMLImageElement;
      const sliceList: Slice[] =
        def.useSlices ??
        (def.slices
          ? Array.from({ length: def.slices }, (_, i) => ({
              x: (i * imgBase.width) / def.slices!,
              y: 0,
              w: imgBase.width / def.slices!,
              h: imgBase.height,
            }))
          : [{ x: 0, y: 0, w: imgBase.width, h: imgBase.height }]);

      const perSeg = Math.max(1, Math.round(def.density));
      const segCount = Math.ceil((DECOR_X_LIMIT * 2) / SEG_W);
      for (let seg = 0; seg < segCount; seg++) {
        for (let i = 0; i < perSeg; i++) {
          const x = -DECOR_X_LIMIT + rand() * DECOR_X_LIMIT * 2;
          // groundYAt=沙地块顶面（Diver 贴地语义一致）
          const gy = terrain.groundYAt(x);
          // float：悬浮于海床上方 60~1100u 的水柱（覆盖潜水员巡航深度带）
          const y = def.anchor === 'ground' ? gy + 4 : gy + 60 + rand() * 1040;
          const slice = sliceList[Math.floor(rand() * sliceList.length)];
          const mat = new THREE.SpriteMaterial({
            map: sliceTexture(tex, slice),
            depthWrite: false,
            transparent: true,
            opacity: def.parallax === 'far' ? 0.75 : def.parallax === 'mid' ? 0.9 : 1,
          });
          const sprite = new THREE.Sprite(mat);
          sprite.visible = false;
          const w = slice.w * def.scale * 0.22;
          const h = slice.h * def.scale * 0.22;
          sprite.scale.set(w, h, 1);
          groups[def.parallax].add(sprite);
          placed.push({
            sprite, def, baseX: x, baseY: y,
            phase: rand() * Math.PI * 2,
            flipped: !!def.flipChance && rand() < def.flipChance,
            baseW: w, baseH: h,
          });
        }
      }
    }
    loaded = true;
    setDebug({ decorCount: placed.length, decorTextures: sheets.size, decorLoaded: 1 });
  }
  void generate();

  let activeCount = 0;
  let throttle = 0;

  engine.addUpdate((dt, elapsed) => {
    if (!loaded) return;
    throttle += dt;
    if (throttle < 1 / 20) return; // 显隐检查 20Hz 足够
    throttle = 0;

    const cam = engine.camera;
    groups.far.position.set(0, 0, 0);
    groups.mid.position.set(0, 0, 0);
    const halfW = (cam.right - cam.left) / 2;
    const halfH = (cam.top - cam.bottom) / 2;
    let active = 0;
    let minDist = 1e9;

    for (const p of placed) {
      const onScreen =
        p.baseX > cam.position.x - halfW - 140 && p.baseX < cam.position.x + halfW + 140 &&
        p.baseY > cam.position.y - halfH - 160 && p.baseY < cam.position.y + halfH + 160;
      minDist = Math.min(minDist, Math.abs(p.baseX - cam.position.x), Math.abs(p.baseY - cam.position.y));
      if (p.sprite.visible !== onScreen) p.sprite.visible = onScreen;
      if (!onScreen) continue;
      active++;

      p.sprite.position.x = p.baseX;
      p.sprite.position.y = p.baseY;
      // 海草/珊瑚摆动：整体倾斜（锚定底部）
      if (p.def.sway) {
        p.sprite.rotation.z = Math.sin(elapsed * 1.15 + p.phase) * p.def.sway;
        // sprite 中心旋转会入地，微抬：
        p.sprite.position.y = p.baseY + Math.abs(Math.sin(elapsed * 1.15 + p.phase)) * 2;
      }
      const flip = p.flipped ? -1 : 1;
      p.sprite.scale.set(p.baseW * flip, p.baseH, 1);
    }
    activeCount = active;
    setDebug({ decorActive: active, decorMinDist: Math.round(minDist) });
  });

  return {
    getPlacedCount() {
      return placed.length;
    },
    getActiveCount() {
      return activeCount;
    },
  };
}
