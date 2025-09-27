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
        <!-- Header simple -->
        <div class="page-header">
          <h1>Envío de QRs</h1>
          <ion-select
            v-if="eventsStore.events.length > 1"
            :value="eventsStore.currentEventId"
            @ionChange="selectEvent($event.detail.value)"
            placeholder="Seleccionar evento"
            interface="popover"
            class="event-select"
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

        <!-- Información del evento actual -->
        <div class="event-info-card" v-if="currentEvent">
          <div class="event-details">
            <h2>{{ currentEvent.name }}</h2>
            <p>{{ formatDate(currentEvent.date) }} • {{ currentEventGuests.length }} invitados</p>
          </div>
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-value">{{ pendingGuests.length }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ sentGuests.length }}</span>
              <span class="stat-label">Enviados</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ scannedGuests.length }}</span>
              <span class="stat-label">Validados</span>
            </div>
          </div>
        </div>

        <!-- Botón principal de envío -->
        <div class="send-section" v-if="currentEvent">
          <ion-button 
            expand="block" 
            @click="sendAllQRs"
            :disabled="isSending || pendingGuests.length === 0"
            class="send-button"
          >
            <ion-icon :icon="mailOutline" slot="start" v-if="!isSending"></ion-icon>
            <ion-spinner v-if="isSending" name="crescent" slot="start"></ion-spinner>
            {{ isSending ? 'Enviando...' : `Enviar QRs (${pendingGuests.length})` }}
          </ion-button>
          
          <!-- Barra de progreso -->
          <div v-if="isSending" class="progress-container">
            <ion-progress-bar 
              :value="sendProgress"
              color="primary"
            ></ion-progress-bar>
            <p class="progress-text">{{ currentSendStatus }}</p>
            <p class="progress-stats">
              {{ sentCount }}/{{ totalToSend }} • {{ Math.round(sendProgress * 100) }}%
            </p>
          </div>

          <div class="send-note">
            <p>Los emails se enviarán con PDFs adjuntos. Verifica tu configuración de EmailJS si no funcionan.</p>
          </div>
        </div>

        <!-- Lista de invitados -->
        <div class="guests-section" v-if="currentEvent">
          <div class="section-header">
            <h3>Estado de Envíos</h3>
            <ion-segment v-model="selectedTab" class="status-segment">
              <ion-segment-button value="pending">
                <ion-label>Pendientes ({{ pendingGuests.length }})</ion-label>
              </ion-segment-button>
              <ion-segment-button value="sent">
                <ion-label>Enviados ({{ sentGuests.length }})</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>

          <!-- Lista de pendientes -->
          <div class="guests-list" v-if="selectedTab === 'pending' && pendingGuests.length > 0">
            <div
              v-for="guest in pendingGuests"
              :key="guest.id"
              class="guest-item pending"
            >
              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="guest-info">
                <h4>{{ guest.name }}</h4>
                <p>{{ guest.email }}</p>
                <p v-if="guest.phone" class="phone">{{ guest.phone }}</p>
              </div>
              
              <div class="guest-actions">
                <ion-button 
                  size="small" 
                  fill="outline"
                  @click="sendSingleQR(guest)"
                  :disabled="isSending"
                >
                  <ion-icon :icon="mailOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Lista de enviados -->
          <div class="guests-list" v-if="selectedTab === 'sent' && sentGuests.length > 0">
            <div
              v-for="guest in sentGuests"
              :key="guest.id"
              class="guest-item sent"
            >
              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="guest-info">
                <h4>{{ guest.name }}</h4>
                <p>{{ guest.email }}</p>
                <p class="timestamp" v-if="guest.sent_at">
                  Enviado: {{ formatDateTime(guest.sent_at) }}
                </p>
                <p v-if="(guest as any).simulated_send" class="simulated-note">
                  Envío simulado (configurar EmailJS)
                </p>
              </div>
              
              <div class="guest-status">
                <span class="status-badge" :class="guest.has_entered || guest.scanned ? 'validated' : 'sent'">
                  {{ guest.has_entered || guest.scanned ? 'VALIDADO' : 'ENVIADO' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Estados vacíos -->
          <div v-if="selectedTab === 'pending' && pendingGuests.length === 0" class="empty-state success">
            <ion-icon :icon="checkmarkCircleOutline" size="large"></ion-icon>
            <h4>Todos los QRs enviados</h4>
            <p>No hay invitados pendientes de envío</p>
          </div>
          
          <div v-if="selectedTab === 'sent' && sentGuests.length === 0" class="empty-state">
            <ion-icon :icon="mailOutline" size="large"></ion-icon>
            <h4>No hay QRs enviados</h4>
            <p>Comienza enviando QRs a tus invitados</p>
          </div>
        </div>

        <!-- Estado sin evento -->
        <div v-if="!currentEvent" class="no-event">
          <ion-icon :icon="calendarOutline" size="large"></ion-icon>
          <h3>Sin evento seleccionado</h3>
          <p>Selecciona un evento para enviar QRs</p>
        </div>
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
  IonLabel,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  toastController
} from '@ionic/vue'
import {
  mailOutline,
  calendarOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Guest } from '@/stores/events'
// @ts-ignore
import { supabase } from '@/services/supabase.js'
// @ts-ignore
import { sendQREmail, sendBulkQREmails, diagnoseEmailJS } from '@/services/email'

// Estado reactivo
const isSending = ref(false)
const sendProgress = ref(0)
const currentSendStatus = ref('')
const sentCount = ref(0)
const totalToSend = ref(0)
const selectedTab = ref('pending')

// Computed properties
const currentEvent = computed(() => eventsStore.currentEvent)
const currentEventGuests = computed(() => eventsStore.currentEventGuests)

const pendingGuests = computed(() => 
  currentEventGuests.value.filter(guest => !guest.qr_sent && !guest.sent)
)

const sentGuests = computed(() => 
  currentEventGuests.value.filter(guest => guest.qr_sent || guest.sent)
)

const scannedGuests = computed(() => 
  currentEventGuests.value.filter(guest => guest.has_entered || guest.scanned)
)

// Inicializar
onMounted(async () => {
  try {
    console.log('Inicializando SendTab...')
    await eventsStore.init()
    
    setTimeout(() => {
      if (eventsStore.events.length > 0 && !eventsStore.currentEventId) {
        eventsStore.setCurrentEvent(eventsStore.events[0].id)
      }
    }, 100)
    
    if (import.meta.env.DEV) {
      diagnoseEmailJS()
    }
    
  } catch (error) {
    console.error('Error inicializando SendTab:', error)
    
    const toast = await toastController.create({
      message: 'Error conectando con la base de datos',
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
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
  const event = eventsStore.events.find(e => e.id === eventId)
  eventsStore.setCurrentEvent(eventId)
  
  if (event) {
    toastController.create({
      message: `Evento seleccionado: ${event.name}`,
      duration: 2000,
      color: 'success',
      position: 'top'
    }).then(toast => toast.present())
  }
}

// Función para enviar todos los QRs
const sendAllQRs = async () => {
  if (!currentEvent.value) {
    const toast = await toastController.create({
      message: 'Selecciona un evento primero',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }

  if (pendingGuests.value.length === 0) {
    const toast = await toastController.create({
      message: 'No hay invitados pendientes de envío',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }

  const confirm = window.confirm(
    `¿Enviar entradas con PDF y QRs a ${pendingGuests.value.length} invitados del evento "${currentEvent.value.name}"?`
  )
  
  if (!confirm) return

  isSending.value = true
  sendProgress.value = 0
  sentCount.value = 0
  totalToSend.value = pendingGuests.value.length
  currentSendStatus.value = 'Preparando envío con PDFs...'

  try {
    const guestsToSend = [...pendingGuests.value]
    
    const guestsWithQRs = guestsToSend.map(guest => {
      if (!currentEvent.value) throw new Error('No hay evento seleccionado')
      
      const qrData = {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        event_name: currentEvent.value.name,
        eventId: currentEvent.value.id,
        eventName: currentEvent.value.name,
        timestamp: new Date().toISOString(),
        date: new Date().toDateString(),
        version: '1.0'
      }
      
      return {
        guest: {
          ...guest,
          event_name: currentEvent.value.name,
          event_id: currentEvent.value.id
        },
        qrCode: JSON.stringify(qrData)
      }
    })

    const emailOptions = {
      eventId: currentEvent.value.id,
      eventName: currentEvent.value.name,
      eventDate: formatDate(currentEvent.value.date),
      eventLocation: currentEvent.value.location || 'Ubicación por confirmar',
      organizerName: 'Organizador del Evento',
      logoBase64: null
    }

    const progressCallback = (progress: any) => {
      sendProgress.value = progress.percentage / 100
      
      let statusText = ''
      switch (progress.status) {
        case 'sending':
          statusText = `Generando PDF y enviando a ${progress.currentGuest}...`
          break
        case 'success':
          statusText = `Enviado a ${progress.currentGuest}`
          sentCount.value = progress.current
          break
        case 'simulated':
          statusText = `Simulado para ${progress.currentGuest}`
          sentCount.value = progress.current
          break
        case 'error':
          statusText = `Error con ${progress.currentGuest}`
          break
        default:
          statusText = `Procesando ${progress.currentGuest}...`
      }
      
      currentSendStatus.value = statusText
    }

    const results = await sendBulkQREmails(guestsWithQRs, emailOptions, progressCallback)
    
    // Marcar invitados como enviados
    let updatedGuests = 0
    for (const guest of guestsToSend) {
      const { error } = await supabase
        .from('guests')
        .update({
          qr_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', guest.id)
      
      if (error) {
        console.error('Error actualizando guest en Supabase:', error)
      } else {
        guest.qr_sent = true
        guest.sent = true
        guest.sent_at = new Date().toISOString()
        ;(guest as any).simulated_send = results.simulated > 0
        ;(guest as any).has_pdf = true
        updatedGuests++
      }
    }
    
    currentSendStatus.value = 'Envío completado'
    
    let message = ''
    let toastColor = 'success'
    
    if (results.failed > 0) {
      message = `${results.sent || 0} PDFs enviados, ${results.failed} fallaron`
      toastColor = 'warning'
    } else if (results.simulated > 0) {
      message = `${results.simulated} entradas PDF procesadas (modo simulación)`
      toastColor = 'warning'
    } else if (results.sent > 0) {
      message = `${results.sent} entradas enviadas correctamente`
      toastColor = 'success'
    } else {
      message = `No se pudo enviar ninguna entrada`
      toastColor = 'danger'
    }
    
    const toast = await toastController.create({
      message,
      duration: 5000,
      color: toastColor,
      position: 'top'
    })
    await toast.present()
    
  } catch (error: any) {
    console.error('Error sending QRs:', error)
    
    const toast = await toastController.create({
      message: `Error durante el envío: ${error?.message || 'Error desconocido'}`,
      duration: 4000,
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
  if (!currentEvent.value) {
    const toast = await toastController.create({
      message: 'Selecciona un evento primero',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }

  try {
    const qrData = {
      id: guest.id,
      name: guest.name,
      email: guest.email,
      event_name: currentEvent.value.name,
      eventId: currentEvent.value.id,
      eventName: currentEvent.value.name,
      timestamp: new Date().toISOString(),
      date: new Date().toDateString(),
      version: '1.0'
    }
    
    const guestWithEvent = {
      ...guest,
      event_name: currentEvent.value.name,
      event_id: currentEvent.value.id
    }
    
    const emailOptions = {
      eventId: currentEvent.value.id,
      eventName: currentEvent.value.name,
      eventDate: formatDate(currentEvent.value.date),
      eventLocation: currentEvent.value.location || 'Ubicación por confirmar',
      organizerName: 'Organizador del Evento',
      logoBase64: null
    }

    const result = await sendQREmail(guestWithEvent, JSON.stringify(qrData), emailOptions)
    
    if (result.success) {
      const { error } = await supabase
        .from('guests')
        .update({
          qr_sent: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', guest.id)
      
      if (error) {
        console.error('Error actualizando guest en Supabase:', error)
        throw error
      }
      
      guest.qr_sent = true
      guest.sent = true
      guest.sent_at = new Date().toISOString()
      ;(guest as any).simulated_send = result.simulated
      ;(guest as any).has_pdf = result.hasPDF
      
      const message = result.simulated 
        ? `Envío simulado para ${guest.name} (configurar EmailJS)`
        : `Entrada enviada a ${guest.name}`
      
      const toast = await toastController.create({
        message,
        duration: 3000,
        color: result.simulated ? 'warning' : 'success',
        position: 'top'
      })
      await toast.present()
    }
  } catch (error: any) {
    console.error('Error sending single QR:', error)
    
    const toast = await toastController.create({
      message: `Error al enviar entrada a ${guest.name}: ${error?.message || 'Error desconocido'}`,
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
}
</script>

<style scoped>
.send-container {
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

.event-select {
  min-width: 200px;
}

/* Información del evento */
.event-info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.event-details h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
}

.event-details p {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.event-stats {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
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

/* Sección de envío */
.send-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.send-button {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  height: 56px;
  font-weight: 600;
  font-size: 1.1rem;
  --border-radius: 8px;
  margin-bottom: 16px;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.progress-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.progress-text {
  text-align: center;
  margin-top: 12px;
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 500;
}

.progress-stats {
  text-align: center;
  margin-top: 4px;
  font-size: 0.85rem;
  color: #6b7280;
}

.send-note {
  background: #f0f8ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
}

.send-note p {
  margin: 0;
  font-size: 0.9rem;
  color: #0066cc;
}

/* Sección de invitados */
.guests-section {
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

.status-segment {
  min-width: 320px;
}

/* Lista de invitados */
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

.guest-item.pending {
  border-left-color: #6b7280;
}

.guest-item.sent {
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

.guest-item.sent .guest-avatar {
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

.phone {
  font-size: 0.8rem;
  color: #9ca3af;
}

.timestamp {
  font-size: 0.8rem;
  color: #6b7280;
}

.simulated-note {
  font-size: 0.8rem;
  color: #f59e0b;
  font-style: italic;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.sent {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.validated {
  background: #d1fae5;
  color: #065f46;
}

/* Estados vacíos */
.empty-state,
.no-event {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state.success {
  color: #10b981;
}

.empty-state ion-icon,
.no-event ion-icon {
  margin-bottom: 20px;
  color: #9ca3af;
}

.empty-state h4,
.no-event h3 {
  margin: 0 0 12px 0;
  color: #374151;
}

.empty-state p,
.no-event p {
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .send-container {
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
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .status-segment {
    min-width: auto;
  }
  
  .guest-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .guest-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>