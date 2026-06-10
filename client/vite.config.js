import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel transpiles .js in static output to CommonJS when api/ functions exist.
    // .mjs is served as-is so <script type="module"> works in the browser.
    rolldownOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].mjs',
        chunkFileNames: 'assets/[name]-[hash].mjs',
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
