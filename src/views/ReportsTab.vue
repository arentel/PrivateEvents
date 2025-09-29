<template>
  <ion-page>
    <ion-content :fullscreen="true" class="reports-content">
      <div class="reports-container">
        
        <!-- Header -->
        <div class="page-header animate-fade-in-down">
          <div class="header-content">
            <h1>📊 Reportes y Estadísticas</h1>
            <p>Análisis detallado de tus eventos</p>
          </div>
          <ion-button 
            fill="clear"
            @click="refreshData"
            class="refresh-btn"
          >
            <ion-icon :icon="refreshOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- Selector de Evento -->
        <div class="event-selector-section animate-fade-in-up delay-100">
          <div class="section-header">
            <h3>Evento Seleccionado</h3>
            <ion-button 
              fill="outline"
              size="small"
              @click="showEventSelectorModal = true"
              class="change-event-btn"
            >
              <ion-icon :icon="swapHorizontalOutline" slot="start"></ion-icon>
              Cambiar
            </ion-button>
          </div>

          <div v-if="currentEvent" class="current-event-card">
            <div class="event-badge">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <div class="event-info">
              <h4>{{ currentEvent.name }}</h4>
              <div class="event-date">
                <ion-icon :icon="timeOutline"></ion-icon>
                <span>{{ formatDate(currentEvent.date) }}</span>
              </div>
              <div class="event-location" v-if="currentEvent.location">
                <ion-icon :icon="locationOutline"></ion-icon>
                <span>{{ currentEvent.location }}</span>
              </div>
            </div>
          </div>

          <div v-else class="no-event-selected">
            <ion-icon :icon="alertCircleOutline"></ion-icon>
            <p>No hay evento seleccionado</p>
            <ion-button @click="showEventSelectorModal = true" size="small">
              Seleccionar Evento
            </ion-button>
          </div>
        </div>

        <!-- ✅ SKELETON LOADER mientras carga -->
        <div v-if="loading" class="animate-fade-in">
          <SkeletonLoader type="generic" :count="6" />
        </div>

        <!-- Estadísticas Principales -->
        <div v-else-if="currentEvent" class="stats-container animate-fade-in-up delay-200">
          
          <!-- KPIs Principales -->
          <div class="kpi-grid">
            <div class="kpi-card kpi-total">
              <div class="kpi-icon">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ stats.totalGuests }}</div>
                <div class="kpi-label">Total Invitados</div>
              </div>
            </div>

            <div class="kpi-card kpi-attended">
              <div class="kpi-icon">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ stats.attended }}</div>
                <div class="kpi-label">Asistieron</div>
                <div class="kpi-percentage">{{ stats.attendanceRate }}%</div>
              </div>
            </div>

            <div class="kpi-card kpi-pending">
              <div class="kpi-icon">
                <ion-icon :icon="hourglassOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ stats.pending }}</div>
                <div class="kpi-label">Sin Asistir</div>
              </div>
            </div>

            <div class="kpi-card kpi-sent">
              <div class="kpi-icon">
                <ion-icon :icon="mailOutline"></ion-icon>
              </div>
              <div class="kpi-content">
                <div class="kpi-value">{{ stats.qrSent }}</div>
                <div class="kpi-label">QR Enviados</div>
                <div class="kpi-percentage">{{ stats.qrSentRate }}%</div>
              </div>
            </div>
          </div>

          <!-- Gráfico de Barras - Asistencia -->
          <div class="chart-section">
            <div class="section-header">
              <h3>📈 Resumen de Asistencia</h3>
            </div>
            <div class="chart-card">
              <div class="bar-chart">
                <div class="bar-group">
                  <div class="bar-container">
                    <div 
                      class="bar bar-total"
                      :style="{ height: '100%' }"
                    >
                      <span class="bar-value">{{ stats.totalGuests }}</span>
                    </div>
                  </div>
                  <div class="bar-label">Total</div>
                </div>

                <div class="bar-group">
                  <div class="bar-container">
                    <div 
                      class="bar bar-attended"
                      :style="{ height: getBarHeight(stats.attended, stats.totalGuests) }"
                    >
                      <span class="bar-value">{{ stats.attended }}</span>
                    </div>
                  </div>
                  <div class="bar-label">Asistieron</div>
                </div>

                <div class="bar-group">
                  <div class="bar-container">
                    <div 
                      class="bar bar-pending"
                      :style="{ height: getBarHeight(stats.pending, stats.totalGuests) }"
                    >
                      <span class="bar-value">{{ stats.pending }}</span>
                    </div>
                  </div>
                  <div class="bar-label">Pendientes</div>
                </div>

                <div class="bar-group">
                  <div class="bar-container">
                    <div 
                      class="bar bar-sent"
                      :style="{ height: getBarHeight(stats.qrSent, stats.totalGuests) }"
                    >
                      <span class="bar-value">{{ stats.qrSent }}</span>
                    </div>
                  </div>
                  <div class="bar-label">QR Enviados</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Gráfico Circular - Distribución -->
          <div class="chart-section">
            <div class="section-header">
              <h3>🎯 Distribución de Estados</h3>
            </div>
            <div class="chart-card">
              <div class="pie-chart-container">
                <div class="pie-chart">
                  <svg viewBox="0 0 200 200" class="pie-svg">
                    <!-- Círculo base -->
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#f3f4f6" stroke-width="40"/>
                    
                    <!-- Asistieron (verde) -->
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#10b981" 
                      stroke-width="40"
                      :stroke-dasharray="`${getPieSegment(stats.attended, stats.totalGuests)} 502`"
                      stroke-dashoffset="125.5"
                      transform="rotate(-90 100 100)"
                      class="pie-segment"
                    />
                    
                    <!-- Pendientes (amarillo) -->
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      stroke="#fbbf24" 
                      stroke-width="40"
                      :stroke-dasharray="`${getPieSegment(stats.pending, stats.totalGuests)} 502`"
                      :stroke-dashoffset="125.5 - getPieSegment(stats.attended, stats.totalGuests)"
                      transform="rotate(-90 100 100)"
                      class="pie-segment"
                    />
                    
                    <!-- Centro con porcentaje -->
                    <text x="100" y="95" text-anchor="middle" class="pie-percentage">
                      {{ stats.attendanceRate }}%
                    </text>
                    <text x="100" y="115" text-anchor="middle" class="pie-label">
                      Asistencia
                    </text>
                  </svg>
                </div>

                <div class="pie-legend">
                  <div class="legend-item">
                    <div class="legend-color" style="background: #10b981;"></div>
                    <span>Asistieron: {{ stats.attended }} ({{ stats.attendanceRate }}%)</span>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color" style="background: #fbbf24;"></div>
                    <span>Pendientes: {{ stats.pending }} ({{ 100 - stats.attendanceRate }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Lista de Asistencias Recientes -->
          <div class="recent-section">
            <div class="section-header">
              <h3>🕐 Asistencias Recientes</h3>
              <span class="badge-count">{{ recentAttendances.length }}</span>
            </div>

            <div v-if="recentAttendances.length > 0" class="recent-list">
              <div 
                v-for="guest in recentAttendances" 
                :key="guest.id"
                class="recent-item"
              >
                <div class="recent-avatar">
                  {{ getInitials(guest.name) }}
                </div>
                <div class="recent-info">
                  <h4>{{ guest.name }}</h4>
                  <p>{{ guest.email }}</p>
                </div>
                <div class="recent-time">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  <span>{{ formatTimeAgo(guest.entered_at) }}</span>
                </div>
              </div>
            </div>

            <div v-else class="empty-recent">
              <ion-icon :icon="hourglassOutline"></ion-icon>
              <p>No hay asistencias registradas aún</p>
            </div>
          </div>

          <!-- Top Invitados por Mesa/Grupo -->
          <div v-if="guestsByTable.length > 0" class="tables-section">
            <div class="section-header">
              <h3>📋 Distribución por Mesa</h3>
            </div>

            <div class="tables-grid">
              <div 
                v-for="table in guestsByTable" 
                :key="table.name"
                class="table-card"
              >
                <div class="table-header">
                  <div class="table-icon">
                    <ion-icon :icon="restaurantOutline"></ion-icon>
                  </div>
                  <h4>{{ table.name }}</h4>
                </div>
                <div class="table-stats">
                  <div class="table-stat">
                    <span class="stat-label">Total:</span>
                    <span class="stat-value">{{ table.total }}</span>
                  </div>
                  <div class="table-stat">
                    <span class="stat-label">Asistieron:</span>
                    <span class="stat-value success">{{ table.attended }}</span>
                  </div>
                  <div class="table-progress">
                    <div 
                      class="progress-bar"
                      :style="{ width: getPercentage(table.attended, table.total) + '%' }"
                    ></div>
                  </div>
                  <div class="table-percentage">
                    {{ getPercentage(table.attended, table.total) }}% asistencia
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones de Exportación -->
          <div class="export-section">
            <div class="section-header">
              <h3>📥 Exportar Datos</h3>
            </div>

            <div class="export-buttons">
              <ion-button 
                expand="block"
                @click="exportToCSV"
                class="export-btn"
              >
                <ion-icon :icon="documentTextOutline" slot="start"></ion-icon>
                Exportar a CSV
              </ion-button>

              <ion-button 
                expand="block"
                fill="outline"
                @click="printReport"
                class="export-btn"
              >
                <ion-icon :icon="printOutline" slot="start"></ion-icon>
                Imprimir Reporte
              </ion-button>

              <ion-button 
                expand="block"
                fill="outline"
                @click="shareReport"
                class="export-btn"
              >
                <ion-icon :icon="shareOutline" slot="start"></ion-icon>
                Compartir
              </ion-button>
            </div>
          </div>

        </div>

        <!-- Estado sin evento -->
        <div v-else class="empty-state animate-fade-in">
          <div class="empty-icon">
            <ion-icon :icon="barChartOutline"></ion-icon>
          </div>
          <h3>Selecciona un Evento</h3>
          <p>Elige un evento para ver sus estadísticas y reportes detallados</p>
          <ion-button @click="showEventSelectorModal = true">
            <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
            Seleccionar Evento
          </ion-button>
        </div>

      </div>

      <!-- ========================================
           MODAL: SELECTOR DE EVENTO
           ======================================== -->
      <div v-if="showEventSelectorModal" class="custom-modal-overlay" @click="showEventSelectorModal = false">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Seleccionar Evento</h2>
            <button class="close-modal-btn" @click="closeEventSelector">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <div v-if="events.length > 0" class="events-list">
              <div 
                v-for="event in events" 
                :key="event.id"
                class="event-option"
                :class="{ 'selected': currentEvent?.id === event.id }"
                @click="selectEventForReport(event)"
              >
                <div class="event-option-icon">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                </div>
                <div class="event-option-info">
                  <h4>{{ event.name }}</h4>
                  <p>{{ formatDate(event.date) }}</p>
                </div>
                <ion-icon 
                  v-if="currentEvent?.id === event.id"
                  :icon="checkmarkCircleOutline" 
                  class="check-icon"
                  color="success"
                ></ion-icon>
              </div>
            </div>

            <div v-else class="no-events">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              <p>No hay eventos disponibles</p>
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
  toastController,
  actionSheetController
} from '@ionic/vue'
import {
  calendarOutline,
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  hourglassOutline,
  mailOutline,
  swapHorizontalOutline,
  alertCircleOutline,
  closeOutline,
  refreshOutline,
  documentTextOutline,
  printOutline,
  shareOutline,
  barChartOutline,
  restaurantOutline
} from 'ionicons/icons'
// @ts-ignore
import eventsStore from '@/stores/events'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useHaptics } from '@/composables/useHaptics'

