<template>
  <ion-page>
    <ion-content :fullscreen="true" class="download-content">
      <div class="download-container">
        
        <!-- ========================================
             VISTA DE BIENVENIDA (HOME)
             ======================================== -->
        <div v-if="showWelcomePage" class="welcome-container animate-fade-in-up">
          <div class="page-header">
            <h1>Descarga de Tickets</h1>
            <p>Accede a tus entradas para eventos</p>
          </div>

          <div class="welcome-section">
            <div class="section-header">
              <h3>¿Cómo descargar tu ticket?</h3>
            </div>
            
            <div class="instructions-list">
              <div class="instruction-item">
                <div class="instruction-number">1</div>
                <div class="instruction-content">
                  <h4>Revisa tu email</h4>
                  <p>Busca el email de confirmación con tu enlace personalizado</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <div class="instruction-number">2</div>
                <div class="instruction-content">
                  <h4>Haz clic en el enlace</h4>
                  <p>Accede desde el enlace único que recibiste por email</p>
                </div>
              </div>
              
              <div class="instruction-item">
                <div class="instruction-number">3</div>
                <div class="instruction-content">
                  <h4>Descarga tu ticket</h4>
                  <p>Tu entrada se descargará automáticamente en PDF</p>
                </div>
              </div>
            </div>
          </div>

          <div class="help-section">
            <div class="section-header">
              <h3>¿Necesitas ayuda?</h3>
            </div>
            
            <div class="help-content">
              <p>Si no tienes el enlace de descarga o tienes problemas, contacta con el organizador del evento.</p>
              <ion-button fill="outline" class="contact-btn">
                <ion-icon :icon="mailOutline" slot="start"></ion-icon>
                Contactar Organizador
              </ion-button>
            </div>
          </div>
        </div>

        <!-- ========================================
             VISTA PRINCIPAL DE DESCARGA
             ======================================== -->
        <div v-else>
          <!-- Header -->
          <div class="page-header animate-fade-in-down">
            <h1>Descargar Ticket</h1>
            <p>Accede a tu entrada para el evento</p>
          </div>

          <!-- ✅ SKELETON LOADER mientras carga -->
          <SkeletonLoader 
            v-if="loading && !error" 
            type="ticket-card" 
            class="animate-fade-in" 
          />

          <!-- Alerta de Google App -->
          <div v-if="isGoogleApp() && ticketData" class="google-app-alert animate-slide-in-left">
            <ion-icon :icon="alertCircleOutline" style="font-size: 2rem; color: white;"></ion-icon>
            <div>
              <h3 style="margin: 0 0 8px 0; color: white; font-weight: 600;">Navegador no compatible</h3>
              <p style="margin: 0 0 4px 0; color: white; font-size: 0.9rem;">
                Debido a restricciones de la app de Google, no puedes descargar el PDF aquí.
              </p>
              <p style="margin: 0 0 8px 0; color: white; font-size: 0.9rem;">
                <strong>Solución:</strong> Copia el enlace y ábrelo en Chrome o Safari.
              </p>
              <ion-button 
                size="small" 
                fill="clear" 
                style="--color: white; margin: 0;"
                @click="copyLinkToClipboard"
              >
                <ion-icon :icon="copyOutline" slot="start"></ion-icon>
                Copiar Enlace
              </ion-button>
            </div>
          </div>

          <!-- Estado de Error -->
          <div v-if="!loading && error" class="error-section animate-fade-in">
            <div class="section-header">
              <h3>Error al cargar ticket</h3>
            </div>
            
            <div class="error-content">
              <div class="error-message">
                <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
                <h3>No se pudo cargar el ticket</h3>
                <p>{{ error }}</p>
              </div>
              
              <div class="form-content">
                <ion-button 
                  expand="block"
                  @click="retryLoad" 
                  :disabled="retrying"
                  class="retry-btn"
                >
                  <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                  {{ retrying ? 'Reintentando...' : 'Reintentar' }}
                </ion-button>
                
                <ion-button 
                  expand="block"
                  fill="outline" 
                  @click="goToHome"
                  class="home-btn"
                >
                  <ion-icon :icon="homeOutline" slot="start"></ion-icon>
                  Volver al inicio
                </ion-button>
              </div>
              
              <div class="help-content">
                <p>Si el problema persiste, contacta con el organizador del evento.</p>
              </div>
            </div>
          </div>

          <!-- Ticket Cargado Exitosamente -->
          <div v-if="!loading && ticketData" class="ticket-sections animate-fade-in-up">
            <!-- Información del Evento -->
            <div class="event-info-section">
              <div class="section-header">
                <h3>{{ ticketData.event.name }}</h3>
                <div v-if="eventStatus" class="event-status" :class="eventStatusClass">
                  {{ eventStatus }}
                </div>
              </div>
              
              <div class="event-stats">
                <div class="stat-item">
                  <span class="stat-label">Fecha y hora</span>
                  <span class="stat-value">{{ formattedEventDate }}</span>
                </div>
                
                <div class="stat-item" v-if="ticketData.event.location">
                  <span class="stat-label">Ubicación</span>
                  <span class="stat-value">{{ ticketData.event.location }}</span>
                </div>

                <div class="stat-item" v-if="daysUntilEvent">
                  <span class="stat-label">Cuenta regresiva</span>
                  <span class="stat-value countdown">{{ daysUntilEvent }}</span>
                </div>
              </div>
            </div>

            <!-- Información del Invitado -->
            <div class="guest-info-section">
              <div class="section-header">
                <h3>Datos del Invitado</h3>
              </div>
              
              <div class="guest-details">
                <div class="guest-item">
                  <div class="guest-avatar">
                    {{ ticketData.guest.name.charAt(0).toUpperCase() }}
                  </div>
                  
                  <div class="guest-info">
                    <h4>{{ ticketData.guest.name }}</h4>
                    <p>{{ ticketData.guest.email }}</p>
                    <p v-if="ticketData.guest.phone" class="phone">📞 {{ ticketData.guest.phone }}</p>
                  </div>
                  
                  <div class="guest-status">
                    <span class="status-badge success">CONFIRMADO</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- QR Code Section (visible en Google App) -->
            <div v-if="isGoogleApp() && ticketData.qrCode" class="qr-section">
              <div class="section-header">
                <h3>Tu Código QR</h3>
              </div>
              
              <div class="qr-content">
                <p class="qr-description">Usa este código QR para acceder al evento:</p>
                <div class="qr-image-container">
                  <canvas ref="qrCanvas" class="qr-canvas"></canvas>
                </div>
                <p class="qr-note">💡 Guarda una captura de pantalla de este QR</p>
              </div>
            </div>

            <!-- Acciones de Descarga -->
            <div class="actions-section" v-if="!isGoogleApp()">
              <div class="section-header">
                <h3>Descargar Ticket</h3>
              </div>
              
              <div class="form-content">
                <ion-button 
                  expand="block"
                  @click="downloadTicket" 
                  :disabled="downloading"
                  class="download-btn"
                >
                  <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
                  <ion-spinner v-if="downloading" name="crescent" style="margin-right: 8px;"></ion-spinner>
                  {{ downloading ? 'Generando PDF...' : 'Descargar Ticket PDF' }}
                </ion-button>
                
                <!-- Botón adicional para Android -->
                <ion-button 
                  v-if="isAndroid()"
                  fill="outline"
                  expand="block"
                  @click="openDownloadsFolder"
                  class="downloads-btn"
                >
                  <ion-icon :icon="folderOpenOutline" slot="start"></ion-icon>
                  Abrir Carpeta Descargas
                </ion-button>

                <div v-if="downloading" class="downloading-info">
                  <ion-spinner name="dots"></ion-spinner>
                  <p>Generando tu ticket, por favor espera...</p>
                </div>
              </div>
            </div>

            <!-- Instrucciones -->
            <div class="instructions-section">
              <div class="section-header">
                <h3>Instrucciones importantes</h3>
              </div>
              
              <div class="instructions-content">
                <div class="instruction-item" v-if="!isGoogleApp()">
                  <ion-icon :icon="downloadOutline" class="instruction-icon"></ion-icon>
                  <span>Descarga el ticket antes del evento</span>
                </div>
                <div class="instruction-item">
                  <ion-icon :icon="timeOutline" class="instruction-icon"></ion-icon>
                  <span>Llega 15 minutos antes del inicio</span>
                </div>
                <div class="instruction-item">
                  <ion-icon :icon="bookmarkOutline" class="instruction-icon"></ion-icon>
                  <span>Guarda este enlace para futuras descargas</span>
                </div>
                
                <!-- Instrucción específica para móvil -->
                <div v-if="isMobile() && !isGoogleApp()" class="instruction-item mobile-tip">
                  <ion-icon :icon="checkmarkCircleOutline" class="instruction-icon"></ion-icon>
                  <span>Después de descargar, busca en tu carpeta de Descargas</span>
                </div>
                
                <!-- Instrucción para Google App -->
                <div v-if="isGoogleApp()" class="instruction-item google-tip">
                  <ion-icon :icon="globeOutline" class="instruction-icon"></ion-icon>
                  <span>Copia el enlace y ábrelo en Chrome o Safari para descargar el PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/services/supabase.js'
