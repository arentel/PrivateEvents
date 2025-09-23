<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>📱 Validar Entradas</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Scanner QR -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Escanear Código QR</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="scanner-container">
            <div v-if="!scannerActive && !isLoading" class="scanner-placeholder">
              <ion-icon name="qr-code-outline" size="large"></ion-icon>
              <p>Toca el botón para activar la cámara</p>
            </div>
            
            <div v-if="isLoading" class="loading-container">
              <ion-spinner></ion-spinner>
              <p>Iniciando cámara...</p>
            </div>
            
            <div 
              id="qr-reader" 
              v-show="scannerActive"
              class="qr-scanner"
            ></div>
            
            <div v-if="cameraError" class="error-container">
              <ion-icon name="warning-outline" color="danger" size="large"></ion-icon>
              <p>{{ cameraError }}</p>
            </div>
          </div>
          
          <ion-button 
            expand="block" 
            @click="toggleScanner"
            :color="scannerActive ? 'danger' : 'primary'"
            :disabled="isLoading"
          >
            <ion-icon 
              :name="scannerActive ? 'stop-circle-outline' : 'scan-outline'" 
              slot="start"
            ></ion-icon>
            {{ isLoading ? 'Iniciando...' : (scannerActive ? 'Parar Cámara' : 'Activar Cámara') }}
          </ion-button>
          
          <!-- Botón para input manual de QR -->
          <ion-button 
            expand="block" 
            fill="outline"
            @click="openManualQRInput"
            class="manual-qr-btn"
          >
            <ion-icon name="create-outline" slot="start"></ion-icon>
            Ingresar Código Manualmente
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Input manual para QR -->
      <ion-card v-if="showManualQR">
        <ion-card-header>
          <ion-card-title>Código QR Manual</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Pegar código QR</ion-label>
            <ion-textarea 
              v-model="manualQRCode"
              placeholder="Pega aquí el código QR completo..."
              rows="3"
            ></ion-textarea>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="validateManualQR"
            :disabled="!manualQRCode.trim()"
          >
            <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
            Validar Código
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="clear"
            @click="showManualQR = false"
          >
            Cancelar
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Validación manual -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Validación Manual</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Buscar por nombre o email</ion-label>
            <ion-input 
              v-model="manualSearch"
              placeholder="Nombre del invitado o email"
              @keyup.enter="searchGuest"
            ></ion-input>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="searchGuest"
            :disabled="!manualSearch.trim()"
          >
            <ion-icon name="search-outline" slot="start"></ion-icon>
            Buscar Invitado
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Resultado de validación -->
      <ion-card v-if="validationResult.show">
        <ion-card-content>
          <div 
            class="validation-result"
            :class="validationResult.type"
          >
            <div class="result-icon">
              <ion-icon 
                :name="getResultIcon()" 
                size="large"
              ></ion-icon>
            </div>
            
            <div class="result-content">
              <h2>{{ validationResult.title }}</h2>
              <div v-if="validationResult.guest" class="guest-details">
                <p><strong>Nombre:</strong> {{ validationResult.guest.name }}</p>
                <p><strong>Email:</strong> {{ validationResult.guest.email }}</p>
                <p><strong>Evento:</strong> {{ validationResult.guest.event_name }}</p>
                <p v-if="validationResult.guest.entered_at">
                  <strong>Entrada anterior:</strong> 
                  {{ formatDate(validationResult.guest.entered_at) }}
                </p>
                <p v-if="validationResult.type === 'success'">
                  <strong>Hora actual:</strong> 
                  {{ getCurrentTimeFormatted() }}
                </p>
              </div>
              <p class="result-message">{{ validationResult.message }}</p>
            </div>
            
            <ion-button 
              fill="clear" 
              @click="validationResult.show = false"
              class="close-result-btn"
            >
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas de validación -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Estadísticas del Día</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ totalValidations }}</div>
                <div class="stat-label">Validaciones</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card success">
                <div class="stat-number">{{ successfulEntries }}</div>
                <div class="stat-label">Entradas OK</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card danger">
                <div class="stat-number">{{ rejectedEntries }}</div>
                <div class="stat-label">Rechazadas</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-card-content>
      </ion-card>

      <!-- Lista de entradas recientes -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Entradas Recientes</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item v-for="entry in recentEntriesDisplay" :key="entry.id">
              <ion-avatar slot="start">
                <div class="avatar-placeholder success">
                  {{ entry.name.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              
              <ion-label>
                <h2>{{ entry.name }}</h2>
                <p>{{ entry.email }}</p>
                <p class="timestamp">{{ formatDate(entry.entered_at) }}</p>
              </ion-label>
              
              <ion-chip color="success" slot="end">
                ENTRÓ
              </ion-chip>
            </ion-item>
            
            <div v-if="recentEntries.length === 0" class="empty-state">
              <ion-icon name="people-outline" size="large"></ion-icon>
              <p>No hay entradas registradas aún</p>
            </div>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Botón para limpiar validaciones -->
      <ion-button 
        expand="block" 
        color="medium" 
        fill="outline"
        @click="clearValidationStats"
        v-if="totalValidations > 0"
        class="clear-stats-btn"
      >
        <ion-icon name="refresh-outline" slot="start"></ion-icon>
        Limpiar Estadísticas
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonIcon,
  IonList, IonAvatar, IonChip, IonRow, IonCol, IonSpinner
} from '@ionic/vue'
import {
  qrCodeOutline, stopCircleOutline, scanOutline, searchOutline,
  checkmarkCircleOutline, closeCircleOutline, warningOutline,
  createOutline, peopleOutline, refreshOutline, closeOutline
} from 'ionicons/icons'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../services/supabase'
import { validateQRCode } from '../services/qr'
import { useToast } from '@/composables/useToast'

// Composable para toasts
const { showToast } = useToast()

// Estado reactivo
const scannerActive = ref(false)
const isLoading = ref(false)
const cameraError = ref('')
const manualSearch = ref('')
const manualQRCode = ref('')
const showManualQR = ref(false)
const html5QrCode = ref(null)
const recentEntries = ref([])
const totalValidations = ref(0)
const successfulEntries = ref(0)
const rejectedEntries = ref(0)

const validationResult = ref({
  show: false,
  type: '', // 'success', 'error', 'warning'
  title: '',
  message: '',
  guest: null
})

// Computed properties
const recentEntriesDisplay = computed(() => 
  recentEntries.value.slice(0, 10).sort((a, b) => 
    new Date(b.entered_at) - new Date(a.entered_at)
  )
)

// Función para obtener la fecha y hora actual en formato España/Madrid
const getCurrentMadridTime = () => {
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

// Función para mostrar la hora actual formateada
const getCurrentTimeFormatted = () => {
  return new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Función para alternar el scanner
const toggleScanner = async () => {
  if (scannerActive.value) {
    await stopScanner()
  } else {
    await startScanner()
  }
}

// Función para iniciar el scanner
const startScanner = async () => {
  try {
    isLoading.value = true
    cameraError.value = ''
    
    html5QrCode.value = new Html5Qrcode("qr-reader")
    
    // Configuración del scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    }
    
    // Obtener cámaras disponibles
    const cameras = await Html5Qrcode.getCameras()
    
    if (!cameras || cameras.length === 0) {
      throw new Error('No se encontraron cámaras disponibles')
    }
    
    // Preferir cámara trasera si está disponible
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
      onScanFailure
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

// Función para obtener mensaje de error amigable
const getErrorMessage = (error) => {
  const message = error.message || error.toString()
  
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

// Función para parar el scanner
const stopScanner = async () => {
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

// Función llamada cuando se escanea exitosamente
const onScanSuccess = async (decodedText) => {
  console.log('QR Code scanned:', decodedText)
  
  // Parar el scanner temporalmente para procesar
  if (html5QrCode.value) {
    try {
      await html5QrCode.value.pause(true)
    } catch (error) {
      console.log('Error pausing scanner:', error)
    }
  }
  
  await validateScannedCode(decodedText)
  
  // Reactivar scanner después de 3 segundos
  setTimeout(async () => {
    if (html5QrCode.value && scannerActive.value) {
      try {
        await html5QrCode.value.resume()
      } catch (error) {
        console.log('Error resuming scanner:', error)
      }
    }
  }, 3000)
}

// Función llamada cuando falla el escaneo (normal)
const onScanFailure = (error) => {
  // No hacer nada - errores de escaneo son normales
}

// Función para abrir input manual de QR
const openManualQRInput = () => {
  showManualQR.value = true
  manualQRCode.value = ''
}

// Función para validar QR manual
const validateManualQR = async () => {
  if (!manualQRCode.value.trim()) return
  
  await validateScannedCode(manualQRCode.value.trim())
  showManualQR.value = false
  manualQRCode.value = ''
}

// Función para validar código escaneado
const validateScannedCode = async (qrCode) => {
  totalValidations.value++
  
  try {
    console.log('Validating QR code:', qrCode.substring(0, 50) + '...')
    
    // Decodificar y validar el QR
    const guestData = await validateQRCode(qrCode)
    
    if (!guestData) {
      showValidationResult('error', '❌ CÓDIGO NO VÁLIDO', 'El código QR no es válido o está corrupto')
      rejectedEntries.value++
      return
    }
    
    console.log('Guest data decoded:', guestData)
    
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
      return
    }
    
    console.log('Guest found:', guest)
    
    // Verificar si ya entró
    if (guest.has_entered) {
      showValidationResult(
        'warning', 
        '⚠️ YA INGRESÓ ANTERIORMENTE', 
        'Este invitado ya utilizó su código de entrada',
        guest
      )
      rejectedEntries.value++
      return
    }
    
    // Obtener la fecha/hora actual en zona horaria Madrid
    const madridTime = getCurrentMadridTime()
    
    // Marcar como entrada exitosa
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
    
    // Actualizar listas locales
    const updatedGuest = {
      ...guest,
      has_entered: true,
      entered_at: madridTime
    }
    
    recentEntries.value.unshift(updatedGuest)
    
    showValidationResult(
      'success',
      '✅ BIENVENIDO/A',
      `¡Acceso permitido para ${guest.name}!`,
      updatedGuest
    )
    
    successfulEntries.value++
    showToast(`✅ ${guest.name} ha ingresado correctamente`, 'success')
    
    // Auto-ocultar después de unos segundos
    setTimeout(() => {
      validationResult.value.show = false
    }, 5000)
    
  } catch (error) {
    console.error('Error validating QR:', error)
    showValidationResult('error', '❌ ERROR DE VALIDACIÓN', 'Error al procesar el código QR: ' + error.message)
    rejectedEntries.value++
  }
}

// Función para buscar invitado manualmente
const searchGuest = async () => {
  if (!manualSearch.value.trim()) return
  
  try {
    const searchTerm = manualSearch.value.trim().toLowerCase()
    
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(5)
    
    if (error) throw error
    
    if (guests.length === 0) {
      showValidationResult('error', '❌ NO ENCONTRADO', 'No se encontró ningún invitado con ese nombre o email')
      return
    }
    
    if (guests.length > 1) {
      showToast(`Se encontraron ${guests.length} invitados. Sé más específico`, 'warning')
      return
    }
    
    const guest = guests[0]
    
    if (!guest.qr_code) {
      showValidationResult('warning', '⚠️ SIN QR', 'Este invitado no tiene código QR generado', guest)
      return
    }
    
    // Simular validación del QR del invitado encontrado
    await validateScannedCode(guest.qr_code)
    
  } catch (error) {
    console.error('Error searching guest:', error)
    showToast('Error al buscar invitado: ' + error.message, 'danger')
  }
  
  manualSearch.value = ''
}

// Función para mostrar resultado de validación
const showValidationResult = (type, title, message, guest = null) => {
  validationResult.value = {
    show: true,
    type,
    title,
    message,
    guest
  }
}

// Función para obtener icono según el resultado
const getResultIcon = () => {
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

// Función para limpiar estadísticas
const clearValidationStats = () => {
  if (confirm('¿Limpiar todas las estadísticas de validación?')) {
    totalValidations.value = 0
    successfulEntries.value = 0
    rejectedEntries.value = 0
    recentEntries.value = []
    showToast('Estadísticas limpiadas', 'medium')
  }
}

// Función para formatear fecha con zona horaria de España/Madrid
const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  
  return date.toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Cargar entradas recientes al montar
onMounted(async () => {
  try {
    // Obtener el inicio del día actual en Madrid
    const madridDate = new Date().toLocaleString('en-CA', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('has_entered', true)
      .gte('entered_at', `${madridDate}T00:00:00`)
      .order('entered_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    recentEntries.value = data || []
    successfulEntries.value = data?.length || 0
    
    console.log(`Loaded ${recentEntries.value.length} recent entries for today (Madrid time)`)
    
  } catch (error) {
    console.error('Error loading recent entries:', error)
    showToast('Error cargando entradas recientes', 'warning')
  }
})

// Limpiar scanner al desmontar
onUnmounted(async () => {
  if (scannerActive.value && html5QrCode.value) {
    try {
      await stopScanner()
    } catch (error) {
      console.error('Error cleaning up scanner:', error)
    }
  }
})
</script>

<style scoped>
.scanner-container {
  text-align: center;
  padding: 1rem;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.scanner-placeholder {
  color: #666;
}

.loading-container {
  color: #666;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-container {
  color: #d32f2f;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.qr-scanner {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

/* Estilos específicos para html5-qrcode */
:deep(#qr-reader) {
  border: 2px solid #667eea;
  border-radius: 8px;
  overflow: hidden;
}

:deep(#qr-reader video) {
  width: 100% !important;
  height: auto !important;
  border-radius: 6px;
}

:deep(#qr-reader canvas) {
  width: 100% !important;
  height: auto !important;
}

.manual-qr-btn {
  margin-top: 1rem;
}

.validation-result {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  position: relative;
}

.validation-result.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
  border: 2px solid #28a745;
}

.validation-result.warning {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border: 2px solid #ffc107;
}

.validation-result.error {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  border: 2px solid #dc3545;
}

.result-icon {
  margin-bottom: 1rem;
}

.result-content h2 {
  margin-bottom: 1rem;
  font-weight: bold;
  font-size: 1.2rem;
}

.guest-details {
  background: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  text-align: left;
  backdrop-filter: blur(10px);
}

.guest-details p {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.result-message {
  font-style: italic;
  margin-top: 1rem;
  font-weight: 500;
}

.close-result-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  --color: currentColor;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin: 0.2rem;
}

.stat-card.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.stat-card.danger {
  background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
}

.stat-number {
  font-size: 1.8rem;
  font-weight: bold;
  display: block;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 0.2rem;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.avatar-placeholder.success {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.timestamp {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state ion-icon {
  margin-bottom: 1rem;
}

.clear-stats-btn {
  margin: 1rem 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .scanner-container {
    min-height: 250px;
  }
  
  .qr-scanner {
    max-width: 100%;
  }
  
  .guest-details {
    font-size: 0.85rem;
  }
}
</style>