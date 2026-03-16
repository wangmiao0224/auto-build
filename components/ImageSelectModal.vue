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
          class="relative w-full max-w-lg bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[70vh] flex flex-col overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-5 py-4 border-b border-dark-700/50"
          >
            <h3 class="text-sm font-semibold text-white">选择镜像</h3>
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

          <div v-if="loading" class="flex items-center justify-center py-12">
            <div
              class="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
            />
          </div>

          <div
            v-else-if="!serverId"
            class="flex items-center justify-center py-12 text-gray-500 text-sm"
          >
            请先选择服务器
          </div>

          <div
            v-else-if="images.length === 0"
            class="flex flex-col items-center justify-center py-12"
          >
            <p class="text-gray-500 text-sm mb-2">暂无镜像</p>
            <p class="text-gray-600 text-xs">请先在 Docker 管理中拉取镜像</p>
          </div>

          <div v-else class="flex-1 overflow-y-auto p-3">
            <div class="space-y-2">
              <button
                v-for="image in images"
                :key="image.id"
                class="w-full flex items-center justify-between p-3 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 border border-dark-700/40 hover:border-blue-500/30 transition-all text-left"
                @click="
                  $emit('select', {
                    name: `${image.name}:${image.tag}`,
                    id: image.id,
                  })
                "
              >
                <div>
                  <p class="text-sm text-white font-medium">
                    {{ image.name }}:{{ image.tag }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    {{ image.size }}
                  </p>
                </div>
                <svg
                  class="w-4 h-4 text-gray-500"
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
              </button>
            </div>
          </div>

          <div class="px-5 py-3 border-t border-dark-700/50">
            <div class="flex gap-2">
              <input
                v-model="customImage"
                class="flex-1 bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                placeholder="或输入镜像名 (如 nginx:latest)"
                @keydown.enter="selectCustom"
              />
              <button
                class="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm hover:bg-blue-500/20 transition-all"
                :disabled="!customImage"
                @click="selectCustom"
              >
                使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { DockerImage } from "~/types/server";

const props = defineProps<{
  serverId: string;
}>();

const emit = defineEmits<{
  close: [];
  select: [image: { name: string; id: string }];
}>();

const loading = ref(false);
const images = ref<DockerImage[]>([]);
const customImage = ref("");

watch(
  () => props.serverId,
  (id) => {
    if (id) fetchImages();
  },
  { immediate: true }
);

async function fetchImages() {
  if (!props.serverId) return;
  loading.value = true;
  try {
    const result = await $fetch("/api/docker/images", {
      method: "POST",
      body: { serverId: props.serverId, action: "list" },
    });
    images.value = (result as any).images || [];
  } catch {
    images.value = [];
  } finally {
    loading.value = false;
  }
}

function selectCustom() {
  if (customImage.value.trim()) {
    emit("select", { name: customImage.value.trim(), id: "" });
  }
}
</script>
