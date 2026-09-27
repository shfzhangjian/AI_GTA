/**
 * serve.mjs — 零依赖静态文件服务器
 *   node scripts/serve.mjs [port] [dir]   默认 5320 / 项目根
 * 供无浏览器环境下的「静态自检」拉取源码（确认磁盘内容正确），非游戏运行时。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.argv[2] || 5320);
const ROOT = path.resolve(process.argv[3] || '.');
const MIME = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
};

http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  // 模拟 vite 静态资源解析：/assets/* → public/*（public 下的文件在 vite 里以去掉 public/ 的路径访问）
  let rel = url === '/' ? 'index.html' : url;
  const candidates = [];
  if (rel.startsWith('/assets/')) {
    candidates.push(path.join(ROOT, 'public', rel));   // public/assets/...
    candidates.push(path.join(ROOT, rel));
  }
  // node_modules 映射（供重写后的 three import 命中）
  if (rel.startsWith('/node_modules/')) {
    candidates.push(path.join(ROOT, rel));
  }
  candidates.push(path.join(ROOT, rel));
  const file = candidates.find((c) => fs.existsSync(c)) || path.join(ROOT, rel);
  // 防目录穿越
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
      const ext = path.extname(file);
    if (ext === '.js' || ext === '.mjs') {
      // 重写源码里的裸模块说明符，让零依赖静态服务器能直接跑 Vite/ESM 源码
      let code = buf.toString('utf8');
      code = code
        .replace(/from\s+(['"])three\1/g, "from '/node_modules/three/build/three.module.js'")
        .replace(/from\s+(['"])three\/addons\/([^'"]+)\1/g, "from '/node_modules/three/examples/jsm/$2'");
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' });
      res.end(code);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`[serve] http://127.0.0.1:${PORT}/  root=${ROOT}`));
