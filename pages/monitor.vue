<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">服务器监控</h1>
        <p class="text-gray-500 text-sm mt-0.5">实时监控所有服务器资源状态</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <div class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
        每 {{ refreshInterval }}s 自动刷新
      </div>
    </div>

    <div
      v-if="serverStore.configs.length === 0"
      class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-3"
    >
      <div class="text-4xl opacity-30">📡</div>
      <p class="text-gray-500 text-sm">
        暂无服务器，请先在「服务器配置」中添加
      </p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div
        v-for="server in serverStore.configs"
        :key="server.id"
        class="bg-dark-800 border border-dark-700/60 rounded-xl overflow-hidden"
      >
        <!-- 服务器头部 -->
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-dark-700/60"
        >
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                metricsMap[server.id] ? 'bg-success-500' : 'bg-gray-600',
              ]"
            />
            <div>
              <div class="text-sm font-semibold text-white">
                {{ server.name }}
              </div>
              <div class="text-xs text-gray-500">{{ server.host }}</div>
            </div>
          </div>
          <div
            v-if="loadingMap[server.id]"
            class="w-4 h-4 border border-primary-500 border-t-transparent rounded-full animate-spin"
          />
        </div>

        <!-- 指标 -->
        <div v-if="metricsMap[server.id]" class="p-5 space-y-4">
          <!-- CPU -->
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-gray-400">CPU 使用率</span>
              <span :class="getMetricColor(metricsMap[server.id].cpu)"
                >{{ metricsMap[server.id].cpu.toFixed(1) }}%</span
              >
            </div>
            <div class="h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div
                :class="[
                  'h-full rounded-full transition-all duration-500',
                  getBarColor(metricsMap[server.id].cpu),
                ]"
                :style="{ width: `${metricsMap[server.id].cpu}%` }"
              />
            </div>
          </div>
          <!-- 内存 -->
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-gray-400">内存使用率</span>
              <span :class="getMetricColor(metricsMap[server.id].memPercent)"
                >{{ metricsMap[server.id].memPercent.toFixed(1) }}%</span
              >
            </div>
            <div class="h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div
                :class="[
                  'h-full rounded-full transition-all duration-500',
                  getBarColor(metricsMap[server.id].memPercent),
                ]"
                :style="{ width: `${metricsMap[server.id].memPercent}%` }"
              />
            </div>
            <div class="text-xs text-gray-600 mt-1">
              {{ metricsMap[server.id].memUsed }} /
              {{ metricsMap[server.id].memTotal }}
            </div>
          </div>
          <!-- 磁盘 -->
          <div>
            <div class="flex justify-between text-xs mb-1.5">
              <span class="text-gray-400">磁盘使用率</span>
              <span :class="getMetricColor(metricsMap[server.id].diskPercent)"
                >{{ metricsMap[server.id].diskPercent.toFixed(1) }}%</span
              >
            </div>
            <div class="h-1.5 bg-dark-600 rounded-full overflow-hidden">
              <div
                :class="[
                  'h-full rounded-full transition-all duration-500',
                  getBarColor(metricsMap[server.id].diskPercent),
                ]"
                :style="{ width: `${metricsMap[server.id].diskPercent}%` }"
              />
            </div>
            <div class="text-xs text-gray-600 mt-1">
              {{ metricsMap[server.id].diskUsed }} /
              {{ metricsMap[server.id].diskTotal }}
            </div>
          </div>
          <!-- 负载 & 运行时间 -->
          <div class="grid grid-cols-2 gap-4 pt-2 border-t border-dark-700/40">
            <div>
              <div class="text-xs text-gray-500 mb-0.5">系统负载</div>
              <div class="text-sm text-gray-200 font-mono">
                {{ metricsMap[server.id].loadAvg }}
              </div>
            </div>
            <div>
              <div class="text-xs text-gray-500 mb-0.5">运行时长</div>
              <div class="text-sm text-gray-200">
                {{ metricsMap[server.id].uptime }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-8 text-center text-gray-600 text-sm">
          {{ loadingMap[server.id] ? "获取中..." : "无法连接" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from "~/stores/server";

const serverStore = useServerStore();
const metricsMap = ref<Record<string, any>>({});
const loadingMap = ref<Record<string, boolean>>({});
const refreshInterval = 30;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  await serverStore.fetchConfigs();
  await fetchAllMetrics();
  refreshTimer = setInterval(fetchAllMetrics, refreshInterval * 1000);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

async function fetchAllMetrics() {
  await Promise.all(serverStore.configs.map((s) => fetchMetrics(s.id)));
}

async function fetchMetrics(serverId: string) {
  loadingMap.value[serverId] = true;
  try {
    metricsMap.value[serverId] = await $fetch("/api/monitor/metrics", {
      query: { serverId },
    });
  } catch {
    delete metricsMap.value[serverId];
  } finally {
    loadingMap.value[serverId] = false;
  }
}

function getMetricColor(val: number) {
  if (val >= 90) return "text-red-400";
  if (val >= 75) return "text-yellow-400";
  return "text-success-400";
}

function getBarColor(val: number) {
  if (val >= 90) return "bg-red-500";
  if (val >= 75) return "bg-yellow-500";
  return "bg-success-500";
}
</script>
