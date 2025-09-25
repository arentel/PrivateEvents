<template>
  <ion-page>
    <ion-content class="employee-login-content">
      <div class="employee-login-container">
        <!-- Logo/Header -->
        <div class="employee-login-header">
          <div class="logo">
            <ion-icon :icon="scanOutline" size="large" color="primary"></ion-icon>
          </div>
          <h1>Acceso Empleados</h1>
          <p>Escáner QR - Control de Acceso</p>
        </div>

        <!-- Formulario de Login -->
        <form @submit.prevent="handleEmployeeLogin" class="employee-login-form">
          <ion-card>
            <ion-card-content>
              <h2>Ingresa tu Código</h2>
              
              <!-- Campo Código de Empleado -->
              <ion-item>
                <ion-label position="floating">Código de Empleado</ion-label>
                <ion-input
                  v-model="employeeCode"
                  type="text"
                  required
                  :disabled="isLoading"
                  autocomplete="off"
                  placeholder="Ej: SYF2025"
                  :maxlength="20"
                  @keyup.enter="handleEmployeeLogin"
                  @input="onCodeInput"
                ></ion-input>
              </ion-item>

              <!-- Error Message -->
              <ion-item v-if="errorMessage" lines="none" class="error-item">
                <ion-label color="danger">
                  <ion-icon :icon="alertCircleOutline"></ion-icon>
                  {{ errorMessage }}
                </ion-label>
              </ion-item>

              <!-- Botón Login -->
              <div class="employee-login-button-container">
                <ion-button
                  expand="block"
                  type="submit"
                  :disabled="isLoading || !employeeCode || employeeCode.length < 3"
                  class="employee-login-button"
                >
                  <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
                  {{ isLoading ? 'Verificando...' : 'Acceder al Escáner' }}
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </form>

        <!-- Info adicional -->
        <div class="employee-info">
          <ion-card class="info-card">
            <ion-card-content>
              <h3>
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                Instrucciones
              </h3>
              <ul>
                <li>Ingresa el código de empleado proporcionado</li>
                <li>Solo tendrás acceso al escáner QR</li>
                <li>Mantén el dispositivo estable al escanear</li>
                <li>Si tienes problemas, contacta al administrador</li>
              </ul>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Footer -->
        <div class="employee-login-footer">
          <p>
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Acceso restringido para personal autorizado
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
  scanOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  informationCircleOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'

// Router
const router = useRouter()

// Estado del formulario
const employeeCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Códigos válidos para empleados (puedes mover esto a una base de datos)
const validEmployeeCodes = [
  'SYF2025',
  'STAFF2025',
  'SCANNER01',
  'EMPLOYEE01',
  'ACCESS2025'
]

// Función para manejar entrada de código
const onCodeInput = () => {
  // Limpiar error cuando el usuario empiece a escribir
  if (errorMessage.value) {
    errorMessage.value = ''
  }
  
  // Convertir a mayúsculas automáticamente
  employeeCode.value = employeeCode.value.toUpperCase()
}

// Manejar login de empleado
const handleEmployeeLogin = async () => {
  if (isLoading.value || !employeeCode.value || employeeCode.value.length < 3) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Simular delay de verificación
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const code = employeeCode.value.trim().toUpperCase()
    
    // Verificar si el código es válido
    if (validEmployeeCodes.includes(code)) {
      // Guardar sesión de empleado en localStorage
      localStorage.setItem('employeeSession', JSON.stringify({
        code: code,
        loginTime: new Date().toISOString(),
        role: 'employee'
      }))
      
      // Mostrar toast de éxito
      const toast = await toastController.create({
        message: `¡Acceso concedido! Bienvenido 👋`,
        duration: 2500,
        color: 'success',
        position: 'top',
        icon: checkmarkCircleOutline
      })
      await toast.present()
      
      // Redirigir directamente al escáner
      await router.replace('/employee/scanner')
      
    } else {
      errorMessage.value = 'Código de empleado no válido'
      
      // Vibrar en móvil para indicar error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100])
      }
      
      // Limpiar campo después de error
      setTimeout(() => {
        employeeCode.value = ''
      }, 1500)
    }
  } catch (error) {
    console.error('Employee login error:', error)
    errorMessage.value = 'Error inesperado. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.employee-login-content {
  --background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px 0;
}

.employee-login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  margin: 0 auto;
}

.employee-login-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
}

.logo {
  margin-bottom: 16px;
}

.employee-login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.employee-login-header p {
  font-size: 1.1rem;
  opacity: 0.95;
  margin: 0;
  font-weight: 500;
}

.employee-login-form {
  margin-bottom: 20px;
}

ion-card {
  box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  border-radius: 20px;
  margin: 0 0 20px 0;
  overflow: hidden;
}

ion-card-content h2 {
  text-align: center;
  color: var(--ion-color-primary);
  font-weight: 700;
  margin-bottom: 24px;
  font-size: 1.4rem;
}

ion-item {
  margin-bottom: 16px;
  border-radius: 12px;
  --background: #f8f9fa;
  --border-style: none;
  --inner-padding-end: 16px;
  --padding-start: 16px;
}

ion-input {
  font-weight: 600;
  font-size: 1.1rem;
  letter-spacing: 1px;
}

.error-item {
  --background: rgba(244, 67, 54, 0.1);
  margin-top: 8px;
  --border-color: #f44336;
  --border-width: 1px;
  --border-style: solid;
}

.error-item ion-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.employee-login-button-container {
  margin-top: 24px;
}

.employee-login-button {
  height: 52px;
  font-weight: 700;
  font-size: 1.1rem;
  --border-radius: 12px;
  --box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
}

.employee-info {
  margin-bottom: 20px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.info-card h3 {
  color: var(--ion-color-primary);
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-card ul {
  margin: 0;
  padding-left: 20px;
  color: var(--ion-color-dark);
}

.info-card li {
  margin-bottom: 6px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.employee-login-footer {
  text-align: center;
  color: white;
  opacity: 0.9;
  font-size: 0.9rem;
  font-weight: 500;
}

.employee-login-footer ion-icon {
  margin-right: 8px;
  vertical-align: middle;
}

/* Responsive */
@media (max-width: 480px) {
  .employee-login-container {
    padding: 16px;
  }
  
  .employee-login-header h1 {
    font-size: 1.8rem;
  }
  
  .employee-login-header p {
    font-size: 1rem;
  }
}

/* Animaciones */
@keyframes slideInUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.employee-login-form,
.employee-info {
  animation: slideInUp 0.6s ease-out;
}

.employee-info {
  animation-delay: 0.2s;
}
</style>