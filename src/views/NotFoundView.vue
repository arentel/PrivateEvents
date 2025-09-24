<template>
  <ion-page>
    <ion-content>
      <div style="text-align: center; padding: 50px;">
        <h1>404 - Página no encontrada</h1>
        <p>La página que buscas no existe.</p>
        <ion-button @click="goHome">Ir al inicio</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goHome = () => router.push('/login')
</script>