// ========================================
// COMPOSABLES
// ========================================
const { vibrate } = useHaptics()

// ========================================
// ESTADOS
// ========================================
const loading = ref(true)
const showEventSelectorModal = ref(false)

// ========================================
// COMPUTED PROPERTIES
// ========================================
const events = computed(() => eventsStore.events)
const currentEvent = computed(() => eventsStore.currentEvent)
const currentEventGuests = computed(() => eventsStore.currentEventGuests)

// Estadísticas calculadas
const stats = computed(() => {
  if (!currentEvent.value) {
    return {
      totalGuests: 0,
      attended: 0,
      pending: 0,
      qrSent: 0,
      attendanceRate: 0,
      qrSentRate: 0
    }
  }

  const guests = currentEventGuests.value
  const totalGuests = guests.length
  const attended = guests.filter((g: any) => g.has_entered).length
  const pending = totalGuests - attended
  const qrSent = guests.filter((g: any) => g.qr_sent).length
  
  const attendanceRate = totalGuests > 0 ? Math.round((attended / totalGuests) * 100) : 0
  const qrSentRate = totalGuests > 0 ? Math.round((qrSent / totalGuests) * 100) : 0

  return {
    totalGuests,
    attended,
    pending,
    qrSent,
    attendanceRate,
    qrSentRate
  }
})

