<template>
  <div class="guest-list">
    <ion-list v-if="guests.length > 0">
      <ion-item v-for="guest in guests" :key="guest.id">
        <ion-avatar slot="start">
          <div class="avatar-placeholder" :class="getAvatarClass(guest)">
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
        
        <div slot="end" class="guest-actions">
          <ion-chip 
            :color="getStatusColor(guest)"
            size="small"
          >
            {{ getStatusText(guest) }}
          </ion-chip>
          
          <ion-button 
            v-if="showActions"
            size="small" 
            fill="clear"
            @click="$emit('guest-action', guest)"
          >
            <ion-icon name="ellipsis-vertical"></ion-icon>
          </ion-button>
        </div>
      </ion-item>
    </ion-list>
    
    <div v-else class="empty-state">
      <ion-icon name="people-outline" size="large" color="medium"></ion-icon>
      <h3>{{ emptyMessage || 'No hay invitados en la lista' }}</h3>
      <p>{{ emptySubtitle || 'Añade invitados para comenzar' }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import {
  IonList, IonItem, IonAvatar, IonLabel, 
  IonChip, IonButton, IonIcon
} from '@ionic/vue'
import { peopleOutline, ellipsisVertical } from 'ionicons/icons'

// Props
const props = defineProps({
  guests: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: false
  },
  emptyMessage: {
    type: String,
    default: ''
  },
  emptySubtitle: {
    type: String,
    default: ''
  }
})

// Events
const emit = defineEmits(['guest-action'])

// Métodos
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

const getAvatarClass = (guest) => {
  if (guest.has_entered) return 'entered'
  if (guest.qr_sent) return 'sent'
  return 'pending'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.guest-list {
  width: 100%;
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
  gap: 0.5rem;
}

.timestamp {
  font-size: 0.8rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-state ion-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #495057;
}

.empty-state p {
  margin-bottom: 0;
  color: #6c757d;
}
</style>