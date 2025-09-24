<template>
  <ion-page>
    <AppHeader />
    
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Lista de Invitados</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="guests-container">
        <!-- Selector de evento -->
        <ion-card class="event-selector">
          <ion-card-content>
            <div class="event-header">
              <div class="event-info">
                <h2>{{ currentEvent?.name || 'Sin evento seleccionado' }}</h2>
                <p v-if="currentEvent">{{ formatDate(currentEvent.date) }} • {{ currentEvent.location || 'Sin ubicación' }}</p>
              </div>
              <ion-button
                fill="outline"
                @click="openEventSelector"
                v-if="eventsStore.events.length > 1"
              >
                <ion-icon :icon="swapHorizontalOutline" slot="start"></ion-icon>
                Cambiar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Estadísticas del evento actual -->
        <ion-card>
          <ion-card-content>
            <ion-row>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.total }}</div>
                  <div class="stat-label">Total</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.sent }}</div>
                  <div class="stat-label">QRs Enviados</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.scanned }}</div>
                  <div class="stat-label">Validados</div>
                </div>
              </ion-col>
              <ion-col size="3">
                <div class="stat-card">
                  <div class="stat-number">{{ eventsStore.currentEventStats.pending }}</div>
                  <div class="stat-label">Pendientes</div>
                </div>
              </ion-col>
            </ion-row>
          </ion-card-content>
        </ion-card>

        <!-- Formulario para añadir invitados -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Añadir Invitados</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">
                Invitados (uno por línea: Nombre, Email, Teléfono [opcional])
              </ion-label>
              <ion-textarea
                v-model="guestInput"
                placeholder="Juan Pérez, juan@email.com, 600123456&#10;María García, maria@email.com&#10;Carlos López, carlos@email.com, 600789012"
                :rows="5"
              ></ion-textarea>
            </ion-item>
            
            <div class="form-buttons">
              <ion-button 
                expand="block" 
                @click="addGuests"
                :disabled="!guestInput.trim() || !currentEvent || isProcessing"
              >
                <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                {{ isProcessing ? 'Procesando...' : 'Añadir Invitados' }}
              </ion-button>
              
              <ion-button 
                expand="block" 
                fill="outline" 
                @click="loadSampleGuests"
                :disabled="!currentEvent || isProcessing"
              >
                <ion-icon :icon="sparklesOutline" slot="start"></ion-icon>
                Cargar Lista de Ejemplo
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Lista de invitados -->
        <ion-card>
          <ion-card-header>
            <div class="list-header">
              <ion-card-title>
                Lista de Invitados ({{ currentEventGuests.length }})
              </ion-card-title>
              <ion-button
                v-if="currentEventGuests.length > 0"
                fill="clear"
                color="danger"
                size="small"
                @click="clearAllGuests"
                :disabled="isProcessing"
              >
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                Limpiar
              </ion-button>
            </div>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list v-if="currentEventGuests.length > 0">
              <ion-item v-for="guest in currentEventGuests" :key="guest.id">
                <ion-avatar slot="start">
                  <div class="avatar-placeholder" :class="getAvatarClass(guest)">
                    {{ guest.name.charAt(0).toUpperCase() }}
                  </div>
                </ion-avatar>
                
                <ion-label>
                  <h2>{{ guest.name }}</h2>
                  <p>{{ guest.email }}</p>
                  <p v-if="guest.phone" class="phone">📞 {{ guest.phone }}</p>
                  <p v-if="guest.table_number" class="table">🪑 Mesa {{ guest.table_number }}</p>
                </ion-label>
                
                <div slot="end" class="guest-actions">
                  <ion-chip 
                    :color="getStatusColor(guest)"
                    size="small"
                  >
                    {{ getStatusText(guest) }}
                  </ion-chip>
                  
                  <ion-button 
                    size="small" 
                    fill="clear"
                    @click="editGuest(guest)"
                    :disabled="isProcessing"
                  >
                    <ion-icon :icon="pencilOutline" slot="icon-only"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
            
            <div v-else class="empty-state">
              <ion-icon :icon="peopleOutline" size="large" color="medium"></ion-icon>
              <h3>{{ currentEvent ? 'No hay invitados en este evento' : 'Selecciona un evento' }}</h3>
              <p>{{ currentEvent ? 'Añade invitados para comenzar' : 'Primero crea o selecciona un evento' }}</p>
              
              <ion-button
                v-if="!currentEvent"
                fill="solid"
                @click="goToEvents"
              >
                <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                Ir a Eventos
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Indicador de carga -->
        <ion-card v-if="isProcessing" class="processing-card">
          <ion-card-content>
            <div class="processing-indicator">
              <ion-spinner name="crescent"></ion-spinner>
              <p>{{ processingMessage }}</p>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <!-- Modal selector de evento -->
    <ion-modal :is-open="showEventSelector" @did-dismiss="showEventSelector = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Seleccionar Evento</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showEventSelector = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content>
        <ion-list>
          <ion-item
            v-for="event in eventsStore.events"
            :key="event.id"
            button
            @click="selectEvent(event)"
            :class="{ 'selected': event.id === eventsStore.currentEventId }"
          >
            <ion-label>
              <h2>{{ event.name }}</h2>
              <p>{{ formatDate(event.date) }}</p>
              <p v-if="event.location">{{ event.location }}</p>
            </ion-label>
            <ion-icon
              v-if="event.id === eventsStore.currentEventId"
              :icon="checkmarkCircleOutline"
              color="primary"
              slot="end"
            ></ion-icon>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-modal>

    <!-- Modal editar invitado -->
    <ion-modal :is-open="showEditModal" @did-dismiss="showEditModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Editar Invitado</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showEditModal = false">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      
      <ion-content class="modal-content">
        <form @submit.prevent="saveEditedGuest" v-if="editingGuest">
          <ion-item>
            <ion-label position="stacked">Nombre</ion-label>
            <ion-input v-model="editingGuest.name" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Email</ion-label>
            <ion-input v-model="editingGuest.email" type="email" required></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Teléfono</ion-label>
            <ion-input v-model="editingGuest.phone"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Mesa</ion-label>
            <ion-input v-model="editingGuest.table_number" placeholder="Número de mesa"></ion-input>
          </ion-item>

          <div class="modal-actions">
            <ion-button expand="block" type="submit" color="primary" :disabled="isProcessing">
              {{ isProcessing ? 'Guardando...' : 'Guardar Cambios' }}
            </ion-button>
            <ion-button expand="block" fill="outline" color="danger" @click="deleteGuest" :disabled="isProcessing">
              {{ isProcessing ? 'Eliminando...' : 'Eliminar Invitado' }}
            </ion-button>
          </div>
        </form>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButton,
  IonList,
  IonAvatar,
  IonChip,
  IonRow,
  IonCol,
  IonIcon,
  IonModal,
  IonButtons,
  IonInput,
  IonSpinner,
  alertController,
  toastController
} from '@ionic/vue'
import {
  personAddOutline,
  sparklesOutline,
  peopleOutline,
  trashOutline,
  pencilOutline,
  calendarOutline,
  swapHorizontalOutline,
  closeOutline,
  checkmarkCircleOutline
} from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { eventsStore, type Guest } from '@/stores/events'
// @ts-ignore
import { supabase } from '@/services/supabase.js'

