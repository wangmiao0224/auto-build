<template>
  <div class="space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">仪表盘</h1>
        <p class="text-gray-500 text-sm mt-0.5">系统运行概览</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500">
        <div class="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
        实时更新
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-dark-800 border border-dark-700/60 rounded-xl p-4 hover:border-dark-600 transition-colors"
      >
        <div class="flex items-center justify-between mb-3">
          <span
            class="text-gray-500 text-xs font-medium uppercase tracking-wider"
            >{{ stat.label }}</span
          >
          <div
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center',
              stat.iconBg,
            ]"
          >
            <component :is="stat.icon" class="w-4 h-4" />
          </div>
        </div>
        <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
        <div class="flex items-center gap-1 mt-1">
          <span
            :class="[
              'text-xs font-medium',
              stat.trend > 0
                ? 'text-success-400'
                : stat.trend < 0
                ? 'text-red-400'
                : 'text-gray-500',
            ]"
          >
            {{ stat.trend > 0 ? "+" : ""
            }}{{ stat.trend !== 0 ? stat.trend : "" }}
          </span>
          <span class="text-gray-600 text-xs">{{ stat.trendLabel }}</span>
        </div>
      </div>
    </div>

    <!-- 中间区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- 最近构建 -->
      <div
        class="lg:col-span-2 bg-dark-800 border border-dark-700/60 rounded-xl"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-dark-700/60"
        >
          <h2 class="text-sm font-semibold text-gray-200">最近构建</h2>
          <NuxtLink
            to="/builds"
            class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            查看全部 →
          </NuxtLink>
        </div>
        <div class="p-2">
          <div
            v-if="recentBuilds.length === 0"
            class="py-8 text-center text-gray-600 text-sm"
          >
            暂无构建记录
          </div>
          <div
            v-for="build in recentBuilds"
            :key="build.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dark-700/50 transition-colors"
          >
            <StatusBadge :status="build.status" size="sm" />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-200 font-medium truncate">
                {{ build.projectName }}
              </div>
              <div class="text-xs text-gray-500 truncate">
                {{ build.branch }} · {{ build.tagName }}
              </div>
            </div>
            <div class="text-xs text-gray-600 flex-shrink-0">
              {{ formatTime(build.startedAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 服务器状态 -->
      <div class="bg-dark-800 border border-dark-700/60 rounded-xl">
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-dark-700/60"
        >
          <h2 class="text-sm font-semibold text-gray-200">服务器状态</h2>
          <NuxtLink
            to="/monitor"
            class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            详情 →
          </NuxtLink>
        </div>
        <div class="p-3 space-y-2">
          <div
            v-if="serverConfigs.length === 0"
            class="py-8 text-center text-gray-600 text-sm"
          >
            暂无服务器
          </div>
          <div
            v-for="server in serverConfigs"
            :key="server.id"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-dark-700/40 border border-dark-700/40"
          >
            <div
              class="w-2 h-2 rounded-full bg-success-500 shadow-glow-success flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-200 font-medium truncate">
                {{ server.name }}
              </div>
              <div class="text-xs text-gray-500">{{ server.host }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快速入口 -->
    <div class="bg-dark-800 border border-dark-700/60 rounded-xl p-5">
      <h2 class="text-sm font-semibold text-gray-200 mb-4">快速入口</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <NuxtLink
          v-for="entry in quickEntries"
          :key="entry.path"
          :to="entry.path"
          class="flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-700/40 border border-dark-700/40 hover:border-primary-500/40 hover:bg-primary-500/5 transition-all group"
        >
          <div
            class="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center group-hover:bg-primary-600/20 transition-colors"
          >
            <span class="text-xl">{{ entry.emoji }}</span>
          </div>
          <span
            class="text-xs text-gray-400 group-hover:text-gray-200 transition-colors font-medium"
            >{{ entry.name }}</span
          >
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from "~/stores/server";
import { useBuildStore } from "~/stores/build";

const serverStore = useServerStore();
const buildStore = useBuildStore();

onMounted(async () => {
  await Promise.allSettled([
    serverStore.fetchConfigs(),
    buildStore.fetchHistory(),
  ]);
});

const serverConfigs = computed(() => serverStore.configs.slice(0, 5));
const recentBuilds = computed(() => buildStore.history.slice(0, 6));

const stats = computed(() => [
  {
    label: "服务器",
    value: serverStore.configs.length,
    icon: "div",
    iconBg: "bg-blue-500/15 text-blue-400",
    trend: 0,
    trendLabel: "台在线",
  },
  {
    label: "今日构建",
    value: buildStore.history.filter((b) => {
      const today = new Date().toDateString();
      return new Date(b.startedAt).toDateString() === today;
    }).length,
    icon: "div",
    iconBg: "bg-primary-500/15 text-primary-400",
    trend: 0,
    trendLabel: "次",
  },
  {
    label: "成功构建",
    value: buildStore.history.filter((b) => b.status === "success").length,
    icon: "div",
    iconBg: "bg-success-500/15 text-success-400",
    trend: 0,
    trendLabel: "累计",
  },
  {
    label: "失败构建",
    value: buildStore.history.filter((b) => b.status === "failed").length,
    icon: "div",
    iconBg: "bg-red-500/15 text-red-400",
    trend: 0,
    trendLabel: "累计",
  },
]);

const quickEntries = [
  { path: "/projects", name: "项目管理", emoji: "📁" },
  { path: "/builds", name: "触发构建", emoji: "🚀" },
  { path: "/artifacts", name: "产物管理", emoji: "📦" },
  { path: "/run", name: "项目运行", emoji: "▶️" },
  { path: "/server", name: "服务器配置", emoji: "🖥️" },
];

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
</script>
