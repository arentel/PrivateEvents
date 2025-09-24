<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>📊 Reportes</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshData">
            <ion-icon name="refresh-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Cargando -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner></ion-spinner>
        <p>Cargando datos...</p>
      </div>

      <!-- Selector de Evento -->
      <ion-card v-if="!isLoading && eventsStore.events.length > 1">
        <ion-card-header>
          <ion-card-title>Seleccionar Evento</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-select 
            v-model="selectedEventId"
            @ionChange="onEventChange"
            placeholder="Selecciona un evento"
            interface="popover"
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
            <h3>{{ selectedEvent.name }}</h3>
            <p v-if="selectedEvent.description">{{ selectedEvent.description }}</p>
            <p><strong>Fecha:</strong> {{ formatEventDate(selectedEvent.date) }}</p>
            <p v-if="selectedEvent.location"><strong>Ubicación:</strong> {{ selectedEvent.location }}</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Evento actual si solo hay uno -->
      <ion-card v-else-if="!isLoading && selectedEvent">
        <ion-card-content>
          <div class="current-event-header">
            <h2>{{ selectedEvent.name }}</h2>
            <p>{{ formatEventDate(selectedEvent.date) }}</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas principales -->
      <ion-card v-if="!isLoading && selectedEvent">
        <ion-card-header>
          <ion-card-title>Resumen de {{ selectedEvent.name }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ eventStats.total }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ eventStats.attended }}</div>
                <div class="stat-label">Asistieron</div>
              </div>
            </ion-col>
          </ion-row>
          
          <ion-row>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ eventStats.sent }}</div>
                <div class="stat-label">QRs Enviados</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ attendanceRate }}%</div>
                <div class="stat-label">Asistencia</div>
              </div>
            </ion-col>
          </ion-row>
          
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
        </ion-card-content>
      </ion-card>

      <!-- Generación de PDFs -->
      <ion-card v-if="!isLoading && selectedEvent && eventStats.total > 0">
        <ion-card-header>
          <ion-card-title>Generar Reportes PDF</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            @click="generateAttendeesPDF"
            :disabled="eventStats.attended === 0 || isGeneratingPDF"
            color="success"
          >
            <ion-icon name="document-text-outline" slot="start"></ion-icon>
            {{ isGeneratingPDF ? 'Generando...' : `PDF Solo Asistentes (${eventStats.attended})` }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            @click="generateFullReportPDF"
            :disabled="eventStats.total === 0 || isGeneratingPDF"
            color="primary"
          >
            <ion-icon name="analytics-outline" slot="start"></ion-icon>
            {{ isGeneratingPDF ? 'Generando...' : 'PDF Reporte Completo' }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            @click="generateGuestListPDF"
            :disabled="eventStats.total === 0 || isGeneratingPDF"
            color="tertiary"
          >
            <ion-icon name="people-outline" slot="start"></ion-icon>
            {{ isGeneratingPDF ? 'Generando...' : 'PDF Lista de Invitados' }}
          </ion-button>
          
          <div v-if="lastPDFGenerated" class="pdf-status">
            <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
            <span>Último PDF generado: {{ formatDate(lastPDFGenerated) }}</span>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Filtros y vista de datos -->
      <ion-card v-if="!isLoading && selectedEvent && eventStats.total > 0">
        <ion-card-header>
          <ion-card-title>Ver Datos del Evento</ion-card-title>
        </ion-card-header>
        <ion-card-content>
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
        </ion-card-content>
      </ion-card>

      <!-- Lista de invitados según filtro -->
      <ion-card v-if="!isLoading && selectedEvent && eventStats.total > 0">
        <ion-card-header>
          <ion-card-title>{{ getListTitle() }}</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div v-if="currentList.length > 0" class="list-header">
            <ion-button 
              size="small" 
              fill="outline"
              @click="exportCurrentList"
            >
              <ion-icon name="download-outline" slot="start"></ion-icon>
              Exportar Lista
            </ion-button>
          </div>
          
          <ion-list>
            <ion-item v-for="(guest, index) in currentList" :key="guest.id">
              <ion-label>
                <h2>{{ index + 1 }}. {{ guest.name }}</h2>
                <p>{{ guest.email }}</p>
                <p v-if="guest.phone" class="detail">📱 {{ guest.phone }}</p>
                <p v-if="guest.qr_sent_at || guest.sent_at" class="detail">
                  QR enviado: {{ formatDate(guest.qr_sent_at || guest.sent_at) }}
                </p>
                <p v-if="guest.entered_at" class="detail">
                  Entrada: {{ formatDate(guest.entered_at) }}
                </p>
              </ion-label>
              
              <div slot="end" class="status-indicators">
                <ion-chip 
                  v-if="guest.has_entered" 
                  color="success"
                  size="small"
                >
                  ASISTIÓ
                </ion-chip>
                <ion-chip 
                  v-else-if="guest.qr_sent || guest.sent" 
                  color="warning"
                  size="small"
                >
                  QR ENVIADO
                </ion-chip>
                <ion-chip 
                  v-else 
                  color="medium"
                  size="small"
                >
                  PENDIENTE
                </ion-chip>
              </div>
            </ion-item>
            
            <div v-if="currentList.length === 0" class="empty-state">
              <p>{{ getEmptyMessage() }}</p>
            </div>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas por hora (si hay asistentes) -->
      <ion-card v-if="!isLoading && selectedEvent && eventStats.attended > 0">
        <ion-card-header>
          <ion-card-title>Entradas por Hora</ion-card-title>
        </ion-card-header>
        <ion-card-content>
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
        </ion-card-content>
      </ion-card>

      <!-- Comparativa de eventos (si hay múltiples) -->
      <ion-card v-if="!isLoading && eventsStore.events.length > 1">
        <ion-card-header>
          <ion-card-title>Comparativa de Eventos</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="events-comparison">
            <div 
              v-for="event in eventsStore.events" 
              :key="event.id"
              class="event-comparison-row"
            >
              <div class="event-name">{{ event.name }}</div>
              <div class="event-stats">
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
          >
            <ion-icon name="bar-chart-outline" slot="start"></ion-icon>
            Generar Reporte Comparativo
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Botones de utilidad -->
      <ion-card v-if="!isLoading && selectedEvent">
        <ion-card-content>
          <ion-button 
            expand="block" 
            color="medium"
            fill="outline"
            @click="refreshData"
          >
            <ion-icon name="refresh-outline" slot="start"></ion-icon>
            Actualizar Datos
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Estado vacío -->
      <ion-card v-if="!isLoading && eventsStore.events.length === 0">
        <ion-card-content>
          <div class="empty-state">
            <ion-icon name="calendar-outline" size="large"></ion-icon>
            <h3>No hay eventos</h3>
            <p>Crea tu primer evento para generar reportes</p>
            <ion-button @click="$router.push('/tabs/events')">
              Crear Evento
            </ion-button>
          </div>
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
import { ref, onMounted, computed, watch, onActivated } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSpinner,
  IonButton, IonIcon, IonProgressBar, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonChip, IonToast, IonRow, IonCol,
  IonSelect, IonSelectOption
} from '@ionic/vue'
import {
  documentTextOutline, analyticsOutline, checkmarkCircleOutline,
  downloadOutline, refreshOutline, peopleOutline, calendarOutline,
  barChartOutline
} from 'ionicons/icons'
import { eventsStore } from '../stores/events'
import { generatePDF } from '../services/pdf'
// Importar supabase directamente para recargar datos
import { supabase } from '../services/supabase'

// Estado reactivo
const selectedEventId = ref(null)
const selectedView = ref('attended')
const isGeneratingPDF = ref(false)
const lastPDFGenerated = ref(null)
const isLoading = ref(true)

// Datos locales para asegurar reactividad
const localGuests = ref([])

const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties corregidos
const selectedEvent = computed(() => {
  if (!selectedEventId.value) return null
  return eventsStore.events.find(e => e.id === selectedEventId.value) || null
})

const eventGuests = computed(() => {
  if (!selectedEventId.value) return []
  // Usar datos locales que se actualizan automáticamente
  return localGuests.value.filter(g => g.event_id === selectedEventId.value)
})

const eventStats = computed(() => {
  const guests = eventGuests.value
  return {
    total: guests.length,
    sent: guests.filter(g => g.qr_sent || g.sent).length,
    attended: guests.filter(g => g.has_entered).length, // Usar has_entered consistentemente
    pending: guests.filter(g => !(g.qr_sent || g.sent)).length,
    confirmed: guests.filter(g => g.confirmed).length
  }
})

const attendanceRate = computed(() => 
  eventStats.value.total > 0 ? Math.round((eventStats.value.attended / eventStats.value.total) * 100) : 0
)

// Computed property para lista actual según filtro
const currentList = computed(() => {
  const guests = eventGuests.value
  
  switch (selectedView.value) {
    case 'attended':
      return guests
        .filter(g => g.has_entered) // Usar has_entered consistentemente
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

// Computed property para estadísticas por hora
const hourlyStats = computed(() => {
  const attendedGuests = eventGuests.value.filter(g => g.has_entered && g.entered_at)
  if (attendedGuests.length === 0) return []
  
  const hourCounts = {}
  
  attendedGuests.forEach(guest => {
    // Parseamos la fecha considerando la zona horaria Madrid
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
    
    // Cargar todos los invitados directamente desde Supabase
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
  selectedView.value = 'attended' // Reset view cuando cambia evento
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

// Función para generar PDF de asistentes
const generateAttendeesPDF = async () => {
  if (eventStats.value.attended === 0) {
    showToast('No hay asistentes para generar PDF', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
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
    showToast('✅ PDF de asistentes generado')
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    showToast('Error al generar PDF: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Función para generar PDF de reporte completo
const generateFullReportPDF = async () => {
  if (eventStats.value.total === 0) {
    showToast('No hay datos para generar reporte', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
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
    showToast('✅ Reporte completo generado')
    
  } catch (error) {
    console.error('Error generating full report:', error)
    showToast('Error al generar reporte: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Función para generar PDF lista de invitados
const generateGuestListPDF = async () => {
  if (eventStats.value.total === 0) {
    showToast('No hay invitados para generar lista', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
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
    showToast('✅ Lista de invitados generada')
    
  } catch (error) {
    console.error('Error generating guest list:', error)
    showToast('Error al generar lista: ' + error.message, 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Función para generar reporte comparativo
const generateComparativeReport = async () => {
  if (eventsStore.events.length < 2) {
    showToast('Se necesitan al menos 2 eventos para comparar', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
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
    showToast('✅ Reporte comparativo generado')
    
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
    // Cargar eventos primero
    await eventsStore.init()
    
    // Cargar invitados
    await loadGuestsData()
    
    // Si hay eventos y no hay uno seleccionado, seleccionar el primero o el actual
    if (eventsStore.events.length > 0) {
      selectedEventId.value = eventsStore.currentEventId || eventsStore.events[0].id
    }
  } catch (error) {
    console.error('Error initializing reports:', error)
  }
})

// Recargar datos cuando se activa la vista (importante para sincronización)
onActivated(async () => {
  console.log('ReportsTab activated - refreshing data')
  await loadGuestsData()
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: var(--ion-color-medium);
}

.current-event-header h2 {
  margin: 0 0 4px 0;
  color: var(--ion-color-primary);
}

.current-event-header p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.event-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--ion-color-light);
}

.event-info h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-primary);
}

.event-info p {
  margin: 4px 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.progress-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.progress-label {
  font-weight: bold;
  margin-bottom: 0.5rem;
  text-align: center;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

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

.list-header {
  margin-bottom: 1rem;
  text-align: right;
}

.status-indicators {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.detail {
  font-size: 0.8rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state ion-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-dark);
}

.empty-state p {
  margin: 0 0 16px 0;
}

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
  color: #666;
}

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
  background: var(--ion-color-light);
  border-radius: 8px;
}

.event-name {
  font-weight: bold;
  color: var(--ion-color-primary);
  flex: 1;
  margin-right: 1rem;
}

.event-stats {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  text-align: right;
}

.event-stats .stat {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

/* Responsive */
@media (max-width: 768px) {
  .stat-card {
    padding: 12px 4px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
  
  .event-comparison-row {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .event-name {
    margin-right: 0;
  }
  
  .event-stats {
    text-align: center;
    flex-direction: row;
    gap: 1rem;
    justify-content: center;
  }
}
</style>