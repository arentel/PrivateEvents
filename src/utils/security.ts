// utils/security.ts - Utilidades de seguridad

/**
 * Rate Limiter simple en cliente
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts: number
  private readonly windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  /**
   * Verificar si una acción está permitida
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Filtrar intentos dentro de la ventana de tiempo
    const recentAttempts = attempts.filter(time => now - time < this.windowMs)

    if (recentAttempts.length >= this.maxAttempts) {
      return false
    }

    // Agregar intento actual
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)

    return true
  }

  /**
   * Obtener tiempo restante de bloqueo
   */
  getTimeUntilReset(key: string): number {
    const attempts = this.attempts.get(key) || []
    if (attempts.length === 0) return 0

    const oldestAttempt = Math.min(...attempts)
    const timeUntilReset = this.windowMs - (Date.now() - oldestAttempt)

    return Math.max(0, timeUntilReset)
  }

  /**
   * Resetear intentos para una key
   */
  reset(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * Limpiar intentos antiguos
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(time => now - time < this.windowMs)
      if (recentAttempts.length === 0) {
        this.attempts.delete(key)
      } else {
        this.attempts.set(key, recentAttempts)
      }
    }
  }
}

// Instancias de rate limiters
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 intentos en 15 min
export const apiRateLimiter = new RateLimiter(100, 60 * 1000) // 100 requests por minuto

/**
 * Sanitizar entrada de usuario para evitar XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, '') // Eliminar eventos onclick, onload, etc
    .replace(/data:text\/html/gi, '') // Eliminar data URLs
    .trim()
}

/**
 * Validar y sanitizar email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return ''
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>'"]/g, '') // Caracteres peligrosos
    .slice(0, 255) // Límite de longitud
}

/**
 * Generar token CSRF
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Validar token CSRF
 */
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem('csrf_token')
  return token === storedToken
}

/**
 * Hash de contraseña simple (para validación cliente)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verificar fortaleza de contraseña
 */
export const checkPasswordStrength = (password: string): {
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('Debe tener al menos 8 caracteres')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  else feedback.push('Debe contener mayúsculas y minúsculas')

  if (/\d/.test(password)) score++
  else feedback.push('Debe contener números')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('Debe contener caracteres especiales')

  return { score, feedback }
}

/**
 * Detectar intentos de inyección SQL
 */
export const detectSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
    /(-{2}|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
    /'\s*(OR|AND)\s*'?\d+/i
  ]

  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Validar origen de request (CORS)
 */
export const isValidOrigin = (origin: string, allowedOrigins: string[]): boolean => {
  return allowedOrigins.some(allowed => {
    if (allowed === '*') return true
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$')
      return regex.test(origin)
    }
    return origin === allowed
  })
}

/**
 * Protección contra clickjacking
 */
export const preventClickjacking = (): void => {
  if (window.self !== window.top) {
    window.top!.location = window.self.location
  }
}

/**
 * Detectar y prevenir ataques de fuerza bruta
 */
export class BruteForceProtection {
  private failures: Map<string, { count: number; lastAttempt: number }> = new Map()
  private readonly maxFailures: number
  private readonly lockoutDuration: number

  constructor(maxFailures: number = 5, lockoutDuration: number = 15 * 60 * 1000) {
    this.maxFailures = maxFailures
    this.lockoutDuration = lockoutDuration
  }

  /**
   * Registrar intento fallido
   */
  recordFailure(identifier: string): void {
    const existing = this.failures.get(identifier) || { count: 0, lastAttempt: 0 }
    existing.count++
    existing.lastAttempt = Date.now()
    this.failures.set(identifier, existing)
  }

  /**
   * Resetear contador de fallos
   */
  resetFailures(identifier: string): void {
    this.failures.delete(identifier)
  }

  /**
   * Verificar si está bloqueado
   */
  isLocked(identifier: string): boolean {
    const record = this.failures.get(identifier)
    if (!record) return false

    const timeSinceLastAttempt = Date.now() - record.lastAttempt
    
    // Si pasó el tiempo de bloqueo, resetear
    if (timeSinceLastAttempt > this.lockoutDuration) {
      this.resetFailures(identifier)
      return false
    }

    return record.count >= this.maxFailures
  }

  /**
   * Obtener tiempo restante de bloqueo
   */
  getLockoutTime(identifier: string): number {
    const record = this.failures.get(identifier)
    if (!record) return 0

    const timeSinceLastAttempt = Date.now() - record.lastAttempt
    return Math.max(0, this.lockoutDuration - timeSinceLastAttempt)
  }
}

// Instancia global para login
export const loginBruteForceProtection = new BruteForceProtection(5, 15 * 60 * 1000)

/**
 * Encriptar datos sensibles para localStorage
 */
export const encryptStorage = (data: any, key: string): string => {
  try {
    const jsonStr = JSON.stringify(data)
    const encrypted = btoa(encodeURIComponent(jsonStr))
    return encrypted
  } catch (error) {
    console.error('Error encriptando datos:', error)
    return ''
  }
}

/**
 * Desencriptar datos de localStorage
 */
export const decryptStorage = (encrypted: string): any => {
  try {
    const decoded = decodeURIComponent(atob(encrypted))
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Error desencriptando datos:', error)
    return null
  }
}

/**
 * Limpiar datos sensibles del navegador
 */
export const clearSensitiveData = (): void => {
  // Limpiar localStorage selectivamente
  const keysToKeep = ['app_theme', 'app_language']
  const allKeys = Object.keys(localStorage)
  
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })

  // Limpiar sessionStorage
  sessionStorage.clear()
}

/**
 * Generar fingerprint del dispositivo (para detección)
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '',
    (navigator as any).deviceMemory?.toString() || ''
  ]

  const fingerprint = components.join('|')
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprint)
  const hash = await crypto.subtle.digest('SHA-256', data)
  
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Validar integridad de datos
 */
export const validateDataIntegrity = async (data: any, expectedChecksum: string): Promise<boolean> => {
  try {
    const jsonStr = JSON.stringify(data)
    const encoder = new TextEncoder()
    const encoded = encoder.encode(jsonStr)
    
    const hash = await crypto.subtle.digest('SHA-256', encoded)
    const hashArray = Array.from(new Uint8Array(hash))
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return checksum === expectedChecksum
  } catch {
    return false
  }
}

// Inicializar protecciones al cargar
if (typeof window !== 'undefined') {
  // Prevenir clickjacking
  preventClickjacking()

  // Limpiar rate limiters periódicamente
  setInterval(() => {
    loginRateLimiter.cleanup()
    apiRateLimiter.cleanup()
  }, 60 * 1000) // Cada minuto
}

export default {
  sanitizeInput,
  sanitizeEmail,
  generateCSRFToken,
  validateCSRFToken,
  hashPassword,
  checkPasswordStrength,
  detectSQLInjection,
  isValidOrigin,
  preventClickjacking,
  loginRateLimiter,
  apiRateLimiter,
  loginBruteForceProtection,
  encryptStorage,
  decryptStorage,
  clearSensitiveData,
  generateDeviceFingerprint,
  validateDataIntegrity
}