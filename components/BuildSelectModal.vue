<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="true"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="$emit('close')"
        />
        <div
          class="relative w-full max-w-2xl bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[80vh] flex flex-col overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-dark-700/50"
          >
            <h3 class="text-sm font-semibold text-white">选择构建产物</h3>
            <button
              class="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center"
              @click="$emit('close')"
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

          <div
            v-if="loading"
            class="flex items-center justify-center py-16"
          >
            <div
              class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            />
          </div>

          <div
            v-else-if="builds.length === 0"
            class="flex flex-col items-center justify-center py-16"
          >
            <p class="text-gray-500 text-sm mb-2">
              暂无构建产物
            </p>
            <p class="text-gray-600 text-xs">
              请先在"打包构建"中触发构建
            </p>
          </div>

          <div
            v-else
            class="flex-1 overflow-y-auto p-3"
          >
            <div class="space-y-2">
              <button
                v-for="build in builds"
                :key="build.id"
                class="w-full flex items-center justify-between p-4 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 border border-dark-700/40 hover:border-blue-500/30 transition-all text-left"
                :disabled="build.status !== 'success'"
                :class="{ 'opacity-50 cursor-not-allowed': build.status !== 'success' }"
                @click="selectBuild(build)"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      build.status === 'success'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400',
                    ]"
                  >
                    <svg
                      v-if="build.status === 'success'"
                      class="w-4 h-4"
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
                      v-else
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
                  </div>
                  <div>
                    <p class="text-sm text-white font-medium">
                      {{ build.projectName }}
                    </p>
                    <p class="text-xs text-gray-500 mt-0.5">
                      {{ build.tagName }} · {{ build.branch }}
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400">
                    {{ formatTime(build.startedAt) }}
                  </p>
                  <p
                    v-if="build.status !== 'success'"
                    class="text-xs text-red-400 mt-0.5"
                  >
                    构建失败
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { BuildRecord } from "~/types/build";

const emit = defineEmits<{
  close: [];
  select: [build: BuildRecord];
}>();

const buildStore = useBuildStore();
const loading = ref(true);
const builds = ref<BuildRecord[]>([]);

onMounted(async () => {
  await buildStore.fetchHistory();
  builds.value = buildStore.history.filter((b) => b.status === "success");
  loading.value = false;
});

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

function selectBuild(build: BuildRecord) {
  emit("select", build);
  emit("close");
}
</script>
