<template>
  <ion-page>
    <AppHeader />
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Enviar QRs</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="send-container">
        <!-- Selector de evento -->
        <ion-card class="event-selector">
          <ion-card-content>
            <div class="event-header">
              <div class="event-info">
                <h2>{{ currentEvent?.name || 'Sin evento seleccionado' }}</h2>
                <p v-if="currentEvent">
                  {{ formatDate(currentEvent.date) }} • {{ currentEventGuests.length }} invitados
                </p>
              </div>
              <ion-select
                v-if="eventsStore.events.length > 1"
                :value="eventsStore.currentEventId"
                @ionChange="selectEvent($event.detail.value)"
                placeholder="Seleccionar evento"
                interface="popover"
              >
                <ion-select-option
                  v-for="event in eventsStore.events"
                  :key="event.id"
                  :value="event.id"
                >
                  {{ event.name }}
                </ion-select-option>
              </ion-select>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estado de EmailJS -->
        <ion-card>
          <ion-card-content>
            <div class="email-config-status">
              <div class="config-header">
                <h3>Estado de EmailJS</h3>
                <ion-chip :color="emailConfig.ready ? 'success' : 'warning'">
                  {{ emailConfig.ready ? 'Configurado' : 'Pendiente' }}
                </ion-chip>
              </div>
              <div class="config-details">
                <p><span class="config-item">Service ID:</span> {{ emailConfig.hasServiceId ? '✅ Configurado' : '❌ Faltante' }}</p>
                <p><span class="config-item">Template ID:</span> {{ emailConfig.hasTemplateId ? '✅ Configurado' : '❌ Faltante' }}</p>
                <p><span class="config-item">Public Key:</span> {{ emailConfig.hasPublicKey ? '✅ Configurado' : '❌ Faltante' }}</p>
              </div>
              <ion-note v-if="!emailConfig.ready" color="warning">
                Configura las variables de entorno VITE_EMAILJS_* para envío real. Por ahora se simularán los envíos.
              </ion-note>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Control de envío -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Control de Envío</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>
                <h2>Envío automático</h2>
                <p>{{ autoSendEnabled ? 'Los QRs se envían automáticamente' : 'Envío manual activado' }}</p>
              </ion-label>
              <ion-toggle 
                v-model="autoSendEnabled"
                :disabled="!currentEvent"
              ></ion-toggle>
            </ion-item>
            
            <ion-button 
              expand="block" 
              @click="sendAllQRs"
              :disabled="isSending || pendingGuests.length === 0 || !currentEvent"
              color="success"
              class="send-button"
            >
              <ion-icon :icon="mailOutline" slot="start"></ion-icon>
              <ion-spinner v-if="isSending" slot="start"></ion-spinner>
              {{ isSending ? 'Enviando...' : `Enviar QRs (${pendingGuests.length})` }}
            </ion-button>
            
            <!-- Barra de progreso -->
            <div v-if="isSending" class="progress-container">
              <ion-progress-bar 
                :value="sendProgress"
                color="success"
              ></ion-progress-bar>
              <p class="progress-text">
                {{ currentSendStatus }}
              </p>
              <p class="progress-stats">
                {{ sentCount }}/{{ totalToSend }} • {{ Math.round(sendProgress * 100) }}%
              </p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estadísticas de envío -->
        <ion-card>
          <ion-card-content>
            <ion-row>
              <ion-col size="3">
                <div class="stat-mini">
                  <div class="stat-number">{{ currentEventGuests.length }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-mini pending">
                  <div class="stat-number">{{ pendingGuests.length }}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-mini sent">
                  <div class="stat-number">{{ sentGuests.length }}</div>
                  <div class="stat-label">Enviados</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-mini scanned">
                  <div class="stat-number">{{ scannedGuests.length }}</div>
                  <div class="stat-label">Validados</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-card-content>
        </ion-card>

        <!-- Lista de estado de envíos -->
        <ion-card>
          <ion-card-header>
            <div class="list-header">
              <ion-card-title>Estado de Envíos</ion-card-title>
              <ion-segment v-model="selectedTab" class="status-segment">
                <ion-segment-button value="pending">
                  <ion-label>Pendientes ({{ pendingGuests.length }})</ion-label>
                </ion-segment-button>
                <ion-segment-button value="sent">
                  <ion-label>Enviados ({{ sentGuests.length }})</ion-label>
                </ion-segment-button>
              </ion-segment>
            </div>
          </ion-card-header>
          
          <ion-card-content>
            <!-- Lista de pendientes -->
            <ion-list v-if="selectedTab === 'pending' && pendingGuests.length > 0">
              <ion-item v-for="guest in pendingGuests" :key="guest.id">
                <ion-avatar slot="start">
                  <div class="avatar-placeholder pending">
                    {{ guest.name.charAt(0).toUpperCase() }}
                  </div>
                </ion-avatar>
                
                <ion-label>
                  <h2>{{ guest.name }}</h2>
                  <p>{{ guest.email }}</p>
                  <p v-if="guest.phone" class="phone">📞 {{ guest.phone }}</p>
                </ion-label>
                
                <ion-button 
                  slot="end" 
                  size="small" 
                  fill="outline"
                  @click="sendSingleQR(guest)"
                  :disabled="isSending"
                  color="primary"
                >
                  <ion-icon :icon="mailOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>
            
            <!-- Lista de enviados -->
            <ion-list v-if="selectedTab === 'sent' && sentGuests.length > 0">
              <ion-item v-for="guest in sentGuests" :key="guest.id">
                <ion-avatar slot="start">
                  <div class="avatar-placeholder sent">
                    {{ guest.name.charAt(0).toUpperCase() }}
                  </div>
                </ion-avatar>
                
                <ion-label>
                  <h2>{{ guest.name }}</h2>
                  <p>{{ guest.email }}</p>
                  <p class="timestamp" v-if="guest.sent_at">
                    Enviado: {{ formatDateTime(guest.sent_at) }}
                  </p>
                  <p v-if="!emailConfig.ready" class="simulated-note">
                    📧 Envío simulado (EmailJS no configurado)
                  </p>
                </ion-label>
                
                <ion-chip :color="guest.scanned ? 'success' : 'warning'" slot="end">
                  {{ guest.scanned ? 'VALIDADO' : 'ENVIADO' }}
                </ion-chip>
              </ion-item>
            </ion-list>
            
            <!-- Estado vacío -->
            <div v-if="!currentEvent" class="empty-state">
              <ion-icon :icon="calendarOutline" size="large" color="medium"></ion-icon>
              <h3>Selecciona un evento</h3>
              <p>Primero selecciona un evento para enviar QRs</p>
            </div>
            
            <div v-else-if="selectedTab === 'pending' && pendingGuests.length === 0" class="empty-state success">
              <ion-icon :icon="checkmarkCircleOutline" size="large" color="success"></ion-icon>
              <h3>✅ Todos los QRs enviados</h3>
              <p>No hay invitados pendientes de envío</p>
            </div>
            
            <div v-else-if="selectedTab === 'sent' && sentGuests.length === 0" class="empty-state">
              <ion-icon :icon="mailOutline" size="large" color="medium"></ion-icon>
              <h3>No hay QRs enviados</h3>
              <p>Comienza enviando QRs a tus invitados</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonButton,
  IonToggle,
  IonIcon,
  IonProgressBar,
  IonList,
  IonAvatar,
  IonChip,
  IonRow,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonNote,
  toastController
} from '@ionic/vue'
import {
  mailOutline,
  calendarOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Guest } from '@/stores/events'

