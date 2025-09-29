<template>
  <ion-page>
    <ion-content :fullscreen="true" class="send-content">
      <div class="send-container">
        
        <!-- Header -->
        <div class="page-header animate-fade-in-down">
          <div class="header-content">
            <h1>Enviar Invitaciones</h1>
            <p>Envía códigos QR por email a tus invitados</p>
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
        <div class="event-selector-section animate-fade-in">
          <div class="section-header">
            <h3>Evento Activo</h3>
            <ion-button 
              fill="outline" 
              size="small"
              @click="showEventModal = true"
              class="change-event-btn"
            >
              <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
              Cambiar Evento
            </ion-button>
          </div>
          
          <div v-if="selectedEvent" class="current-event-card">
            <div class="event-badge">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <div class="event-info">
              <h4>{{ selectedEvent.name }}</h4>
              <p class="event-date">
                <ion-icon :icon="timeOutline"></ion-icon>
                {{ formatDate(selectedEvent.date) }}
              </p>
              <p class="event-location" v-if="selectedEvent.location">
                <ion-icon :icon="locationOutline"></ion-icon>
                {{ selectedEvent.location }}
              </p>
            </div>
          </div>
        </div>

        <!-- Estadísticas de Envío -->
        <div class="stats-section animate-fade-in-up delay-100">
          <div class="stats-grid">
            <div class="stat-card stat-total">
              <div class="stat-icon">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">Total Invitados</div>
              </div>
            </div>

            <div class="stat-card stat-sent">
              <div class="stat-icon">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.sent }}</div>
                <div class="stat-label">QR Enviados</div>
              </div>
            </div>

            <div class="stat-card stat-pending">
              <div class="stat-icon">
                <ion-icon :icon="mailOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">Pendientes</div>
              </div>
            </div>

            <div class="stat-card stat-progress">
              <div class="stat-icon">
                <ion-icon :icon="statsChartOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ progressPercentage }}%</div>
                <div class="stat-label">Progreso</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Barra de búsqueda y acciones -->
        <div class="actions-section animate-fade-in-up delay-200">
          <div class="search-bar">
            <ion-searchbar
              v-model="searchTerm"
              @ionInput="handleSearch"
              placeholder="Buscar invitados para enviar..."
              :debounce="300"
              animated
            ></ion-searchbar>
          </div>

          <div class="action-buttons">
            <ion-button 
              expand="block"
              @click="sendToAll"
              :disabled="sendingAll || pendingGuests.length === 0"
              class="send-all-btn"
            >
              <ion-spinner v-if="sendingAll" name="crescent"></ion-spinner>
              <ion-icon v-else :icon="sendOutline" slot="start"></ion-icon>
              {{ sendingAll ? 'Enviando...' : `Enviar a Todos (${pendingGuests.length})` }}
            </ion-button>

            <ion-button 
              expand="block"
              fill="outline"
              @click="sendToSelected"
              :disabled="selectedGuests.length === 0 || sendingSelected"
              class="send-selected-btn"
            >
              <ion-spinner v-if="sendingSelected" name="crescent"></ion-spinner>
              <ion-icon v-else :icon="checkmarkDoneOutline" slot="start"></ion-icon>
              {{ sendingSelected ? 'Enviando...' : `Enviar Seleccionados (${selectedGuests.length})` }}
            </ion-button>
          </div>

          <!-- Progreso de envío -->
          <div v-if="sendingProgress > 0 && sendingProgress < 100" class="sending-progress">
            <div class="progress-header">
              <span>Enviando invitaciones...</span>
              <span class="progress-text">{{ sendingProgress }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: sendingProgress + '%' }"></div>
            </div>
            <p class="progress-detail">{{ currentSendingIndex }} de {{ totalToSend }} enviados</p>
          </div>
        </div>

        <!-- ✅ SKELETON LOADER mientras carga -->
        <SkeletonLoader 
          v-if="loading" 
          type="guest-list" 
          :count="5"
          class="animate-fade-in" 
        />

        <!-- Lista de Invitados -->
        <div v-else-if="filteredGuests.length > 0" class="guests-list-section animate-fade-in-up delay-300">
          <div class="section-header">
            <h3>Invitados ({{ filteredGuests.length }})</h3>
            
            <div class="filter-chips">
              <ion-chip 
                :color="filterStatus === 'all' ? 'primary' : 'medium'"
                @click="filterStatus = 'all'"
              >
                <ion-label>Todos</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'pending' ? 'warning' : 'medium'"
                @click="filterStatus = 'pending'"
              >
                <ion-label>Pendientes</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'sent' ? 'success' : 'medium'"
                @click="filterStatus = 'sent'"
              >
                <ion-label>Enviados</ion-label>
              </ion-chip>
            </div>
          </div>

          <!-- Seleccionar todos -->
          <div class="select-all-row">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                :checked="allFilteredSelected"
                @change="toggleSelectAll"
              />
              <span class="checkbox-label">
                Seleccionar todos los filtrados ({{ filteredGuests.length }})
              </span>
            </label>
            
            <ion-button 
              v-if="selectedGuests.length > 0"
              fill="clear"
              size="small"
              @click="clearSelection"
              class="clear-selection-btn"
            >
              Limpiar selección
            </ion-button>
          </div>

          <div class="guests-list">
            <div 
              v-for="guest in paginatedGuests" 
              :key="guest.id"
              class="guest-item"
              :class="{
                'guest-sent': guest.qr_sent,
                'guest-selected': selectedGuests.includes(guest.id)
              }"
            >
              <label class="guest-checkbox">
                <input 
                  type="checkbox" 
                  :checked="selectedGuests.includes(guest.id)"
                  @change="toggleGuestSelection(guest.id)"
                  :disabled="guest.qr_sent"
                />
              </label>

              <div class="guest-avatar">
                {{ guest.name.charAt(0).toUpperCase() }}
              </div>

              <div class="guest-info">
                <h4>{{ guest.name }}</h4>
                <p class="guest-email">
                  <ion-icon :icon="mailOutline"></ion-icon>
                  {{ guest.email }}
                </p>
                <p class="guest-phone" v-if="guest.phone">
                  <ion-icon :icon="callOutline"></ion-icon>
                  {{ guest.phone }}
                </p>
                <p class="guest-timestamp" v-if="guest.sent_at">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  Enviado: {{ formatDateTime(guest.sent_at) }}
                </p>
              </div>

              <div class="guest-status">
                <ion-badge 
                  :color="guest.qr_sent ? 'success' : 'warning'"
                  class="status-badge"
                >
                  {{ guest.qr_sent ? '✓ ENVIADO' : 'PENDIENTE' }}
                </ion-badge>
              </div>

              <div class="guest-actions">
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click="sendToGuest(guest)"
                  :disabled="guest.qr_sent || sendingSingle"
                  v-if="!guest.qr_sent"
                >
                  <ion-icon :icon="sendOutline"></ion-icon>
                </ion-button>
                <ion-button 
                  fill="clear" 
                  size="small"
                  color="success"
                  @click="resendToGuest(guest)"
                  :disabled="sendingSingle"
                  v-else
                >
                  <ion-icon :icon="refreshOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>

          <!-- Paginación -->
          <div v-if="totalPages > 1" class="pagination">
            <ion-button 
              fill="outline"
              :disabled="currentPage === 1"
              @click="currentPage--"
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
              @click="currentPage++"
            >
              Siguiente
              <ion-icon :icon="chevronForwardOutline"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-else class="empty-state animate-fade-in">
          <div class="empty-icon">
            <ion-icon :icon="mailOutline"></ion-icon>
          </div>
          <h3>No hay invitados</h3>
          <p v-if="searchTerm">
            No se encontraron invitados que coincidan con "{{ searchTerm }}"
          </p>
          <p v-else>
            Añade invitados primero en la pestaña "Invitados"
          </p>
          <ion-button 
            @click="goToGuests"
            class="go-to-guests-btn"
          >
            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
            Ir a Invitados
          </ion-button>
        </div>

      </div>

      <!-- ========================================
           MODAL: SELECCIONAR EVENTO
           ======================================== -->
      <div v-if="showEventModal" class="custom-modal-overlay" @click="showEventModal = false">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Seleccionar Evento</h2>
            <button class="close-modal-btn" @click="showEventModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <div class="events-list">
              <div 
                v-for="event in events" 
                :key="event.id"
                class="event-option"
                :class="{ 'selected': selectedEvent?.id === event.id }"
                @click="selectEvent(event)"
              >
                <div class="event-option-icon">
                  <ion-icon :icon="calendarOutline"></ion-icon>
                </div>
                <div class="event-option-info">
                  <h4>{{ event.name }}</h4>
                  <p>{{ formatDate(event.date) }}</p>
                </div>
                <ion-icon 
                  v-if="selectedEvent?.id === event.id"
                  :icon="checkmarkCircleOutline" 
                  class="check-icon"
                  color="success"
                ></ion-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonBadge,
  IonChip,
  IonLabel,
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import {
  sendOutline,
  peopleOutline,
  mailOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  timeOutline,
  callOutline,
  refreshOutline,
  calendarOutline,
  locationOutline,
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  statsChartOutline
} from 'ionicons/icons'
// @ts-ignore
import { supabase } from '@/services/supabase.js'
// @ts-ignore
import eventsStore from '@/stores/events'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useHaptics } from '@/composables/useHaptics'
import { useDebounce } from '@/composables/useDebounce'

