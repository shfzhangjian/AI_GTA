// gen-manifest-mini-characters.mjs — 从 kenney_mini-characters 真实 GLB 生成清单（唯一合法引用源）
//
//   node scripts/gen-manifest-mini-characters.mjs [sourceDir]
//
// 做三件事：
//   1. 把 Models/GLB format/*.glb 与 Textures/*.png 复制到 public/assets/mini-characters/
//   2. 解析每个 GLB：场景级包围盒（节点 TRS + 蒙皮网格 joint 链，⚠ 蒙皮模型
//      的 POSITION accessor 是绑定姿势，直接读会得 [0,0,0]）+ 三角面数 + 动画名
//   3. 写 src/assets/manifest-mini-characters.json
//
// 禁止手改产物清单；模型只能引用其中实测存在的 key（ModelUtils.assertKnownMiniCharacterModel）。
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2] || '/Users/mac/Downloads/kenney_mini-characters/Models/GLB format';
const ROOT = path.resolve(import.meta.dirname, '..');
const DEST = path.join(ROOT, 'public/assets/mini-characters');
const OUT = path.join(ROOT, 'src/assets/manifest-mini-characters.json');

function parseGlb(file) {
  const buf = fs.readFileSync(file);
  let off = 12, json = null, binOff = 0;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32LE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'JSON') json = JSON.parse(buf.toString('utf8', off + 8, off + 8 + len));
    if (type === 'BIN') binOff = off + 8;
    off += 8 + len;
  }
  return { json, bin: buf.subarray(binOff) };
}

const T4 = {
  ident: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  mul(a, b) { // a*b，列主序
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  fromQuat(q) {
    const [x, y, z, w] = q;
    return [
      1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
      2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
      2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
      0, 0, 0, 1,
    ];
  },
};

/** 节点局部矩阵（TRS） */
function localMatrix(node) {
  let m = T4.ident();
  if (node.rotation) m = T4.mul(m, T4.fromQuat(node.rotation));
  if (node.scale) { const s = node.scale; m = [m[0] * s[0], m[1] * s[0], m[2] * s[0], m[3] * s[0], m[4] * s[1], m[5] * s[1], m[6] * s[1], m[7] * s[1], m[8] * s[2], m[9] * s[2], m[10] * s[2], m[11] * s[2], m[12], m[13], m[14], 1]; }
  if (node.translation) { const t = node.translation; m = [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], m[12] + t[0], m[13] + t[1], m[14] + t[2], 1]; }
  return m;
}

/** 场景级包围盒：蒙皮网格沿 joint 链累乘（three.js GLTFLoader 同款约定），
 *  普通网格挂到场景根层级。 */
