<template>
  <ion-page>
    <!-- Header simple -->
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>
          <ion-icon :icon="scanOutline" style="margin-right: 8px;"></ion-icon>
          Escáner QR
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout" fill="clear">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="scanner-content">
      <div class="scanner-container">
        
        <!-- Estadísticas rápidas -->
        <div class="quick-stats">
          <div class="stat-item success">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
            <div class="stat-info">
              <span class="stat-number">{{ successfulEntries }}</span>
              <span class="stat-label">Exitosos</span>
            </div>
          </div>
          <div class="stat-item rejected">
            <ion-icon :icon="closeCircleOutline"></ion-icon>
            <div class="stat-info">
              <span class="stat-number">{{ rejectedEntries }}</span>
              <span class="stat-label">Rechazados</span>
            </div>
          </div>
          <div class="stat-item total">
            <ion-icon :icon="qrCodeOutline"></ion-icon>
            <div class="stat-info">
              <span class="stat-number">{{ totalValidations }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <!-- Scanner QR -->
        <div class="qr-scanner-section">
          <ion-card class="scanner-card">
            <ion-card-header>
              <ion-card-title>
                <ion-icon :icon="cameraOutline"></ion-icon>
                Escáner de Códigos QR
              </ion-card-title>
            </ion-card-header>
            
            <ion-card-content>
              <!-- Área del scanner -->
              <div class="scanner-area">
                <div 
                  id="employee-qr-reader" 
                  class="qr-reader"
                  :class="{ 'scanner-loading': isLoading }"
                ></div>
                
                <!-- Loading overlay -->
                <div v-if="isLoading" class="scanner-loading-overlay">
                  <ion-spinner name="crescent" color="primary"></ion-spinner>
                  <p>Iniciando cámara...</p>
                </div>
                
                <!-- Error de cámara -->
                <div v-if="cameraError" class="camera-error">
                  <ion-icon :icon="alertCircleOutline" color="danger"></ion-icon>
                  <h3>Error de Cámara</h3>
                  <p>{{ cameraError }}</p>
                  <ion-button @click="startScanner" fill="outline" color="primary">
                    <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                    Reintentar
                  </ion-button>
                </div>
              </div>

              <!-- Controles del scanner -->
              <div class="scanner-controls">
                <ion-button
                  @click="toggleScanner"
                  :color="scannerActive ? 'danger' : 'success'"
                  expand="block"
                  size="large"
                  :disabled="isLoading"
                >
                  <ion-icon 
                    :icon="scannerActive ? stopCircleOutline : playCircleOutline" 
                    slot="start"
                  ></ion-icon>
                  {{ scannerActive ? 'Detener Escáner' : 'Iniciar Escáner' }}
                </ion-button>
                
                <!-- Botón de entrada manual -->
                <ion-button
                  @click="openManualEntry"
                  fill="outline"
                  expand="block"
                  :disabled="isLoading"
                >
                  <ion-icon :icon="keypadOutline" slot="start"></ion-icon>
                  Entrada Manual
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Resultado de validación -->
        <ion-card 
          v-if="validationResult.show" 
          class="validation-result"
          :class="validationResult.type"
        >
          <ion-card-content>
            <div class="result-header">
              <ion-icon :icon="getResultIcon()"></ion-icon>
              <h2>{{ validationResult.title }}</h2>
            </div>
            <p class="result-message">{{ validationResult.message }}</p>
            <div v-if="validationResult.guest" class="guest-info">
              <strong>{{ validationResult.guest.name }}</strong>
              <span v-if="validationResult.guest.company">- {{ validationResult.guest.company }}</span>
            </div>
            <ion-button 
              @click="validationResult.show = false" 
              fill="clear" 
              size="small"
              class="close-result-btn"
            >
              Cerrar
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Últimas entradas -->
        <div v-if="recentEntriesDisplay.length > 0" class="recent-entries">
          <h3>
            <ion-icon :icon="timeOutline"></ion-icon>
            Últimas Entradas ({{ recentEntriesDisplay.length }})
          </h3>
          <div class="entries-list">
            <div 
              v-for="entry in recentEntriesDisplay.slice(0, 5)" 
              :key="entry.id"
              class="entry-item"
            >
              <div class="entry-info">
                <strong>{{ entry.name }}</strong>
                <span class="entry-company" v-if="entry.company">{{ entry.company }}</span>
              </div>
              <div class="entry-time">
                {{ formatTime(entry.entered_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal entrada manual -->
      <ion-modal :is-open="showManualEntry" @did-dismiss="showManualEntry = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Entrada Manual</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="showManualEntry = false" fill="clear">
                <ion-icon :icon="closeOutline"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        
        <ion-content class="modal-content">
          <div class="manual-entry-form">
            <ion-item>
              <ion-label position="floating">Código QR o Nombre</ion-label>
              <ion-input
                v-model="manualCode"
                placeholder="Ingresa el código QR o busca por nombre..."
                @keyup.enter="validateManualEntry"
              ></ion-input>
            </ion-item>
            
            <div class="manual-entry-buttons">
              <ion-button 
                @click="validateManualEntry" 
                expand="block"
                :disabled="!manualCode"
              >
                <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
                Validar
              </ion-button>
            </div>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  toastController,
  alertController
} from '@ionic/vue'
import {
  scanOutline,
  logOutOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  qrCodeOutline,
  cameraOutline,
  alertCircleOutline,
  refreshOutline,
  stopCircleOutline,
  playCircleOutline,
  keypadOutline,
  timeOutline,
  closeOutline,
  checkmarkOutline,
  warningOutline
} from 'ionicons/icons'
// @ts-ignore
import { supabase } from '@/services/supabase'
// @ts-ignore
import { validateQRCode } from '@/services/qr'

// Interfaces para TypeScript
interface Guest {
  id: string
  name: string
  company?: string
  has_entered?: boolean
  entered_at?: string
  qr_code?: string
}

interface ValidationResult {
  show: boolean
  type: 'success' | 'warning' | 'error'
  title: string
  message: string
  guest?: Guest | null
}

interface EmployeeSession {
  code: string
  loginTime: string
  role: string
}

// Router
const router = useRouter()

// Estado del scanner
const html5QrCode = ref<Html5Qrcode | null>(null)
const scannerActive = ref<boolean>(false)
const isLoading = ref<boolean>(false)
const cameraError = ref<string>('')

// Estado de validación
const validationResult = ref<ValidationResult>({
  show: false,
  type: 'success',
  title: '',
  message: '',
  guest: null
})

// Estadísticas
const successfulEntries = ref<number>(0)
const rejectedEntries = ref<number>(0)
const totalValidations = ref<number>(0)
const recentEntries = ref<Guest[]>([])

// Estado de entrada manual
const showManualEntry = ref<boolean>(false)
const manualCode = ref<string>('')

// Computed
const recentEntriesDisplay = computed(() => 
  recentEntries.value.slice(0, 10).sort((a: Guest, b: Guest) => {
    if (!a.entered_at || !b.entered_at) return 0
    return new Date(b.entered_at).getTime() - new Date(a.entered_at).getTime()
  })
)

// Verificar autenticación de empleado al montar
onMounted(() => {
  checkEmployeeAuth()
  loadStats()
})

// Limpiar al desmontar
onUnmounted(() => {
  if (html5QrCode.value && scannerActive.value) {
    stopScanner()
  }
})

// Verificar autenticación de empleado
const checkEmployeeAuth = (): void => {
  const employeeSession = localStorage.getItem('employeeSession')
  if (!employeeSession) {
    router.replace('/employee/login')
    return
  }
  
  try {
    const session: EmployeeSession = JSON.parse(employeeSession)
    // Verificar que no haya expirado (12 horas)
    const loginTime = new Date(session.loginTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff > 12) {
      logout()
    }
  } catch (error) {
    console.error('Error parsing employee session:', error)
    logout()
  }
}

// Cargar estadísticas
const loadStats = (): void => {
  const saved = localStorage.getItem('employeeStats')
  if (saved) {
    const stats = JSON.parse(saved)
    successfulEntries.value = stats.successful || 0
    rejectedEntries.value = stats.rejected || 0
    totalValidations.value = stats.total || 0
  }
}

// Guardar estadísticas
const saveStats = (): void => {
  const stats = {
    successful: successfulEntries.value,
    rejected: rejectedEntries.value,
    total: totalValidations.value,
    lastUpdate: new Date().toISOString()
  }
  localStorage.setItem('employeeStats', JSON.stringify(stats))
}

// Cerrar sesión
const logout = async (): Promise<void> => {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro de que quieres salir?',
    buttons: [
      'Cancelar',
      {
        text: 'Salir',
        handler: () => {
          localStorage.removeItem('employeeSession')
          router.replace('/employee/login')
        }
      }
    ]
  })
  
  await alert.present()
}

// Alternar scanner
const toggleScanner = async (): Promise<void> => {
  if (scannerActive.value) {
    await stopScanner()
  } else {
    await startScanner()
  }
}

// Iniciar scanner
const startScanner = async (): Promise<void> => {
  try {
    isLoading.value = true
    cameraError.value = ''
    
    html5QrCode.value = new Html5Qrcode("employee-qr-reader")
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }
    
    const cameras = await Html5Qrcode.getCameras()
    
    if (!cameras || cameras.length === 0) {
      throw new Error('No se encontraron cámaras disponibles')
    }
    
    const backCamera = cameras.find(camera => 
      camera.label.toLowerCase().includes('back') || 
      camera.label.toLowerCase().includes('trasera') ||
      camera.label.toLowerCase().includes('environment')
    )
    
    const cameraId = backCamera ? backCamera.id : cameras[0].id
    
    await html5QrCode.value.start(
      cameraId,
      config,
      onScanSuccess,
      () => {} // onScanFailure - ignorar errores normales
    )
    
    scannerActive.value = true
    isLoading.value = false
    showToast('Cámara activada - Apunta al código QR', 'success')
    
  } catch (error) {
    console.error('Error starting scanner:', error)
    isLoading.value = false
    cameraError.value = getErrorMessage(error)
    showToast(cameraError.value, 'danger')
  }
}

