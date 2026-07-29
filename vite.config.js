import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the built index.html works when opened directly from the filesystem
export default defineConfig({
  base: './',
  plugins: [react()],
})
