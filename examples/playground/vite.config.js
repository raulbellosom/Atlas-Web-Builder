import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      // Point directly to library source so changes hot-reload instantly
      // without needing to rebuild the dist/ folder.
      '@racoondevs/atlas-web-builder': resolve(__dirname, '../../src/index.js'),
    },
  },
})
