import { ref, computed } from 'vue'
import { toastController } from '@ionic/vue'

// Estado global de loading
const globalLoadingStates = ref(new Map())
const globalErrors = ref(new Map())

export function useLoading(namespace = 'default') {
  // Estados específicos del namespace
  const isLoading = computed(() => 
    globalLoadingStates.value.get(namespace) || false
  )
  
  const error = computed(() => 
    globalErrors.value.get(namespace) || null
  )

  // Función para establecer estado de loading
  const setLoading = (loading, key = 'main') => {
    const fullKey = `${namespace}_${key}`
    const newMap = new Map(globalLoadingStates.value)
    newMap.set(fullKey, loading)
    globalLoadingStates.value = newMap
  }

  // Función para establecer error
  const setError = (errorMsg, key = 'main') => {
    const fullKey = `${namespace}_${key}`
    const newMap = new Map(globalErrors.value)
    newMap.set(fullKey, errorMsg)
    globalErrors.value = newMap
  }

  // Limpiar error
  const clearError = (key = 'main') => {
    const fullKey = `${namespace}_${key}`
    const newMap = new Map(globalErrors.value)
    newMap.delete(fullKey)
    globalErrors.value = newMap
  }

  // Función para envolver operaciones asíncronas
  const withLoading = async (operation, options = {}) => {
    const {
      key = 'main',
      showSuccessToast = false,
      successMessage = 'Operación completada',
      showErrorToast = true,
      retries = 1,
      retryDelay = 1000
    } = options

    setLoading(true, key)
    clearError(key)

    let lastError = null
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await operation()
        
        setLoading(false, key)
        
        if (showSuccessToast) {
          const toast = await toastController.create({
            message: successMessage,
            duration: 2000,
            color: 'success',
            position: 'top'
          })
          await toast.present()
        }
        
        return result
        
      } catch (error) {
        lastError = error
        console.error(`Intento ${attempt + 1} falló:`, error)
        
        // Si no es el último intento y el error es recuperable
        if (attempt < retries - 1 && isRetryableError(error)) {
          console.log(`Reintentando en ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          continue
        }
        
        // Si llegamos aquí, todos los intentos fallaron
        break
      }
    }

    // Manejar error final
    setLoading(false, key)
    
    const errorMessage = getErrorMessage(lastError)
    setError(errorMessage, key)
    
    if (showErrorToast) {
      const toast = await toastController.create({
        message: errorMessage,
        duration: 4000,
        color: 'danger',
        position: 'top',
        buttons: [
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      })
      await toast.present()
    }
    
    throw lastError
  }

  // Función para múltiples operaciones en paralelo
  const withLoadingParallel = async (operations, options = {}) => {
    const {
      key = 'main',
      showProgressToast = true,
      successMessage = 'Todas las operaciones completadas'
    } = options

    setLoading(true, key)
    clearError(key)

    try {
      let completedCount = 0
      const total = operations.length
      let progressToast = null

      if (showProgressToast) {
        progressToast = await toastController.create({
          message: `Procesando 0/${total}...`,
          duration: 0,
          color: 'primary',
          position: 'top'
        })
        await progressToast.present()
      }

      const results = await Promise.allSettled(
        operations.map(async (operation, index) => {
          try {
            const result = await operation()
            completedCount++
            
            if (progressToast) {
              progressToast.message = `Procesando ${completedCount}/${total}...`
            }
            
            return result
          } catch (error) {
            completedCount++
            
            if (progressToast) {
              progressToast.message = `Procesando ${completedCount}/${total}... (${index + 1} falló)`
            }
            
            throw error
          }
        })
      )

      if (progressToast) {
        await progressToast.dismiss()
      }

      setLoading(false, key)

      // Analizar resultados
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')

      if (failed.length > 0) {
        const errorMessage = `${failed.length} de ${total} operaciones fallaron`
        setError(errorMessage, key)
        
        const toast = await toastController.create({
          message: `${successful.length}/${total} completadas correctamente`,
          duration: 3000,
          color: 'warning',
          position: 'top'
        })
        await toast.present()
      } else {
        const toast = await toastController.create({
          message: successMessage,
          duration: 2000,
          color: 'success',
          position: 'top'
        })
        await toast.present()
      }

      return {
        successful: successful.map(r => r.value),
        failed: failed.map(r => r.reason),
        total,
        successCount: successful.length,
        failureCount: failed.length
      }

    } catch (error) {
      setLoading(false, key)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage, key)
      throw error
    }
  }

  // Función para operaciones con timeout
  const withTimeout = async (operation, timeout = 10000) => {
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operación timeout')), timeout)
      )
    ])
  }

  // Función para verificar si un error es recuperable
  const isRetryableError = (error) => {
    const retryablePatterns = [
      'fetch',
      'network',
      'timeout',
      'PGRST301',
      'connection'
    ]
    
    const errorString = error.message?.toLowerCase() || ''
    return retryablePatterns.some(pattern => 
      errorString.includes(pattern) || error.code === pattern
    )
  }

  // Función para obtener mensaje de error amigable
  const getErrorMessage = (error) => {
    if (!error) return 'Error desconocido'
    
    // Errores específicos de Supabase
    const supabaseErrors = {
      '23505': 'Este elemento ya existe',
      'PGRST116': 'No se encontraron datos',
      '42P01': 'Error de configuración de la base de datos',
      '28P01': 'Error de autenticación',
      'PGRST301': 'Error de conexión con el servidor'
    }
    
    if (error.code && supabaseErrors[error.code]) {
      return supabaseErrors[error.code]
    }
    
    // Errores de red
    if (error.message?.includes('fetch') || 
        error.message?.includes('network')) {
      return 'Error de conexión. Verifica tu internet.'
    }
    
    if (error.message?.includes('timeout')) {
      return 'La operación tardó demasiado. Intenta de nuevo.'
    }
    
    return error.message || 'Error desconocido'
  }

  // Estados combinados para UI
  const loadingStates = computed(() => {
    const states = {}
    for (const [key, value] of globalLoadingStates.value.entries()) {
      if (key.startsWith(namespace)) {
        const shortKey = key.replace(`${namespace}_`, '')
        states[shortKey] = value
      }
    }
    return states
  })

  const errorStates = computed(() => {
    const states = {}
    for (const [key, value] of globalErrors.value.entries()) {
      if (key.startsWith(namespace)) {
        const shortKey = key.replace(`${namespace}_`, '')
        states[shortKey] = value
      }
    }
    return states
  })

  const hasAnyLoading = computed(() => 
    Object.values(loadingStates.value).some(Boolean)
  )

  const hasAnyError = computed(() => 
    Object.values(errorStates.value).some(Boolean)
  )

  return {
    // Estados
    isLoading,
    error,
    loadingStates,
    errorStates,
    hasAnyLoading,
    hasAnyError,
    
    // Métodos básicos
    setLoading,
    setError,
    clearError,
    
    // Métodos avanzados
    withLoading,
    withLoadingParallel,
    withTimeout,
    
    // Utilidades
    isRetryableError,
    getErrorMessage
  }
}

// Hook para loading global
export function useGlobalLoading() {
  const isGlobalLoading = computed(() => {
    for (const loading of globalLoadingStates.value.values()) {
      if (loading) return true
    }
    return false
  })

  const globalErrorCount = computed(() => 
    globalErrors.value.size
  )

  const clearAllErrors = () => {
    globalErrors.value = new Map()
  }

  const clearAllLoading = () => {
    globalLoadingStates.value = new Map()
  }

  return {
    isGlobalLoading,
    globalErrorCount,
    clearAllErrors,
    clearAllLoading
  }
}