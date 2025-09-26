<template>
  <ion-page>
    <ion-content class="not-found-content">
      <div class="not-found-container">
        <!-- Header con estilo del template -->
        <div class="not-found-header">
          <div class="error-icon">
            <div class="icon-404">404</div>
          </div>
          <h1>Página no encontrada</h1>
          <p>Lo sentimos, la página que buscas no existe</p>
        </div>

        <!-- Contenido principal con estilo del template -->
        <div class="not-found-content-section">
          <div class="error-details">
            <h3>¿Qué ha ocurrido?</h3>
            <div class="error-info-grid">
              <div class="info-item">
                <div class="info-icon">🔗</div>
                <div class="info-content">
                  <strong>URL no válida:</strong>
                  <span>La dirección que has introducido no corresponde a ninguna página</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">🚧</div>
                <div class="info-content">
                  <strong>Página en construcción:</strong>
                  <span>Es posible que esta sección aún no esté disponible</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">📱</div>
                <div class="info-content">
                  <strong>Error de navegación:</strong>
                  <span>Puede que hayas llegado aquí por un enlace incorrecto</span>
                </div>
              </div>
              <div class="info-item">
                <div class="info-icon">⏰</div>
                <div class="info-content">
                  <strong>Contenido movido:</strong>
                  <span>La página pudo haber cambiado de ubicación</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones recomendadas con estilo del template -->
          <div class="recommended-actions">
            <h3>¿Qué puedes hacer?</h3>
            <div class="actions-container">
              <div class="action-card primary-action">
                <div class="action-icon">🏠</div>
                <div class="action-content">
                  <h4>Volver al inicio</h4>
                  <p>Regresa a la página principal del sistema</p>
                  <button @click="goHome" class="action-btn primary-btn">
                    Ir al inicio
                  </button>
                </div>
              </div>
              
              <div class="action-card secondary-action">
                <div class="action-icon">👥</div>
                <div class="action-content">
                  <h4>Gestionar invitados</h4>
                  <p>Ve directamente a la gestión de invitados</p>
                  <button @click="goToGuests" class="action-btn secondary-btn">
                    Ver invitados
                  </button>
                </div>
              </div>

              <div class="action-card secondary-action">
                <div class="action-icon">📧</div>
                <div class="action-content">
                  <h4>Enviar invitaciones</h4>
                  <p>Accede al sistema de envío de emails</p>
                  <button @click="goToSend" class="action-btn secondary-btn">
                    Enviar emails
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Ayuda adicional -->
          <div class="help-section">
            <div class="help-content">
              <h3>¿Necesitas ayuda?</h3>
              <div class="help-info">
                <div class="help-item">
                  <strong>💡 Consejo:</strong>
                  <span>Utiliza el menú de navegación para moverte por el sistema</span>
                </div>
                <div class="help-item">
                  <strong>🔄 Actualizar:</strong>
                  <span>Prueba a recargar la página o verificar la URL</span>
                </div>
                <div class="help-item">
                  <strong>🆘 Soporte:</strong>
                  <span>Si el problema persiste, contacta con el administrador</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con estilo del template -->
        <div class="not-found-footer">
          <div class="footer-content">
            <p class="footer-text">
              Sistema QR Eventos - Error 404
            </p>
            <div class="version-info">
              Si continúas teniendo problemas, verifica tu conexión o contacta con soporte
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'

const router = useRouter()

const goHome = () => {
  router.push('/login')
}

const goToGuests = () => {
  router.push('/tabs/guests')
}

const goToSend = () => {
  router.push('/tabs/send')
}
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
  --template-warning-bg: #fff3cd;
  --template-warning-border: #ffeeba;
  --template-warning-text: #856404;
}

.not-found-content {
  --background: var(--template-bg-light);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 35px 0;
}

.not-found-container {
  width: 100%;
  max-width: 800px;
  padding: 30px;
  margin: 0 auto;
}

/* Header con estilo del template */
.not-found-header {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  padding: 35px 30px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: var(--template-shadow);
}

.error-icon {
  margin-bottom: 20px;
}

