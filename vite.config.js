import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// everything inlined into one HTML file: browsers block module scripts on file://,
// so a plain build shows a blank page when dist/index.html is double-clicked
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
})
