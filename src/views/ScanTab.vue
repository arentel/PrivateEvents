<template>
  <ion-page>
    <ion-content :fullscreen="true" class="scan-content">
      <div class="scan-container">
        
        <!-- Header -->
        <div class="page-header animate-fade-in-down">
          <div class="header-content">
            <h1>Escanear Entradas</h1>
            <p>Valida las invitaciones al evento</p>
          </div>
          <ion-button 
            fill="clear"
            @click="refreshData"
            class="refresh-btn"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- Selector de Evento -->
        <div class="event-selector-section animate-fade-in">
          <div class="section-header">
            <h3>Evento Activo</h3>
            <ion-button 
              fill="outline" 
              size="small"
              @click="showEventModal = true"
              class="change-event-btn"
            >
              <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
              Cambiar Evento
            </ion-button>
          </div>
          
          <div v-if="selectedEvent" class="current-event-card">
            <div class="event-badge">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <div class="event-info">
              <h4>{{ selectedEvent.name }}</h4>
              <p class="event-date">
                <ion-icon :icon="timeOutline"></ion-icon>
                {{ formatDate(selectedEvent.date) }}
              </p>
              <p class="event-location" v-if="selectedEvent.location">
                <ion-icon :icon="locationOutline"></ion-icon>
                {{ selectedEvent.location }}
              </p>
            </div>
          </div>
        </div>

        <!-- Estadísticas en tiempo real -->
        <div class="stats-section animate-fade-in-up delay-100">
          <div class="stats-grid">
            <div class="stat-card stat-total">
              <div class="stat-icon">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </div>

            <div class="stat-card stat-scanned">
              <div class="stat-icon">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.scanned }}</div>
                <div class="stat-label">Han Entrado</div>
              </div>
            </div>

            <div class="stat-card stat-pending">
              <div class="stat-icon">
                <ion-icon :icon="qrCodeOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>

            <div class="stat-card stat-progress">
              <div class="stat-icon">
                <ion-icon :icon="statsChartOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ progressPercentage }}%</div>
                <div class="stat-label">Asistencia</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scanner Section -->
        <div class="scanner-section animate-fade-in-up delay-200">
          <div class="scanner-card">
            <div class="scanner-header">
              <h3>
                <ion-icon :icon="qrCodeOutline"></ion-icon>
                Escáner QR
              </h3>
              <!-- REEMPLÁZALO POR ESTO: -->
              <ion-toggle 
                :checked="scannerActive"
                @ionChange="toggleScanner"
                :disabled="!selectedEvent"
              >
                {{ scannerActive ? 'Activo' : 'Inactivo' }}
              </ion-toggle>
            </div>

            <div v-if="!selectedEvent" class="scanner-warning">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              <p>Selecciona un evento para activar el escáner</p>
            </div>

            <!-- CRÍTICO: Video siempre en el DOM, usar v-show en lugar de v-if -->
            <div class="scanner-wrapper">
              <!-- Scanner Activo -->
              <div class="scanner-active" v-show="scannerActive">
                <!-- Video del escáner - SIEMPRE en el DOM -->
                <div class="scanner-viewport">
                  <video 
                    ref="videoElement" 
                    class="scanner-video"
                    autoplay 
                    playsinline
                    muted
                  ></video>
                  <div class="scanner-overlay">
                    <div class="scanner-frame"></div>
                    <p class="scanner-instruction">Coloca el QR dentro del marco</p>
                  </div>
                </div>

                <!-- Estado del escáner -->
                <div class="scanner-status" :class="scanStatus">
                  <ion-spinner v-if="scanning" name="crescent"></ion-spinner>
                  <ion-icon v-else-if="scanStatus === 'success'" :icon="checkmarkCircleOutline"></ion-icon>
                  <ion-icon v-else-if="scanStatus === 'error'" :icon="closeCircleOutline"></ion-icon>
                  <ion-icon v-else :icon="qrCodeOutline"></ion-icon>
                  <span>{{ scanMessage }}</span>
                </div>
              </div>

              <!-- Scanner Inactivo -->
              <div v-show="!scannerActive && selectedEvent" class="scanner-inactive">
                <div class="scanner-icon">
                  <ion-icon :icon="qrCodeOutline"></ion-icon>
                </div>
                <p>Activa el escáner para validar entradas</p>
                <ion-button 
                  @click="activateScanner" 
                  :disabled="!selectedEvent"
                  class="activate-btn"
                >
                  <ion-icon :icon="scanOutline" slot="start"></ion-icon>
                  Activar Escáner
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Opciones adicionales -->
          <div class="scanner-options">
            <ion-button 
              expand="block"
              fill="outline"
              @click="showManualEntryModal = true"
              :disabled="!selectedEvent"
              class="manual-entry-btn"
            >
              <ion-icon :icon="createOutline" slot="start"></ion-icon>
              Entrada Manual
            </ion-button>
          </div>
        </div>

        <!-- Últimos escaneos -->
        <div v-if="recentScans.length > 0" class="recent-scans-section animate-fade-in-up delay-300">
          <div class="section-header">
            <h3>Últimos Escaneos</h3>
            <ion-button 
              fill="clear" 
              size="small"
              @click="clearRecentScans"
            >
              Limpiar
            </ion-button>
          </div>

          <div class="recent-scans-list">
            <div 
              v-for="scan in recentScans" 
              :key="scan.id"
              class="scan-item"
              :class="scan.status"
            >
              <div class="scan-icon">
                <ion-icon 
                  v-if="scan.status === 'success'" 
                  :icon="checkmarkCircleOutline"
                  color="success"
                ></ion-icon>
                <ion-icon 
                  v-else-if="scan.status === 'duplicate'" 
                  :icon="alertCircleOutline"
                  color="warning"
                ></ion-icon>
                <ion-icon 
                  v-else 
                  :icon="closeCircleOutline"
                  color="danger"
                ></ion-icon>
              </div>

              <div class="scan-info">
                <h4>{{ scan.guestName }}</h4>
                <p class="scan-time">{{ formatTime(scan.timestamp) }}</p>
                <p class="scan-status-text">{{ scan.message }}</p>
              </div>

              <ion-badge 
                :color="scan.status === 'success' ? 'success' : scan.status === 'duplicate' ? 'warning' : 'danger'"
              >
                {{ scan.status === 'success' ? 'VÁLIDO' : scan.status === 'duplicate' ? 'DUPLICADO' : 'ERROR' }}
              </ion-badge>
            </div>
          </div>
        </div>

        <!-- Lista de invitados escaneados -->
        <div v-if="scannedGuests.length > 0" class="scanned-guests-section animate-fade-in-up delay-400">
          <div class="section-header">
            <h3>Invitados en el Evento ({{ scannedGuests.length }})</h3>
            <ion-searchbar
              v-model="searchTerm"
              placeholder="Buscar..."
              :debounce="300"
              class="compact-search"
            ></ion-searchbar>
          </div>

          <div class="scanned-guests-list">
            <div 
              v-for="guest in filteredScannedGuests" 
              :key="guest.id"
              class="guest-item"
            >
              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>

              <div class="guest-info">
                <h4>{{ guest.name }}</h4>
                <p class="guest-email">
                  <ion-icon :icon="mailOutline"></ion-icon>
                  {{ guest.email }}
                </p>
                <p class="guest-timestamp">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  Entrada: {{ formatDateTime(guest.entered_at) }}
                </p>
              </div>

              <ion-badge color="success">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                DENTRO
              </ion-badge>
            </div>
          </div>
        </div>

      </div>

      <!-- ========================================
           MODAL: SELECCIONAR EVENTO
           ======================================== -->
      <div v-if="showEventModal" class="custom-modal-overlay" @click="showEventModal = false">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Seleccionar Evento</h2>
            <button class="close-modal-btn" @click="showEventModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <div class="events-list">
              <div 
                v-for="event in events" 
                :key="event.id"
                class="event-option"
                :class="{ 'selected': selectedEvent?.id === event.id }"
                @click="selectEvent(event)"
              >
                <div class="event-option-icon">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                </div>
                <div class="event-option-info">
                  <h4>{{ event.name }}</h4>
                  <p>{{ formatDate(event.date) }}</p>
                </div>
                <ion-icon 
                  v-if="selectedEvent?.id === event.id"
                  :icon="checkmarkCircleOutline" 
                  class="check-icon"
                  color="success"
                ></ion-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================
           MODAL: ENTRADA MANUAL
           ======================================== -->
      <div v-if="showManualEntryModal" class="custom-modal-overlay" @click="closeManualEntryModal">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Entrada Manual</h2>
            <button class="close-modal-btn" @click="closeManualEntryModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <p class="modal-description">Busca al invitado por nombre o email</p>

            <div class="form-group">
              <label>Buscar invitado</label>
              <input
                v-model="manualSearchTerm"
                type="text"
                placeholder="Nombre o email..."
                class="form-input"
                @input="searchGuestsForManualEntry"
              />
            </div>

            <div v-if="manualSearchResults.length > 0" class="search-results">
              <div 
                v-for="guest in manualSearchResults" 
                :key="guest.id"
                class="result-item"
                :class="{ 'disabled': guest.has_entered }"
                @click="selectGuestForManualEntry(guest)"
              >
                <div class="result-avatar">
                  {{ guest.name.charAt(0).toUpperCase() }}
                </div>
                <div class="result-info">
                  <h4>{{ guest.name }}</h4>
                  <p>{{ guest.email }}</p>
                </div>
                <ion-badge 
                  :color="guest.has_entered ? 'warning' : 'success'"
                >
                  {{ guest.has_entered ? 'YA ENTRÓ' : 'PENDIENTE' }}
                </ion-badge>
              </div>
            </div>

            <div v-else-if="manualSearchTerm.length > 2" class="no-results">
              <ion-icon :icon="searchOutline"></ion-icon>
              <p>No se encontraron invitados</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================
           MODAL: RESULTADO DEL ESCANEO
           ======================================== -->
      <div v-if="showResultModal" class="custom-modal-overlay result-modal-overlay">
        <div class="custom-modal result-modal" :class="resultModalType" @click="closeResultModal">
          <div class="result-icon">
            <ion-icon 
              v-if="resultModalType === 'success'" 
              :icon="checkmarkCircleOutline"
            ></ion-icon>
            <ion-icon 
              v-else-if="resultModalType === 'duplicate'" 
              :icon="alertCircleOutline"
            ></ion-icon>
            <ion-icon 
              v-else 
              :icon="closeCircleOutline"
            ></ion-icon>
          </div>

          <div class="result-content">
            <h2>{{ resultModalTitle }}</h2>
            <p>{{ resultModalMessage }}</p>
            <p v-if="resultModalGuestName" class="guest-name">{{ resultModalGuestName }}</p>
            <p v-if="resultModalTimestamp" class="timestamp">{{ resultModalTimestamp }}</p>
          </div>

          <ion-button 
            expand="block"
            @click="closeResultModal"
            :color="resultModalType === 'success' ? 'success' : resultModalType === 'duplicate' ? 'warning' : 'danger'"
          >
            Continuar
          </ion-button>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated, watch, nextTick } from 'vue'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonToggle,
  IonSearchbar,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import {
  qrCodeOutline,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  timeOutline,
  calendarOutline,
  locationOutline,
  closeOutline,
  refreshOutline,
  scanOutline,
  createOutline,
  mailOutline,
  searchOutline,
  statsChartOutline
} from 'ionicons/icons'
// @ts-ignore
import { supabase } from '@/services/supabase.js'
// @ts-ignore
import eventsStore from '@/stores/events'
import { useHaptics } from '@/composables/useHaptics'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'

