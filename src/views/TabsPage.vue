<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="events" href="/tabs/events" class="custom-tab-button">
          <ion-icon :icon="calendarOutline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Eventos</ion-label>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button tab="guests" href="/tabs/guests" class="custom-tab-button">
          <ion-icon :icon="peopleOutline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Invitados</ion-label>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button tab="send" href="/tabs/send" class="custom-tab-button">
          <ion-icon :icon="mailOutline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Enviar</ion-label>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button tab="scan" href="/tabs/scan" class="custom-tab-button">
          <ion-icon :icon="scanOutline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Validar</ion-label>
          <div class="tab-indicator"></div>
        </ion-tab-button>

        <ion-tab-button tab="reports" href="/tabs/reports" class="custom-tab-button">
          <ion-icon :icon="analyticsOutline" class="tab-icon"></ion-icon>
          <ion-label class="tab-label">Reportes</ion-label>
          <div class="tab-indicator"></div>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import {
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonLabel,
  IonIcon,
  IonPage,
  IonRouterOutlet
} from '@ionic/vue'
import {
  calendarOutline,
  peopleOutline,
  mailOutline,
  scanOutline,
  analyticsOutline
} from 'ionicons/icons'
</script>

<style scoped>
/* Variables del template de email */
:root {
  --template-primary: #0d1b2a;
  --template-secondary: #1e3a8a;
  --template-bg-light: #f4f4f4;
  --template-bg-card: #f9f9f9;
  --template-bg-section: #f8f9fa;
  --template-border: #e0e0e0;
  --template-border-light: #dcdcdc;
  --template-text-muted: #666;
  --template-text-dark: #333;
  --template-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

/* Tab Bar principal con estilo del template */
.custom-tab-bar {
  --background: #ffffff;
  --border: 1px solid var(--template-border);
  --color: var(--template-text-muted);
  --color-selected: var(--template-primary);
  
  /* Sombra sutil como en las cards del template */
  box-shadow: 0 -2px 12px rgba(13, 27, 42, 0.08);
  border-top: 1px solid var(--template-border);
  
  /* Altura mejorada para mejor usabilidad */
  height: 65px;
  padding-bottom: env(safe-area-inset-bottom);
}

/* Botones de tab con estilo template */
.custom-tab-button {
  --color: var(--template-text-muted);
  --color-selected: var(--template-primary);
  --ripple-color: rgba(13, 27, 42, 0.1);
  
  position: relative;
  padding: 8px 4px 12px 4px;
  transition: all 0.3s ease;
  
  /* Fondo hover sutil */
  background: transparent;
  border-radius: 0;
}

/* Estado hover con gradiente sutil del template */
.custom-tab-button:hover {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.03) 0%, 
    rgba(30, 58, 138, 0.05) 100%);
}

/* Estado activo/seleccionado */
.custom-tab-button.tab-selected {
  --color: var(--template-primary);
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(30, 58, 138, 0.08) 100%);
}

/* Indicador visual del tab activo */
.tab-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  border-radius: 0 0 2px 2px;
  transition: width 0.3s ease;
}

/* Mostrar indicador cuando el tab está seleccionado */
.custom-tab-button.tab-selected .tab-indicator {
  width: 32px;
}

/* Iconos con estilo mejorado */
.tab-icon {
  margin-bottom: 4px;
  font-size: 24px;
  transition: all 0.3s ease;
}

/* Efecto de escala en iconos activos */
.custom-tab-button.tab-selected .tab-icon {
  transform: scale(1.1);
  color: var(--template-primary);
}

/* Labels con tipografía del template */
.tab-label {
  font-size: 11px;
  font-weight: 600;
  margin-top: 2px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
}

/* Label activo con color del template */
.custom-tab-button.tab-selected .tab-label {
  color: var(--template-primary);
  font-weight: 700;
}

/* Efectos específicos por tab */
.custom-tab-button[tab="events"].tab-selected {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(102, 126, 234, 0.08) 100%);
}

.custom-tab-button[tab="guests"].tab-selected {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(30, 58, 138, 0.08) 100%);
}

.custom-tab-button[tab="send"].tab-selected {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(30, 58, 138, 0.08) 100%);
}

.custom-tab-button[tab="scan"].tab-selected {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(30, 58, 138, 0.08) 100%);
}

.custom-tab-button[tab="reports"].tab-selected {
  background: linear-gradient(180deg, 
    rgba(13, 27, 42, 0.05) 0%, 
    rgba(30, 58, 138, 0.08) 100%);
}

/* Animación de entrada suave */
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.custom-tab-bar {
  animation: slideUp 0.4s ease-out;
}

/* Responsive para diferentes tamaños */
@media (max-width: 768px) {
  .custom-tab-bar {
    height: 60px;
  }
  
  .tab-icon {
    font-size: 22px;
  }
  
  .tab-label {
    font-size: 10px;
  }
  
  .custom-tab-button {
    padding: 6px 2px 10px 2px;
  }
}

@media (max-width: 480px) {
  .tab-label {
    font-size: 9px;
  }
  
  .tab-icon {
    font-size: 20px;
  }
  
  .tab-indicator {
    width: 24px;
  }
  
  .custom-tab-button.tab-selected .tab-indicator {
    width: 28px;
  }
}

/* Mejoras para accesibilidad */
@media (prefers-reduced-motion: reduce) {
  .custom-tab-button,
  .tab-icon,
  .tab-label,
  .tab-indicator {
    transition: none;
  }
  
  .custom-tab-bar {
    animation: none;
  }
}

/* Dark mode support manteniendo los colores del template */
@media (prefers-color-scheme: dark) {
  .custom-tab-bar {
    --background: #1a1a1a;
    --border: 1px solid #333;
    border-top-color: #333;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.3);
  }
  
  .custom-tab-button {
    --color: #999;
    --color-selected: #ffffff;
  }
  
  .custom-tab-button:hover {
    background: linear-gradient(180deg, 
      rgba(255, 255, 255, 0.05) 0%, 
      rgba(255, 255, 255, 0.08) 100%);
  }
  
  .custom-tab-button.tab-selected {
    background: linear-gradient(180deg, 
      rgba(255, 255, 255, 0.08) 0%, 
      rgba(255, 255, 255, 0.12) 100%);
  }
  
  .tab-indicator {
    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
  }
}

/* Efecto de pulso sutil para el tab activo */
@keyframes subtlePulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.custom-tab-button.tab-selected .tab-indicator {
  animation: subtlePulse 2s ease-in-out infinite;
}
</style>