// Spritesheet loader: parses the TexturePacker XML that ships with SpaceRage
// and exposes frame lookup by sprite name (e.g. "player_r_m.png").

export class SpriteAtlas {
  constructor(image, frames) {
    this.image = image;
    this.frames = frames; // Map name -> {x,y,w,h}
    this.sheetW = image.width;
    this.sheetH = image.height;
  }

  frame(name) {
    const f = this.frames.get(name);
    if (!f) console.warn('[atlas] missing frame', name);
    return f;
  }

  // Return all frames whose name starts with a prefix, in natural order.
  seq(prefix) {
    const out = [];
    for (const [name, f] of this.frames) if (name.startsWith(prefix)) out.push(f);
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Draw a frame into a 2D context, centered on (cx, cy).
  draw(ctx, name, cx, cy, scale = 1, rot = 0, alpha = 1, flipX = false) {
    const f = this.frames.get(name);
    if (!f) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    if (rot) ctx.rotate(rot);
    if (flipX) ctx.scale(-1, 1);
    const w = f.w * scale, h = f.h * scale;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.image, f.x, f.y, f.w, f.h, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  size(name) { const f = this.frames.get(name); return f ? { w: f.w, h: f.h } : { w: 32, h: 32 }; }
}

export async function loadAtlas(baseUrl = 'assets/img') {
  const [xmlText, image] = await Promise.all([
    fetch(`${baseUrl}/spritesheet.xml`).then(r => r.text()),
    loadImage(`${baseUrl}/spritesheet.png`),
  ]);
  const frames = new Map();
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  for (const s of doc.querySelectorAll('sprite')) {
    frames.set(s.getAttribute('n'), {
      name: s.getAttribute('n'),
      x: +s.getAttribute('x'),
      y: +s.getAttribute('y'),
      w: +s.getAttribute('w'),
      h: +s.getAttribute('h'),
    });
  }
  const bg = await loadImage(`${baseUrl}/BG.png`).catch(() => null);
  return { atlas: new SpriteAtlas(image, frames), bg, frameCount: frames.size };
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('load failed ' + src));
    img.src = src;
  });
}
