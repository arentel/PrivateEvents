<template>
  <ion-page>
    <ion-content>
      <div class="scanner-container">
        <!-- Header simple -->
        <div class="page-header">
          <h1>📱 Escáner QR</h1>
          <ion-button
            fill="outline"
            @click="logout"
          >
            <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
            Salir
          </ion-button>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="stats-section">
          <div class="section-header">
            <h3>Estadísticas de Validación</h3>
          </div>
          
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-value">{{ successfulEntries }}</span>
              <span class="stat-label">Exitosos</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ rejectedEntries }}</span>
              <span class="stat-label">Rechazados</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ totalValidations }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <!-- Scanner QR -->
        <div class="scanner-section">
          <div class="section-header">
            <h3>
              <ion-icon :icon="cameraOutline"></ion-icon>
              Escáner de Códigos QR
            </h3>
          </div>
          
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
              <h4>Error de Cámara</h4>
              <p>{{ cameraError }}</p>
              <ion-button @click="startScanner" fill="outline" class="retry-btn">
                <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                Reintentar
              </ion-button>
            </div>
          </div>

          <!-- Controles del scanner -->
          <div class="form-content">
            <ion-button
              @click="toggleScanner"
              :color="scannerActive ? 'danger' : undefined"
              expand="block"
              :disabled="isLoading"
              class="scanner-btn"
            >
              <ion-icon 
                :icon="scannerActive ? stopCircleOutline : playCircleOutline" 
                slot="start"
              ></ion-icon>
              {{ scannerActive ? 'Detener Escáner' : 'Iniciar Escáner' }}
            </ion-button>
            
            <ion-button
              @click="openManualEntry"
              fill="outline"
              expand="block"
              :disabled="isLoading"
              class="manual-btn"
            >
              <ion-icon :icon="keypadOutline" slot="start"></ion-icon>
              Entrada Manual
            </ion-button>
          </div>
        </div>

        <!-- Resultado de validación -->
        <div 
          v-if="validationResult.show" 
          class="validation-detail-card"
          :class="validationResult.type"
        >
          <div class="detail-header" :class="'header-' + validationResult.type">
            <div class="result-icon">
              <ion-icon :name="getResultIcon()"></ion-icon>
            </div>
            <div class="detail-title">
              <h2>{{ validationResult.title }}</h2>
              <p>{{ validationResult.message }}</p>
            </div>
            <ion-button 
              fill="clear" 
              size="small"
              @click="validationResult.show = false"
              class="close-detail-btn"
            >
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </div>

          <div v-if="validationResult.guest" class="detail-content">
            <div class="guest-main-info">
              <div class="guest-avatar-large">
                {{ validationResult.guest.name.charAt(0).toUpperCase() }}
              </div>
              <div class="guest-primary">
                <h3>{{ validationResult.guest.name }}</h3>
                <p v-if="validationResult.guest.company" class="guest-company">{{ validationResult.guest.company }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Últimas entradas -->
        <div v-if="recentEntriesDisplay.length > 0" class="recent-section">
          <div class="section-header">
            <h3>
              <ion-icon :icon="timeOutline"></ion-icon>
              Últimas Entradas ({{ recentEntriesDisplay.length }})
            </h3>
          </div>
          
          <div class="guests-list">
            <div 
              v-for="entry in recentEntriesDisplay.slice(0, 5)" 
              :key="entry.id"
              class="guest-item scanned"
            >
              <div class="guest-avatar">
                {{ entry.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="guest-info">
                <h4>{{ entry.name }}</h4>
                <p v-if="entry.company" class="company">{{ entry.company }}</p>
                <p class="timestamp">{{ formatTime(entry.entered_at) }}</p>
              </div>
              
              <div class="guest-status">
                <span class="status-badge success">
                  VALIDADO
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="recentEntriesDisplay.length === 0" class="empty-state">
          <ion-icon :icon="qrCodeOutline" size="large"></ion-icon>
          <h3>No hay entradas registradas</h3>
          <p>Las validaciones exitosas aparecerán aquí</p>
        </div>
      </div>
    </ion-content>

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
            <ion-label position="stacked">Código QR o Nombre</ion-label>
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
              class="validate-btn"
            >
              <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
              Validar
            </ion-button>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  toastController,
  alertController
} from '@ionic/vue'
import {
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
const html5QrCode = ref<any>(null)
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
  if (scannerActive.value) return

  try {
    isLoading.value = true
    cameraError.value = ''
    
    // Importación dinámica - solo cuando el usuario activa el scanner
    console.log('Cargando librerías del scanner...')
    const { Html5Qrcode } = await import('html5-qrcode')
    
    html5QrCode.value = new Html5Qrcode('employee-qr-reader')
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }

    await html5QrCode.value.start(
      { facingMode: 'environment' },
      config,
      onScanSuccess,
      onScanFailure
    )

    scannerActive.value = true
    console.log('Scanner iniciado correctamente')
    
  } catch (error) {
    console.error('Error iniciando scanner:', error)
    cameraError.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
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

// Fallo del escaneo (función que faltaba)
const onScanFailure = (error: string): void => {
  // No mostrar errores constantemente, solo log silencioso
  // Los fallos de escaneo son normales cuando la cámara no ve un QR válido
  // console.log('QR scan error (silent):', error)
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
    
    // Mostrar información más detallada
    const eventInfo = guest.event_name ? ` - ${guest.event_name}` : ''
    showValidationResult(
      'success',
      '✅ BIENVENIDO/A',
      `¡Acceso permitido para ${guest.name}!${eventInfo}`,
      updatedGuest
    )
    
    successfulEntries.value++
    saveStats()
    showToast(`${guest.name} ha ingresado correctamente`, 'success')
    
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
.scanner-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header simple */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  color: #1f2937;
}

/* Secciones - mismo estilo que las otras vistas */
.stats-section,
.scanner-section,
.recent-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Estadísticas - mismo estilo que las otras vistas */
.event-stats {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-weight: 700;
  font-size: 1.4rem;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

/* Scanner area */
.scanner-area {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  min-height: 300px;
  margin-bottom: 20px;
  border: 2px solid #0d1b2a;
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
  color: #6b7280;
  padding: 20px;
}

.camera-error ion-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.camera-error h4 {
  margin-bottom: 8px;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.camera-error p {
  margin-bottom: 20px;
  line-height: 1.4;
  font-size: 0.9rem;
}

/* Botones - mismo estilo que las otras vistas */
.scanner-btn,
.manual-btn,
.retry-btn,
.validate-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}

.scanner-btn:hover,
.manual-btn:hover,
.retry-btn:hover,
.validate-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.scanner-btn[color="danger"] {
  --background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* POPUP DETALLADO MEJORADO - Igual que ScanTab */
.validation-detail-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.15);
  overflow: hidden;
  animation: slideInUp 0.4s ease-out;
}

.validation-detail-card.success {
  border: 2px solid #28a745;
}

.validation-detail-card.warning {
  border: 2px solid #ffc107;
}

.validation-detail-card.error {
  border: 2px solid #dc3545;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-header {
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.detail-header.header-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.detail-header.header-warning {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
}

.detail-header.header-error {
  background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
}

.result-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.detail-title h2 {
  margin: 0 0 4px 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.detail-title p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.close-detail-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  --color: white;
}

.detail-content {
  padding: 24px;
}

/* Información principal del invitado - igual que ScanTab */
.guest-main-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border-left: 4px solid #28a745;
}

.guest-avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 2rem;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.guest-primary h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.6rem;
  font-weight: 600;
}

.guest-company {
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Lista de invitados - mismo estilo que las otras vistas */
.guests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.2s ease;
}

.guest-item:hover {
  background: #f1f3f4;
  transform: translateX(4px);
}

.guest-item.scanned {
  border-left-color: #10b981;
}

.guest-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #6b7280;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
}

.guest-item.scanned .guest-avatar {
  background: #10b981;
}

.guest-info {
  flex: 1;
}

.guest-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}

