import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Lyrics/',  // 👈 this line fixes 404s on GitHub Pages
})
