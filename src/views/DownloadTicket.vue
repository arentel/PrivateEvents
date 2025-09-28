<template>
  <ion-page>
    <ion-content>
      <!-- Vista de Bienvenida -->
      <div v-if="showWelcomePage" class="welcome-container">
        <div class="welcome-card">
          <div class="welcome-header">
            <h1>🎫 Tickets</h1>
            <p>Descarga tus entradas para eventos</p>
          </div>
          <div class="welcome-content">
            <ion-card>
              <ion-card-content>
                <h2>¿Cómo descargar tu ticket?</h2>
                <p>1. Revisa tu email de confirmación</p>
                <p>2. Haz clic en el enlace de descarga</p>
                <p>3. Tu ticket se descargará automáticamente</p>
              </ion-card-content>
            </ion-card>
            
            <ion-card>
              <ion-card-content>
                <h3>¿No tienes el enlace?</h3>
                <p>Contacta con el organizador del evento para recibir tu enlace de descarga personalizado.</p>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>

      <!-- Vista Principal de Descarga -->
      <div v-else class="ticket-container">
        <!-- Loading Component Optimizado -->
        <LoadingComponent
          :show="loading"
          type="spinner"
          :message="loadingMessage"
          :fullscreen="true"
          spinner-type="circles"
          color="primary"
        />

        <!-- Estado de Error con Retry -->
        <div v-if="error && !loading" class="error-container">
          <div class="error-card">
            <ion-icon :icon="alertCircleOutline" class="error-icon"></ion-icon>
            <h2>No se pudo cargar el ticket</h2>
            <p>{{ error }}</p>
            
            <div class="error-actions">
              <ion-button 
                fill="solid" 
                @click="retryLoad" 
                :disabled="retrying"
                class="retry-button"
              >
                <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                {{ retrying ? 'Reintentando...' : 'Reintentar' }}
              </ion-button>
              
              <ion-button 
                fill="outline" 
                @click="goToHome"
                class="home-button"
              >
                <ion-icon :icon="homeOutline" slot="start"></ion-icon>
                Ir al inicio
              </ion-button>
            </div>
          </div>
        </div>

        <!-- Ticket Cargado Exitosamente -->
        <div v-if="ticketData && !loading && !error" class="ticket-success">
          <!-- Header del Ticket -->
          <div class="ticket-header">
            <h1>🎫 Tu Ticket</h1>
            <p class="ticket-subtitle">{{ ticketData.event.name }}</p>
            <p v-if="eventStatus" class="event-status" :class="{ 'event-past': isEventPast, 'event-today': eventStatus.includes('Hoy') }">
              {{ eventStatus }}
            </p>
          </div>

          <!-- Información del Ticket -->
          <div class="ticket-info-card">
            <div class="ticket-details">
              <div class="detail-row">
                <span class="detail-label">Evento:</span>
                <span class="detail-value">{{ ticketData.event.name }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Fecha del evento:</span>
                <span class="detail-value">{{ formattedEventDate }}</span>
              </div>
              
              <div class="detail-row" v-if="ticketData.event.location">
                <span class="detail-label">Ubicación:</span>
                <span class="detail-value">{{ ticketData.event.location }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Invitado:</span>
                <span class="detail-value">{{ ticketData.guest.name }}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ ticketData.guest.email }}</span>
              </div>
            </div>
          </div>

          <!-- QR Code Preview -->
          <div class="qr-preview-card" v-if="qrImageUrl">
            <h3>Código QR de Entrada</h3>
            <div class="qr-image-container">
              <img :src="qrImageUrl" alt="QR Code" class="qr-image" />
            </div>
            <p class="qr-instruction">
              Presenta este código QR en el evento para ingresar
            </p>
          </div>

          <!-- Botones de Acción -->
          <div class="action-buttons">
            <ion-button 
              expand="block" 
              fill="solid"
              @click="downloadTicket" 
              :disabled="downloading"
              class="download-button"
            >
              <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
              {{ downloading ? 'Descargando...' : 'Descargar Ticket PDF' }}
            </ion-button>

            <ion-button 
              expand="block" 
              fill="outline"
              @click="shareTicket"
              class="share-button"
            >
              <ion-icon :icon="shareOutline" slot="start"></ion-icon>
              Compartir
            </ion-button>
          </div>

          <!-- Información Adicional -->
          <div class="additional-info">
            <ion-card>
              <ion-card-content>
                <h4>📱 Instrucciones importantes:</h4>
                <ul>
                  <li>Descarga el ticket antes del evento</li>
                  <li>Presenta el código QR en la entrada</li>
                  <li>Llega 15 minutos antes del inicio</li>
                  <li>Guarda este enlace por si necesitas descargar nuevamente</li>
                </ul>
              </ion-card-content>
            </ion-card>
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
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  toastController
} from '@ionic/vue'
import {
  downloadOutline,
  shareOutline,
  alertCircleOutline,
  refreshOutline,
  homeOutline
} from 'ionicons/icons'

