import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer para desarrollo
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks optimizados
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') && !id.includes('react-router')) {
              return 'react-core'
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router'
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase'
            }
            // Google Maps (carga pesada)
            if (id.includes('@googlemaps') || id.includes('react-google-maps')) {
              return 'maps'
            }
            // UI Libraries
            if (id.includes('react-toastify') || id.includes('sweetalert2')) {
              return 'ui-libs'
            }
            // Form libraries
            if (id.includes('react-hook-form')) {
              return 'forms'
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils'
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            // Resto de vendor
            return 'vendor'
          }
          
          // Chunks de la aplicación
          if (id.includes('src/components/Map')) {
            return 'map-components'
          }
          if (id.includes('src/components/Payments')) {
            return 'payment-components'
          }
          if (id.includes('src/components/Rating')) {
            return 'rating-components'
          }
          if (id.includes('src/components/WorkerSearch')) {
            return 'worker-search-components'
          }
          if (id.includes('src/components/Chat')) {
            return 'chat-components'
          }
          if (id.includes('src/components/Notifications')) {
            return 'notification-components'
          }
          if (id.includes('src/hooks')) {
            return 'hooks'
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Reducido para detectar chunks grandes
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true,
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    hmr: {
      port: 3001,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
  },
  // Optimizaciones adicionales
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'react-hook-form',
      'date-fns',
      'lucide-react'
    ],
    exclude: [
      '@googlemaps/js-api-loader',
      'react-google-maps-api'
    ]
  },
})
