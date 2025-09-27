<template>
  <ion-page>
    <AppHeader />
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Eventos</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="events-container">
        <!-- Header simple con degradado -->
        <div class="page-header">
          <h1>Gestión de Eventos</h1>
          <ion-button
            fill="solid"
            @click="openCreateEventModal"
            class="create-btn"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Crear Evento
          </ion-button>
        </div>

        <!-- Lista de eventos simple -->
        <div class="events-list">
          <div
            v-for="event in eventsStore.events"
            :key="event.id"
            class="event-card"
            :class="{ 'current-event': event.id === eventsStore.currentEventId }"
            @click="selectEvent(event)"
          >
            <!-- Header del evento -->
            <div class="event-header">
              <div class="event-info">
                <h3>{{ event.name }}</h3>
                <p>{{ event.description || 'Sin descripción' }}</p>
              </div>
              <div class="event-actions">
                <ion-button
                  fill="clear"
                  size="small"
                  @click.stop="editEvent(event)"
                >
                  <ion-icon :icon="pencilOutline" slot="icon-only"></ion-icon>
                </ion-button>
                <ion-button
                  fill="clear"
                  size="small"
                  color="danger"
                  @click.stop="confirmDeleteEvent(event)"
                  :disabled="eventsStore.events.length <= 1"
                >
                  <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </div>
            </div>

            <!-- Detalles simples -->
            <div class="event-details">
              <div class="detail-item">
                <ion-icon :icon="calendarOutline"></ion-icon>
                <span>{{ formatDate(event.date) }}</span>
              </div>
              <div class="detail-item" v-if="event.location">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span>{{ event.location }}</span>
              </div>
              <div class="detail-item">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>{{ getEventGuestCount(event.id) }} invitados</span>
              </div>
            </div>

            <!-- Estadísticas solo para evento actual -->
            <div class="event-stats" v-if="event.id === eventsStore.currentEventId">
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

            <!-- Badge evento actual -->
            <div v-if="event.id === eventsStore.currentEventId" class="current-badge">
              <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              Evento Actual
            </div>
          </div>
        </div>

        <!-- Estado vacío simple -->
        <div v-if="eventsStore.events.length === 0" class="empty-state">
          <ion-icon :icon="calendarOutline" size="large"></ion-icon>
          <h3>No hay eventos</h3>
          <p>Crea tu primer evento para comenzar</p>
          <ion-button
            fill="solid"
            @click="openCreateEventModal"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Crear Evento
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Modal simple -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ isEditing ? 'Editar Evento' : 'Crear Evento' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <form @submit.prevent="saveEvent">
          <ion-item>
            <ion-label position="stacked">Nombre del Evento *</ion-label>
            <ion-input
              v-model="eventForm.name"
              placeholder="Ej: Noche de Gala 2024"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Descripción</ion-label>
            <ion-textarea
              v-model="eventForm.description"
              placeholder="Descripción opcional del evento"
              :rows="3"
            ></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Fecha *</ion-label>
            <ion-input
              v-model="eventForm.date"
              type="date"
              required
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Ubicación</ion-label>
            <ion-input
              v-model="eventForm.location"
              placeholder="Ej: Salón Principal, Hotel Plaza"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Máximo de Invitados</ion-label>
            <ion-input
              v-model.number="eventForm.max_guests"
              type="number"
              min="1"
              placeholder="100"
            ></ion-input>
          </ion-item>

          <div class="modal-actions">
            <ion-button
              expand="block"
              type="submit"
              :disabled="!eventForm.name || !eventForm.date || isSubmitting"
            >
              <ion-spinner v-if="isSubmitting" slot="start"></ion-spinner>
              {{ isEditing ? 'Actualizar' : 'Crear' }} Evento
            </ion-button>
          </div>
        </form>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
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
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import {
  addOutline,
  calendarOutline,
  locationOutline,
  peopleOutline,
  pencilOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Event } from '@/stores/events'

// Estado del componente
const isModalOpen = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const editingEventId = ref<string | null>(null)

// Formulario de evento
const eventForm = reactive({
  name: '',
  description: '',
  date: '',
  location: '',
  max_guests: 100,
  is_active: true
})

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

// Obtener cantidad de invitados por evento
const getEventGuestCount = (eventId: string) => {
  return eventsStore.guests.filter(g => g.event_id === eventId).length
}