// Importar servicios optimizados
import { getTicketByCode } from '@/services/email.js'
import { generateQRImage } from '@/utils/qr-generator.js'
import { generateTicketPDF } from '@/utils/pdf-generator.js'
import { useLoading } from '@/composables/useLoading.js'
import LoadingComponent from '@/components/LoadingComponent.vue'

// Router y route
const route = useRoute()
const router = useRouter()

// Estados del componente
const ticketData = ref(null)
const qrImageUrl = ref('')
const downloading = ref(false)
const retrying = ref(false)

// Hook de loading optimizado
const {
  isLoading: loading,
  error,
  withLoading,
  withTimeout,
  clearError
} = useLoading('downloadTicket')

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
    // Asegurarse de que usamos la fecha del evento programado
    const eventDate = new Date(ticketData.value.event.date)
    
    // Verificar que la fecha sea válida
    if (isNaN(eventDate.getTime())) {
      console.warn('Fecha del evento inválida:', ticketData.value.event.date)
      return ticketData.value.event.date
    }
    
    // Formatear la fecha del evento en español
    return eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Madrid' // Timezone español
    })
  } catch (error) {
    console.error('Error formateando fecha del evento:', error)
    return ticketData.value.event.date
  }
})

// Computed para saber si el evento ya pasó
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

// Computed para mostrar el estado del evento
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
      return '¡Hoy es el evento!'
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

// Función optimizada para generar vista previa del QR
const generateQRPreview = async () => {
  if (!ticketData.value?.qrCode) return
  
  try {
    const qrImage = generateQRImage(ticketData.value.qrCode, { 
      size: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    })
    qrImageUrl.value = qrImage
  } catch (error) {
    console.error('Error generando vista previa del QR:', error)
    // No es crítico, continuar sin QR preview
  }
}

// Función principal para cargar datos del ticket (optimizada)
const loadTicketData = async () => {
  if (!downloadCode.value) return

  await withLoading(async () => {
    clearError()
    ticketData.value = null
    qrImageUrl.value = ''
    
    console.log('🔍 [DB] Buscando ticket en base de datos:', downloadCode.value)
    
    // Usar timeout para evitar bloqueos
    const data = await withTimeout(
      () => getTicketByCode(downloadCode.value),
      15000 // 15 segundos timeout
    )
    
    if (!data) {
      throw new Error('Código no encontrado, inválido o expirado. Verifica que el enlace del email sea correcto.')
    }
    
    console.log('✅ Ticket encontrado en BD:', data.guest.name, '-', data.event.name)
    console.log('📅 Fecha del evento programado:', data.event.date)
    console.log('🏢 Ubicación del evento:', data.event.location || 'No especificada')
    
    ticketData.value = data
    
    // Generar vista previa del QR (no bloquear si falla)
    try {
      await generateQRPreview()
    } catch (error) {
      console.warn('No se pudo generar preview del QR:', error)
    }
    
  }, {
    showSuccessToast: false,
    showErrorToast: true,
    retries: 3,
    retryDelay: 2000
  })
}

