import { ref, watch, type Ref } from 'vue'

/**
 * Debounce para funciones
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

/**
 * Debounce para valores reactivos
 */
export const useDebouncedRef = <T>(value: T, delay = 300): Ref<T> => {
  const debouncedValue = ref(value) as Ref<T>
  let timeoutId: NodeJS.Timeout | null = null

  const updateValue = (newValue: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  }

  return debouncedValue
}

/**
 * Watch con debounce automático
 */
export const useDebouncedWatch = <T>(
  source: Ref<T>,
  callback: (value: T) => void,
  delay = 300
) => {
  let timeoutId: NodeJS.Timeout | null = null

  watch(source, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      callback(newValue)
    }, delay)
  })
}

/**
 * Throttle - ejecutar máximo una vez cada X tiempo
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  fn: T,
  limit = 300
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}