// ========================================
// COMPOSABLES
// ========================================
const { vibrate } = useHaptics()

// ========================================
// ESTADOS
// ========================================
const loading = ref(true)
const scannerActive = ref(false)
const scanning = ref(false)
const scanStatus = ref<'idle' | 'scanning' | 'success' | 'error' | 'duplicate'>('idle')
const scanMessage = ref('Listo para escanear')

// Modales
const showEventModal = ref(false)
const showManualEntryModal = ref(false)
const showResultModal = ref(false)

// Datos
const guests = ref<any[]>([])
const scannedGuests = ref<any[]>([])
const recentScans = ref<any[]>([])
const searchTerm = ref('')
const manualSearchTerm = ref('')
const manualSearchResults = ref<any[]>([])

// Scanner - CRÍTICO: ref correcto
const videoElement = ref<HTMLVideoElement | null>(null)
let codeReader: BrowserMultiFormatReader | null = null
let activeControls: any = null // Para guardar los controles del scanner

// Modal de resultado
const resultModalType = ref<'success' | 'duplicate' | 'error'>('success')
const resultModalTitle = ref('')
const resultModalMessage = ref('')
const resultModalGuestName = ref('')
const resultModalTimestamp = ref('')

// ========================================
// COMPUTED PROPERTIES
// ========================================
const events = computed(() => eventsStore.events)
const selectedEvent = computed(() => eventsStore.currentEvent)