.icon-404 {
  font-size: 4rem;
  font-weight: 900;
  opacity: 0.8;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.not-found-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.not-found-header p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* Contenido principal con estilo del template */
.not-found-content-section {
  background: #ffffff;
  border: 1px solid var(--template-border);
  border-radius: 8px;
  padding: 35px 30px;
  box-shadow: var(--template-shadow);
  margin-bottom: 30px;
}

/* Detalles del error */
.error-details {
  margin-bottom: 30px;
}

.error-details h3 {
  color: var(--template-primary);
  font-weight: 600;
  font-size: 1.3rem;
  margin: 0 0 20px 0;
}

.error-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  background: var(--template-bg-section);
  border: 1px solid #e9ecef;
  padding: 15px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.info-item:hover {
  background: #ffffff;
  border-color: var(--template-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.info-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
  text-align: center;
}

.info-content strong {
  display: block;
  color: var(--template-primary);
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.info-content span {
  color: var(--template-text-muted);
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Acciones recomendadas */
.recommended-actions {
  margin-bottom: 30px;
}

.recommended-actions h3 {
  color: var(--template-primary);
  font-weight: 600;
  font-size: 1.3rem;
  margin: 0 0 20px 0;
}

.actions-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.action-card {
  background: var(--template-bg-card);
  border: 1px solid var(--template-border-light);
  border-radius: 6px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.action-card:hover {
  background: #ffffff;
  border-color: var(--template-border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.primary-action {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  border-color: var(--template-primary);
}

.primary-action:hover {
  background: linear-gradient(135deg, #1a2332 0%, #2547a8 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(13, 27, 42, 0.2);
}

.action-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-content h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.primary-action .action-content h4,
.primary-action .action-content p {
  color: white;
}

.action-content p {
  margin: 0 0 15px 0;
  color: var(--template-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.action-btn {
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.primary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.primary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.secondary-btn {
  background: linear-gradient(135deg, var(--template-primary) 0%, var(--template-secondary) 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(13, 27, 42, 0.2);
}

.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(13, 27, 42, 0.3);
}

/* Sección de ayuda */
.help-section {
  background: var(--template-warning-bg);
  border: 1px solid var(--template-warning-border);
  border-radius: 6px;
  padding: 20px;
}

.help-content h3 {
  color: var(--template-warning-text);
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 0 15px 0;
}

.help-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.4;
}

.help-item strong {
  color: var(--template-warning-text);
  font-weight: 600;
  min-width: 80px;
}

.help-item span {
  color: var(--template-warning-text);
  opacity: 0.8;
}

/* Footer con estilo del template */
.not-found-footer {
  background: var(--template-bg-section);
  padding: 25px;
  text-align: center;
  border: 1px solid var(--template-border);
  border-radius: 6px;
}

.footer-content {
  color: var(--template-text-muted);
}

.footer-text {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.version-info {
  font-size: 0.85rem;
  color: #999;
  line-height: 1.4;
}

/* Responsive mejorado */
@media (max-width: 768px) {
  .not-found-container {
    padding: 20px;
  }
  
  .not-found-header {
    padding: 25px 20px;
    margin-bottom: 20px;
  }
  
  .not-found-header h1 {
    font-size: 1.7rem;
  }
  
  .icon-404 {
    font-size: 3rem;
  }
  
  .not-found-content-section {
    padding: 25px 20px;
  }
  
  .error-info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .action-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .action-icon {
    font-size: 2rem;
  }
  
  .help-item {
    flex-direction: column;
    gap: 5px;
  }
  
  .help-item strong {
    min-width: auto;
  }
  
  .not-found-footer {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .not-found-container {
    padding: 16px;
  }
  
  .not-found-header {
    padding: 20px 16px;
  }
  
  .not-found-header h1 {
    font-size: 1.5rem;
  }
  
  .icon-404 {
    font-size: 2.5rem;
  }
  
  .not-found-content-section {
    padding: 20px 16px;
  }
  
  .info-item {
    padding: 12px;
  }
  
  .action-card {
    padding: 15px;
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

.not-found-header {
  animation: fadeInUp 0.6s ease-out;
}

.not-found-content-section {
  animation: fadeInUp 0.8s ease-out;
}

.not-found-footer {
  animation: fadeInUp 1s ease-out;
}

/* Efecto de pulso sutil en el 404 */
@keyframes subtlePulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.icon-404 {
  animation: subtlePulse 3s ease-in-out infinite;
}
</style>