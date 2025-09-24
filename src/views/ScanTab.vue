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
          <!-- Resultado de validación inline -->
          <div v-if="validationResult.show" :class="['validation-inline', validationResult.type]">
            <div class="validation-content">
              <ion-icon :name="getResultIcon()" size="large"></ion-icon>
              <div>
                <h3>{{ validationResult.title }}</h3>
                <p>{{ validationResult.message }}</p>
                <div v-if="validationResult.guest" class="guest-info">
                  <strong>{{ validationResult.guest.name }}</strong>
                  <br>
                  <small>{{ validationResult.guest.email }}</small>
                </div>
              </div>
            </div>
            <ion-button 
              fill="clear" 
              size="small"
              @click="validationResult.show = false"
              class="close-inline-btn"
            >
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </div>

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
            {{ isLoading ? 'Iniciando...' : (scannerActive ? 'Detener Cámara' : 'Activar Cámara') }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="openManualQRInput"
            class="manual-qr-btn"
          >
            <ion-icon name="create-outline" slot="start"></ion-icon>
            Introducir Código Manualmente
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Estadísticas de Validación</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="4">
              <div class="stat-card">
                <span class="stat-number">{{ totalValidations }}</span>
                <div class="stat-label">Total</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card success">
                <span class="stat-number">{{ successfulEntries }}</span>
                <div class="stat-label">Exitosas</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card danger">
                <span class="stat-number">{{ rejectedEntries }}</span>
                <div class="stat-label">Rechazadas</div>
              </div>
            </ion-col>
          </ion-row>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            size="small"
            @click="clearValidationStats"
            class="clear-stats-btn"
          >
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Limpiar Estadísticas
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Búsqueda manual -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Búsqueda Manual</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Buscar por Nombre o Email</ion-label>
            <ion-input
              v-model="manualSearch"
              placeholder="Introduce nombre o email..."
              @keyup.enter="searchGuest"
            ></ion-input>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="searchGuest"
            :disabled="!manualSearch.trim()"
          >
            <ion-icon name="search-outline" slot="start"></ion-icon>
            Buscar y Validar
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Entradas recientes -->
      <ion-card v-if="recentEntriesDisplay.length > 0">
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
                <p class="timestamp">{{ formatDateTime(entry.entered_at || '') }}</p>
              </ion-label>
              
              <ion-chip color="success" slot="end">
                VALIDADO
              </ion-chip>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Estado vacío -->
      <ion-card v-if="recentEntriesDisplay.length === 0">
        <ion-card-content>
          <div class="empty-state">
            <ion-icon name="people-outline" size="large"></ion-icon>
            <h3>No hay entradas registradas</h3>
            <p>Las validaciones exitosas aparecerán aquí</p>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>

    <!-- Modal para input manual de QR -->
    <ion-modal :is-open="showManualQR" @did-dismiss="showManualQR = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Código QR Manual</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showManualQR = false">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <ion-item>
          <ion-label position="stacked">Código QR</ion-label>
          <ion-textarea 
            v-model="manualQRCode"
            placeholder="Pega aquí el código QR completo..."
            :rows="6"
          ></ion-textarea>
        </ion-item>
        
        <div style="padding: 16px;">
          <ion-button 
            expand="block" 
            @click="validateManualQR"
            :disabled="!manualQRCode.trim()"
          >
            <ion-icon name="checkmark-outline" slot="start"></ion-icon>
            Validar Código
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonList,
  IonAvatar,
  IonChip,
  IonRow,
  IonCol,
  IonModal,
  IonButtons,
  toastController
} from '@ionic/vue'
import {
  qrCodeOutline,
  stopCircleOutline,
  scanOutline,
  warningOutline,
  createOutline,
  searchOutline,
  refreshOutline,
  peopleOutline,
  closeOutline,
  checkmarkOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons'
import { Html5Qrcode } from 'html5-qrcode'
// @ts-ignore
import { supabase } from '@/services/supabase.js'

// Interfaces de TypeScript
interface Guest {
  id: string
  name: string
  email: string
  phone?: string
  event_id: string
  event_name: string
  qr_sent: boolean
  has_entered: boolean
  sent_at?: string
  entered_at?: string
  table_number?: string
  created_at: string
}

interface ValidationResult {
  show: boolean
  type: 'success' | 'warning' | 'error'
  title: string
  message: string
  guest: Guest | null
}

interface QRData {
  id: string
  name: string
  email: string
  event_name?: string
  eventId?: string
  eventName?: string
  timestamp?: string
  date?: string
  version?: string
}

// Estado del scanner
const scannerActive = ref(false)
const isLoading = ref(false)
const cameraError = ref('')
const html5QrCode = ref<Html5Qrcode | null>(null)

// Estado de validación
const totalValidations = ref(0)
const successfulEntries = ref(0)
const rejectedEntries = ref(0)
const recentEntries = ref<Guest[]>([])

// Estado de inputs manuales
const showManualQR = ref(false)
const manualQRCode = ref('')
const manualSearch = ref('')

// Estado del resultado de validación
const validationResult = ref<ValidationResult>({
  show: false,
  type: 'success',
  title: '',
  message: '',
  guest: null
})

// Computed properties
const recentEntriesDisplay = computed(() => 
  recentEntries.value.slice(0, 10).sort((a, b) => 
    new Date(b.entered_at || '').getTime() - new Date(a.entered_at || '').getTime()
  )
)

// Función para cargar entradas recientes desde la base de datos
const loadRecentEntries = async () => {
  try {
    console.log('Cargando entradas recientes desde la base de datos...')
    
    // Obtener invitados que han entrado hoy
    const today = new Date().toISOString().split('T')[0]
    
    const { data: entries, error } = await supabase
      .from('guests')
      .select('*')
      .eq('has_entered', true)
      .gte('entered_at', `${today}T00:00:00`)
      .lte('entered_at', `${today}T23:59:59`)
      .order('entered_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('Error loading recent entries:', error)
      return
    }
    
    recentEntries.value = entries || []
    
    console.log('Entradas recientes cargadas:', recentEntries.value.length)
    
  } catch (error) {
    console.error('Error cargando entradas recientes:', error)
  }
}

// Función para cargar estadísticas del día
const loadTodayStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Contar entradas del día
    const { data: todayEntries, error: entriesError } = await supabase
      .from('guests')
      .select('has_entered, entered_at')
      .eq('has_entered', true)
      .gte('entered_at', `${today}T00:00:00`)
      .lte('entered_at', `${today}T23:59:59`)
    
    if (entriesError) {
      console.error('Error loading today stats:', entriesError)
      return
    }
    
    const todaySuccessful = (todayEntries || []).length
    
    // Actualizar estadísticas
    successfulEntries.value = todaySuccessful
    
    // Las estadísticas de validaciones totales y rechazadas se mantienen en memoria
    // durante la sesión, pero se resetean al recargar
    
    console.log('Estadísticas del día cargadas:', { successful: todaySuccessful })
    
  } catch (error) {
    console.error('Error loading today stats:', error)
  }
}

