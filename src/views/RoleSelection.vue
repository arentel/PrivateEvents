<template>
  <ion-page>
    <ion-content class="role-selection-content">
      <div class="role-selection-container">
        <!-- Header simple -->
        <div class="page-header">
          <div class="logo">
            <ion-icon :icon="businessOutline" size="large"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Selecciona tu tipo de acceso</p>
        </div>

        <!-- Opciones de rol -->
        <div class="role-options">
          <!-- Administrador -->
          <div class="role-card admin-card" @click="goToAdminLogin">
            <div class="role-icon">
              <ion-icon :icon="settingsOutline" size="large"></ion-icon>
            </div>
            <h2>Administrador</h2>
            <p>Acceso completo al sistema</p>
            
            <div class="role-features">
              <div class="feature-item">
                <ion-icon :icon="peopleOutline"></ion-icon>
                <span>Gestión de invitados</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="mailOutline"></ion-icon>
                <span>Envío de invitaciones</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="analyticsOutline"></ion-icon>
                <span>Reportes y estadísticas</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="settingsOutline"></ion-icon>
                <span>Configuración de eventos</span>
              </div>
            </div>
            
            <div class="role-action">
              <ion-icon :icon="arrowForwardOutline"></ion-icon>
              <span>Iniciar como Admin</span>
            </div>
          </div>

          <!-- Empleado -->
          <div class="role-card employee-card" @click="goToEmployeeLogin">
            <div class="role-icon">
              <ion-icon :icon="scanOutline" size="large"></ion-icon>
            </div>
            <h2>Empleado</h2>
            <p>Acceso al escáner QR</p>
            
            <div class="role-features">
              <div class="feature-item">
                <ion-icon :icon="scanOutline"></ion-icon>
                <span>Escáner de códigos QR</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                <span>Validación de entradas</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
                <span>Control de acceso</span>
              </div>
              <div class="feature-item">
                <ion-icon :icon="barChartOutline"></ion-icon>
                <span>Estadísticas básicas</span>
              </div>
            </div>
            
            <div class="role-action">
              <ion-icon :icon="arrowForwardOutline"></ion-icon>
              <span>Iniciar como Empleado</span>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="info-section">
          <h3>¿Necesitas ayuda?</h3>
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
        </div>

        <!-- Footer -->
        <div class="footer">
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
  IonIcon
} from '@ionic/vue'
import {
  businessOutline,
  settingsOutline,
  scanOutline,
  arrowForwardOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  mailOutline,
  analyticsOutline,
  checkmarkCircleOutline,
  barChartOutline
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
  --background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px 0;
}

.role-selection-container {
  width: 100%;
  max-width: 900px;
  padding: 20px;
  margin: 0 auto;
}

/* Header simple */
.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  margin-bottom: 16px;
  color: #1f2937;
}

.page-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #1f2937;
}

.page-header p {
  font-size: 1.1rem;
  margin: 0;
  color: #6b7280;
  font-weight: 500;
}

/* Opciones de rol */
.role-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.role-card {
  background: white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.role-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.admin-card:hover {
  border-color: #1e3a8a;
}

.employee-card:hover {
  border-color: #059669;
}

.role-icon {
  margin-bottom: 20px;
  color: #6b7280;
}

.admin-card .role-icon {
  color: #1e3a8a;
}

.employee-card .role-icon {
  color: #059669;
}

.role-card h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.role-card p {
  font-size: 1rem;
  margin: 0 0 24px 0;
  color: #6b7280;
}

/* Features */
.role-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  font-size: 0.9rem;
  color: #4b5563;
}

.feature-item ion-icon {
  font-size: 1.1rem;
  color: #6b7280;
}

.admin-card .feature-item ion-icon {
  color: #1e3a8a;
}

.employee-card .feature-item ion-icon {
  color: #059669;
}

/* Botón de acción */
.role-action {
  background: linear-gradient(135deg, #0d1b2a 0%, #1e3a8a 100%);
  color: white;
  padding: 14px 24px;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.employee-card .role-action {
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
}

.role-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(13, 27, 42, 0.3);
}

.employee-card .role-action:hover {
  box-shadow: 0 6px 15px rgba(4, 120, 87, 0.3);
}

/* Información adicional */
.info-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 1.2rem;
  font-weight: 600;
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
  font-size: 0.9rem;
  line-height: 1.5;
  color: #4b5563;
}

.help-item strong {
  color: #1f2937;
}

/* Footer */
.footer {
  text-align: center;
  color: #6b7280;
}

.footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.version-info {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .role-selection-container {
    padding: 16px;
  }
  
  .page-header h1 {
    font-size: 1.8rem;
  }
  
  .role-options {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .role-card {
    padding: 24px 20px;
  }
  
  .role-card h2 {
    font-size: 1.4rem;
  }
  
  .help-content {
    gap: 8px;
  }
  
  .help-item {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  animation: fadeInUp 0.6s ease-out;
}

.role-options {
  animation: fadeInUp 0.8s ease-out;
}

.info-section {
  animation: fadeInUp 1s ease-out;
}

.footer {
  animation: fadeInUp 1.2s ease-out;
}
</style>