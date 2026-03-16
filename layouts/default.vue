<template>
  <div class="flex h-screen bg-dark-900 overflow-hidden">
    <!-- 左侧导航栏 -->
    <aside
      :class="[
        'flex flex-col transition-all duration-300 z-30',
        sidebarCollapsed ? 'w-16' : 'w-56',
        'bg-dark-900 border-r border-dark-700/60',
      ]"
    >
      <!-- Logo 区域 -->
      <div
        class="flex items-center h-14 px-4 border-b border-dark-700/60 flex-shrink-0"
      >
        <div class="flex items-center gap-3 overflow-hidden">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-primary"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <Transition name="fade">
            <div v-if="!sidebarCollapsed" class="min-w-0">
              <div
                class="text-white font-bold text-sm leading-tight tracking-wide"
              >
                FastDeploy
              </div>
              <div class="text-gray-500 text-xs leading-tight">
                前端集成平台
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- 导航菜单 -->
      <nav class="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div class="space-y-0.5 px-2">
          <NavItem
            v-for="item in navItems"
            :key="item.path"
            :item="item"
            :collapsed="sidebarCollapsed"
          />
        </div>
      </nav>

      <!-- 底部折叠按钮 -->
      <div class="p-3 border-t border-dark-700/60 flex-shrink-0">
        <button
          class="w-full flex items-center justify-center h-9 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-dark-700 transition-all duration-200"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <svg
            :class="[
              'w-4 h-4 transition-transform duration-300',
              sidebarCollapsed ? 'rotate-180' : '',
            ]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部栏 -->
      <header
        class="h-14 bg-dark-900 border-b border-dark-700/60 flex items-center px-6 flex-shrink-0"
      >
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- 面包屑 -->
          <div class="flex items-center gap-2 text-sm min-w-0">
            <span
              class="text-gray-500 text-xs uppercase tracking-wider font-medium"
            >
              {{ currentModule.category }}
            </span>
            <svg
              class="w-3 h-3 text-gray-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span class="text-gray-200 font-medium truncate">{{
              currentModule.name
            }}</span>
          </div>
        </div>

        <!-- 右侧状态区 -->
        <div class="flex items-center gap-3 flex-shrink-0">
          <!-- GitLab 连接状态 -->
          <div class="flex items-center gap-1.5">
            <div
              :class="[
                'w-1.5 h-1.5 rounded-full',
                gitlabConnected
                  ? 'bg-success-500 shadow-glow-success'
                  : 'bg-gray-600',
              ]"
            />
            <span class="text-xs text-gray-500 hidden sm:block">GitLab</span>
          </div>

          <!-- 通知图标 -->
          <button
            class="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-dark-700 transition-all"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          <!-- 用户头像 -->
          <div
            class="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold"
          >
            A
          </div>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="flex-1 overflow-auto">
        <div class="p-6 animate-fade-in">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const sidebarCollapsed = ref(false);
const gitlabConnected = ref(false);

const navItems = [
  {
    path: "/",
    name: "仪表盘",
    icon: "dashboard",
    category: "概览",
  },
  {
    path: "/projects",
    name: "项目管理",
    icon: "project",
    category: "开发",
  },
  {
    path: "/builds",
    name: "构建历史",
    icon: "build",
    category: "开发",
  },
  {
    path: "/run",
    name: "项目运行",
    icon: "run",
    category: "部署",
  },
  {
    path: "/monitor",
    name: "服务器监控",
    icon: "monitor",
    category: "运维",
  },
  {
    path: "/ai",
    name: "AI 助手",
    icon: "ai",
    category: "工具",
  },
  {
    path: "/config",
    name: "系统配置",
    icon: "config",
    category: "工具",
  },
];

const currentModule = computed(() => {
  const item = navItems.find((n) => {
    if (n.path === "/") return route.path === "/";
    return route.path.startsWith(n.path);
  });
  return item ?? { name: "页面", category: "系统" };
});

// 检查 GitLab 连接状态
onMounted(async () => {
  try {
    const res = await $fetch("/api/gitlab/status", { timeout: 5000 }).catch(
      () => null
    );
    gitlabConnected.value = (res as any)?.connected ?? false;
  } catch {
    gitlabConnected.value = false;
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
