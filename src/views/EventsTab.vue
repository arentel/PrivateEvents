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
import { supabase } from '@/services/supabase.js'
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
  const upcoming = events.value.filter(e => new Date(e.date) >= now).length
  const active = events.value.filter(e => e.is_active).length
  
  // Calcular totalGuests manualmente desde el store
  let totalGuests = 0
  events.value.forEach(event => {
    const eventGuests = eventsStore.guests.filter(g => g.event_id === event.id)
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
    result = result.filter(event =>
      event.name.toLowerCase().includes(search) ||
      (event.location && event.location.toLowerCase().includes(search)) ||
      (event.description && event.description.toLowerCase().includes(search))
    )
  }

  // Filtrar por estado
  const now = new Date()
  if (filterStatus.value === 'upcoming') {
    result = result.filter(e => new Date(e.date) >= now)
  } else if (filterStatus.value === 'past') {
    result = result.filter(e => new Date(e.date) < now)
  }

  // Ordenar por fecha (próximos primero)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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

const getEventStatusText = (event: any) => {
  if (isEventPast(event)) return 'Finalizado'
  if (isEventActive(event)) return 'Próximo'
  return 'Futuro'
}

const getEventGuestCount = (event: any) => {
  return eventsStore.guests.filter(g => g.event_id === event.id).length
}

const getEventAttendedCount = (event: any) => {
  return eventsStore.guests.filter(g => g.event_id === event.id && g.has_entered).length
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
// FUNCIONES DE SELECCIÓN
// ========================================
const selectEvent = async (event: any) => {
  eventsStore.setCurrentEvent(event.id)
  await vibrate('light')
  showToast(`Evento "${event.name}" seleccionado`, 'success')
}

const setAsActiveEvent = async (event: any) => {
  eventsStore.setCurrentEvent(event.id)
  showDetailsModal.value = false
  await vibrate('success')
  showToast(`"${event.name}" establecido como evento activo`, 'success')
}

// ========================================
// FUNCIONES DE CREACIÓN/EDICIÓN
// ========================================
const closeEventModal = () => {
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

const editEvent = (event: any) => {
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
    if (eventForm.value.location.trim()) {
      eventData.location = eventForm.value.location.trim()
    }

    // Solo añadir description si tiene valor
    if (eventForm.value.description.trim()) {
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

    closeEventModal()
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
// FUNCIONES DE VISUALIZACIÓN
// ========================================
const viewEventDetails = async (event: any) => {
  selectedEventDetails.value = event
  showDetailsModal.value = true
  await vibrate('light')
}

// ========================================
// FUNCIONES DE ELIMINACIÓN
// ========================================
const confirmDeleteEvent = async (event: any) => {
  await vibrate('warning')
  
  const alert = await alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar "${event.name}"? Esta acción no se puede deshacer y se eliminarán todos los invitados asociados.`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
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
}

.filter-chips ion-chip:hover {
  transform: scale(1.05);
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
}

.event-card:hover {
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-4px);
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
    gap: 12px;
  }

  .filter-chips {
    width: 100%;
    justify-content: space-between;
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
}

.delay-200 {
  animation-delay: 200ms;
}

.delay-300 {
  animation-delay: 300ms;
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
   INTERACCIONES
   ======================================== */
.event-card,
.action-btn,
.close-modal-btn {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: none) {
  .event-card:active {
    transform: scale(0.98);
  }

  .primary-action-btn:active:not(:disabled),
  .secondary-action-btn:active:not(:disabled) {
    transform: scale(0.95);
  }
}

/* ========================================
   FOCUS
   ======================================== */
.close-modal-btn:focus,
.primary-action-btn:focus,
.secondary-action-btn:focus,
.form-input:focus,
.form-textarea:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

.close-modal-btn:focus:not(:focus-visible),
.primary-action-btn:focus:not(:focus-visible),
.secondary-action-btn:focus:not(:focus-visible) {
  outline: none;
}
</style>