// Detener scanner
const stopScanner = async (): Promise<void> => {
  try {
    if (html5QrCode.value && scannerActive.value) {
      await html5QrCode.value.stop()
      html5QrCode.value = null
      scannerActive.value = false
      cameraError.value = ''
      showToast('Cámara desactivada', 'medium')
    }
  } catch (error) {
    console.error('Error stopping scanner:', error)
    scannerActive.value = false
    html5QrCode.value = null
  }
}

// Éxito del escaneo
const onScanSuccess = async (decodedText: string): Promise<void> => {
  console.log('QR Code scanned:', decodedText)
  
  // Pausar temporalmente el scanner para procesar
  if (html5QrCode.value && scannerActive.value) {
    await stopScanner()
    
    await validateScannedCode(decodedText)
    
    // Reactivar scanner después de 3 segundos
    setTimeout(async () => {
      if (!scannerActive.value) {
        await startScanner()
      }
    }, 3000)
  } else {
    await validateScannedCode(decodedText)
  }
}

// Validar código escaneado
const validateScannedCode = async (qrCode: string): Promise<void> => {
  totalValidations.value++
  
  try {
    console.log('Validating QR code:', qrCode.substring(0, 100) + '...')
    
    // NUEVA LÓGICA: Intentar parsear como JSON directo primero
    let guestData: any = null
    
    try {
      // Intentar decodificar como JSON directo (nuevo formato)
      guestData = JSON.parse(qrCode)
      console.log('QR decoded as direct JSON:', guestData)
    } catch (jsonError) {
      console.log('QR is not direct JSON, trying encrypted format...')
      
      // Si no es JSON directo, intentar el formato encriptado (formato antiguo)
      try {
        // @ts-ignore - Importación dinámica para evitar errores de TypeScript
        const qrModule = await import('@/services/qr')
        guestData = qrModule.validateQRCode(qrCode)
        console.log('QR decoded as encrypted:', guestData)
      } catch (encryptError) {
        console.error('Failed to decode QR in both formats:', { jsonError, encryptError })
      }
    }
    
    // Validar que se pudo decodificar
    if (!guestData) {
      showValidationResult('error', '❌ CÓDIGO NO VÁLIDO', 'El código QR no es válido o está corrupto')
      rejectedEntries.value++
      saveStats()
      return
    }
    
    // Validar que tiene los campos requeridos
    if (!guestData.id || !guestData.name || !guestData.email) {
      console.error('QR missing required fields:', guestData)
      showValidationResult('error', '❌ CÓDIGO INCOMPLETO', 'El código QR no contiene la información necesaria')
      rejectedEntries.value++
      saveStats()
      return
    }
    
    console.log('Guest data decoded successfully:', guestData)
    
    // Buscar invitado en la base de datos
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestData.id)
      .single()
    
    if (error || !guest) {
      console.error('Guest not found:', error)
      showValidationResult('error', '❌ INVITADO NO ENCONTRADO', 'Este invitado no está en la lista')
      rejectedEntries.value++
      saveStats()
      return
    }
    
    console.log('Guest found:', guest)
    
    if (guest.has_entered) {
      showValidationResult(
        'warning', 
        '⚠️ YA INGRESÓ ANTERIORMENTE', 
        'Este invitado ya utilizó su código de entrada',
        guest
      )
      rejectedEntries.value++
      saveStats()
      return
    }
    
    const madridTime = getCurrentMadridTime()
    
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        has_entered: true,
        entered_at: madridTime
      })
      .eq('id', guest.id)
    
    if (updateError) {
      console.error('Error updating guest:', updateError)
      throw updateError
    }
    
    const updatedGuest: Guest = {
      ...guest,
      has_entered: true,
      entered_at: madridTime
    }
    
    recentEntries.value.unshift(updatedGuest)
    
    // Mostrar información más detallada como en ScanTab
    const eventInfo = guest.event_name ? ` - ${guest.event_name}` : ''
    showValidationResult(
      'success',
      '✅ BIENVENIDO/A',
      `¡Acceso permitido para ${guest.name}!${eventInfo}`,
      updatedGuest
    )
    
    successfulEntries.value++
    saveStats()
    showToast(`✅ ${guest.name} ha ingresado correctamente`, 'success')
    
    setTimeout(() => {
      validationResult.value.show = false
    }, 5000)
    
  } catch (error) {
    console.error('Error validating QR:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    showValidationResult('error', '❌ ERROR DE VALIDACIÓN', 'Error al procesar el código QR: ' + errorMessage)
    rejectedEntries.value++
    saveStats()
  }
}

