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
                {{ currentSendStatus }} ({{ sentCount }}/{{ totalToSend }})
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

        <!-- Configuración del template de email -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Configuración del Email</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Plantilla de Email</ion-label>
              <ion-select
                v-model="selectedTemplate"
                placeholder="Seleccionar plantilla"
                :disabled="!currentEvent"
              >
                <ion-select-option value="elegant">✨ Elegante</ion-select-option>
                <ion-select-option value="modern">🎨 Moderna</ion-select-option>
                <ion-select-option value="corporate">🏢 Corporativa</ion-select-option>
                <ion-select-option value="party">🎉 Fiesta</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-button
              fill="outline"
              expand="block"
              @click="previewEmail"
              :disabled="!currentEvent"
              class="preview-button"
            >
              <ion-icon :icon="eyeOutline" slot="start"></ion-icon>
              Vista Previa del Email
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Vista previa del email -->
        <ion-card v-if="emailPreview.show" class="email-preview-card">
          <ion-card-header>
            <ion-card-title>
              <ion-icon :icon="mailOutline"></ion-icon>
              Vista Previa del Email
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="email-preview">
              <div class="email-header">
                <p><strong>Para:</strong> [Email del invitado]</p>
                <p><strong>Asunto:</strong> {{ emailPreview.subject }}</p>
              </div>
              <div class="email-body" v-html="emailPreview.body"></div>
            </div>
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
                  <p class="timestamp" v-if="guest.created_at">
                    Enviado: {{ formatDateTime(guest.created_at) }}
                  </p>
                </ion-label>
                
                <ion-chip color="success" slot="end">
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
import { ref, computed, onMounted, watch } from 'vue'
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
  toastController
} from '@ionic/vue'
import {
  mailOutline,
  eyeOutline,
  calendarOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore } from '@/stores/events'

// Estado reactivo
const autoSendEnabled = ref(false)
const isSending = ref(false)
const sendProgress = ref(0)
const currentSendStatus = ref('')
const sentCount = ref(0)
const totalToSend = ref(0)
const selectedTab = ref('pending')
const selectedTemplate = ref('elegant')

const emailPreview = ref({
  show: false,
  subject: '',
  body: ''
})

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
})

// Watch para actualizar template cuando cambie el evento
watch(currentEvent, (newEvent) => {
  if (newEvent && newEvent.email_template) {
    selectedTemplate.value = newEvent.email_template
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
    
    for (let i = 0; i < guestsToSend.length; i++) {
      const guest = guestsToSend[i]
      currentSendStatus.value = `Enviando a ${guest.name}...`
      
      try {
        await sendSingleQRInternal(guest)
        sentCount.value++
        sendProgress.value = sentCount.value / totalToSend.value
        
        // Delay para no saturar el servicio de email
        if (i < guestsToSend.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error sending to ${guest.name}:`, error)
      }
    }
    
    currentSendStatus.value = '✅ Envío completado'
    
    const toast = await toastController.create({
      message: `✅ ${sentCount.value} QRs enviados correctamente`,
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
const sendSingleQR = async (guest: any) => {
  try {
    await sendSingleQRInternal(guest)
    
    const toast = await toastController.create({
      message: `✅ QR enviado a ${guest.name}`,
      duration: 2000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
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

// Función interna para enviar QR (simulada)
const sendSingleQRInternal = async (guest: any) => {
  // Simular envío de email
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Marcar como enviado
  guest.sent = true
  guest.sent_at = new Date().toISOString()
  
  // Actualizar en store
  eventsStore.saveGuests()
  
  console.log(`QR enviado a ${guest.name} con template: ${selectedTemplate.value}`)
}

// Vista previa del email
const previewEmail = () => {
  if (!currentEvent.value) return
  
  const templates = {
    elegant: {
      subject: `✨ Tu invitación exclusiva para ${currentEvent.value.name}`,
      body: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 2.2em; font-weight: 300;">✨ ${currentEvent.value.name}</h1>
            <p style="margin: 15px 0 0 0; font-size: 1.1em; opacity: 0.9;">Una experiencia inolvidable te espera</p>
          </div>
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #667eea; margin-top: 0; font-weight: 300;">Estimado/a [NOMBRE] 🥂</h2>
            <p style="font-size: 1.1em; line-height: 1.6;">Es un honor invitarte a nuestro exclusivo evento.</p>
            <p style="font-size: 1em; line-height: 1.6; color: #666;">
              📅 <strong>Fecha:</strong> ${formatDate(currentEvent.value.date)}<br>
              📍 <strong>Ubicación:</strong> ${currentEvent.value.location || 'Por confirmar'}
            </p>
            <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; font-style: italic;">Tu código QR personal está adjunto. Preséntalo en la entrada para acceder al evento.</p>
            </div>
          </div>
        </div>
      `
    },
    modern: {
      subject: `🎨 ${currentEvent.value.name} - Tu pase digital`,
      body: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 2em;">🎨 ${currentEvent.value.name}</h1>
          </div>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #ff6b6b;">¡Hola [NOMBRE]! 👋</h2>
            <p>¡Te esperamos en nuestro increíble evento!</p>
          </div>
        </div>
      `
    },
    corporate: {
      subject: `Invitación formal: ${currentEvent.value.name}`,
      body: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c3e50; color: white; padding: 30px;">
            <h1 style="margin: 0; font-size: 1.8em;">🏢 ${currentEvent.value.name}</h1>
          </div>
          <div style="padding: 30px;">
            <p>Estimado/a [NOMBRE],</p>
            <p>Nos complace invitarle a nuestro evento corporativo.</p>
          </div>
        </div>
      `
    },
    party: {
      subject: `🎉 ¡FIESTA! ${currentEvent.value.name}`,
      body: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(45deg, #ff9a9e, #fecfef, #fecfef); color: #333; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 2.5em;">🎉 ${currentEvent.value.name}</h1>
            <p style="font-size: 1.2em;">¡La diversión está garantizada!</p>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #ff9a9e;">¡Hola [NOMBRE]! 🥳</h2>
            <p>¡Prepárate para la mejor fiesta del año!</p>
          </div>
        </div>
      `
    }
  }
  
  const template = templates[selectedTemplate.value as keyof typeof templates]
  emailPreview.value = {
    show: true,
    subject: template.subject,
    body: template.body
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

.preview-button {
  margin-top: 16px;
}

.email-preview-card {
  border: 2px solid var(--ion-color-primary-tint);
}

.email-preview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.email-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #dee2e6;
}

.email-header p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.email-body {
  font-size: 0.9rem;
  line-height: 1.4;
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