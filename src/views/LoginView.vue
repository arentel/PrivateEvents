<template>
  <ion-page>
    <ion-content class="login-content">
      <div class="login-container">
        <!-- Header simple -->
        <div class="login-header">
          <div class="logo">
            <ion-icon :icon="qrCodeOutline" size="large"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Gestión de invitados profesional</p>
        </div>

        <!-- Formulario simple -->
        <div class="login-card">
          <div class="card-header">
            <h2>Acceso Administrador</h2>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="form-fields">
              <ion-item>
                <ion-label position="stacked">Usuario</ion-label>
                <ion-input
                  v-model="username"
                  type="text"
                  required
                  :disabled="isLoading"
                  autocomplete="username"
                  placeholder="Ingresa tu usuario"
                  @keyup.enter="handleLogin"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Contraseña</ion-label>
                <ion-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :disabled="isLoading"
                  autocomplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  @keyup.enter="handleLogin"
                ></ion-input>
                <ion-button
                  fill="clear"
                  slot="end"
                  @click="showPassword = !showPassword"
                  :disabled="isLoading"
                >
                  <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                </ion-button>
              </ion-item>

              <ion-item v-if="errorMessage" lines="none" class="error-item">
                <ion-label color="danger">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  {{ errorMessage }}
                </ion-label>
              </ion-item>
            </div>

            <div class="form-actions">
              <ion-button
                expand="block"
                type="submit"
                :disabled="isLoading || !username || !password"
                class="login-button"
              >
                <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
                {{ isLoading ? 'Verificando...' : 'Iniciar Sesión' }}
              </ion-button>
            </div>
          </form>

          <div class="security-info">
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            <span>Conexión segura y encriptada</span>
          </div>
        </div>

        <!-- Footer simple -->
        <div class="login-footer">
          <p>
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Sistema seguro de gestión de eventos
          </p>
          <div class="version-info">
            Sistema QR v1.0 - Acceso Administrador
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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
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
      const toast = await toastController.create({
        message: `Bienvenido ${username.value}!`,
        duration: 2000,
        color: 'success',
        position: 'top'
      })
      await toast.present()
      
      await router.replace('/tabs/guests')
    } else {
      errorMessage.value = result.error || 'Error de autenticación'
      
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
.login-content {
  --background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px 0;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  margin: 0 auto;
}

/* Header con degradado azul */
.login-header {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.2);
}

.logo {
  margin-bottom: 16px;
}

.logo ion-icon {
  font-size: 3rem;
}

.login-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

/* Card del formulario */
.login-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.card-header h2 {
  color: #1f2937;
  font-weight: 600;
  margin: 0;
  font-size: 1.3rem;
}

/* Campos del formulario */
.form-fields {
  margin-bottom: 24px;
}

.form-fields ion-item {
  margin-bottom: 16px;
  border-radius: 8px;
  --background: #f8f9fa;
}

.error-item {
  --background: transparent;
  margin-top: 8px;
}

.error-item ion-label {
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Botón de login */
.form-actions {
  margin-bottom: 20px;
}

.login-button {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  height: 48px;
  font-weight: 600;
  --border-radius: 8px;
}

.login-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

/* Información de seguridad */
.security-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #f0f8ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #0066cc;
}

.security-info ion-icon {
  color: #28a745;
}

/* Footer */
.login-footer {
  text-align: center;
  color: #6b7280;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.login-footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.version-info {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-header h1 {
    font-size: 1.6rem;
  }
  
  .login-card {
    padding: 20px;
  }
}
</style>