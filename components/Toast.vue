<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['toast', `toast-${msg.type}`]"
          @click="remove(msg.id)"
        >
          <div class="toast-icon">
            <span v-if="msg.type === 'success'">✓</span>
            <span v-else-if="msg.type === 'error'">✕</span>
            <span v-else-if="msg.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>
          <div class="toast-content">
            <div v-if="msg.title" class="toast-title">{{ msg.title }}</div>
            <div class="toast-message">{{ msg.message }}</div>
          </div>
          <button class="toast-close">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { messages, remove } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(23, 23, 23, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.toast:hover {
  transform: translateX(-4px);
  border-color: rgba(255, 255, 255, 0.2);
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.toast-success .toast-icon {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.toast-info .toast-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
