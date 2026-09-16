import { defineConfig } from 'vite'

// demo 构建产物输出到 demo-dist，避免与库的 dist 冲突
// base: './' 让资源用相对路径引用，兼容 GitHub Pages 子路径与 CloudBase 子路径部署
export default defineConfig({
  base: './',
  root: '.',
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true
  }
})
