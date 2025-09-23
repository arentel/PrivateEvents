<template>
  <ion-page>
    <ion-content class="login-content">
      <div class="login-container">
        <!-- Logo/Header -->
        <div class="login-header">
          <div class="logo">
            <ion-icon :icon="qrCodeOutline" size="large" color="primary"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Gestión de invitados profesional</p>
        </div>

        <!-- Formulario de Login -->
        <form @submit.prevent="handleLogin" class="login-form">
          <ion-card>
            <ion-card-content>
              <h2>Acceso Administrador</h2>
              
              <!-- Campo Usuario -->
              <ion-item>
                <ion-label position="floating">Usuario</ion-label>
                <ion-input
                  v-model="username"
                  type="text"
                  required
                  :disabled="isLoading"
                  autocomplete="username"
                  @keyup.enter="handleLogin"
                ></ion-input>
              </ion-item>

              <!-- Campo Contraseña -->
              <ion-item>
                <ion-label position="floating">Contraseña</ion-label>
                <ion-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  :disabled="isLoading"
                  autocomplete="current-password"
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

              <!-- Error Message -->
              <ion-item v-if="errorMessage" lines="none" class="error-item">
                <ion-label color="danger">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  {{ errorMessage }}
                </ion-label>
              </ion-item>

              <!-- Botón Login -->
              <div class="login-button-container">
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
            </ion-card-content>
          </ion-card>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <p>
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Acceso seguro y protegido
          </p>
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
  IonCard,
  IonCardContent,
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
.login-content {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.login-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.logo {
  margin-bottom: 16px;
}

.login-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.login-header p {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

ion-card {
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border-radius: 16px;
  margin: 0;
}

ion-card-content h2 {
  text-align: center;
  color: var(--ion-color-primary);
  font-weight: 600;
  margin-bottom: 24px;
}

ion-item {
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
}

.login-button-container {
  margin-top: 24px;
}

.login-button {
  height: 48px;
  font-weight: 600;
  --border-radius: 8px;
}

.login-footer {
  text-align: center;
  color: white;
  opacity: 0.8;
  font-size: 0.9rem;
}

.login-footer ion-icon {
  margin-right: 8px;
  vertical-align: middle;
}

/* Responsive */
@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-header h1 {
    font-size: 1.6rem;
  }
}
</style>