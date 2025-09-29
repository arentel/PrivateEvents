<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <!-- Vista de Bienvenida -->
      <div v-if="showWelcomePage" class="download-container">
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

      <!-- Vista Principal de Descarga -->
      <div v-else class="download-container">
        <!-- Loading -->
        <div v-if="loading" class="loading-section">
          <div class="section-header">
            <h3>Cargando tu ticket...</h3>
          </div>
          <div class="loading-content">
            <ion-spinner name="crescent"></ion-spinner>
            <p>{{ loadingMessage }}</p>
          </div>
        </div>

        <!-- Estado de Error -->
        <div v-else-if="error" class="error-section">
          <div class="section-header">
            <h3>Error al cargar ticket</h3>
          </div>
          
          <div class="error-content">
            <div class="error-message">
              <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
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
          </div>
        </div>

        <!-- Ticket Cargado -->
        <div v-else-if="ticketData" class="ticket-sections">
          <!-- Información del Evento -->
          <div class="event-info-section">
            <div class="section-header">
              <h3>{{ ticketData.event.name }}</h3>
              <div v-if="eventStatus" class="event-status" :class="{ 'event-past': isEventPast, 'event-today': eventStatus.includes('Hoy') }">
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
                  <p v-if="ticketData.guest.phone" class="phone">{{ ticketData.guest.phone }}</p>
                </div>
                
                <div class="guest-status">
                  <span class="status-badge success">CONFIRMADO</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de Descarga -->
          <div class="actions-section">
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
                {{ downloading ? 'Generando PDF...' : 'Descargar Ticket PDF' }}
              </ion-button>
              
              <!-- Botón para abrir en navegador (Google App) -->
              <ion-button 
                v-if="isGoogleApp()"
                fill="solid"
                expand="block"
                @click="openInBrowser"
                class="browser-btn"
                color="warning"
              >
                <ion-icon :icon="globeOutline" slot="start"></ion-icon>
                Abrir en Chrome
              </ion-button>
              
              <!-- Botón adicional para Android -->
              <ion-button 
                v-if="isAndroid() && !isGoogleApp()"
                fill="outline"
                expand="block"
                @click="openDownloadsFolder"
                class="downloads-btn"
              >
                <ion-icon :icon="folderOpenOutline" slot="start"></ion-icon>
                Abrir Descargas
              </ion-button>
            </div>
          </div>

          <!-- Instrucciones -->
          <div class="instructions-section">
            <div class="section-header">
              <h3>Instrucciones importantes</h3>
            </div>
            
            <div class="instructions-content">
              <div class="instruction-item">
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
              <div v-if="isMobile()" class="instruction-item mobile-tip">
                <ion-icon :icon="checkmarkCircleOutline" class="instruction-icon"></ion-icon>
                <span>Después de descargar, busca en tu carpeta de Descargas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  toastController,
  alertController
} from '@ionic/vue'
import {
  downloadOutline,
  alertCircleOutline,
  refreshOutline,
  homeOutline,
  mailOutline,
  timeOutline,
  bookmarkOutline,
  checkmarkCircleOutline,
  folderOpenOutline,
  globeOutline
} from 'ionicons/icons'

// Importaciones corregidas
import { supabase } from '@/services/supabase.js'

// Router y route
const route = useRoute()
const router = useRouter()

// Estados del componente
const ticketData = ref(null)
const downloading = ref(false)
const retrying = ref(false)
const loading = ref(false)
const error = ref(null)

// Computed properties
const downloadCode = computed(() => route.params.code)
const showWelcomePage = computed(() => !downloadCode.value || downloadCode.value === 'home')

const loadingMessage = computed(() => {
  if (retrying.value) return 'Reintentando conexión...'
  return 'Cargando tu ticket...'
})

const formattedEventDate = computed(() => {
  if (!ticketData.value?.event?.date) return ''
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    
    if (isNaN(eventDate.getTime())) {
      console.warn('Fecha del evento inválida:', ticketData.value.event.date)
      return ticketData.value.event.date
    }
    
    return eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.error('Error formateando fecha del evento:', error)
    return ticketData.value.event.date
  }
})

