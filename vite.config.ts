import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    // Aumentar límite para chunks específicos grandes pero necesarios
    chunkSizeWarningLimit: 800,
    
    rollupOptions: {
      output: {
        // Manual chunking optimizado basado en tus resultados
        manualChunks: {
          // Vue ecosystem - chunk fundamental
          'vendor-vue': ['vue', 'vue-router', '@ionic/vue'],
          
          // PDF libraries - solo cuando se necesite
          'vendor-pdf': ['jspdf', 'html2canvas'],
          
          // Scanner libraries - solo para escaneado
          'vendor-scanner': ['html5-qrcode'],
          
          // QR generation - más ligero
          'vendor-qr': ['qrcode', 'qrious'],
          
          // Database
          'vendor-db': ['@supabase/supabase-js'],
          
          // Crypto utilities
          'vendor-crypto': ['crypto-js'],
          
          // Ionic core separado del main ionic/vue
          'vendor-ionic-core': [
            '@ionic/core',
            'ionicons'
          ],
          
          // Utilities comunes
          'vendor-utils': [
            'lodash',
            'date-fns'
          ]
        },
        
        // Optimizar nombres y splits
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          
          if (facadeModuleId) {
            // Chunks por página/característica
            if (facadeModuleId.includes('DownloadTicket')) {
              return 'pages/download-[hash].js'
            }
            if (facadeModuleId.includes('ScanTab')) {
              return 'pages/scanner-[hash].js'
            }
            if (facadeModuleId.includes('EmployeeScanner')) {
              return 'pages/employee-scanner-[hash].js'
            }
            if (facadeModuleId.includes('ReportsTab')) {
              return 'pages/reports-[hash].js'
            }
            if (facadeModuleId.includes('SendTab')) {
              return 'pages/send-[hash].js'
            }
            if (facadeModuleId.includes('GuestsTab')) {
              return 'pages/guests-[hash].js'
            }
            if (facadeModuleId.includes('EventsTab')) {
              return 'pages/events-[hash].js'
            }
          }
          
          return 'chunks/[name]-[hash].js'
        },
        
        // Configuración adicional para optimizar splits
        experimentalMinChunkSize: 10000 // 10KB mínimo
      }
    },
    
    // Optimizaciones de minificación más agresivas
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn'],
        // Optimizaciones adicionales
        passes: 2,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    }
  },
  
  // Optimización más agresiva de dependencias
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      '@ionic/vue'
    ],
    exclude: [
      // Forzar lazy loading de librerías pesadas
      'jspdf',
      'html2canvas', 
      'html5-qrcode',
      'qrious',
      'crypto-js'
    ]
  },
  
  // Configuración de servidor para desarrollo
  server: {
    // Preload hints en desarrollo
    middlewareMode: false
  }
})