// Funciones utilitarias
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top'
  })
  await toast.present()
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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
    
  } catch (error: any) {
    console.error('Error starting scanner:', error)
    isLoading.value = false
    cameraError.value = getErrorMessage(error)
    showToast(cameraError.value, 'danger')
  }
}

// Función para obtener mensaje de error amigable
const getErrorMessage = (error: any) => {
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
const onScanSuccess = async (decodedText: string) => {
  console.log('QR Code scanned:', decodedText)
  
  // Parar el scanner temporalmente para procesar
  if (html5QrCode.value && scannerActive.value) {
    try {
      await html5QrCode.value.stop()
      scannerActive.value = false
      
      // Procesar el código
      await validateScannedCode(decodedText)
      
      // Esperar 3 segundos antes de reactivar
      setTimeout(async () => {
        if (!scannerActive.value) {
          await startScanner()
        }
      }, 3000)
      
    } catch (error) {
      console.log('Error restarting scanner:', error)
    }
  }
}

// Función llamada cuando falla el escaneo (normal)
const onScanFailure = (error: string) => {
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

// FUNCIÓN PRINCIPAL CORREGIDA PARA VALIDAR QR
const validateScannedCode = async (qrCode: string) => {
  totalValidations.value++
  
  try {
    console.log('Validating QR code:', qrCode.substring(0, 100) + '...')
    
    // NUEVA LÓGICA: Intentar parsear como JSON directo primero
    let guestData: QRData | null = null
    
    try {
      // Intentar decodificar como JSON directo (nuevo formato)
      guestData = JSON.parse(qrCode) as QRData
      console.log('QR decoded as direct JSON:', guestData)
    } catch (jsonError) {
      console.log('QR is not direct JSON, trying encrypted format...')
      
      // Si no es JSON directo, intentar el formato encriptado (formato antiguo)
      try {
        // @ts-ignore - Importación dinámica para evitar errores de TypeScript
        const qrModule = await import('../services/qr.js')
        guestData = await qrModule.validateQRCode(qrCode)
        console.log('QR decoded as encrypted:', guestData)
      } catch (encryptError) {
        console.error('Failed to decode QR in both formats:', { jsonError, encryptError })
      }
    }
    
    // Validar que se pudo decodificar
    if (!guestData) {
      showValidationResult('error', '❌ CÓDIGO NO VÁLIDO', 'El código QR no es válido o está corrupto')
      rejectedEntries.value++
      return
    }
    
    // Validar que tiene los campos requeridos
    if (!guestData.id || !guestData.name || !guestData.email) {
      console.error('QR missing required fields:', guestData)
      showValidationResult('error', '❌ CÓDIGO INCOMPLETO', 'El código QR no contiene la información necesaria')
      rejectedEntries.value++
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
    const updatedGuest: Guest = {
      ...guest,
      has_entered: true,
      entered_at: madridTime
    }
    
    // Agregar al principio de la lista de entradas recientes
    recentEntries.value.unshift(updatedGuest)
    
    showValidationResult(
      'success',
      '✅ BIENVENIDO/A',
      `¡Acceso permitido para ${guest.name}!`,
      updatedGuest
    )
    
    successfulEntries.value++
    showToast(`${guest.name} ha ingresado correctamente`, 'success')
    
    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      validationResult.value.show = false
    }, 4000)
    
  } catch (error: any) {
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
    
    const guest = guests[0] as Guest
    
    // Verificar si ya entró
    if (guest.has_entered) {
      showValidationResult(
        'warning',
        '⚠️ YA INGRESÓ ANTERIORMENTE',
        'Este invitado ya utilizó su entrada',
        guest
      )
      return
    }
    
    // Marcar entrada manual
    const madridTime = getCurrentMadridTime()
    
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        has_entered: true,
        entered_at: madridTime
      })
      .eq('id', guest.id)
    
    if (updateError) throw updateError
    
    const updatedGuest: Guest = {
      ...guest,
      has_entered: true,
      entered_at: madridTime
    }
    
    // Agregar a entradas recientes
    recentEntries.value.unshift(updatedGuest)
    
    showValidationResult(
      'success',
      '✅ ENTRADA MANUAL',
      `Acceso permitido para ${guest.name} (validación manual)`,
      updatedGuest
    )
    
    successfulEntries.value++
    totalValidations.value++
    showToast(`✅ ${guest.name} validado manualmente`, 'success')
    
  } catch (error: any) {
    console.error('Error searching guest:', error)
    showToast('Error al buscar invitado: ' + error.message, 'danger')
  }
  
  manualSearch.value = ''
}

