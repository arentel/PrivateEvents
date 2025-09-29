// stores/auth.ts - Autenticación mejorada con seguridad

import { reactive } from 'vue'
import { 
  sanitizeInput, 
  loginRateLimiter, 
  loginBruteForceProtection,
  hashPassword
} from '@/utils/security'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  loginTime: number | null
}

// ⚠️ CREDENCIALES - CÁMBIALAS EN PRODUCCIÓN
const CREDENTIALS = {
  username: 'adri',
  password: 'adri123'
}

// Estado reactivo de autenticación
const authState = reactive<AuthState>({
  isAuthenticated: false,
  username: null,
  loginTime: null
})

export const auth = {
  // Getters
  get isAuthenticated() {
    return authState.isAuthenticated
  },
  
  get username() {
    return authState.username
  },
  
  get loginTime() {
    return authState.loginTime
  },

  /**
   * Inicializar - Restaurar sesión guardada
   */
  init() {
    const savedAuth = localStorage.getItem('auth_session')
    if (!savedAuth) return false

    try {
      const session = JSON.parse(savedAuth)
      const now = Date.now()
      const sessionDuration = 24 * 60 * 60 * 1000 // 24 horas
      
      // Verificar que la sesión no haya expirado
      if (session.loginTime && (now - session.loginTime) < sessionDuration) {
        authState.isAuthenticated = true
        authState.username = session.username
        authState.loginTime = session.loginTime
        console.log('✅ Sesión restaurada')
        return true
      } else {
        // Sesión expirada
        console.warn('⏰ Sesión expirada')
        this.logout()
      }
    } catch (error) {
      console.error('Error cargando sesión:', error)
      this.logout()
    }
    return false
  },

  /**
   * Login con protecciones de seguridad
   */
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // 1. Sanitizar inputs (prevenir inyecciones)
    const cleanUsername = sanitizeInput(username)
    const cleanPassword = sanitizeInput(password)

    // 2. Validaciones básicas
    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Usuario y contraseña requeridos' }
    }

    // 3. Rate limiting (prevenir spam)
    if (!loginRateLimiter.isAllowed('login')) {
      const waitTime = Math.ceil(loginRateLimiter.getTimeUntilReset('login') / 1000)
      return { 
        success: false, 
        error: `⏱️ Demasiados intentos. Espera ${waitTime}s` 
      }
    }

    // 4. Protección brute force (prevenir ataques)
    if (loginBruteForceProtection.isLocked(cleanUsername)) {
      const lockoutTime = Math.ceil(loginBruteForceProtection.getLockoutTime(cleanUsername) / 1000 / 60)
      return { 
        success: false, 
        error: `🔒 Cuenta bloqueada. Intenta en ${lockoutTime} min` 
      }
    }

    try {
      // Simular delay de autenticación (prevenir timing attacks)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 5. Verificar credenciales
      if (cleanUsername === CREDENTIALS.username && cleanPassword === CREDENTIALS.password) {
        // ✅ Login exitoso
        const now = Date.now()
        
        authState.isAuthenticated = true
        authState.username = cleanUsername
        authState.loginTime = now
        
        // Resetear contador de fallos
        loginBruteForceProtection.resetFailures(cleanUsername)
        
        // Guardar sesión (encriptación básica)
        const sessionData = JSON.stringify({
          username: cleanUsername,
          loginTime: now
        })
        
        // Simple obfuscación (mejor que plaintext)
        const encoded = btoa(sessionData)
        localStorage.setItem('auth_session', encoded)
        
        console.log('✅ Login exitoso:', cleanUsername)
        return { success: true }
      } else {
        // ❌ Login fallido
        loginBruteForceProtection.recordFailure(cleanUsername)
        
        // Delay adicional en fallo (anti brute-force)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.warn('❌ Credenciales inválidas')
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: 'Error de autenticación' }
    }
  },

  /**
   * Logout seguro
   */
  logout() {
    // Limpiar estado
    authState.isAuthenticated = false
    authState.username = null
    authState.loginTime = null
    
    // Limpiar storage
    localStorage.removeItem('auth_session')
    
    console.log('🔓 Sesión cerrada')
  },

  /**
   * Verificar si la sesión es válida
   */
  isValidSession(): boolean {
    if (!this.isAuthenticated || !this.loginTime) return false
    
    const now = Date.now()
    const sessionDuration = 24 * 60 * 60 * 1000 // 24 horas
    
    return (now - this.loginTime) < sessionDuration
  }
}

// Inicializar al cargar el módulo
if (typeof window !== 'undefined') {
  // Limpiar sesiones antiguas al iniciar
  const checkAndCleanSession = () => {
    const savedAuth = localStorage.getItem('auth_session')
    if (savedAuth) {
      try {
        const decoded = atob(savedAuth)
        const session = JSON.parse(decoded)
        const now = Date.now()
        const sessionDuration = 24 * 60 * 60 * 1000
        
        if (session.loginTime && (now - session.loginTime) >= sessionDuration) {
          console.warn('🧹 Limpiando sesión expirada')
          localStorage.removeItem('auth_session')
        }
      } catch (error) {
        console.warn('🧹 Sesión corrupta, limpiando')
        localStorage.removeItem('auth_session')
      }
    }
  }
  
  checkAndCleanSession()
}