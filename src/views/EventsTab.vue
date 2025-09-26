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
        <!-- Header con estilo del template -->
        <div class="page-header">
          <div class="header-content">
            <h1>📅 Gestión de Eventos</h1>
            <p>Administra y organiza todos tus eventos desde aquí</p>
          </div>
          <div class="header-actions">
            <button
              @click="openCreateEventModal"
              class="create-event-btn"
            >
              <ion-icon :icon="addOutline"></ion-icon>
              <span>Crear Evento</span>
            </button>
          </div>
        </div>

        <!-- Lista de eventos con estilo del template -->
        <div class="events-section">
          <div class="events-grid" v-if="eventsStore.events.length > 0">
            <div
              v-for="event in eventsStore.events"
              :key="event.id"
              class="event-card"
              :class="{ 'current-event': event.id === eventsStore.currentEventId }"
              @click="selectEvent(event)"
            >
              <!-- Header del evento -->
              <div class="event-card-header">
                <div class="event-title-section">
                  <h3 class="event-title">{{ event.name }}</h3>
                  <p class="event-description">{{ event.description || 'Sin descripción' }}</p>
                </div>
                <div class="event-actions">
                  <button
                    class="action-btn edit-btn"
                    @click.stop="editEvent(event)"
                    title="Editar evento"
                  >
                    <ion-icon :icon="pencilOutline"></ion-icon>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    @click.stop="confirmDeleteEvent(event)"
                    :disabled="eventsStore.events.length <= 1"
                    title="Eliminar evento"
                  >
                    <ion-icon :icon="trashOutline"></ion-icon>
                  </button>
                </div>
              </div>

              <!-- Detalles del evento con estilo tabla del template -->
              <div class="event-details-section">
                <h4>📋 Detalles del Evento</h4>
                <div class="details-table">
                  <div class="detail-row">
                    <span class="detail-label">📅 Fecha:</span>
                    <span class="detail-value">{{ formatDate(event.date) }}</span>
                  </div>
                  <div class="detail-row" v-if="event.location">
                    <span class="detail-label">📍 Ubicación:</span>
                    <span class="detail-value">{{ event.location }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">👥 Invitados:</span>
                    <span class="detail-value">{{ getEventGuestCount(event.id) }} registrados</span>
                  </div>
                  <div class="detail-row" v-if="event.max_guests">
                    <span class="detail-label">🎯 Capacidad:</span>
                    <span class="detail-value">{{ event.max_guests }} máximo</span>
                  </div>
                </div>
              </div>

              <!-- Estadísticas con estilo del template -->
              <div class="event-stats-section" v-if="event.id === eventsStore.currentEventId">
                <h4>📊 Estadísticas en Tiempo Real</h4>
                <div class="stats-grid">
                  <div class="stat-card sent">
                    <div class="stat-icon">📧</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ eventsStore.currentEventStats.sent }}</div>
                      <div class="stat-label">Enviados</div>
                    </div>
                  </div>
                  <div class="stat-card validated">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ eventsStore.currentEventStats.scanned }}</div>
                      <div class="stat-label">Validados</div>
                    </div>
                  </div>
                  <div class="stat-card pending">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                      <div class="stat-number">{{ eventsStore.currentEventStats.pending }}</div>
                      <div class="stat-label">Pendientes</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Badge de evento actual -->
              <div v-if="event.id === eventsStore.currentEventId" class="current-event-badge">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>Evento Activo</span>
              </div>
            </div>
          </div>

          <!-- Estado vacío con estilo del template -->
          <div v-else class="empty-state">
            <div class="empty-state-content">
              <div class="empty-state-icon">📅</div>
              <h3>No hay eventos creados</h3>
              <p>Crea tu primer evento para comenzar a gestionar invitados y generar códigos QR</p>
              <button
                @click="openCreateEventModal"
                class="empty-state-btn"
              >
                <ion-icon :icon="addOutline"></ion-icon>
                <span>Crear Primer Evento</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <!-- Modal crear/editar evento con estilo del template -->
    <ion-modal :is-open="isModalOpen" @did-dismiss="closeModal" class="event-modal">
      <ion-header>
        <ion-toolbar class="modal-toolbar">
          <ion-title>{{ isEditing ? '✏️ Editar Evento' : '📅 Crear Evento' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeModal" class="close-btn">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <div class="modal-form-container">
          <form @submit.prevent="saveEvent" class="event-form">
            <div class="form-header">
              <h3>{{ isEditing ? 'Actualizar información del evento' : 'Completa la información del evento' }}</h3>
            </div>

            <div class="form-fields">
              <div class="form-group">
                <label class="form-label">🎉 Nombre del Evento *</label>
                <div class="input-container">
                  <ion-input
                    v-model="eventForm.name"
                    placeholder="Ej: Noche de Gala 2024"
                    required
                    class="custom-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">📝 Descripción</label>
                <div class="input-container">
                  <ion-textarea
                    v-model="eventForm.description"
                    placeholder="Descripción opcional del evento"
                    :rows="3"
                    class="custom-textarea"
                  ></ion-textarea>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">📅 Fecha del Evento *</label>
                <div class="input-container">
                  <ion-input
                    v-model="eventForm.date"
                    type="date"
                    required
                    class="custom-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">📍 Ubicación</label>
                <div class="input-container">
                  <ion-input
                    v-model="eventForm.location"
                    placeholder="Ej: Salón Principal, Hotel Plaza"
                    class="custom-input"
                  ></ion-input>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">👥 Máximo de Invitados</label>
                <div class="input-container">
                  <ion-input
                    v-model.number="eventForm.max_guests"
                    type="number"
                    min="1"
                    placeholder="100"
                    class="custom-input"
                  ></ion-input>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                :disabled="!eventForm.name || !eventForm.date || isSubmitting"
                class="submit-btn"
              >
                <ion-spinner v-if="isSubmitting" class="button-spinner"></ion-spinner>
                <span v-if="!isSubmitting">
                  {{ isEditing ? '✏️ Actualizar' : '🚀 Crear' }} Evento
                </span>
                <span v-else>
                  🔄 {{ isEditing ? 'Actualizando' : 'Creando' }}...
                </span>
              </button>
            </div>
          </form>
        </div>
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
/* Variables del template de email */
:root {
  --template-primary: #0d1b2a;
  --template-secondary: #1e3a8a;
  --template-bg-light: #f4f4f4;
  --template-bg-card: #f9f9f9;
  --template-bg-section: #f8f9fa;
  --template-border: #e0e0e0;
  --template-border-light: #dcdcdc;
  --template-text-muted: #666;
  --template-text-dark: #333;
  --template-shadow: 0 4px 12px rgba(0,0,0,0.08);
  --template-info-bg: #f0f8ff;
  --template-info-border: #b3d9ff;
  --template-info-text: #0066cc;
}

.events-container {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--template-bg-light);
  min-height: 100vh;
}

/* Header con estilo del template */
.page-header {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 35px 30px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: var(--template-shadow);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.header-content p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.create-event-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.create-event-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Sección de eventos */
.events-section {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  padding: 35px 30px;
  box-shadow: var(--template-shadow);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 25px;
}

/* Cards de eventos con estilo del template */
.event-card {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  border-color: var(--template-primary);
}

.current-event {
  border-color: var(--template-primary);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.15);
}

/* Header del card */
.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--template-border-light);
}

