<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="true" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />
        <div class="relative w-full max-w-xl bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[85vh] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-dark-700/50 bg-gradient-to-b from-dark-700/30 to-transparent">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">Nginx 配置</h3>
                <p class="text-xs text-gray-500 mt-0.5">调整 Nginx 服务参数</p>
              </div>
            </div>
            <button
              class="w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center"
              @click="$emit('close')"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-20">
            <div class="text-center">
              <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p class="text-gray-500 text-sm">加载配置...</p>
            </div>
          </div>

          <div v-else class="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">性能配置</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">Worker 进程数</label>
                  <select v-model="config.workerProcesses" class="form-input">
                    <option value="auto">自动 (推荐)</option>
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                    <option :value="4">4</option>
                    <option :value="8">8</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">Worker 连接数</label>
                  <input v-model.number="config.workerConnections" class="form-input" type="number" placeholder="1024" />
                </div>
              </div>
            </div>

            <div class="border-t border-dark-700/50 pt-6">
              <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">网络配置</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">Keepalive 超时 (秒)</label>
                  <input v-model.number="config.keepaliveTimeout" class="form-input" type="number" placeholder="65" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">最大请求体</label>
                  <input v-model="config.clientMaxBodySize" class="form-input" placeholder="100M" />
                </div>
              </div>
            </div>

            <div class="border-t border-dark-700/50 pt-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h4 class="text-sm font-medium text-gray-300">Gzip 压缩</h4>
                  <p class="text-xs text-gray-500 mt-0.5">启用可减少传输数据量</p>
                </div>
                <button
                  :class="['w-11 h-6 rounded-full transition-colors relative', config.gzip ? 'bg-green-500' : 'bg-dark-600']"
                  @click="config.gzip = !config.gzip"
                >
                  <div :class="['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', config.gzip ? 'translate-x-6' : 'translate-x-1']" />
                </button>
              </div>
              <div v-if="config.gzip" class="bg-dark-700/30 rounded-lg p-4">
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">压缩级别 (1-9)</label>
                  <div class="flex items-center gap-3">
                    <input v-model.number="config.gzipLevel" class="flex-1" type="range" min="1" max="9" />
                    <span class="text-sm text-gray-400 w-6 text-center">{{ config.gzipLevel }}</span>
                  </div>
                  <p class="text-xs text-gray-500">级别越高压缩率越大，但消耗更多 CPU</p>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700/50 bg-dark-800/50">
            <button class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all" @click="$emit('close')">
              取消
            </button>
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
              :disabled="saving"
              @click="saveConfig"
            >
              <span v-if="saving" class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </span>
              <span v-else>保存配置</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { NginxConfig } from "~/types/server";

const props = defineProps<{ serverId: string }>();
const emit = defineEmits<{ close: [] }>();

const toast = useToast();
const loading = ref(true);
const saving = ref(false);

const config = reactive<NginxConfig>({
  workerProcesses: "auto",
  workerConnections: 1024,
  keepaliveTimeout: 65,
  clientMaxBodySize: "100M",
  gzip: true,
  gzipLevel: 6,
  gzipTypes: [],
  cacheEnabled: true,
  cacheDuration: "30s",
  httpPort: 80,
  httpsPort: 443,
});

onMounted(async () => {
  try {
    const result = await $fetch(`/api/nginx/config?serverId=${props.serverId}`);
    Object.assign(config, result);
  } catch {
    toast.error("获取配置失败");
  } finally {
    loading.value = false;
  }
});

async function saveConfig() {
  saving.value = true;
  try {
    await $fetch("/api/nginx/config", {
      method: "POST",
      body: { serverId: props.serverId, config },
    });
    toast.success("配置已保存");
    emit("close");
  } catch (err: any) {
    toast.error(err.data?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>