const isEventPast = computed(() => {
  if (!ticketData.value?.event?.date) return false
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    const now = new Date()
    return eventDate < now
  } catch {
    return false
  }
})

const eventStatus = computed(() => {
  if (!ticketData.value?.event?.date) return ''
  
  try {
    const eventDate = new Date(ticketData.value.event.date)
    const now = new Date()
    const diffTime = eventDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return 'Evento finalizado'
    } else if (diffDays === 0) {
      return '¡HOY ES EL EVENTO!'
    } else if (diffDays === 1) {
      return '¡Mañana es el evento!'
    } else if (diffDays <= 7) {
      return `Faltan ${diffDays} días`
    } else {
      return `Faltan ${diffDays} días`
    }
  } catch {
    return ''
  }
})

// Detectar dispositivo
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

// Función para abrir en navegador externo
const openInBrowser = async () => {
  const currentUrl = window.location.href
  
  try {
    // Copiar al portapapeles
    await navigator.clipboard.writeText(currentUrl)
    
    const alert = await alertController.create({
      header: 'Abrir en Safari/Chrome',
      message: 'Enlace copiado. Abre Safari o Chrome y pega el enlace en la barra de direcciones.',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        },
        {
          text: 'Abrir Safari',
          handler: () => {
            // En iOS, intentar abrir en Safari
            if (isIOS()) {
              window.open(currentUrl, '_blank')
            } else if (isAndroid()) {
              // En Android, usar Intent
              window.location.href = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
            }
          }
        }
      ]
    })
    
    await alert.present()
    
  } catch (err) {
    // Si falla copiar
    const alert = await alertController.create({
      header: 'Abre en tu navegador',
      message: 'Por favor, copia este enlace y ábrelo en Safari o Chrome para descargar el ticket.',
      buttons: ['OK']
    })
    await alert.present()
  }
}

// Función auxiliar para copiar al portapapeles
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    const toast = await toastController.create({
      message: '📋 Enlace copiado. Pégalo en Chrome para continuar',
      duration: 4000,
      color: 'primary',
      position: 'bottom'
    })
    await toast.present()
  } catch (err) {
    // Si falla copiar, mostrar el enlace
    const alert = await alertController.create({
      header: 'Copia este enlace',
      message: `Copia y pega este enlace en Chrome:<br><br><small>${text}</small>`,
      buttons: ['OK']
    })
    await alert.present()
  }
}

// FUNCIÓN CORREGIDA: Cargar datos del ticket
const loadTicketData = async () => {
  if (!downloadCode.value) return

  loading.value = true
  error.value = null
  ticketData.value = null
  
  try {
    console.log('🔍 Buscando ticket por código:', downloadCode.value)
    
    // Buscar en download_tickets por download_code
    const { data: ticketRecord, error: ticketError } = await supabase
      .from('download_tickets')
      .select('*')
      .eq('download_code', downloadCode.value)
      .single()
    
    if (ticketError) {
      if (ticketError.code === 'PGRST116') {
        throw new Error('Enlace no encontrado o inválido. Verifica que el enlace del email sea correcto.')
      }
      throw ticketError
    }
    
    if (!ticketRecord) {
      throw new Error('Ticket no encontrado')
    }
    
    // Verificar expiración
    if (ticketRecord.expires_at) {
      const now = new Date()
      const expiresAt = new Date(ticketRecord.expires_at)
      
      if (now > expiresAt) {
        throw new Error('Este enlace ha expirado. Solicita un nuevo enlace al organizador.')
      }
    }
    
    console.log('✅ Ticket válido encontrado:', ticketRecord.event_name)
    console.log('🔍 QR almacenado:', ticketRecord.qr_code ? 'Presente' : 'Ausente')
    
    // Buscar datos completos del invitado
    let guestData = {
      id: ticketRecord.guest_id,
      name: ticketRecord.guest_name || 'Invitado',
      email: ticketRecord.guest_email || 'email@ejemplo.com'
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
        console.warn('No se pudo cargar datos del invitado:', guestErr)
      }
    }
    
    // Buscar datos completos del evento
    let eventData = {
      id: ticketRecord.event_id,
      name: ticketRecord.event_name || 'Evento',
      date: ticketRecord.event_date || new Date().toISOString(),
      location: ticketRecord.event_location || 'Ubicación por confirmar'
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
        console.warn('No se pudo cargar datos del evento:', eventErr)
      }
    }
    
    // CORRECCIÓN CRÍTICA: Incluir el QR almacenado en la estructura de datos
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
    
  } catch (err) {
    console.error('❌ Error cargando ticket:', err)
    error.value = err.message || 'Error al cargar el ticket'
  } finally {
    loading.value = false
  }
}

