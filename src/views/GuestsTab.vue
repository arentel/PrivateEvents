<template>
  <ion-page>
    <AppHeader />
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Lista de Invitados</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="guests-container">
        <!-- Selector de evento -->
        <ion-card class="event-selector">
          <ion-card-content>
            <div class="event-header">
              <div class="event-info">
                <h2>{{ currentEvent?.name || 'Sin evento seleccionado' }}</h2>
                <p v-if="currentEvent">{{ formatDate(currentEvent.date) }} • {{ currentEvent.location || 'Sin ubicación' }}</p>
              </div>
              <ion-button
                fill="outline"
                @click="openEventSelector"
                v-if="eventsStore.events.length > 1"
              >
                <ion-icon :icon="swapHorizontalOutline" slot="start"></ion-icon>
                Cambiar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estadísticas del evento actual -->
        <ion-card>
          <ion-card-content>
            <ion-row>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.sent }}</div>
                  <div class="stat-label">QRs Enviados</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.scanned }}</div>
                  <div class="stat-label">Validados</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.pending }}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-card-content>
        </ion-card>

        <!-- Formulario para añadir invitados -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Añadir Invitados</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">
                Invitados (uno por línea: Nombre, Email, Teléfono [opcional])
              </ion-label>
              <ion-textarea
                v-model="guestInput"
                placeholder="Juan Pérez, juan@email.com, 600123456&#10;María García, maria@email.com&#10;Carlos López, carlos@email.com, 600789012"
                :rows="5"
              ></ion-textarea>
            </ion-item>
            
            <div class="form-buttons">
              <ion-button 
                expand="block" 
                @click="addGuests"
                :disabled="!guestInput.trim() || !currentEvent"
              >
                <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                Añadir Invitados
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                @click="loadSampleGuests"
                :disabled="!currentEvent"
              >
                <ion-icon :icon="sparklesOutline" slot="start"></ion-icon>
                Cargar Lista de Ejemplo
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Lista de invitados -->
        <ion-card>
          <ion-card-header>
            <div class="list-header">
              <ion-card-title>
                Lista de Invitados ({{ currentEventGuests.length }})
              </ion-card-title>
              <ion-button
                v-if="currentEventGuests.length > 0"
                fill="clear"
                color="danger"
                size="small"
                @click="clearAllGuests"
              >
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                Limpiar
              </ion-button>
            </div>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list v-if="currentEventGuests.length > 0">
              <ion-item v-for="guest in currentEventGuests" :key="guest.id">
                <ion-avatar slot="start">
                  <div class="avatar-placeholder" :class="getAvatarClass(guest)">
                    {{ guest.name.charAt(0).toUpperCase() }}
                  </div>
                </ion-avatar>
                
                <ion-label>
                  <h2>{{ guest.name }}</h2>
                  <p>{{ guest.email }}</p>
                  <p v-if="guest.phone" class="phone">📞 {{ guest.phone }}</p>
                  <p v-if="guest.table" class="table">🪑 Mesa {{ guest.table }}</p>
                </ion-label>
                
                <div slot="end" class="guest-actions">
                  <ion-chip 
                    :color="getStatusColor(guest)"
                    size="small"
                  >
                    {{ getStatusText(guest) }}
                  </ion-chip>
                  
                  <ion-button 
                    size="small" 
                    fill="clear"
                    @click="editGuest(guest)"
                  >
                    <ion-icon :icon="pencilOutline" slot="icon-only"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
            
            <div v-else class="empty-state">
              <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
              <h3>{{ currentEvent ? 'No hay invitados en este evento' : 'Selecciona un evento' }}</h3>
              <p>{{ currentEvent ? 'Añade invitados para comenzar' : 'Primero crea o selecciona un evento' }}</p>
              
              <ion-button
                v-if="!currentEvent"
                fill="solid"
                @click="goToEvents"
              >
                <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                Ir a Eventos
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Modal selector de evento -->
    <ion-modal :is-open="showEventSelector" @did-dismiss="showEventSelector = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Seleccionar Evento</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showEventSelector = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <ion-list>
          <ion-item
            v-for="event in eventsStore.events"
            :key="event.id"
            button
            @click="selectEvent(event)"
            :class="{ 'selected': event.id === eventsStore.currentEventId }"
          >
            <ion-label>
              <h2>{{ event.name }}</h2>
              <p>{{ formatDate(event.date) }}</p>
              <p v-if="event.location">{{ event.location }}</p>
            </ion-label>
            <ion-icon
              v-if="event.id === eventsStore.currentEventId"
              :icon="checkmarkCircleOutline"
              color="primary"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Modal editar invitado -->
    <ion-modal :is-open="showEditModal" @did-dismiss="showEditModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Editar Invitado</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showEditModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <form @submit.prevent="saveEditedGuest" v-if="editingGuest">
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="editingGuest.name" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="editingGuest.email" type="email" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input v-model="editingGuest.phone"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Mesa</ion-label>
            <ion-input v-model="editingGuest.table" placeholder="Número de mesa"></ion-input>
          </ion-item>

          <div class="modal-actions">
            <ion-button expand="block" type="submit" color="primary">
              Guardar Cambios
            </ion-button>
            <ion-button expand="block" fill="outline" color="danger" @click="deleteGuest">
              Eliminar Invitado
            </ion-button>
          </div>
        </form>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  IonTextarea,
  IonButton,
  IonList,
  IonAvatar,
  IonChip,
  IonRow,
  IonCol,
  IonIcon,
  IonModal,
  IonButtons,
  IonInput,
  alertController,
  toastController
} from '@ionic/vue'
import {
  personAddOutline,
  sparklesOutline,
  peopleOutline,
  trashOutline,
  pencilOutline,
  calendarOutline,
  swapHorizontalOutline,
  closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Guest } from '@/stores/events'