// ========================================
// ROUTER Y COMPOSABLES
// ========================================
const router = useRouter()
const { vibrate } = useHaptics()

// ========================================
// ESTADOS
// ========================================
const loading = ref(true)
const sendingAll = ref(false)
const sendingSelected = ref(false)
const sendingSingle = ref(false)
const guests = ref<any[]>([])
const searchTerm = ref('')
const filterStatus = ref<'all' | 'pending' | 'sent'>('all')
const currentPage = ref(1)
const itemsPerPage = 20

// Modales
const showEventModal = ref(false)

// Selección múltiple
const selectedGuests = ref<string[]>([])

// Progreso de envío
const sendingProgress = ref(0)
const currentSendingIndex = ref(0)
const totalToSend = ref(0)

// ========================================
// COMPUTED PROPERTIES
// ========================================
const events = computed(() => eventsStore.events)
const selectedEvent = computed(() => eventsStore.currentEvent)

// Estadísticas
const stats = computed(() => {
  const total = guests.value.length
  const sent = guests.value.filter(g => g.qr_sent).length
  const pending = total - sent

  return { total, sent, pending }
})

const progressPercentage = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.sent / stats.value.total) * 100)
})

// Invitados pendientes de envío
const pendingGuests = computed(() => {
  return guests.value.filter(g => !g.qr_sent)
})

