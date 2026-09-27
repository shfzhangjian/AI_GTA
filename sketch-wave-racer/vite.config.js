import { defineConfig } from "vite";

export default defineConfig({
  // 仓库根 GitHub Pages 发布：产物部署在 /AI_GTA/sketch-wave-racer/ 子路径
  base: "/AI_GTA/sketch-wave-racer/",
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
