import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/search':  'http://localhost:8000',
      '/health':  'http://localhost:8000',
      '/auth':    'http://localhost:8000',
      '/admin':   'http://localhost:8000',
      '/reports': 'http://localhost:8000',
      '/profile': 'http://localhost:8000',
      '/wishlist': 'http://localhost:8000',
    },
  },
})