// Tipos para el servicio de email
interface EmailConfig {
  ready: boolean
  hasServiceId: boolean
  hasTemplateId: boolean
  hasPublicKey: boolean
}

interface EmailResult {
  success: boolean
  simulated?: boolean
  messageId?: string
  error?: string
}

interface ProgressInfo {
  current: number
  total: number
  percentage: number
  currentGuest: string
  status: string
}

// Importaciones del servicio de email usando @ts-ignore para evitar errores de tipo
// @ts-ignore
import { sendQREmail, sendBulkQREmails, checkEmailConfig } from '@/services/email'

// Estado reactivo
const autoSendEnabled = ref(false)
const isSending = ref(false)
const sendProgress = ref(0)
const currentSendStatus = ref('')
const sentCount = ref(0)
const totalToSend = ref(0)
const selectedTab = ref('pending')
const emailConfig = ref<EmailConfig>({ ready: false, hasServiceId: false, hasTemplateId: false, hasPublicKey: false })

// Computed properties
const currentEvent = computed(() => eventsStore.currentEvent)
const currentEventGuests = computed(() => eventsStore.currentEventGuests)

const pendingGuests = computed(() => 
  currentEventGuests.value.filter(guest => !guest.sent)
)

const sentGuests = computed(() => 
  currentEventGuests.value.filter(guest => guest.sent)
)

const scannedGuests = computed(() => 
  currentEventGuests.value.filter(guest => guest.scanned)
)

// Inicializar
onMounted(() => {
  eventsStore.init()
  emailConfig.value = checkEmailConfig()
  console.log('Email config:', emailConfig.value)
})

// Formatear fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Seleccionar evento
const selectEvent = (eventId: string) => {
  eventsStore.setCurrentEvent(eventId)
}

