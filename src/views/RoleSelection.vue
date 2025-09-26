<template>
  <ion-page>
    <ion-content class="role-selection-content">
      <div class="role-selection-container">
        <!-- Header con estilo del template -->
        <div class="role-header">
          <div class="logo">
            <ion-icon :icon="businessOutline" size="large"></ion-icon>
          </div>
          <h1>Sistema QR Eventos</h1>
          <p>Selecciona tu tipo de acceso</p>
        </div>

        <!-- Opciones de rol con estilo actualizado -->
        <div class="role-options">
          <!-- Administrador -->
          <div class="role-card admin-card" @click="goToAdminLogin">
            <div class="role-card-content">
              <div class="role-icon">
                <ion-icon :icon="settingsOutline" size="large"></ion-icon>
              </div>
              <h2>Administrador</h2>
              <p>Acceso completo al sistema</p>
              
              <div class="role-features-container">
                <h3>Funcionalidades:</h3>
                <div class="role-features-grid">
                  <div class="feature-item">
                    <span class="feature-icon">👥</span>
                    <span>Gestión de invitados</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">📧</span>
                    <span>Envío de invitaciones</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">📊</span>
                    <span>Reportes y estadísticas</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">⚙️</span>
                    <span>Configuración de eventos</span>
                  </div>
                </div>
              </div>
              
              <div class="role-action">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                <span>Iniciar como Admin</span>
              </div>
            </div>
          </div>

          <!-- Empleado -->
          <div class="role-card employee-card" @click="goToEmployeeLogin">
            <div class="role-card-content">
              <div class="role-icon">
                <ion-icon :icon="scanOutline" size="large"></ion-icon>
              </div>
              <h2>Empleado</h2>
              <p>Acceso al escáner QR</p>
              
              <div class="role-features-container">
                <h3>Funcionalidades:</h3>
                <div class="role-features-grid">
                  <div class="feature-item">
                    <span class="feature-icon">📱</span>
                    <span>Escáner de códigos QR</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">✅</span>
                    <span>Validación de entradas</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">🔒</span>
                    <span>Control de acceso</span>
                  </div>
                  <div class="feature-item">
                    <span class="feature-icon">📈</span>
                    <span>Estadísticas básicas</span>
                  </div>
                </div>
              </div>
              
              <div class="role-action">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
                <span>Iniciar como Empleado</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional con estilo del template -->
        <div class="info-section">
          <div class="info-card">
            <div class="info-card-content">
              <h3>
                <ion-icon :icon="informationCircleOutline"></ion-icon>
                ¿Necesitas ayuda?
              </h3>
              <div class="help-content">
                <div class="help-item admin-help">
                  <div class="help-header">
                    <strong>👨‍💼 Administrador:</strong>
                  </div>
                  <div class="help-description">
                    Para gestión completa del evento, configuración y reportes
                  </div>
                </div>
                <div class="help-item employee-help">
                  <div class="help-header">
                    <strong>👨‍💻 Empleado:</strong>
                  </div>
                  <div class="help-description">
                    Para personal de puerta que solo necesita validar entradas
                  </div>
                </div>
                <div class="help-item contact-help">
                  <div class="help-header">
                    <strong>🔑 ¿No tienes credenciales?</strong>
                  </div>
                  <div class="help-description">
                    Contacta con el organizador del evento
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer actualizado -->
        <div class="role-footer">
          <div class="security-badge">
            <ion-icon :icon="shieldCheckmarkOutline"></ion-icon>
            <span>Sistema seguro de gestión de eventos</span>
          </div>
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
/* Variables de estilo basadas en el template de email */
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
  --template-warning-bg: #fff3cd;
  --template-warning-border: #ffeeba;
  --template-warning-text: #856404;
  --template-info-bg: #f0f8ff;
  --template-info-border: #b3d9ff;
  --template-info-text: #0066cc;
}

.role-selection-content {
  --background: var(--template-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 35px 0;
}

.role-selection-container {
  width: 100%;
  max-width: 800px;
  padding: 30px;
  margin: 0 auto;
}

/* Header con gradiente del template */
.role-header {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 35px 30px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(13, 27, 42, 0.15);
}

.logo {
  margin-bottom: 16px;
}

.role-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.role-header p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Cards de rol con estilo del template */
.role-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.role-card {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.role-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  border-color: var(--template-primary);
}

.role-card-content {
  padding: 35px 30px;
}

.role-icon {
  text-align: center;
  margin-bottom: 20px;
  color: var(--template-primary);
}

.role-icon ion-icon {
  font-size: 3rem;
}

.role-card h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: var(--template-primary);
  text-align: center;
}

.role-card p {
  font-size: 1.1rem;
  color: var(--template-text-dark);
  margin: 0 0 25px 0;
  text-align: center;
  opacity: 0.8;
}

/* Features con estilo de tabla del template */
.role-features-container {
  background: var(--template-bg-card);
  border: 1px solid var(--template-border-light);
  padding: 20px;
  border-radius: 6px;
  margin: 20px 0;
}

.role-features-container h3 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: var(--template-primary);
  font-weight: 600;
}

.role-features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 0.95rem;
  color: var(--template-text-dark);
}

.feature-icon {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
}

/* Botón de acción con gradiente del template */
.role-action {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 18px 35px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(13, 27, 42, 0.2);
}

.role-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(13, 27, 42, 0.3);
}

/* Sección de información con estilo del template */
.info-section {
  margin-bottom: 30px;
}

.info-card {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.info-card-content {
  padding: 25px 30px;
}

.info-card h3 {
  color: var(--template-primary);
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.help-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.help-item {
  background: var(--template-bg-section);
  border: 1px solid #e9ecef;
  padding: 20px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.help-item:hover {
  background: #ffffff;
  border-color: var(--template-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.help-header {
  margin-bottom: 8px;
  color: var(--template-primary);
  font-size: 1rem;
}

.help-description {
  color: var(--template-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Footer con estilo del template */
.role-footer {
  background: var(--template-bg-section);
  padding: 25px;
  text-align: center;
  border: 1px solid var(--template-border);
  border-radius: 6px;
}

.security-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 10px 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--template-text-muted);
}

.version-info {
  font-size: 0.85rem;
  color: #999;
  line-height: 1.4;
}

/* Responsive mejorado */
@media (max-width: 768px) {
  .role-selection-container {
    padding: 20px;
  }
  
  .role-header {
    padding: 25px 20px;
    margin-bottom: 20px;
  }
  
  .role-header h1 {
    font-size: 2rem;
  }
  
  .role-options {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .role-card-content {
    padding: 25px 20px;
  }
  
  .role-card h2 {
    font-size: 1.5rem;
  }
  
  .role-features-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .help-content {
    gap: 12px;
  }
  
  .help-item {
    padding: 15px;
  }
  
  .info-card-content {
    padding: 20px;
  }
  
  .role-footer {
    padding: 20px;
  }
}

/* Animaciones mejoradas */
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

.role-header {
  animation: fadeInUp 0.6s ease-out;
}

.role-options {
  animation: fadeInUp 0.8s ease-out;
}

.info-section {
  animation: fadeInUp 1s ease-out;
}

.role-footer {
  animation: fadeInUp 1.2s ease-out;
}

/* Hover effects para cards */
.admin-card .role-action:hover {
  background: linear-gradient(135deg, #1a2332 0%, #2547a8 100%);
}

.employee-card .role-action:hover {
  background: linear-gradient(135deg, #1a2332 0%, #2547a8 100%);
}
</style>