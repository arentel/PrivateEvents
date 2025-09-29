<template>
  <ion-page>
    <ion-content :fullscreen="true" class="events-content">
      <div class="events-container">
        
        <!-- Header -->
        <div class="page-header animate-fade-in-down">
          <div class="header-content">
            <h1>Mis Eventos</h1>
            <p>Gestiona tus eventos y configuraciones</p>
          </div>
          <ion-button 
            fill="clear"
            @click="refreshData"
            class="refresh-btn"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- Estadísticas Globales -->
        <div class="stats-section animate-fade-in-up delay-100">
          <div class="stats-grid">
            <div class="stat-card stat-total">
              <div class="stat-icon">
                <ion-icon :icon="calendarOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">Total Eventos</div>
              </div>
            </div>

            <div class="stat-card stat-active">
              <div class="stat-icon">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.active }}</div>
                <div class="stat-label">Activos</div>
              </div>
            </div>

            <div class="stat-card stat-guests">
              <div class="stat-icon">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.totalGuests }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </div>

            <div class="stat-card stat-upcoming">
              <div class="stat-icon">
                <ion-icon :icon="timeOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.upcoming }}</div>
                <div class="stat-label">Próximos</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Barra de acciones -->
        <div class="actions-section animate-fade-in-up delay-200">
          <div class="search-bar">
            <ion-searchbar
              v-model="searchTerm"
              @ionInput="handleSearch"
              placeholder="Buscar eventos..."
              animated
            ></ion-searchbar>
          </div>

          <div class="action-buttons">
            <ion-button 
              expand="block"
              @click="openCreateModal"
              class="create-event-btn"
            >
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Crear Evento
            </ion-button>
          </div>
        </div>

        <!-- ✅ SKELETON LOADER mientras carga -->
        <div v-if="loading" class="events-list-section animate-fade-in">
          <SkeletonLoader 
            type="generic" 
            :count="5"
          />
        </div>

        <!-- Lista de Eventos -->
        <div v-else-if="filteredEvents.length > 0" class="events-list-section animate-fade-in-up delay-300">
          <div class="section-header">
            <h3>Eventos ({{ filteredEvents.length }})</h3>
            
            <div class="filter-chips">
              <ion-chip 
                :color="filterStatus === 'all' ? 'primary' : 'medium'"
                @click="changeFilter('all')"
              >
                <ion-label>Todos</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'upcoming' ? 'success' : 'medium'"
                @click="changeFilter('upcoming')"
              >
                <ion-label>Próximos</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'past' ? 'medium' : 'medium'"
                @click="changeFilter('past')"
              >
                <ion-label>Pasados</ion-label>
              </ion-chip>
            </div>
          </div>

          <div class="events-grid">
            <div 
              v-for="event in paginatedEvents" 
              :key="event.id"
              class="event-card"
              :class="{
                'event-active': isEventActive(event),
                'event-past': isEventPast(event),
                'event-selected': selectedEvent?.id === event.id
              }"
              @click="selectEvent(event)"
            >
              <!-- Badge de estado -->
              <div class="event-status-badge" :class="getEventStatusClass(event)">
                {{ getEventStatusText(event) }}
              </div>

              <!-- Header del evento -->
              <div class="event-card-header">
                <div class="event-icon">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                </div>
                <h3>{{ event.name }}</h3>
              </div>

              <!-- Detalles del evento -->
              <div class="event-details">
                <div class="event-detail-row">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  <span>{{ formatDate(event.date) }}</span>
                </div>
                <div class="event-detail-row" v-if="event.location">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  <span>{{ event.location }}</span>
                </div>
                <div class="event-detail-row" v-if="event.description">
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  <span class="event-description">{{ event.description }}</span>
                </div>
              </div>

              <!-- Estadísticas del evento -->
              <div class="event-stats">
                <div class="event-stat">
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  <span>{{ getEventGuestCount(event) }} invitados</span>
                </div>
                <div class="event-stat">
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  <span>{{ getEventAttendedCount(event) }} asistieron</span>
                </div>
              </div>

              <!-- Acciones del evento -->
              <div class="event-actions">
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click.stop="editEvent(event)"
                  class="action-btn"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click.stop="viewEventDetails(event)"
                  class="action-btn"
                >
                  <ion-icon :icon="eyeOutline"></ion-icon>
                </ion-button>
                <ion-button 
                  fill="clear" 
                  size="small"
                  color="danger"
                  @click.stop="confirmDeleteEvent(event)"
                  class="action-btn"
                >
                  <ion-icon :icon="trashOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination">
            <ion-button 
              fill="outline"
              :disabled="currentPage === 1"
              @click="previousPage"
            >
              <ion-icon :icon="chevronBackOutline"></ion-icon>
              Anterior
            </ion-button>

            <div class="pagination-info">
              Página {{ currentPage }} de {{ totalPages }}
            </div>

            <ion-button 
              fill="outline"
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              Siguiente
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="empty-state animate-fade-in">
          <div class="empty-icon">
            <ion-icon :icon="calendarOutline"></ion-icon>
          </div>
          <h3>No hay eventos</h3>
          <p v-if="searchTerm">
            No se encontraron eventos que coincidan con "{{ searchTerm }}"
          </p>
          <p v-else>
            Comienza creando tu primer evento
          </p>
          <ion-button 
            @click="openCreateModal"
            class="create-first-event-btn"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Crear Primer Evento
          </ion-button>
        </div>

      </div>

      <!-- ========================================
           MODAL: CREAR/EDITAR EVENTO
           ======================================== -->
      <div v-if="showCreateEventModal || showEditEventModal" class="custom-modal-overlay" @click="closeEventModal">
        <div class="custom-modal large-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>{{ editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento' }}</h2>
            <button class="close-modal-btn" @click="closeEventModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <form @submit.prevent="saveEvent" class="event-form">
              <div class="form-group">
                <label>Nombre del evento *</label>
                <input
                  v-model="eventForm.name"
                  type="text"
                  placeholder="Ej: Fiesta de Gala 2025"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Fecha y hora *</label>
                <input
                  v-model="eventForm.date"
                  type="datetime-local"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Ubicación</label>
                <input
                  v-model="eventForm.location"
                  type="text"
                  placeholder="Ej: Salón Principal"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Descripción</label>
                <textarea
                  v-model="eventForm.description"
                  placeholder="Describe tu evento..."
                  rows="4"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Capacidad máxima</label>
                <input
                  v-model.number="eventForm.max_capacity"
                  type="number"
                  placeholder="Ej: 200"
                  class="form-input"
                />
              </div>

              <div class="modal-actions">
                <button 
                  type="submit"
                  class="primary-action-btn"
                  :disabled="saving"
                >
                  <ion-spinner v-if="saving" name="crescent"></ion-spinner>
                  <ion-icon v-else :icon="checkmarkOutline"></ion-icon>
                  <span>{{ saving ? 'Guardando...' : 'Guardar Evento' }}</span>
                </button>

                <button 
                  type="button"
                  class="secondary-action-btn"
                  @click="closeEventModal"
                  :disabled="saving"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- ========================================
           MODAL: DETALLES DEL EVENTO
           ======================================== -->
      <div v-if="showDetailsModal && selectedEventDetails" class="custom-modal-overlay" @click="showDetailsModal = false">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Detalles del Evento</h2>
            <button class="close-modal-btn" @click="showDetailsModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content event-details-content">
            <div class="detail-header">
              <div class="detail-icon">
                <ion-icon :icon="calendarOutline"></ion-icon>
              </div>
              <div class="detail-info">
                <h3>{{ selectedEventDetails.name }}</h3>
                <ion-badge :color="getEventStatusColor(selectedEventDetails)">
                  {{ getEventStatusText(selectedEventDetails) }}
                </ion-badge>
              </div>
            </div>

            <div class="detail-sections">
              <div class="detail-section">
                <h4>Información General</h4>
                <div class="detail-item">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  <div>
                    <strong>Fecha y hora:</strong>
                    <span>{{ formatDate(selectedEventDetails.date) }}</span>
                  </div>
                </div>
                <div class="detail-item" v-if="selectedEventDetails.location">
                  <ion-icon :icon="locationOutline"></ion-icon>
                  <div>
                    <strong>Ubicación:</strong>
                    <span>{{ selectedEventDetails.location }}</span>
                  </div>
                </div>
                <div class="detail-item" v-if="selectedEventDetails.description">
                  <ion-icon :icon="documentTextOutline"></ion-icon>
                  <div>
                    <strong>Descripción:</strong>
                    <span>{{ selectedEventDetails.description }}</span>
                  </div>
                </div>
                <div class="detail-item" v-if="selectedEventDetails.max_guests">
                  <ion-icon :icon="peopleOutline"></ion-icon>
                  <div>
                    <strong>Capacidad:</strong>
                    <span>{{ selectedEventDetails.max_guests }} personas</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Estadísticas</h4>
                <div class="detail-stats-grid">
                  <div class="detail-stat">
                    <div class="stat-number">{{ getEventGuestCount(selectedEventDetails) }}</div>
                    <div class="stat-text">Invitados</div>
                  </div>
                  <div class="detail-stat">
                    <div class="stat-number">{{ getEventAttendedCount(selectedEventDetails) }}</div>
                    <div class="stat-text">Asistieron</div>
                  </div>
                  <div class="detail-stat">
                    <div class="stat-number">{{ calculateAttendanceRate(selectedEventDetails) }}%</div>
                    <div class="stat-text">Asistencia</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Metadata</h4>
                <div class="detail-item">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                  <div>
                    <strong>Creado:</strong>
                    <span>{{ formatDateTime(selectedEventDetails.created_at) }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <ion-icon :icon="createOutline"></ion-icon>
                  <div>
                    <strong>Última actualización:</strong>
                    <span>{{ formatDateTime(selectedEventDetails.updated_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button 
                class="primary-action-btn"
                @click="editEventFromDetails"
              >
                <ion-icon :icon="createOutline"></ion-icon>
                <span>Editar Evento</span>
              </button>

              <button 
                class="secondary-action-btn"
                @click="setAsActiveEvent"
              >
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>Establecer como Activo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonChip,
  IonLabel,
  IonSearchbar,
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import {
  addOutline,
  calendarOutline,
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  documentTextOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  refreshOutline,
  closeOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons'
// @ts-ignore
import eventsStore from '@/stores/events'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useHaptics } from '@/composables/useHaptics'
import { useDebounce } from '@/composables/useDebounce'

// ========================================
// COMPOSABLES
// ========================================
const { vibrate } = useHaptics()

// ========================================
// ESTADOS
// ========================================
const loading = ref(true)
const saving = ref(false)
const searchTerm = ref('')
const filterStatus = ref<'all' | 'upcoming' | 'past'>('all')
const currentPage = ref(1)
const itemsPerPage = 9

// Modales
const showCreateEventModal = ref(false)
const showEditEventModal = ref(false)
const showDetailsModal = ref(false)

// Evento seleccionado
const selectedEventDetails = ref<any>(null)
const editingEvent = ref<any>(null)

// Formulario de evento
const eventForm = ref({
  name: '',
  date: '',
  location: '',
  description: '',
  max_capacity: null as number | null
})

// ========================================
// COMPUTED PROPERTIES
// ========================================
const events = computed(() => eventsStore.events)
const selectedEvent = computed(() => eventsStore.currentEvent)

// Estadísticas globales
const stats = computed(() => {
  const now = new Date()
  const total = events.value.length
  const upcoming = events.value.filter((e: any) => new Date(e.date) >= now).length
  const active = events.value.filter((e: any) => e.is_active).length
  
  // Calcular totalGuests manualmente desde el store
  let totalGuests = 0
  events.value.forEach((event: any) => {
    const eventGuests = eventsStore.guests.filter((g: any) => g.event_id === event.id)
    totalGuests += eventGuests.length
  })

  return { total, upcoming, active, totalGuests }
})

// Filtrar eventos
const filteredEvents = computed(() => {
  let result = [...events.value]

  // Filtrar por término de búsqueda
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase().trim()
    result = result.filter((event: any) =>
      event.name.toLowerCase().includes(search) ||
      (event.location && event.location.toLowerCase().includes(search)) ||
      (event.description && event.description.toLowerCase().includes(search))
    )
  }

  // Filtrar por estado
  const now = new Date()
  if (filterStatus.value === 'upcoming') {
    result = result.filter((e: any) => new Date(e.date) >= now)
  } else if (filterStatus.value === 'past') {
    result = result.filter((e: any) => new Date(e.date) < now)
  }

  // Ordenar por fecha (próximos primero)
  result.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
})

// Paginación
const totalPages = computed(() => {
  return Math.ceil(filteredEvents.value.length / itemsPerPage)
})

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEvents.value.slice(start, end)
})

// ========================================
// FUNCIONES DE EVENTOS
// ========================================
const isEventActive = (event: any) => {
  const now = new Date()
  const eventDate = new Date(event.date)
  const daysDiff = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return daysDiff >= 0 && daysDiff <= 7
}

const isEventPast = (event: any) => {
  return new Date(event.date) < new Date()
}

const getEventStatusClass = (event: any) => {
  if (isEventPast(event)) return 'status-past'
  if (isEventActive(event)) return 'status-active'
  return 'status-upcoming'
}

const getEventStatusColor = (event: any) => {
  if (isEventPast(event)) return 'medium'
  if (isEventActive(event)) return 'success'
  return 'primary'
}

const getEventStatusText = (event: any) => {
  if (isEventPast(event)) return 'Finalizado'
  if (isEventActive(event)) return 'Próximo'
  return 'Futuro'
}

const getEventGuestCount = (event: any) => {
  return eventsStore.guests.filter((g: any) => g.event_id === event.id).length
}

const getEventAttendedCount = (event: any) => {
  return eventsStore.guests.filter((g: any) => g.event_id === event.id && g.has_entered).length
}

const calculateAttendanceRate = (event: any) => {
  const guestCount = getEventGuestCount(event)
  const attendedCount = getEventAttendedCount(event)
  
  if (guestCount === 0) return 0
  return Math.round((attendedCount / guestCount) * 100)
}

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================
const loadEvents = async () => {
  loading.value = true

  try {
    await eventsStore.init()
    
    console.log('✅ Eventos cargados:', events.value.length)
    
  } catch (error) {
    console.error('Error cargando eventos:', error)
    await vibrate('error')
    showToast('Error al cargar eventos', 'danger')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await vibrate('light')
  await loadEvents()
  showToast('Datos actualizados', 'success')
}

// ========================================
// FUNCIONES DE BÚSQUEDA CON DEBOUNCE
// ========================================
const handleSearch = useDebounce((event: any) => {
  searchTerm.value = event.target.value
  currentPage.value = 1
  console.log('🔍 Búsqueda:', searchTerm.value)
}, 300)

// ========================================
// FUNCIONES DE FILTROS CON HÁPTICOS
// ========================================
const changeFilter = async (filter: 'all' | 'upcoming' | 'past') => {
  await vibrate('light')
  filterStatus.value = filter
  currentPage.value = 1
}

// ========================================
// FUNCIONES DE PAGINACIÓN CON HÁPTICOS
// ========================================
const previousPage = async () => {
  if (currentPage.value > 1) {
    await vibrate('light')
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    await vibrate('light')
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// ========================================
// FUNCIONES DE SELECCIÓN CON HÁPTICOS
// ========================================
const selectEvent = async (event: any) => {
  await vibrate('selection')
  eventsStore.setCurrentEvent(event.id)
  showToast(`Evento "${event.name}" seleccionado`, 'success')
}

const setAsActiveEvent = async () => {
  if (!selectedEventDetails.value) return
  
  await vibrate('success')
  eventsStore.setCurrentEvent(selectedEventDetails.value.id)
  showDetailsModal.value = false
  showToast(`"${selectedEventDetails.value.name}" establecido como evento activo`, 'success')
}

// ========================================
// FUNCIONES DE MODALES CON HÁPTICOS
// ========================================
const openCreateModal = async () => {
  await vibrate('light')
  showCreateEventModal.value = true
}

const closeEventModal = async () => {
  await vibrate('light')
  showCreateEventModal.value = false
  showEditEventModal.value = false
  editingEvent.value = null
  eventForm.value = {
    name: '',
    date: '',
    location: '',
    description: '',
    max_capacity: null
  }
}

const editEvent = async (event: any) => {
  await vibrate('light')
  editingEvent.value = event
  
  // Formatear fecha para input datetime-local
  const eventDate = new Date(event.date)
  const year = eventDate.getFullYear()
  const month = String(eventDate.getMonth() + 1).padStart(2, '0')
  const day = String(eventDate.getDate()).padStart(2, '0')
  const hours = String(eventDate.getHours()).padStart(2, '0')
  const minutes = String(eventDate.getMinutes()).padStart(2, '0')
  
  eventForm.value = {
    name: event.name,
    date: `${year}-${month}-${day}T${hours}:${minutes}`,
    location: event.location || '',
    description: event.description || '',
    max_capacity: event.max_guests || null
  }
  
  showDetailsModal.value = false
  showEditEventModal.value = true
}

const editEventFromDetails = async () => {
  if (selectedEventDetails.value) {
    await editEvent(selectedEventDetails.value)
  }
}

const saveEvent = async () => {
  if (!eventForm.value.name.trim() || !eventForm.value.date) {
    showToast('Nombre y fecha son obligatorios', 'warning')
    await vibrate('warning')
    return
  }

  saving.value = true
  await vibrate('light')

  try {
    const eventData: any = {
      name: eventForm.value.name.trim(),
      date: new Date(eventForm.value.date).toISOString(),
      is_active: true
    }

    // Solo añadir location si tiene valor
    if (eventForm.value.location?.trim()) {
      eventData.location = eventForm.value.location.trim()
    }

    // Solo añadir description si tiene valor
    if (eventForm.value.description?.trim()) {
      eventData.description = eventForm.value.description.trim()
    }

    // Solo añadir max_guests si tiene valor
    if (eventForm.value.max_capacity) {
      eventData.max_guests = eventForm.value.max_capacity
    }

    if (editingEvent.value) {
      // Actualizar evento existente usando el store
      await eventsStore.updateEvent(editingEvent.value.id, eventData)
      await vibrate('success')
      showToast('Evento actualizado correctamente', 'success')
    } else {
      // Crear nuevo evento usando el store
      await eventsStore.createEvent(eventData)
      await vibrate('success')
      showToast('Evento creado correctamente', 'success')
    }

    await closeEventModal()
    await loadEvents()

  } catch (error: any) {
    console.error('Error guardando evento:', error)
    await vibrate('error')
    showToast(error.message || 'Error al guardar evento', 'danger')
  } finally {
    saving.value = false
  }
}

// ========================================
// FUNCIONES DE VISUALIZACIÓN CON HÁPTICOS
// ========================================
const viewEventDetails = async (event: any) => {
  await vibrate('light')
  selectedEventDetails.value = event
  showDetailsModal.value = true
}

// ========================================
// FUNCIONES DE ELIMINACIÓN CON HÁPTICOS
// ========================================
const confirmDeleteEvent = async (event: any) => {
  await vibrate('warning')
  
  const alert = await alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar "${event.name}"? Esta acción no se puede deshacer y se eliminarán todos los invitados asociados.`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: async () => {
          await vibrate('light')
        }
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => deleteEvent(event)
      }
    ]
  })

  await alert.present()
}

const deleteEvent = async (event: any) => {
  try {
    // Usar la función del store
    await eventsStore.deleteEvent(event.id)

    await vibrate('success')
    showToast('Evento eliminado correctamente', 'success')
    
    await loadEvents()

  } catch (error: any) {
    console.error('Error eliminando evento:', error)
    await vibrate('error')
    showToast('Error al eliminar evento', 'danger')
  }
}

// ========================================
// FUNCIONES DE UTILIDADES
// ========================================
const showToast = async (message: string, color: string = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2500,
    color,
    position: 'top'
  })
  await toast.present()
}

const formatDate = (dateString: string) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const formatDateTime = (dateString: string) => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// ========================================
// WATCHERS
// ========================================
watch([searchTerm, filterStatus], () => {
  currentPage.value = 1
})

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('📅 EventsTab montado')
  await loadEvents()
})

onActivated(async () => {
  console.log('🔄 EventsTab activado - refrescando datos')
  await loadEvents()
})
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.events-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.events-content {
  --background: #f8f9fa;
}

/* ========================================
   HEADER
   ======================================== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.header-content {
  flex: 1;
}

.header-content h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.header-content p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.refresh-btn {
  --color: #667eea;
  --padding-start: 12px;
  --padding-end: 12px;
}

/* ========================================
   ESTADÍSTICAS
   ======================================== */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.stat-total {
  border-left-color: #667eea;
}

.stat-total .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-active {
  border-left-color: #10b981;
}

.stat-active .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-guests {
  border-left-color: #f59e0b;
}

.stat-guests .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-upcoming {
  border-left-color: #0ea5e9;
}

.stat-upcoming .stat-icon {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ========================================
   ACCIONES
   ======================================== */
.actions-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.search-bar {
  margin-bottom: 16px;
}

.search-bar ion-searchbar {
  --background: #f8f9fa;
  --border-radius: 8px;
  --box-shadow: none;
  --icon-color: #667eea;
}

.action-buttons {
  display: grid;
  gap: 12px;
}

.create-event-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

/* ========================================
   LISTA DE EVENTOS
   ======================================== */
.events-list-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
}

.filter-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-chips ion-chip {
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.filter-chips ion-chip:hover {
  transform: scale(1.05);
}

.filter-chips ion-chip:active {
  transform: scale(0.95);
}

/* Grid de eventos */
.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* Tarjeta de evento */
.event-card {
  position: relative;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  user-select: none;
}

.event-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
}

.event-card:active {
  transform: translateY(-2px);
}

.event-card.event-selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #ede9fe 0%, #f8f9fa 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.event-card.event-past {
  opacity: 0.7;
  border-color: #d1d5db;
}

.event-card.event-past:hover {
  opacity: 1;
}

.event-card.event-active {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #f8f9fa 100%);
}

/* Badge de estado */
.event-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-upcoming {
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-past {
  background: #f3f4f6;
  color: #6b7280;
}

/* Header del evento */
.event-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.event-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.3);
}

.event-card.event-active .event-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.event-card.event-past .event-icon {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.event-card-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  flex: 1;
  word-wrap: break-word;
}

/* Detalles del evento */
.event-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.event-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.4;
}

.event-detail-row ion-icon {
  color: #667eea;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.event-detail-row span {
  flex: 1;
  word-wrap: break-word;
}

.event-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Estadísticas del evento */
.event-stats {
  display: flex;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.event-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}

.event-stat ion-icon {
  color: #667eea;
  font-size: 1rem;
}

/* Acciones del evento */
.event-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.action-btn {
  --padding-start: 8px;
  --padding-end: 8px;
}

/* ========================================
   PAGINACIÓN
   ======================================== */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

/* ========================================
   ESTADO VACÍO
   ======================================== */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  color: #9ca3af;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

.create-first-event-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
}

/* ========================================
   MODALES PERSONALIZADOS
   ======================================== */
.custom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

.custom-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

.custom-modal.large-modal {
  max-width: 600px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-modal-header {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.custom-modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.close-modal-btn:active {
  transform: scale(0.95);
}

.custom-modal-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* ========================================
   FORMULARIO DE EVENTO
   ======================================== */
.event-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* ========================================
   DETALLES DEL EVENTO
   ======================================== */
.event-details-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.detail-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
  word-wrap: break-word;
}

.detail-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item ion-icon {
  color: #667eea;
  font-size: 1.3rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.detail-item div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.detail-item strong {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.9rem;
}

.detail-item span {
  color: #6b7280;
  font-size: 0.95rem;
  word-wrap: break-word;
}

/* Grid de estadísticas en detalles */
.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.detail-stat {
  text-align: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-text {
  font-size: 0.85rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ========================================
   ACCIONES DEL MODAL
   ======================================== */
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

.primary-action-btn,
.secondary-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  user-select: none;
}

.primary-action-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.primary-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.primary-action-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-action-btn {
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
}

.secondary-action-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #d1d5db;
}

.secondary-action-btn:active:not(:disabled) {
  transform: scale(0.98);
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .events-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-chips {
    width: 100%;
  }

  .events-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
  }

  .custom-modal {
    max-width: 100%;
    margin: 0;
    border-radius: 16px 16px 0 0;
    max-height: 95vh;
  }

  .custom-modal-header {
    padding: 20px;
  }

  .custom-modal-content {
    padding: 20px;
  }

  .detail-stats-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .events-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-content p {
    font-size: 0.9rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .event-card {
    padding: 16px;
  }

  .event-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .event-card-header h3 {
    font-size: 1rem;
  }

  .event-detail-row {
    font-size: 0.85rem;
  }

  .detail-header {
    flex-direction: column;
    text-align: center;
  }

  .detail-icon {
    width: 56px;
    height: 56px;
    font-size: 1.8rem;
  }

  .detail-info h3 {
    font-size: 1.1rem;
  }
}

/* ========================================
   ANIMACIONES
   ======================================== */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
}

.animate-fade-in-down {
  animation: fadeInDown 0.5s ease-out;
}

.delay-100 {
  animation-delay: 100ms;
  animation-fill-mode: backwards;
}

.delay-200 {
  animation-delay: 200ms;
  animation-fill-mode: backwards;
}

.delay-300 {
  animation-delay: 300ms;
  animation-fill-mode: backwards;
}

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

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========================================
   ACCESIBILIDAD
   ======================================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ========================================
   SCROLLBAR PERSONALIZADO
   ======================================== */
.custom-modal-content::-webkit-scrollbar {
  width: 8px;
}

.custom-modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.custom-modal-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

.custom-modal-content::-webkit-scrollbar-thumb:hover {
  background: #5a6fce;
}

/* ========================================
   INTERACCIONES TÁCTILES
   ======================================== */
@media (hover: none) {
  .event-card:active {
    transform: scale(0.98);
  }

  .filter-chips ion-chip:active {
    transform: scale(0.9);
  }
}

/* ========================================
   FOCUS VISIBLE
   ======================================== */
.close-modal-btn:focus-visible,
.primary-action-btn:focus-visible,
.secondary-action-btn:focus-visible,
.form-input:focus-visible,
.form-textarea:focus-visible {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}
</style>