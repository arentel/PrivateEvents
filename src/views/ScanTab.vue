<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>📱 Validar Entradas</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <!-- Scanner QR -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Escanear Código QR</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div class="scanner-container">
            <div v-if="!scannerActive" class="scanner-placeholder">
              <ion-icon name="qr-code-outline" size="large"></ion-icon>
              <p>Toca el botón para activar la cámara</p>
            </div>
            <div 
              id="qr-reader" 
              v-show="scannerActive"
              class="qr-scanner"
            ></div>
          </div>
          
          <ion-button 
            expand="block" 
            @click="toggleScanner"
            :color="scannerActive ? 'danger' : 'primary'"
          >
            <ion-icon 
              :name="scannerActive ? 'stop-circle-outline' : 'scan-outline'" 
              slot="start"
            ></ion-icon>
            {{ scannerActive ? 'Parar Cámara' : 'Activar Cámara' }}
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Validación manual -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Validación Manual</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Buscar por nombre o email</ion-label>
            <ion-input 
              v-model="manualSearch"
              placeholder="Nombre del invitado o email"
            ></ion-input>
          </ion-item>
          
          <ion-button 
            expand="block" 
            @click="searchGuest"
            :disabled="!manualSearch.trim()"
          >
            <ion-icon name="search-outline" slot="start"></ion-icon>
            Buscar Invitado
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Resultado de validación -->
      <ion-card v-if="validationResult.show">
        <ion-card-content>
          <div 
            class="validation-result"
            :class="validationResult.type"
          >
            <div class="result-icon">
              <ion-icon 
                :name="getResultIcon()" 
                size="large"
              ></ion-icon>
            </div>
            
            <div class="result-content">
              <h2>{{ validationResult.title }}</h2>
              <div v-if="validationResult.guest" class="guest-details">
                <p><strong>Nombre:</strong> {{ validationResult.guest.name }}</p>
                <p><strong>Email:</strong> {{ validationResult.guest.email }}</p>
                <p><strong>Evento:</strong> {{ validationResult.guest.event_name }}</p>
                <p v-if="validationResult.guest.entered_at">
                  <strong>Entrada anterior:</strong> 
                  {{ formatDate(validationResult.guest.entered_at) }}
                </p>
                <p v-if="validationResult.type === 'success'">
                  <strong>Hora actual:</strong> 
                  {{ formatDate(new Date().toISOString()) }}
                </p>
              </div>
              <p class="result-message">{{ validationResult.message }}</p>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Estadísticas de validación -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Estadísticas del Día</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-row>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ totalValidations }}</div>
                <div class="stat-label">Validaciones</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ successfulEntries }}</div>
                <div class="stat-label">Entradas OK</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-card">
                <div class="stat-number">{{ rejectedEntries }}</div>
                <div class="stat-label">Rechazadas</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-card-content>
      </ion-card>

      <!-- Lista de entradas recientes -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Entradas Recientes</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item v-for="entry in recentEntries" :key="entry.id">
              <ion-avatar slot="start">
                <div class="avatar-placeholder success">
                  {{ entry.name.charAt(0).toUpperCase() }}
                </div>
              </ion-avatar>
              
              <ion-label>
                <h2>{{ entry.name }}</h2>
                <p>{{ entry.email }}</p>
                <p class="timestamp">{{ formatDate(entry.entered_at) }}</p>
              </ion-label>
              
              <ion-chip color="success">
                ENTRÓ
              </ion-chip>
            </ion-item>
            
            <div v-if="recentEntries.length === 0" class="empty-state">
              <p>No hay entradas registradas aún</p>
            </div>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Botón para limpiar validaciones -->
      <ion-button 
        expand="block" 
        color="medium" 
        fill="outline"
        @click="clearValidationStats"
        v-if="totalValidations > 0"
      >
        🗑️ Limpiar Estadísticas
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonIcon,
  IonList, IonAvatar, IonChip, IonToast, IonRow, IonCol
} from '@ionic/vue'
import {
  qrCodeOutline, stopCircleOutline, scanOutline,
  searchOutline, checkmarkCircleOutline, closeCircleOutline,
  warningOutline
} from 'ionicons/icons'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../services/supabase'
import { validateQRCode } from '../services/qr'

// Estado reactivo
const scannerActive = ref(false)
const manualSearch = ref('')
const html5QrCode = ref(null)
const recentEntries = ref([])
const totalValidations = ref(0)
const successfulEntries = ref(0)
const rejectedEntries = ref(0)

const validationResult = ref({
  show: false,
  type: '', // 'success', 'error', 'warning'
  title: '',
  message: '',
  guest: null
})

const toast = ref({
  isOpen: false,
  message: '',
  color: 'success'
})

// Computed properties
const recentEntriesDisplay = computed(() => 
  recentEntries.value.slice(0, 10).sort((a, b) => 
    new Date(b.entered_at) - new Date(a.entered_at)
  )
)

// Función para mostrar toast
const showToast = (message, color = 'success') => {
  toast.value = {
    isOpen: true,
    message,
    color
  }
}

// Función para alternar el scanner
const toggleScanner = async () => {
  if (scannerActive.value) {
    await stopScanner()
  } else {
    await startScanner()
  }
}

// Función para iniciar el scanner
const startScanner = async () => {
  try {
    html5QrCode.value = new Html5Qrcode("qr-reader")
    
    const cameras = await Html5Qrcode.getCameras()
    if (cameras && cameras.length) {
      const cameraId = cameras[0].id
      
      await html5QrCode.value.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanFailure
      )
      
      scannerActive.value = true
      showToast('Cámara activada - Apunta al código QR')
    }
  } catch (error) {
    console.error('Error starting scanner:', error)
    showToast('Error al acceder a la cámara', 'danger')
  }
}