// Estadísticas
const stats = computed(() => {
  const total = guests.value.length
  const scanned = guests.value.filter(g => g.has_entered).length
  const pending = total - scanned

  return { total, scanned, pending }
})

const progressPercentage = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.scanned / stats.value.total) * 100)
})

// Filtrar invitados escaneados
const filteredScannedGuests = computed(() => {
  if (!searchTerm.value.trim()) return scannedGuests.value

  const search = searchTerm.value.toLowerCase().trim()
  return scannedGuests.value.filter(guest =>
    guest.name.toLowerCase().includes(search) ||
    guest.email.toLowerCase().includes(search)
  )
})

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================
const loadGuests = async () => {
  if (!selectedEvent.value) {
    guests.value = []
    scannedGuests.value = []
    loading.value = false
    return
  }

  loading.value = true

  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', selectedEvent.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    guests.value = data || []
    scannedGuests.value = guests.value.filter(g => g.has_entered)
    
    console.log('✅ Invitados cargados:', guests.value.length)
    console.log('📊 Ya escaneados:', scannedGuests.value.length)
    
  } catch (error) {
    console.error('Error cargando invitados:', error)
    await vibrate('error')
    showToast('Error al cargar invitados', 'danger')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await vibrate('light')
  await loadGuests()
  showToast('Datos actualizados', 'success')
}

// ========================================
// FUNCIONES DE EVENTOS
// ========================================
const selectEvent = async (event: any) => {
  // Detener scanner si está activo
  if (scannerActive.value) {
    await stopScanner()
  }

  eventsStore.setCurrentEvent(event.id)
  showEventModal.value = false
  await vibrate('light')
  recentScans.value = []
  await loadGuests()
}

// ========================================
// FUNCIONES DEL SCANNER - COMPLETAMENTE CORREGIDAS
// ========================================
const initializeScanner = () => {
  try {
    if (!codeReader) {
      codeReader = new BrowserMultiFormatReader()
      console.log('✅ Scanner inicializado')
    }
  } catch (error) {
    console.error('❌ Error inicializando scanner:', error)
    throw error
  }
}

