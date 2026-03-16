<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="isVisible" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-dialog" :class="`confirm-${options.type}`">
          <div class="confirm-header">
            <div class="confirm-icon">
              <span v-if="options.type === 'danger'">⚠</span>
              <span v-else-if="options.type === 'warning'">⚡</span>
              <span v-else>ℹ</span>
            </div>
            <h3 class="confirm-title">{{ options.title }}</h3>
          </div>
          <div class="confirm-body">
            <p>{{ options.message }}</p>
          </div>
          <div class="confirm-footer">
            <button class="confirm-btn confirm-btn-cancel" @click="handleCancel">
              {{ options.cancelText }}
            </button>
            <button
              class="confirm-btn confirm-btn-confirm"
              :class="`confirm-btn-${options.type}`"
              @click="handleConfirm"
            >
              {{ options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isVisible, options, handleConfirm, handleCancel } = useConfirm();
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.confirm-dialog {
  width: 90%;
  max-width: 420px;
  background: #1a1a1a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 12px;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.confirm-warning .confirm-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.confirm-danger .confirm-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.confirm-info .confirm-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.confirm-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.confirm-body {
  padding: 8px 24px 20px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.6;
}

.confirm-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.confirm-btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.confirm-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.confirm-btn-confirm {
  color: #fff;
}

.confirm-btn-warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.confirm-btn-warning:hover {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.confirm-btn-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.confirm-btn-danger:hover {
  background: linear-gradient(135deg, #f87171, #ef4444);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.confirm-btn-info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.confirm-btn-info:hover {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: all 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: scale(0.9) translateY(20px);
}
</style>