// Filtrar invitados por búsqueda y estado
const filteredGuests = computed(() => {
  let result = [...guests.value]

  // Filtrar por término de búsqueda
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase().trim()
    result = result.filter(guest => 
      guest.name.toLowerCase().includes(search) ||
      guest.email.toLowerCase().includes(search) ||
      (guest.phone && guest.phone.toLowerCase().includes(search))
    )
  }

  // Filtrar por estado
  if (filterStatus.value !== 'all') {
    switch (filterStatus.value) {
      case 'sent':
        result = result.filter(g => g.qr_sent)
        break
      case 'pending':
        result = result.filter(g => !g.qr_sent)
        break
    }
  }

  return result
})

// Paginación
const totalPages = computed(() => {
  return Math.ceil(filteredGuests.value.length / itemsPerPage)
})

const paginatedGuests = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredGuests.value.slice(start, end)
})

// Verificar si todos los filtrados están seleccionados
const allFilteredSelected = computed(() => {
  if (filteredGuests.value.length === 0) return false
  const selectableGuests = filteredGuests.value.filter(g => !g.qr_sent)
  if (selectableGuests.length === 0) return false
  return selectableGuests.every(g => selectedGuests.value.includes(g.id))
})

// ========================================
// FUNCIONES DE CARGA DE DATOS
// ========================================
const loadGuests = async () => {
  if (!selectedEvent.value) {
    guests.value = []
    loading.value = false
    return
  }

  loading.value = true

  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('event_id', selectedEvent.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    guests.value = data || []
    console.log('✅ Invitados cargados:', guests.value.length)
    
  } catch (error) {
    console.error('Error cargando invitados:', error)
    await vibrate('error')
    showToast('Error al cargar invitados', 'danger')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await vibrate('light')
  await loadGuests()
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
// FUNCIONES DE EVENTOS
// ========================================
const selectEvent = async (event: any) => {
  eventsStore.setCurrentEvent(event.id)
  showEventModal.value = false
  await vibrate('light')
  selectedGuests.value = []
  await loadGuests()
}

const goToGuests = () => {
  router.push('/tabs/guests')
}

// ========================================
// FUNCIONES DE SELECCIÓN
// ========================================
const toggleGuestSelection = (guestId: string) => {
  const index = selectedGuests.value.indexOf(guestId)
  if (index > -1) {
    selectedGuests.value.splice(index, 1)
  } else {
    selectedGuests.value.push(guestId)
  }
}

const toggleSelectAll = () => {
  if (allFilteredSelected.value) {
    // Deseleccionar todos
    const selectableIds = filteredGuests.value
      .filter(g => !g.qr_sent)
      .map(g => g.id)
    selectedGuests.value = selectedGuests.value.filter(id => !selectableIds.includes(id))
  } else {
    // Seleccionar todos los que no estén enviados
    const selectableGuests = filteredGuests.value.filter(g => !g.qr_sent)
    const newIds = selectableGuests.map(g => g.id)
    selectedGuests.value = [...new Set([...selectedGuests.value, ...newIds])]
  }
}

const clearSelection = () => {
  selectedGuests.value = []
}

// ========================================
// FUNCIONES DE ENVÍO
// ========================================
const generateDownloadLink = async (guestId: string) => {
  try {
    // Generar código único para descarga
    const downloadCode = `${guestId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const guest = guests.value.find(g => g.id === guestId)
    if (!guest) throw new Error('Invitado no encontrado')

    // Guardar en tabla de descargas
    const { error: downloadError } = await supabase
      .from('download_tickets')
      .insert([{
        guest_id: guestId,
        guest_name: guest.name,
        guest_email: guest.email,
        guest_phone: guest.phone,
        event_id: selectedEvent.value!.id,
        event_name: selectedEvent.value!.name,
        event_date: selectedEvent.value!.date,
        event_location: selectedEvent.value!.location,
        download_code: downloadCode,
        qr_code: guest.qr_code || null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        is_used: false
      }])

    if (downloadError) throw downloadError

    // Retornar link de descarga
    const baseUrl = window.location.origin
    return `${baseUrl}/download-ticket/${downloadCode}`
    
  } catch (error) {
    console.error('Error generando link de descarga:', error)
    throw error
  }
}

const sendEmailToGuest = async (guest: any) => {
  try {
    // Generar link de descarga
    const downloadLink = await generateDownloadLink(guest.id)

    // TODO: Aquí integrarías con tu servicio de email (EmailJS, SendGrid, etc.)
    // Por ahora simulamos el envío
    console.log('📧 Enviando email a:', guest.email)
    console.log('🔗 Link de descarga:', downloadLink)

    // Simular delay de envío
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Marcar como enviado en la base de datos
    const { error } = await supabase
      .from('guests')
      .update({
        qr_sent: true,
        sent_at: new Date().toISOString()
      })
      .eq('id', guest.id)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error enviando email:', error)
    throw error
  }
}

const sendToGuest = async (guest: any) => {
  await vibrate('light')
  
  const alert = await alertController.create({
    header: 'Confirmar envío',
    message: `¿Enviar invitación a ${guest.name}?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Enviar',
        handler: async () => {
          sendingSingle.value = true
          try {
            await sendEmailToGuest(guest)
            await vibrate('success')
            showToast(`✓ Invitación enviada a ${guest.name}`, 'success')
            await loadGuests()
          } catch (error) {
            await vibrate('error')
            showToast('Error al enviar la invitación', 'danger')
          } finally {
            sendingSingle.value = false
          }
        }
      }
    ]
  })

  await alert.present()
}

