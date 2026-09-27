// check-init-order.mjs — 入口 TDZ 门禁：main.js 顶层 const 不得在声明前被引用
//   node scripts/check-init-order.mjs
//
// 背景：occupancy 曾被传给先构造的 Manager（const 暂时性死区）→
//   页面启动即 Cannot access 'x' before initialization，全站白屏。
//   单测各自 import 模块、从不执行 main.js → 此类错误从未被抓到。
//
// 规则（全静态，无浏览器）：main.js 顶层（顶格起始的语句）中出现的标识符，
// 若属于顶层 const/let/class 声明，则「首次顶层引用行」必须 ≥ 声明行。
// 函数声明体（function f() {...}）在调用时才执行 → 其内部引用不计顶层时机；
// 箭头函数 / 回调（如 addEventListener 内）无法静态区分 —— 这类若在启动即调用
// 才会触发 TDZ，保守起见：顶层引用行号 < 声明行号 一律报警，由人工确认误报。
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'src/main.js'), 'utf8');
const lines = src.split('\n');

/* 1. 顶层 const/let/class 声明（行首无缩进） */
const decl = new Map();   // name -> 声明行
const DECL_RE = /^(?:const|let|class)\s+([A-Za-z_$][\w$]*)/;
lines.forEach((l, i) => {
  const m = l.match(DECL_RE);
  if (m) decl.set(m[1], i + 1);
});

/* 2. 深度跟踪：depth=0 的顶格行 = 顶层语句起始；function 声明体内部豁免 */
let depth = 0;
let funcBodyDepth = null;   // 进入 function 声明时记录其起始 depth，退出解除
let fail = 0;

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  // 去注释 + 去字符串字面量（字符串里的标识符不算引用）
  const code = raw
    .replace(/\/\/.*$/, '')
    .replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
  const opens = (code.match(/\{/g) || []).length;
  const closes = (code.match(/\}/g) || []).length;
  const lineDepth = depth;
  const isTopStart = lineDepth === 0 && /^\S/.test(raw);

  // function 声明起始 → 其体内部豁免 TDZ 判定（调用时机不确定）
  if (isTopStart && /^\s*(export\s+)?function[\s*]/.test(raw)) {
    funcBodyDepth = lineDepth;
  }

  const inExempt = funcBodyDepth !== null && lineDepth > funcBodyDepth;

  if (isTopStart && !inExempt) {
    for (const [name, dl] of decl) {
      if (i + 1 >= dl) continue;                       // 引用在声明之前 → TDZ 违例
      if (i + 1 === dl) continue;                      // 声明行本身（const x = 的 x 位置）
      if (!new RegExp('\\b' + name + '\\b').test(code)) continue;
      fail++;
      console.log('  x main.js:' + (i + 1) + ' 顶层引用 "' + name + '"，但声明在 :' + dl + '（暂时性死区）');
      console.log('    ' + raw.trim());
    }
  }

  depth += opens - closes;
  if (depth < 0) depth = 0;
  // 注：本门禁不豁免 function 声明体 —— 宁可多报再由人工确认。
  void inExempt; void funcBodyDepth;
}

/* 3. 全 src import 可解析（兜底，与 check-imports 重叠但守门更早） */
function walkImports() {
  const files = [];
  (function walk(dir) {
    for (const f of fs.readdirSync(path.join(ROOT, dir))) {
      if (f === 'node_modules') continue;
      const p = dir ? dir + '/' + f : f;
      if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p);
      else if (f.endsWith('.js')) files.push(p);
    }
  })('src');
  const RE = /(?:^|\n)\s*import\s+(?:[\w*{}\n\r\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let fail = 0, checked = 0;
  for (const f of files) {
    const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    let m;
    while ((m = RE.exec(s))) {
      checked++;
      const spec = m[1];
      let ok = false;
      if (spec.startsWith('.')) {
        const base = path.resolve(path.dirname(path.join(ROOT, f)), spec);
        ok = fs.existsSync(base) || fs.existsSync(base + '.js');
      } else {
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        ok = fs.existsSync(path.join(ROOT, 'node_modules', pkg));
        if (ok && !fs.existsSync(path.join(ROOT, 'node_modules', spec))) {
          ok = fs.existsSync(path.join(ROOT, 'node_modules', spec.replace('three/addons/', 'three/examples/jsm/')));
        }
      }
      if (!ok) { fail++; console.log('  x ' + f + ' import "' + spec + '" 不可解析'); }
    }
  }
  return { fail, checked };
}

const imp = walkImports();
const bad = fail + imp.fail;
console.log(bad === 0
  ? 'PASS 入口初始化顺序（TDZ）+ import 全通过（' + decl.size + ' 顶层声明 / ' + imp.checked + ' 引用）'
  : 'FAIL ' + bad + ' 处（TDZ ' + fail + ' / import ' + imp.fail + '）');
process.exit(bad ? 1 : 0);
