<template>
  <ion-page>
    <ion-content>
      <div class="reports-container">
        <!-- Header simple -->
        <div class="page-header">
          <h1>📊 Reportes</h1>
          <ion-button
            fill="outline"
            @click="refreshData"
          >
            <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
            Actualizar
          </ion-button>
        </div>

        <!-- Cargando -->
        <div v-if="isLoading" class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando datos...</p>
        </div>

        <!-- Selector de Evento -->
        <div v-if="!isLoading && eventsStore.events.length > 1" class="event-selector-section">
          <div class="section-header">
            <h3>Seleccionar Evento</h3>
          </div>
          
          <ion-select 
            v-model="selectedEventId"
            @ionChange="onEventChange"
            placeholder="Selecciona un evento"
            interface="popover"
            class="event-select"
          >
            <ion-select-option 
              v-for="event in eventsStore.events" 
              :key="event.id" 
              :value="event.id"
            >
              {{ event.name }} - {{ formatEventDate(event.date) }}
            </ion-select-option>
          </ion-select>
          
          <div v-if="selectedEvent" class="event-info">
            <h4>{{ selectedEvent.name }}</h4>
            <p v-if="selectedEvent.description">{{ selectedEvent.description }}</p>
            <p><strong>Fecha:</strong> {{ formatEventDate(selectedEvent.date) }}</p>
            <p v-if="selectedEvent.location"><strong>Ubicación:</strong> {{ selectedEvent.location }}</p>
          </div>
        </div>

        <!-- Evento actual si solo hay uno -->
        <div v-else-if="!isLoading && selectedEvent" class="current-event-section">
          <div class="section-header">
            <h3>{{ selectedEvent.name }}</h3>
          </div>
          <p>{{ formatEventDate(selectedEvent.date) }}</p>
        </div>

        <!-- Estadísticas principales -->
        <div v-if="!isLoading && selectedEvent" class="stats-section">
          <div class="section-header">
            <h3>Resumen de {{ selectedEvent.name }}</h3>
          </div>
          
          <div class="event-stats">
            <div class="stat-item">
              <span class="stat-value">{{ eventStats.total }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ eventStats.attended }}</span>
              <span class="stat-label">Asistieron</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ eventStats.sent }}</span>
              <span class="stat-label">QRs Enviados</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ attendanceRate }}%</span>
              <span class="stat-label">Asistencia</span>
            </div>
          </div>
          
          <!-- Barra de progreso de asistencia -->
          <div class="progress-section">
            <p class="progress-label">Tasa de Asistencia</p>
            <ion-progress-bar 
              :value="attendanceRate / 100"
              color="success"
            ></ion-progress-bar>
            <p class="progress-text">
              {{ eventStats.attended }} de {{ eventStats.total }} invitados asistieron
            </p>
          </div>
        </div>

        <!-- Generación de PDFs -->
        <div v-if="!isLoading && selectedEvent && eventStats.total > 0" class="pdf-section">
          <div class="section-header">
            <h3>Generar Reportes PDF</h3>
          </div>
          
          <div class="form-content">
            <ion-button 
              expand="block" 
              @click="generateAttendeesPDF"
              :disabled="eventStats.attended === 0 || isGeneratingPDF"
              color="success"
              class="pdf-btn"
            >
              <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
              {{ isGeneratingPDF ? 'Generando...' : `PDF Solo Asistentes (${eventStats.attended})` }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              @click="generateFullReportPDF"
              :disabled="eventStats.total === 0 || isGeneratingPDF"
              class="pdf-btn"
            >
              <ion-icon :icon="analyticsOutline" slot="start"></ion-icon>
              {{ isGeneratingPDF ? 'Generando...' : 'PDF Reporte Completo' }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              @click="generateGuestListPDF"
              :disabled="eventStats.total === 0 || isGeneratingPDF"
              color="tertiary"
              class="pdf-btn"
            >
              <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
              {{ isGeneratingPDF ? 'Generando...' : 'PDF Lista de Invitados' }}
            </ion-button>
            
            <div v-if="lastPDFGenerated" class="pdf-status">
              <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
              <span>Último PDF generado: {{ formatDate(lastPDFGenerated) }}</span>
            </div>
          </div>
        </div>

        <!-- Filtros y vista de datos -->
        <div v-if="!isLoading && selectedEvent && eventStats.total > 0" class="filters-section">
          <div class="section-header">
            <h3>Ver Datos del Evento</h3>
          </div>
          
          <ion-segment v-model="selectedView">
            <ion-segment-button value="attended">
              <ion-label>Asistentes ({{ eventStats.attended }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="all">
              <ion-label>Todos ({{ eventStats.total }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="pending">
              <ion-label>Sin QR ({{ eventStats.pending }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="sent">
              <ion-label>Con QR ({{ eventStats.sent }})</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Lista de invitados según filtro -->
        <div v-if="!isLoading && selectedEvent && eventStats.total > 0" class="guests-list-section">
          <div class="section-header">
            <h3>{{ getListTitle() }}</h3>
            <ion-button 
              v-if="currentList.length > 0"
              size="small" 
              fill="outline"
              @click="exportCurrentList"
            >
              <ion-icon :icon="downloadOutline" slot="start"></ion-icon>
              Exportar
            </ion-button>
          </div>
          
          <div class="guests-list" v-if="currentList.length > 0">
            <div v-for="(guest, index) in currentList" :key="guest.id" class="guest-item" :class="getGuestClass(guest)">
              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>
              
              <div class="guest-info">
                <h4>{{ index + 1 }}. {{ guest.name }}</h4>
                <p>{{ guest.email }}</p>
                <p v-if="guest.phone" class="phone">📱 {{ guest.phone }}</p>
                <p v-if="guest.qr_sent_at || guest.sent_at" class="timestamp">
                  QR enviado: {{ formatDate(guest.qr_sent_at || guest.sent_at) }}
                </p>
                <p v-if="guest.entered_at" class="timestamp">
                  Entrada: {{ formatDate(guest.entered_at) }}
                </p>
              </div>
              
              <div class="guest-status">
                <span class="status-badge" :class="getStatusClass(guest)">
                  {{ getStatusText(guest) }}
                </span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <p>{{ getEmptyMessage() }}</p>
          </div>
        </div>

        <!-- Estadísticas por hora -->
        <div v-if="!isLoading && selectedEvent && eventStats.attended > 0" class="hourly-section">
          <div class="section-header">
            <h3>Entradas por Hora</h3>
          </div>
          
          <div class="hourly-stats">
            <div 
              v-for="stat in hourlyStats" 
              :key="stat.hour"
              class="hour-stat"
            >
              <div class="hour-label">{{ stat.hour }}:00</div>
              <div class="hour-bar">
                <div 
                  class="hour-fill"
                  :style="{ width: stat.percentage + '%' }"
                ></div>
              </div>
              <div class="hour-count">{{ stat.count }}</div>
            </div>
          </div>
        </div>

        <!-- Comparativa de eventos -->
        <div v-if="!isLoading && eventsStore.events.length > 1" class="comparison-section">
          <div class="section-header">
            <h3>Comparativa de Eventos</h3>
          </div>
          
          <div class="events-comparison">
            <div 
              v-for="event in eventsStore.events" 
              :key="event.id"
              class="event-comparison-row"
            >
              <div class="event-name">{{ event.name }}</div>
              <div class="event-stats-text">
                <span class="stat">{{ getEventGuestCount(event.id) }} invitados</span>
                <span class="stat">{{ getEventAttendanceCount(event.id) }} asistieron</span>
                <span class="stat">{{ getEventAttendanceRate(event.id) }}% asistencia</span>
              </div>
            </div>
          </div>
          
          <ion-button 
            expand="block" 
            fill="outline"
            @click="generateComparativeReport"
            :disabled="isGeneratingPDF"
            class="comparative-btn"
          >
            <ion-icon :icon="barChartOutline" slot="start"></ion-icon>
            Generar Reporte Comparativo
          </ion-button>
        </div>

        <!-- Estado vacío -->
        <div v-if="!isLoading && eventsStore.events.length === 0" class="no-events">
          <ion-icon :icon="calendarOutline" size="large"></ion-icon>
          <h3>No hay eventos</h3>
          <p>Crea tu primer evento para generar reportes</p>
          <ion-button @click="$router.push('/tabs/events')" class="create-event-btn">
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            Crear Evento
          </ion-button>
        </div>
      </div>
    </ion-content>

    <!-- Toast para mensajes -->
    <ion-toast
      :is-open="toast.isOpen"
      :message="toast.message"
      :duration="3000"
      :color="toast.color"
      @didDismiss="toast.isOpen = false"
    ></ion-toast>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch, onActivated } from 'vue'
import {
  IonPage, IonContent, IonSpinner, IonButton, IonIcon, IonProgressBar, 
  IonSegment, IonSegmentButton, IonLabel, IonToast, IonSelect, IonSelectOption
} from '@ionic/vue'
import {
  documentTextOutline, analyticsOutline, checkmarkCircleOutline,
  downloadOutline, refreshOutline, peopleOutline, calendarOutline,
  barChartOutline
} from 'ionicons/icons'
import { eventsStore } from '../stores/events'
// ❌ QUITAMOS ESTE IMPORT ESTÁTICO:
// import { generatePDF } from '../services/pdf'
import { supabase } from '../services/supabase'

// Estado reactivo
const selectedEventId = ref(null)
const selectedView = ref('attended')
const isGeneratingPDF = ref(false)
const lastPDFGenerated = ref(null)
const isLoading = ref(true)
const localGuests = ref([])

const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties
const selectedEvent = computed(() => {
  if (!selectedEventId.value) return null
  return eventsStore.events.find(e => e.id === selectedEventId.value) || null
})

const eventGuests = computed(() => {
  if (!selectedEventId.value) return []
  return localGuests.value.filter(g => g.event_id === selectedEventId.value)
})

const eventStats = computed(() => {
  const guests = eventGuests.value
  return {
    total: guests.length,
    sent: guests.filter(g => g.qr_sent || g.sent).length,
    attended: guests.filter(g => g.has_entered).length,
    pending: guests.filter(g => !(g.qr_sent || g.sent)).length,
    confirmed: guests.filter(g => g.confirmed).length
  }
})

const attendanceRate = computed(() => 
  eventStats.value.total > 0 ? Math.round((eventStats.value.attended / eventStats.value.total) * 100) : 0
)

const currentList = computed(() => {
  const guests = eventGuests.value
  
  switch (selectedView.value) {
    case 'attended':
      return guests
        .filter(g => g.has_entered)
        .sort((a, b) => new Date(b.entered_at || b.created_at) - new Date(a.entered_at || a.created_at))
    case 'all':
      return guests
        .sort((a, b) => a.name.localeCompare(b.name))
    case 'pending':
      return guests
        .filter(g => !(g.qr_sent || g.sent))
        .sort((a, b) => a.name.localeCompare(b.name))
    case 'sent':
      return guests
        .filter(g => (g.qr_sent || g.sent) && !g.has_entered)
        .sort((a, b) => new Date(b.qr_sent_at || b.sent_at || b.created_at) - new Date(a.qr_sent_at || a.sent_at || a.created_at))
    default:
      return []
  }
})

const hourlyStats = computed(() => {
  const attendedGuests = eventGuests.value.filter(g => g.has_entered && g.entered_at)
  if (attendedGuests.length === 0) return []
  
  const hourCounts = {}
  
  attendedGuests.forEach(guest => {
    const date = new Date(guest.entered_at)
    const hour = date.getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  
  const maxCount = Math.max(...Object.values(hourCounts))
  
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({
      hour: hour.padStart(2, '0'),
      count,
      percentage: (count / maxCount) * 100
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
})

// Función para cargar datos desde Supabase
const loadGuestsData = async () => {
  try {
    isLoading.value = true
    
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    localGuests.value = guests || []
    
    console.log('Invitados cargados desde Supabase:', localGuests.value.length)
    console.log('Invitados que han entrado:', localGuests.value.filter(g => g.has_entered).length)
    
  } catch (error) {
    console.error('Error cargando invitados:', error)
    showToast('Error al cargar datos', 'danger')
  } finally {
    isLoading.value = false
  }
}

// Watch para mantener sincronizado con el evento actual del store
watch(() => eventsStore.currentEventId, (newEventId) => {
  if (newEventId && (!selectedEventId.value || selectedEventId.value !== newEventId)) {
    selectedEventId.value = newEventId
  }
}, { immediate: true })

// Función para mostrar toast
const showToast = (message, color = 'success') => {
  toast.value = {
    isOpen: true,
    message,
    color
  }
}

// Función para cambiar evento
const onEventChange = (event) => {
  const eventId = event.detail.value
  selectedEventId.value = eventId
  eventsStore.setCurrentEvent(eventId)
  selectedView.value = 'attended'
}

// Función para refrescar datos
const refreshData = async () => {
  try {
    await Promise.all([
      eventsStore.forceReload(),
      loadGuestsData()
    ])
    showToast('Datos actualizados')
  } catch (error) {
    console.error('Error refreshing data:', error)
    showToast('Error al actualizar datos', 'danger')
  }
}

// ✅ FUNCIÓN 1 OPTIMIZADA: PDF de asistentes
const generateAttendeesPDF = async () => {
  if (eventStats.value.attended === 0) {
    showToast('No hay asistentes para generar PDF', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    console.log('Cargando generador de PDF para asistentes...')
    
    // ✅ Importación dinámica - solo cuando el usuario descarga
    const { generatePDF } = await import('../services/pdf')
    
    const attendeesList = eventGuests.value.filter(g => g.has_entered)
    
    await generatePDF({
      type: 'attendees',
      eventName: selectedEvent.value.name,
      eventDate: selectedEvent.value.date,
      eventLocation: selectedEvent.value.location,
      attendees: attendeesList,
      stats: {
        total: eventStats.value.total,
        attended: eventStats.value.attended,
        rate: attendanceRate.value
      }
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('PDF de asistentes generado')
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    showToast('Error al generar PDF: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// ✅ FUNCIÓN 2 OPTIMIZADA: PDF de reporte completo
const generateFullReportPDF = async () => {
  if (eventStats.value.total === 0) {
    showToast('No hay datos para generar reporte', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    console.log('Cargando generador de PDF para reporte completo...')
    
    // ✅ Importación dinámica - solo cuando el usuario descarga
    const { generatePDF } = await import('../services/pdf')
    
    await generatePDF({
      type: 'full',
      eventName: selectedEvent.value.name,
      eventDate: selectedEvent.value.date,
      eventLocation: selectedEvent.value.location,
      eventDescription: selectedEvent.value.description,
      guests: eventGuests.value,
      attendees: eventGuests.value.filter(g => g.has_entered),
      stats: {
        total: eventStats.value.total,
        attended: eventStats.value.attended,
        sent: eventStats.value.sent,
        pending: eventStats.value.pending,
        rate: attendanceRate.value
      },
      hourlyStats: hourlyStats.value
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('Reporte completo generado')
    
  } catch (error) {
    console.error('Error generating full report:', error)
    showToast('Error al generar reporte: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// ✅ FUNCIÓN 3 OPTIMIZADA: PDF lista de invitados
const generateGuestListPDF = async () => {
  if (eventStats.value.total === 0) {
    showToast('No hay invitados para generar lista', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    console.log('Cargando generador de PDF para lista de invitados...')
    
    // ✅ Importación dinámica - solo cuando el usuario descarga
    const { generatePDF } = await import('../services/pdf')
    
    await generatePDF({
      type: 'guests',
      eventName: selectedEvent.value.name,
      eventDate: selectedEvent.value.date,
      eventLocation: selectedEvent.value.location,
      guests: eventGuests.value,
      stats: {
        total: eventStats.value.total,
        sent: eventStats.value.sent,
        pending: eventStats.value.pending
      }
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('Lista de invitados generada')
    
  } catch (error) {
    console.error('Error generating guest list:', error)
    showToast('Error al generar lista: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// ✅ FUNCIÓN 4 OPTIMIZADA: Reporte comparativo
const generateComparativeReport = async () => {
  if (eventsStore.events.length < 2) {
    showToast('Se necesitan al menos 2 eventos para comparar', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    console.log('Cargando generador de PDF para reporte comparativo...')
    
    // ✅ Importación dinámica - solo cuando el usuario descarga
    const { generatePDF } = await import('../services/pdf')
    
    const eventsData = eventsStore.events.map(event => {
      const eventGuestsForComparison = localGuests.value.filter(g => g.event_id === event.id)
      return {
        event,
        guests: eventGuestsForComparison,
        stats: {
          total: eventGuestsForComparison.length,
          sent: eventGuestsForComparison.filter(g => g.qr_sent || g.sent).length,
          scanned: eventGuestsForComparison.filter(g => g.has_entered).length,
          rate: eventGuestsForComparison.length > 0 ? Math.round((eventGuestsForComparison.filter(g => g.has_entered).length / eventGuestsForComparison.length) * 100) : 0
        }
      }
    })
    
    await generatePDF({
      type: 'comparative',
      eventsData
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('Reporte comparativo generado')
    
  } catch (error) {
    console.error('Error generating comparative report:', error)
    showToast('Error al generar reporte comparativo: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Función para exportar lista actual
const exportCurrentList = () => {
  if (currentList.value.length === 0) return
  
  const csvContent = generateCSV(currentList.value)
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  const eventName = selectedEvent.value.name.replace(/\s+/g, '_')
  const listType = getListTitle().replace(/\s+/g, '_')
  
  link.href = url
  link.download = `${eventName}_${listType}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  window.URL.revokeObjectURL(url)
  showToast('Lista exportada como CSV')
}

// Función para generar CSV
const generateCSV = (data) => {
  const headers = ['Nombre', 'Email', 'Teléfono', 'QR Enviado', 'Ha Entrado', 'Fecha QR', 'Fecha Entrada']
  const rows = data.map(guest => [
    guest.name,
    guest.email,
    guest.phone || '',
    (guest.qr_sent || guest.sent) ? 'Sí' : 'No',
    guest.has_entered ? 'Sí' : 'No',
    (guest.qr_sent_at || guest.sent_at) ? formatDate(guest.qr_sent_at || guest.sent_at) : '',
    guest.entered_at ? formatDate(guest.entered_at) : ''
  ])
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

// Funciones para estadísticas de eventos
const getEventGuestCount = (eventId) => {
  return localGuests.value.filter(g => g.event_id === eventId).length
}

const getEventAttendanceCount = (eventId) => {
  return localGuests.value.filter(g => g.event_id === eventId && g.has_entered).length
}

const getEventAttendanceRate = (eventId) => {
  const guests = localGuests.value.filter(g => g.event_id === eventId)
  const attended = guests.filter(g => g.has_entered).length
  return guests.length > 0 ? Math.round((attended / guests.length) * 100) : 0
}

// Funciones de utilidad
const getGuestClass = (guest) => {
  if (guest.has_entered) return 'scanned'
  if (guest.qr_sent || guest.sent) return 'sent'
  return 'pending'
}

const getStatusClass = (guest) => {
  if (guest.has_entered) return 'success'
  if (guest.qr_sent || guest.sent) return 'warning'
  return 'medium'
}

const getStatusText = (guest) => {
  if (guest.has_entered) return 'ASISTIÓ'
  if (guest.qr_sent || guest.sent) return 'QR ENVIADO'
  return 'PENDIENTE'
}

const getListTitle = () => {
  if (!selectedEvent.value) return 'Lista'
  
  switch (selectedView.value) {
    case 'attended':
      return `Asistentes de ${selectedEvent.value.name} (${eventStats.value.attended})`
    case 'all':
      return `Todos los Invitados de ${selectedEvent.value.name} (${eventStats.value.total})`
    case 'pending':
      return `Sin QR de ${selectedEvent.value.name} (${eventStats.value.pending})`
    case 'sent':
      return `Con QR de ${selectedEvent.value.name} (${eventStats.value.sent - eventStats.value.attended})`
    default:
      return 'Lista'
  }
}

const getEmptyMessage = () => {
  switch (selectedView.value) {
    case 'attended':
      return 'No hay asistentes registrados aún en este evento'
    case 'all':
      return 'No hay invitados en este evento'
    case 'pending':
      return 'Todos los invitados de este evento tienen QR enviado'
    case 'sent':
      return 'No hay invitados con QR enviado sin asistir'
    default:
      return 'No hay datos'
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEventDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Inicializar al montar y cuando se activa la vista
onMounted(async () => {
  try {
    await eventsStore.init()
    await loadGuestsData()
    
    if (eventsStore.events.length > 0) {
      selectedEventId.value = eventsStore.currentEventId || eventsStore.events[0].id
    }
  } catch (error) {
    console.error('Error initializing reports:', error)
  }
})

onActivated(async () => {
  console.log('ReportsTab activated - refreshing data')
  await loadGuestsData()
})
</script>

<style scoped>
.reports-container {
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

/* Secciones - mismo estilo que GuestsTab */
.event-selector-section,
.current-event-section,
.stats-section,
.pdf-section,
.filters-section,
.guests-list-section,
.hourly-section,
.comparison-section {
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

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

/* Event selector */
.event-select {
  --background: #f8f9fa;
  --color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
}

.event-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.event-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.event-info p {
  margin: 4px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Estadísticas - mismo estilo que GuestsTab */
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

/* Progress bar */
.progress-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.progress-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
  color: #1f2937;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #6b7280;
}

/* Botones - mismo estilo que GuestsTab */
.pdf-btn,
.comparative-btn,
.create-event-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  margin-bottom: 12px;
}

.pdf-btn:hover,
.comparative-btn:hover,
.create-event-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.pdf-btn[color="success"] {
  --background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.pdf-btn[color="tertiary"] {
  --background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* PDF Status */
.pdf-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background: #d4edda;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Segment */
ion-segment {
  --background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

ion-segment-button {
  --color: #6b7280;
  --color-checked: #0d1b2a;
  --background-checked: white;
  --border-radius: 6px;
}

/* Lista de invitados - mismo estilo que GuestsTab */
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

.timestamp {
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
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

/* Estadísticas por hora */
.hourly-stats {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.hour-stat {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hour-label {
  min-width: 50px;
  font-weight: bold;
  font-size: 0.9rem;
  color: #1f2937;
}

.hour-bar {
  flex: 1;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.hour-fill {
  height: 100%;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  transition: width 0.3s ease;
}

.hour-count {
  min-width: 30px;
  text-align: center;
  font-weight: bold;
  color: #1f2937;
}

/* Comparativa de eventos */
.events-comparison {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.event-comparison-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0d1b2a;
}

.event-name {
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  margin-right: 1rem;
  font-size: 1rem;
}

.event-stats-text {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: right;
}

.event-stats-text .stat {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Estados vacíos */
.empty-state,
.no-events {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-state ion-icon,
.no-events ion-icon {
  margin-bottom: 20px;
  color: #9ca3af;
}

.empty-state h3,
.no-events h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
}

.empty-state p,
.no-events p {
  margin: 0 0 24px 0;
  font-size: 0.9rem;
}

/* Toast personalización */
ion-toast {
  --background: #1f2937;
  --color: white;
  --border-radius: 8px;
}

/* Responsive - mismo que GuestsTab */
@media (max-width: 768px) {
  .reports-container {
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
  
  .event-selector-section,
  .current-event-section,
  .stats-section,
  .pdf-section,
  .filters-section,
  .guests-list-section,
  .hourly-section,
  .comparison-section {
    padding: 16px;
  }
  
  .guest-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .event-comparison-row {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .event-name {
    margin-right: 0;
  }
  
  .event-stats-text {
    text-align: center;
    flex-direction: row;
    gap: 1rem;
    justify-content: center;
  }
  
  .hour-stat {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .hour-label {
    min-width: 40px;
  }
  
  .hour-count {
    min-width: 25px;
  }
}

/* Ajustes adicionales para mantener consistencia */
ion-progress-bar {
  --progress-background: #28a745;
  height: 8px;
  border-radius: 4px;
}

ion-select {
  --placeholder-color: #9ca3af;
  --color: #1f2937;
}

/* Asegurar que los botones de outline mantengan el estilo */
ion-button[fill="outline"] {
  --border-color: #0d1b2a;
  --color: #0d1b2a;
  --background: transparent;
}

ion-button[fill="outline"]:hover {
  --background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.15);
}
</style>