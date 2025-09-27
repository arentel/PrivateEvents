<template>
  <div v-if="show" class="loading-overlay" :class="overlayClass">
    <div class="loading-container" :class="containerClass">
      <!-- Spinner personalizable -->
      <div v-if="type === 'spinner'" class="loading-spinner">
        <ion-spinner :name="spinnerType" :color="color"></ion-spinner>
      </div>
      
      <!-- Skeleton loader -->
      <div v-else-if="type === 'skeleton'" class="skeleton-container">
        <div class="skeleton-item" v-for="n in skeletonLines" :key="n"></div>
      </div>
      
      <!-- Dots loader -->
      <div v-else-if="type === 'dots'" class="dots-loader">
        <div class="dot" v-for="n in 3" :key="n"></div>
      </div>
      
      <!-- Pulse loader -->
      <div v-else-if="type === 'pulse'" class="pulse-loader">
        <div class="pulse-circle"></div>
      </div>

      <!-- Mensaje de loading -->
      <div v-if="message" class="loading-message">
        {{ message }}
      </div>

      <!-- Mensaje de progreso -->
      <div v-if="progress !== null" class="loading-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>

      <!-- Botón de cancelar (opcional) -->
      <ion-button 
        v-if="showCancel && onCancel" 
        fill="clear" 
        size="small"
        @click="onCancel"
        class="cancel-button"
      >
        Cancelar
      </ion-button>

      <!-- Botón de reintentar (opcional) -->
      <ion-button 
        v-if="showRetry && onRetry" 
        fill="outline" 
        size="small"
        @click="onRetry"
        class="retry-button"
      >
        Reintentar
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IonSpinner, IonButton } from '@ionic/vue'

const props = defineProps({
  // Control básico
  show: {
    type: Boolean,
    default: false
  },
  
  // Tipo de loader
  type: {
    type: String,
    default: 'spinner', // 'spinner', 'skeleton', 'dots', 'pulse'
    validator: (value) => ['spinner', 'skeleton', 'dots', 'pulse'].includes(value)
  },
  
  // Configuración del spinner
  spinnerType: {
    type: String,
    default: 'circular' // ionic spinner names
  },
  
  color: {
    type: String,
    default: 'primary'
  },
  
  // Mensajes
  message: {
    type: String,
    default: ''
  },
  
  // Progreso (0-100)
  progress: {
    type: Number,
    default: null
  },
  
  // Skeleton lines
  skeletonLines: {
    type: Number,
    default: 3
  },
  
  // Overlay
  overlay: {
    type: Boolean,
    default: false
  },
  
  fullscreen: {
    type: Boolean,
    default: false
  },
  
  // Acciones
  showCancel: {
    type: Boolean,
    default: false
  },
  
  showRetry: {
    type: Boolean,
    default: false
  },
  
  // Tamaño
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['cancel', 'retry'])

const onCancel = () => emit('cancel')
const onRetry = () => emit('retry')

const overlayClass = computed(() => ({
  'loading-overlay--fullscreen': props.fullscreen,
  'loading-overlay--modal': props.overlay && !props.fullscreen
}))

const containerClass = computed(() => ({
  [`loading-container--${props.size}`]: true,
  'loading-container--with-actions': props.showCancel || props.showRetry
}))
</script>

<style scoped>
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.loading-overlay--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  z-index: 9999;
}

.loading-overlay--modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 300px;
}

.loading-container--small {
  max-width: 200px;
}

.loading-container--large {
  max-width: 400px;
}

.loading-container--with-actions {
  gap: 16px;
}

/* Spinner styles */
.loading-spinner {
  margin-bottom: 12px;
}

/* Skeleton loader */
.skeleton-container {
  width: 100%;
  margin-bottom: 12px;
}

.skeleton-item {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-item:last-child {
  margin-bottom: 0;
  width: 60%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Dots loader */
.dots-loader {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  animation: dots-bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes dots-bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* Pulse loader */
.pulse-loader {
  margin-bottom: 12px;
}

.pulse-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  animation: pulse-scale 1s infinite ease-in-out;
}

@keyframes pulse-scale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

/* Messages */
.loading-message {
  color: var(--ion-color-medium);
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

/* Progress */
.loading-progress {
  width: 100%;
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--ion-color-light);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
  transition: width 0.3s ease;
  border-radius: 3px;
}

.progress-text {
  font-size: 12px;
  color: var(--ion-color-medium);
}

/* Action buttons */
.cancel-button,
.retry-button {
  margin-top: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
}

/* Responsive */
@media (max-width: 576px) {
  .loading-container {
    max-width: 250px;
    padding: 0 16px;
  }
  
  .loading-message {
    font-size: 13px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-overlay--fullscreen {
    background: rgba(0, 0, 0, 0.9);
  }
  
  .loading-overlay--modal {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .skeleton-item {
    background: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%);
  }
}</style>