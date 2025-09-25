<template>
  <ion-page>
    <!-- Header limpio -->
    <ion-header>
      <ion-toolbar>
        <ion-title>Descarga de Entrada</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Página de bienvenida cuando no hay código o es "home" -->
      <div v-if="showWelcomePage" class="welcome-container">
        <div class="welcome-card">
          <div class="welcome-header">
            <h1>Sistema QR Eventos</h1>
            <p>Gestión de invitados profesional</p>
          </div>
          
          <div class="welcome-content">
            <ion-card>
              <ion-card-content>
                <h2>¿Tienes un código de descarga?</h2>
                <p>Si recibiste un email con tu entrada, haz clic en el enlace del email para descargar tu PDF.</p>
                
                <div class="manual-code-section">
                  <ion-item>
                    <ion-label position="stacked">Código de descarga manual:</ion-label>
                    <ion-input v-model="manualCode" placeholder="Ingresa tu código aquí"></ion-input>
                  </ion-item>
                  
                  <ion-button @click="checkManualCode" expand="block" :disabled="!manualCode.trim()">
                    Verificar Código
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
            
            <ion-card>
              <ion-card-content>
                <h3>¿Eres organizador de eventos?</h3>
                <p>Accede al panel de administración para gestionar tus eventos e invitados.</p>
                <ion-button @click="goToAdminLogin" expand="block" fill="outline">
                  <ion-icon :icon="settingsOutline" slot="start"></ion-icon>
                  Acceso Administrador
                </ion-button>
              </ion-card-content>
            </ion-card>
          </div>
        </div>
      </div>

      <!-- Contenido de descarga cuando hay código válido -->
      <div v-else class="download-container">
        <!-- Estado de carga -->
        <ion-card v-if="loading" class="loading-card">
          <ion-card-content>
            <div class="loading-state">
              <ion-spinner name="crescent"></ion-spinner>
              <p>Verificando código de descarga...</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Datos del ticket encontrados -->
        <ion-card v-else-if="!loading && ticketData && !error" class="ticket-card">
          <ion-card-header>
            <ion-card-title>🎫 Descarga tu Entrada</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <!-- Información del evento -->
            <div class="event-info">
              <h1>{{ ticketData.event.name }}</h1>
              <div class="event-details">
                <p><ion-icon :icon="personOutline"></ion-icon> <strong>Invitado:</strong> {{ ticketData.guest.name }}</p>
                <p><ion-icon :icon="calendarOutline"></ion-icon> <strong>Fecha:</strong> {{ formatDate(ticketData.event.date) }}</p>
                <p><ion-icon :icon="locationOutline"></ion-icon> <strong>Lugar:</strong> {{ ticketData.event.location || 'Por confirmar' }}</p>
                <p><ion-icon :icon="mailOutline"></ion-icon> <strong>Email:</strong> {{ ticketData.guest.email }}</p>
              </div>
            </div>

            <!-- Botón de descarga principal -->
            <div class="download-section">
              <ion-button 
                @click="downloadPDF" 
                expand="block" 
                color="primary"
                size="large"
                :disabled="downloading"
                class="download-button"
              >
                <ion-icon :icon="downloading ? reloadOutline : downloadOutline" slot="start"></ion-icon>
                {{ downloading ? 'Generando PDF...' : 'Descargar Entrada PDF' }}
              </ion-button>
              
              <p class="download-note">
                Tu entrada será descargada en formato PDF con código QR incluido
              </p>
            </div>

            <!-- Vista previa del QR -->
            <div class="qr-preview" v-if="qrImageUrl">
              <h3>Vista previa del código QR:</h3>
              <div class="qr-container">
                <img :src="qrImageUrl" alt="Código QR" />
                <p>También disponible en el PDF descargable</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estado de error -->
        <ion-card v-else-if="error" class="error-card">
          <ion-card-content>
            <div class="error-state">
              <ion-icon :icon="alertCircleOutline" color="danger" size="large"></ion-icon>
              <h2>Código no válido</h2>
              <p>{{ error }}</p>
              
              <div class="error-actions">
                <ion-button @click="goToHome" fill="outline">
                  <ion-icon :icon="homeOutline" slot="start"></ion-icon>
                  Volver al inicio
                </ion-button>
                
                <ion-button @click="retryLoad" color="primary">
                  <ion-icon :icon="reloadOutline" slot="start"></ion-icon>
                  Reintentar
                </ion-button>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Información de ayuda simplificada -->
        <ion-card v-if="!loading && !error && ticketData" class="help-card">
          <ion-card-content>
            <h3><ion-icon :icon="helpCircleOutline"></ion-icon> ¿Necesitas Ayuda?</h3>
            <p>Si tienes problemas con la descarga o dudas sobre el evento, contacta directamente con el organizador.</p>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSpinner,
  IonItem,
  IonLabel,
  IonInput,
  toastController
} from '@ionic/vue'
import {
  downloadOutline,
  personOutline,
  calendarOutline,
  locationOutline,
  mailOutline,
  alertCircleOutline,
  homeOutline,
  reloadOutline,
  helpCircleOutline,
  settingsOutline
} from 'ionicons/icons'
// @ts-ignore
import { generateTicketPDF } from '@/services/ticketPDF'
// @ts-ignore
import { getTicketByCode } from '@/services/email'
// @ts-ignore
import { generateQRImage } from '@/services/qr'

