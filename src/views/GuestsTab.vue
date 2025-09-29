<template>
  <ion-page>
    <ion-content :fullscreen="true" class="guests-content">
      <div class="guests-container">
        
        <!-- Header con estadísticas -->
        <div class="page-header animate-fade-in-down">
          <div class="header-content">
            <h1>Gestión de Invitados</h1>
            <p>Administra la lista de invitados para tus eventos</p>
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

        <!-- Estadísticas -->
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
                <ion-icon :icon="mailOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.sent }}</div>
                <div class="stat-label">QR Enviados</div>
              </div>
            </div>

            <div class="stat-card stat-attended">
              <div class="stat-icon">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.attended }}</div>
                <div class="stat-label">Han Asistido</div>
              </div>
            </div>

            <div class="stat-card stat-pending">
              <div class="stat-icon">
                <ion-icon :icon="timeOutline"></ion-icon>
              </div>
              <div class="stat-content">
                <div class="stat-value">{{ stats.pending }}</div>
                <div class="stat-label">Pendientes</div>
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
              placeholder="Buscar por nombre, email o teléfono..."
              :debounce="300"
              animated
            ></ion-searchbar>
          </div>

          <div class="action-buttons">
            <ion-button 
              expand="block"
              @click="showBulkAddModal = true"
              class="bulk-add-btn"
            >
              <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
              Añadir Lista de Invitados
            </ion-button>

            <ion-button 
              expand="block"
              fill="outline"
              @click="showAddGuestModal = true"
              class="add-single-btn"
            >
              <ion-icon :icon="addOutline" slot="start"></ion-icon>
              Añadir 1 Invitado
            </ion-button>
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
                :color="filterStatus === 'sent' ? 'warning' : 'medium'"
                @click="filterStatus = 'sent'"
              >
                <ion-label>Enviados</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'attended' ? 'success' : 'medium'"
                @click="filterStatus = 'attended'"
              >
                <ion-label>Asistieron</ion-label>
              </ion-chip>
              <ion-chip 
                :color="filterStatus === 'pending' ? 'medium' : 'medium'"
                @click="filterStatus = 'pending'"
              >
                <ion-label>Pendientes</ion-label>
              </ion-chip>
            </div>
          </div>

          <div class="guests-list">
            <div 
              v-for="guest in paginatedGuests" 
              :key="guest.id"
              class="guest-item"
              :class="{
                'guest-sent': guest.qr_sent,
                'guest-attended': guest.has_entered
              }"
              @click="openGuestDetail(guest)"
            >
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
                <p class="guest-timestamp" v-if="guest.entered_at">
                  <ion-icon :icon="timeOutline"></ion-icon>
                  Entró: {{ formatDateTime(guest.entered_at) }}
                </p>
              </div>

              <div class="guest-status">
                <ion-badge 
                  :color="guest.has_entered ? 'success' : guest.qr_sent ? 'warning' : 'medium'"
                  class="status-badge"
                >
                  {{ guest.has_entered ? 'ASISTIÓ' : guest.qr_sent ? 'ENVIADO' : 'PENDIENTE' }}
                </ion-badge>
                
                <ion-chip 
                  v-if="guest.table_number" 
                  color="primary"
                  class="table-chip"
                >
                  <ion-icon :icon="restaurantOutline"></ion-icon>
                  <ion-label>Mesa {{ guest.table_number }}</ion-label>
                </ion-chip>
              </div>

              <div class="guest-actions">
                <ion-button 
                  fill="clear" 
                  size="small"
                  @click.stop="editGuest(guest)"
                >
                  <ion-icon :icon="createOutline"></ion-icon>
                </ion-button>
                <ion-button 
                  fill="clear" 
                  size="small"
                  color="danger"
                  @click.stop="confirmDeleteGuest(guest)"
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
            <ion-icon :icon="peopleOutline"></ion-icon>
          </div>
          <h3>No hay invitados</h3>
          <p v-if="searchTerm">
            No se encontraron invitados que coincidan con "{{ searchTerm }}"
          </p>
          <p v-else>
            Comienza añadiendo invitados a tu evento
          </p>
          <ion-button 
            @click="showBulkAddModal = true"
            class="add-first-guest-btn"
          >
            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
            Añadir Invitados
          </ion-button>
        </div>

      </div>

      <!-- ========================================
           MODALES CON DISEÑO MEJORADO
           ======================================== -->

      <!-- Modal: Seleccionar Evento -->
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

      <!-- Modal: Añadir Lista de Invitados -->
      <div v-if="showBulkAddModal" class="custom-modal-overlay" @click="closeBulkAddModal">
        <div class="custom-modal large-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Añadir Lista de Invitados</h2>
            <button class="close-modal-btn" @click="closeBulkAddModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <div class="bulk-instructions">
              <h3>📝 Formato</h3>
              <p>Escribe un invitado por línea. Formato:</p>
              <div class="format-example">
                <code>Nombre, email@ejemplo.com</code>
                <span class="format-or">o</span>
                <code>Nombre, email@ejemplo.com, +34600000000</code>
              </div>
              <p class="format-note">El teléfono es opcional</p>
            </div>

            <div class="textarea-container">
              <label>Lista de Invitados</label>
              <textarea
                v-model="bulkGuestsText"
                placeholder="Juan Pérez, juan@ejemplo.com&#10;María García, maria@ejemplo.com, +34600111222&#10;Pedro López, pedro@ejemplo.com"
                rows="12"
                class="bulk-textarea"
              ></textarea>
            </div>

            <div class="bulk-preview" v-if="parsedBulkGuests.length > 0">
              <h4>✅ Vista previa: {{ parsedBulkGuests.length }} invitados</h4>
              <div class="preview-list">
                <div v-for="(guest, index) in parsedBulkGuests.slice(0, 5)" :key="index" class="preview-item">
                  <ion-icon :icon="checkmarkCircleOutline" color="success"></ion-icon>
                  <div class="preview-info">
                    <strong>{{ guest.name }}</strong>
                    <span>{{ guest.email }}</span>
                    <span v-if="guest.phone" class="preview-phone">{{ guest.phone }}</span>
                  </div>
                </div>
                <p v-if="parsedBulkGuests.length > 5" class="preview-more">
                  ... y {{ parsedBulkGuests.length - 5 }} más
                </p>
              </div>
            </div>

            <div class="modal-actions">
              <button 
                class="primary-action-btn"
                @click="saveBulkGuests"
                :disabled="savingBulk || parsedBulkGuests.length === 0"
              >
                <ion-spinner v-if="savingBulk" name="crescent"></ion-spinner>
                <ion-icon v-else :icon="checkmarkOutline"></ion-icon>
                <span>{{ savingBulk ? 'Guardando...' : `Guardar ${parsedBulkGuests.length} Invitados` }}</span>
              </button>

              <button 
                class="secondary-action-btn"
                @click="closeBulkAddModal"
                :disabled="savingBulk"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Añadir/Editar 1 Invitado -->
      <div v-if="showAddGuestModal" class="custom-modal-overlay" @click="closeGuestModal">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>{{ editingGuest ? 'Editar' : 'Añadir' }} Invitado</h2>
            <button class="close-modal-btn" @click="closeGuestModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content">
            <form @submit.prevent="saveGuest" class="guest-form">
              <div class="form-group">
                <label>Nombre completo *</label>
                <input
                  v-model="guestForm.name"
                  type="text"
                  placeholder="Juan Pérez"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Email *</label>
                <input
                  v-model="guestForm.email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  required
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Teléfono</label>
                <input
                  v-model="guestForm.phone"
                  type="tel"
                  placeholder="+34 600 000 000"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Número de mesa</label>
                <input
                  v-model="guestForm.table_number"
                  type="number"
                  placeholder="1"
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
                  <span>{{ saving ? 'Guardando...' : 'Guardar' }}</span>
                </button>

                <button 
                  type="button"
                  class="secondary-action-btn"
                  @click="closeGuestModal"
                  :disabled="saving"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Modal: Detalle del Invitado -->
      <div v-if="showDetailModal && selectedGuestDetail" class="custom-modal-overlay" @click="showDetailModal = false">
        <div class="custom-modal" @click.stop>
          <div class="custom-modal-header">
            <h2>Detalle del Invitado</h2>
            <button class="close-modal-btn" @click="showDetailModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </button>
          </div>
          
          <div class="custom-modal-content guest-detail">
            <div class="detail-header">
              <div class="detail-avatar">
                {{ selectedGuestDetail.name.charAt(0).toUpperCase() }}
              </div>
              <div class="detail-info">
                <h3>{{ selectedGuestDetail.name }}</h3>
                <ion-badge 
                  :color="selectedGuestDetail.has_entered ? 'success' : selectedGuestDetail.qr_sent ? 'warning' : 'medium'"
                >
                  {{ selectedGuestDetail.has_entered ? 'ASISTIÓ' : selectedGuestDetail.qr_sent ? 'QR ENVIADO' : 'PENDIENTE' }}
                </ion-badge>
              </div>
            </div>

            <div class="detail-sections">
              <div class="detail-section">
                <h4>Información de Contacto</h4>
                <div class="detail-item">
                  <ion-icon :icon="mailOutline"></ion-icon>
                  <span>{{ selectedGuestDetail.email }}</span>
                </div>
                <div class="detail-item" v-if="selectedGuestDetail.phone">
                  <ion-icon :icon="callOutline"></ion-icon>
                  <span>{{ selectedGuestDetail.phone }}</span>
                </div>
                <div class="detail-item" v-if="selectedGuestDetail.table_number">
                  <ion-icon :icon="restaurantOutline"></ion-icon>
                  <span>Mesa {{ selectedGuestDetail.table_number }}</span>
                </div>
              </div>

              <div class="detail-section" v-if="selectedGuestDetail.qr_sent || selectedGuestDetail.has_entered">
                <h4>Estado del Ticket</h4>
                <div class="detail-item" v-if="selectedGuestDetail.sent_at">
                  <ion-icon :icon="mailOutline"></ion-icon>
                  <div>
                    <strong>QR Enviado:</strong>
                    <span>{{ formatDateTime(selectedGuestDetail.sent_at) }}</span>
                  </div>
                </div>
                <div class="detail-item" v-if="selectedGuestDetail.entered_at">
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                  <div>
                    <strong>Asistió al evento:</strong>
                    <span>{{ formatDateTime(selectedGuestDetail.entered_at) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-actions">
              <button 
                class="primary-action-btn"
                @click="editGuest(selectedGuestDetail)"
              >
                <ion-icon :icon="createOutline"></ion-icon>
                <span>Editar Invitado</span>
              </button>

              <button 
                class="danger-action-btn"
                @click="confirmDeleteGuest(selectedGuestDetail)"
              >
                <ion-icon :icon="trashOutline"></ion-icon>
                <span>Eliminar</span>
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
  IonSearchbar,
  IonBadge,
  IonChip,
  IonLabel,
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import {
  addOutline,
  peopleOutline,
  mailOutline,
  checkmarkCircleOutline,
  timeOutline,
  callOutline,
  restaurantOutline,
  createOutline,
  trashOutline,
  refreshOutline,
  calendarOutline,
  locationOutline,
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
const savingBulk = ref(false)
const guests = ref<any[]>([])
const searchTerm = ref('')
const filterStatus = ref<'all' | 'sent' | 'attended' | 'pending'>('all')
const currentPage = ref(1)
const itemsPerPage = 20

// Modales
const showEventModal = ref(false)
const showAddGuestModal = ref(false)
const showBulkAddModal = ref(false)
const showDetailModal = ref(false)

// Invitado seleccionado
const selectedGuestDetail = ref<any>(null)
const editingGuest = ref<any>(null)

// Formulario de invitado único
const guestForm = ref({
  name: '',
  email: '',
  phone: '',
  table_number: null as number | null
})

// Formulario de invitados múltiples
const bulkGuestsText = ref('')

// ========================================
// COMPUTED PROPERTIES
// ========================================
const events = computed(() => eventsStore.events)
const selectedEvent = computed(() => eventsStore.currentEvent)

// Estadísticas
const stats = computed(() => {
  const total = guests.value.length
  const sent = guests.value.filter(g => g.qr_sent).length
  const attended = guests.value.filter(g => g.has_entered).length
  const pending = total - sent

  return { total, sent, attended, pending }
})

// Parsear invitados desde el texto
const parsedBulkGuests = computed(() => {
  if (!bulkGuestsText.value.trim()) return []
  
  const lines = bulkGuestsText.value.split('\n').filter(line => line.trim())
  const guests: any[] = []
  
  lines.forEach(line => {
    const parts = line.split(',').map(p => p.trim())
    if (parts.length >= 2) {
      guests.push({
        name: parts[0],
        email: parts[1],
        phone: parts[2] || null
      })
    }
  })
  
  return guests
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
        result = result.filter(g => g.qr_sent && !g.has_entered)
        break
      case 'attended':
        result = result.filter(g => g.has_entered)
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
  currentPage.value = 1 // Resetear a primera página
  console.log('🔍 Búsqueda:', searchTerm.value)
}, 300)

// ========================================
// FUNCIONES DE EVENTOS
// ========================================
const selectEvent = async (event: any) => {
  eventsStore.setCurrentEvent(event.id)
  showEventModal.value = false
  await vibrate('light')
  await loadGuests()
}

// ========================================
// FUNCIONES DE INVITADOS ÚNICOS
// ========================================
const openGuestDetail = async (guest: any) => {
  selectedGuestDetail.value = guest
  showDetailModal.value = true
  await vibrate('light')
}

const editGuest = (guest: any) => {
  editingGuest.value = guest
  guestForm.value = {
    name: guest.name,
    email: guest.email,
    phone: guest.phone || '',
    table_number: guest.table_number || null
  }
  showDetailModal.value = false
  showAddGuestModal.value = true
}

const closeGuestModal = () => {
  showAddGuestModal.value = false
  editingGuest.value = null
  guestForm.value = {
    name: '',
    email: '',
    phone: '',
    table_number: null
  }
}

const saveGuest = async () => {
  if (!selectedEvent.value) {
    showToast('Selecciona un evento primero', 'warning')
    return
  }

  if (!guestForm.value.name.trim() || !guestForm.value.email.trim()) {
    showToast('Nombre y email son obligatorios', 'warning')
    await vibrate('warning')
    return
  }

  saving.value = true
  await vibrate('light')

  try {
    const guestData = {
      name: guestForm.value.name.trim(),
      email: guestForm.value.email.trim().toLowerCase(),
      phone: guestForm.value.phone.trim() || null,
      table_number: guestForm.value.table_number || null,
      event_id: selectedEvent.value.id,
      event_name: selectedEvent.value.name
    }

    if (editingGuest.value) {
      // Actualizar invitado existente
      const { error } = await supabase
        .from('guests')
        .update(guestData)
        .eq('id', editingGuest.value.id)

      if (error) throw error

      await vibrate('success')
      showToast('Invitado actualizado correctamente', 'success')
    } else {
      // Crear nuevo invitado
      const { error } = await supabase
        .from('guests')
        .insert([guestData])

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email ya está registrado en este evento')
        }
        throw error
      }

      await vibrate('success')
      showToast('Invitado añadido correctamente', 'success')
    }

    closeGuestModal()
    await loadGuests()

  } catch (error: any) {
    console.error('Error guardando invitado:', error)
    await vibrate('error')
    showToast(error.message || 'Error al guardar invitado', 'danger')
  } finally {
    saving.value = false
  }
}

// ========================================
// FUNCIONES DE INVITADOS MÚLTIPLES
// ========================================
const closeBulkAddModal = () => {
  showBulkAddModal.value = false
  bulkGuestsText.value = ''
}

const saveBulkGuests = async () => {
  if (!selectedEvent.value) {
    showToast('Selecciona un evento primero', 'warning')
    await vibrate('warning')
    return
  }

  if (parsedBulkGuests.value.length === 0) {
    showToast('No hay invitados válidos para añadir', 'warning')
    await vibrate('warning')
    return
  }

  savingBulk.value = true
  await vibrate('light')

  try {
    const guestsData = parsedBulkGuests.value.map(guest => ({
      name: guest.name.trim(),
      email: guest.email.trim().toLowerCase(),
      phone: guest.phone?.trim() || null,
      event_id: selectedEvent.value!.id,
      event_name: selectedEvent.value!.name,
      qr_sent: false,
      has_entered: false
    }))

    const { error } = await supabase
      .from('guests')
      .insert(guestsData)

    if (error) {
      if (error.code === '23505') {
        throw new Error('Algunos emails ya están registrados en este evento')
      }
      throw error
    }

    await vibrate('success')
    showToast(`${guestsData.length} invitados añadidos correctamente`, 'success')
    
    closeBulkAddModal()
    await loadGuests()

  } catch (error: any) {
    console.error('Error guardando invitados:', error)
    await vibrate('error')
    showToast(error.message || 'Error al guardar invitados', 'danger')
  } finally {
    savingBulk.value = false
  }
}

// ========================================
// ELIMINAR INVITADO
// ========================================
const confirmDeleteGuest = async (guest: any) => {
  await vibrate('warning')
  
  const alert = await alertController.create({
    header: 'Confirmar eliminación',
    message: `¿Estás seguro de que quieres eliminar a ${guest.name}?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => deleteGuest(guest)
      }
    ]
  })

  await alert.present()
}

const deleteGuest = async (guest: any) => {
  try {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guest.id)

    if (error) throw error

    await vibrate('success')
    showToast('Invitado eliminado', 'success')
    showDetailModal.value = false
    await loadGuests()

  } catch (error) {
    console.error('Error eliminando invitado:', error)
    await vibrate('error')
    showToast('Error al eliminar invitado', 'danger')
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
// Resetear página cuando cambian los filtros
watch([searchTerm, filterStatus], () => {
  currentPage.value = 1
})

// Recargar invitados cuando cambia el evento seleccionado
watch(() => selectedEvent.value?.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadGuests()
  }
})

// ========================================
// LIFECYCLE HOOKS
// ========================================
onMounted(async () => {
  console.log('🎯 GuestsTab montado')
  
  // Inicializar eventos si no están cargados
  if (events.value.length === 0) {
    await eventsStore.init()
  }
  
  // Cargar invitados si hay un evento seleccionado
  if (selectedEvent.value) {
    await loadGuests()
  } else {
    loading.value = false
  }
})

onActivated(async () => {
  console.log('🔄 GuestsTab activado - refrescando datos')
  
  // Recargar datos cuando se vuelve a activar la pestaña
  if (selectedEvent.value) {
    await loadGuests()
  }
})
</script>

<style scoped>
/* ========================================
   CONTENEDOR PRINCIPAL
   ======================================== */
.guests-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.guests-content {
  --background: #f8f9fa;
}

/* ========================================
   HEADER SIN ION-HEADER
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
  border-left-color: #fbbf24;
}

.stat-sent .stat-icon {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.stat-attended {
  border-left-color: #10b981;
}

.stat-attended .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-pending {
  border-left-color: #6b7280;
}

.stat-pending .stat-icon {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
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
   BARRA DE BÚSQUEDA Y ACCIONES
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

.bulk-add-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
}

.add-single-btn {
  --border-radius: 8px;
  font-weight: 600;
  height: 48px;
  --border-width: 2px;
  --border-color: #0d1b2a;
  --color: #0d1b2a;
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
  cursor: pointer;
}

.guest-item:hover {
  background: #f1f3f4;
  border-left-color: #667eea;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.guest-item.guest-sent {
  border-left-color: #fbbf24;
}

.guest-item.guest-attended {
  border-left-color: #10b981;
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
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.guest-item.guest-attended .guest-avatar {
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
  color: #9ca3af;
  font-size: 0.85rem;
  font-style: italic;
}

.guest-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
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

.table-chip {
  font-size: 0.8rem;
  height: 24px;
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

.add-first-guest-btn {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --border-radius: 8px;
  font-weight: 600;
}

/* ========================================
   MODALES PERSONALIZADOS (SIN ION-MODAL)
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
  max-width: 700px;
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
   FORMULARIO DE INVITADOS MÚLTIPLES
   ======================================== */
.bulk-instructions {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.bulk-instructions h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.1rem;
  font-weight: 600;
}

.bulk-instructions p {
  margin: 8px 0;
  color: #4b5563;
  font-size: 0.95rem;
  line-height: 1.5;
}

.format-example {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin: 12px 0;
}

.format-example code {
  display: block;
  font-family: 'Courier New', monospace;
  color: #0d1b2a;
  font-size: 0.9rem;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 8px 0;
}

.format-or {
  display: block;
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
  margin: 8px 0;
  font-style: italic;
}

.format-note {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  margin-top: 8px;
}

.textarea-container {
  margin-bottom: 20px;
}

.textarea-container label {
  display: block;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.bulk-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s ease;
}

.bulk-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.bulk-preview {
  background: #f0fdf4;
  border: 2px solid #10b981;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.bulk-preview h4 {
  margin: 0 0 16px 0;
  color: #065f46;
  font-size: 1rem;
  font-weight: 600;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-item ion-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.preview-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-info strong {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.95rem;
}

.preview-info span {
  color: #6b7280;
  font-size: 0.85rem;
}

.preview-phone {
  color: #667eea;
  font-weight: 500;
}

.preview-more {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 8px;
}

/* ========================================
   FORMULARIO ÚNICO
   ======================================== */
.guest-form {
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

.form-input {
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* ========================================
   DETALLE DEL INVITADO
   ======================================== */
.guest-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(13, 27, 42, 0.3);
}

.detail-info h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
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

.detail-item span {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
}

.detail-item div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item strong {
  color: #1f2937;
  font-weight: 600;
  font-size: 0.9rem;
}

/* ========================================
   BOTONES DE ACCIÓN EN MODALES
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
.secondary-action-btn,
.danger-action-btn {
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

.danger-action-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.danger-action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

/* ========================================
   RESPONSIVE
   ======================================== */
@media (max-width: 768px) {
  .guests-container {
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

  .guest-item {
    flex-wrap: wrap;
    padding: 12px;
  }

  .guest-status {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .guest-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .current-event-card {
    flex-direction: column;
    text-align: center;
  }

  .detail-header {
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

  .custom-modal-header {
    padding: 20px;
  }

  .custom-modal-content {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .guests-container {
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

  .detail-avatar {
    width: 64px;
    height: 64px;
    font-size: 1.6rem;
  }

  .detail-info h3 {
    font-size: 1.1rem;
  }

  .custom-modal-header h2 {
    font-size: 1.1rem;
  }

  .bulk-instructions {
    padding: 16px;
  }

  .bulk-instructions h3 {
    font-size: 1rem;
  }

  .format-example code {
    font-size: 0.8rem;
    padding: 6px;
  }

  .bulk-textarea {
    font-size: 0.85rem;
    padding: 12px;
  }

  .preview-item {
    padding: 10px;
  }

  .preview-info strong {
    font-size: 0.9rem;
  }

  .preview-info span {
    font-size: 0.8rem;
  }

  .primary-action-btn,
  .secondary-action-btn,
  .danger-action-btn {
    padding: 12px 20px;
    font-size: 0.95rem;
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
   MODO OSCURO (OPCIONAL)
   ======================================== */
@media (prefers-color-scheme: dark) {
  .guests-content {
    --background: #1a1a1a;
  }

  .page-header,
  .event-selector-section,
  .stats-section .stat-card,
  .actions-section,
  .guests-list-section,
  .empty-state {
    background: #2d2d2d;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .header-content h1,
  .section-header h3,
  .guest-info h4,
  .detail-info h3,
  .empty-state h3 {
    color: #f9fafb;
  }

  .header-content p,
  .guest-info p,
  .empty-state p,
  .event-date,
  .event-location,
  .stat-label,
  .pagination-info {
    color: #9ca3af;
  }

  .current-event-card,
  .guest-item {
    background: #3a3a3a;
    border-color: #4a4a4a;
  }

  .bulk-instructions {
    background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
    border-color: #667eea;
  }

  .bulk-instructions h3,
  .bulk-instructions p {
    color: #e5e7eb;
  }

  .format-example,
  .bulk-textarea,
  .form-input {
    background: #2d2d2d;
    border-color: #4a4a4a;
    color: #f9fafb;
  }

  .bulk-textarea:focus,
  .form-input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  .custom-modal {
    background: #2d2d2d;
  }

  .custom-modal-content {
    background: #2d2d2d;
  }

  .event-option,
  .detail-section,
  .preview-item,
  .detail-item {
    background: #3a3a3a;
  }

  .event-option:hover {
    background: #454545;
  }

  .event-option.selected {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  }

  .event-option-info h4,
  .detail-section h4,
  .preview-info strong,
  .detail-item strong {
    color: #f9fafb;
  }

  .event-option-info p,
  .preview-info span,
  .detail-item span {
    color: #9ca3af;
  }

  .secondary-action-btn {
    background: #3a3a3a;
    border-color: #4a4a4a;
    color: #9ca3af;
  }

  .secondary-action-btn:hover:not(:disabled) {
    background: #454545;
    border-color: #5a5a5a;
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

@media (prefers-color-scheme: dark) {
  .custom-modal-content::-webkit-scrollbar-track {
    background: #3a3a3a;
  }

  .custom-modal-content::-webkit-scrollbar-thumb {
    background: #667eea;
  }

  .custom-modal-content::-webkit-scrollbar-thumb:hover {
    background: #7588ec;
  }
}

/* ========================================
   ANIMACIONES DE INTERACCIÓN
   ======================================== */
.guest-item,
.event-option,
.stat-card,
.primary-action-btn,
.secondary-action-btn,
.danger-action-btn,
.close-modal-btn {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Efecto de clic en móviles */
@media (hover: none) {
  .guest-item:active {
    transform: scale(0.98);
  }

  .primary-action-btn:active:not(:disabled),
  .danger-action-btn:active:not(:disabled) {
    transform: scale(0.95);
  }

  .secondary-action-btn:active:not(:disabled) {
    background: #e5e7eb;
  }
}

/* ========================================
   MEJORAS DE ACCESIBILIDAD
   ======================================== */
.close-modal-btn:focus,
.primary-action-btn:focus,
.secondary-action-btn:focus,
.danger-action-btn:focus,
.form-input:focus,
.bulk-textarea:focus {
  outline: 3px solid #667eea;
  outline-offset: 2px;
}

/* Focus visible solo con teclado */
.close-modal-btn:focus:not(:focus-visible),
.primary-action-btn:focus:not(:focus-visible),
.secondary-action-btn:focus:not(:focus-visible),
.danger-action-btn:focus:not(:focus-visible) {
  outline: none;
}

/* ========================================
   ESTILOS DE IMPRESIÓN (OPCIONAL)
   ======================================== */
@media print {
  .page-header,
  .actions-section,
  .guest-actions,
  .filter-chips,
  .pagination,
  .custom-modal-overlay {
    display: none !important;
  }

  .guests-container {
    padding: 0;
  }

  .guest-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>