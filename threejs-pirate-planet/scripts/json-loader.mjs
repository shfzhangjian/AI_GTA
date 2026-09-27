// json-loader.mjs — Node ESM loader：让源码里的 `import x from './y.json'` 在纯 Node 下可加载
// （Vite 原生支持 JSON import；Node 需要 import attribute，这里由 loader 注入。）
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    // shortCircuit 直接给出 json，不走默认 validateAttributes
    return { format: 'json', source: fs.readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
  }
  return next(url, context);
}
