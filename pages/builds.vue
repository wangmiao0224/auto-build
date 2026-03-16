<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">打包构建</h1>
        <p class="text-gray-500 text-sm mt-0.5">
          触发 GitLab Pipeline 并追踪构建状态
        </p>
      </div>
    </div>

    <!-- 构建历史 -->
    <div
      class="bg-dark-800 border border-dark-700/60 rounded-xl overflow-hidden"
    >
      <div
        class="px-5 py-4 border-b border-dark-700/60 flex items-center justify-between"
      >
        <h2 class="text-sm font-semibold text-gray-200">构建历史</h2>
        <button
          class="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          @click="buildStore.fetchHistory()"
        >
          刷新
        </button>
      </div>

      <div v-if="buildStore.loading" class="flex justify-center py-12">
        <div
          class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
      <div
        v-else-if="buildStore.history.length === 0"
        class="py-12 text-center text-gray-600 text-sm"
      >
        暂无构建记录
      </div>
      <div v-else class="divide-y divide-dark-700/40">
        <div
          v-for="record in buildStore.history"
          :key="record.id"
          class="flex items-center gap-4 px-5 py-4 hover:bg-dark-700/30 transition-colors"
        >
          <StatusBadge :status="record.status" />
          <div
            v-if="record.stages && record.stages.length > 0"
            class="flex items-center gap-1 flex-wrap"
          >
            <div
              v-for="(stage, sIdx) in record.stages"
              :key="stage.name"
              :class="[
                'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all',
                stage.status === 'success' && 'bg-green-500/15 text-green-400',
                stage.status === 'running' && 'bg-blue-500/15 text-blue-400',
                stage.status === 'failed' && 'bg-red-500/15 text-red-400',
                stage.status === 'pending' &&
                  'bg-yellow-500/15 text-yellow-400',
                stage.status === 'created' && 'bg-gray-500/10 text-gray-500',
                stage.status === 'skipped' && 'bg-gray-500/10 text-gray-500',
                stage.status === 'canceled' && 'bg-red-500/10 text-red-400',
              ]"
            >
              <div
                v-if="stage.status === 'running'"
                class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
              />
              <svg
                v-else-if="stage.status === 'success'"
                class="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <svg
                v-else-if="stage.status === 'failed'"
                class="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>{{ stage.name }}</span>
              <span
                v-if="sIdx < record.stages.length - 1"
                class="text-gray-600 ml-1"
                >→</span
              >
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-white truncate">{{
                record.projectName
              }}</span>
              <span
                class="text-xs bg-dark-600 text-gray-400 px-1.5 py-0.5 rounded font-mono"
                >{{ record.branch }}</span
              >
            </div>
            <div class="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span>Tag: {{ record.tagName }}</span>
              <span>·</span>
              <span>{{ record.tarTarget }}</span>
              <span>·</span>
              <span>{{ formatTime(record.startedAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span v-if="record.duration" class="text-xs text-gray-500"
              >{{ record.duration }}s</span
            >
            <button
              v-if="record.status === 'success'"
              class="px-2 py-1 text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded transition-all"
              @click="downloadArtifact(record)"
            >
              下载
            </button>
            <button
              v-if="record.status === 'success'"
              class="px-2 py-1 text-xs bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded transition-all"
              @click="openRunModal(record)"
            >
              运行
            </button>
            <a
              v-if="record.webUrl"
              :href="record.webUrl"
              target="_blank"
              class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >Pipeline →</a
            >
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="runModal.show"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="runModal.show = false"
          />
          <div
            class="relative w-full max-w-xl bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl"
          >
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-dark-700/60"
            >
              <div>
                <h3 class="text-base font-semibold text-white">运行项目</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ runModal.build?.projectName }} -
                  {{ runModal.build?.tagName }}
                </p>
              </div>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 flex items-center justify-center"
                @click="runModal.show = false"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="form-label">名称</label>
                <input
                  v-model="runModal.name"
                  class="form-input"
                  placeholder="PM2 进程名称"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">端口</label>
                  <input
                    v-model.number="runModal.port"
                    type="number"
                    class="form-input"
                    :placeholder="runModal.defaultPort.toString()"
                  />
                  <p class="text-xs text-gray-600 mt-1">
                    默认: {{ runModal.defaultPort }}
                  </p>
                </div>
                <div>
                  <label class="form-label">启动命令</label>
                  <input
                    v-model="runModal.runCommand"
                    class="form-input"
                    placeholder="npm start"
                  />
                </div>
              </div>
              <div>
                <label class="form-label">代理 IP</label>
                <input
                  v-model="runModal.proxyIp"
                  class="form-input"
                  placeholder="http://proxy.example.com:8080"
                />
                <p class="text-xs text-gray-600 mt-1">
                  设置 HTTP_PROXY 和 HTTPS_PROXY 环境变量
                </p>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="form-label mb-0">接口代理配置</label>
                  <button
                    type="button"
                    class="text-xs text-primary-400 hover:text-primary-300"
                    @click="addProxyRoute"
                  >
                    + 添加路由
                  </button>
                </div>
                <div
                  v-if="runModal.proxyRoutes.length === 0"
                  class="text-xs text-gray-600 py-2"
                >
                  暂无代理路由配置
                </div>
                <div
                  v-for="(route, index) in runModal.proxyRoutes"
                  :key="index"
                  class="bg-dark-700/50 rounded-lg p-3 mb-2 space-y-2"
                >
                  <div class="flex items-center gap-2">
                    <input
                      v-model="route.prefix"
                      class="form-input flex-1 text-xs"
                      placeholder="/api"
                    />
                    <span class="text-gray-500 text-xs">→</span>
                    <input
                      v-model="route.target"
                      class="form-input flex-1 text-xs"
                      placeholder="http://backend:3001"
                    />
                    <button
                      type="button"
                      class="text-red-400 hover:text-red-300 p-1"
                      @click="removeProxyRoute(index)"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <label class="flex items-center gap-2 text-xs text-gray-400">
                    <input
                      v-model="route.rewrite"
                      type="checkbox"
                      class="rounded bg-dark-600 border-dark-500"
                    />
                    重写路径 (移除前缀)
                  </label>
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-6 py-4 border-t border-dark-700/60"
            >
              <button class="btn-ghost text-sm" @click="runModal.show = false">
                取消
              </button>
              <button
                class="btn-primary text-sm"
                :disabled="runModal.loading"
                @click="confirmRun"
              >
                {{ runModal.loading ? "启动中..." : "确认运行" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useBuildStore } from "~/stores/build";
import type { BuildRecord } from "~/types/build";

const buildStore = useBuildStore();
const toast = useToast();

const runModal = reactive({
  show: false,
  build: null as BuildRecord | null,
  name: "",
  port: 3000,
  defaultPort: 3000,
  runCommand: "npm start",
  proxyIp: "",
  proxyRoutes: [] as { prefix: string; target: string; rewrite: boolean }[],
  loading: false,
});

onMounted(() => buildStore.fetchHistory());

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return d.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function downloadArtifact(build: BuildRecord) {
  try {
    const response = await fetch(`/api/builds/download?recordId=${build.id}`);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "下载失败");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${build.tagName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.error((e as Error).message);
  }
}

function openRunModal(build: BuildRecord) {
  runModal.build = build;
  runModal.name = `${build.projectName}-${build.tagName}`;
  runModal.port = 3000;
  runModal.defaultPort = 3000;
  runModal.runCommand = "npm start";
  runModal.proxyIp = "";
  runModal.proxyRoutes = [];
  runModal.show = true;
}

function addProxyRoute() {
  runModal.proxyRoutes.push({
    prefix: "",
    target: "",
    rewrite: false,
  });
}

function removeProxyRoute(index: number) {
  runModal.proxyRoutes.splice(index, 1);
}

async function confirmRun() {
  if (!runModal.build) return;
  runModal.loading = true;
  try {
    await $fetch("/api/builds/run", {
      method: "POST",
      body: {
        recordId: runModal.build.id,
        name: runModal.name,
        port: runModal.port,
        runCommand: runModal.runCommand,
        proxyIp: runModal.proxyIp || undefined,
        proxyRoutes: runModal.proxyRoutes.filter((r) => r.prefix && r.target),
      },
    });
    runModal.show = false;
    toast.success("项目已启动");
  } catch (e: any) {
    toast.error(e.data?.message || e.message || "启动失败");
  } finally {
    runModal.loading = false;
  }
}
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-ghost {
  @apply px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-dark-700 rounded-lg font-medium transition-all;
}
.form-label {
  @apply block text-xs font-medium text-gray-400 mb-1.5;
}
.form-input {
  @apply w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