.event-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--template-primary);
  margin: 0 0 5px 0;
}

.event-description {
  color: var(--template-text-muted);
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.4;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: var(--template-bg-section);
  border: 1px solid var(--template-border-light);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #ffffff;
  border-color: var(--template-border);
}

.edit-btn:hover {
  color: var(--template-primary);
}

.delete-btn:hover {
  color: #dc3545;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Detalles con estilo tabla del template */
.event-details-section {
  background: var(--template-bg-card);
  border: 1px solid var(--template-border-light);
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.event-details-section h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: var(--template-primary);
  font-weight: 600;
}

.details-table {
  display: grid;
  gap: 8px;
}

.detail-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  padding: 5px 0;
  font-size: 0.95rem;
}

.detail-label {
  font-weight: 600;
  color: var(--template-text-muted);
}

.detail-value {
  color: var(--template-text-dark);
}

/* Estadísticas con estilo del template */
.event-stats-section {
  background: var(--template-info-bg);
  border: 1px solid var(--template-info-border);
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.event-stats-section h4 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: var(--template-info-text);
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid var(--template-info-border);
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 2px 8px rgba(0,102,204,0.1);
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--template-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--template-text-muted);
  font-weight: 500;
}

/* Badge de evento actual */
.current-event-badge {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Estado vacío con estilo del template */
.empty-state {
  text-align: center;
  padding: 60px 30px;
}

.empty-state-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: var(--template-primary);
  margin: 0 0 15px 0;
  font-weight: 600;
}

.empty-state p {
  color: var(--template-text-muted);
  line-height: 1.6;
  margin: 0 0 30px 0;
}

.empty-state-btn {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 15px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 8px rgba(13, 27, 42, 0.2);
}

.empty-state-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 27, 42, 0.3);
}

/* Modal con estilo del template */
.event-modal {
  --border-radius: 8px;
}

.modal-toolbar {
  --background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  --color: white;
}

.modal-content {
  --background: var(--template-bg-light);
}

.modal-form-container {
  padding: 30px;
  max-width: 600px;
  margin: 0 auto;
}

.event-form {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  padding: 35px 30px;
  box-shadow: var(--template-shadow);
}

.form-header {
  text-align: center;
  margin-bottom: 30px;
}

.form-header h3 {
  color: var(--template-primary);
  font-weight: 600;
  font-size: 1.3rem;
  margin: 0;
}

.form-fields {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--template-text-dark);
  margin-bottom: 8px;
}

.input-container {
  position: relative;
}

.custom-input,
.custom-textarea {
  --background: var(--template-bg-section);
  --border-color: var(--template-border-light);
  --color: var(--template-text-dark);
  --placeholder-color: var(--template-text-muted);
  --padding-start: 15px;
  --padding-end: 15px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  
  border: 1px solid var(--template-border-light);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.custom-input:focus,
.custom-textarea:focus {
  --border-color: var(--template-primary);
  --background: #ffffff;
  box-shadow: 0 0 0 3px rgba(13, 27, 42, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 18px 35px;
  font-size: 1.1rem;
  font-weight: 600;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(13, 27, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 27, 42, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button-spinner {
  width: 20px;
  height: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .events-container {
    padding: 20px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    padding: 25px 20px;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .event-card {
    padding: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .detail-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }
  
  .modal-form-container {
    padding: 20px;
  }
  
  .event-form {
    padding: 25px 20px;
  }
}

@media (max-width: 480px) {
  .events-container {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px 16px;
  }
  
  .events-section {
    padding: 25px 16px;
  }
  
  .event-card {
    padding: 16px;
  }
  
  .event-card-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .event-actions {
    justify-content: flex-end;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  animation: fadeInUp 0.6s ease-out;
}

.events-section {
  animation: fadeInUp 0.8s ease-out;
}

.event-card {
  animation: fadeInUp 1s ease-out;
}

.empty-state {
  animation: fadeInUp 1.2s ease-out;
}

/* Efecto de carga en botones */
.submit-btn:disabled .button-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>