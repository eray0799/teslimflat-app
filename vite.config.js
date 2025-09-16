import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages proje URL’i: https://eray0799.github.io/teslimflat-app/
  base: '/teslimflat-app/',
})
