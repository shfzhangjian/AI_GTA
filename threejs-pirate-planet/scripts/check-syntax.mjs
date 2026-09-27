// check-syntax.mjs — 语法门禁：src 下每个 .js 逐个 node --check
import { spawnSync } from 'node:child_process';
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

const files = walk('src').sort();
let fail = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    fail++;
    console.log('  x ' + f + '\n' + (r.stderr || '').split('\n').slice(0, 4).join('\n'));
  }
}
console.log(fail === 0 ? 'PASS 语法全通过 (' + files.length + ' 文件)' : 'FAIL ' + fail + '/' + files.length + ' 语法失败');
process.exit(fail ? 1 : 0);