// Obtener tiempo actual en Madrid
const getCurrentMadridTime = (): string => {
  return new Date().toLocaleString('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/(\d{4})-(\d{2})-(\d{2}), (\d{2}):(\d{2}):(\d{2})/, '$1-$2-$3T$4:$5:$6')
}

// Formatear tiempo para mostrar
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return ''
  return new Date(timeString).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Abrir entrada manual
const openManualEntry = (): void => {
  showManualEntry.value = true
  manualCode.value = ''
}

// Validar entrada manual
const validateManualEntry = async (): Promise<void> => {
  if (!manualCode.value.trim()) return
  
  await validateScannedCode(manualCode.value.trim())
  showManualEntry.value = false
  manualCode.value = ''
}

// Mostrar resultado de validación
const showValidationResult = (type: 'success' | 'warning' | 'error', title: string, message: string, guest: Guest | null = null): void => {
  validationResult.value = {
    show: true,
    type,
    title,
    message,
    guest
  }
}

// Obtener icono según resultado
const getResultIcon = (): string => {
  switch (validationResult.value.type) {
    case 'success':
      return checkmarkCircleOutline
    case 'warning':
      return warningOutline
    case 'error':
    default:
      return closeCircleOutline
  }
}

// Obtener mensaje de error amigable
const getErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : error?.toString() || 'Error desconocido'
  
  if (message.includes('Permission denied')) {
    return 'Permiso de cámara denegado. Activa el permiso en configuración.'
  }
  if (message.includes('NotFoundError')) {
    return 'No se encontró cámara disponible.'
  }
  if (message.includes('NotAllowedError')) {
    return 'Acceso a cámara no permitido.'
  }
  if (message.includes('NotSupportedError')) {
    return 'Tu navegador no soporta esta función.'
  }
  if (message.includes('OverconstrainedError')) {
    return 'Configuración de cámara no compatible.'
  }
  
  return 'Error al acceder a la cámara: ' + message
}