const resendToGuest = async (guest: any) => {
  await vibrate('warning')
  
  const alert = await alertController.create({
    header: 'Reenviar invitación',
    message: `¿Reenviar invitación a ${guest.name}?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Reenviar',
        handler: async () => {
          sendingSingle.value = true
          try {
            await sendEmailToGuest(guest)
            await vibrate('success')
            showToast(`✓ Invitación reenviada a ${guest.name}`, 'success')
            await loadGuests()
          } catch (error) {
            await vibrate('error')
            showToast('Error al reenviar la invitación', 'danger')
          } finally {
            sendingSingle.value = false
          }
        }
      }
    ]
  })

  await alert.present()
}

const sendToAll = async () => {
  if (pendingGuests.value.length === 0) {
    showToast('No hay invitados pendientes', 'warning')
    return
  }

  await vibrate('warning')
  
  const alert = await alertController.create({
    header: 'Enviar a todos',
    message: `¿Enviar invitaciones a ${pendingGuests.value.length} invitados pendientes?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Enviar',
        handler: async () => {
          await sendBulkEmails(pendingGuests.value)
        }
      }
    ]
  })

  await alert.present()
}

const sendToSelected = async () => {
  if (selectedGuests.value.length === 0) {
    showToast('No hay invitados seleccionados', 'warning')
    return
  }

  await vibrate('light')
  
  const guestsToSend = guests.value.filter(g => selectedGuests.value.includes(g.id))
  
  const alert = await alertController.create({
    header: 'Enviar seleccionados',
    message: `¿Enviar invitaciones a ${guestsToSend.length} invitados seleccionados?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Enviar',
        handler: async () => {
          await sendBulkEmails(guestsToSend)
        }
      }
    ]
  })

  await alert.present()
}

const sendBulkEmails = async (guestsToSend: any[]) => {
  sendingAll.value = true
  sendingProgress.value = 0
  currentSendingIndex.value = 0
  totalToSend.value = guestsToSend.length

  let successCount = 0
  let errorCount = 0

  try {
    for (let i = 0; i < guestsToSend.length; i++) {
      const guest = guestsToSend[i]
      
      try {
        await sendEmailToGuest(guest)
        successCount++
        await vibrate('light')
      } catch (error) {
        console.error(`Error enviando a ${guest.name}:`, error)
        errorCount++
      }

      currentSendingIndex.value = i + 1
      sendingProgress.value = Math.round(((i + 1) / guestsToSend.length) * 100)

      // Pequeño delay entre envíos para no saturar
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    await vibrate('success')
    
    if (errorCount === 0) {
      showToast(`✓ ${successCount} invitaciones enviadas correctamente`, 'success')
    } else {
      showToast(`${successCount} enviadas, ${errorCount} fallidas`, 'warning')
    }

    selectedGuests.value = []
    await loadGuests()

  } catch (error) {
    console.error('Error en envío masivo:', error)
    await vibrate('error')
    showToast('Error en el envío masivo', 'danger')
  } finally {
    sendingAll.value = false
    sendingSelected.value = false
    sendingProgress.value = 0
    currentSendingIndex.value = 0
    totalToSend.value = 0
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

watch(() => selectedEvent.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadGuests()
  }
})

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('📧 SendTab montado')
  
  if (events.value.length === 0) {
    await eventsStore.init()
  }
  
  if (selectedEvent.value) {
    await loadGuests()
  } else {
    loading.value = false
  }
})

onActivated(async () => {
  console.log('🔄 SendTab activado - refrescando datos')
  
  if (selectedEvent.value) {
    await loadGuests()
  }
})
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.send-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.send-content {
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

.change-event-btn {
  --border-radius: 8px;
  font-weight: 600;
  --border-width: 2px;
  --border-color: #667eea;
  --color: #667eea;
}

.current-event-card {
  display: flex;
  align-items: center;
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
  transform: translateY(-2px);
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
}

.event-info h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
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

.stat-sent {
  border-left-color: #10b981;
}

.stat-sent .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-pending {
  border-left-color: #fbbf24;
}

.stat-pending .stat-icon {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.stat-progress {
  border-left-color: #667eea;
}

.stat-progress .stat-icon {
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
   ACCIONES Y BÚSQUEDA
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.send-all-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

.send-selected-btn {
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
  --border-width: 2px;
  --border-color: #0d1b2a;
  --color: #0d1b2a;
}

/* ========================================
   PROGRESO DE ENVÍO
   ======================================== */
.sending-progress {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #0ea5e9;
  border-radius: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header span {
  font-weight: 600;
  color: #0c4a6e;
}

.progress-text {
  font-size: 1.2rem;
  color: #0ea5e9;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e0f2fe;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%);
  transition: width 0.3s ease;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
}

.progress-detail {
  text-align: center;
  color: #0c4a6e;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 500;
}

/* ========================================
   LISTA DE INVITADOS
   ======================================== */
.guests-list-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
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

/* Fila de seleccionar todos */
.select-all-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-container input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-label {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.95rem;
}

.clear-selection-btn {
  --color: #ef4444;
}

/* Lista de invitados */
.guests-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

.guest-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #e5e7eb;
  transition: all 0.3s ease;
}

.guest-item:hover {
  background: #f1f3f4;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.guest-item.guest-sent {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4 0%, #f8f9fa 100%);
}

.guest-item.guest-selected {
  background: linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%);
  border-left-color: #667eea;
}

.guest-checkbox {
  flex-shrink: 0;
}

.guest-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.guest-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.guest-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(13, 27, 42, 0.3);
}

.guest-item.guest-sent .guest-avatar {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.guest-info {
  flex: 1;
}

.guest-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
}

.guest-info p {
  margin: 2px 0;
  color: #6b7280;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.guest-email ion-icon,
.guest-phone ion-icon,
.guest-timestamp ion-icon {
  font-size: 1rem;
}

.guest-timestamp {
  color: #10b981;
  font-size: 0.85rem;
  font-weight: 500;
}

.guest-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.guest-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.guest-actions ion-button {
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

.go-to-guests-btn {
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
   LISTA DE EVENTOS EN MODAL
   ======================================== */
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
}

.event-option-info h4 {
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 1.05rem;
  font-weight: 600;
}

.event-option-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.check-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .send-container {
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

  .action-buttons {
    grid-template-columns: 1fr;
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

  .select-all-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .guest-item {
    flex-wrap: wrap;
    padding: 12px;
  }

  .guest-status {
    width: 100%;
  }

  .guest-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .current-event-card {
    flex-direction: column;
    text-align: center;
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
}

@media (max-width: 480px) {
  .send-container {
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

  .guest-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }

  .guest-info h4 {
    font-size: 0.95rem;
  }

  .guest-info p {
    font-size: 0.85rem;
  }

  .event-selector-section,
  .actions-section,
  .guests-list-section {
    padding: 20px;
  }
}

/* ========================================
   ANIMACIONES
   ======================================== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
</style>