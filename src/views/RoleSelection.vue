<template>
  <ion-page>
    <ion-content class="role-selection-content">
      <div class="role-selection-container">
        <!-- Logo/Header -->
        <div class="role-header">
          <div class="logo">
            <ion-icon :icon="businessOutline" size="large" color="primary"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Selecciona tu tipo de acceso</p>
        </div>

        <!-- Opciones de rol -->
        <div class="role-options">
          <!-- Administrador -->
          <ion-card 
            button 
            @click="goToAdminLogin" 
            class="role-card admin-card"
          >
            <ion-card-content>
              <div class="role-icon">
                <ion-icon :icon="settingsOutline" size="large"></ion-icon>
              </div>
              <h2>Administrador</h2>
              <p>Acceso completo al sistema</p>
              <ul class="role-features">
                <li>Gestión de invitados</li>
                <li>Envío de invitaciones</li>
                <li>Reportes y estadísticas</li>
                <li>Configuración de eventos</li>
              </ul>
              <div class="role-action">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                <span>Iniciar como Admin</span>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Empleado -->
          <ion-card 
            button 
            @click="goToEmployeeLogin" 
            class="role-card employee-card"
          >
            <ion-card-content>
              <div class="role-icon">
                <ion-icon :icon="scanOutline" size="large"></ion-icon>
              </div>
              <h2>Empleado</h2>
              <p>Acceso al escáner QR</p>
              <ul class="role-features">
                <li>Escáner de códigos QR</li>
                <li>Validación de entradas</li>
                <li>Control de acceso</li>
                <li>Estadísticas básicas</li>
              </ul>
              <div class="role-action">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                <span>Iniciar como Empleado</span>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Información adicional -->
        <div class="info-section">
          <ion-card class="info-card">
            <ion-card-content>
              <h3>
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                ¿Necesitas ayuda?
              </h3>
              <div class="help-content">
                <div class="help-item">
                  <strong>Administrador:</strong> Para gestión completa del evento, configuración y reportes
                </div>
                <div class="help-item">
                  <strong>Empleado:</strong> Para personal de puerta que solo necesita validar entradas
                </div>
                <div class="help-item">
                  <strong>¿No tienes credenciales?</strong> Contacta con el organizador del evento
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Footer -->
        <div class="role-footer">
          <p>
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            Sistema seguro de gestión de eventos
          </p>
          <div class="version-info">
            Sistema QR v1.0 - Desarrollado por Adri
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon
} from '@ionic/vue'
import {
  businessOutline,
  settingsOutline,
  scanOutline,
  arrowForwardOutline,
  informationCircleOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons'

const router = useRouter()

const goToAdminLogin = () => {
  router.push('/login')
}

const goToEmployeeLogin = () => {
  router.push('/employee/login')
}
</script>

<style scoped>
.role-selection-content {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px 0;
}

.role-selection-container {
  width: 100%;
  max-width: 800px;
  padding: 20px;
  margin: 0 auto;
}

.role-header {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo {
  margin-bottom: 16px;
}

.role-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.role-header p {
  font-size: 1.2rem;
  opacity: 0.95;
  margin: 0;
  font-weight: 500;
}

.role-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 30px;
}

.role-card {
  margin: 0;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.25);
}

.admin-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.employee-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.role-card ion-card-content {
  padding: 32px 24px;
  text-align: center;
}

.role-icon {
  margin-bottom: 20px;
}

.role-icon ion-icon {
  font-size: 3rem;
}

.role-card h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.role-card p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 20px 0;
}

.role-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.role-features li {
  padding: 6px 0;
  font-size: 0.95rem;
  opacity: 0.9;
  position: relative;
}

.role-features li:before {
  content: "✓";
  margin-right: 8px;
  font-weight: bold;
}

.role-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 16px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.info-section {
  margin-bottom: 30px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 0;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.info-card h3 {
  color: var(--ion-color-primary);
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-item {
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.5;
}

.help-item strong {
  color: var(--ion-color-primary);
}

.role-footer {
  text-align: center;
  color: white;
  opacity: 0.9;
}

.role-footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 500;
}

.version-info {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 768px) {
  .role-selection-container {
    padding: 16px;
  }
  
  .role-header h1 {
    font-size: 2rem;
  }
  
  .role-options {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .role-card ion-card-content {
    padding: 24px 20px;
  }
  
  .role-card h2 {
    font-size: 1.5rem;
  }
  
  .help-content {
    gap: 8px;
  }
  
  .help-item {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.role-options {
  animation: fadeInUp 0.6s ease-out;
}

.info-section {
  animation: fadeInUp 0.8s ease-out;
}

.role-footer {
  animation: fadeInUp 1s ease-out;
}
</style>