import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // GitHub Pages のプロジェクトページでもアセットが解決できるよう相対パスにする
  base: './',
})