function boundingBox(json) {
  const nodes = json.nodes || [];
  const mn = [Infinity, Infinity, Infinity];
  const mx = [-Infinity, -Infinity, -Infinity];
  let tris = 0;

  const chain = (jointIdx, meshIdx) => { // joint 链世界矩阵
    let m = T4.ident();
    let cur = jointIdx;
    const guard = new Set();
    while (cur !== undefined && !guard.has(cur)) {
      guard.add(cur);
      m = T4.mul(localMatrix(nodes[cur]), m);
      cur = nodes[cur].parent;
    }
    return m;
  };
  const apply = (mat, pos) => {
    const x = mat[0] * pos[0] + mat[4] * pos[1] + mat[8] * pos[2] + mat[12];
    const y = mat[1] * pos[0] + mat[5] * pos[1] + mat[9] * pos[2] + mat[13];
    const z = mat[2] * pos[0] + mat[6] * pos[1] + mat[10] * pos[2] + mat[14];
    mn[0] = Math.min(mn[0], x); mx[0] = Math.max(mx[0], x);
    mn[1] = Math.min(mn[1], y); mx[1] = Math.max(mx[1], y);
    mn[2] = Math.min(mn[2], z); mx[2] = Math.max(mx[2], z);
  };

  // 建 parent 反查
  const parentOf = new Array(nodes.length).fill(undefined);
  nodes.forEach((n, i) => (n.children || []).forEach((c) => { parentOf[c] = i; }));
  nodes.forEach((n, i) => { n.parent = parentOf[i]; });

  const roots = (json.scenes && json.scenes[0] && json.scenes[0].nodes) ||
    nodes.map((_, i) => i).filter((i) => parentOf[i] === undefined);

  const walk = (idx, world) => {
    const n = nodes[idx];
    const m = T4.mul(world, localMatrix(n));
    if (n.mesh !== undefined) {
      for (const p of json.meshes[n.mesh].primitives) {
        const acc = json.accessors[p.attributes.POSITION];
        tris += json.accessors[p.indices] ? json.accessors[p.indices].count / 3 : acc.count / 3;
        if (p.skin !== undefined) continue; // 蒙皮网格走 joint 链
        // 非蒙皮网格：挂在父级世界矩阵下（three 把 mesh 节点展开为 children）
        for (const v of [[acc.min[0], acc.min[1], acc.min[2]], [acc.max[0], acc.max[1], acc.max[2]],
          [acc.min[0], acc.min[1], acc.max[2]], [acc.max[0], acc.max[1], acc.min[2]],
          [acc.min[0], acc.max[1], acc.min[2]], [acc.max[0], acc.min[1], acc.max[2]],
          [acc.max[0], acc.max[1], acc.min[2]], [acc.min[0], acc.max[1], acc.max[2]]]) apply(m, v);
      }
    }
    for (const c of n.children || []) walk(c, m);
  };
  for (const r of roots) walk(r, T4.ident());

  // 蒙皮网格：逐 joint 把 accessor min/max 盒套上 joint 链矩阵（保守并集，与 three 渲染包络一致）
  for (const [si, skin] of (json.skins || []).entries()) void si;
  for (const mesh of json.meshes) {
    for (const p of mesh.primitives) {
      if (p.skin === undefined) continue;
      const skin = json.skins[p.skin];
      const acc = json.accessors[p.attributes.POSITION];
      for (const j of skin.joints) {
        const m = chain(j, mesh);
        for (const v of [[acc.min[0], acc.min[1], acc.min[2]], [acc.max[0], acc.max[1], acc.max[2]]]) apply(m, v);
        // 轴对齐极值角点并集
        for (const a of [acc.min, acc.max]) for (const b of [acc.min, acc.max]) {
          apply(m, [a[0], b[1], a[2]]); apply(m, [b[0], a[1], b[2]]);
        }
      }
    }
  }

  const size = mx.map((v, i) => +(v - mn[i]).toFixed(3));
  const base = +mn[1].toFixed(3);
  return { size, base, tris: Math.round(tris) };
}

fs.mkdirSync(path.join(DEST, 'Textures'), { recursive: true });
const models = {};
const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.glb')).sort();
for (const f of files) {
  const key = f.replace(/\.glb$/, '');
  fs.copyFileSync(path.join(SRC, f), path.join(DEST, f));
  const { json } = parseGlb(path.join(SRC, f));
  const { size, base, tris } = boundingBox(json);
  const parts = new Set();
  for (const n of json.nodes || []) if (n.name) parts.add(n.name);
  models[key] = {
    file: 'assets/mini-characters/' + f,
    size, base, tris,
    parts: [...parts],
    skinned: !!(json.skins || []).length,
    animations: (json.animations || []).map((a) => a.name),
  };
}
const texSrc = path.join(SRC, 'Textures');
const texOut = [];
for (const f of fs.existsSync(texSrc) ? fs.readdirSync(texSrc) : []) {
  if (/\.(png|jpg|jpeg|webp)$/i.test(f)) {
    fs.copyFileSync(path.join(texSrc, f), path.join(DEST, 'Textures', f));
    texOut.push('assets/mini-characters/Textures/' + f);
  }
}
const out = {
  note: 'Generated from real files in kenney_mini-characters (public/assets/mini-characters). Do not hand-edit.',
  atlas: texOut[0] || null,
  models,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('PASS 已生成 ' + OUT + '（' + Object.keys(models).length + ' 模型，贴图 ' + (texOut[0] || '无') + '）');
for (const [k, v] of Object.entries(models)) {
  console.log('  ' + k.padEnd(28) + ' size ' + JSON.stringify(v.size).padEnd(22) + ' base ' + v.base + '  tris ' + String(v.tris).padEnd(5) + (v.skinned ? ' skinned' : ''));
}
