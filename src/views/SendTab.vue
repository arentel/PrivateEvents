<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>📧 Enviar QRs</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Control de envío -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Control de Envío</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label>
              <h2>Envío automático</h2>
              <p>{{ autoSendEnabled ? 'Activado - Los QRs se envían automáticamente' : 'Desactivado - Envío manual' }}</p>
            </ion-label>
            <ion-toggle 
              v-model="autoSendEnabled"
              @ionChange="toggleAutoSend"
            ></ion-toggle>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="sendAllQRs"
            :disabled="isSending || pendingGuests.length === 0"
            color="success"
          >
            <ion-icon name="mail-outline" slot="start"></ion-icon>
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
        <ion-card-header>
          <ion-card-title>Estadísticas</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="6">
              <div class="stat-mini">
                <div class="stat-number">{{ totalGuests }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-mini">
                <div class="stat-number">{{ sentGuests.length }}</div>
                <div class="stat-label">QRs Enviados</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-card-content>
      </ion-card>

      <!-- Vista previa del email -->
      <ion-card v-if="emailPreview.show">
        <ion-card-header>
          <ion-card-title>📧 Vista Previa del Email</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="email-preview">
            <p><strong>Para:</strong> [Email del invitado]</p>
            <p><strong>Asunto:</strong> {{ emailPreview.subject }}</p>
            <div class="email-body">
              <p>{{ emailPreview.body }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Lista de estado de envíos -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Estado de Envíos</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-segment v-model="selectedTab">
            <ion-segment-button value="pending">
              <ion-label>Pendientes ({{ pendingGuests.length }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="sent">
              <ion-label>Enviados ({{ sentGuests.length }})</ion-label>
            </ion-segment-button>
          </ion-segment>
          
          <!-- Lista de pendientes -->
          <ion-list v-if="selectedTab === 'pending'">
            <ion-item v-for="guest in pendingGuests" :key="guest.id">
              <ion-avatar slot="start">
                <div class="avatar-placeholder">
                  {{ guest.name.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              
              <ion-label>
                <h2>{{ guest.name }}</h2>
                <p>{{ guest.email }}</p>
              </ion-label>
              
              <ion-button 
                slot="end" 
                size="small" 
                @click="sendSingleQR(guest)"
                :disabled="isSending"
              >
                <ion-icon name="mail-outline"></ion-icon>
              </ion-button>
            </ion-item>
            
            <div v-if="pendingGuests.length === 0" class="empty-state">
              <p>✅ Todos los QRs han sido enviados</p>
            </div>
          </ion-list>
          
          <!-- Lista de enviados -->
          <ion-list v-if="selectedTab === 'sent'">
            <ion-item v-for="guest in sentGuests" :key="guest.id">
              <ion-avatar slot="start">
                <div class="avatar-placeholder sent">
                  {{ guest.name.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              
              <ion-label>
                <h2>{{ guest.name }}</h2>
                <p>{{ guest.email }}</p>
                <p class="timestamp">
                  Enviado: {{ formatDate(guest.qr_sent_at) }}
                </p>
              </ion-label>
              
              <ion-chip color="success">
                ENVIADO
              </ion-chip>
            </ion-item>
            
            <div v-if="sentGuests.length === 0" class="empty-state">
              <p>No hay QRs enviados aún</p>
            </div>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Toast para mensajes -->
      <ion-toast
        :is-open="toast.isOpen"
        :message="toast.message"
        :duration="3000"
        :color="toast.color"
        @didDismiss="toast.isOpen = false"
      ></ion-toast>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonToggle, IonIcon,
  IonProgressBar, IonList, IonAvatar, IonChip, IonToast,
  IonRow, IonCol, IonSegment, IonSegmentButton
} from '@ionic/vue'
import { mailOutline } from 'ionicons/icons'
import { supabase } from '../services/supabase'
import { generateQRCode } from '../services/qr'
import { sendQREmail } from '../services/email'

// Estado reactivo
const guests = ref([])
const autoSendEnabled = ref(false)
const isSending = ref(false)
const sendProgress = ref(0)
const currentSendStatus = ref('')
const sentCount = ref(0)
const totalToSend = ref(0)
const selectedTab = ref('pending')

const emailPreview = ref({
  show: false,
  subject: '',
  body: ''
})

const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties
const totalGuests = computed(() => guests.value.length)
const pendingGuests = computed(() => guests.value.filter(g => !g.qr_sent))
const sentGuests = computed(() => guests.value.filter(g => g.qr_sent))

// Función para mostrar toast
const showToast = (message, color = 'success') => {
  toast.value = {
    isOpen: true,
    message,
    color
  }
}

// Función para cargar invitados
const loadGuests = async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    guests.value = data || []
  } catch (error) {
    console.error('Error loading guests:', error)
    showToast('Error al cargar invitados', 'danger')
  }
}

// Función para alternar envío automático
const toggleAutoSend = () => {
  if (autoSendEnabled.value && pendingGuests.value.length > 0) {
    setTimeout(() => {
      sendAllQRs()
    }, 1000)
  }
}

// Función para enviar todos los QRs
const sendAllQRs = async () => {
  if (pendingGuests.value.length === 0) {
    showToast('No hay QRs pendientes de envío', 'warning')
    return
  }
  
  isSending.value = true
  sendProgress.value = 0
  sentCount.value = 0
  totalToSend.value = pendingGuests.value.length
  
  try {
    for (let i = 0; i < pendingGuests.value.length; i++) {
      const guest = pendingGuests.value[i]
      currentSendStatus.value = `Enviando a ${guest.name}...`
      
      await sendSingleQRInternal(guest)
      
      sentCount.value++
      sendProgress.value = sentCount.value / totalToSend.value
      
      // Pausa pequeña para mejor UX
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    currentSendStatus.value = '✅ Envío completado'
    showToast(`✅ ${sentCount.value} QRs enviados correctamente`)
    
    // Mostrar vista previa del email
    showEmailPreview()
    
  } catch (error) {
    console.error('Error sending QRs:', error)
    showToast('Error durante el envío masivo', 'danger')
  } finally {
    isSending.value = false
    await loadGuests()
  }
}

// Función para enviar QR individual
const sendSingleQR = async (guest) => {
  try {
    await sendSingleQRInternal(guest)
    showToast(`✅ QR enviado a ${guest.name}`)
    await loadGuests()
  } catch (error) {
    console.error('Error sending single QR:', error)
    showToast(`Error al enviar QR a ${guest.name}`, 'danger')
  }
}

// Función interna para enviar QR
const sendSingleQRInternal = async (guest) => {
  // Generar código QR
  const qrData = {
    id: guest.id,
    name: guest.name,
    email: guest.email,
    event_name: guest.event_name,
    timestamp: new Date().toISOString(),
    date: new Date().toDateString()
  }
  
  const qrCode = await generateQRCode(qrData)
  
  // Enviar email con QR
  await sendQREmail(guest, qrCode)
  
  // Actualizar base de datos
  const { error } = await supabase
    .from('guests')
    .update({
      qr_code: qrCode,
      qr_sent: true,
      qr_sent_at: new Date().toISOString()
    })
    .eq('id', guest.id)
  
  if (error) throw error
}

// Función para mostrar vista previa del email
const showEmailPreview = () => {
  emailPreview.value = {
    show: true,
    subject: `Tu entrada para ${guests.value[0]?.event_name || 'el evento'}`,
    body: `¡Hola [NOMBRE]!\n\nEstás invitado/a a nuestro evento.\n\n📱 Tu código QR está adjunto a este email.\n• Guárdalo en tu móvil\n• Preséntalo en la entrada\n• Solo es válido para una entrada\n\n¡Te esperamos! 🎉`
  }
}

// Función para formatear fecha
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar datos al montar
onMounted(() => {
  loadGuests()
})
</script>

<style scoped>
.stat-mini {
  text-align: center;
  padding: 0.8rem;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border-radius: 8px;
}

.stat-number {
  font-size: 1.2rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.7rem;
  opacity: 0.9;
}

.progress-container {
  margin-top: 1rem;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.email-preview {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.email-body {
  margin-top: 0.5rem;
  white-space: pre-line;
  font-style: italic;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.avatar-placeholder.sent {
  background: #28a745;
}

.timestamp {
  font-size: 0.8rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>