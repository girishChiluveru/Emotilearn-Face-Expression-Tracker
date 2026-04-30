import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        // Removed proxies for /login, /register, etc. 
        // as they conflict with React Router's frontend routes.
        // We now use absolute URLs or a specific API prefix.
    },
})