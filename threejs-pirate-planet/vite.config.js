import { defineConfig } from 'vite';

export default defineConfig({
  // 仓库根 GitHub Pages 发布：产物提交在仓库 threejs-pirate-planet/dist/ 子路径
  base: '/AI_GTA/threejs-pirate-planet/dist/',
  server: {
    host: '127.0.0.1',
    port: 5317,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
