<template>
  <div class="audio-settings-section">
    <div class="section-header">
      <h3>
        <ion-icon :icon="volumeHighOutline"></ion-icon>
        Configuración de Audio
      </h3>
    </div>
    
    <div class="audio-controls">
      <!-- Habilitar/Deshabilitar sonidos -->
      <ion-item>
        <ion-icon :icon="volumeHighOutline" slot="start"></ion-icon>
        <ion-label>
          <h3>Sonidos de Validación</h3>
          <p>Reproducir sonidos al escanear códigos QR</p>
        </ion-label>
        <ion-toggle 
          v-model="audioEnabled" 
          @ionChange="toggleAudio"
        ></ion-toggle>
      </ion-item>

      <!-- Control de volumen -->
      <ion-item v-if="audioEnabled">
        <ion-icon :icon="volumeMediumOutline" slot="start"></ion-icon>
        <ion-label>
          <h3>Volumen</h3>
          <p>Ajustar nivel de sonido</p>
        </ion-label>
        <ion-range
          :value="audioVolume"
          min="0"
          max="1"
          step="0.1"
          @ionInput="changeVolume"
          class="volume-range"
        >
          <ion-icon :icon="volumeLowOutline" slot="start"></ion-icon>
          <ion-icon :icon="volumeHighOutline" slot="end"></ion-icon>
        </ion-range>
      </ion-item>

      <!-- Botones de prueba -->
      <div v-if="audioEnabled" class="test-buttons">
        <ion-button 
          size="small" 
          fill="outline" 
          color="success"
          @click="testSound('success')"
        >
          <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
          Éxito
        </ion-button>
        
        <ion-button 
          size="small" 
          fill="outline" 
          color="warning"
          @click="testSound('warning')"
        >
          <ion-icon :icon="warningOutline" slot="start"></ion-icon>
          Advertencia
        </ion-button>
        
        <ion-button 
          size="small" 
          fill="outline" 
          color="danger"
          @click="testSound('error')"
        >
          <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
          Error
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonRange,
  IonButton,
  IonIcon
} from '@ionic/vue'
import {
  volumeHighOutline,
  volumeMediumOutline,
  volumeLowOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline
} from 'ionicons/icons'
import { audioFeedback } from '@/services/audio.js'

// Estado reactivo
const audioEnabled = ref(true)
const audioVolume = ref(0.3)

// Cargar configuración al montar
onMounted(() => {
  audioEnabled.value = audioFeedback.isEnabled
  audioVolume.value = audioFeedback.volume
})

// Alternar audio
const toggleAudio = (event) => {
  const enabled = event.detail.checked
  audioEnabled.value = enabled
  audioFeedback.setEnabled(enabled)
  
  if (enabled) {
    // Reproducir sonido de confirmación
    setTimeout(() => audioFeedback.playFeedback('success'), 100)
  }
}

// Cambiar volumen
const changeVolume = (event) => {
  const volume = event.detail.value
  audioVolume.value = volume
  audioFeedback.setVolume(volume)
}

// Probar sonido
const testSound = (type) => {
  audioFeedback.playFeedback(type)
}
</script>

<style scoped>
.audio-settings-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.volume-range {
  --bar-background: #e5e7eb;
  --bar-background-active: #0d1b2a;
  --knob-background: #0d1b2a;
  --knob-border: #0d1b2a;
  --pin-background: #0d1b2a;
  --pin-color: white;
}

.test-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

ion-item {
  --background: #f8f9fa;
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  margin-bottom: 12px;
}

ion-toggle {
  --background: #e5e7eb;
  --background-checked: #0d1b2a;
  --handle-background: white;
  --handle-background-checked: white;
}

/* Responsive */
@media (max-width: 768px) {
  .test-buttons {
    flex-direction: column;
    gap: 8px;
  }
  
  .audio-settings-section {
    padding: 16px;
  }
}
</style>