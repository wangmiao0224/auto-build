<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">项目运行</h1>
        <p class="text-gray-500 text-sm mt-0.5">查看所有服务器上运行的项目</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="px-3 py-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg text-sm transition-all"
          :disabled="loading"
          @click="loadAllProcesses"
        >
          <svg
            :class="['w-4 h-4', loading && 'animate-spin']"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          @click="showDockerRun = true"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.416H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
            />
          </svg>
          Docker 运行
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-3"
    >
      <div
        class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
      />
      <p class="text-gray-500 text-sm">加载中...</p>
    </div>

    <div
      v-else-if="serverStore.configs.length === 0"
      class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-3"
    >
      <div class="text-4xl opacity-30">🖥️</div>
      <p class="text-gray-500 text-sm">暂无服务器配置</p>
      <NuxtLink
        to="/servers"
        class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        去添加服务器
      </NuxtLink>
    </div>

    <div
      v-else-if="allProcesses.length === 0"
      class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-3"
    >
      <div class="text-4xl opacity-30">📦</div>
      <p class="text-gray-500 text-sm">暂无运行中的项目</p>
      <button
        class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        @click="showDockerRun = true"
      >
        启动一个项目
      </button>
    </div>

    <div
      v-else
      class="bg-dark-800 border border-dark-700/60 rounded-xl overflow-hidden"
    >
      <div class="divide-y divide-dark-700/40">
        <div
          v-for="item in allProcesses"
          :key="`${item.serverId}-${item.process.name}`"
          class="flex items-center gap-4 px-5 py-4 hover:bg-dark-700/20 transition-colors"
        >
          <StatusBadge :status="item.process.status" size="sm" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm text-white font-medium">
                {{ item.process.name }}
              </span>
              <span
                class="px-1.5 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded"
              >
                {{ item.serverName }}
              </span>
              <span
                :class="[
                  'px-1.5 py-0.5 text-xs rounded',
                  item.process.type === 'docker'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-green-500/10 text-green-400',
                ]"
              >
                {{ item.process.type === "docker" ? "Docker" : "PM2" }}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span>CPU: {{ item.process.cpu }}%</span>
              <span>内存: {{ item.process.memory }}</span>
              <span v-if="item.process.port"
                >端口: {{ item.process.port }}</span
              >
              <span v-if="item.process.startedAt">
                启动: {{ formatTime(item.process.startedAt) }}
              </span>
              <a
                v-if="item.process.port && item.process.status === 'running'"
                :href="`http://${item.serverHost}:${item.process.port}`"
                target="_blank"
                class="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                访问
              </a>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-2.5 py-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-all"
              @click="
                controlProcess(
                  item.serverId,
                  item.process.name,
                  item.process.type,
                  'restart'
                )
              "
            >
              重启
            </button>
            <button
              class="px-2.5 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
              @click="
                controlProcess(
                  item.serverId,
                  item.process.name,
                  item.process.type,
                  'stop'
                )
              "
            >
              停止
            </button>
          </div>
        </div>
      </div>
    </div>

    <DockerRunModal
      v-if="showDockerRun"
      :servers="serverStore.configs"
      @close="showDockerRun = false"
      @success="onDockerRunSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from "~/stores/server";
import DockerRunModal from "~/components/DockerRunModal.vue";

interface ProcessItem {
  serverId: string;
  serverName: string;
  serverHost: string;
  process: {
    name: string;
    type: "pm2" | "docker";
    status: "running" | "stopped";
    cpu?: string;
    memory?: string;
    port?: number;
    startedAt?: string;
  };
}

const serverStore = useServerStore();
const toast = useToast();
const loading = ref(false);
const allProcesses = ref<ProcessItem[]>([]);
const showDockerRun = ref(false);

onMounted(async () => {
  await serverStore.fetchConfigs();
  await loadAllProcesses();
});

async function loadAllProcesses() {
  if (serverStore.configs.length === 0) return;

  loading.value = true;
  allProcesses.value = [];

  try {
    const results = await Promise.allSettled(
      serverStore.configs.map(async (server) => {
        try {
          const processes = await $fetch<any[]>("/api/run/processes", {
            query: { serverId: server.id },
          });
          return processes.map((p) => ({
            serverId: server.id,
            serverName: server.name,
            serverHost: server.host,
            process: p,
          }));
        } catch {
          return [];
        }
      })
    );

    allProcesses.value = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<ProcessItem[]>).value);
  } finally {
    loading.value = false;
  }
}

async function controlProcess(
  serverId: string,
  name: string,
  type: "pm2" | "docker",
  action: "restart" | "stop"
) {
  try {
    await $fetch("/api/run/process", {
      method: "POST",
      body: { serverId, name, type, action },
    });
    await loadAllProcesses();
    toast.success(action === "restart" ? "重启成功" : "停止成功");
  } catch (err: unknown) {
    toast.error(`操作失败：${(err as Error).message}`);
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function onDockerRunSuccess() {
  loadAllProcesses();
}
</script>
