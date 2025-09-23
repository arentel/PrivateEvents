<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>👥 Lista de Invitados</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Formulario para añadir invitados -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Añadir Invitados</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Nombre del evento</ion-label>
            <ion-input 
              v-model="eventName" 
              placeholder="Ej: Fiesta de Verano 2024"
            ></ion-input>
          </ion-item>
          
          <ion-item>
            <ion-label position="stacked">
              Invitados (uno por línea: Nombre, Email)
            </ion-label>
            <ion-textarea
              v-model="guestInput"
              placeholder="Juan Pérez, juan@email.com&#10;María García, maria@email.com"
              rows="5"
            ></ion-textarea>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="addGuests"
            :disabled="!guestInput.trim()"
          >
            ➕ Añadir Invitados
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            @click="loadSampleGuests"
          >
            🎯 Cargar Lista de Ejemplo
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas -->
      <ion-card>
        <ion-card-content>
          <ion-row>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ totalGuests }}</div>
                <div class="stat-label">Total</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ qrsSent }}</div>
                <div class="stat-label">QRs Enviados</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ guestsEntered }}</div>
                <div class="stat-label">Entraron</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-card-content>
      </ion-card>

      <!-- Lista de invitados -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Lista de Invitados ({{ guests.length }})</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list v-if="guests.length > 0">
            <ion-item v-for="guest in guests" :key="guest.id">
              <ion-avatar slot="start">
                <div class="avatar-placeholder">
                  {{ guest.name.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              
              <ion-label>
                <h2>{{ guest.name }}</h2>
                <p>{{ guest.email }}</p>
                <p v-if="guest.qr_sent_at" class="timestamp">
                  QR enviado: {{ formatDate(guest.qr_sent_at) }}
                </p>
                <p v-if="guest.entered_at" class="timestamp">
                  Entró: {{ formatDate(guest.entered_at) }}
                </p>
              </ion-label>
              
              <ion-chip 
                slot="end" 
                :color="getStatusColor(guest)"
              >
                {{ getStatusText(guest) }}
              </ion-chip>
            </ion-item>
          </ion-list>
          
          <div v-else class="empty-state">
            <p>No hay invitados en la lista</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Botón para limpiar -->
      <ion-button 
        expand="block" 
        color="danger" 
        fill="outline"
        @click="clearAllGuests"
        v-if="guests.length > 0"
      >
        🗑️ Limpiar Lista Completa
      </ion-button>

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
  IonItem, IonLabel, IonInput, IonTextarea, IonButton,
  IonList, IonAvatar, IonChip, IonToast, IonRow, IonCol
} from '@ionic/vue'
import { supabase } from '../services/supabase'

// Estado reactivo
const eventName = ref('Fiesta de Verano 2024')
const guestInput = ref('')
const guests = ref([])
const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties para estadísticas
const totalGuests = computed(() => guests.value.length)
const qrsSent = computed(() => guests.value.filter(g => g.qr_sent).length)
const guestsEntered = computed(() => guests.value.filter(g => g.has_entered).length)

// Función para mostrar toast
const showToast = (message, color = 'success') => {
  toast.value = {
    isOpen: true,
    message,
    color
  }
}

// Función para cargar invitados desde la base de datos
const loadGuests = async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    guests.value = data || []
  } catch (error) {
    console.error('Error loading guests:', error)
    showToast('Error al cargar invitados', 'danger')
  }
}

// Función para añadir invitados
const addGuests = async () => {
  if (!guestInput.value.trim()) return
  
  const lines = guestInput.value.trim().split('\n')
  const newGuests = []
  
  for (const line of lines) {
    const parts = line.split(',').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      const name = parts[0]
      const email = parts[1]
      
      // Verificar si ya existe
      const exists = guests.value.find(g => 
        g.email.toLowerCase() === email.toLowerCase()
      )
      
      if (!exists) {
        newGuests.push({
          name,
          email,
          event_name: eventName.value
        })
      }
    }
  }
  
  if (newGuests.length === 0) {
    showToast('No hay invitados válidos para añadir', 'warning')
    return
  }
  
  try {
    const { data, error } = await supabase
      .from('guests')
      .insert(newGuests)
      .select()
    
    if (error) throw error
    
    guestInput.value = ''
    await loadGuests()
    showToast(`✅ ${newGuests.length} invitados añadidos`)
  } catch (error) {
    console.error('Error adding guests:', error)
    showToast('Error al añadir invitados', 'danger')
  }
}

// Función para cargar invitados de ejemplo
const loadSampleGuests = () => {
  const sampleGuests = [
    'Ana García, ana.garcia@email.com',
    'Carlos Rodríguez, carlos.rodriguez@email.com',
    'María López, maria.lopez@email.com',
    'Juan Martínez, juan.martinez@email.com',
    'Laura Sánchez, laura.sanchez@email.com',
    'Pedro Gómez, pedro.gomez@email.com'
  ]
  
  guestInput.value = sampleGuests.join('\n')
}

// Función para limpiar todos los invitados
const clearAllGuests = async () => {
  if (!confirm('¿Estás seguro de eliminar todos los invitados? Esta acción no se puede deshacer.')) {
    return
  }
  
  try {
    const { error } = await supabase
      .from('guests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Eliminar todos
    
    if (error) throw error
    
    guests.value = []
    showToast('✅ Lista limpiada completamente')
  } catch (error) {
    console.error('Error clearing guests:', error)
    showToast('Error al limpiar lista', 'danger')
  }
}

// Funciones de utilidad
const getStatusColor = (guest) => {
  if (guest.has_entered) return 'success'
  if (guest.qr_sent) return 'warning'
  return 'medium'
}

const getStatusText = (guest) => {
  if (guest.has_entered) return 'ENTRÓ'
  if (guest.qr_sent) return 'QR ENVIADO'
  return 'PENDIENTE'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar datos al montar el componente
onMounted(() => {
  loadGuests()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 1rem;
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
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.timestamp {
  font-size: 0.8rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>