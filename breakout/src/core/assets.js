import { bus } from '../utils/eventBus.js';
import { VIEW } from '../config/constants.js';
import { mulberry32, rand } from '../utils/math.js';

/**
 * AssetLoader —— 资源加载与底图生成。
 * - 图片底图：assets/bg/xxx.png（关卡 JSON 中 bg.type="image" 引用），加载失败自动回退程序化底图。
 * - 程序化底图：渐变 + 星点 + 星云光斑，种子可复现，同样走 load 事件上报耗时。
 */
export class AssetLoader {
  constructor() { this.images = new Map(); }

  async loadImage(src) {
    if (this.images.has(src)) return this.images.get(src);
    const t0 = performance.now();
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error(`图片加载失败: ${src}`));
      im.src = src;
    });
    this.images.set(src, img);
    bus.emit('load.asset', { kind: 'image', src, ms: +(performance.now() - t0).toFixed(1) });
    return img;
  }

  /** 依据关卡 bgSpec 生成离屏底图 canvas */
  buildBackground(bgSpec = {}) {
    const t0 = performance.now();
    const cv = document.createElement('canvas');
    cv.width = VIEW.width; cv.height = VIEW.height;
    const ctx = cv.getContext('2d');

    if (bgSpec.type === 'image' && this.images.get(bgSpec.src)) {
      const img = this.images.get(bgSpec.src);
      const s = Math.max(VIEW.width / img.width, VIEW.height / img.height); // cover 裁切
      const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (VIEW.width - w) / 2, (VIEW.height - h) / 2, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
      g.addColorStop(0, bgSpec.top || '#0b1026');
      g.addColorStop(1, bgSpec.bottom || '#1c2b52');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);

      const rng = mulberry32(bgSpec.seed ?? 7);
      // 星云光斑
      for (let i = 0; i < 4; i++) {
        const x = rng() * VIEW.width, y = rng() * VIEW.height * .8;
        const r = rand(90, 220);
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, `rgba(${(60 + rng() * 120) | 0},${(80 + rng() * 100) | 0},255,.14)`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      // 星点
      const stars = bgSpec.stars ?? 140;
      for (let i = 0; i < stars; i++) {
        ctx.globalAlpha = rand(.2, .9);
        ctx.fillStyle = '#fff';
        const s = rand(.5, 1.8);
        ctx.fillRect(rng() * VIEW.width, rng() * VIEW.height, s, s);
      }
      ctx.globalAlpha = 1;
    }

    // 暗角
    const v = ctx.createRadialGradient(VIEW.width / 2, VIEW.height / 2, VIEW.height * .45, VIEW.width / 2, VIEW.height / 2, VIEW.height);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);

    bus.emit('load.bg', { type: bgSpec.type || 'procedural', ms: +(performance.now() - t0).toFixed(1) });
    return cv;
  }
}
