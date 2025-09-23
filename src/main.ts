import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth } from './stores/auth'

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
  console.log('- EmailJS Service:', import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✅ Configurada' : '⚠️ Opcional')
}

// Configuración global de la app
const configureApp = (app: any) => {
  // Configuraciones globales
  app.config.globalProperties.$appInfo = {
    name: 'Sistema QR Discoteca',
    version: '1.0.0',
    author: 'Adri',
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
}

// Inicializar aplicación
const initApp = async () => {
  console.log('🚀 Iniciando Sistema QR Eventos...')
  
  // Verificar configuración
  checkConfiguration()
  
  // Inicializar store de autenticación
  console.log('🔐 Inicializando autenticación...')
  auth.init()
  
  // Crear app Vue
  const app = createApp(App)
    .use(IonicVue, {
      mode: 'ios' // Modo consistente iOS
    })
    .use(router)

  // Configurar app
  configureApp(app)

  // Esperar a que el router esté listo
  await router.isReady()
  
  // Montar la aplicación
  app.mount('#app')
  
  console.log('✅ Aplicación iniciada correctamente')
  console.log('🔑 Estado de autenticación:', auth.isAuthenticated ? 'Autenticado' : 'No autenticado')
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}