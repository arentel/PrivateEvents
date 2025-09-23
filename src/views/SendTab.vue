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

        <!-- Botón principal de envío -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Envío de QRs</ion-card-title>
            <p style="margin: 8px 0 0 0; color: var(--ion-color-medium); font-size: 0.9rem;">
              Los emails se enviarán con EmailJS. Verifica tu configuración si no funcionan.
            </p>
          </ion-card-header>
          <ion-card-content>
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
                  <p v-if="(guest as any).simulated_send" class="simulated-note">
                    📧 Envío simulado (configurar variables EmailJS)
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
  IonLabel,
  IonButton,
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
  toastController
} from '@ionic/vue'
import {
  mailOutline,
  calendarOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Guest } from '@/stores/events'

// Importaciones del servicio de email
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
  // Diagnosticar EmailJS solo en desarrollo
  if (import.meta.env.DEV) {
    diagnoseEmailJS()
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
    
    // Preparar datos para envío masivo
    const guestsWithQRs = guestsToSend.map(guest => {
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
          event_name: currentEvent.value.name
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
      
      let statusText = ''
      switch (progress.status) {
        case 'sending':
          statusText = `Enviando a ${progress.currentGuest}...`
          break
        case 'success':
          statusText = `✅ Enviado a ${progress.currentGuest}`
          sentCount.value = progress.current
          break
        case 'simulated':
          statusText = `📧 Simulado para ${progress.currentGuest}`
          sentCount.value = progress.current
          break
        case 'error':
          statusText = `❌ Error con ${progress.currentGuest}`
          break
        default:
          statusText = `Procesando ${progress.currentGuest}...`
      }
      
      currentSendStatus.value = statusText
    }

    // Usar la función de envío masivo
    const results = await sendBulkQREmails(guestsWithQRs, emailOptions, progressCallback)
    
    // Marcar invitados como enviados
    for (const guest of guestsToSend) {
      guest.sent = true
      guest.sent_at = new Date().toISOString()
      ;(guest as any).simulated_send = results.simulated > 0
    }
    
    // Guardar cambios
    eventsStore.saveGuests()
    
    currentSendStatus.value = '✅ Envío completado'
    
    // Mostrar resultado detallado
    let message = ''
    let toastColor = 'success'
    
    if (results.failed > 0) {
      message = `⚠️ ${results.sent || 0} enviados, ${results.failed} fallaron`
      toastColor = 'warning'
    } else if (results.simulated > 0) {
      message = `📧 ${results.simulated} QRs procesados (modo simulación - verificar configuración)`
      toastColor = 'warning'
    } else if (results.sent > 0) {
      message = `✅ ${results.sent} QRs enviados correctamente`
      toastColor = 'success'
    } else {
      message = `❌ No se pudo enviar ningún QR`
      toastColor = 'danger'
    }
    
    const toast = await toastController.create({
      message,
      duration: 4000,
      color: toastColor,
      position: 'top'
    })
    await toast.present()
    
    // Si hay errores, mostrar detalles
    if (results.errors && results.errors.length > 0) {
      console.error('Errores durante el envío:', results.errors)
      
      const errorNames = results.errors.slice(0, 3).map((e: any) => e.guest).join(', ')
      const moreErrors = results.errors.length > 3 ? ` y ${results.errors.length - 3} más` : ''
      
      const errorToast = await toastController.create({
        message: `Errores con: ${errorNames}${moreErrors}`,
        duration: 6000,
        color: 'danger',
        position: 'bottom',
        buttons: [{
          text: 'Ver detalles',
          handler: () => {
            console.table(results.errors)
          }
        }]
      })
      await errorToast.present()
    }
    
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
      ;(guest as any).simulated_send = result.simulated
      
      // Guardar cambios
      eventsStore.saveGuests()
      
      const message = result.simulated 
        ? `📧 Envío simulado para ${guest.name} (configurar EmailJS)`
        : `✅ QR enviado a ${guest.name}`
      
      const toast = await toastController.create({
        message,
        duration: 3000,
        color: result.simulated ? 'warning' : 'success',
        position: 'top'
      })
      await toast.present()
    }
  } catch (error) {
    console.error('Error sending single QR:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    const toast = await toastController.create({
      message: `Error al enviar QR a ${guest.name}: ${errorMessage}`,
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

.send-button {
  margin-bottom: 16px;
  height: 56px;
  font-weight: 600;
  font-size: 1.1rem;
}

.progress-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--ion-color-light);
}

.progress-text {
  text-align: center;
  margin-top: 12px;
  font-size: 0.95rem;
  color: var(--ion-color-dark);
  font-weight: 500;
}

.progress-stats {
  text-align: center;
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.stat-mini {
  text-align: center;
  padding: 20px 12px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.95;
  margin-top: 6px;
  font-weight: 500;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.status-segment {
  min-width: 320px;
}

.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
}

.avatar-placeholder.pending {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.avatar-placeholder.sent {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.phone {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.timestamp {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.simulated-note {
  font-size: 0.8rem;
  color: var(--ion-color-warning);
  font-style: italic;
  margin-top: 4px;
  background: rgba(255, 193, 7, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ion-color-medium);
}

.empty-state.success {
  color: var(--ion-color-success);
}

.empty-state ion-icon {
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  font-size: 1.3rem;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .send-container {
    padding: 12px;
  }
  
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
    padding: 16px 8px;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .send-button {
    height: 48px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .stat-number {
    font-size: 1.3rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
}
</style>