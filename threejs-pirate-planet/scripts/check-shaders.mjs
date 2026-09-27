// check-shaders.mjs — 纯静态 GLSL 检查（不建 WebGL）
// 抓「引用了未声明变量 → shader 编译失败 → three 静默回退默认材质」这类隐蔽事故。
import fs from 'node:fs';
import path from 'node:path';

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'node_modules') continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

// three ShaderMaterial 自动注入的内置名
const BUILTIN = new Set([
  'modelMatrix', 'modelViewMatrix', 'projectionMatrix', 'viewMatrix', 'normalMatrix',
  'cameraPosition', 'position', 'normal', 'uv', 'uv2', 'color', 'instanceMatrix', 'isOrthographic',
]);
// GLSL 内建函数 / 关键字（白名单，减少误报）
const GLSL_FN = /^(sin|cos|tan|asin|acos|atan|sinh|cosh|pow|exp|log|exp2|log2|sqrt|inversesqrt|abs|sign|floor|ceil|fract|mod|modf|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|faceforward|reflect|refract|matrixCompMult|lessThan|lessThanEqual|greaterThan|greaterThanEqual|equal|notEqual|any|all|not|texture2D|texture2DProj|texture2DLodEXT|textureCube|dFdx|dFdy|float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|bvec2|bvec3|bvec4|void|return|if|else|for|while|do|break|continue|discard|const|uniform|varying|attribute|in|out|inout|struct|precision|highp|mediump|lowp|main|true|false)$/;

function extractGlsl(src) {
  const out = [];
  const re = /\/\*\s*glsl\s*\*\/\s*`([\s\S]*?)`/g;
  let m; while ((m = re.exec(src))) out.push(m[1]);
  return out;
}

function check(file) {
  const src = fs.readFileSync(file, 'utf8');
  const glsls = extractGlsl(src);
  if (!glsls.length) return null;
  let code = glsls.join('\n');
  // ① 剥离 JS 模板插值 ${...}（JS 变量，非 GLSL 标识符）——否则 ${radius} 会误报
  code = code.replace(/\$\{[^}]*\}/g, ' ');
  // ② 剥离注释
  code = code.replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

  const declared = new Set(BUILTIN);
  const declRes = [
    /\b(?:uniform|varying|attribute|const)\s+(?:float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4)\s+(\w+)/g,
    /\b(?:float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4)\s+(\w+)\s*[=;)]/g,
    /\b(?:float|int|bool|vec2|vec3|vec4|mat2|mat3|mat4)\s+(\w+)\s*\(/g, // 函数定义
    /\bfor\s*\(\s*int\s+(\w+)/g,
    /__([A-Z0-9_]+)__/g,                                               // 注入占位
  ];
  for (const rx of declRes) for (const mm of code.matchAll(rx)) declared.add(mm[1]);

  // 可疑：小写开头自定义名（u/v/a 前缀最可疑）但从未声明
  const bad = new Set();
  for (const mm of code.matchAll(/\b([a-zA-Z_]\w*)\b/g)) {
    const name = mm[1];
    if (declared.has(name) || GLSL_FN.test(name)) continue;
    if (/^_/.test(name)) continue;
    if (/^[A-Z0-9_]+$/.test(name)) continue;            // 全大写常量/宏
    if (/^gl_/.test(name)) continue;
    if (!/^[uvagr][a-z0-9_]+$/.test(name)) continue;     // 只盯 uv-a-g-r 前缀名（自定义 uniform/varying 等）
    // 该名字若在任何声明式正则里根本没出现过 → 未声明
    const appearsDecl = new RegExp('\\b(?:uniform|varying|attribute|const|float|int|bool|vec2|vec3|vec4|for\\s*\\(\\s*int)\\b[^;{}()\\n]*\\b' + name + '\\b').test(code)
      || new RegExp('\\b' + name + '\\s*[=;]').test(code)
      || new RegExp('\\(\\s*\\w+\\s+' + name + '\\b').test(code)   // 函数参数
      || new RegExp('\\b' + name + '\\s*,').test(code);            // 函数参数列表
    if (!appearsDecl) bad.add(name);
  }
  return bad.size ? [...bad] : null;
}

let problems = 0;
for (const file of walk('src')) {
  const rep = check(file);
  if (rep) { problems++; console.log('  x ' + file + ' 疑似未声明标识符: ' + rep.join(', ')); }
}
console.log(problems === 0 ? 'PASS 静态 shader 检查通过（未发现未声明标识符）' : 'FAIL ' + problems + ' 文件可疑');
process.exit(problems ? 1 : 0);