.guest-info p {
  margin: 0 0 2px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.company {
  font-size: 0.8rem;
  color: #9ca3af;
}

.timestamp {
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state ion-icon {
  margin-bottom: 20px;
  color: #9ca3af;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}

/* Modal */
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

/* Items y inputs */
ion-item {
  --background: #f8f9fa;
  --color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

ion-input {
  --color: #1f2937;
  --placeholder-color: #9ca3af;
}

/* Botones de outline */
ion-button[fill="outline"] {
  --border-color: #0d1b2a;
  --color: #0d1b2a;
  --background: transparent;
}

ion-button[fill="outline"]:hover {
  --background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  .scanner-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    text-align: center;
  }
  
  .event-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .stats-section,
  .scanner-section,
  .recent-section {
    padding: 16px;
  }
  
  .guest-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .scanner-area {
    min-height: 250px;
  }
  
  .detail-content {
    padding: 16px;
  }
  
  .guest-main-info {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .guest-avatar-large {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .guest-primary h3 {
    font-size: 1.3rem;
  }
  
  .detail-header {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .close-detail-btn {
    top: 8px;
    right: 8px;
  }
}

/* Ajustes específicos para html5-qrcode */
:deep(#employee-qr-reader) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(#employee-qr-reader video) {
  width: 100% !important;
  height: auto !important;
  border-radius: 6px;
}

:deep(#employee-qr-reader canvas) {
  width: 100% !important;
  height: auto !important;
}
</style>