import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 3000,
    },
    build: {
        rollupOptions: {
            output: {
                assetFileNames: 'assets/[name].[ext]',
                entryFileNames: 'assets/[name].js'
            }
        }
    }
})
