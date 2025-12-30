import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-element': ['element-plus', '@element-plus/icons-vue'],
          'vendor-codemirror': ['codemirror', '@codemirror/state', '@codemirror/view', '@codemirror/lang-json', '@codemirror/theme-one-dark', '@codemirror/commands'],
        }
      }
    }
  }
})