import { 
  IonPage, IonContent, IonButton, IonSpinner, IonIcon,
  alertController, toastController
} from '@ionic/vue'
import { 
  downloadOutline, 
  checkmarkCircleOutline,
  alertCircleOutline,
  refreshOutline,
  homeOutline,
  mailOutline,
  timeOutline,
  bookmarkOutline,
  folderOpenOutline,
  globeOutline,
  copyOutline
} from 'ionicons/icons'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useHaptics } from '@/composables/useHaptics'

const route = useRoute()
const router = useRouter()
const { vibrate } = useHaptics()

// ========================================
// ESTADOS
// ========================================
const loading = ref(true)
const downloading = ref(false)
const error = ref<string | null>(null)
const ticketData = ref<any>(null)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const retrying = ref(false)

// ========================================
// COMPUTED PROPERTIES
// ========================================
const downloadCode = computed(() => route.params.code as string)

const showWelcomePage = computed(() => {
  return !downloadCode.value || downloadCode.value === 'home'
})

// Formatear fecha del evento
const formattedEventDate = computed(() => {
  if (!ticketData.value?.event?.date) return ''
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    return eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ticketData.value.event.date
  }
})

// Días hasta el evento
const daysUntilEvent = computed(() => {
  if (!ticketData.value?.event?.date) return ''
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    eventDate.setHours(0, 0, 0, 0)
    
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return 'El evento ya pasó'
    } else if (diffDays === 0) {
      return '¡Hoy es el evento! 🎉'
    } else if (diffDays === 1) {
      return '¡Mañana es el evento! 🎊'
    } else if (diffDays <= 7) {
      return `Faltan ${diffDays} días`
    } else if (diffDays <= 30) {
      return `Faltan ${diffDays} días`
    } else {
      const weeks = Math.floor(diffDays / 7)
      return `Faltan ${weeks} semana${weeks > 1 ? 's' : ''}`
    }
  } catch {
    return ''
  }
})