// Función para mostrar resultado de validación
const showValidationResult = (type: 'success' | 'warning' | 'error', title: string, message: string, guest: Guest | null = null) => {
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
    showToast('Estadísticas limpiadas', 'success')
  }
}

// Función para refrescar datos manualmente
const refreshData = async () => {
  await Promise.all([
    loadRecentEntries(),
    loadTodayStats()
  ])
  showToast('Datos actualizados', 'success')
}

// Ciclo de vida
onMounted(async () => {
  console.log('ScanTab mounted - loading data...')
  
  // Cargar entradas recientes y estadísticas
  await Promise.all([
    loadRecentEntries(),
    loadTodayStats()
  ])
})

// Recargar datos cuando se activa la vista
onActivated(async () => {
  console.log('ScanTab activated - refreshing recent entries...')
  await loadRecentEntries()
})

onUnmounted(async () => {
  try {
    if (html5QrCode.value && scannerActive.value) {
      await html5QrCode.value.stop()
      html5QrCode.value = null
    }
  } catch (error) {
    console.error('Error cleaning up scanner:', error)
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

/* Validación inline */
.validation-inline {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 8px;
  position: relative;
  animation: slideDown 0.3s ease-out;
}

.validation-inline.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  color: #155724;
  border: 2px solid #28a745;
}

.validation-inline.warning {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  color: #856404;
  border: 2px solid #ffc107;
}

.validation-inline.error {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  color: #721c24;
  border: 2px solid #dc3545;
}

.validation-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.validation-content ion-icon {
  flex-shrink: 0;
}

.validation-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: bold;
}

.validation-content p {
  margin: 0;
  font-size: 0.9rem;
}

.guest-info {
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.close-inline-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  --color: currentColor;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.manual-qr-btn {
  margin-top: 1rem;
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