// Función para marcar ticket como descargado
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

// Mostrar instrucciones específicas por dispositivo
const showDownloadInstructions = async () => {
  let message = ''
  let header = 'PDF Descargado'
  
  if (isAndroid()) {
    message = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>📱 En Android:</strong></p>
        <p>1. Busca la notificación de descarga en la barra superior</p>
        <p>2. O ve a <strong>Descargas</strong> en tu navegador (menú ⋮)</p>
        <p>3. O abre la app <strong>Archivos</strong> > <strong>Descargas</strong></p>
        <p>4. Busca el archivo: <strong>${ticketData.value.guest.name}_ticket.pdf</strong></p>
      </div>
    `
  } else if (isIOS()) {
    message = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>📱 En iPhone/iPad:</strong></p>
        <p>1. El PDF se abrirá automáticamente en Safari</p>
        <p>2. Toca el botón <strong>Compartir</strong> (⬆️)</p>
        <p>3. Selecciona <strong>"Guardar en Archivos"</strong></p>
        <p>4. O <strong>"Añadir a Fotos"</strong> para guardarlo en la galería</p>
      </div>
    `
  } else {
    message = `
      <div style="text-align: left; line-height: 1.5;">
        <p><strong>💻 En tu navegador:</strong></p>
        <p>1. El archivo se ha descargado en tu carpeta de <strong>Descargas</strong></p>
        <p>2. Nombre del archivo: <strong>${ticketData.value.guest.name}_ticket.pdf</strong></p>
        <p>3. Puedes abrirlo desde allí o guardarlo donde prefieras</p>
      </div>
    `
  }

  const alert = await alertController.create({
    header: header,
    message: message,
    buttons: [
      {
        text: 'Entendido',
        role: 'confirm',
        handler: () => {
          console.log('Usuario confirmó instrucciones')
        }
      }
    ]
  })

  await alert.present()
}

