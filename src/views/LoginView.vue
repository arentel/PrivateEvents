<template>
  <ion-page>
    <ion-content class="login-content">
      <div class="login-container">
        <!-- Header con estilo del template -->
        <div class="login-header">
          <div class="logo">
            <ion-icon :icon="qrCodeOutline" size="large"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Gestión de invitados profesional</p>
        </div>

        <!-- Formulario de Login con estilo del template -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="login-card">
            <div class="login-card-content">
              <div class="form-header">
                <h2>🔐 Acceso Administrador</h2>
                <p>Ingresa tus credenciales para continuar</p>
              </div>
              
              <!-- Campos de formulario con estilo del template -->
              <div class="form-fields">
                <!-- Campo Usuario -->
                <div class="form-group">
                  <label class="form-label">👤 Usuario</label>
                  <div class="input-container">
                    <ion-input
                      v-model="username"
                      type="text"
                      required
                      :disabled="isLoading"
                      autocomplete="username"
                      placeholder="Ingresa tu usuario"
                      @keyup.enter="handleLogin"
                      class="custom-input"
                    ></ion-input>
                  </div>
                </div>

                <!-- Campo Contraseña -->
                <div class="form-group">
                  <label class="form-label">🔑 Contraseña</label>
                  <div class="input-container password-container">
                    <ion-input
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      required
                      :disabled="isLoading"
                      autocomplete="current-password"
                      placeholder="Ingresa tu contraseña"
                      @keyup.enter="handleLogin"
                      class="custom-input"
                    ></ion-input>
                    <button
                      type="button"
                      class="password-toggle"
                      @click="showPassword = !showPassword"
                      :disabled="isLoading"
                    >
                      <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                    </button>
                  </div>
                </div>

                <!-- Mensaje de Error con estilo del template -->
                <div v-if="errorMessage" class="error-container">
                  <div class="error-message">
                    <ion-icon :icon="alertCircleOutline"></ion-icon>
                    <span>{{ errorMessage }}</span>
                  </div>
                </div>
              </div>

              <!-- Botón Login con gradiente del template -->
              <div class="form-actions">
                <button
                  type="submit"
                  :disabled="isLoading || !username || !password"
                  class="login-button"
                >
                  <ion-spinner v-if="isLoading" name="crescent" class="button-spinner"></ion-spinner>
                  <span v-if="!isLoading">🚀 Iniciar Sesión</span>
                  <span v-else>🔄 Verificando...</span>
                </button>
              </div>

              <!-- Información adicional -->
              <div class="form-footer">
                <div class="security-info">
                  <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                  <span>Conexión segura y encriptada</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Footer con estilo del template -->
        <div class="login-footer">
          <div class="footer-content">
            <p class="footer-text">
              <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              Sistema seguro de gestión de eventos
            </p>
            <div class="version-info">
              Sistema QR v1.0 - Acceso Administrador
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonInput,
  IonIcon,
  IonSpinner,
  toastController
} from '@ionic/vue'
import {
  qrCodeOutline,
  eyeOutline,
  eyeOffOutline,
  alertCircleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons'
import { auth } from '@/stores/auth'

// Router
const router = useRouter()

// Estado del formulario
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Manejar login
const handleLogin = async () => {
  if (isLoading.value || !username.value || !password.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await auth.login(username.value.trim(), password.value)
    
    if (result.success) {
      // Mostrar toast de éxito
      const toast = await toastController.create({
        message: `¡Bienvenido ${username.value}! 👋`,
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: shieldCheckmarkOutline
      })
      await toast.present()
      
      // Redirigir a la app
      await router.replace('/tabs/guests')
    } else {
      errorMessage.value = result.error || 'Error de autenticación'
      
      // Vibrar en móvil para indicar error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Error inesperado. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Variables del template de email */
:root {
  --template-primary: #0d1b2a;
  --template-secondary: #1e3a8a;
  --template-bg-light: #f4f4f4;
  --template-bg-card: #f9f9f9;
  --template-bg-section: #f8f9fa;
  --template-border: #e0e0e0;
  --template-border-light: #dcdcdc;
  --template-text-muted: #666;
  --template-text-dark: #333;
  --template-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.login-content {
  --background: var(--template-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 35px 0;
}

.login-container {
  width: 100%;
  max-width: 450px;
  padding: 30px;
  margin: 0 auto;
}

/* Header con gradiente del template */
.login-header {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 35px 30px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.15);
}

.logo {
  margin-bottom: 16px;
}

.logo ion-icon {
  font-size: 3rem;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.login-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Card de login con estilo del template */
.login-form {
  margin-bottom: 30px;
}

.login-card {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  box-shadow: var(--template-shadow);
  overflow: hidden;
}

.login-card-content {
  padding: 35px 30px;
}

/* Header del formulario */
.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h2 {
  color: var(--template-primary);
  font-weight: 700;
  font-size: 1.4rem;
  margin: 0 0 8px 0;
}

.form-header p {
  color: var(--template-text-muted);
  font-size: 1rem;
  margin: 0;
}

/* Campos del formulario con estilo del template */
.form-fields {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--template-text-dark);
  margin-bottom: 8px;
}

.input-container {
  position: relative;
}

.custom-input {
  --background: var(--template-bg-section);
  --border-color: var(--template-border-light);
  --color: var(--template-text-dark);
  --placeholder-color: var(--template-text-muted);
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  
  border: 1px solid var(--template-border-light);
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.custom-input:focus {
  --border-color: var(--template-primary);
  --background: #ffffff;
  box-shadow: 0 0 0 3px rgba(13, 27, 42, 0.1);
}

/* Container de contraseña */
.password-container {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--template-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 10;
}

.password-toggle:hover {
  background: rgba(13, 27, 42, 0.1);
  color: var(--template-primary);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mensaje de error con estilo del template */
.error-container {
  margin-top: 15px;
}

.error-message {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 12px 15px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-message ion-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

/* Botón de login con gradiente del template */
.form-actions {
  margin-bottom: 25px;
}

.login-button {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 18px 35px;
  font-size: 1.1rem;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(13, 27, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 27, 42, 0.3);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 20px;
  height: 20px;
}

/* Información de seguridad */
.form-footer {
  text-align: center;
}

.security-info {
  background: var(--template-bg-card);
  border: 1px solid var(--template-border-light);
  padding: 12px 15px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--template-text-muted);
}

.security-info ion-icon {
  color: #28a745;
  font-size: 1.1rem;
}

/* Footer con estilo del template */
.login-footer {
  background: var(--template-bg-section);
  padding: 25px;
  text-align: center;
  border: 1px solid var(--template-border);
  border-radius: 6px;
}

.footer-content {
  color: var(--template-text-muted);
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
}

.version-info {
  font-size: 0.85rem;
  color: #999;
  line-height: 1.4;
}

/* Responsive mejorado */
@media (max-width: 768px) {
  .login-container {
    padding: 20px;
  }
  
  .login-header {
    padding: 25px 20px;
    margin-bottom: 20px;
  }
  
  .login-header h1 {
    font-size: 1.7rem;
  }
  
  .login-card-content {
    padding: 25px 20px;
  }
  
  .form-header h2 {
    font-size: 1.2rem;
  }
  
  .login-button {
    padding: 16px 30px;
    font-size: 1rem;
  }
  
  .login-footer {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-header h1 {
    font-size: 1.5rem;
  }
  
  .login-card-content {
    padding: 20px 16px;
  }
  
  .custom-input {
    --padding-start: 12px;
    --padding-end: 12px;
    --padding-top: 10px;
    --padding-bottom: 10px;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  animation: fadeInUp 0.6s ease-out;
}

.login-card {
  animation: fadeInUp 0.8s ease-out;
}

.login-footer {
  animation: fadeInUp 1s ease-out;
}

/* Estados de focus mejorados */
.custom-input:focus-within {
  transform: translateY(-1px);
}

/* Efecto de carga en el botón */
.login-button:disabled .button-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>