// Función para enviar todos los QRs
const sendAllQRs = async () => {
  if (!currentEvent.value || pendingGuests.value.length === 0) return

  const confirm = window.confirm(
    `¿Enviar QRs a ${pendingGuests.value.length} invitados del evento "${currentEvent.value.name}"?`
  )
  
  if (!confirm) return

  isSending.value = true
  sendProgress.value = 0
  sentCount.value = 0
  totalToSend.value = pendingGuests.value.length
  currentSendStatus.value = 'Preparando envío...'

  try {
    const guestsToSend = [...pendingGuests.value]
    
    // Preparar datos para envío masivo según la función de email.js
    const guestsWithQRs = guestsToSend.map(guest => {
      // Generar datos del QR - verificar que currentEvent.value no es null
      if (!currentEvent.value) throw new Error('No hay evento seleccionado')
      
      const qrData = {
        guestId: guest.id,
        eventId: currentEvent.value.id,
        name: guest.name,
        email: guest.email,
        eventName: currentEvent.value.name,
        timestamp: new Date().toISOString()
      }
      
      return {
        guest: {
          ...guest,
          event_name: currentEvent.value.name // Asegurar que tenga el nombre del evento
        },
        qrCode: JSON.stringify(qrData)
      }
    })

    // Opciones para el email
    const emailOptions = {
      eventName: currentEvent.value.name,
      eventDate: formatDate(currentEvent.value.date),
      eventLocation: currentEvent.value.location || 'Ubicación por confirmar',
      organizerName: 'Organizador del Evento'
    }

    // Callback de progreso
    const progressCallback = (progress: any) => {
      sendProgress.value = progress.percentage / 100
      currentSendStatus.value = `${progress.status === 'sending' ? 'Enviando' : 'Enviado'} a ${progress.currentGuest}...`
      if (progress.status === 'success') {
        sentCount.value = progress.current
      }
    }

    // Usar la función de envío masivo de email.js
    const results = await sendBulkQREmails(guestsWithQRs, emailOptions, progressCallback)
    
    // Marcar invitados como enviados
    for (const guest of guestsToSend) {
      guest.sent = true
      guest.sent_at = new Date().toISOString()
    }
    
    // Guardar cambios
    eventsStore.saveGuests()
    
    currentSendStatus.value = '✅ Envío completado'
    
    // Mostrar resultado
    const message = emailConfig.value.ready 
      ? `✅ ${results.sent || results.total} QRs enviados correctamente`
      : `📧 ${results.total} QRs procesados (modo simulación)`
    
    const toast = await toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    
  } catch (error) {
    console.error('Error sending QRs:', error)
    
    const toast = await toastController.create({
      message: 'Error durante el envío masivo',
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    isSending.value = false
  }
}

// Función para enviar QR individual
const sendSingleQR = async (guest: Guest) => {
  if (!currentEvent.value) return

  try {
    // Generar datos del QR
    const qrData = {
      guestId: guest.id,
      eventId: currentEvent.value.id,
      name: guest.name,
      email: guest.email,
      eventName: currentEvent.value.name,
      timestamp: new Date().toISOString()
    }
    
    // Preparar guest con event_name
    const guestWithEvent = {
      ...guest,
      event_name: currentEvent.value.name
    }
    
    // Opciones para el email
    const emailOptions = {
      eventName: currentEvent.value.name,
      eventDate: formatDate(currentEvent.value.date),
      eventLocation: currentEvent.value.location || 'Ubicación por confirmar',
      organizerName: 'Organizador del Evento'
    }

    // Enviar usando la función de email.js
    const result = await sendQREmail(guestWithEvent, JSON.stringify(qrData), emailOptions)
    
    if (result.success) {
      // Marcar como enviado
      guest.sent = true
      guest.sent_at = new Date().toISOString()
      
      // Guardar cambios
      eventsStore.saveGuests()
      
      const message = result.simulated 
        ? `📧 Envío simulado para ${guest.name} (EmailJS no configurado)`
        : `✅ QR enviado a ${guest.name}`
      
      const toast = await toastController.create({
        message,
        duration: 2000,
        color: result.simulated ? 'warning' : 'success',
        position: 'top'
      })
      await toast.present()
    }
  } catch (error) {
    console.error('Error sending single QR:', error)
    
    const toast = await toastController.create({
      message: `Error al enviar QR a ${guest.name}`,
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
}
</script>

<style scoped>
.send-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.event-selector {
  margin-bottom: 16px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.event-info h2 {
  margin: 0 0 4px 0;
  color: var(--ion-color-primary);
}

.event-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.email-config-status {
  border: 1px solid var(--ion-color-light);
  border-radius: 8px;
  padding: 16px;
  background: var(--ion-color-light-tint);
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.config-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.config-details {
  margin-bottom: 12px;
}

.config-details p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.config-item {
  font-weight: 500;
  color: var(--ion-color-dark);
}

.send-button {
  margin-top: 16px;
  height: 48px;
  font-weight: 600;
}

.progress-container {
  margin-top: 16px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 0.9rem;
  color: var(--ion-color-dark);
  font-weight: 500;
}

.progress-stats {
  text-align: center;
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.stat-mini {
  text-align: center;
  padding: 16px 8px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 8px;
}

.stat-mini.pending {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.stat-mini.sent {
  background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
}

.stat-mini.scanned {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 4px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.status-segment {
  min-width: 300px;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.avatar-placeholder.pending {
  background: #6c757d;
}

.avatar-placeholder.sent {
  background: #28a745;
}

.phone {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.timestamp {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.simulated-note {
  font-size: 0.8rem;
  color: var(--ion-color-warning);
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.empty-state.success {
  color: var(--ion-color-success);
}

.empty-state ion-icon {
  margin-bottom: 16px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .status-segment {
    min-width: auto;
  }
  
  .stat-mini {
    padding: 12px 4px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
}
</style>