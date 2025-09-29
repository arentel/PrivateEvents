import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { auth } from './stores/auth'
import { IonicVue } from '@ionic/vue'

/* Core CSS required for Ionic components */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import './theme/variables.css'

/* PWA Elements for Camera */
import { defineCustomElements } from '@ionic/pwa-elements/loader'

defineCustomElements(window)

// ========================================
// VERIFICACIÓN DE CONFIGURACIÓN MEJORADA
// ========================================
const checkConfiguration = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  const optionalEnvVars = [
    'VITE_EMAILJS_SERVICE_ID',
    'VITE_EMAILJS_TEMPLATE_ID',
    'VITE_EMAILJS_PUBLIC_KEY'
  ]
  
  const missing = requiredEnvVars.filter(varName => !import.meta.env[varName])
  const missingOptional = optionalEnvVars.filter(varName => !import.meta.env[varName])
  
  console.log('🔧 Configuración de la app:')
  console.log('━'.repeat(50))
  
  // Variables requeridas
  requiredEnvVars.forEach(varName => {
    const status = import.meta.env[varName] ? '✅' : '❌'
    console.log(`${status} ${varName}: ${import.meta.env[varName] ? 'Configurada' : 'FALTANTE'}`)
  })
  
  // Variables opcionales
  if (missingOptional.length > 0) {
    console.log('\n📋 Variables opcionales:')
    optionalEnvVars.forEach(varName => {
      const status = import.meta.env[varName] ? '✅' : '⚠️'
      console.log(`${status} ${varName}: ${import.meta.env[varName] ? 'Configurada' : 'No configurada'}`)
    })
  }
  
  console.log('━'.repeat(50))
  
  if (missing.length > 0) {
    console.error('❌ Variables de entorno REQUERIDAS faltantes:', missing)
    console.error('⚠️ La aplicación NO funcionará correctamente')
    console.error('💡 Revisa el archivo .env.example para más información')
    
    // En producción, mostrar error crítico
    if (import.meta.env.PROD) {
      throw new Error('Configuración incompleta. Contacta al administrador.')
    }
    return false
  }
  
  console.log('✅ Configuración completa')
  return true
}

// ========================================
// CONFIGURACIÓN GLOBAL DE LA APP
// ========================================
const configureApp = (app: any) => {
  // Información de la aplicación
  app.config.globalProperties.$appInfo = {
    name: import.meta.env.VITE_APP_NAME || 'Sistema QR Discoteca',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    author: 'Adri',
    description: 'Sistema de gestión de invitados con códigos QR',
    environment: import.meta.env.MODE
  }
  
  // Manejador global de errores mejorado
  app.config.errorHandler = (error: any, instance: any, info: string) => {
    console.error('━'.repeat(50))
    console.error('❌ ERROR GLOBAL CAPTURADO')
    console.error('━'.repeat(50))
    console.error('📍 Ubicación:', info)
    console.error('🔴 Error:', error)
    console.error('🧩 Componente:', instance?.$options?.name || 'Desconocido')
    console.error('━'.repeat(50))
    
    // Clasificar tipo de error
    let errorType = 'unknown'
    let userMessage = 'Ha ocurrido un error inesperado'
    
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorType = 'network'
      userMessage = 'Error de conexión. Verifica tu internet.'
    } else if (error.message?.includes('supabase') || error.message?.includes('database')) {
      errorType = 'database'
      userMessage = 'Error de base de datos. Intenta de nuevo.'
    } else if (error.message?.includes('auth')) {
      errorType = 'auth'
      userMessage = 'Error de autenticación. Inicia sesión nuevamente.'
    }
    
    // Log estructurado para debugging
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      component: instance?.$options?.name,
      info,
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    // En desarrollo, mostrar todos los detalles
    if (import.meta.env.DEV) {
      console.table(errorLog)
    }
    
    // En producción, enviar a servicio de monitoreo
    if (import.meta.env.PROD) {
      // Aquí integrarías Sentry, LogRocket, etc.
      // Ejemplo: Sentry.captureException(error, { contexts: { vue: errorLog } })
      
      // Por ahora, guardar en localStorage para análisis posterior
      try {
        const errors = JSON.parse(localStorage.getItem('app_errors') || '[]')
        errors.push(errorLog)
        // Mantener solo los últimos 20 errores
        localStorage.setItem('app_errors', JSON.stringify(errors.slice(-20)))
      } catch (storageError) {
        console.warn('No se pudo guardar el error en localStorage')
      }
    }
    
    // Mostrar notificación al usuario (sin bloquear la app)
    if (typeof window !== 'undefined') {
      // Importar dinámicamente para evitar dependencias circulares
      import('@ionic/vue').then(({ toastController }) => {
        toastController.create({
          message: userMessage,
          duration: 3000,
          color: 'danger',
          position: 'top',
          buttons: [{ text: 'OK', role: 'cancel' }]
        }).then(toast => toast.present())
      }).catch(() => {
        // Fallback a alert nativo
        alert(userMessage)
      })
    }
  }
  
  // Manejador de warnings
  app.config.warnHandler = (msg: string, instance: any, trace: string) => {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Vue Warning:', msg)
      console.warn('📍 Trace:', trace)
    }
  }
  
  // Performance monitoring en desarrollo
  if (import.meta.env.DEV) {
    app.config.performance = true
  }
}

