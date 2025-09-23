import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import { IonicVue } from '@ionic/vue'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './theme/variables.css'

/* PWA Elements for Camera */
import { defineCustomElements } from '@ionic/pwa-elements/loader'

// Configurar PWA Elements
defineCustomElements(window)

// Verificar configuración al iniciar
const checkConfiguration = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName])
  
  if (missing.length > 0) {
    console.warn('⚠️ Variables de entorno faltantes:', missing)
    console.warn('La aplicación funcionará en modo desarrollo limitado')
  } else {
    console.log('✅ Configuración completa')
  }
  
  // Información de configuración
  console.log('🔧 Configuración de la app:')
  console.log('- Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante')
  console.log('- Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Faltante')
  console.log('- Resend API:', import.meta.env.VITE_RESEND_API_KEY ? '✅ Configurada' : '⚠️ Opcional')
}

// Configuración global de la app
const configureApp = (app: any) => {
  // Configuraciones globales
  app.config.globalProperties.$appInfo = {
    name: 'Sistema QR Discoteca',
    version: '1.0.0',
    author: 'Tu Nombre',
    description: 'Sistema de gestión de invitados con códigos QR'
  }
  
  // Manejo global de errores
  app.config.errorHandler = (error: any, instance: any, info: string) => {
    console.error('Error global capturado:', error)
    console.error('Información del error:', info)
    
    // En producción, enviar errores a un servicio de monitoreo
    if (import.meta.env.PROD) {
      // Aquí podrías enviar el error a Sentry, LogRocket, etc.
    }
  }
  
  return app
}

// Crear y configurar la aplicación
const app = createApp(App)
  .use(IonicVue, {
    rippleEffect: true,
    mode: 'ios' // o 'md' para Material Design
  })
  .use(router)

// Configurar la app
configureApp(app)

// Verificar configuración
checkConfiguration()

// Esperar a que el router esté listo antes de montar
router.isReady().then(() => {
  app.mount('#app')
  console.log('🚀 Aplicación iniciada correctamente')
})

// Service Worker para PWA (opcional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registrado: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registro falló: ', registrationError)
      })
  })
}