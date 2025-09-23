<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="events" href="/tabs/events">
          <ion-icon :icon="calendarOutline"></ion-icon>
          <ion-label>Eventos</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="guests" href="/tabs/guests">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <ion-label>Invitados</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="send" href="/tabs/send">
          <ion-icon :icon="mailOutline"></ion-icon>
          <ion-label>Enviar</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="scan" href="/tabs/scan">
          <ion-icon :icon="scanOutline"></ion-icon>
          <ion-label>Validar</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="reports" href="/tabs/reports">
          <ion-icon :icon="analyticsOutline"></ion-icon>
          <ion-label>Reportes</ion-label>
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
ion-tab-bar {
  --background: #ffffff;
  --border: 1px solid #e1e5e9;
  --color: #6c757d;
  --color-selected: #667eea;
}

ion-tab-button {
  --color: #6c757d;
  --color-selected: #667eea;
  --ripple-color: rgba(102, 126, 234, 0.1);
}

ion-tab-button.tab-selected {
  --color: #667eea;
}

ion-label {
  font-size: 12px;
  font-weight: 500;
}

ion-icon {
  margin-bottom: 2px;
}
</style>