<template>
  <div class="pdf-generator">
    <div class="pdf-options">
      <ion-button 
        expand="block" 
        @click="generatePDF('attendees')"
        :disabled="attendedCount === 0 || isGenerating"
        color="success"
      >
        <ion-icon name="document-text-outline" slot="start"></ion-icon>
        {{ isGenerating ? 'Generando...' : `PDF Solo Asistentes (${attendedCount})` }}
      </ion-button>
      
      <ion-button 
        expand="block" 
        @click="generatePDF('full')"
        :disabled="totalCount === 0 || isGenerating"
        color="primary"
      >
        <ion-icon name="analytics-outline" slot="start"></ion-icon>
        {{ isGenerating ? 'Generando...' : 'PDF Reporte Completo' }}
      </ion-button>
      
      <ion-button 
        expand="block" 
        @click="generatePDF('guest-list')"
        :disabled="totalCount === 0 || isGenerating"
        color="secondary"
        fill="outline"
      >
        <ion-icon name="list-outline" slot="start"></ion-icon>
        {{ isGenerating ? 'Generando...' : 'PDF Lista de Invitados' }}
      </ion-button>
    </div>
    
    <div v-if="lastGenerated" class="generation-status">
      <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
      <span>Último PDF generado: {{ formatDate(lastGenerated) }}</span>
    </div>
    
    <div v-if="error" class="error-status">
      <ion-icon name="warning-outline" color="danger"></ion-icon>
      <span>{{ error }}</span>
    </div>
    
    <!-- Configuración avanzada -->
    <ion-accordion-group v-if="showAdvanced">
      <ion-accordion value="config">
        <ion-item slot="header">
          <ion-label>Configuración Avanzada</ion-label>
        </ion-item>
        
        <div slot="content" class="advanced-config">
          <ion-item>
            <ion-label>Tamaño de fuente</ion-label>
            <ion-select v-model="pdfConfig.size" placeholder="Seleccionar">
              <ion-select-option value="small">Pequeño</ion-select-option>
              <ion-select-option value="large">Grande</ion-select-option>
              <ion-select-option value="compact">Compacto</ion-select-option>
            </ion-select>
          </ion-item>
          
          <ion-item>
            <ion-label>Incluir estadísticas por hora</ion-label>
            <ion-checkbox v-model="pdfConfig.includeHourlyStats"></ion-checkbox>
          </ion-item>
          
          <ion-item>
            <ion-label>Incluir códigos QR</ion-label>
            <ion-checkbox v-model="pdfConfig.includeQRCodes"></ion-checkbox>
          </ion-item>
        </div>
      </ion-accordion>
    </ion-accordion-group>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import {
  IonButton, IonIcon, IonItem, IonLabel, IonSelect, 
  IonSelectOption, IonCheckbox, IonAccordionGroup, IonAccordion
} from '@ionic/vue'
import {
  documentTextOutline, analyticsOutline, listOutline,
  checkmarkCircleOutline, warningOutline
} from 'ionicons/icons'

// Props
const props = defineProps({
  totalCount: {
    type: Number,
    default: 0
  },
  attendedCount: {
    type: Number,
    default: 0
  },
  showAdvanced: {
    type: Boolean,
    default: false
  }
})

// Events
const emit = defineEmits(['generate-pdf'])

// Estado
const isGenerating = ref(false)
const lastGenerated = ref(null)
const error = ref('')

const pdfConfig = ref({
  size: 'large',
  includeHourlyStats: true,
  includeQRCodes: false
})

// Métodos
const generatePDF = async (type) => {
  try {
    isGenerating.value = true
    error.value = ''
    
    const config = {
      type,
      config: pdfConfig.value
    }
    
    await emit('generate-pdf', config)
    
    lastGenerated.value = new Date().toISOString()
    
  } catch (err) {
    error.value = err.message || 'Error al generar PDF'
  } finally {
    isGenerating.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Exponer métodos para uso externo
defineExpose({
  generatePDF,
  isGenerating,
  lastGenerated,
  error
})
</script>

<style scoped>
.pdf-generator {
  width: 100%;
}

.pdf-options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.generation-status,
.error-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.generation-status {
  background: #d4edda;
  color: #155724;
}

.error-status {
  background: #f8d7da;
  color: #721c24;
}

.advanced-config {
  padding: 1rem;
  background: #f8f9fa;
}

.advanced-config ion-item {
  --background: transparent;
  --padding-start: 0;
}

@media (max-width: 576px) {
  .pdf-options {
    gap: 0.6rem;
  }
  
  .generation-status,
  .error-status {
    font-size: 0.8rem;
    padding: 0.6rem;
  }
}
</style>