import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/BIOSALUDSYSTEM/', // 🔥 esta línea es la clave para GitHub Pages
  plugins: [react()],
})