// FUNCIÓN MEJORADA: Usar el QR almacenado en la base de datos
const downloadTicket = async () => {
  if (!ticketData.value) return

  // Detectar si está en la app de Google
  if (isGoogleApp()) {
    const alert = await alertController.create({
      header: 'Abrir en navegador',
      message: 'Para descargar el PDF, necesitas abrir este enlace en Chrome o tu navegador predeterminado.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Abrir en Chrome',
          handler: () => {
            openInBrowser()
          }
        }
      ]
    })
    await alert.present()
    return
  }

  downloading.value = true
  
  try {
    console.log('🎫 Generando PDF del ticket...')
    
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
    } else {
      console.log('✅ Usando QR almacenado en la base de datos')
    }
    
    const success = await generateTicketPDF(
      ticketData.value.guest, 
      ticketData.value.event,
      qrCodeToUse
    )
    
    if (success) {
      await markTicketAsDownloaded()
      
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

// Función para abrir carpeta de descargas (Android)
const openDownloadsFolder = () => {
  if (isAndroid()) {
    try {
      window.open('content://com.android.externalstorage.documents/document/primary%3ADownload', '_blank')
    } catch (e) {
      console.log('No se pudo abrir carpeta de descargas automáticamente')
    }
  }
}

// Función de retry
const retryLoad = async () => {
  retrying.value = true
  
  try {
    await loadTicketData()
  } finally {
    retrying.value = false
  }
}

// Ir al inicio
const goToHome = () => {
  router.push('/download-ticket/home')
}

// Inicialización
onMounted(async () => {
  console.log('🎫 Inicializando DownloadTicket...')
  console.log('🔄 Código:', route.params.code)
  
  if (downloadCode.value && downloadCode.value !== 'home') {
    await loadTicketData()
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
</script>

<style scoped>
.download-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
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

/* Secciones */
.welcome-section,
.help-section,
.loading-section,
.error-section,
.event-info-section,
.guest-info-section,
.actions-section,
.instructions-section {
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

/* Event status badge */
.event-status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  background: #e5e7eb;
  color: #374151;
}

.event-status.event-today {
  background: #fbbf24;
  color: #92400e;
}

.event-status.event-past {
  background: #6b7280;
  color: white;
}

/* Event stats */
.event-stats {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  font-size: 1rem;
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

/* Guest item */
.guest-details {
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
  border-left: 4px solid #10b981;
}

.guest-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #10b981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
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

.phone {
  font-size: 0.8rem;
  color: #9ca3af;
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

/* Form content */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Botones */
.download-btn,
.retry-btn,
.home-btn,
.contact-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
}

.downloads-btn {
  --border-color: #0d1b2a;
  --color: #0d1b2a;
  --background: transparent;
  margin-top: 8px;
}

.download-btn:hover,
.retry-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.home-btn,
.contact-btn,
.downloads-btn {
  --border-color: #0d1b2a;
  --color: #0d1b2a;
  --background: transparent;
}

.home-btn:hover,
.contact-btn:hover,
.downloads-btn:hover {
  --background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.15);
}

/* Instructions list */
.instructions-list {
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
}

.instruction-item.mobile-tip {
  border-left-color: #10b981;
  background: #f0f9ff;
}

.instruction-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #0d1b2a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.instruction-content h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}

.instruction-content p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Instructions content para la sección final */
.instructions-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instructions-content .instruction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #0d1b2a;
}

.instruction-icon {
  color: #0d1b2a;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.instructions-content .instruction-item span {
  color: #1f2937;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Loading content */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
}

.loading-content p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* Error content */
.error-content {
  text-align: center;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.error-icon {
  font-size: 3rem;
  color: #ef4444;
}

.error-message p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

/* Help content */
.help-content {
  text-align: center;
}

.help-content p {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .download-container {
    padding: 16px;
  }
  
  .stat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .stat-value {
    text-align: left;
    margin-left: 0;
  }
  
  .welcome-section,
  .help-section,
  .loading-section,
  .error-section,
  .event-info-section,
  .guest-info-section,
  .actions-section,
  .instructions-section {
    padding: 16px;
  }
  
  .guest-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .instruction-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .instructions-content .instruction-item {
    flex-direction: row;
    text-align: left;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    text-align: center;
  }
}

/* Estados disabled */
.download-btn:disabled,
.retry-btn:disabled {
  --background: #9ca3af;
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.download-btn:disabled:hover,
.retry-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

/* Transiciones */
.instruction-item,
.guest-item,
.download-btn,
.retry-btn,
.home-btn,
.contact-btn,
.downloads-btn {
  transition: all 0.2s ease;
}

/* Hover effects */
.instruction-item:hover,
.guest-item:hover {
  background: #f1f3f4;
  transform: translateX(4px);
}

/* Spinner */
ion-spinner {
  width: 32px;
  height: 32px;
  color: #0d1b2a;
}

.loading-section ion-spinner {
  color: #3b82f6;
  width: 40px;
  height: 40px;
}

/* Espaciado */
.ticket-sections > * {
  margin-bottom: 24px;
}

.ticket-sections > *:last-child {
  margin-bottom: 0;
}

/* Optimizaciones móvil */
@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.5rem;
  }
  
  .section-header h3 {
    font-size: 1.1rem;
  }
  
  .instruction-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .guest-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}
</style>