// Función de descarga optimizada
const downloadTicket = async () => {
  if (!ticketData.value) return

  downloading.value = true
  
  try {
    console.log('📱 Generando PDF del ticket...')
    
    const pdfBlob = await withTimeout(
      () => generateTicketPDF(ticketData.value),
      30000 // 30 segundos para generar PDF
    )
    
    // Crear URL de descarga
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ticket-${ticketData.value.guest.name.replace(/\s+/g, '-')}-${ticketData.value.event.name.replace(/\s+/g, '-')}.pdf`
    
    // Simular click para descargar
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpiar URL
    URL.revokeObjectURL(url)
    
    console.log('✅ Ticket descargado exitosamente')
    
    const toast = await toastController.create({
      message: '✅ Ticket descargado correctamente',
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    
  } catch (error) {
    console.error('❌ Error descargando ticket:', error)
    
    const toast = await toastController.create({
      message: 'Error al descargar el ticket. Intenta de nuevo.',
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    downloading.value = false
  }
}

// Función para compartir
const shareTicket = async () => {
  if (!ticketData.value) return

  const shareData = {
    title: `Ticket - ${ticketData.value.event.name}`,
    text: `Mi ticket para ${ticketData.value.event.name}`,
    url: window.location.href
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
    } else {
      // Fallback: copiar al clipboard
      await navigator.clipboard.writeText(window.location.href)
      
      const toast = await toastController.create({
        message: '📋 Enlace copiado al portapapeles',
        duration: 2000,
        color: 'success',
        position: 'top'
      })
      await toast.present()
    }
  } catch (error) {
    console.error('Error compartiendo:', error)
  }
}

// Función de retry con mejor UX
const retryLoad = async () => {
  retrying.value = true
  clearError()
  
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

// Inicialización optimizada
onMounted(async () => {
  console.log('🎫 Inicializando DownloadTicket optimizado...')
  console.log('🔄 Parámetro código:', route.params.code)
  console.log('🏠 Mostrar bienvenida:', showWelcomePage.value)
  
  // Solo cargar datos si hay código válido
  if (downloadCode.value && downloadCode.value !== 'home') {
    await loadTicketData()
  }
})

// Watcher optimizado para cambios de ruta
watch(
  () => route.params.code, 
  async (newCode, oldCode) => {
    if (newCode !== oldCode) {
      console.log('🔄 Código cambió:', newCode)
      if (newCode && newCode !== 'home') {
        await loadTicketData()
      }
    }
  },
  { immediate: false }
)
</script>

<style scoped>
/* Contenedor principal optimizado */
.ticket-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

/* Vista de bienvenida mejorada */
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  overflow: hidden;
  animation: slideUp 0.5s ease-out;
}

.welcome-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 40px 20px;
}

.welcome-header h1 {
  margin: 0 0 8px 0;
  font-size: 2rem;
  font-weight: bold;
}

.welcome-header p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
}

.welcome-content {
  padding: 20px;
}

/* Estados de error optimizados */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.error-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  animation: slideUp 0.5s ease-out;
}

.error-icon {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 20px;
}

.error-card h2 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.error-card p {
  color: #7f8c8d;
  margin-bottom: 24px;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.retry-button {
  --background: #3498db;
  --color: white;
}

.home-button {
  --border-color: #bdc3c7;
  --color: #7f8c8d;
}

/* Ticket exitoso optimizado */
.ticket-success {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  animation: slideUp 0.5s ease-out;
}

.ticket-header {
  text-align: center;
  color: white;
  margin-bottom: 24px;
}

.ticket-header h1 {
  font-size: 2.5rem;
  margin: 0 0 8px 0;
  font-weight: bold;
}

.ticket-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0 0 8px 0;
}

.event-status {
  font-size: 1rem;
  margin: 0;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: inline-block;
  font-weight: 600;
}

.event-status.event-today {
  background: #f39c12;
  color: white;
  animation: subtle-pulse 2s infinite;
}

.event-status.event-past {
  background: #95a5a6;
  color: white;
}

.ticket-info-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.ticket-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 80px;
}

.detail-value {
  color: #34495e;
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

/* QR Preview optimizado */
.qr-preview-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.qr-preview-card h3 {
  color: #2c3e50;
  margin-bottom: 16px;
  font-size: 1.3rem;
}

.qr-image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.qr-image {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}

.qr-instruction {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

/* Botones de acción optimizados */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.download-button {
  --background: linear-gradient(135deg, #27ae60, #2ecc71);
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
}

.share-button {
  --border-color: white;
  --color: white;
  --border-radius: 12px;
  height: 48px;
}

/* Información adicional */
.additional-info {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.additional-info h4 {
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.additional-info ul {
  margin: 0;
  padding-left: 20px;
  color: #34495e;
}

.additional-info li {
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Animaciones */
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

/* Responsive mejorado */
@media (max-width: 576px) {
  .ticket-success {
    padding: 16px;
  }
  
  .ticket-header h1 {
    font-size: 2rem;
  }
  
  .ticket-subtitle {
    font-size: 1rem;
  }
  
  .ticket-info-card,
  .qr-preview-card {
    padding: 20px;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-value {
    text-align: left;
    margin-left: 0;
  }
  
  .qr-image {
    max-width: 150px;
  }
}

/* Estados de loading */
.ticket-container:has(.loading-overlay) {
  overflow: hidden;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .welcome-card,
  .error-card,
  .ticket-info-card,
  .qr-preview-card,
  .additional-info {
    background: #2c3e50;
    color: #ecf0f1;
  }
  
  .detail-row {
    border-bottom-color: #34495e;
  }
  
  .detail-label {
    color: #ecf0f1;
  }
  
  .detail-value {
    color: #bdc3c7;
  }
  
  .qr-image-container {
    background: #34495e;
  }
  
  .qr-instruction {
    color: #95a5a6;
  }
  
  .additional-info h4 {
    color: #ecf0f1;
  }
  
  .additional-info li {
    color: #bdc3c7;
  }
  
  .error-card h2 {
    color: #ecf0f1;
  }
  
  .error-card p {
    color: #95a5a6;
  }
  
  .ticket-header h1,
  .ticket-subtitle {
    color: #ecf0f1;
  }
  
  .qr-preview-card h3 {
    color: #ecf0f1;
  }
  
  .welcome-content h2,
  .welcome-content h3 {
    color: #3498db;
  }
  
  /* Ajustar botones para dark mode */
  .home-button {
    --border-color: #7f8c8d;
    --color: #bdc3c7;
  }
  
  .share-button {
    --border-color: rgba(255, 255, 255, 0.3);
    --color: rgba(255, 255, 255, 0.9);
  }
  
  /* Gradiente de fondo para dark mode */
  .ticket-container,
  .welcome-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }
}

/* Estados hover mejorados */
.download-button:hover {
  --background: linear-gradient(135deg, #229954, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(39, 174, 96, 0.3);
}

.share-button:hover {
  --background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.retry-button:hover {
  --background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
}

.home-button:hover {
  --background: rgba(189, 195, 199, 0.1);
  transform: translateY(-2px);
}

/* Transiciones suaves */
.download-button,
.share-button,
.retry-button,
.home-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ticket-info-card,
.qr-preview-card,
.additional-info,
.error-card,
.welcome-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.ticket-info-card:hover,
.qr-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

/* Estados de carga para botones */
.download-button[disabled] {
  --background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}

.retry-button[disabled] {
  --background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}

/* Mejoras de accesibilidad */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .ticket-info-card:hover,
  .qr-preview-card:hover {
    transform: none;
  }
  
  .download-button:hover,
  .share-button:hover,
  .retry-button:hover,
  .home-button:hover {
    transform: none;
  }
}

/* Focus visible para accesibilidad */
.download-button:focus-visible,
.share-button:focus-visible,
.retry-button:focus-visible,
.home-button:focus-visible {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 2px;
}

/* Optimizaciones para pantallas pequeñas */
@media (max-width: 480px) {
  .welcome-container {
    padding: 12px;
  }
  
  .welcome-header {
    padding: 32px 16px;
  }
  
  .welcome-header h1 {
    font-size: 1.8rem;
  }
  
  .error-container {
    padding: 16px;
  }
  
  .error-card {
    padding: 32px 20px;
  }
  
  .action-buttons {
    gap: 16px;
  }
  
  .download-button,
  .share-button {
    height: 56px;
    font-size: 1rem;
  }
  
  .error-actions {
    gap: 16px;
  }
  
  .ticket-header h1 {
    font-size: 2rem;
  }
  
  .ticket-subtitle {
    font-size: 1rem;
  }
}

/* Optimizaciones para tablets */
@media (min-width: 768px) and (max-width: 1024px) {
  .ticket-success {
    max-width: 700px;
  }
  
  .welcome-card {
    max-width: 600px;
  }
  
  .error-card {
    max-width: 500px;
  }
  
  .qr-image {
    max-width: 250px;
  }
}

/* Estados de conexión visual */
.ticket-container.offline {
  filter: grayscale(0.3);
}

.ticket-container.offline::before {
  content: "Sin conexión";
  position: fixed;
  top: 20px;
  right: 20px;
  background: #e74c3c;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  z-index: 1000;
  animation: slideInRight 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Indicador de carga en background */
.loading-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  z-index: 9998;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (prefers-color-scheme: dark) {
  .loading-backdrop {
    background: rgba(44, 62, 80, 0.95);
  }
  
  .ticket-container.offline::before {
    background: #c0392b;
    box-shadow: 0 4px 12px rgba(192, 57, 43, 0.4);
  }
}

/* Pulso sutil en elementos importantes */
@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.download-button.processing {
  animation: subtle-pulse 2s infinite;
}

/* Mejoras en los estados de loading del componente */
.ticket-container .loading-overlay {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

@media (prefers-color-scheme: dark) {
  .ticket-container .loading-overlay {
    background: rgba(44, 62, 80, 0.98);
  }
}

/* Estados para impresión */
@media print {
  .ticket-container {
    background: white !important;
  }
  
  .action-buttons,
  .additional-info {
    display: none;
  }
  
  .ticket-success {
    padding: 0;
    background: white;
  }
  
  .ticket-info-card,
  .qr-preview-card {
    box-shadow: none;
    border: 1px solid #ddd;
  }
}

/* Scroll suave en navegadores que lo soporten */
@supports (scroll-behavior: smooth) {
  html {
    scroll-behavior: smooth;
  }
}

/* Efectos adicionales para mejor UX */
.welcome-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}

.error-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
}

/* Indicadores de estado visual */
.ticket-container.loading {
  pointer-events: none;
}

.ticket-container.error {
  filter: hue-rotate(10deg);
}

/* Optimizaciones de performance */
.ticket-info-card,
.qr-preview-card,
.additional-info,
.welcome-card,
.error-card {
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
}

/* Estados de enfoque mejorados para navegación por teclado */
.welcome-card:focus-within,
.error-card:focus-within,
.ticket-info-card:focus-within {
  outline: 2px solid var(--ion-color-primary);
  outline-offset: 4px;
}

/* Mejoras para lectores de pantalla */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Indicadores de progreso sutiles */
.ticket-container.loading::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent 0%, 
    var(--ion-color-primary) 50%, 
    transparent 100%);
  animation: loading-bar 2s ease-in-out infinite;
  z-index: 10000;
}

@keyframes loading-bar {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Estilos para dispositivos de alta densidad */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .qr-image {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* Mejoras de contraste para usuarios con problemas de visión */
@media (prefers-contrast: high) {
  .detail-row {
    border-bottom-width: 2px;
  }
  
  .download-button,
  .retry-button {
    --background: #000;
    --color: #fff;
    border: 2px solid #000;
  }
  
  .share-button,
  .home-button {
    --border-width: 2px;
    --border-color: #000;
    --color: #000;
  }
}
</style>