// Mostrar toast
const showToast = async (message: string, color: string = 'primary', duration: number = 2000): Promise<void> => {
  const toast = await toastController.create({
    message,
    duration,
    color,
    position: 'top'
  })
  await toast.present()
}
</script>

<style scoped>
.scanner-content {
  --background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.scanner-container {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

/* Estadísticas rápidas */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-item ion-icon {
  font-size: 24px;
}

.stat-item.success ion-icon {
  color: #10dc60;
}

.stat-item.rejected ion-icon {
  color: #f04141;
}

.stat-item.total ion-icon {
  color: #3880ff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* Scanner */
.qr-scanner-section {
  margin-bottom: 20px;
}

.scanner-card {
  margin: 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  border-radius: 16px;
}

.scanner-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
}

.scanner-area {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 300px;
  margin-bottom: 20px;
}

.qr-reader {
  width: 100%;
  min-height: 300px;
}

.scanner-loading {
  background: #f0f0f0;
}

.scanner-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
}

.scanner-loading-overlay p {
  margin-top: 16px;
  font-weight: 500;
}

.camera-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: #666;
}

.camera-error ion-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.camera-error h3 {
  margin-bottom: 8px;
  color: #333;
}

.camera-error p {
  margin-bottom: 20px;
  line-height: 1.4;
}

