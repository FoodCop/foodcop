import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external access
    strictPort: true, // Exit if port 3000 is already in use
  },
  preview: {
    port: 3000,
    host: true,
  }
})
