import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform: () => boolean
    }
  }
}

export const useHaptics = () => {
  /**
   * Verificar si los hápticos están disponibles
   */
  const isAvailable = async (): Promise<boolean> => {
    try {
      // Los hápticos solo funcionan en dispositivos nativos
      if (!window.Capacitor?.isNativePlatform()) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Vibración para acciones exitosas
   */
  const success = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.notification({ type: NotificationType.Success })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Vibración para advertencias
   */
  const warning = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.notification({ type: NotificationType.Warning })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Vibración para errores
   */
  const error = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.notification({ type: NotificationType.Error })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Impacto ligero - para interacciones sutiles
   */
  const light = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.impact({ style: ImpactStyle.Light })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Impacto medio - para acciones importantes
   */
  const medium = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.impact({ style: ImpactStyle.Medium })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Impacto fuerte - para acciones críticas
   */
  const heavy = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.impact({ style: ImpactStyle.Heavy })
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Selección - para items en listas
   */
  const selection = async () => {
    try {
      if (await isAvailable()) {
        await Haptics.selectionStart()
        setTimeout(async () => {
          await Haptics.selectionEnd()
        }, 50)
      }
    } catch (error) {
      console.debug('Haptics not available:', error)
    }
  }

  /**
   * Vibrar según tipo de acción
   */
  const vibrate = async (type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
    const hapticMap = {
      success,
      warning,
      error,
      light,
      medium,
      heavy,
      selection
    }

    await hapticMap[type]()
  }

  return {
    success,
    warning,
    error,
    light,
    medium,
    heavy,
    selection,
    vibrate,
    isAvailable
  }
}