<template>
  <ion-page>
    <ion-content class="employee-login-content">
      <div class="employee-login-container">
        <!-- Header simple con verde -->
        <div class="employee-login-header">
          <div class="logo">
            <ion-icon :icon="scanOutline" size="large"></ion-icon>
          </div>
          <h1>Acceso Empleados</h1>
          <p>Escáner QR - Control de Acceso</p>
        </div>

        <!-- Formulario simple -->
        <div class="login-card">
          <div class="card-header">
            <h2>Ingresa tu Código</h2>
          </div>

          <form @submit.prevent="handleEmployeeLogin">
            <div class="form-fields">
              <ion-item>
                <ion-label position="stacked">Código de Empleado</ion-label>
                <ion-input
                  v-model="employeeCode"
                  type="text"
                  required
                  :disabled="isLoading"
                  autocomplete="off"
                  placeholder="Ej: STAFF001"
                  :maxlength="20"
                  @keyup.enter="handleEmployeeLogin"
                  @input="onCodeInput"
                  class="code-input"
                ></ion-input>
              </ion-item>

              <div class="code-hint">
                {{ employeeCode.length }}/20 caracteres
              </div>

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
                :disabled="isLoading || !employeeCode || employeeCode.length < 3"
                class="access-button"
              >
                <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
                {{ isLoading ? 'Verificando código...' : 'Acceder al Escáner' }}
              </ion-button>
            </div>
          </form>

          <div class="access-info">
            <ion-icon :icon="scanOutline"></ion-icon>
            <span>Solo acceso al escáner QR</span>
          </div>
        </div>

        <!-- Información simple -->
        <div class="info-card">
          <h3>Instrucciones</h3>
          <div class="help-content">
            <div class="help-item">
              <strong>Código de Empleado:</strong> Ingresa el código proporcionado por el administrador
            </div>
            <div class="help-item">
              <strong>Acceso Limitado:</strong> Solo tendrás acceso al escáner QR de entradas
            </div>
            <div class="help-item">
              <strong>Uso del Escáner:</strong> Mantén el dispositivo estable al escanear códigos
            </div>
            <div class="help-item">
              <strong>¿Problemas?</strong> Contacta al administrador del evento
            </div>
          </div>
        </div>

        <!-- Footer simple -->
        <div class="employee-footer">
          <p>
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Acceso restringido para personal autorizado
          </p>
          <div class="version-info">
            Sistema QR v1.0 - Acceso Empleados
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
  scanOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'

// Router
const router = useRouter()

// Estado del formulario
const employeeCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Códigos válidos para empleados
const validEmployeeCodes = [
  'SYF2025',
  'STAFF2025',
  'SCANNER01',
  'EMPLOYEE01',
  'ACCESS2025'
]

// Función para manejar entrada de código
const onCodeInput = () => {
  if (errorMessage.value) {
    errorMessage.value = ''
  }
  employeeCode.value = employeeCode.value.toUpperCase()
}

// Manejar login de empleado
const handleEmployeeLogin = async () => {
  if (isLoading.value || !employeeCode.value || employeeCode.value.length < 3) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const code = employeeCode.value.trim().toUpperCase()
    
    if (validEmployeeCodes.includes(code)) {
      localStorage.setItem('employeeSession', JSON.stringify({
        code: code,
        loginTime: new Date().toISOString(),
        role: 'employee'
      }))
      
      const toast = await toastController.create({
        message: 'Acceso concedido! Bienvenido',
        duration: 2500,
        color: 'success',
        position: 'top',
        icon: checkmarkCircleOutline
      })
      await toast.present()
      
      await router.replace('/employee/scanner')
      
    } else {
      errorMessage.value = 'Código de empleado no válido'
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100])
      }
      
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
  --background: #f8f9fa;
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

/* Header con degradado verde para empleados */
.employee-login-header {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  color: white;
  padding: 30px;
  text-align: center;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(4, 120, 87, 0.2);
}

.logo {
  margin-bottom: 16px;
}

.logo ion-icon {
  font-size: 3rem;
}

.employee-login-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.employee-login-header p {
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
  margin-bottom: 8px;
  border-radius: 8px;
  --background: #f8f9fa;
}

.code-input {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.code-hint {
  text-align: right;
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 16px;
  margin-top: 4px;
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

/* Botón de acceso con verde */
.form-actions {
  margin-bottom: 20px;
}

.access-button {
  --background: linear-gradient(135deg, #047857 0%, #059669 100%);
  height: 48px;
  font-weight: 600;
  --border-radius: 8px;
}

.access-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(4, 120, 87, 0.3);
}

/* Información de acceso */
.access-info {
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

/* Card de información */
.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-card h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-item {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #4b5563;
}

.help-item strong {
  color: #1f2937;
}

/* Footer */
.employee-footer {
  text-align: center;
  color: #6b7280;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.employee-footer p {
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
  .employee-login-container {
    padding: 16px;
  }
  
  .employee-login-header h1 {
    font-size: 1.6rem;
  }
  
  .login-card,
  .info-card {
    padding: 20px;
  }
}
</style>