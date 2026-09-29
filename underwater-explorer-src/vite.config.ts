import { defineConfig } from 'vite';

// 重要约定（见 docs/PLAN.md「环境说明」）：
// three.js 必须通过 CDN（index.html 的 importmap）加载，永远不要打包进产物。
// npm 里的 three / @types/three 仅用于类型检查。
export default defineConfig({
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      // three 走 CDN importmap：external 后产物保留 bare specifier "three"，
      // 由浏览器 importmap 解析到 CDN。产物中绝不包含 three 的代码。
      external: ['three'],
    },
  },
  resolve: {
    // dev 模式：bare import 'three' 直接解析到 CDN URL（与 build 行为一致），
    // 确保任何模式下 three 都不从 node_modules 加载、不被打包。
    alias: {
      three: 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js',
    },
  },
});