// Router
const router = useRouter()

// Estado reactivo
const guestInput = ref('')
const showEventSelector = ref(false)
const showEditModal = ref(false)
const editingGuest = ref<Guest | null>(null)

// Computed properties
const currentEvent = computed(() => eventsStore.currentEvent)
const currentEventGuests = computed(() => eventsStore.currentEventGuests)

// Inicializar
onMounted(() => {
  eventsStore.init()
})

// Formatear fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para añadir invitados
const addGuests = async () => {
  if (!guestInput.value.trim() || !currentEvent.value) return
  
  const lines = guestInput.value.trim().split('\n')
  const validGuests = []
  const duplicates = []
  
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const name = parts[0]
      const email = parts[1]
      const phone = parts[2] || ''
      
      // Verificar si ya existe
      const exists = currentEventGuests.value.find(g => 
        g.email.toLowerCase() === email.toLowerCase()
      )
      
      if (!exists) {
        validGuests.push({ name, email, phone })
      } else {
        duplicates.push(email)
      }
    }
  }
  
  if (validGuests.length === 0) {
    const toast = await toastController.create({
      message: duplicates.length > 0 ? 'Todos los emails ya existen' : 'No hay invitados válidos',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }
  
  try {
    for (const guest of validGuests) {
      await eventsStore.addGuest(guest)
    }
    
    guestInput.value = ''
    
    const toast = await toastController.create({
      message: `✅ ${validGuests.length} invitados añadidos${duplicates.length > 0 ? ` (${duplicates.length} duplicados omitidos)` : ''}`,
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
  } catch (error) {
    console.error('Error adding guests:', error)
    const toast = await toastController.create({
      message: 'Error al añadir invitados',
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
}

// Función para cargar invitados de ejemplo
const loadSampleGuests = () => {
  const sampleGuests = [
    'Ana García, ana.garcia@email.com, 600123456',
    'Carlos Rodríguez, carlos.rodriguez@email.com',
    'María López, maria.lopez@email.com, 600789012',
    'Juan Martínez, juan.martinez@email.com',
    'Laura Sánchez, laura.sanchez@email.com, 600456789',
    'Pedro Gómez, pedro.gomez@email.com'
  ]
  
  guestInput.value = sampleGuests.join('\n')
}

// Selector de evento
const openEventSelector = () => {
  showEventSelector.value = true
}

const selectEvent = (event: any) => {
  eventsStore.setCurrentEvent(event.id)
  showEventSelector.value = false
}

// Editar invitado
const editGuest = (guest: Guest) => {
  editingGuest.value = { ...guest }
  showEditModal.value = true
}

const saveEditedGuest = async () => {
  // Implementar actualización de invitado
  showEditModal.value = false
  editingGuest.value = null
}

const deleteGuest = async () => {
  const alert = await alertController.create({
    header: 'Eliminar Invitado',
    message: '¿Estás seguro de eliminar este invitado?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: () => {
        // Implementar eliminación
        showEditModal.value = false
        editingGuest.value = null
      }}
    ]
  })
  await alert.present()
}

// Funciones de utilidad
const getStatusColor = (guest: Guest) => {
  if (guest.scanned) return 'success'
  if (guest.sent) return 'warning'
  return 'medium'
}

const getStatusText = (guest: Guest) => {
  if (guest.scanned) return 'VALIDADO'
  if (guest.sent) return 'QR ENVIADO'
  return 'PENDIENTE'
}

const getAvatarClass = (guest: Guest) => {
  if (guest.scanned) return 'entered'
  if (guest.sent) return 'sent'
  return 'pending'
}

// Limpiar todos los invitados
const clearAllGuests = async () => {
  const alert = await alertController.create({
    header: 'Limpiar Lista',
    message: '¿Estás seguro de eliminar todos los invitados de este evento?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar Todo', role: 'destructive', handler: async () => {
        // Implementar limpieza
        const toast = await toastController.create({
          message: 'Lista limpiada completamente',
          duration: 2000,
          color: 'success',
          position: 'top'
        })
        await toast.present()
      }}
    ]
  })
  await alert.present()
}

// Ir a eventos
const goToEvents = () => {
  router.push('/tabs/events')
}
</script>

<style scoped>
.guests-container {
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

.stat-card {
  text-align: center;
  padding: 16px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
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

.form-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  background: #6c757d;
}

.avatar-placeholder.pending {
  background: #6c757d;
}

.avatar-placeholder.sent {
  background: #ffc107;
}

.avatar-placeholder.entered {
  background: #28a745;
}

.guest-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.phone, .table {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-dark);
}

.empty-state p {
  margin: 0 0 16px 0;
}

.modal-content {
  padding: 16px;
}

.modal-actions {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

ion-item.selected {
  --background: var(--ion-color-primary-tint);
}

/* Responsive */
@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .stat-card {
    padding: 12px 4px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
}
</style>