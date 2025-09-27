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

      <!-- POPUP DETALLADO - Nueva sección -->
      <div v-if="lastValidatedGuest" class="validation-detail-card">
        <div class="detail-header">
          <div class="success-icon">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
          </div>
          <div class="detail-title">
            <h2>✅ Entrada Validada</h2>
            <p>Acceso confirmado exitosamente</p>
          </div>
          <ion-button 
            fill="clear" 
            size="small"
            @click="clearLastValidated"
            class="close-detail-btn"
          >
            <ion-icon name="close-outline"></ion-icon>
          </ion-button>
        </div>

        <div class="detail-content">
          <!-- Avatar y nombre principal -->
          <div class="guest-main-info">
            <div class="guest-avatar-large">
              {{ lastValidatedGuest.name.charAt(0).toUpperCase() }}
            </div>
            <div class="guest-primary">
              <h3>{{ lastValidatedGuest.name }}</h3>
              <p class="guest-email">{{ lastValidatedGuest.email }}</p>
            </div>
          </div>

          <!-- Información del evento -->
          <div class="event-details-section">
            <div class="section-title">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>Detalles del Evento</span>
            </div>
            
            <div class="detail-grid">
              <div class="detail-item">
                <ion-icon name="star-outline" color="primary"></ion-icon>
                <div>
                  <span class="detail-label">Evento</span>
                  <span class="detail-value">{{ lastValidatedGuest.event_name || 'Evento Principal' }}</span>
                </div>
              </div>
              
              <div class="detail-item">
                <ion-icon name="location-outline" color="primary"></ion-icon>
                <div>
                  <span class="detail-label">Ubicación</span>
                  <span class="detail-value">Salón Principal</span>
                </div>
              </div>

              <div class="detail-item" v-if="lastValidatedGuest.phone">
                <ion-icon name="call-outline" color="primary"></ion-icon>
                <div>
                  <span class="detail-label">Teléfono</span>
                  <span class="detail-value">{{ lastValidatedGuest.phone }}</span>
                </div>
              </div>

              <div class="detail-item" v-if="lastValidatedGuest.table_number">
                <ion-icon name="restaurant-outline" color="primary"></ion-icon>
                <div>
                  <span class="detail-label">Mesa</span>
                  <span class="detail-value">Mesa {{ lastValidatedGuest.table_number }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Información de acceso -->
          <div class="access-info-section">
            <div class="section-title">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>Información de Acceso</span>
            </div>
            
            <div class="access-timeline">
              <div class="timeline-item completed">
                <div class="timeline-icon">
                  <ion-icon name="qr-code-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <h4>QR Generado</h4>
                  <p>{{ formatDateTime(lastValidatedGuest.created_at || '') }}</p>
                </div>
              </div>

              <div class="timeline-item completed" v-if="lastValidatedGuest.sent_at">
                <div class="timeline-icon">
                  <ion-icon name="mail-outline"></ion-icon>
                </div>
                <div class="timeline-content">
                  <h4>Email Enviado</h4>
                  <p>{{ formatDateTime(lastValidatedGuest.sent_at || '') }}</p>
                </div>
              </div>

              <div class="timeline-item completed current">
                <div class="timeline-icon">
                  <ion-icon name="checkmark-circle"></ion-icon>
                </div>
                <div class="timeline-content">
                  <h4>Entrada Validada</h4>
                  <p>{{ formatDateTime(lastValidatedGuest.entered_at || '') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="detail-actions">
            <ion-button 
              expand="block" 
              fill="solid"
              @click="clearLastValidated"
              class="continue-btn"
            >
              <ion-icon name="scan-outline" slot="start"></ion-icon>
              Continuar Escaneando
            </ion-button>
          </div>
        </div>
      </div>

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
  closeCircleOutline,
  calendarOutline,
  locationOutline,
  callOutline,
  restaurantOutline,
  mailOutline,
  starOutline,
  checkmarkCircle
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

// NUEVO: Estado para el popup detallado
const lastValidatedGuest = ref<Guest | null>(null)

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

// NUEVA: Función para limpiar el último validado
const clearLastValidated = () => {
  lastValidatedGuest.value = null
}

// Función para cargar entradas recientes desde la base de datos
const loadRecentEntries = async () => {
  try {
    console.log('Cargando entradas recientes desde la base de datos...')
    
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
    successfulEntries.value = todaySuccessful
    
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

const onScanSuccess = async (decodedText: string) => {
  console.log('QR Code scanned:', decodedText)
  
  if (html5QrCode.value && scannerActive.value) {
    try {
      await html5QrCode.value.stop()
      scannerActive.value = false
      
      await validateScannedCode(decodedText)
      
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

const onScanFailure = (error: string) => {
  // No hacer nada - errores de escaneo son normales
}

const openManualQRInput = () => {
  showManualQR.value = true
  manualQRCode.value = ''
}

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
    
    let guestData: QRData | null = null
    
    try {
      guestData = JSON.parse(qrCode) as QRData
      console.log('QR decoded as direct JSON:', guestData)
    } catch (jsonError) {
      console.log('QR is not direct JSON, trying encrypted format...')
      
      try {
        // @ts-ignore
        const qrModule = await import('../services/qr.js')
        guestData = await qrModule.validateQRCode(qrCode)
        console.log('QR decoded as encrypted:', guestData)
      } catch (encryptError) {
        console.error('Failed to decode QR in both formats:', { jsonError, encryptError })
      }
    }
    
    if (!guestData) {
      showValidationResult('error', '❌ CÓDIGO NO VÁLIDO', 'El código QR no es válido o está corrupto')
      rejectedEntries.value++
      return
    }
    
    if (!guestData.id || !guestData.name || !guestData.email) {
      console.error('QR missing required fields:', guestData)
      showValidationResult('error', '❌ CÓDIGO INCOMPLETO', 'El código QR no contiene la información necesaria')
      rejectedEntries.value++
      return
    }
    
    console.log('Guest data decoded successfully:', guestData)
    
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
    
    recentEntries.value.unshift(updatedGuest)
    
    // ACTUALIZACIÓN: Establecer el último guest validado para el popup detallado
    lastValidatedGuest.value = updatedGuest
    
    showValidationResult(
      'success',
      '✅ BIENVENIDO/A',
      `¡Acceso permitido para ${guest.name}!`,
      updatedGuest
    )
    
    successfulEntries.value++
    showToast(`${guest.name} ha ingresado correctamente`, 'success')
    
    setTimeout(() => {
      validationResult.value.show = false
    }, 4000)
    
  } catch (error: any) {
    console.error('Error validating QR:', error)
    showValidationResult('error', '❌ ERROR DE VALIDACIÓN', 'Error al procesar el código QR: ' + error.message)
    rejectedEntries.value++
  }
}

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
    
    if (guest.has_entered) {
      showValidationResult(
        'warning',
        '⚠️ YA INGRESÓ ANTERIORMENTE',
        'Este invitado ya utilizó su entrada',
        guest
      )
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
    
    if (updateError) throw updateError
    
    const updatedGuest: Guest = {
      ...guest,
      has_entered: true,
      entered_at: madridTime
    }
    
    recentEntries.value.unshift(updatedGuest)
    lastValidatedGuest.value = updatedGuest
    
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

const showValidationResult = (type: 'success' | 'warning' | 'error', title: string, message: string, guest: Guest | null = null) => {
  validationResult.value = {
    show: true,
    type,
    title,
    message,
    guest
  }
}

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

const clearValidationStats = () => {
  if (confirm('¿Limpiar todas las estadísticas de validación?')) {
    totalValidations.value = 0
    successfulEntries.value = 0
    rejectedEntries.value = 0
    recentEntries.value = []
    lastValidatedGuest.value = null
    showToast('Estadísticas limpiadas', 'success')
  }
}

const refreshData = async () => {
  await Promise.all([
    loadRecentEntries(),
    loadTodayStats()
  ])
  showToast('Datos actualizados', 'success')
}

onMounted(async () => {
  console.log('ScanTab mounted - loading data...')
  
  await Promise.all([
    loadRecentEntries(),
    loadTodayStats()
  ])
})

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
/* Contenedor principal */
ion-content {
  --background: #f8f9fa;
}

/* Cards generales */
ion-card {
  background: white;
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: none;
}

ion-card-header {
  padding: 20px 20px 0 20px;
}

ion-card-title {
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

ion-card-content {
  padding: 20px;
}

/* Scanner */
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
  color: #6b7280;
}

.loading-container {
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error-container {
  color: #dc3545;
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

:deep(#qr-reader) {
  border: 2px solid #0d1b2a;
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

/* Botones principales */
ion-button {
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

ion-button[expand="block"] {
  margin: 16px 0 8px 0;
}

ion-button:not([fill]) {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --color: white;
}

ion-button[fill="outline"] {
  --border-color: #0d1b2a;
  --color: #0d1b2a;
  --background: transparent;
}

ion-button[color="danger"] {
  --background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
}

.manual-qr-btn {
  margin-top: 8px;
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

/* POPUP DETALLADO */
.validation-detail-card {
  background: white;
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.15);
  overflow: hidden;
  border: 2px solid #28a745;
  animation: slideInUp 0.4s ease-out;
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
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.success-icon {
  background: #28a745;
  width: 50px;
  height: 50px;
  border-radius: 50%;
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

/* Información principal del invitado */
.guest-main-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
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

.guest-email {
  margin: 0;
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Secciones del popup */
.event-details-section,
.access-info-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  color: #1f2937;
  font-weight: 600;
  font-size: 1.1rem;
}

.section-title ion-icon {
  font-size: 1.3rem;
  color: #0d1b2a;
}

/* Grid de detalles */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #0d1b2a;
}

.detail-item ion-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.detail-item div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
}

/* Timeline */
.access-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 20px;
  top: 50px;
  width: 2px;
  height: 16px;
  background: #e5e7eb;
}

.timeline-item.completed::after {
  background: #28a745;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.timeline-item.completed .timeline-icon {
  background: #28a745;
  color: white;
}

.timeline-item.current .timeline-icon {
  background: #0d1b2a;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.timeline-content h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}

.timeline-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Acciones del popup */
.detail-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.continue-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

/* Estadísticas */
.stat-card {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
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

.clear-stats-btn {
  margin: 1rem 0;
}

/* Items y inputs */
ion-item {
  --background: #f8f9fa;
  --border-radius: 8px;
  --border-color: #e5e7eb;
  margin-bottom: 16px;
}

ion-input, ion-textarea {
  --color: #1f2937;
  --placeholder-color: #9ca3af;
}

/* Avatares en entradas recientes */
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0d1b2a;
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
  color: #6b7280;
  font-style: italic;
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state ion-icon {
  margin-bottom: 1rem;
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

/* Chips */
ion-chip {
  font-weight: 600;
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  ion-card {
    margin: 12px 8px;
  }
  
  .scanner-container {
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
  
  .detail-grid {
    grid-template-columns: 1fr;
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
</style>