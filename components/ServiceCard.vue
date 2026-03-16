<template>
  <div :class="cardClass">
    <div class="p-5">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-4">
          <div :class="iconWrapperClass">
            <div class="w-6 h-6" v-html="icon" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-white">{{ title }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span :class="statusDotClass" />
              <span class="text-sm text-gray-400">
                <template v-if="loading">
                  <span class="text-gray-500">检测中...</span>
                </template>
                <template v-else-if="!status?.installed">
                  <span class="text-gray-500">未安装</span>
                </template>
                <template v-else-if="status?.running">
                  <span class="text-green-400">运行中</span>
                  <span v-if="status.version" class="text-gray-600 ml-1">v{{ status.version }}</span>
                </template>
                <template v-else>
                  <span class="text-yellow-400">已停止</span>
                </template>
              </span>
            </div>
          </div>
        </div>

        <div v-if="status?.installed" class="flex items-center gap-1.5">
          <button
            v-if="status?.running"
            class="action-btn stop"
            title="停止"
            :disabled="loading"
            @click="$emit('stop')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" stroke-width="2" />
            </svg>
          </button>
          <button
            v-else
            class="action-btn start"
            title="启动"
            :disabled="loading"
            @click="$emit('start')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <polygon points="5,3 19,12 5,21" stroke-width="2" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            class="action-btn restart"
            title="重启"
            :disabled="loading || !status?.running"
            @click="$emit('restart')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            class="action-btn refresh"
            title="刷新"
            :disabled="loading"
            @click="$emit('refresh')"
          >
            <svg :class="['w-4 h-4', { 'animate-spin': loading }]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="status?.installed" class="px-5 pb-5">
      <div class="flex gap-2">
        <button
          class="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-dark-700/50 text-gray-300 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center gap-2"
          :disabled="loading"
          @click="$emit('configure')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          配置
        </button>
        <button
          class="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-dark-700/50 text-gray-300 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center gap-2"
          :disabled="loading || !status?.running"
          @click="$emit('reload')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          重载
        </button>
      </div>
    </div>

    <div v-else class="px-5 pb-5">
      <button
        class="w-full px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
        :disabled="loading"
        @click="$emit('install')"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        安装 {{ title }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  icon: string;
  status: { installed?: boolean; running?: boolean; version?: string } | null;
  loading?: boolean;
  color?: 'green' | 'purple' | 'blue' | 'orange';
}>();

defineEmits<{
  start: [];
  stop: [];
  restart: [];
  reload: [];
  refresh: [];
  configure: [];
  install: [];
}>();

const colorMap = {
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-400',
    glow: 'shadow-green-500/5',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/5',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/5',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/5',
  },
};

const colorConfig = computed(() => colorMap[props.color || 'green']);

const cardClass = computed(() => [
  'rounded-xl border transition-all',
  props.status?.installed
    ? `${colorConfig.value.border} bg-dark-800/30`
    : 'border-dark-700/40 bg-dark-800/20',
]);

const iconWrapperClass = computed(() => [
  'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
  props.status?.installed
    ? props.status?.running
      ? `${colorConfig.value.bg} ${colorConfig.value.text}`
      : 'bg-gray-500/10 text-gray-400'
    : 'bg-gray-600/10 text-gray-500',
]);

const statusDotClass = computed(() => [
  'w-2 h-2 rounded-full',
  props.status?.installed
    ? props.status?.running
      ? 'bg-green-400 shadow-sm shadow-green-400/50'
      : 'bg-yellow-400 shadow-sm shadow-yellow-400/50'
    : 'bg-gray-600',
]);
</script>

<style scoped>
.action-btn {
  @apply w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed;
}

.action-btn.start {
  @apply text-green-400 hover:bg-green-500/10;
}

.action-btn.stop {
  @apply text-yellow-400 hover:bg-yellow-500/10;
}

.action-btn.restart {
  @apply text-blue-400 hover:bg-blue-500/10;
}

.action-btn.refresh {
  @apply text-gray-400 hover:text-gray-200 hover:bg-dark-600;
}
</style>