const route = useRoute()
const router = useRouter()

// Estado reactivo
const loading = ref(false)
const downloading = ref(false)
const ticketData = ref<any>(null)
const error = ref('')
const qrImageUrl = ref('')
const manualCode = ref('')

// Computed properties
const downloadCode = computed(() => {
  const code = route.params.code as string
  return code && code !== 'home' ? code : null
})

const showWelcomePage = computed(() => {
  return !downloadCode.value
})

// Formatear fecha
const formatDate = (dateString: string | number) => {
  if (!dateString) return 'Fecha por confirmar'
  
  try {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString)
    
    if (isNaN(date.getTime())) {
      return 'Fecha por confirmar'
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('Error formateando fecha:', error)
    return 'Fecha por confirmar'
  }
}

// Ir a login de admin
const goToAdminLogin = () => {
  router.push('/login')
}

// Verificar código manual
const checkManualCode = async () => {
  if (!manualCode.value.trim()) return
  
  // Redirigir a la URL de descarga con el código manual
  router.push(`/download-ticket/${manualCode.value.trim()}`)
}

// Descargar PDF
const downloadPDF = async () => {
  if (!ticketData.value) return
  
  downloading.value = true
  
  try {
    console.log('📥 Iniciando descarga de PDF para:', ticketData.value.guest.name)
    
    await generateTicketPDF(
      ticketData.value.guest, 
      ticketData.value.event,
      null // Sin logo por defecto
    )
    
    const toast = await toastController.create({
      message: '✅ Entrada descargada exitosamente',
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    
    console.log('✅ PDF descargado exitosamente')
    
  } catch (err: any) {
    console.error('❌ Error descargando PDF:', err)
    
    const toast = await toastController.create({
      message: `Error al generar el PDF: ${err.message || 'Error desconocido'}`,
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    downloading.value = false
  }
}

// Generar vista previa del QR
const generateQRPreview = async () => {
  if (!ticketData.value || !ticketData.value.qrCode) return
  
  try {
    const qrImage = generateQRImage(ticketData.value.qrCode, { size: 300 })
    qrImageUrl.value = qrImage
  } catch (error) {
    console.error('Error generando vista previa del QR:', error)
  }
}

// Cargar datos del ticket desde la base de datos
const loadTicketData = async () => {
  if (!downloadCode.value) return
  
  loading.value = true
  error.value = ''
  ticketData.value = null
  qrImageUrl.value = ''
  
  console.log('🔍 [DB] Buscando ticket en base de datos:', downloadCode.value)
  
  try {
    // Pequeño delay para mejor UX visual
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Llamada asíncrona a la base de datos
    const data = await getTicketByCode(downloadCode.value)
    
    if (!data) {
      error.value = 'Código no encontrado, inválido o expirado. Verifica que el enlace del email sea correcto.'
      console.log('❌ Ticket no encontrado en BD')
      return
    }
    
    console.log('✅ Ticket encontrado en BD:', data.guest.name, '-', data.event.name)
    
    ticketData.value = data
    
    // Generar vista previa del QR
    await generateQRPreview()
    
  } catch (err: any) {
    console.error('❌ Error cargando ticket desde BD:', err)
    error.value = 'Error de conexión con el servidor. Por favor, intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

// Reintentar carga
const retryLoad = async () => {
  await loadTicketData()
}

// Ir al inicio (página de bienvenida)
const goToHome = () => {
  router.push('/download-ticket/home')
}

// Inicializar
onMounted(async () => {
  console.log('🏁 Inicializando DownloadTicket con base de datos...')
  console.log('📄 Parámetro código:', route.params.code)
  console.log('🏠 Mostrar bienvenida:', showWelcomePage.value)
  
  // Solo cargar datos si hay código válido
  if (downloadCode.value) {
    await loadTicketData()
  }
})

// Watcher para detectar cambios en la ruta
import { watch } from 'vue'
watch(() => route.params.code, async (newCode) => {
  console.log('🔄 Código cambió:', newCode)
  if (newCode && newCode !== 'home') {
    await loadTicketData()
  }
})
</script>

<style scoped>
/* Estilos para la página de bienvenida */
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

.welcome-content ion-card {
  margin: 16px 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.welcome-content h2 {
  color: var(--ion-color-primary);
  font-size: 1.3rem;
  margin-bottom: 12px;
}

.welcome-content h3 {
  color: var(--ion-color-primary);
  font-size: 1.2rem;
  margin-bottom: 8px;
}

.manual-code-section {
  margin-top: 20px;
}

.manual-code-section ion-button {
  margin-top: 16px;
}

/* Estilos para el contenedor de descarga */
.download-container {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.loading-card,
.error-card {
  margin-bottom: 16px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-state ion-spinner {
  margin-bottom: 16px;
}

.loading-state p,
.error-state p {
  color: var(--ion-color-medium);
  font-size: 1rem;
}

.error-state ion-icon {
  margin-bottom: 20px;
}

.error-state h2 {
  color: var(--ion-color-danger);
  margin-bottom: 12px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.ticket-card {
  margin-bottom: 16px;
}

.event-info {
  margin-bottom: 24px;
}

.event-info h1 {
  color: var(--ion-color-primary);
  margin-bottom: 16px;
  font-size: 1.8rem;
  text-align: center;
}

.event-details {
  background: var(--ion-color-light);
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid var(--ion-color-primary);
}

.event-details p {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.event-details ion-icon {
  color: var(--ion-color-primary);
  min-width: 20px;
}

.download-section {
  margin: 24px 0;
  text-align: center;
}

.download-button {
  height: 56px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.download-note {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.qr-preview {
  margin-top: 24px;
  text-align: center;
}

.qr-preview h3 {
  color: var(--ion-color-dark);
  margin-bottom: 16px;
}

.qr-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 2px dashed var(--ion-color-medium);
  display: inline-block;
}

.qr-container img {
  max-width: 300px;
  height: auto;
  border-radius: 8px;
}

.qr-container p {
  margin-top: 12px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.help-card {
  margin-top: 16px;
  background: var(--ion-color-light-tint);
}

.help-card h3 {
  color: var(--ion-color-dark);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-card p {
  margin: 0;
  color: var(--ion-color-dark);
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-container {
    padding: 16px;
  }
  
  .welcome-header {
    padding: 30px 16px;
  }
  
  .welcome-header h1 {
    font-size: 1.6rem;
  }
  
  .welcome-content {
    padding: 16px;
  }
  
  .download-container {
    padding: 12px;
  }
  
  .event-info h1 {
    font-size: 1.5rem;
  }
  
  .event-details p {
    font-size: 0.9rem;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .qr-container img {
    max-width: 250px;
  }
}
</style>