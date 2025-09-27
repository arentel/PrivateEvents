<template>
  <ion-header>
    <ion-toolbar class="custom-toolbar">
      <ion-title>{{ title }}</ion-title>
      
      <!-- Información del usuario y logout -->
      <ion-buttons slot="end">
        <div class="user-section">
          <span class="username">{{ auth.username }}</span>
          <ion-button
            fill="clear"
            @click="handleLogout"
            class="logout-button"
          >
            <ion-icon :icon="logOutOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  alertController,
  toastController
} from '@ionic/vue'
import { logOutOutline } from 'ionicons/icons'
import { auth } from '@/stores/auth'

// Router
const route = useRoute()
const router = useRouter()

// Título dinámico basado en la ruta
const title = computed(() => {
  return route.meta.title || 'Sistema QR Eventos'
})

// Manejar logout con confirmación
const handleLogout = async () => {
  const alert = await alertController.create({
    header: 'Cerrar Sesión',
    message: '¿Estás seguro de que quieres salir?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel'
      },
      {
        text: 'Salir',
        role: 'destructive',
        handler: async () => {
          // Logout
          auth.logout()
          
          // Toast de confirmación
          const toast = await toastController.create({
            message: '¡Hasta luego!',
            duration: 2000,
            color: 'medium',
            position: 'top'
          })
          await toast.present()
          
          // Redirigir al login
          await router.replace('/login')
        }
      }
    ]
  })
  
  await alert.present()
}
</script>

<style scoped>
.custom-toolbar {
  --background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  --color: white;
  --border-width: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.username {
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  opacity: 0.9;
}

.logout-button {
  --color: white;
  --background: rgba(255, 255, 255, 0.1);
  --border-radius: 50%;
  margin: 0;
  width: 36px;
  height: 36px;
}

.logout-button:hover {
  --background: rgba(255, 255, 255, 0.2);
  --color: #ff6b6b;
}

/* Responsive */
@media (max-width: 576px) {
  .user-section {
    padding: 6px 8px;
    gap: 8px;
  }
  
  .username {
    display: none;
  }
  
  .logout-button {
    width: 32px;
    height: 32px;
  }
}
</style>