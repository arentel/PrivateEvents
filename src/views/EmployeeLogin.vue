<template>
  <ion-page>
    <ion-content class="employee-login-content">
      <div class="employee-login-container">
        <!-- Header con estilo del template -->
        <div class="employee-login-header">
          <div class="logo">
            <ion-icon :icon="scanOutline" size="large"></ion-icon>
          </div>
          <h1>Acceso Empleados</h1>
          <p>Escáner QR - Control de Acceso</p>
        </div>

        <!-- Formulario de Login con estilo del template -->
        <form @submit.prevent="handleEmployeeLogin" class="employee-login-form">
          <div class="login-card">
            <div class="login-card-content">
              <div class="form-header">
                <h2>🎫 Ingresa tu Código</h2>
                <p>Código de empleado para acceso al escáner</p>
              </div>
              
              <!-- Campo de código con estilo del template -->
              <div class="form-fields">
                <div class="form-group">
                  <label class="form-label">👨‍💻 Código de Empleado</label>
                  <div class="input-container">
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
                      class="custom-input code-input"
                    ></ion-input>
                    <div class="input-hint">
                      <span class="hint-text">{{ employeeCode.length }}/20 caracteres</span>
                    </div>
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

              <!-- Botón de acceso con gradiente del template -->
              <div class="form-actions">
                <button
                  type="submit"
                  :disabled="isLoading || !employeeCode || employeeCode.length < 3"
                  class="access-button"
                >
                  <ion-spinner v-if="isLoading" name="crescent" class="button-spinner"></ion-spinner>
                  <span v-if="!isLoading">📱 Acceder al Escáner</span>
                  <span v-else">🔄 Verificando código...</span>
                </button>
              </div>

              <!-- Información de acceso -->
              <div class="access-info">
                <div class="access-badge">
                  <ion-icon :icon="scanOutline"></ion-icon>
                  <span>Solo acceso al escáner QR</span>
                </div>
              </div>
            </div>
          </div>
        </form>

        <!-- Información adicional con estilo del template -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-card-content">
              <h3>
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                📋 Instrucciones de Uso
              </h3>
              <div class="instructions-grid">
                <div class="instruction-item">
                  <div class="instruction-icon">🔑</div>
                  <div class="instruction-content">
                    <strong>Código de Empleado:</strong>
                    <span>Ingresa el código proporcionado por el administrador</span>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">📱</div>
                  <div class="instruction-content">
                    <strong>Acceso Limitado:</strong>
                    <span>Solo tendrás acceso al escáner QR de entradas</span>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">🎯</div>
                  <div class="instruction-content">
                    <strong>Uso del Escáner:</strong>
                    <span>Mantén el dispositivo estable al escanear códigos</span>
                  </div>
                </div>
                <div class="instruction-item">
                  <div class="instruction-icon">🆘</div>
                  <div class="instruction-content">
                    <strong>¿Problemas?</strong>
                    <span>Contacta al administrador del evento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con estilo del template -->
        <div class="employee-login-footer">
          <div class="footer-content">
            <p class="footer-text">
              <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
              Acceso restringido para personal autorizado
            </p>
            <div class="version-info">
              Sistema QR v1.0 - Acceso Empleados
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
  --employee-accent: #4facfe;
  --employee-accent-light: #00f2fe;
}

.employee-login-content {
  --background: var(--template-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 35px 0;
}

.employee-login-container {
  width: 100%;
  max-width: 460px;
  padding: 30px;
  margin: 0 auto;
}

/* Header con gradiente específico para empleados */
.employee-login-header {
  background: linear-gradient(135deg, var(--employee-accent) 0%, var(--employee-accent-light) 100%);
  color: white;
  padding: 35px 30px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(79, 172, 254, 0.2);
}

.logo {
  margin-bottom: 16px;
}

.logo ion-icon {
  font-size: 3rem;
}

.employee-login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.employee-login-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Card de login con estilo del template */
.employee-login-form {
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

.code-input {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.custom-input:focus {
  --border-color: var(--employee-accent);
  --background: #ffffff;
  box-shadow: 0 0 0 3px rgba(79, 172, 254, 0.1);
}

.input-hint {
  margin-top: 5px;
  text-align: right;
}

.hint-text {
  font-size: 0.8rem;
  color: var(--template-text-muted);
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

/* Botón de acceso con gradiente específico */
.form-actions {
  margin-bottom: 25px;
}

.access-button {
  background: linear-gradient(135deg, var(--employee-accent) 0%, var(--employee-accent-light) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 18px 35px;
  font-size: 1.1rem;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(79, 172, 254, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.access-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(79, 172, 254, 0.3);
}

.access-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 20px;
  height: 20px;
}

/* Información de acceso */
.access-info {
  text-align: center;
}

.access-badge {
  background: #f0f8ff;
  border: 1px solid #b3d9ff;
  color: #0066cc;
  padding: 12px 15px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.access-badge ion-icon {
  font-size: 1.1rem;
}

/* Sección de información con estilo del template */
.info-section {
  margin-bottom: 30px;
}

.info-card {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  box-shadow: var(--template-shadow);
}

.info-card-content {
  padding: 25px 30px;
}

.info-card h3 {
  color: var(--template-primary);
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.instructions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.instruction-item {
  background: var(--template-bg-section);
  border: 1px solid #e9ecef;
  padding: 15px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.instruction-item:hover {
  background: #ffffff;
  border-color: var(--template-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.instruction-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
  text-align: center;
}

.instruction-content strong {
  display: block;
  color: var(--template-primary);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.instruction-content span {
  color: var(--template-text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Footer con estilo del template */
.employee-login-footer {
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
  .employee-login-container {
    padding: 20px;
  }
  
  .employee-login-header {
    padding: 25px 20px;
    margin-bottom: 20px;
  }
  
  .employee-login-header h1 {
    font-size: 1.7rem;
  }
  
  .login-card-content {
    padding: 25px 20px;
  }
  
  .form-header h2 {
    font-size: 1.2rem;
  }
  
  .access-button {
    padding: 16px 30px;
    font-size: 1rem;
  }
  
  .instructions-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-card-content {
    padding: 20px;
  }
  
  .employee-login-footer {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .employee-login-container {
    padding: 16px;
  }
  
  .employee-login-header h1 {
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

.employee-login-header {
  animation: fadeInUp 0.6s ease-out;
}

.login-card {
  animation: fadeInUp 0.8s ease-out;
}

.info-section {
  animation: fadeInUp 1s ease-out;
}

.employee-login-footer {
  animation: fadeInUp 1.2s ease-out;
}

/* Estados de focus mejorados */
.custom-input:focus-within {
  transform: translateY(-1px);
}

/* Efecto de carga en el botón */
.access-button:disabled .button-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>