// Estado del evento
const eventStatus = computed(() => {
  if (!ticketData.value?.event?.date) return ''
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    const today = new Date()
    
    const diffTime = eventDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return 'Evento finalizado'
    } else if (diffDays === 0) {
      return '¡HOY!'
    } else if (diffDays === 1) {
      return 'MAÑANA'
    } else if (diffDays <= 7) {
      return `En ${diffDays} días`
    }
    return ''
  } catch {
    return ''
  }
})

// Clase CSS del estado del evento
const eventStatusClass = computed(() => {
  if (!eventStatus.value) return ''
  
  if (eventStatus.value.includes('finalizado')) {
    return 'event-past'
  } else if (eventStatus.value.includes('HOY')) {
    return 'event-today'
  } else if (eventStatus.value.includes('MAÑANA')) {
    return 'event-tomorrow'
  }
  return 'event-upcoming'
})

// ========================================
// FUNCIONES DE DETECCIÓN DE DISPOSITIVO
// ========================================
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const isAndroid = () => {
  return /Android/i.test(navigator.userAgent)
}

const isIOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

const isGoogleApp = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('googleapp') || ua.includes('gsa/')
}

// ========================================
// FUNCIONES DE QR
// ========================================
const generateQRInCanvas = async () => {
  if (!ticketData.value?.qrCode || !qrCanvas.value) return
  
  await nextTick()
  
  try {
    const QRious = (await import('qrious')).default
    
    new QRious({
      element: qrCanvas.value,
      value: ticketData.value.qrCode,
      size: 300,
      level: 'H',
      background: 'white',
      foreground: 'black'
    })
    console.log('✅ QR generado en canvas')
  } catch (error) {
    console.error('Error generando QR en canvas:', error)
  }
}

