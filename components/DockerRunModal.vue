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
          class="relative w-full max-w-2xl bg-dark-800 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[90vh] flex flex-col overflow-hidden"
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
                <h3 class="text-base font-semibold text-white">
                  Docker 容器运行
                </h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  创建并运行 Docker 容器
                </p>
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

          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div class="space-y-1.5">
              <label class="text-sm text-gray-300">运行模式</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  :class="[
                    'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border',
                    runMode === 'image'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-dark-700/30 text-gray-400 border-dark-700/40 hover:border-dark-600',
                  ]"
                  @click="runMode = 'image'"
                >
                  Docker 镜像
                </button>
                <button
                  type="button"
                  :class="[
                    'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border',
                    runMode === 'artifact'
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-dark-700/30 text-gray-400 border-dark-700/40 hover:border-dark-600',
                  ]"
                  @click="runMode = 'artifact'"
                >
                  构建产物
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm text-gray-300">服务器</label>
              <select v-model="form.serverId" class="form-input w-full">
                <option value="">选择服务器...</option>
                <option v-for="s in servers" :key="s.id" :value="s.id">
                  {{ s.name }} ({{ s.os }})
                </option>
              </select>
            </div>

            <div v-if="runMode === 'artifact'" class="space-y-3">
              <div class="space-y-1.5">
                <label class="text-sm text-gray-300">构建产物</label>
                <button
                  type="button"
                  class="form-input w-full text-left flex items-center justify-between"
                  @click="showBuildSelect = true"
                >
                  <span :class="selectedBuild ? 'text-white' : 'text-gray-500'">
                    {{
                      selectedBuild
                        ? `${selectedBuild.projectName} - ${selectedBuild.tagName}`
                        : "点击选择构建产物..."
                    }}
                  </span>
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

              <div
                v-if="selectedBuild"
                class="bg-dark-700/30 rounded-lg p-3 border border-dark-700/40"
              >
                <div class="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <span
                    class="px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded"
                  >
                    {{ selectedBuild.branch }}
                  </span>
                  <span>{{ formatTime(selectedBuild.startedAt) }}</span>
                </div>
                <div class="text-xs text-gray-500 font-mono truncate">
                  {{ selectedBuild.tarPath || selectedBuild.tarTarget }}
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm text-gray-300">运行镜像</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.image"
                    class="form-input flex-1"
                    placeholder="nginx:latest"
                    @input="onImageInput"
                  />
                  <button
                    type="button"
                    class="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-xs text-gray-400 hover:text-white hover:border-blue-500/50 transition-all"
                    title="从已有镜像选择"
                    @click="showImageSelect = true"
                  >
                    选择
                  </button>
                </div>
                <p class="text-xs text-gray-500">选择用于运行构建产物的镜像</p>
              </div>
            </div>

            <div v-if="runMode === 'image'" class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-sm text-gray-300">容器名称</label>
                <input
                  v-model="form.name"
                  class="form-input w-full"
                  placeholder="my-app"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-sm text-gray-300">镜像</label>
                <div class="flex gap-2">
                  <input
                    v-model="form.image"
                    class="form-input flex-1"
                    placeholder="nginx:latest"
                    @input="onImageInput"
                  />
                  <button
                    type="button"
                    class="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-xs text-gray-400 hover:text-white hover:border-blue-500/50 transition-all"
                    title="从已有镜像选择"
                    @click="showImageSelect = true"
                  >
                    选择
                  </button>
                </div>
              </div>
            </div>

            <div v-if="runMode === 'artifact'" class="space-y-1.5">
              <label class="text-sm text-gray-300">容器名称</label>
              <input
                v-model="form.name"
                class="form-input w-full"
                placeholder="my-app"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm text-gray-300">端口映射</label>
                <button
                  type="button"
                  class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  @click="addPort"
                >
                  + 添加端口
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(port, index) in form.ports"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model.number="port.host"
                    class="form-input flex-1"
                    type="number"
                    placeholder="主机端口"
                  />
                  <span class="text-gray-500 text-sm">:</span>
                  <input
                    v-model.number="port.container"
                    class="form-input flex-1"
                    type="number"
                    placeholder="容器端口"
                  />
                  <button
                    type="button"
                    class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    @click="form.ports.splice(index, 1)"
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
                  v-if="form.ports.length === 0"
                  class="text-xs text-gray-600 py-2"
                >
                  点击上方按钮添加端口映射
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm text-gray-300">挂载目录</label>
                <button
                  type="button"
                  class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  @click="addVolume"
                >
                  + 添加挂载
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(volume, index) in form.volumes"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="volume.host"
                    class="form-input flex-1"
                    placeholder="主机路径"
                  />
                  <span class="text-gray-500 text-sm">:</span>
                  <input
                    v-model="volume.container"
                    class="form-input flex-1"
                    placeholder="容器路径"
                  />
                  <button
                    type="button"
                    class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    @click="form.volumes.splice(index, 1)"
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
                  v-if="form.volumes.length === 0"
                  class="text-xs text-gray-600 py-2"
                >
                  点击上方按钮添加目录挂载
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm text-gray-300">环境变量</label>
                <button
                  type="button"
                  class="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  @click="addEnv"
                >
                  + 添加变量
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(env, index) in form.env"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="env.key"
                    class="form-input flex-1"
                    placeholder="变量名"
                  />
                  <span class="text-gray-500 text-sm">=</span>
                  <input
                    v-model="env.value"
                    class="form-input flex-1"
                    placeholder="变量值"
                  />
                  <button
                    type="button"
                    class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    @click="form.env.splice(index, 1)"
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
                  v-if="form.env.length === 0"
                  class="text-xs text-gray-600 py-2"
                >
                  点击上方按钮添加环境变量
                </div>
              </div>
            </div>

            <div>
              <label class="text-sm text-gray-300 block mb-2"
                >Nginx 代理配置</label
              >
              <textarea
                v-model="nginxConfig"
                class="form-input w-full h-48 font-mono text-xs resize-none"
                placeholder="server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}"
              />
              <p class="text-xs text-gray-500 mt-1.5">
                直接输入 Nginx server 配置块，将自动写入
                /etc/nginx/conf.d/{容器名}.conf
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm text-gray-300">网络代理 (可选)</label>
              <input
                v-model="form.httpProxy"
                class="form-input w-full"
                placeholder="http://proxy.example.com:8080"
              />
              <p class="text-xs text-gray-500">
                容器访问外网时使用的代理服务器
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-sm text-gray-300">重启策略</label>
              <select v-model="form.restartPolicy" class="form-input w-full">
                <option value="always">始终重启</option>
                <option value="unless-stopped">除非手动停止</option>
                <option value="on-failure">失败时重启</option>
                <option value="no">不自动重启</option>
              </select>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-700/50 bg-dark-800/50"
          >
            <button
              class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all"
              @click="$emit('close')"
            >
              取消
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50"
              :disabled="
                loading ||
                !form.serverId ||
                !form.name ||
                !form.image ||
                (runMode === 'artifact' && !selectedBuild)
              "
              @click="handleRun"
            >
              <span v-if="loading" class="flex items-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
                运行中...
              </span>
              <span v-else>运行容器</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <ImageSelectModal
      v-if="showImageSelect"
      :server-id="form.serverId"
      @select="onImageSelect"
      @close="showImageSelect = false"
    />

    <BuildSelectModal
      v-if="showBuildSelect"
      @select="onBuildSelect"
      @close="showBuildSelect = false"
    />
  </Teleport>
