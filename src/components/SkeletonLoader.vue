<template>
  <div class="skeleton-wrapper">
    <!-- Skeleton para Card de Ticket -->
    <div v-if="type === 'ticket-card'" class="skeleton-ticket-card">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-qr"></div>
        <div class="skeleton-info">
          <div class="skeleton-line skeleton-info-line"></div>
          <div class="skeleton-line skeleton-info-line"></div>
          <div class="skeleton-line skeleton-info-line"></div>
        </div>
      </div>
      <div class="skeleton-footer">
        <div class="skeleton-button"></div>
      </div>
    </div>

    <!-- Skeleton para Lista de Invitados -->
    <div v-if="type === 'guest-list'" class="skeleton-guest-list">
      <div v-for="n in count" :key="n" class="skeleton-guest-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-guest-info">
          <div class="skeleton-line skeleton-name"></div>
          <div class="skeleton-line skeleton-email"></div>
        </div>
        <div class="skeleton-status"></div>
      </div>
    </div>

    <!-- Skeleton para Formulario -->
    <div v-if="type === 'form'" class="skeleton-form">
      <div v-for="n in count" :key="n" class="skeleton-form-field">
        <div class="skeleton-line skeleton-label"></div>
        <div class="skeleton-input"></div>
      </div>
    </div>

    <!-- Skeleton Genérico -->
    <div v-if="type === 'generic'" class="skeleton-generic">
      <div v-for="n in count" :key="n" class="skeleton-line"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: 'ticket-card' | 'guest-list' | 'form' | 'generic'
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3
})
</script>

<style scoped>
/* Base Skeleton Styles */
.skeleton-wrapper {
  width: 100%;
}

/* Animación shimmer */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-line,
.skeleton-qr,
.skeleton-avatar,
.skeleton-button,
.skeleton-input,
.skeleton-status {
  background: linear-gradient(
    90deg,
    #f0f0f0 0px,
    #f8f8f8 40px,
    #f0f0f0 80px
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 4px;
}

/* Skeleton Ticket Card */
.skeleton-ticket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.skeleton-header {
  margin-bottom: 20px;
}

.skeleton-title {
  height: 28px;
  width: 60%;
  margin-bottom: 12px;
}

.skeleton-subtitle {
  height: 20px;
  width: 40%;
}

.skeleton-body {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;
}

.skeleton-qr {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
  border-radius: 8px;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-info-line {
  height: 18px;
  width: 100%;
}

.skeleton-info-line:nth-child(2) {
  width: 80%;
}

.skeleton-info-line:nth-child(3) {
  width: 70%;
}

.skeleton-footer {
  display: flex;
  justify-content: center;
}

.skeleton-button {
  height: 48px;
  width: 200px;
  border-radius: 8px;
}

/* Skeleton Guest List */
.skeleton-guest-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-guest-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-guest-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-name {
  height: 18px;
  width: 150px;
}

.skeleton-email {
  height: 14px;
  width: 200px;
}

.skeleton-status {
  width: 80px;
  height: 28px;
  border-radius: 14px;
}

/* Skeleton Form */
.skeleton-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-label {
  height: 16px;
  width: 120px;
}

.skeleton-input {
  height: 44px;
  width: 100%;
  border-radius: 6px;
}

/* Skeleton Generic */
.skeleton-generic {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-generic .skeleton-line {
  height: 20px;
  width: 100%;
}

.skeleton-generic .skeleton-line:nth-child(even) {
  width: 90%;
}

/* Responsive */
@media (max-width: 768px) {
  .skeleton-body {
    flex-direction: column;
  }

  .skeleton-qr {
    width: 100%;
    height: 250px;
  }

  .skeleton-guest-item {
    padding: 12px;
  }

  .skeleton-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>