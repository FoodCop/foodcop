import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@utils': path.resolve(__dirname, './utils'),
      '@contexts': path.resolve(__dirname, './contexts'),
      '@styles': path.resolve(__dirname, './styles')
    }
  },
  server: {
    port: 5173,
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        socket: path.resolve(__dirname, 'src/socket.ts')
      },
      output: {
        // Ensure predictable filename for socket bridge (no hash) so external tooling
        // looking specifically for dist/socket.js can locate it.
        entryFileNames: (chunk) => {
          if (chunk.name === 'socket') return 'socket.js'
            return 'assets/[name]-[hash].js'
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['motion', 'lucide-react'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion', 'lucide-react']
  }
})