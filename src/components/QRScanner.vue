<template>
  <div class="qr-scanner">
    <div class="scanner-container">
      <div v-if="!isActive" class="scanner-placeholder">
        <ion-icon name="qr-code-outline" size="large" color="medium"></ion-icon>
        <p>{{ placeholderText }}</p>
      </div>
      
      <div 
        id="qr-reader" 
        v-show="isActive"
        class="qr-reader"
      ></div>
      
      <div v-if="isActive" class="scanner-overlay">
        <div class="scanner-frame"></div>
      </div>
    </div>
    
    <div class="scanner-controls">
      <ion-button 
        expand="block" 
        @click="toggleScanner"
        :color="isActive ? 'danger' : 'primary'"
        :disabled="isLoading"
      >
        <ion-icon 
          :name="isActive ? 'stop-circle-outline' : 'scan-outline'" 
          slot="start"
        ></ion-icon>
        {{ getScannerButtonText() }}
      </ion-button>
      
      <div v-if="error" class="error-message">
        <ion-icon name="warning-outline" color="danger"></ion-icon>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { 
  qrCodeOutline, stopCircleOutline, scanOutline, warningOutline 
} from 'ionicons/icons'
import { Html5Qrcode } from 'html5-qrcode'

// Props
const props = defineProps({
  placeholderText: {
    type: String,
    default: 'Toca el botón para activar la cámara'
  }
})

// Events
const emit = defineEmits(['qr-scanned', 'scanner-error'])

// Estado
const isActive = ref(false)
const isLoading = ref(false)
const error = ref('')
const html5QrCode = ref(null)

// Métodos
const toggleScanner = async () => {
  if (isActive.value) {
    await stopScanner()
  } else {
    await startScanner()
  }
}

const startScanner = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
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
      
      isActive.value = true
    } else {
      throw new Error('No se encontraron cámaras disponibles')
    }
  } catch (err) {
    error.value = err.message || 'Error al acceder a la cámara'
    emit('scanner-error', error.value)
  } finally {
    isLoading.value = false
  }
}

const stopScanner = async () => {
  try {
    if (html5QrCode.value && isActive.value) {
      await html5QrCode.value.stop()
      html5QrCode.value = null
      isActive.value = false
      error.value = ''
    }
  } catch (err) {
    console.error('Error stopping scanner:', err)
  }
}

const onScanSuccess = (decodedText) => {
  emit('qr-scanned', decodedText)
}

const onScanFailure = (error) => {
  // Los errores de escaneo son normales, no mostrar
}

const getScannerButtonText = () => {
  if (isLoading.value) return 'Cargando...'
  if (isActive.value) return 'Parar Cámara'
  return 'Activar Cámara'
}

// Lifecycle
onUnmounted(() => {
  if (isActive.value) {
    stopScanner()
  }
})
</script>

<style scoped>
.qr-scanner {
  width: 100%;
}

.scanner-container {
  position: relative;
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
  margin-bottom: 1rem;
}

.scanner-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #666;
  background: #f8f9fa;
}

.scanner-placeholder p {
  margin-top: 1rem;
  text-align: center;
}

.qr-reader {
  width: 100%;
  height: 300px;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.scanner-frame {
  width: 250px;
  height: 250px;
  border: 3px solid #007bff;
  border-radius: 12px;
  background: transparent;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
}

.scanner-controls {
  text-align: center;
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  font-size: 0.9rem;
}

@media (max-width: 576px) {
  .scanner-container {
    min-height: 250px;
  }
  
  .scanner-placeholder {
    height: 250px;
  }
  
  .qr-reader {
    height: 250px;
  }
  
  .scanner-frame {
    width: 200px;
    height: 200px;
  }
}
</style>