// ========================================
// FUNCIONES DE COPIA Y UTILIDADES
// ========================================
const copyLinkToClipboard = async () => {
  const currentUrl = window.location.href
  
  try {
    await navigator.clipboard.writeText(currentUrl)
    await vibrate('light') // ✅ HÁPTICO
    
    const toast = await toastController.create({
      message: '✅ Enlace copiado al portapapeles',
      duration: 2500,
      color: 'success',
      position: 'bottom'
    })
    await toast.present()
  } catch (err) {
    const alert = await alertController.create({
      header: 'Copia este enlace',
      message: currentUrl,
      buttons: ['OK']
    })
    await alert.present()
  }
}

const openDownloadsFolder = () => {
  if (isAndroid()) {
    try {
      // Intento de abrir la carpeta de descargas en Android
      window.open('content://com.android.externalstorage.documents/document/primary%3ADownload', '_blank')
    } catch (e) {
      console.log('No se pudo abrir carpeta de descargas automáticamente')
      showToast('Busca el archivo en tu app de Archivos > Descargas', 'primary')
    }
  }
}

const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 3000,
    color,
    position: 'top'
  })
  await toast.present()
}

// ========================================
// CARGA DE DATOS DEL TICKET
// ========================================
const loadTicketData = async () => {
  if (!downloadCode.value || downloadCode.value === 'home') return

  loading.value = true
  error.value = null
  ticketData.value = null
  
  try {
    console.log('🔍 Buscando ticket por código:', downloadCode.value)
    
    const { data: ticketRecord, error: ticketError } = await supabase
      .from('download_tickets')
      .select('*')
      .eq('download_code', downloadCode.value)
      .single()
    
    if (ticketError) {
      await vibrate('error') // ✅ HÁPTICO ERROR
      if (ticketError.code === 'PGRST116') {
        throw new Error('Enlace no encontrado o inválido. Verifica que el enlace del email sea correcto.')
      }
      throw ticketError
    }
    
    if (!ticketRecord) {
      await vibrate('error') // ✅ HÁPTICO ERROR
      throw new Error('Ticket no encontrado')
    }
    
    // Verificar expiración
    if (ticketRecord.expires_at) {
      const now = new Date()
      const expiresAt = new Date(ticketRecord.expires_at)
      
      if (now > expiresAt) {
        await vibrate('warning') // ✅ HÁPTICO WARNING
        throw new Error('Este enlace ha expirado. Solicita un nuevo enlace al organizador.')
      }
    }
    
    console.log('✅ Ticket válido encontrado:', ticketRecord.event_name)
    await vibrate('success') // ✅ HÁPTICO SUCCESS
    
    // Cargar datos del invitado
    let guestData = {
      id: ticketRecord.guest_id,
      name: ticketRecord.guest_name || 'Invitado',
      email: ticketRecord.guest_email || 'email@ejemplo.com',
      phone: ticketRecord.guest_phone || ''
    }
    
    if (ticketRecord.guest_id) {
      try {
        const { data: guest, error: guestError } = await supabase
          .from('guests')
          .select('*')
          .eq('id', ticketRecord.guest_id)
          .single()
        
        if (!guestError && guest) {
          guestData = guest
        }
      } catch (guestErr) {
        console.warn('No se pudo cargar datos completos del invitado:', guestErr)
      }
    }
    
    // Cargar datos del evento
    let eventData = {
      id: ticketRecord.event_id,
      name: ticketRecord.event_name || 'Evento',
      date: ticketRecord.event_date || new Date().toISOString(),
      location: ticketRecord.event_location || 'Ubicación por confirmar',
      description: ticketRecord.event_description || ''
    }
    
    if (ticketRecord.event_id) {
      try {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', ticketRecord.event_id)
          .single()
        
        if (!eventError && event) {
          eventData = event
        }
      } catch (eventErr) {
        console.warn('No se pudo cargar datos completos del evento:', eventErr)
      }
    }
    
    // Asignar datos al ref
    ticketData.value = {
      guest: guestData,
      event: eventData,
      downloadCode: ticketRecord.download_code,
      qrCode: ticketRecord.qr_code,
      qr_code: ticketRecord.qr_code
    }
    
    console.log('✅ Datos del ticket cargados:', {
      invitado: guestData.name,
      evento: eventData.name,
      codigo: ticketRecord.download_code,
      tieneQR: !!ticketRecord.qr_code
    })
    
    // Generar QR en canvas si es Google App
    if (isGoogleApp() && ticketRecord.qr_code) {
      await nextTick()
      await generateQRInCanvas()
    }
    
  } catch (err: any) {
    console.error('❌ Error cargando ticket:', err)
    error.value = err.message || 'Error al cargar el ticket'
  } finally {
    loading.value = false
  }
}

