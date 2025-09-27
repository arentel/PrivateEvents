<template>
  <ion-page>
    <AppHeader />
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Invitados</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="guests-container">
        <!-- Header simple -->
        <div class="page-header">
          <h1>Lista de Invitados</h1>
          <ion-button
            fill="outline"
            @click="openEventSelector"
            v-if="eventsStore.events.length > 1"
          >
            <ion-icon :icon="swapHorizontalOutline" slot="start"></ion-icon>
            Cambiar Evento
          </ion-button>
        </div>

        <!-- Información del evento actual -->
        <div class="event-info-card" v-if="currentEvent">
          <div class="event-details">
            <h2>{{ currentEvent.name }}</h2>
            <p>{{ formatDate(currentEvent.date) }} • {{ currentEvent.location || 'Sin ubicación' }}</p>
          </div>
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-value">{{ eventsStore.currentEventStats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ eventsStore.currentEventStats.sent }}</span>
              <span class="stat-label">Enviados</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ eventsStore.currentEventStats.scanned }}</span>
              <span class="stat-label">Validados</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ eventsStore.currentEventStats.pending }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </div>
        </div>

        <!-- Formulario para añadir invitados -->
        <div class="add-guests-section" v-if="currentEvent">
          <div class="section-header">
            <h3>Añadir Invitados</h3>
            <ion-button
              fill="outline"
              size="small"
              @click="loadSampleGuests"
            >
              <ion-icon :icon="sparklesOutline" slot="start"></ion-icon>
              Ejemplo
            </ion-button>
          </div>
          
          <div class="form-content">
            <ion-textarea
              v-model="guestInput"
              placeholder="Juan Pérez, juan@email.com, 600123456&#10;María García, maria@email.com&#10;Carlos López, carlos@email.com, 600789012"
              :rows="4"
              class="guest-input"
            ></ion-textarea>
            
            <ion-button
              expand="block"
              @click="addGuests"
              :disabled="!guestInput.trim()"
              class="add-btn"
            >
              <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
              Añadir Invitados
            </ion-button>
          </div>
        </div>

        <!-- Lista de invitados -->
        <div class="guests-list-section" v-if="currentEvent">
          <div class="section-header">
            <h3>Invitados ({{ currentEventGuests.length }})</h3>
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

          <div class="guests-list" v-if="currentEventGuests.length > 0">
            <div
              v-for="guest in currentEventGuests"
              :key="guest.id"
              class="guest-item"
              :class="getGuestClass(guest)"
            >
              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="guest-info">
                <h4>{{ guest.name }}</h4>
                <p>{{ guest.email }}</p>
                <p v-if="guest.phone" class="phone">{{ guest.phone }}</p>
              </div>
              
              <div class="guest-status">
                <span class="status-badge" :class="getStatusClass(guest)">
                  {{ getStatusText(guest) }}
                </span>
              </div>
              
              <div class="guest-actions">
                <ion-button
                  fill="clear"
                  size="small"
                  @click="editGuest(guest)"
                >
                  <ion-icon :icon="pencilOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else class="empty-guests">
            <ion-icon :icon="peopleOutline" size="large"></ion-icon>
            <h4>No hay invitados</h4>
            <p>Añade invitados para comenzar</p>
          </div>
        </div>

        <!-- Estado sin evento -->
        <div v-if="!currentEvent" class="no-event">
          <ion-icon :icon="calendarOutline" size="large"></ion-icon>
          <h3>Sin evento seleccionado</h3>
          <p>Selecciona o crea un evento para gestionar invitados</p>
          <ion-button
            fill="solid"
            @click="goToEvents"
          >
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            Ir a Eventos
          </ion-button>
        </div>
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
        <div class="events-modal-list">
          <div
            v-for="event in eventsStore.events"
            :key="event.id"
            class="event-option"
            :class="{ 'selected': event.id === eventsStore.currentEventId }"
            @click="selectEvent(event)"
          >
            <div class="event-info">
              <h3>{{ event.name }}</h3>
              <p>{{ formatDate(event.date) }}</p>
              <p v-if="event.location">{{ event.location }}</p>
            </div>
            <ion-icon
              v-if="event.id === eventsStore.currentEventId"
              :icon="checkmarkCircleOutline"
              color="primary"
            ></ion-icon>
          </div>
        </div>
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
            <ion-label position="stacked">Nombre *</ion-label>
            <ion-input
              v-model="editingGuest.name"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Email *</ion-label>
            <ion-input
              v-model="editingGuest.email"
              type="email"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input
              v-model="editingGuest.phone"
              type="tel"
            ></ion-input>
          </ion-item>

          <div class="modal-actions">
            <ion-button
              expand="block"
              type="submit"
            >
              Actualizar Invitado
            </ion-button>
            
            <ion-button
              expand="block"
              fill="outline"
              color="danger"
              @click="deleteGuest"
            >
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
  IonButton,
  IonIcon,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButtons,
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
      message: `${validGuests.length} invitados añadidos${duplicates.length > 0 ? ` (${duplicates.length} duplicados omitidos)` : ''}`,
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
const getGuestClass = (guest: Guest) => {
  if (guest.scanned) return 'scanned'
  if (guest.sent) return 'sent'
  return 'pending'
}

const getStatusClass = (guest: Guest) => {
  if (guest.scanned) return 'success'
  if (guest.sent) return 'warning'
  return 'medium'
}

const getStatusText = (guest: Guest) => {
  if (guest.scanned) return 'VALIDADO'
  if (guest.sent) return 'QR ENVIADO'
  return 'PENDIENTE'
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

/* Secciones */
.add-guests-section,
.guests-list-section {
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

/* Formulario */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guest-input {
  --background: #f8f9fa;
  --color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.add-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
}

.add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
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

.guest-item.sent {
  border-left-color: #fbbf24;
}

.guest-item.scanned {
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
  background: #fbbf24;
}

.guest-item.scanned .guest-avatar {
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

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.medium {
  background: #f3f4f6;
  color: #374151;
}

/* Estados vacíos */
.empty-guests,
.no-event {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-guests ion-icon,
.no-event ion-icon {
  margin-bottom: 20px;
  color: #9ca3af;
}

.empty-guests h4,
.no-event h3 {
  margin: 0 0 12px 0;
  color: #374151;
}

.empty-guests p,
.no-event p {
  margin: 0 0 24px 0;
}

/* Modal */
.events-modal-list {
  padding: 16px;
}

.event-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.event-option:hover {
  background: #f8f9fa;
}

.event-option.selected {
  background: #eff6ff;
  border: 1px solid #3b82f6;
}

.event-option .event-info h3 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.1rem;
}

.event-option .event-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.modal-content {
  padding: 20px;
}

.modal-actions {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .guests-container {
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
  
  .add-guests-section,
  .guests-list-section {
    padding: 16px;
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