import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
        '/register': 'http://localhost:3000',
        '/login':'http://localhost:3000',
    },
},
})