// ========================================
// MARCAR TICKET COMO DESCARGADO
// ========================================
const markTicketAsDownloaded = async () => {
  if (!ticketData.value?.downloadCode) return
  
  try {
    await supabase
      .from('download_tickets')
      .update({ 
        is_used: true,
        used_at: new Date().toISOString() 
      })
      .eq('download_code', ticketData.value.downloadCode)
    
    console.log('📥 Ticket marcado como descargado')
  } catch (error) {
    console.warn('Advertencia marcando ticket:', error)
  }
}

// ========================================
// INSTRUCCIONES DE DESCARGA
// ========================================
const showDownloadInstructions = async () => {
  let message = ''
  let header = 'PDF Descargado ✅'
  
  if (isAndroid()) {
    message = '1. Busca la notificación de descarga en la barra superior\n2. O ve a Descargas en tu navegador (menú ⋮)\n3. O abre la app Archivos > Descargas'
  } else if (isIOS()) {
    message = '1. El PDF se abrirá automáticamente en Safari\n2. Toca el botón Compartir (⬆️)\n3. Selecciona "Guardar en Archivos"'
  } else {
    message = 'El archivo se ha descargado en tu carpeta de Descargas'
  }

  const alert = await alertController.create({
    header: header,
    message: message,
    buttons: ['Entendido']
  })

  await alert.present()
}

// ========================================
// DESCARGAR TICKET CON HÁPTICOS
// ========================================
const downloadTicket = async () => {
  if (!ticketData.value) return

  downloading.value = true
  await vibrate('light') // ✅ HÁPTICO al iniciar
  
  try {
    console.log('🎫 Generando PDF del ticket...')
    
        // ✅ DESPUÉS
    // @ts-ignore
    const { generateTicketPDF } = await import('@/services/ticketPDF.js')
    
    let qrCodeToUse = ticketData.value.qrCode || ticketData.value.qr_code
    
    if (!qrCodeToUse) {
      console.warn('⚠️ No hay QR almacenado, creando QR de emergencia')
      qrCodeToUse = JSON.stringify({
        id: ticketData.value.guest.id,
        name: ticketData.value.guest.name,
        email: ticketData.value.guest.email,
        event_name: ticketData.value.event.name,
        eventId: ticketData.value.event.id,
        timestamp: new Date().toISOString(),
        version: '2.0'
      })
    }
    
    const success = await generateTicketPDF(
      ticketData.value.guest, 
      ticketData.value.event,
      qrCodeToUse
    )
    
    if (success) {
      await markTicketAsDownloaded()
      await vibrate('success') // ✅ HÁPTICO SUCCESS
      
      const toast = await toastController.create({
        message: '🎫 Ticket descargado correctamente',
        duration: 2000,
        color: 'success',
        position: 'top'
      })
      await toast.present()
      
      setTimeout(() => {
        showDownloadInstructions()
      }, 1000)
    }
    
  } catch (error) {
    console.error('Error descargando ticket:', error)
    await vibrate('error') // ✅ HÁPTICO ERROR
    
    const toast = await toastController.create({
      message: 'Error al descargar el ticket. Inténtalo de nuevo.',
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    downloading.value = false
  }
}

// ========================================
// RETRY Y NAVEGACIÓN
// ========================================
const retryLoad = async () => {
  retrying.value = true
  await vibrate('light') // ✅ HÁPTICO
  
  try {
    await loadTicketData()
  } finally {
    retrying.value = false
  }
}

const goToHome = () => {
  router.push('/download-ticket/home')
}

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('🎫 Inicializando DownloadTicket...')
  console.log('📄 Código:', route.params.code)
  
  if (downloadCode.value && downloadCode.value !== 'home') {
    await loadTicketData()
  } else {
    loading.value = false
  }
})

