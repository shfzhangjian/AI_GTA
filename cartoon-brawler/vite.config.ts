import { defineConfig } from 'vite';

export default defineConfig({
  // 相对 base：dist/ 自包含，GitHub Pages 子目录（/AI_GTA/cartoon-brawler/dist/）直接可用
  base: './',
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,

  },
  worker: {
    format: 'es',
  },
});
