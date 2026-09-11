import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-is', 'zustand', 'axios', 'lucide-react', 'react-hot-toast']
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom') || id.includes('zustand')) {
              return 'vendor-core';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'vendor-icons';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('@react-google-maps')) {
              return 'vendor-maps';
            }
            if (id.includes('react-quill-new')) {
              return 'vendor-quill';
            }
            if (id.includes('axios') || id.includes('react-hot-toast') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('react-is')) {
              return 'vendor-utils';
            }
          }
        }
      }
    }
  }
})