.scanner-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Resultado de validación */
.validation-result {
  margin-bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  animation: slideInDown 0.3s ease-out;
}

.validation-result.success {
  border-left: 4px solid #10dc60;
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
}

.validation-result.warning {
  border-left: 4px solid #ffce00;
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
}

.validation-result.error {
  border-left: 4px solid #f04141;
  background: linear-gradient(135deg, #f8d7da, #f1c0c7);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.result-header ion-icon {
  font-size: 28px;
}

.validation-result.success .result-header ion-icon {
  color: #10dc60;
}

.validation-result.warning .result-header ion-icon {
  color: #ffce00;
}

.validation-result.error .result-header ion-icon {
  color: #f04141;
}

.result-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.result-message {
  margin-bottom: 8px;
  font-weight: 500;
  line-height: 1.4;
}

.guest-info {
  background: rgba(255,255,255,0.8);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.close-result-btn {
  --color: #666;
}

/* Últimas entradas */
.recent-entries h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.entries-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.entry-item:last-child {
  border-bottom: none;
}

.entry-info strong {
  display: block;
  font-weight: 600;
  margin-bottom: 2px;
}

.entry-company {
  font-size: 0.85rem;
  color: #666;
}

.entry-time {
  font-size: 0.85rem;
  color: #999;
  font-family: monospace;
  font-weight: 500;
}

/* Modal entrada manual */
.modal-content {
  padding: 20px;
}

.manual-entry-form {
  max-width: 400px;
  margin: 0 auto;
}

.manual-entry-buttons {
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 480px) {
  .scanner-container {
    padding: 12px;
  }
  
  .quick-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .stat-item {
    padding: 12px;
    gap: 8px;
  }
  
  .stat-info {
    align-items: center;
  }
  
  .stat-number {
    font-size: 16px;
  }
  
  .stat-label {
    font-size: 11px;
  }
}

/* Animaciones */
@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>