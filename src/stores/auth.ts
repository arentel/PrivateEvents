import { reactive } from 'vue'

interface AuthState {
  isAuthenticated: boolean
  username: string | null
  loginTime: number | null
}

// Credenciales hardcodeadas (temporal)
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

// Funciones de autenticación
export const auth = {
  // Estado
  get isAuthenticated() {
    return authState.isAuthenticated
  },
  
  get username() {
    return authState.username
  },
  
  get loginTime() {
    return authState.loginTime
  },

  // Inicializar (verificar si hay sesión guardada)
  init() {
    const savedAuth = localStorage.getItem('auth_session')
    if (savedAuth) {
      try {
        const session = JSON.parse(savedAuth)
        const now = Date.now()
        const sessionDuration = 24 * 60 * 60 * 1000 // 24 horas
        
        // Verificar que la sesión no haya expirado
        if (session.loginTime && (now - session.loginTime) < sessionDuration) {
          authState.isAuthenticated = true
          authState.username = session.username
          authState.loginTime = session.loginTime
          return true
        } else {
          // Sesión expirada
          this.logout()
        }
      } catch (error) {
        console.error('Error loading saved session:', error)
        this.logout()
      }
    }
    return false
  },

  // Login
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Verificar credenciales
      if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        const now = Date.now()
        
        authState.isAuthenticated = true
        authState.username = username
        authState.loginTime = now
        
        // Guardar sesión
        localStorage.setItem('auth_session', JSON.stringify({
          username,
          loginTime: now
        }))
        
        console.log('✅ Login exitoso:', username)
        return { success: true }
      } else {
        return { success: false, error: 'Usuario o contraseña incorrectos' }
      }
    } catch (error) {
      console.error('Error during login:', error)
      return { success: false, error: 'Error de conexión' }
    }
  },

  // Logout
  logout() {
    authState.isAuthenticated = false
    authState.username = null
    authState.loginTime = null
    localStorage.removeItem('auth_session')
    console.log('👋 Sesión cerrada')
  },

  // Verificar si la sesión es válida
  isValidSession(): boolean {
    if (!this.isAuthenticated || !this.loginTime) return false
    
    const now = Date.now()
    const sessionDuration = 24 * 60 * 60 * 1000 // 24 horas
    
    return (now - this.loginTime) < sessionDuration
  }
}