// Router
const router = useRouter()

// Estado reactivo
const guestInput = ref('')
const showEventSelector = ref(false)
const showEditModal = ref(false)
const editingGuest = ref<Guest | null>(null)
const isProcessing = ref(false)
const processingMessage = ref('')

// Computed properties
const currentEvent = computed(() => eventsStore.currentEvent)
const currentEventGuests = computed(() => eventsStore.currentEventGuests)

// Inicializar
onMounted(async () => {
  try {
    console.log('🏁 Inicializando GuestsTab...')
    
    isProcessing.value = true
    processingMessage.value = 'Cargando eventos y invitados...'
    
    await eventsStore.init()
    
    setTimeout(() => {
      if (eventsStore.events.length > 0 && !eventsStore.currentEventId) {
        console.log('🎯 Seleccionando automáticamente el primer evento:', eventsStore.events[0].name)
        eventsStore.setCurrentEvent(eventsStore.events[0].id)
      }
      
      console.log('📊 Estado de GuestsTab:', {
        eventos: eventsStore.events.length,
        eventoActual: eventsStore.currentEvent?.name,
        invitados: eventsStore.currentEventGuests.length
      })
      
      isProcessing.value = false
    }, 100)
    
  } catch (error) {
    console.error('❌ Error inicializando GuestsTab:', error)
    isProcessing.value = false
    
    const toast = await toastController.create({
      message: 'Error conectando con la base de datos. Verificando configuración...',
      duration: 5000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  }
})

// Formatear fecha
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Función para añadir invitados - CORREGIDA para nueva estructura
const addGuests = async () => {
  if (!guestInput.value.trim()) {
    const toast = await toastController.create({
      message: 'Por favor, introduce los datos de los invitados',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }

  if (!currentEvent.value) {
    const toast = await toastController.create({
      message: 'Selecciona un evento primero',
      duration: 3000,
      color: 'warning',
      position: 'top'
    })
    await toast.present()
    return
  }
  
  isProcessing.value = true
  processingMessage.value = 'Procesando invitados...'
  
  try {
    const lines = guestInput.value.trim().split('\n')
    const validGuests = []
    const duplicates = []
    const invalidLines = []
    
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim())
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const name = parts[0]
        const email = parts[1].toLowerCase()
        const phone = parts[2] || null
        
        // Verificar si ya existe usando event_id (nueva estructura)
        const { data: existing } = await supabase
          .from('guests')
          .select('email')
          .eq('email', email)
          .eq('event_id', currentEvent.value.id)
          .single()
        
        if (!existing) {
          validGuests.push({ name, email, phone })
        } else {
          duplicates.push(email)
        }
      } else {
        invalidLines.push(line)
      }
    }
    
    if (validGuests.length === 0) {
      let message = 'No hay invitados válidos para añadir'
      if (duplicates.length > 0) message = 'Todos los emails ya existen'
      if (invalidLines.length > 0) message = 'Formato inválido. Usa: Nombre, Email, Teléfono'
      
      const toast = await toastController.create({
        message,
        duration: 3000,
        color: 'warning',
        position: 'top'
      })
      await toast.present()
      return
    }
    
    processingMessage.value = `Añadiendo ${validGuests.length} invitados...`
    
    // Insertar usando la nueva estructura
    const guestsToInsert = validGuests.map(guest => ({
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      event_id: currentEvent.value!.id,
      event_name: currentEvent.value!.name,
      qr_sent: false,
      has_entered: false,
      created_at: new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('guests')
      .insert(guestsToInsert)
      .select()
    
    if (error) {
      console.error('❌ Error insertando en Supabase:', error)
      throw new Error(`Error de base de datos: ${error.message}`)
    }
    
    // Actualizar el store local - mapear a la estructura esperada
    const newGuests = data.map((guest: any) => ({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      event_id: guest.event_id,
      event_name: guest.event_name,
      qr_sent: guest.qr_sent || false,
      has_entered: guest.has_entered || false,
      table_number: guest.table_number,
      created_at: guest.created_at,
      // Aliases para compatibilidad
      sent: guest.qr_sent || false,
      scanned: guest.has_entered || false,
      table: guest.table_number
    }))
    
    // Añadir al estado local
    eventsStore.guests.push(...newGuests)
    
    guestInput.value = ''
    
    let message = `✅ ${validGuests.length} invitados añadidos`
    if (duplicates.length > 0) message += ` (${duplicates.length} duplicados omitidos)`
    if (invalidLines.length > 0) message += ` (${invalidLines.length} líneas con formato incorrecto)`
    
    const toast = await toastController.create({
      message,
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    
    console.log('✅ Invitados añadidos exitosamente:', newGuests.length)
    
  } catch (error: any) {
    console.error('❌ Error adding guests:', error)
    
    let errorMessage = 'Error desconocido'
    if (error.message.includes('relation "guests" does not exist')) {
      errorMessage = 'La tabla "guests" no existe. Verifica la configuración de Supabase.'
    } else if (error.message.includes('column') && error.message.includes('does not exist')) {
      errorMessage = 'Error de estructura de base de datos. Verifica las columnas de la tabla.'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    const toast = await toastController.create({
      message: `Error al añadir invitados: ${errorMessage}`,
      duration: 5000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    isProcessing.value = false
  }
}

// Función para cargar invitados de ejemplo
const loadSampleGuests = () => {
  const sampleGuests = [
    'Ana García, ana.garcia@email.com, 600123456',
    'Carlos Rodríguez, carlos.rodriguez@email.com',
    'María López, maria.lopez@email.com, 600789012',
    'Juan Martínez, juan.martinez@email.com',
    'Laura Sánchez, laura.sanchez@email.com, 600456789',
    'Pedro Gómez, pedro.gomez@email.com'
  ]
  
  guestInput.value = sampleGuests.join('\n')
}

// Selector de evento
const openEventSelector = () => {
  if (eventsStore.events.length <= 1) {
    toastController.create({
      message: 'Solo hay un evento disponible',
      duration: 2000,
      color: 'medium',
      position: 'top'
    }).then(toast => toast.present())
    return
  }
  showEventSelector.value = true
}

const selectEvent = (event: any) => {
  console.log('🎯 Cambiando a evento:', event.name)
  eventsStore.setCurrentEvent(event.id)
  showEventSelector.value = false
  
  toastController.create({
    message: `Evento seleccionado: ${event.name}`,
    duration: 2000,
    color: 'success',
    position: 'top'
  }).then(toast => toast.present())
}

// Editar invitado
const editGuest = (guest: Guest) => {
  editingGuest.value = { ...guest }
  showEditModal.value = true
}

const saveEditedGuest = async () => {
  if (!editingGuest.value) return
  
  isProcessing.value = true
  processingMessage.value = 'Guardando cambios...'
  
  try {
    const { data, error } = await supabase
      .from('guests')
      .update({
        name: editingGuest.value.name,
        email: editingGuest.value.email.toLowerCase(),
        phone: editingGuest.value.phone || null,
        table_number: editingGuest.value.table_number || null
      })
      .eq('id', editingGuest.value.id)
      .select()
      .single()
    
    if (error) throw error
    
    // Actualizar en el estado local
    const index = eventsStore.guests.findIndex(g => g.id === editingGuest.value!.id)
    if (index !== -1) {
      eventsStore.guests[index] = {
        ...eventsStore.guests[index],
        name: data.name,
        email: data.email,
        phone: data.phone,
        table_number: data.table_number,
        table: data.table_number // Alias para compatibilidad
      }
    }
    
    showEditModal.value = false
    editingGuest.value = null
    
    const toast = await toastController.create({
      message: 'Cambios guardados exitosamente',
      duration: 3000,
      color: 'success',
      position: 'top'
    })
    await toast.present()
    
    console.log('✅ Invitado actualizado:', data.name)
    
  } catch (error: any) {
    console.error('❌ Error saving guest:', error)
    
    const toast = await toastController.create({
      message: `Error guardando cambios: ${error.message}`,
      duration: 4000,
      color: 'danger',
      position: 'top'
    })
    await toast.present()
  } finally {
    isProcessing.value = false
  }
}

const deleteGuest = async () => {
  if (!editingGuest.value) return
  
  const alert = await alertController.create({
    header: 'Eliminar Invitado',
    message: `¿Estás seguro de eliminar a "${editingGuest.value.name}"?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { 
        text: 'Eliminar', 
        role: 'destructive', 
        handler: async () => {
          isProcessing.value = true
          processingMessage.value = 'Eliminando invitado...'
          
          try {
            const { error } = await supabase
              .from('guests')
              .delete()
              .eq('id', editingGuest.value!.id)
            
            if (error) throw error
            
            // Remover del estado local
            const index = eventsStore.guests.findIndex(g => g.id === editingGuest.value!.id)
            if (index !== -1) {
              eventsStore.guests.splice(index, 1)
            }
            
            showEditModal.value = false
            editingGuest.value = null
            
            const toast = await toastController.create({
              message: 'Invitado eliminado exitosamente',
              duration: 3000,
              color: 'success',
              position: 'top'
            })
            await toast.present()
            
          } catch (error: any) {
            console.error('❌ Error deleting guest:', error)
            
            const toast = await toastController.create({
              message: `Error eliminando invitado: ${error.message}`,
              duration: 4000,
              color: 'danger',
              position: 'top'
            })
            await toast.present()
          } finally {
            isProcessing.value = false
          }
        }
      }
    ]
  })
  await alert.present()
}

// Funciones de utilidad
const getStatusColor = (guest: Guest) => {
  if (guest.has_entered || guest.scanned) return 'success'
  if (guest.qr_sent || guest.sent) return 'warning'
  return 'medium'
}

const getStatusText = (guest: Guest) => {
  if (guest.has_entered || guest.scanned) return 'VALIDADO'
  if (guest.qr_sent || guest.sent) return 'QR ENVIADO'
  return 'PENDIENTE'
}

const getAvatarClass = (guest: Guest) => {
  if (guest.has_entered || guest.scanned) return 'entered'
  if (guest.qr_sent || guest.sent) return 'sent'
  return 'pending'
}

// Limpiar todos los invitados
const clearAllGuests = async () => {
  if (!currentEvent.value || currentEventGuests.value.length === 0) {
    const toast = await toastController.create({
      message: 'No hay invitados para eliminar',
      duration: 2000,
      color: 'medium',
      position: 'top'
    })
    await toast.present()
    return
  }

  const alert = await alertController.create({
    header: 'Limpiar Lista',
    message: `¿Estás seguro de eliminar todos los ${currentEventGuests.value.length} invitados de "${currentEvent.value.name}"?`,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { 
        text: 'Eliminar Todo', 
        role: 'destructive', 
        handler: async () => {
          isProcessing.value = true
          processingMessage.value = 'Eliminando todos los invitados...'
          
          try {
            // Eliminar usando event_id (nueva estructura)
            const { error } = await supabase
              .from('guests')
              .delete()
              .eq('event_id', currentEvent.value!.id)
            
            if (error) throw error
            
            // Actualizar estado local
            const guestsToRemove = currentEventGuests.value.map(g => g.id)
            const filteredGuests = eventsStore.guests.filter(g => !guestsToRemove.includes(g.id))
            
            eventsStore.guests.length = 0
            eventsStore.guests.push(...filteredGuests)
            
            const toast = await toastController.create({
              message: `${currentEventGuests.value.length} invitados eliminados exitosamente`,
              duration: 3000,
              color: 'success',
              position: 'top'
            })
            await toast.present()
            
            console.log('✅ Todos los invitados eliminados del evento:', currentEvent.value?.name)
            
          } catch (error: any) {
            console.error('❌ Error clearing guests:', error)
            
            const toast = await toastController.create({
              message: `Error eliminando invitados: ${error.message}`,
              duration: 4000,
              color: 'danger',
              position: 'top'
            })
            await toast.present()
          } finally {
            isProcessing.value = false
          }
        }
      }
    ]
  })
  await alert.present()
}

// Ir a eventos
const goToEvents = () => {
  router.push('/tabs/events')
}
</script>

<style scoped>
.guests-container {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.event-selector {
  margin-bottom: 16px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.event-info h2 {
  margin: 0 0 4px 0;
  color: var(--ion-color-primary);
}

.event-info p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

.stat-card {
  text-align: center;
  padding: 16px 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 4px;
}

.form-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background: #6c757d;
}

.avatar-placeholder.pending {
  background: #6c757d;
}

.avatar-placeholder.sent {
  background: #ffc107;
}

.avatar-placeholder.entered {
  background: #28a745;
}

.guest-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.phone, .table {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--ion-color-medium);
}

.empty-state ion-icon {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: var(--ion-color-dark);
}

.empty-state p {
  margin: 0 0 16px 0;
}

.modal-content {
  padding: 16px;
}

.modal-actions {
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.processing-card {
  margin-top: 16px;
  background: var(--ion-color-light);
}

.processing-indicator {
  text-align: center;
  padding: 16px;
}

.processing-indicator ion-spinner {
  margin-bottom: 12px;
}

.processing-indicator p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
}

ion-item.selected {
  --background: var(--ion-color-primary-tint);
}

/* Responsive */
@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .stat-card {
    padding: 12px 4px;
  }
  
  .stat-number {
    font-size: 1.2rem;
  }
}
</style>