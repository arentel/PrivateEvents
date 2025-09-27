<template>
  <ion-header>
    <ion-toolbar class="custom-toolbar">
      <ion-title>{{ title }}</ion-title>
      
      <!-- Información del usuario y logout mejorado -->
      <div slot="end" class="header-user-section">
        <div class="user-info">
          <span class="user-name">{{ auth.username }}</span>
          <span class="user-role">Administrador</span>
        </div>
        <button
          @click="handleLogout"
          class="logout-btn"
          title="Cerrar sesión"
        >
          <ion-icon :icon="logOutOutline"></ion-icon>
        </button>
      </div>
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
  padding: 0 16px;
}

.header-user-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
}

.user-role {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logout-btn ion-icon {
  font-size: 1.2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info {
    display: none;
  }
  
  .header-user-section {
    gap: 0;
  }
  
  .logout-btn {
    width: 36px;
    height: 36px;
  }
}
</style>