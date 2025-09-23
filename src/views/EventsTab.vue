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
        <!-- Header con botón crear evento -->
        <div class="section-header">
          <h2>Gestión de Eventos</h2>
          <ion-button
            fill="solid"
            @click="openCreateEventModal"
            class="create-btn"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Crear Evento
          </ion-button>
        </div>

        <!-- Lista de eventos -->
        <div class="events-grid">
          <ion-card
            v-for="event in eventsStore.events"
            :key="event.id"
            class="event-card"
            :class="{ 'current-event': event.id === eventsStore.currentEventId }"
            @click="selectEvent(event)"
          >
            <ion-card-content>
              <!-- Header del card -->
              <div class="event-header">
                <div class="event-info">
                  <h3>{{ event.name }}</h3>
                  <p class="event-description">{{ event.description || 'Sin descripción' }}</p>
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

              <!-- Detalles del evento -->
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

              <!-- Estadísticas -->
              <div class="event-stats" v-if="event.id === eventsStore.currentEventId">
                <div class="stat-item">
                  <span class="stat-label">Enviados</span>
                  <span class="stat-value">{{ eventsStore.currentEventStats.sent }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Validados</span>
                  <span class="stat-value">{{ eventsStore.currentEventStats.scanned }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pendientes</span>
                  <span class="stat-value">{{ eventsStore.currentEventStats.pending }}</span>
                </div>
              </div>

              <!-- Indicador de evento actual -->
              <div v-if="event.id === eventsStore.currentEventId" class="current-badge">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                Evento Actual
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Estado vacío -->
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

    <!-- Modal crear/editar evento -->
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
  IonCard,
  IonCardContent,
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
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  color: var(--ion-color-primary);
}

.create-btn {
  --border-radius: 8px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.event-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.current-event {
  border-color: var(--ion-color-primary);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.event-info h3 {
  margin: 0 0 4px 0;
  color: var(--ion-color-dark);
  font-size: 1.2rem;
}

.event-description {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.event-actions {
  display: flex;
  gap: 4px;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--ion-color-medium-shade);
}

.detail-item ion-icon {
  font-size: 1rem;
  color: var(--ion-color-primary);
}

.event-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: var(--ion-color-light);
  border-radius: 8px;
  margin-bottom: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.stat-value {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--ion-color-primary);
}

.current-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ion-color-success);
  font-weight: 500;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
}

.modal-content {
  padding: 16px;
}

.modal-actions {
  padding: 24px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .event-stats {
    flex-direction: column;
    gap: 8px;
  }
}
</style>