// Asistencias recientes (últimas 10)
const recentAttendances = computed(() => {
  if (!currentEvent.value) return []

  return currentEventGuests.value
    .filter((g: any) => g.has_entered && g.entered_at)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.entered_at).getTime()
      const dateB = new Date(b.entered_at).getTime()
      return dateB - dateA
    })
    .slice(0, 10)
})

// Invitados agrupados por mesa
const guestsByTable = computed(() => {
  if (!currentEvent.value) return []

  const guests = currentEventGuests.value
  const tableMap = new Map()

  guests.forEach((guest: any) => {
    const tableName = guest.table_number || 'Sin mesa'
    
    if (!tableMap.has(tableName)) {
      tableMap.set(tableName, {
        name: tableName,
        total: 0,
        attended: 0
      })
    }

    const table = tableMap.get(tableName)
    table.total++
    if (guest.has_entered) {
      table.attended++
    }
  })

  return Array.from(tableMap.values())
    .sort((a, b) => b.total - a.total)
})

// ========================================
// FUNCIONES DE CÁLCULO
// ========================================
const getBarHeight = (value: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${Math.max(percentage, 5)}%` // Mínimo 5% para visibilidad
}

const getPieSegment = (value: number, total: number): number => {
  if (total === 0) return 0
  const circumference = 2 * Math.PI * 80 // radio = 80
  return (value / total) * circumference
}

const getPercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const getInitials = (name: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ========================================
// FUNCIONES DE FORMATO
// ========================================
const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

const formatTimeAgo = (dateString: string | undefined): string => {
  if (!dateString) return 'Sin registro'
  
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays === 1) return 'Ayer'
    if (diffDays < 7) return `Hace ${diffDays} días`
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    })
  } catch {
    return 'Fecha inválida'
  }
}

// ========================================
// FUNCIONES DE CARGA
// ========================================
const loadData = async () => {
  loading.value = true

  try {
    await eventsStore.init()
    
    console.log('✅ Datos de reportes cargados')
    console.log('Evento actual:', currentEvent.value?.name)
    console.log('Total invitados:', stats.value.totalGuests)
    
  } catch (error) {
    console.error('Error cargando datos:', error)
    await vibrate('error')
    showToast('Error al cargar datos', 'danger')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await vibrate('light')
  await loadData()
  showToast('Datos actualizados', 'success')
}

// ========================================
// FUNCIONES DE SELECCIÓN DE EVENTO
// ========================================
const selectEventForReport = async (event: any) => {
  await vibrate('selection')
  eventsStore.setCurrentEvent(event.id)
  showEventSelectorModal.value = false
  showToast(`Mostrando reportes de "${event.name}"`, 'success')
  await loadData()
}

const closeEventSelector = async () => {
  await vibrate('light')
  showEventSelectorModal.value = false
}

// ========================================
// FUNCIONES DE EXPORTACIÓN
// ========================================
const exportToCSV = async () => {
  await vibrate('medium')

  try {
    if (!currentEvent.value) {
      showToast('Selecciona un evento primero', 'warning')
      return
    }

    const guests = currentEventGuests.value
    
    // Crear encabezados CSV
    const headers = ['Nombre', 'Email', 'Teléfono', 'Mesa', 'QR Enviado', 'Ha Asistido', 'Fecha de Entrada']
    
    // Crear filas CSV
    const rows = guests.map((guest: any) => [
      guest.name,
      guest.email || '',
      guest.phone || '',
      guest.table_number || '',
      guest.qr_sent ? 'Sí' : 'No',
      guest.has_entered ? 'Sí' : 'No',
      guest.entered_at ? formatDate(guest.entered_at) : ''
    ])

    // Combinar todo
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Crear blob y descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_${currentEvent.value.name}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    await vibrate('success')
    showToast('Reporte exportado correctamente', 'success')

  } catch (error) {
    console.error('Error exportando CSV:', error)
    await vibrate('error')
    showToast('Error al exportar reporte', 'danger')
  }
}

const printReport = async () => {
  await vibrate('light')
  
  try {
    window.print()
    showToast('Preparando impresión...', 'primary')
  } catch (error) {
    console.error('Error al imprimir:', error)
    showToast('Error al imprimir', 'danger')
  }
}

const shareReport = async () => {
  await vibrate('light')

  const actionSheet = await actionSheetController.create({
    header: 'Compartir Reporte',
    buttons: [
      {
        text: 'Copiar resumen',
        icon: documentTextOutline,
        handler: async () => {
          await copyReportSummary()
        }
      },
      {
        text: 'Exportar y compartir CSV',
        icon: shareOutline,
        handler: async () => {
          await exportToCSV()
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel',
        icon: closeOutline
      }
    ]
  })

  await actionSheet.present()
}

const copyReportSummary = async () => {
  try {
    if (!currentEvent.value) return

    const summary = `
📊 Reporte: ${currentEvent.value.name}
📅 Fecha: ${formatDate(currentEvent.value.date)}

📈 Estadísticas:
👥 Total Invitados: ${stats.value.totalGuests}
✅ Asistieron: ${stats.value.attended} (${stats.value.attendanceRate}%)
⏳ Pendientes: ${stats.value.pending}
📧 QR Enviados: ${stats.value.qrSent} (${stats.value.qrSentRate}%)
    `.trim()

    await navigator.clipboard.writeText(summary)
    await vibrate('success')
    showToast('Resumen copiado al portapapeles', 'success')
  } catch (error) {
    console.error('Error copiando resumen:', error)
    showToast('Error al copiar resumen', 'danger')
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

// ========================================
// WATCHERS
// ========================================
watch(currentEvent, async (newEvent) => {
  if (newEvent) {
    console.log('📊 Evento cambiado, recargando estadísticas:', newEvent.name)
    await loadData()
  }
})

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('📊 ReportsTab montado')
  await loadData()
})

onActivated(async () => {
  console.log('🔄 ReportsTab activado - refrescando datos')
  await loadData()
})
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.reports-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.reports-content {
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
   SELECTOR DE EVENTO
   ======================================== */
.event-selector-section {
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

.badge-count {
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.change-event-btn {
  --border-radius: 8px;
  font-weight: 600;
  --border-width: 2px;
  --border-color: #667eea;
  --color: #667eea;
}

.current-event-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.current-event-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.event-badge {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(13, 27, 42, 0.3);
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
  word-wrap: break-word;
}

.event-date,
.event-location {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.event-date ion-icon,
.event-location ion-icon {
  color: #667eea;
  font-size: 1rem;
}

.no-event-selected {
  text-align: center;
  padding: 40px 20px;
  background: #fef3c7;
  border: 2px dashed #fbbf24;
  border-radius: 12px;
}

.no-event-selected ion-icon {
  font-size: 3rem;
  color: #f59e0b;
  margin-bottom: 12px;
}

.no-event-selected p {
  margin: 0 0 16px 0;
  color: #92400e;
  font-weight: 500;
}

/* ========================================
   CONTENEDOR DE ESTADÍSTICAS
   ======================================== */
.stats-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========================================
   KPI CARDS
   ======================================== */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  position: relative;
  overflow: hidden;
}

.kpi-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  opacity: 0.1;
  transform: translate(30%, -30%);
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.kpi-total {
  border-left-color: #667eea;
}

.kpi-total::before {
  background: #667eea;
}

.kpi-total .kpi-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-attended {
  border-left-color: #10b981;
}

.kpi-attended::before {
  background: #10b981;
}

.kpi-attended .kpi-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.kpi-pending {
  border-left-color: #fbbf24;
}

.kpi-pending::before {
  background: #fbbf24;
}

.kpi-pending .kpi-icon {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.kpi-sent {
  border-left-color: #0ea5e9;
}

.kpi-sent::before {
  background: #0ea5e9;
}

.kpi-sent .kpi-icon {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.8rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.kpi-percentage {
  font-size: 1.2rem;
  font-weight: 700;
  color: #10b981;
  margin-top: 8px;
}

/* ========================================
   SECCIONES DE GRÁFICOS
   ======================================== */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.chart-card {
  margin-top: 20px;
}

/* ========================================
   GRÁFICO DE BARRAS
   ======================================== */
.bar-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  gap: 20px;
  padding: 40px 20px 20px;
  min-height: 300px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.bar-container {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
}

.bar {
  width: 80%;
  max-width: 80px;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: growBar 1s ease-out;
}

@keyframes growBar {
  from {
    height: 0 !important;
  }
}

.bar-total {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.bar-attended {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}

.bar-pending {
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
}

.bar-sent {
  background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
}

.bar-value {
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.bar-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

/* ========================================
   GRÁFICO CIRCULAR
   ======================================== */
.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 20px;
}

.pie-chart {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
}

.pie-svg {
  width: 100%;
  height: 100%;
  transform: rotate(0deg);
}

.pie-segment {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.pie-percentage {
  font-size: 2.5rem;
  font-weight: 700;
  fill: #1f2937;
}

.pie-label {
  font-size: 1rem;
  font-weight: 500;
  fill: #6b7280;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
}

.legend-item span {
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 500;
}

/* ========================================
   ASISTENCIAS RECIENTES
   ======================================== */
.recent-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #10b981;
  transition: all 0.3s ease;
}

.recent-item:hover {
  background: #f0fdf4;
  transform: translateX(4px);
}

.recent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.recent-info {
  flex: 1;
  min-width: 0;
}

.recent-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  word-wrap: break-word;
}

.recent-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  word-wrap: break-word;
}

.recent-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #059669;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.recent-time ion-icon {
  font-size: 1rem;
}

.empty-recent {
  text-align: center;
  padding: 60px 20px;
}

.empty-recent ion-icon {
  font-size: 4rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.empty-recent p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

/* ========================================
   DISTRIBUCIÓN POR MESA
   ======================================== */
.tables-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.table-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.table-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.table-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
}

.table-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.table-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  flex: 1;
}

.table-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.success {
  color: #10b981;
}

.table-progress {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

.table-percentage {
  font-size: 0.85rem;
  color: #059669;
  font-weight: 600;
  text-align: center;
  margin-top: 4px;
}

/* ========================================
   EXPORTACIÓN
   ======================================== */
.export-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.export-buttons {
  display: grid;
  gap: 12px;
  margin-top: 20px;
}

.export-btn {
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

/* ========================================
   ESTADO VACÍO
   ======================================== */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 5rem;
  color: #9ca3af;
  margin-bottom: 24px;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 32px 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

/* ========================================
   MODALES
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

.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-option:hover {
  background: #f1f3f4;
  border-color: #667eea;
  transform: translateX(4px);
}

.event-option.selected {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: #667eea;
}

.event-option-icon {
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
}

.event-option-info {
  flex: 1;
  min-width: 0;
}

.event-option-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
  word-wrap: break-word;
}

.event-option-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
  word-wrap: break-word;
}

.check-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.no-events {
  text-align: center;
  padding: 60px 20px;
}

.no-events ion-icon {
  font-size: 4rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.no-events p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .reports-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
  }

  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .kpi-card {
    padding: 16px;
  }

  .kpi-icon {
    width: 48px;
    height: 48px;
    font-size: 1.4rem;
  }

  .kpi-value {
    font-size: 2rem;
  }

  .bar-chart {
    padding: 20px 10px 10px;
    min-height: 250px;
  }

  .bar-container {
    height: 150px;
  }

  .pie-chart-container {
    gap: 24px;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .export-buttons {
    grid-template-columns: 1fr;
  }

  .custom-modal {
    max-width: 100%;
    margin: 0;
    border-radius: 16px 16px 0 0;
    max-height: 95vh;
  }
}

@media (max-width: 480px) {
  .reports-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .kpi-value {
    font-size: 1.8rem;
  }

  .kpi-label {
    font-size: 0.8rem;
  }

  .bar-value {
    font-size: 1rem;
  }

  .bar-label {
    font-size: 0.8rem;
  }

  .recent-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .recent-info h4 {
    font-size: 0.95rem;
  }

  .recent-info p {
    font-size: 0.85rem;
  }

  .recent-time {
    flex-direction: column;
    gap: 2px;
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
   IMPRESIÓN
   ======================================== */
@media print {
  .page-header,
  .event-selector-section,
  .export-section,
  .refresh-btn,
  .change-event-btn {
    display: none !important;
  }

  .reports-container {
    padding: 0;
  }

  .chart-section,
  .recent-section,
  .tables-section {
    break-inside: avoid;
    page-break-inside: avoid;
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
.event-option,
.recent-item,
.table-card,
.close-modal-btn {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

@media (hover: none) {
  .event-option:active {
    transform: scale(0.98);
  }

  .kpi-card:active {
    transform: scale(0.98);
  }
}
</style>