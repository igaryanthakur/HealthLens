import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Rolldown (Vite 8) may emit CJS on Linux/Vercel; browser needs ESM (type="module").
    rolldownOptions: {
      output: {
        format: 'es',
      },
    },
  },
  server: {
    // Listen on IPv4 + IPv6 so http://127.0.0.1:5173 works on Windows (not only ::1).
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
