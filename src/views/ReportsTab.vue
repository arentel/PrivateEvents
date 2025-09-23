<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>📊 Reportes</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Estadísticas principales -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Resumen General</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ totalGuests }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </ion-col>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ attendedGuests }}</div>
                <div class="stat-label">Asistieron</div>
              </div>
            </ion-col>
          </ion-row>
          
          <ion-row>
            <ion-col size="6">
              <div class="stat-card">
                <div class="stat-number">{{ qrsSent }}</div>
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
              {{ attendedGuests }} de {{ totalGuests }} invitados asistieron
            </p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Generación de PDFs -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Generar Reportes PDF</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            @click="generateAttendeesPDF"
            :disabled="attendedGuests === 0 || isGeneratingPDF"
            color="success"
          >
            <ion-icon name="document-text-outline" slot="start"></ion-icon>
            {{ isGeneratingPDF ? 'Generando...' : `PDF Solo Asistentes (${attendedGuests})` }}
          </ion-button>
          
          <ion-button 
            expand="block" 
            @click="generateFullReportPDF"
            :disabled="totalGuests === 0 || isGeneratingPDF"
            color="primary"
          >
            <ion-icon name="analytics-outline" slot="start"></ion-icon>
            {{ isGeneratingPDF ? 'Generando...' : 'PDF Reporte Completo' }}
          </ion-button>
          
          <div v-if="lastPDFGenerated" class="pdf-status">
            <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
            <span>Último PDF generado: {{ formatDate(lastPDFGenerated) }}</span>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Filtros y vista de datos -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Ver Datos</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-segment v-model="selectedView">
            <ion-segment-button value="attendees">
              <ion-label>Asistentes ({{ attendedGuests }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="all">
              <ion-label>Todos ({{ totalGuests }})</ion-label>
            </ion-segment-button>
            <ion-segment-button value="pending">
              <ion-label>Pendientes ({{ pendingGuests }})</ion-label>
            </ion-segment-button>
          </ion-segment>
        </ion-card-content>
      </ion-card>

      <!-- Lista de invitados según filtro -->
      <ion-card>
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
                <p v-if="guest.qr_sent_at" class="detail">
                  QR enviado: {{ formatDate(guest.qr_sent_at) }}
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
                  ENTRÓ
                </ion-chip>
                <ion-chip 
                  v-else-if="guest.qr_sent" 
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
      <ion-card v-if="attendedGuests > 0">
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

      <!-- Botones de utilidad -->
      <ion-card>
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
          
          <ion-button 
            expand="block" 
            color="danger"
            fill="outline"
            @click="resetAllData"
            v-if="totalGuests > 0"
          >
            <ion-icon name="trash-outline" slot="start"></ion-icon>
            Resetear Todos los Datos
          </ion-button>
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
  IonButton, IonIcon, IonProgressBar, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonChip, IonToast, IonRow, IonCol
} from '@ionic/vue'
import {
  documentTextOutline, analyticsOutline, checkmarkCircleOutline,
  downloadOutline, refreshOutline, trashOutline
} from 'ionicons/icons'
import { supabase } from '../services/supabase'
import { generatePDF } from '../services/pdf'

// Estado reactivo
const guests = ref([])
const selectedView = ref('attendees')
const isGeneratingPDF = ref(false)
const lastPDFGenerated = ref(null)

const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties para estadísticas
const totalGuests = computed(() => guests.value.length)
const attendedGuests = computed(() => guests.value.filter(g => g.has_entered).length)
const qrsSent = computed(() => guests.value.filter(g => g.qr_sent).length)
const pendingGuests = computed(() => guests.value.filter(g => !g.qr_sent).length)
const attendanceRate = computed(() => 
  totalGuests.value > 0 ? Math.round((attendedGuests.value / totalGuests.value) * 100) : 0
)

// Computed property para lista actual según filtro
const currentList = computed(() => {
  switch (selectedView.value) {
    case 'attendees':
      return guests.value
        .filter(g => g.has_entered)
        .sort((a, b) => new Date(a.entered_at) - new Date(b.entered_at))
    case 'all':
      return guests.value
        .sort((a, b) => a.name.localeCompare(b.name))
    case 'pending':
      return guests.value
        .filter(g => !g.qr_sent)
        .sort((a, b) => a.name.localeCompare(b.name))
    default:
      return []
  }
})

// Computed property para estadísticas por hora
const hourlyStats = computed(() => {
  const attendedGuestsList = guests.value.filter(g => g.has_entered)
  if (attendedGuestsList.length === 0) return []
  
  const hourCounts = {}
  
  attendedGuestsList.forEach(guest => {
    const hour = new Date(guest.entered_at).getHours()
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

// Función para mostrar toast
const showToast = (message, color = 'success') => {
  toast.value = {
    isOpen: true,
    message,
    color
  }
}

// Función para cargar datos
const loadData = async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    guests.value = data || []
  } catch (error) {
    console.error('Error loading data:', error)
    showToast('Error al cargar datos', 'danger')
  }
}

// Función para refrescar datos
const refreshData = async () => {
  await loadData()
  showToast('Datos actualizados')
}

// Función para generar PDF de asistentes
const generateAttendeesPDF = async () => {
  if (attendedGuests.value === 0) {
    showToast('No hay asistentes para generar PDF', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    const attendeesList = guests.value.filter(g => g.has_entered)
    const eventName = attendeesList[0]?.event_name || 'Evento'
    
    await generatePDF({
      type: 'attendees',
      eventName,
      attendees: attendeesList,
      stats: {
        total: totalGuests.value,
        attended: attendedGuests.value,
        rate: attendanceRate.value
      }
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('✅ PDF de asistentes generado')
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    showToast('Error al generar PDF', 'danger')
  } finally {
    isGeneratingPDF.value = false
  }
}

// Función para generar PDF de reporte completo
const generateFullReportPDF = async () => {
  if (totalGuests.value === 0) {
    showToast('No hay datos para generar reporte', 'warning')
    return
  }
  
  isGeneratingPDF.value = true
  
  try {
    const eventName = guests.value[0]?.event_name || 'Evento'
    
    await generatePDF({
      type: 'full',
      eventName,
      guests: guests.value,
      attendees: guests.value.filter(g => g.has_entered),
      stats: {
        total: totalGuests.value,
        attended: attendedGuests.value,
        qrsSent: qrsSent.value,
        pending: pendingGuests.value,
        rate: attendanceRate.value
      },
      hourlyStats: hourlyStats.value
    })
    
    lastPDFGenerated.value = new Date().toISOString()
    showToast('✅ Reporte completo generado')
    
  } catch (error) {
    console.error('Error generating full report:', error)
    showToast('Error al generar reporte', 'danger')
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
  
  link.href = url
  link.download = `${getListTitle().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  window.URL.revokeObjectURL(url)
  showToast('Lista exportada como CSV')
}

// Función para generar CSV
const generateCSV = (data) => {
  const headers = ['Nombre', 'Email', 'QR Enviado', 'Ha Entrado', 'Fecha QR', 'Fecha Entrada']
  const rows = data.map(guest => [
    guest.name,
    guest.email,
    guest.qr_sent ? 'Sí' : 'No',
    guest.has_entered ? 'Sí' : 'No',
    guest.qr_sent_at ? formatDate(guest.qr_sent_at) : '',
    guest.entered_at ? formatDate(guest.entered_at) : ''
  ])
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

// Función para resetear todos los datos
const resetAllData = async () => {
  const confirmation = confirm(
    '⚠️ ATENCIÓN: Esta acción eliminará TODOS los datos de invitados, QRs y entradas.\n\n' +
    '¿Estás completamente seguro? Esta acción NO se puede deshacer.'
  )
  
  if (!confirmation) return
  
  const doubleConfirmation = confirm(
    '¿Realmente quieres eliminar TODOS los datos?\n\n' +
    'Esto incluye:\n' +
    '• Todos los invitados\n' +
    '• Todos los QRs enviados\n' +
    '• Todas las entradas registradas\n' +
    '• Todas las estadísticas'
  )
  
  if (!doubleConfirmation) return
  
  try {
    const { error } = await supabase
      .from('guests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos
    
    if (error) throw error
    
    guests.value = []
    lastPDFGenerated.value = null
    showToast('✅ Todos los datos han sido eliminados')
    
  } catch (error) {
    console.error('Error resetting data:', error)
    showToast('Error al resetear datos', 'danger')
  }
}

// Funciones de utilidad
const getListTitle = () => {
  switch (selectedView.value) {
    case 'attendees':
      return `Asistentes Confirmados (${attendedGuests.value})`
    case 'all':
      return `Todos los Invitados (${totalGuests.value})`
    case 'pending':
      return `Sin QR Enviado (${pendingGuests.value})`
    default:
      return 'Lista'
  }
}

const getEmptyMessage = () => {
  switch (selectedView.value) {
    case 'attendees':
      return 'No hay asistentes registrados aún'
    case 'all':
      return 'No hay invitados en la lista'
    case 'pending':
      return 'Todos los invitados tienen QR enviado'
    default:
      return 'No hay datos'
  }
}

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
  loadData()
})
</script>

<style scoped>
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
</style>