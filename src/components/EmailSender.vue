<template>
  <div class="email-sender">
    <ion-item>
      <ion-label>
        <h2>Envío automático</h2>
        <p>{{ autoSendEnabled ? 'Activado - Los QRs se envían automáticamente' : 'Desactivado - Envío manual' }}</p>
      </ion-label>
      <ion-toggle 
        v-model="autoSendEnabled"
        @ionChange="$emit('toggle-auto-send', autoSendEnabled)"
      ></ion-toggle>
    </ion-item>
    
    <ion-button 
      expand="block" 
      @click="$emit('send-all')"
      :disabled="isSending || pendingCount === 0"
      color="success"
    >
      <ion-icon name="mail-outline" slot="start"></ion-icon>
      {{ isSending ? 'Enviando...' : `Enviar QRs (${pendingCount})` }}
    </ion-button>
    
    <!-- Barra de progreso -->
    <div v-if="isSending" class="progress-container">
      <ion-progress-bar 
        :value="progress"
        color="success"
      ></ion-progress-bar>
      <p class="progress-text">
        {{ currentStatus }} ({{ sentCount }}/{{ totalToSend }})
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineEmits, defineProps } from 'vue'
import {
  IonItem, IonLabel, IonToggle, IonButton, 
  IonIcon, IonProgressBar
} from '@ionic/vue'
import { mailOutline } from 'ionicons/icons'

// Props
const props = defineProps({
  autoSendEnabled: {
    type: Boolean,
    default: false
  },
  isSending: {
    type: Boolean,
    default: false
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    default: 0
  },
  currentStatus: {
    type: String,
    default: ''
  },
  sentCount: {
    type: Number,
    default: 0
  },
  totalToSend: {
    type: Number,
    default: 0
  }
})

// Events
const emit = defineEmits(['toggle-auto-send', 'send-all'])
</script>

<style scoped>
.email-sender {
  padding: 1rem;
}

.progress-container {
  margin-top: 1rem;
}

.progress-text {
  text-align: center;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}
</style>