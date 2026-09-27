// check-imports.mjs — 静态 import 图门禁：src 下所有 import 必须可解析
//   node scripts/check-imports.mjs
//
// 检查：相对路径 / 裸包名（three、gsap、lil-gui…在 node_modules）/ JSON import。
// 无浏览器、无 Vite —— 纯文件系统解析，防「引用不存在的模块」上线。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

const RE_STATIC = /(?:^|\n)\s*import\s+(?:[\w*{}\n\r\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;
const RE_DYNAMIC = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

let fail = 0, checked = 0;
const files = walk(path.join(ROOT, 'src'));
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const specs = new Set();
  for (const re of [RE_STATIC, RE_DYNAMIC]) {
    let m;
    while ((m = re.exec(src))) specs.add(m[1]);
  }
  for (const s of specs) {
    checked++;
    let ok = false;
    if (s.startsWith('.') || s.startsWith('/')) {
      const base = s.startsWith('/') ? path.join(ROOT, s) : path.resolve(path.dirname(f), s);
      ok = fs.existsSync(base) || fs.existsSync(base + '.js') || fs.existsSync(path.join(base, 'index.js'));
    } else {
      const pkg = s.startsWith('@') ? s.split('/').slice(0, 2).join('/') : s.split('/')[0];
      ok = fs.existsSync(path.join(ROOT, 'node_modules', s)) || fs.existsSync(path.join(ROOT, 'node_modules', pkg, 'package.json'));
      // 子路径（three/addons/…）：查 exports 映射或直接文件
      if (ok && s.includes('/') && !fs.existsSync(path.join(ROOT, 'node_modules', s))) {
        // exports 别名（three/addons → examples/jsm）：粗查 node_modules/three 下是否存在同名结尾文件
        const sub = s.replace('three/addons/', 'three/examples/jsm/');
        ok = fs.existsSync(path.join(ROOT, 'node_modules', sub));
      }
    }
    if (!ok) {
      fail++;
      console.log('  x ' + path.relative(ROOT, f) + ' -> import "' + s + '" 无法解析');
    }
  }
}
console.log(fail === 0
  ? 'PASS import 图全通过 (' + files.length + ' 文件 / ' + checked + ' 引用)'
  : 'FAIL ' + fail + '/' + checked + ' 引用无法解析');
void fileURLToPath;
process.exit(fail ? 1 : 0);