// Watcher para cambios de ruta
watch(
  () => route.params.code, 
  async (newCode, oldCode) => {
    if (newCode !== oldCode && newCode && newCode !== 'home') {
      await loadTicketData()
    }
  },
  { immediate: false }
)

// Watch para regenerar QR si cambian los datos
watch(
  () => ticketData.value?.qrCode,
  async (newQR) => {
    if (newQR && isGoogleApp()) {
      await nextTick()
      await generateQRInCanvas()
    }
  }
)
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.download-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.download-content {
  --background: #f8f9fa;
}

/* ========================================
   HEADER
   ======================================== */
.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

/* ========================================
   VISTA DE BIENVENIDA
   ======================================== */
.welcome-container {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-section,
.help-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

/* ========================================
   ALERTA DE GOOGLE APP
   ======================================== */
.google-app-alert {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  color: white;
}

.google-app-alert h3 {
  margin: 0 0 8px 0;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
}

.google-app-alert p {
  margin: 0 0 4px 0;
  color: white;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* ========================================
   SECCIONES
   ======================================== */
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

.event-info-section,
.guest-info-section,
.qr-section,
.actions-section,
.instructions-section,
.error-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

/* ========================================
   ESTADOS DEL EVENTO
   ======================================== */
.event-status {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-status.event-today {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  animation: pulse 2s infinite;
}

.event-status.event-tomorrow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.event-status.event-upcoming {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.event-status.event-past {
  background: #6b7280;
  color: white;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

/* ========================================
   ESTADÍSTICAS DEL EVENTO
   ======================================== */
.event-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d1b2a;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.stat-value.countdown {
  color: #667eea;
  font-weight: 700;
  font-size: 1.2rem;
}

/* ========================================
   INFORMACIÓN DEL INVITADO
   ======================================== */
.guest-details {
  margin-top: 16px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.guest-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.guest-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.guest-info {
  flex: 1;
}

.guest-info h4 {
  margin: 0 0 6px 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.guest-info p {
  margin: 0 0 4px 0;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.4;
}

.guest-info p.phone {
  color: #0d1b2a;
  font-weight: 500;
}

.guest-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

/* ========================================
   SECCIÓN QR
   ======================================== */
.qr-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px dashed #667eea;
}

.qr-content {
  text-align: center;
  padding: 20px;
}

.qr-description {
  color: #6b7280;
  margin-bottom: 24px;
  font-size: 1rem;
}

.qr-image-container {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.qr-canvas {
  max-width: 300px;
  width: 100%;
  height: auto;
  border: 4px solid #0d1b2a;
  border-radius: 12px;
  padding: 16px;
  background: white;
  box-shadow: 0 8px 20px rgba(13, 27, 42, 0.2);
}

.qr-note {
  color: #9ca3af;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 16px;
}

/* ========================================
   ACCIONES Y FORMULARIOS
   ======================================== */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.download-btn,
.retry-btn,
.home-btn,
.downloads-btn,
.contact-btn {
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
  transition: all 0.3s ease;
}

.download-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.download-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(13, 27, 42, 0.4);
}

.download-btn:active {
  transform: translateY(0);
}

.downloads-btn {
  --background: transparent;
  --color: #0d1b2a;
  --border-color: #0d1b2a;
  --border-width: 2px;
}

.retry-btn {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.home-btn {
  --background: transparent;
  --color: #6b7280;
  --border-color: #e5e7eb;
  --border-width: 2px;
}

.contact-btn {
  margin-top: 12px;
}

.downloading-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 2px solid #667eea;
}

.downloading-info p {
  margin: 0;
  color: #1e3a8a;
  font-size: 0.9rem;
  font-weight: 500;
}

/* ========================================
   INSTRUCCIONES
   ======================================== */
.instructions-list,
.instructions-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.instruction-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d1b2a;
  transition: all 0.3s ease;
}

.instruction-item:hover {
  background: #f1f3f4;
  transform: translateX(4px);
}

.instruction-item.mobile-tip {
  border-left-color: #10b981;
  background: #f0f9ff;
}

.instruction-item.google-tip {
  border-left-color: #f59e0b;
  background: #fffbeb;
}

.instruction-number {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0d1b2a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.3);
}

.instruction-content h4 {
  margin: 0 0 6px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
}

.instruction-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.instruction-icon {
  color: #0d1b2a;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.instructions-content .instruction-item {
  align-items: center;
  padding: 12px 16px;
}

.instructions-content .instruction-item span {
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.4;
}

/* ========================================
   ESTADO DE ERROR
   ======================================== */
.error-section {
  background: linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%);
  border: 2px solid #ef4444;
}

.error-content {
  text-align: center;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-message h3 {
  color: #991b1b;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.error-message p {
  color: #dc2626;
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
  max-width: 500px;
}

/* ========================================
   HELP CONTENT
   ======================================== */
.help-content {
  text-align: center;
}

.help-content p {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .download-container {
    padding: 16px;
  }
  
  .page-header h1 {
    font-size: 1.6rem;
  }

  .page-header p {
    font-size: 0.9rem;
  }
  
  .google-app-alert {
    flex-direction: column;
    padding: 20px;
  }

  .google-app-alert ion-icon {
    font-size: 1.5rem !important;
  }
  
  .event-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .guest-item {
    flex-wrap: wrap;
    padding: 16px;
  }

  .guest-avatar {
    width: 56px;
    height: 56px;
    font-size: 1.5rem;
  }

  .guest-info h4 {
    font-size: 1.1rem;
  }

  .guest-status {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  
  .qr-canvas {
    max-width: 250px;
  }
  
  .event-info-section,
  .guest-info-section,
  .qr-section,
  .actions-section,
  .instructions-section,
  .error-section {
    padding: 20px;
  }

  .instruction-item {
    padding: 12px;
    gap: 12px;
  }

  .instruction-number {
    width: 32px;
    height: 32px;
    font-size: 0.9rem;
  }

  .instruction-content h4 {
    font-size: 0.95rem;
  }

  .instruction-content p {
    font-size: 0.85rem;
  }

  .error-icon {
    font-size: 3rem;
  }

  .error-message h3 {
    font-size: 1.1rem;
  }
}

@media (max-width: 480px) {
  .download-container {
    padding: 12px;
  }

  .page-header {
    margin-bottom: 24px;
  }
  
  .page-header h1 {
    font-size: 1.4rem;
  }

  .section-header h3 {
    font-size: 1.1rem;
  }

  .event-status {
    font-size: 0.75rem;
    padding: 4px 12px;
  }

  .stat-item {
    padding: 12px;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1rem;
  }

  .guest-avatar {
    width: 48px;
    height: 48px;
    font-size: 1.3rem;
  }

  .qr-canvas {
    max-width: 220px;
  }

  .instruction-icon {
    font-size: 1.1rem;
  }
}

/* ========================================
   ANIMACIONES (usando variables CSS)
   ======================================== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Aplicar animaciones */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

.animate-fade-in-down {
  animation: fadeInDown 0.5s ease-out;
}

.animate-slide-in-left {
  animation: slideInLeft 0.5s ease-out;
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
}

/* ========================================
   MODO OSCURO (OPCIONAL)
   ======================================== */
@media (prefers-color-scheme: dark) {
  .download-content {
    --background: #1a1a1a;
  }

  .page-header h1 {
    color: #f9fafb;
  }

  .page-header p {
    color: #9ca3af;
  }

  .event-info-section,
  .guest-info-section,
  .qr-section,
  .actions-section,
  .instructions-section {
    background: #2d2d2d;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .section-header h3 {
    color: #f9fafb;
  }

  .guest-item {
    background: linear-gradient(135deg, #2d2d2d 0%, #3a3a3a 100%);
    border-color: #4a4a4a;
  }

  .guest-info h4 {
    color: #f9fafb;
  }

  .guest-info p {
    color: #9ca3af;
  }

  .instruction-item {
    background: #2d2d2d;
    border-left-color: #667eea;
  }

  .instruction-content h4 {
    color: #f9fafb;
  }

  .instruction-content p,
  .instructions-content .instruction-item span {
    color: #9ca3af;
  }
}
</style>