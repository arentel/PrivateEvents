<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ title }}</ion-title>
      
      <!-- Botones de header -->
      <ion-buttons slot="end">
        <!-- Info del usuario -->
        <div class="user-info">
          <span>{{ auth.username }}</span>
        </div>
        
        <!-- Botón logout -->
        <ion-button
          fill="clear"
          @click="handleLogout"
          class="logout-button"
        >
          <ion-icon :icon="logOutOutline" slot="icon-only"></ion-icon>
        </ion-button>
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
        role: 'cancel',
        cssClass: 'secondary'
      },
      {
        text: 'Salir',
        cssClass: 'danger',
        handler: async () => {
          // Logout
          auth.logout()
          
          // Toast de confirmación
          const toast = await toastController.create({
            message: '¡Hasta luego! 👋',
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
.user-info {
  display: flex;
  align-items: center;
  margin-right: 8px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.logout-button {
  --color: var(--ion-color-medium);
}

.logout-button:hover {
  --color: var(--ion-color-danger);
}

@media (max-width: 576px) {
  .user-info span {
    display: none;
  }
}
</style>