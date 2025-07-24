import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ❌ Elimina la importación de vite-plugin-gh-pages

export default defineConfig({
  base: '/BIOSALUDSYSTEM/', // ✅ Asegura la ruta correcta para GitHub Pages
  plugins: [react()],
})
