<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="true"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="$emit('close')"
        />
        <div
          class="relative w-full max-w-4xl bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[85vh] flex flex-col overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-6 py-5 border-b border-dark-700/50 bg-gradient-to-b from-dark-700/30 to-transparent"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.416H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-base font-semibold text-white">Docker 管理</h3>
                <p class="text-xs text-gray-500 mt-0.5">容器与镜像管理</p>
              </div>
            </div>
            <button
              class="w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center"
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

          <div v-if="loading" class="flex items-center justify-center py-20">
            <div class="text-center">
              <div
                class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
              />
              <p class="text-gray-500 text-sm">加载中...</p>
            </div>
          </div>

          <div
            v-else-if="!dockerStatus?.installed"
            class="flex flex-col items-center justify-center py-16 px-6"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-gray-500/10 flex items-center justify-center mb-4"
            >
              <svg
                class="w-8 h-8 text-gray-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.416H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
                />
              </svg>
            </div>
            <h4 class="text-lg font-medium text-white mb-2">Docker 未安装</h4>
            <p class="text-gray-500 text-sm text-center mb-6">
              请先在服务器上安装 Docker
            </p>
            <div
              class="bg-dark-700/30 rounded-lg p-4 text-left w-full max-w-md"
            >
              <p class="text-xs text-gray-400 mb-2">Linux 安装命令：</p>
              <code
                class="block bg-dark-800 rounded p-2 text-xs text-green-400 font-mono"
              >
                curl -fsSL https://get.docker.com | sh
              </code>
              <p class="text-xs text-gray-400 mt-3 mb-2">
                Windows 请下载 Docker Desktop
              </p>
            </div>
          </div>

          <div v-else class="flex-1 overflow-hidden flex flex-col">
            <div class="border-b border-dark-700/50 px-6">
              <div class="flex gap-4">
                <button
                  :class="[
                    'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeTab === 'containers'
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200',
                  ]"
                  @click="activeTab = 'containers'"
                >
                  容器
                </button>
                <button
                  :class="[
                    'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeTab === 'images'
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200',
                  ]"
                  @click="activeTab = 'images'"
                >
                  镜像
                </button>
                <button
                  :class="[
                    'px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                    activeTab === 'deploy'
                      ? 'text-blue-400 border-blue-400'
                      : 'text-gray-400 border-transparent hover:text-gray-200',
                  ]"
                  @click="activeTab = 'deploy'"
                >
                  部署
                </button>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto p-6">
              <div v-if="activeTab === 'containers'">
                <div v-if="containers.length === 0" class="text-center py-12">
                  <p class="text-gray-500">暂无容器</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="container in containers"
                    :key="container.id"
                    class="bg-dark-700/30 rounded-xl p-4 border border-dark-700/40"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div
                          :class="[
                            'w-2 h-2 rounded-full',
                            container.status === 'running'
                              ? 'bg-green-400'
                              : 'bg-gray-500',
                          ]"
                        />
                        <div>
                          <h4 class="text-sm font-medium text-white">
                            {{ container.name }}
                          </h4>
                          <p class="text-xs text-gray-500 font-mono">
                            {{ container.image }}
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          :class="[
                            'text-xs px-2 py-1 rounded',
                            container.status === 'running'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-gray-500/10 text-gray-400',
                          ]"
                        >
                          {{ container.status }}
                        </span>
                        <button
                          v-if="container.status === 'running'"
                          class="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          title="停止"
                          @click="handleContainerAction(container.id, 'stop')"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <rect
                              x="6"
                              y="6"
                              width="12"
                              height="12"
                              rx="1"
                              stroke-width="2"
                            />
                          </svg>
                        </button>
                        <button
                          v-else
                          class="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                          title="启动"
                          @click="handleContainerAction(container.id, 'start')"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <polygon
                              points="5,3 19,12 5,21"
                              stroke-width="2"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                          title="删除"
                          @click="handleContainerAction(container.id, 'remove')"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div
                      v-if="container.ports && container.ports.length > 0"
                      class="mt-3 flex flex-wrap gap-2"
                    >
                      <span
                        v-for="(port, idx) in container.ports"
                        :key="idx"
                        class="text-xs bg-dark-600/50 text-gray-400 px-2 py-0.5 rounded"
                      >
                        {{ port.hostPort }}:{{ port.containerPort }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'images'">
                <div v-if="images.length === 0" class="text-center py-12">
                  <p class="text-gray-500">暂无镜像</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="image in images"
                    :key="image.id"
                    class="bg-dark-700/30 rounded-xl p-4 border border-dark-700/40"
                  >
                    <div class="flex items-center justify-between">
                      <div>
                        <h4 class="text-sm font-medium text-white">
                          {{ image.name }}:{{ image.tag }}
                        </h4>
                        <p class="text-xs text-gray-500 mt-1">
                          {{ image.size }} | {{ image.created }}
                        </p>
                      </div>
                      <button
                        class="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        title="删除"
                        @click="handleImageRemove(image.id)"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'deploy'" class="space-y-6">
                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">应用名称</label>
                  <input
                    v-model="deployForm.name"
                    class="form-input w-full"
                    placeholder="my-app"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">镜像</label>
                  <input
                    v-model="deployForm.image"
                    class="form-input w-full"
                    placeholder="nginx:latest"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-sm text-gray-300">容器端口</label>
                    <input
                      v-model.number="deployForm.containerPort"
                      class="form-input w-full"
                      type="number"
                      placeholder="80"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-sm text-gray-300">主机端口</label>
                    <input
                      v-model.number="deployForm.hostPort"
                      class="form-input w-full"
                      type="number"
                      placeholder="8080"
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">环境变量</label>
                  <textarea
                    v-model="deployForm.envVars"
                    class="form-input w-full h-24 font-mono text-sm"
                    placeholder="NODE_ENV=production&#10;API_URL=https://api.example.com"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm text-gray-300">挂载目录</label>
                  <div class="space-y-2">
                    <div
                      v-for="(volume, index) in deployForm.volumes"
                      :key="index"
                      class="flex gap-2"
                    >
                      <input
                        v-model="volume.host"
                        class="form-input flex-1"
                        placeholder="主机路径"
                      />
                      <input
                        v-model="volume.container"
                        class="form-input flex-1"
                        placeholder="容器路径"
                      />
                      <button
                        class="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        @click="deployForm.volumes.splice(index, 1)"
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
                    <button
                      class="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      @click="
                        deployForm.volumes.push({ host: '', container: '' })
                      "
                    >
                      + 添加挂载
                    </button>
                  </div>
                </div>

                <button
                  class="w-full px-4 py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all"
                  :disabled="deploying"
                  @click="handleDeploy"
                >
                  <span
                    v-if="deploying"
                    class="flex items-center justify-center gap-2"
                  >
                    <div
                      class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    />
                    部署中...
                  </span>
                  <span v-else>部署容器</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type {
  DockerStatus,
  DockerContainer,
  DockerImage,
} from "~/types/server";

const props = defineProps<{
  serverId: string;
  dockerStatus: DockerStatus | null;
}>();

const emit = defineEmits<{
  close: [];
  refresh: [];
}>();

const toast = useToast();
const activeTab = ref<"containers" | "images" | "deploy">("containers");
const loading = ref(false);
const containers = ref<DockerContainer[]>([]);
const images = ref<DockerImage[]>([]);
const deploying = ref(false);

const deployForm = ref({
  name: "",
  image: "",
  containerPort: 80,
  hostPort: 8080,
  envVars: "",
  volumes: [{ host: "", container: "" }],
});

watch(
  () => props.dockerStatus,
  (status) => {
    if (status?.installed) {
      fetchContainers();
      fetchImages();
    }
  },
  { immediate: true }
);

async function fetchContainers() {
  try {
    const result = await $fetch("/api/docker/containers", {
      method: "POST",
      body: { serverId: props.serverId, action: "list" },
    });
    containers.value = (result as any).containers || [];
  } catch {
    containers.value = [];
  }
}

async function fetchImages() {
  try {
    const result = await $fetch("/api/docker/images", {
      method: "POST",
      body: { serverId: props.serverId, action: "list" },
    });
    images.value = (result as any).images || [];
  } catch {
    images.value = [];
  }
}

async function handleContainerAction(containerId: string, action: string) {
  try {
    const result = await $fetch("/api/docker/container/action", {
      method: "POST",
      body: { serverId: props.serverId, containerId, action },
    });
    if ((result as any).success) {
      toast.success((result as any).message);
      await fetchContainers();
    } else {
      toast.error((result as any).message);
    }
  } catch (err: any) {
    toast.error(err.data?.message || "操作失败");
  }
}

async function handleImageRemove(imageId: string) {
  try {
    const result = await $fetch("/api/docker/image/remove", {
      method: "POST",
      body: { serverId: props.serverId, imageId },
    });
    if ((result as any).success) {
      toast.success((result as any).message);
      await fetchImages();
    } else {
      toast.error((result as any).message);
    }
  } catch (err: any) {
    toast.error(err.data?.message || "操作失败");
  }
}

async function handleDeploy() {
  if (!deployForm.value.name || !deployForm.value.image) {
    toast.error("请填写应用名称和镜像");
    return;
  }

  deploying.value = true;
  try {
    const envVars: Record<string, string> = {};
    if (deployForm.value.envVars) {
      deployForm.value.envVars.split("\n").forEach((line) => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
          envVars[key.trim()] = values.join("=").trim();
        }
      });
    }

    const volumes = deployForm.value.volumes
      .filter((v) => v.host && v.container)
      .map((v) => `${v.host}:${v.container}`);

    const result = await $fetch("/api/docker/deploy", {
      method: "POST",
      body: {
        serverId: props.serverId,
        name: deployForm.value.name,
        image: deployForm.value.image,
        ports: [
          {
            container: deployForm.value.containerPort,
            host: deployForm.value.hostPort,
          },
        ],
        env: envVars,
        volumes,
      },
    });

    if ((result as any).success) {
      toast.success("部署成功");
      activeTab.value = "containers";
      await fetchContainers();
      deployForm.value = {
        name: "",
        image: "",
        containerPort: 80,
        hostPort: 8080,
        envVars: "",
        volumes: [{ host: "", container: "" }],
      };
    } else {
      toast.error((result as any).message);
    }
  } catch (err: any) {
    toast.error(err.data?.message || "部署失败");
  } finally {
    deploying.value = false;
  }
}
</script>

<style scoped>
.form-input {
  @apply w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors;
}
</style>