const startScanner = async () => {
  console.log('🎬 Iniciando startScanner...')
  
  if (!selectedEvent.value) {
    showToast('Selecciona un evento primero', 'warning')
    return
  }

  // Inicializar scanner si no existe
  if (!codeReader) {
    initializeScanner()
  }

  try {
    // Esperar a que el DOM se actualice
    await nextTick()

    // CRÍTICO: Verificar que el elemento de video existe
    console.log('📹 Video element ref:', videoElement.value)
    
    if (!videoElement.value) {
      throw new Error('Video element no disponible. Esperando DOM...')
    }

    console.log('🎥 Listando dispositivos de video...')
    
    // Listar cámaras disponibles
    const videoInputDevices = await codeReader!.listVideoInputDevices()
    
    if (videoInputDevices.length === 0) {
      throw new Error('No se encontraron cámaras disponibles')
    }

    console.log(`📷 ${videoInputDevices.length} cámara(s) disponible(s):`)
    videoInputDevices.forEach((device, index) => {
      console.log(`  [${index}] ${device.label || device.deviceId}`)
    })

    // Seleccionar cámara (preferir trasera)
    const selectedDevice = videoInputDevices.find(device => {
      const label = device.label.toLowerCase()
      return label.includes('back') || 
             label.includes('rear') || 
             label.includes('trasera') || 
             label.includes('posterior') ||
             label.includes('environment')
    }) || videoInputDevices[0]

    console.log('✅ Cámara seleccionada:', selectedDevice.label || selectedDevice.deviceId)

    // Iniciar decodificación
    console.log('🔄 Iniciando decodificación desde cámara...')
    
    activeControls = await codeReader!.decodeFromVideoDevice(
      selectedDevice.deviceId,
      videoElement.value,
      (result: any, error: any) => {
        if (result) {
          const text = result.getText()
          console.log('🎯 QR DETECTADO:', text)
          handleScan(text)
        }
        
        // Solo mostrar errores relevantes (no NotFoundException)
        if (error && !(error instanceof NotFoundException)) {
          console.warn('⚠️ Error scanner:', error.message || error)
        }
      }
    )

    // Actualizar estados
    scannerActive.value = true
    scanStatus.value = 'scanning'
    scanMessage.value = 'Escaneando...'
    
    console.log('✅ Scanner ACTIVO y funcionando')
    console.log('📺 Stream de video:', videoElement.value.srcObject ? 'ACTIVO' : 'INACTIVO')
    
    await vibrate('light')
    showToast('Scanner activado correctamente', 'success')

  } catch (error: any) {
    console.error('❌ ERROR COMPLETO:', error)
    console.error('📍 Stack trace:', error.stack)
    
    let errorMessage = 'Error al activar el scanner'
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso.'
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No se encontró ninguna cámara'
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'La cámara está siendo usada por otra aplicación'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    showToast(errorMessage, 'danger')
    await vibrate('error')
    scannerActive.value = false
  }
}

const stopScanner = async () => {
  console.log('⏹️ Deteniendo scanner...')
  
  try {
    // Detener controles activos
    if (activeControls) {
      activeControls.stop()
      activeControls = null
    }

    // Reset del code reader
    if (codeReader) {
      codeReader.reset()
    }

    // Limpiar video element
    if (videoElement.value) {
      const stream = videoElement.value.srcObject as MediaStream
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop()
          console.log('🛑 Track detenido:', track.label)
        })
      }
      videoElement.value.srcObject = null
    }

    scannerActive.value = false
    scanStatus.value = 'idle'
    scanMessage.value = 'Scanner detenido'
    
    console.log('✅ Scanner detenido correctamente')
  } catch (error) {
    console.error('Error deteniendo scanner:', error)
  }
}

// BUSCA ESTA FUNCIÓN Y REEMPLÁZALA:
const toggleScanner = async (event: any) => {
  console.log('🔄 Toggle scanner:', event.detail.checked)
  
  // Prevenir que el toggle cambie automáticamente
  if (event.detail.checked) {
    // Activar scanner
    await startScanner()
  } else {
    // Desactivar scanner
    await stopScanner()
  }
}

const activateScanner = async () => {
  await startScanner()
}

// ========================================
// PROCESAMIENTO DEL QR
// ========================================
const handleScan = async (qrData: string) => {
  if (scanning.value) {
    console.log('⏳ Ya procesando un escaneo, ignorando...')
    return
  }

  scanning.value = true
  scanStatus.value = 'scanning'
  scanMessage.value = 'Procesando...'

  try {
    console.log('📱 QR escaneado:', qrData)
    await vibrate('light')

    // Parsear datos del QR
    let guestData: any
    try {
      guestData = JSON.parse(qrData)
    } catch {
      throw new Error('QR inválido: formato incorrecto')
    }

    // Validar campos necesarios
    if (!guestData.id || !guestData.email) {
      throw new Error('QR inválido: faltan datos')
    }

    // Verificar evento seleccionado
    if (!selectedEvent.value) {
      throw new Error('No hay evento seleccionado')
    }

    // Validar evento del QR
    if (guestData.eventId !== selectedEvent.value.id) {
      throw new Error('Este QR no pertenece al evento actual')
    }

    // Buscar invitado en BD
    const { data: guestRecord, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestData.id)
      .eq('event_id', selectedEvent.value.id)
      .single()

    if (fetchError || !guestRecord) {
      throw new Error('Invitado no encontrado en el evento')
    }

    // Verificar si ya entró
    if (guestRecord.has_entered) {
      scanStatus.value = 'duplicate'
      scanMessage.value = 'Ya escaneado anteriormente'
      await vibrate('warning')

      addRecentScan({
        id: Date.now().toString(),
        guestName: guestRecord.name,
        timestamp: new Date().toISOString(),
        status: 'duplicate',
        message: `Ya había entrado el ${formatDateTime(guestRecord.entered_at)}`
      })

      showResultModalWithData(
        'duplicate',
        'Entrada Duplicada',
        'Este invitado ya había ingresado al evento',
        guestRecord.name,
        `Primera entrada: ${formatDateTime(guestRecord.entered_at)}`
      )

      return
    }

    // Marcar como entrado
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        has_entered: true,
        entered_at: new Date().toISOString()
      })
      .eq('id', guestData.id)

    if (updateError) throw updateError

    // Éxito
    scanStatus.value = 'success'
    scanMessage.value = '✓ Entrada válida'
    await vibrate('success')

    addRecentScan({
      id: Date.now().toString(),
      guestName: guestRecord.name,
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Entrada registrada correctamente'
    })

    showResultModalWithData(
      'success',
      '¡Bienvenido!',
      'Entrada registrada correctamente',
      guestRecord.name,
      formatDateTime(new Date().toISOString())
    )

    await loadGuests()

  } catch (error: any) {
    console.error('❌ Error procesando QR:', error)
    
    scanStatus.value = 'error'
    scanMessage.value = 'Error: ' + error.message
    await vibrate('error')

    addRecentScan({
      id: Date.now().toString(),
      guestName: 'Error',
      timestamp: new Date().toISOString(),
      status: 'error',
      message: error.message
    })

    showResultModalWithData(
      'error',
      'Error de Validación',
      error.message,
      '',
      ''
    )
  } finally {
    scanning.value = false
    
    // Resetear estado después de 2 segundos
    setTimeout(() => {
      if (scannerActive.value) {
        scanStatus.value = 'scanning'
        scanMessage.value = 'Escaneando...'
      }
    }, 2000)
  }
}