</template>

<script setup lang="ts">
import type { ServerConfig } from "~/types/server";
import type { BuildRecord } from "~/types/build";
import ImageSelectModal from "~/components/ImageSelectModal.vue";
import BuildSelectModal from "~/components/BuildSelectModal.vue";

const props = defineProps<{
  servers: ServerConfig[];
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const toast = useToast();
const loading = ref(false);
const showImageSelect = ref(false);
const showBuildSelect = ref(false);
const runMode = ref<"image" | "artifact">("image");
const selectedBuild = ref<BuildRecord | null>(null);
const nginxConfig = ref("");

const form = reactive({
  serverId: "",
  name: "",
  image: "",
  imageId: "",
  ports: [{ host: 8080, container: 80 }],
  volumes: [] as { host: string; container: string }[],
  env: [] as { key: string; value: string }[],
  httpProxy: "",
  restartPolicy: "always" as "always" | "unless-stopped" | "on-failure" | "no",
});

function addPort() {
  form.ports.push({ host: 0, container: 0 });
}

function addVolume() {
  form.volumes.push({ host: "", container: "" });
}

function addEnv() {
  form.env.push({ key: "", value: "" });
}

function onImageSelect(image: { name: string; id: string }) {
  form.image = image.name;
  form.imageId = image.id;
  showImageSelect.value = false;
}

function onImageInput() {
  form.imageId = "";
}

function onBuildSelect(build: BuildRecord) {
  selectedBuild.value = build;
  form.name = build.projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  showBuildSelect.value = false;
}

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

async function handleRun() {
  if (runMode.value === "artifact") {
    await handleArtifactRun();
  } else {
    await handleImageRun();
  }
}

async function handleArtifactRun() {
  if (!form.serverId || !selectedBuild.value || !form.name || !form.image) {
    toast.error("请填写必填字段");
    return;
  }

  loading.value = true;
  try {
    const envVars: Record<string, string> = {};
    form.env.forEach((e) => {
      if (e.key) envVars[e.key] = e.value;
    });

    if (form.httpProxy) {
      envVars.HTTP_PROXY = form.httpProxy;
      envVars.HTTPS_PROXY = form.httpProxy;
    }

    const ports = form.ports
      .filter((p) => p.host && p.container)
      .map((p) => ({ host: p.host, container: p.container }));

    const result = await $fetch("/api/docker/run-artifact", {
      method: "POST",
      body: {
        serverId: form.serverId,
        name: form.name,
        image: form.image,
        imageId: form.imageId,
        buildId: selectedBuild.value.id,
        ports,
        env: envVars,
        nginxConfig: nginxConfig.value,
        restartPolicy: form.restartPolicy,
      },
    });

    if ((result as any).success) {
      toast.success("容器运行成功");
      emit("success");
      emit("close");
    } else {
      toast.error((result as any).message || "运行失败");
    }
  } catch (err: any) {
    toast.error(err.data?.message || "运行失败");
  } finally {
    loading.value = false;
  }
}

async function handleImageRun() {
  if (!form.serverId || !form.image || !form.name) {
    toast.error("请填写必填字段");
    return;
  }

  loading.value = true;
  try {
    const envVars: Record<string, string> = {};
    form.env.forEach((e) => {
      if (e.key) envVars[e.key] = e.value;
    });

    if (form.httpProxy) {
      envVars.HTTP_PROXY = form.httpProxy;
      envVars.HTTPS_PROXY = form.httpProxy;
    }

    const volumes = form.volumes
      .filter((v) => v.host && v.container)
      .map((v) => `${v.host}:${v.container}`);

    const ports = form.ports
      .filter((p) => p.host && p.container)
      .map((p) => ({ host: p.host, container: p.container }));

    const result = await $fetch("/api/docker/run", {
      method: "POST",
      body: {
        serverId: form.serverId,
        name: form.name,
        image: form.image,
        imageId: form.imageId,
        ports,
        volumes,
        env: envVars,
        nginxConfig: nginxConfig.value,
        restartPolicy: form.restartPolicy,
      },
    });

    if ((result as any).success) {
      toast.success("容器运行成功");
      emit("success");
      emit("close");
    } else {
      toast.error((result as any).message || "运行失败");
    }
  } catch (err: any) {
    toast.error(err.data?.message || "运行失败");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-input {
  @apply w-full bg-dark-700/50 border border-dark-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors;
}
</style>
