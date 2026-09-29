#!/usr/bin/env node
/**
 * check-assets.mjs — 资源检测脚本（阶段 1）
 *
 * 检查 public/assets/ 下：
 *  1. 空文件 / 过小文件（< 64B 视为可疑）
 *  2. 异常扩展名（不在白名单）
 *  3. 跨目录重复文件名（易引用混淆）
 *  4. 图片文件头损坏（PNG/JPEG/GIF/WebP 魔数校验）
 *  5. 音频文件头（WAV/MP3/OGG 魔数校验）
 *  6. src/ 代码与 docs/ASSET_MAPPING.md 中引用的 /assets/... 路径是否存在
 *
 * 用法： node scripts/check-assets.mjs   （退出码 0=PASS，1=FAIL）
 * 仅用 Node 内置模块，无第三方依赖。
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'public', 'assets');
const MAPPING = join(ROOT, 'docs', 'ASSET_MAPPING.md');
const SRC = join(ROOT, 'src');

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const AUDIO_EXT = new Set(['.wav', '.mp3', '.ogg', '.m4a']);
const DATA_EXT = new Set(['.json', '.txt', '.md', '.atlas']);
const ALLOWED = new Set([...IMG_EXT, ...AUDIO_EXT, ...DATA_EXT]);

const problems = [];
const warn = (file, msg) => problems.push(`[${basename(file)}] ${msg}`);

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile()) yield p;
  }
}

function magicOk(file, buf) {
  const ext = extname(file).toLowerCase();
  const isPNG = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50;
  const isJPG = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
  const isGIF = buf.length > 4 && buf.subarray(0, 4).toString('latin1').startsWith('GIF8');
  const isWEBP = buf.length > 12 && buf.subarray(8, 12).toString('latin1') === 'WEBP';
  const isWAV = buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WAVE';
  const isMP3 = buf.length > 3 && ((buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0));
  const isOGG = buf.length > 4 && buf.subarray(0, 4).toString('latin1') === 'OggS';
  if (IMG_EXT.has(ext)) return (ext === '.png' ? isPNG : ext === '.jpg' || ext === '.jpeg' ? isJPG : ext === '.gif' ? isGIF : isWEBP);
  if (AUDIO_EXT.has(ext)) return (ext === '.wav' ? isWAV : ext === '.mp3' ? isMP3 : isOGG);
  return true; // 数据文件不做魔数检查
}

// PNG 尺寸 + 透明通道（读 IHDR）
function pngInfo(buf) {
  if (!(buf[0] === 0x89 && buf[1] === 0x50)) return null;
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25]; // 6=RGBA, 4=Gray+A, 3=pal(可能含 tRNS)
  const hasAlpha = colorType === 6 || colorType === 4;
  return { w, h, hasAlpha: hasAlpha || buf.includes(Buffer.from('tRNS')) };
}

const files = [];
if (existsSync(ASSETS)) for (const f of walk(ASSETS)) files.push(f);

const byName = new Map();
let imgCount = 0, audioCount = 0, dataCount = 0;
const rows = [];

for (const f of files) {
  const st = statSync(f);
  const ext = extname(f).toLowerCase();
  const rel = relative(ROOT, f);

  if (!ALLOWED.has(ext)) { warn(f, `异常扩展名 ${ext}`); continue; }
  if (st.size === 0) { warn(f, '空文件(0字节)'); continue; }
  if (st.size < 64) warn(f, `可疑小文件 ${st.size}B`);

  const buf = readFileSync(f);
  if (!magicOk(f, buf)) warn(f, `文件头损坏/扩展名与内容不符 (${ext})`);

  // 重复文件名检测
  const key = basename(f).toLowerCase();
  if (byName.has(key)) warn(f, `文件名与其他目录重复: ${key}`);
  else byName.set(key, rel);

  let info = '';
  if (IMG_EXT.has(ext) && ext === '.png') {
    imgCount++;
    const p = pngInfo(buf);
    if (p) {
      info = `${p.w}x${p.h} alpha=${p.hasAlpha ? 'Y' : 'N'}`;
      rows.push({ rel, size: st.size, info });
    }
  } else if (IMG_EXT.has(ext)) imgCount++;
  else if (AUDIO_EXT.has(ext)) { audioCount++; rows.push({ rel, size: st.size, info: 'audio' }); }
  else dataCount++;
}

// 引用完整性：代码与映射表中出现的 /assets/... 路径必须存在
const refRe = /\/assets\/[A-Za-z0-9_\-./]+\.(?:png|jpg|jpeg|gif|webp|wav|mp3|ogg|json|atlas)/g;
const refs = new Set();
function collectRefs(dir, filterExt) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) collectRefs(p, filterExt);
    else if (filterExt.has(extname(e.name).toLowerCase())) {
      const txt = readFileSync(p, 'utf8');
      for (const m of txt.match(refRe) || []) refs.add(m);
    }
  }
}
collectRefs(SRC, new Set(['.ts', '.css', '.json', '.html']));
if (existsSync(MAPPING)) {
  for (const m of readFileSync(MAPPING, 'utf8').match(refRe) || []) refs.add(m);
}
let refOk = 0;
for (const ref of refs) {
  const disk = join(ROOT, 'public', ref);
  if (existsSync(disk)) refOk++;
  else problems.push(`[refs] 引用了不存在的资源: ${ref}`);
}

console.log(`assets files: ${files.length} (img ${imgCount}, audio ${audioCount}, data ${dataCount})`);
console.log(`asset refs resolved: ${refOk}/${refs.size}`);
if (problems.length) {
  console.log(`PROBLEMS (${problems.length}):`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('ASSET CHECK: PASS');