// ========================================
// ENTRADA MANUAL
// ========================================
const closeManualEntryModal = () => {
  showManualEntryModal.value = false
  manualSearchTerm.value = ''
  manualSearchResults.value = []
}

const searchGuestsForManualEntry = () => {
  if (!manualSearchTerm.value.trim() || manualSearchTerm.value.length < 2) {
    manualSearchResults.value = []
    return
  }

  const search = manualSearchTerm.value.toLowerCase().trim()
  manualSearchResults.value = guests.value
    .filter(guest =>
      guest.name.toLowerCase().includes(search) ||
      guest.email.toLowerCase().includes(search)
    )
    .slice(0, 10)
}

const selectGuestForManualEntry = async (guest: any) => {
  if (guest.has_entered) {
    await vibrate('warning')
    
    const alert = await alertController.create({
      header: 'Invitado ya ingresó',
      message: `${guest.name} ya había ingresado el ${formatDateTime(guest.entered_at)}`,
      buttons: ['OK']
    })
    
    await alert.present()
    return
  }

  await vibrate('light')

  const alert = await alertController.create({
    header: 'Confirmar entrada',
    message: `¿Permitir entrada a ${guest.name}?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Confirmar',
        handler: async () => {
          await registerManualEntry(guest)
        }
      }
    ]
  })

  await alert.present()
}

const registerManualEntry = async (guest: any) => {
  try {
    const { error } = await supabase
      .from('guests')
      .update({
        has_entered: true,
        entered_at: new Date().toISOString()
      })
      .eq('id', guest.id)

    if (error) throw error

    await vibrate('success')
    showToast(`✓ Entrada registrada para ${guest.name}`, 'success')

    addRecentScan({
      id: Date.now().toString(),
      guestName: guest.name,
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Entrada manual registrada'
    })

    closeManualEntryModal()
    await loadGuests()

  } catch (error: any) {
    console.error('Error registrando entrada manual:', error)
    await vibrate('error')
    showToast('Error al registrar entrada', 'danger')
  }
}

// ========================================
// MODAL DE RESULTADOS
// ========================================
const showResultModalWithData = (
  type: 'success' | 'duplicate' | 'error',
  title: string,
  message: string,
  guestName: string,
  timestamp: string
) => {
  resultModalType.value = type
  resultModalTitle.value = title
  resultModalMessage.value = message
  resultModalGuestName.value = guestName
  resultModalTimestamp.value = timestamp
  showResultModal.value = true
}

const closeResultModal = () => {
  showResultModal.value = false
}

// ========================================
// ESCANEOS RECIENTES
// ========================================
const addRecentScan = (scan: any) => {
  recentScans.value.unshift(scan)
  
  if (recentScans.value.length > 10) {
    recentScans.value = recentScans.value.slice(0, 10)
  }
}

const clearRecentScans = () => {
  recentScans.value = []
}

// ========================================
// FUNCIONES DE UTILIDADES
// ========================================
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2500,
    color,
    position: 'top'
  })
  await toast.present()
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const formatTime = (dateString: string) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

// ========================================
// WATCHERS
// ========================================
watch(() => selectedEvent.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadGuests()
  }
})

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('📱 ScanTab montado')
  
  if (events.value.length === 0) {
    await eventsStore.init()
  }
  
  if (selectedEvent.value) {
    await loadGuests()
  } else {
    loading.value = false
  }
})

onActivated(async () => {
  console.log('🔄 ScanTab activado')
  
  if (selectedEvent.value) {
    await loadGuests()
  }
})

onDeactivated(async () => {
  console.log('⏸️ ScanTab desactivado - deteniendo scanner')
  
  if (scannerActive.value) {
    await stopScanner()
  }
})

onUnmounted(async () => {
  console.log('🔚 ScanTab desmontado - limpiando recursos')
  
  if (scannerActive.value) {
    await stopScanner()
  }
})
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.scan-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.scan-content {
  --background: #f8f9fa;
}

/* ========================================
   HEADER
   ======================================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.header-content {
  flex: 1;
}

.header-content h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.header-content p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.refresh-btn {
  --color: #667eea;
  --padding-start: 12px;
  --padding-end: 12px;
}

/* ========================================
   SELECTOR DE EVENTO
   ======================================== */
.event-selector-section {
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
}

.change-event-btn {
  --border-radius: 8px;
  font-weight: 600;
  --border-width: 2px;
  --border-color: #667eea;
  --color: #667eea;
}

.current-event-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.current-event-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.event-badge {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  word-wrap: break-word;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.event-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
}

.event-detail-row ion-icon {
  color: #667eea;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.event-detail-row span {
  flex: 1;
  word-wrap: break-word;
}

/* Mantener compatibilidad con el formato anterior */
.event-date,
.event-location {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 4px 0;
  color: #6b7280;
  font-size: 0.85rem;
  line-height: 1.4;
}

.event-date ion-icon,
.event-location ion-icon {
  color: #667eea;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ========================================
   ESTADÍSTICAS
   ======================================== */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-total {
  border-left-color: #667eea;
}

.stat-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-scanned {
  border-left-color: #10b981;
}

.stat-scanned .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-pending {
  border-left-color: #fbbf24;
}

.stat-pending .stat-icon {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.stat-progress {
  border-left-color: #0ea5e9;
}

.stat-progress .stat-icon {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ========================================
   SCANNER SECTION
   ======================================== */
.scanner-section {
  margin-bottom: 24px;
}

.scanner-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.scanner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.scanner-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.scanner-header ion-toggle {
  --background: #e5e7eb;
  --background-checked: #10b981;
  --handle-background: white;
  --handle-background-checked: white;
}

/* Scanner Wrapper */
.scanner-wrapper {
  position: relative;
  min-height: 400px;
}

/* Scanner Warning */
.scanner-warning {
  text-align: center;
  padding: 40px 20px;
  background: #fef3c7;
  border: 2px solid #fbbf24;
  border-radius: 8px;
}

.scanner-warning ion-icon {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 12px;
}

.scanner-warning p {
  margin: 0;
  color: #92400e;
  font-weight: 500;
}

/* Scanner Activo */
.scanner-active {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scanner-viewport {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  background: #000;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.scanner-frame {
  width: 250px;
  height: 250px;
  border: 3px solid #10b981;
  border-radius: 12px;
  box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    border-color: #10b981;
    box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.5);
  }
  50% {
    border-color: #059669;
    box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.8);
  }
}

.scanner-instruction {
  margin-top: 20px;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  text-align: center;
  padding: 0 20px;
}

/* Scanner Status */
.scanner-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6b7280;
  transition: all 0.3s ease;
}

.scanner-status.scanning {
  border-left-color: #0ea5e9;
  background: #f0f9ff;
}

.scanner-status.success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.scanner-status.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.scanner-status.duplicate {
  border-left-color: #fbbf24;
  background: #fef3c7;
}

.scanner-status ion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.scanner-status.scanning ion-icon {
  color: #0ea5e9;
}

.scanner-status.success ion-icon {
  color: #10b981;
}

.scanner-status.error ion-icon {
  color: #ef4444;
}

.scanner-status.duplicate ion-icon {
  color: #fbbf24;
}

.scanner-status span {
  flex: 1;
  font-weight: 500;
  color: #1f2937;
}

/* Scanner Inactivo */
.scanner-inactive {
  text-align: center;
  padding: 60px 20px;
}

.scanner-icon {
  font-size: 4rem;
  color: #9ca3af;
  margin-bottom: 20px;
}

.scanner-inactive p {
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 1rem;
}

.activate-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
}

/* Opciones del Scanner */
.scanner-options {
  margin-top: 16px;
}

.manual-entry-btn {
  --border-radius: 8px;
  font-weight: 600;
  --border-width: 2px;
  --border-color: #0d1b2a;
  --color: #0d1b2a;
}

/* ========================================
   ESCANEOS RECIENTES
   ======================================== */
.recent-scans-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.recent-scans-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scan-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s ease;
}

.scan-item.success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #f8f9fa 100%);
}

.scan-item.duplicate {
  border-left-color: #fbbf24;
  background: linear-gradient(135deg, #fef3c7 0%, #f8f9fa 100%);
}

.scan-item.error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #f8f9fa 100%);
}

.scan-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.scan-info {
  flex: 1;
  min-width: 0;
}

.scan-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  word-wrap: break-word;
}

.scan-time {
  margin: 2px 0;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.scan-status-text {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  word-wrap: break-word;
}

/* ========================================
   INVITADOS ESCANEADOS
   ======================================== */
.scanned-guests-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.compact-search {
  margin-top: 12px;
  --background: #f8f9fa;
  --border-radius: 8px;
  --box-shadow: none;
}

.scanned-guests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f0fdf4;
  border-radius: 12px;
  border-left: 4px solid #10b981;
  transition: all 0.3s ease;
}

.guest-item:hover {
  background: #dcfce7;
  transform: translateX(4px);
}

.guest-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.guest-info {
  flex: 1;
  min-width: 0;
}

.guest-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  word-wrap: break-word;
}

.guest-email,
.guest-timestamp {
  margin: 2px 0;
  color: #6b7280;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  word-wrap: break-word;
}

.guest-timestamp {
  color: #059669;
  font-weight: 500;
}

/* ========================================
   MODALES PERSONALIZADOS
   ======================================== */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

.custom-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-modal-header {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.custom-modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* Lista de eventos en modal */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-option:hover {
  background: #f1f3f4;
  border-color: #667eea;
  transform: translateX(4px);
}

.event-option.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: #667eea;
}

.event-option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.event-option-info {
  flex: 1;
  min-width: 0;
}

.event-option-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  word-wrap: break-word;
}

.event-option-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  word-wrap: break-word;
}

.check-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* Modal de entrada manual */
.modal-description {
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Resultados de búsqueda */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.result-item:hover:not(.disabled) {
  background: #e5e7eb;
  transform: translateX(4px);
}

.result-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-info h4 {
  margin: 0 0 2px 0;
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 600;
  word-wrap: break-word;
}

.result-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
  word-wrap: break-word;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-results ion-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-results p {
  margin: 0;
  font-size: 0.95rem;
}

/* ========================================
   MODAL DE RESULTADO (ESCANEO)
   ======================================== */
.result-modal-overlay {
  z-index: 20000;
}

.result-modal {
  max-width: 400px;
  text-align: center;
  padding: 40px 32px;
}

.result-modal.success {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.result-modal.duplicate {
  background: linear-gradient(135deg, #fef3c7 0%, #ffffff 100%);
}

.result-modal.error {
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.result-icon {
  font-size: 5rem;
  margin-bottom: 24px;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.result-modal.success .result-icon {
  color: #10b981;
}

.result-modal.duplicate .result-icon {
  color: #fbbf24;
}

.result-modal.error .result-icon {
  color: #ef4444;
}

.result-content h2 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 700;
}

.result-content p {
  margin: 8px 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.result-content .guest-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 16px 0;
}

.result-content .timestamp {
  font-size: 0.9rem;
  color: #9ca3af;
  font-style: italic;
}

.result-modal ion-button {
  margin-top: 24px;
  font-weight: 600;
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .scan-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .scanner-viewport {
    max-width: 100%;
  }

  .scanner-frame {
    width: 200px;
    height: 200px;
  }

  .current-event-card {
    padding: 16px;
    gap: 12px;
  }

  .event-badge {
    width: 48px;
    height: 48px;
    font-size: 1.5rem;
  }

  .event-info h4 {
    font-size: 1rem;
  }

  .event-detail-row,
  .event-date,
  .event-location {
    font-size: 0.8rem;
  }

  .event-detail-row ion-icon,
  .event-date ion-icon,
  .event-location ion-icon {
    font-size: 0.9rem;
  }

.custom-modal {
    max-width: 100%;
    margin: 0;
    border-radius: 16px 16px 0 0;
    max-height: 95vh;
  }

  .custom-modal-header {
    padding: 20px;
  }

  .custom-modal-content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .scan-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-content p {
    font-size: 0.9rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .scanner-frame {
    width: 180px;
    height: 180px;
  }

  .scanner-instruction {
    font-size: 0.85rem;
  }

  .guest-avatar,
  .result-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .guest-info h4,
  .result-info h4 {
    font-size: 0.95rem;
  }

  .result-modal {
    padding: 32px 24px;
  }

  .result-icon {
    font-size: 4rem;
  }

  .result-content h2 {
    font-size: 1.3rem;
  }

  .event-selector-section,
  .scanner-card,
  .recent-scans-section,
  .scanned-guests-section {
    padding: 20px;
  }

  .scanner-wrapper {
    min-height: 350px;
  }

  .scanner-viewport {
    aspect-ratio: 1;
  }
}

/* ========================================
   ANIMACIONES
   ======================================== */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

.animate-fade-in-down {
  animation: fadeInDown 0.5s ease-out;
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}

.delay-300 {
  animation-delay: 300ms;
}

.delay-400 {
  animation-delay: 400ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================================
   ACCESIBILIDAD
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .scanner-frame {
    animation: none;
  }
}

/* ========================================
   MODO OSCURO
   ======================================== */
@media (prefers-color-scheme: dark) {
  .scan-content {
    --background: #1a1a1a;
  }

  .page-header,
  .event-selector-section,
  .stats-section .stat-card,
  .scanner-card,
  .recent-scans-section,
  .scanned-guests-section {
    background: #2d2d2d;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .header-content h1,
  .section-header h3,
  .scanner-header h3,
  .guest-info h4,
  .scan-info h4,
  .result-info h4 {
    color: #f9fafb;
  }

  .header-content p,
  .event-date,
  .event-location,
  .event-detail-row,
  .stat-label,
  .guest-email,
  .guest-timestamp,
  .scan-time,
  .scan-status-text,
  .result-info p {
    color: #9ca3af;
  }

  .current-event-card,
  .scan-item,
  .guest-item,
  .event-option,
  .result-item,
  .scanner-status {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }

  .scan-item.success,
  .guest-item {
    background: linear-gradient(135deg, #1e3a2a 0%, #3a3a3a 100%);
  }

  .scan-item.duplicate {
    background: linear-gradient(135deg, #3a2e1a 0%, #3a3a3a 100%);
  }

  .scan-item.error {
    background: linear-gradient(135deg, #3a1e1e 0%, #3a3a3a 100%);
  }

  .scanner-status {
    background: #3a3a3a;
  }

  .scanner-status.scanning {
    background: #1e3a4a;
  }

  .scanner-status.success {
    background: #1e3a2a;
  }

  .scanner-status.error {
    background: #3a1e1e;
  }

  .scanner-status.duplicate {
    background: #3a2e1a;
  }

  .scanner-warning {
    background: #3a2e1a;
    border-color: #f59e0b;
  }

  .scanner-warning p {
    color: #fbbf24;
  }

  .form-input {
    background: #2d2d2d;
    border-color: #4a4a4a;
    color: #f9fafb;
  }

  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .custom-modal {
    background: #2d2d2d;
  }

  .custom-modal-content {
    background: #2d2d2d;
  }

  .result-modal.success {
    background: linear-gradient(135deg, #1e3a2a 0%, #2d2d2d 100%);
  }

  .result-modal.duplicate {
    background: linear-gradient(135deg, #3a2e1a 0%, #2d2d2d 100%);
  }

  .result-modal.error {
    background: linear-gradient(135deg, #3a1e1e 0%, #2d2d2d 100%);
  }

  .result-content h2,
  .result-content .guest-name {
    color: #f9fafb;
  }

  .result-content p,
  .result-content .timestamp {
    color: #9ca3af;
  }

  .no-results {
    color: #9ca3af;
  }

  .modal-description {
    color: #9ca3af;
  }

  .form-group label {
    color: #f9fafb;
  }
}

/* ========================================
   SCROLLBAR PERSONALIZADO
   ======================================== */
.custom-modal-content::-webkit-scrollbar,
.search-results::-webkit-scrollbar,
.scanned-guests-list::-webkit-scrollbar {
  width: 8px;
}

.custom-modal-content::-webkit-scrollbar-track,
.search-results::-webkit-scrollbar-track,
.scanned-guests-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.custom-modal-content::-webkit-scrollbar-thumb,
.search-results::-webkit-scrollbar-thumb,
.scanned-guests-list::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

.custom-modal-content::-webkit-scrollbar-thumb:hover,
.search-results::-webkit-scrollbar-thumb:hover,
.scanned-guests-list::-webkit-scrollbar-thumb:hover {
  background: #5a6fce;
}

@media (prefers-color-scheme: dark) {
  .custom-modal-content::-webkit-scrollbar-track,
  .search-results::-webkit-scrollbar-track,
  .scanned-guests-list::-webkit-scrollbar-track {
    background: #3a3a3a;
  }

  .custom-modal-content::-webkit-scrollbar-thumb,
  .search-results::-webkit-scrollbar-thumb,
  .scanned-guests-list::-webkit-scrollbar-thumb {
    background: #667eea;
  }

  .custom-modal-content::-webkit-scrollbar-thumb:hover,
  .search-results::-webkit-scrollbar-thumb:hover,
  .scanned-guests-list::-webkit-scrollbar-thumb:hover {
    background: #7588ec;
  }
}

/* ========================================
   ANIMACIONES DE INTERACCIÓN
   ======================================== */
.scan-item,
.guest-item,
.event-option,
.result-item,
.stat-card,
.close-modal-btn {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Efecto de clic en móviles */
@media (hover: none) {
  .scan-item:active,
  .guest-item:active,
  .result-item:active:not(.disabled) {
    transform: scale(0.98);
  }

  .activate-btn:active,
  .manual-entry-btn:active {
    transform: scale(0.95);
  }
}

/* ========================================
   MEJORAS DE ACCESIBILIDAD
   ======================================== */
.close-modal-btn:focus,
.activate-btn:focus,
.manual-entry-btn:focus,
.form-input:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

/* Focus visible solo con teclado */
.close-modal-btn:focus:not(:focus-visible),
.activate-btn:focus:not(:focus-visible),
.manual-entry-btn:focus:not(:focus-visible) {
  outline: none;
}

/* ========================================
   LOADING STATES
   ======================================== */
.scanner-video[aria-busy="true"] {
  opacity: 0.6;
}

/* ========================================
   ESTILOS DE IMPRESIÓN
   ======================================== */
@media print {
  .page-header,
  .scanner-section,
  .scanner-options,
  .custom-modal-overlay {
    display: none !important;
  }

  .scan-container {
    padding: 0;
  }

  .scanned-guests-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .guest-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}

/* ========================================
   ESTADOS DE CARGA ESPECÍFICOS
   ======================================== */
.scanner-video::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    transparent 25%,
    rgba(102, 126, 234, 0.1) 25%,
    rgba(102, 126, 234, 0.1) 50%,
    transparent 50%,
    transparent 75%,
    rgba(102, 126, 234, 0.1) 75%
  );
  background-size: 40px 40px;
  animation: loading-stripe 1s linear infinite;
  opacity: 0;
  pointer-events: none;
}

.scanner-video[data-loading="true"]::before {
  opacity: 1;
}

@keyframes loading-stripe {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}

/* ========================================
   EFECTOS ESPECIALES PARA ESCANEO EXITOSO
   ======================================== */
@keyframes success-flash {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 0.3;
  }
}

.scanner-viewport.success-flash::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #10b981;
  animation: success-flash 0.5s ease-out;
  pointer-events: none;
}

/* ========================================
   OPTIMIZACIONES DE PERFORMANCE
   ======================================== */
.scanner-video {
  will-change: transform;
  transform: translateZ(0);
}

.scanner-frame {
  will-change: border-color, box-shadow;
}

.scan-item,
.guest-item,
.result-item {
  will-change: transform, background;
}

/* ========================================
   FIX ESPECÍFICO PARA iOS
   ======================================== */
.scanner-video {
  -webkit-transform: translateZ(0);
  -webkit-backface-visibility: hidden;
}

/* Fix para video en iOS */
@supports (-webkit-touch-callout: none) {
  .scanner-viewport {
    -webkit-transform: translateZ(0);
  }
  
  .scanner-video {
    -webkit-transform: translate3d(0, 0, 0);
    transform: translate3d(0, 0, 0);
  }
}

/* ========================================
   MEJORAS VISUALES ADICIONALES
   ======================================== */
.scanner-card {
  position: relative;
  overflow: hidden;
}

/* Desactivar efectos decorativos cuando el scanner está activo */
.scanner-card:has(.scanner-active) {
  overflow: visible;
}
</style>