// Seleccionar evento
const selectEvent = (event: Event) => {
  eventsStore.setCurrentEvent(event.id)
}

// Abrir modal crear evento
const openCreateEventModal = () => {
  resetForm()
  isEditing.value = false
  isModalOpen.value = true
}

// Editar evento
const editEvent = (event: Event) => {
  eventForm.name = event.name
  eventForm.description = event.description || ''
  eventForm.date = event.date
  eventForm.location = event.location || ''
  eventForm.max_guests = event.max_guests || 100
  eventForm.is_active = event.is_active
  
  editingEventId.value = event.id
  isEditing.value = true
  isModalOpen.value = true
}

// Cerrar modal
const closeModal = () => {
  isModalOpen.value = false
  resetForm()
}

// Reset formulario
const resetForm = () => {
  eventForm.name = ''
  eventForm.description = ''
  eventForm.date = new Date().toISOString().split('T')[0]
  eventForm.location = ''
  eventForm.max_guests = 100
  eventForm.is_active = true
  editingEventId.value = null
  isEditing.value = false
  isSubmitting.value = false
}

// Guardar evento
const saveEvent = async () => {
  isSubmitting.value = true

  try {
    if (isEditing.value && editingEventId.value) {
      await eventsStore.updateEvent(editingEventId.value, { ...eventForm })
    } else {
      await eventsStore.createEvent({ ...eventForm })
    }

    const toast = await toastController.create({
      message: `Evento ${isEditing.value ? 'actualizado' : 'creado'} exitosamente`,
      duration: 2000,
      color: 'success',
      position: 'top'
    })
    await toast.present()

    closeModal()
  } catch (error) {
    console.error('Error saving event:', error)
    
    const toast = await toastController.create({
      message: 'Error al guardar el evento',
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    isSubmitting.value = false
  }
}

// Confirmar eliminación
const confirmDeleteEvent = async (event: Event) => {
  const guestCount = getEventGuestCount(event.id)
  
  const alert = await alertController.create({
    header: 'Eliminar Evento',
    message: `¿Estás seguro de eliminar "${event.name}"? ${guestCount > 0 ? `Se eliminarán también ${guestCount} invitados.` : ''}`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => deleteEvent(event.id)
      }
    ]
  })
  
  await alert.present()
}

// Eliminar evento
const deleteEvent = async (eventId: string) => {
  try {
    await eventsStore.deleteEvent(eventId)
    
    const toast = await toastController.create({
      message: 'Evento eliminado exitosamente',
      duration: 2000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
  } catch (error) {
    console.error('Error deleting event:', error)
    
    const toast = await toastController.create({
      message: 'Error al eliminar el evento',
      duration: 3000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
}
</script>

<style scoped>
.events-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}

/* Header con degradado azul marino */
.page-header {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.3);
}

.page-header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.create-btn {
  --background: rgba(255, 255, 255, 0.15);
  --color: white;
  --border-radius: 8px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.create-btn:hover {
  --background: rgba(255, 255, 255, 0.25);
}

/* Lista de eventos */
.events-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.event-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.current-event {
  border-color: #1e3a8a;
  box-shadow: 0 4px 20px rgba(30, 58, 138, 0.2);
}

/* Header del evento */
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.event-info h3 {
  margin: 0 0 6px 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
}

.event-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.event-actions {
  display: flex;
  gap: 4px;
}

/* Detalles del evento */
.event-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: #4b5563;
}

.detail-item ion-icon {
  color: #1e3a8a;
  font-size: 1.1rem;
}

/* Estadísticas */
.event-stats {
  display: flex;
  justify-content: space-around;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
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

/* Badge evento actual */
.current-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #059669;
  font-weight: 600;
  font-size: 0.9rem;
  background: #ecfdf5;
  padding: 8px 12px;
  border-radius: 6px;
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
  background: white;
  border-radius: 12px;
}

.empty-state ion-icon {
  margin-bottom: 20px;
  color: #9ca3af;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1.4rem;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 1rem;
}

/* Modal */
.modal-content {
  padding: 20px;
}

.modal-actions {
  padding: 24px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .events-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    text-align: center;
  }
  
  .events-list {
    grid-template-columns: 1fr;
  }
  
  .event-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>