// Función para parar el scanner
const stopScanner = async () => {
  try {
    if (html5QrCode.value && scannerActive.value) {
      await html5QrCode.value.stop()
      html5QrCode.value = null
      scannerActive.value = false
      showToast('Cámara desactivada')
    }
  } catch (error) {
    console.error('Error stopping scanner:', error)
  }
}

// Función llamada cuando se escanea exitosamente
const onScanSuccess = async (decodedText) => {
  await validateScannedCode(decodedText)
}

// Función llamada cuando falla el escaneo (normal)
const onScanFailure = (error) => {
  // No hacer nada - errores de escaneo son normales
}

// Función para validar código escaneado
const validateScannedCode = async (qrCode) => {
  totalValidations.value++
  
  try {
    // Decodificar y validar el QR
    const guestData = await validateQRCode(qrCode)
    
    if (!guestData) {
      showValidationResult('error', '❌ CÓDIGO NO VÁLIDO', 'El código QR no es válido o está corrupto')
      rejectedEntries.value++
      return
    }
    
    // Buscar invitado en la base de datos
    const { data: guest, error } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestData.id)
      .single()
    
    if (error || !guest) {
      showValidationResult('error', '❌ INVITADO NO ENCONTRADO', 'Este invitado no está en la lista')
      rejectedEntries.value++
      return
    }
    
    // Verificar si ya entró
    if (guest.has_entered) {
      showValidationResult(
        'warning', 
        '⚠️ YA INGRESÓ ANTERIORMENTE', 
        'Este invitado ya utilizó su código de entrada',
        guest
      )
      rejectedEntries.value++
      return
    }
    
    // Marcar como entrada exitosa
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        has_entered: true,
        entered_at: new Date().toISOString()
      })
      .eq('id', guest.id)
    
    if (updateError) {
      throw updateError
    }
    
    // Actualizar listas locales
    guest.has_entered = true
    guest.entered_at = new Date().toISOString()
    recentEntries.value.unshift(guest)
    
    showValidationResult(
      'success',
      '✅ BIENVENIDO - ACCESO PERMITIDO',
      'Entrada registrada correctamente',
      guest
    )
    
    successfulEntries.value++
    
    // Auto-ocultar después de unos segundos
    setTimeout(() => {
      validationResult.value.show = false
    }, 5000)
    
  } catch (error) {
    console.error('Error validating QR:', error)
    showValidationResult('error', '❌ ERROR DE VALIDACIÓN', 'Error al procesar el código QR')
    rejectedEntries.value++
  }
}

// Función para buscar invitado manualmente
const searchGuest = async () => {
  if (!manualSearch.value.trim()) return
  
  try {
    const searchTerm = manualSearch.value.trim().toLowerCase()
    
    const { data: guests, error } = await supabase
      .from('guests')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    
    if (error) throw error
    
    if (guests.length === 0) {
      showValidationResult('error', '❌ NO ENCONTRADO', 'No se encontró ningún invitado con ese nombre o email')
      return
    }
    
    if (guests.length > 1) {
      showToast(`Se encontraron ${guests.length} invitados. Sé más específico`, 'warning')
      return
    }
    
    const guest = guests[0]
    
    if (!guest.qr_sent) {
      showValidationResult('warning', '⚠️ SIN QR', 'Este invitado no tiene código QR generado', guest)
      return
    }
    
    // Simular validación del QR del invitado encontrado
    await validateScannedCode(guest.qr_code)
    
  } catch (error) {
    console.error('Error searching guest:', error)
    showToast('Error al buscar invitado', 'danger')
  }
  
  manualSearch.value = ''
}

// Función para mostrar resultado de validación
const showValidationResult = (type, title, message, guest = null) => {
  validationResult.value = {
    show: true,
    type,
    title,
    message,
    guest
  }
}

// Función para obtener icono según el resultado
const getResultIcon = () => {
  switch (validationResult.value.type) {
    case 'success':
      return checkmarkCircleOutline
    case 'warning':
      return warningOutline
    case 'error':
    default:
      return closeCircleOutline
  }
}

// Función para limpiar estadísticas
const clearValidationStats = () => {
  if (confirm('¿Limpiar todas las estadísticas de validación?')) {
    totalValidations.value = 0
    successfulEntries.value = 0
    rejectedEntries.value = 0
    recentEntries.value = []
    showToast('Estadísticas limpiadas')
  }
}

// Función para formatear fecha
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar entradas recientes al montar
onMounted(async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('has_entered', true)
      .order('entered_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    recentEntries.value = data || []
    successfulEntries.value = data?.length || 0
  } catch (error) {
    console.error('Error loading recent entries:', error)
  }
})

// Limpiar scanner al desmontar
onUnmounted(() => {
  if (scannerActive.value) {
    stopScanner()
  }
})
</script>

<style scoped>
.scanner-container {
  text-align: center;
  padding: 1rem;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-placeholder {
  color: #666;
}

.qr-scanner {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}

.validation-result {
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.validation-result.success {
  background: #d4edda;
  color: #155724;
  border: 2px solid #28a745;
}

.validation-result.warning {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
}

.validation-result.error {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #dc3545;
}

.result-icon {
  margin-bottom: 1rem;
}

.result-content h2 {
  margin-bottom: 1rem;
  font-weight: bold;
}

.guest-details {
  background: rgba(255, 255, 255, 0.7);
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  text-align: left;
}

.guest-details p {
  margin-bottom: 0.5rem;
}

.result-message {
  font-style: italic;
  margin-top: 1rem;
}

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

.avatar-placeholder.success {
  background: #28a745;
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