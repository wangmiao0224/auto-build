<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="$emit('close')" />
        <div class="relative w-full max-w-md bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-5 border-b border-dark-700/50 bg-gradient-to-b from-dark-700/30 to-transparent">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">安装 Nginx</h3>
                <p class="text-xs text-gray-500 mt-0.5">自动安装并配置 Nginx 服务</p>
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

          <div class="p-6 space-y-5">
            <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="text-sm">
                  <p class="text-blue-300 font-medium">安装说明</p>
                  <p class="text-blue-400/70 text-xs mt-1 leading-relaxed">
                    将在服务器上自动下载并安装 Nginx，同时配置基础参数。安装过程可能需要几分钟时间，请耐心等待。
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">端口配置</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">HTTP 端口</label>
                  <input v-model.number="installConfig.httpPort" class="form-input" type="number" placeholder="80" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">HTTPS 端口</label>
                  <input v-model.number="installConfig.httpsPort" class="form-input" type="number" placeholder="443" />
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between py-3 px-4 bg-dark-700/30 rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm text-gray-300">启用 Gzip 压缩</p>
                  <p class="text-xs text-gray-500">减少传输数据量</p>
                </div>
              </div>
              <button
                :class="['w-11 h-6 rounded-full transition-colors relative', installConfig.gzip ? 'bg-green-500' : 'bg-dark-600']"
                @click="installConfig.gzip = !installConfig.gzip"
              >
                <div :class="['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform', installConfig.gzip ? 'translate-x-6' : 'translate-x-1']" />
              </button>
            </div>

            <div v-if="installLog" class="bg-dark-900/50 rounded-xl p-4 max-h-32 overflow-y-auto border border-dark-700/50">
              <pre class="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{{ installLog }}</pre>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700/50 bg-dark-800/50">
            <button
              class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all disabled:opacity-50"
              :disabled="installing"
              @click="$emit('close')"
            >
              取消
            </button>
            <button
              class="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
              :disabled="installing"
              @click="startInstall"
            >
              <span v-if="installing" class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                安装中...
              </span>
              <span v-else>开始安装</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ serverId: string }>();
const emit = defineEmits<{ close: [] }>();

const toast = useToast();
const installing = ref(false);
const installLog = ref("");

const installConfig = reactive({
  httpPort: 80,
  httpsPort: 443,
  gzip: true,
  gzipLevel: 6,
});

async function startInstall() {
  installing.value = true;
  installLog.value = "⏳ 开始安装 Nginx...\n";

  try {
    const result = await $fetch("/api/nginx/install", {
      method: "POST",
      body: { serverId: props.serverId, config: installConfig },
    });

    if ((result as any).success) {
      installLog.value += "\n✅ " + (result as any).message;
      toast.success("Nginx 安装成功");
      setTimeout(() => emit("close"), 1500);
    } else {
      installLog.value += "\n❌ " + ((result as any).error || (result as any).message);
      toast.error((result as any).message || "安装失败");
    }
  } catch (err: any) {
    installLog.value += "\n❌ " + (err.data?.message || err.message);
    toast.error("安装失败");
  } finally {
    installing.value = false;
  }
}
</script>
