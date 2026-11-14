import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  resolve: {
    alias: {
      // Point directly to library source so changes hot-reload instantly
      // without needing to rebuild the dist/ folder.
      '@raulbellosom/atlas-web-builder/styles': resolve(__dirname, '../../src/styles/editor.css'),
      '@raulbellosom/atlas-web-builder': resolve(__dirname, '../../src/index.js'),
      // Compatibility for older examples; the workspace dependency uses the canonical name.
      '@racoondevs/atlas-web-builder': resolve(__dirname, '../../src/index.js'),
    },
  },
})