// ========================================
// INICIALIZACIÓN DE LA APP
// ========================================
const initApp = async () => {
  console.log('🚀 Iniciando Sistema QR Eventos...')
  console.log(`📦 Entorno: ${import.meta.env.MODE}`)
  console.log(`🔢 Versión: ${import.meta.env.VITE_APP_VERSION || '1.0.0'}`)
  
  // Verificar configuración
  const configValid = checkConfiguration()
  
  if (!configValid && import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f5f5f5; padding: 20px;">
        <div style="text-align: center; max-width: 400px; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h1 style="color: #d32f2f; margin-bottom: 16px;">⚠️ Error de Configuración</h1>
          <p style="color: #666; margin-bottom: 24px;">La aplicación no está configurada correctamente. Por favor contacta al administrador del sistema.</p>
          <button onclick="location.reload()" style="background: #1976d2; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">Reintentar</button>
        </div>
      </div>
    `
    return
  }
  
  // Inicializar autenticación
  console.log('🔐 Inicializando autenticación...')
  auth.init()
  
  // Crear aplicación Vue
  const app = createApp(App)
    .use(IonicVue, {
      mode: 'ios', // Modo consistente
      swipeBackEnabled: true
    })
    .use(router)

  // Configurar aplicación
  configureApp(app)

  // Esperar a que el router esté listo
  await router.isReady()
  
  // Montar la aplicación
  app.mount('#app')
  
  console.log('✅ Aplicación iniciada correctamente')
  console.log('🔒 Autenticación:', auth.isAuthenticated ? 'Autenticado' : 'No autenticado')
  
  // Limpiar console en producción
  if (import.meta.env.PROD) {
    console.log = () => {}
    console.debug = () => {}
    console.info = () => {}
  }
}

// ========================================
// MANEJADORES DE EVENTOS GLOBALES
// ========================================

// Detectar si está offline
window.addEventListener('offline', () => {
  console.warn('📡 Conexión perdida')
  import('@ionic/vue').then(({ toastController }) => {
    toastController.create({
      message: '📡 Sin conexión a internet',
      duration: 3000,
      color: 'warning',
      position: 'top'
    }).then(toast => toast.present())
  })
})

window.addEventListener('online', () => {
  console.log('📡 Conexión restaurada')
  import('@ionic/vue').then(({ toastController }) => {
    toastController.create({
      message: '✅ Conexión restaurada',
      duration: 2000,
      color: 'success',
      position: 'top'
    }).then(toast => toast.present())
  })
})

// Manejar errores no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise rejection no manejada:', event.reason)
  event.preventDefault()
})

// ========================================
// INICIAR APLICACIÓN
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}