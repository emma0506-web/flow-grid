import { defineConfig } from 'vite'

// demo 构建产物输出到 demo-dist，避免与库的 dist 冲突
export default defineConfig({
  root: '.',
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true
  }
})
