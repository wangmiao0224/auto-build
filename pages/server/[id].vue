<template>
  <div class="min-h-screen">
    <div
      class="bg-gradient-to-b from-dark-800/50 to-transparent border-b border-dark-700/40"
    >
      <div class="max-w-6xl mx-auto px-6 py-6">
        <div class="flex items-center gap-4">
          <button
            class="w-9 h-9 rounded-xl bg-dark-700/50 text-gray-400 hover:text-white hover:bg-dark-700 transition-all flex items-center justify-center"
            @click="router.push('/config?tab=server')"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div
                class="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-white">
                  {{ server?.name || "服务器详情" }}
                </h1>
                <p class="text-gray-500 text-sm flex items-center gap-2">
                  <span class="font-mono"
                    >{{ server?.username }}@{{ server?.host }}:{{
                      server?.port
                    }}</span
                  >
                  <span
                    v-if="server?.group"
                    class="px-1.5 py-0.5 text-xs bg-primary-500/10 text-primary-400 rounded"
                    >{{ server.group }}</span
                  >
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all flex items-center gap-2"
              @click="testConnection"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              测试连接
            </button>
            <button
              class="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-dark-700 transition-all flex items-center gap-2"
              @click="router.push(`/config?tab=server&edit=${serverId}`)"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              编辑
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 py-6">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-center">
          <div
            class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          />
          <p class="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>

      <template v-else-if="server">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-3 space-y-6">
            <div class="flex items-center gap-2 text-sm text-gray-500 mb-2">
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
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                />
              </svg>
              服务管理
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ServiceCard
                title="Nginx"
                :icon="NginxIcon"
                :status="nginxStatus"
                :loading="nginxLoading"
                color="green"
                @start="handleNginxAction('start')"
                @stop="handleNginxAction('stop')"
                @restart="handleNginxAction('restart')"
                @reload="handleNginxAction('reload')"
                @configure="showNginxConfig = true"
                @install="showNginxInstall = true"
              />

              <ServiceCard
                title="PM2"
                :icon="Pm2Icon"
                :status="pm2Status"
                :loading="pm2Loading"
                color="purple"
                @refresh="fetchPm2Status"
              />

              <ServiceCard
                title="Docker"
                :icon="DockerIcon"
                :status="dockerStatus"
                :loading="dockerLoading"
                color="blue"
                @refresh="fetchDockerStatus"
                @configure="showDockerModal = true"
              />
            </div>
          </div>

          <div class="space-y-6">
            <div
              class="bg-dark-800/50 border border-dark-700/40 rounded-xl overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-dark-700/40 bg-dark-800/30">
                <h3
                  class="text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  服务器信息
                </h3>
              </div>
              <div class="p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 text-sm">操作系统</span>
                  <span class="text-sm text-white flex items-center gap-1.5">
                    <svg
                      v-if="server.os === 'windows'"
                      class="w-4 h-4 text-blue-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 text-orange-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12.503 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.132 1.884 1.071.771-.06 1.592-.536 2.257-1.306.631-.765 1.683-1.084 2.378-1.503.348-.199.629-.469.649-.853.023-.4-.2-.811-.714-1.376v-.097l-.003-.003c-.17-.2-.25-.535-.338-.926-.085-.401-.182-.786-.492-1.046h-.003c-.059-.054-.123-.067-.188-.135a.357.357 0 00-.19-.064c.431-1.278.264-2.55-.173-3.694-.533-1.41-1.465-2.638-2.175-3.483-.796-1.005-1.576-1.957-1.56-3.368.026-2.152.236-6.133-3.544-6.139zm.529 3.405h.013c.213 0 .396.062.584.198.19.135.33.332.438.533.105.259.158.459.166.724 0-.02.006-.04.006-.06v.105a.086.086 0 01-.004-.021l-.004-.024a1.807 1.807 0 01-.15.706.953.953 0 01-.213.335.71.71 0 00-.088-.042c-.104-.045-.198-.064-.284-.133a1.312 1.312 0 00-.22-.066c.05-.06.146-.133.183-.198.053-.128.082-.264.088-.402v-.02a1.21 1.21 0 00-.061-.4c-.045-.134-.101-.2-.183-.333-.084-.066-.167-.132-.267-.132h-.016c-.093 0-.176.03-.262.132a.8.8 0 00-.205.334 1.18 1.18 0 00-.09.4v.019c.002.089.008.179.02.267-.193-.067-.438-.135-.607-.202a1.635 1.635 0 01-.018-.2v-.02a1.772 1.772 0 01.15-.768c.082-.22.232-.406.43-.533a.985.985 0 01.594-.2zm-2.962.059h.036c.142 0 .27.048.399.135.146.129.264.288.344.465.09.199.14.4.153.667v.004c.007.134.006.2-.002.266v.08c-.03.007-.056.018-.083.024-.152.055-.274.135-.393.2.012-.09.013-.18.003-.267v-.015c-.012-.133-.04-.2-.082-.333a.613.613 0 00-.166-.267.248.248 0 00-.183-.064h-.021c-.071.006-.13.04-.186.132a.552.552 0 00-.12.27.944.944 0 00-.023.33v.015c.012.135.037.2.08.334.046.134.098.2.166.268.01.009.02.018.034.024-.07.057-.117.07-.176.136a.304.304 0 01-.131.068 2.62 2.62 0 01-.275-.402 1.772 1.772 0 01-.155-.667 1.759 1.759 0 01.08-.668 1.43 1.43 0 01.283-.535c.128-.133.26-.2.418-.2zm1.37 1.706c.332 0 .733.065 1.2.458.344.287.607.467.887.534.236.06.484.018.69-.135.23-.17.38-.46.39-.834.012-.37-.11-.87-.384-1.465-.248-.54-.542-1.112-.828-1.6-.286-.488-.563-.9-.74-1.143-.178-.243-.312-.39-.412-.48-.1-.09-.178-.127-.258-.133h-.018c-.1.006-.18.043-.28.133-.1.09-.233.237-.41.48-.178.242-.455.655-.74 1.143-.287.488-.58 1.06-.83 1.6-.273.595-.395 1.094-.383 1.465.01.374.16.665.39.834.206.153.454.195.69.135.28-.067.543-.247.887-.534.467-.393.868-.458 1.2-.458z"
                      />
                    </svg>
                    {{ server.os === "windows" ? "Windows" : "Linux" }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 text-sm">工作目录</span>
                  <span
                    class="text-sm text-white font-mono bg-dark-700/50 px-2 py-0.5 rounded"
                    >{{ server.workDir }}</span
                  >
                </div>
                <div
                  v-if="server.group"
                  class="flex items-center justify-between"
                >
                  <span class="text-gray-500 text-sm">分组</span>
                  <span class="text-sm text-primary-400">{{
                    server.group
                  }}</span>
                </div>
              </div>
            </div>

            <div
              class="bg-dark-800/50 border border-dark-700/40 rounded-xl overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-dark-700/40 bg-dark-800/30">
                <h3
                  class="text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  服务器操作
                </h3>
              </div>
              <div class="p-4 space-y-3">
                <button
                  @click="showCmdModal = true"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/20 hover:bg-gradient-to-r from-blue-600/30 to-blue-500/20 transition-all group"
                >
                  <div
                    class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all"
                  >
                    <svg
                      class="w-5 h-5 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <p class="text-sm font-medium text-white">CMD 命令操作</p>
                    <p class="text-xs text-gray-500 mt-0.5">执行远程命令</p>
                  </div>
                  <div
                    class="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center group-hover:bg-dark-700/80 transition-all"
                  >
                    <svg
                      class="w-4 h-4 text-gray-400 group-hover:text-white transition-all"
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
                  </div>
                </button>

                <button
                  @click="showVisualModal = true"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-500/10 border border-purple-500/20 hover:bg-gradient-to-r from-purple-600/30 to-purple-500/20 transition-all group"
                >
                  <div
                    class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-all"
                  >
                    <svg
                      class="w-5 h-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <p class="text-sm font-medium text-white">可视化操作</p>
                    <p class="text-xs text-gray-500 mt-0.5">文件管理与查看</p>
                  </div>
                  <div
                    class="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center group-hover:bg-dark-700/80 transition-all"
                  >
                    <svg
                      class="w-4 h-4 text-gray-400 group-hover:text-white transition-all"
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
                  </div>
                </button>
              </div>
            </div>

            <div
              class="bg-dark-800/50 border border-dark-700/40 rounded-xl overflow-hidden"
            >
              <div class="px-4 py-3 border-b border-dark-700/40 bg-dark-800/30">
                <h3
                  class="text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  快捷操作
                </h3>
              </div>
              <div class="p-3 space-y-1">
                <button
                  class="w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-700/50 transition-all flex items-center gap-3"
                  @click="testConnection"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center"
                  >
                    <svg
                      class="w-4 h-4 text-yellow-400"
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
                  测试连接
                </button>
                <button
                  class="w-full px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-700/50 transition-all flex items-center gap-3"
                  @click="router.push(`/config?tab=server&edit=${serverId}`)"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"
                  >
                    <svg
                      class="w-4 h-4 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </div>
                  编辑配置
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <NginxConfigModal
      v-if="showNginxConfig"
      :server-id="serverId"
      @close="showNginxConfig = false"
    />

    <NginxInstallModal
      v-if="showNginxInstall"
      :server-id="serverId"
      @close="handleNginxInstallClose"
    />

    <ServerCmdModal
      v-if="showCmdModal"
      :server-id="serverId"
      @close="showCmdModal = false"
    />

    <ServerVisualModal
      v-if="showVisualModal"
      :server-id="serverId"
      @close="showVisualModal = false"
    />

    <DockerModal
      v-if="showDockerModal"
      :server-id="serverId"
      :docker-status="dockerStatus"
      @close="showDockerModal = false"
      @refresh="fetchDockerStatus"
    />
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from "~/stores/server";
import type { ServerConfig, NginxStatus, DockerStatus } from "~/types/server";
import ServiceCard from "~/components/ServiceCard.vue";
import NginxConfigModal from "~/components/NginxConfigModal.vue";
import NginxInstallModal from "~/components/NginxInstallModal.vue";
import ServerCmdModal from "~/components/ServerCmdModal.vue";
import ServerVisualModal from "~/components/ServerVisualModal.vue";
import DockerModal from "~/components/DockerModal.vue";

const NginxIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/></svg>`;
const Pm2Icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>`;
const DockerIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.416H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>`;

const router = useRouter();
const route = useRoute();
const store = useServerStore();
const toast = useToast();

const serverId = computed(() => route.params.id as string);
const server = ref<ServerConfig | null>(null);
const loading = ref(true);

const nginxStatus = ref<NginxStatus | null>(null);
const nginxLoading = ref(false);
const pm2Status = ref<any>(null);
const pm2Loading = ref(false);
const dockerStatus = ref<DockerStatus | null>(null);
const dockerLoading = ref(false);

const showNginxConfig = ref(false);
const showNginxInstall = ref(false);
const showCmdModal = ref(false);
const showVisualModal = ref(false);
const showDockerModal = ref(false);

onMounted(async () => {
  if (!serverId.value) {
    router.push("/config?tab=server");
    return;
  }
  await fetchServer();
  await Promise.all([
    fetchNginxStatus(),
    fetchPm2Status(),
    fetchDockerStatus(),
  ]);
});

async function fetchServer() {
  loading.value = true;
  try {
    await store.fetchConfigs();
    server.value = store.configs.find((c) => c.id === serverId.value) || null;
    if (!server.value) {
      toast.error("服务器不存在");
      router.push("/config?tab=server");
    }
  } finally {
    loading.value = false;
  }
}

async function fetchNginxStatus() {
  nginxLoading.value = true;
  try {
    nginxStatus.value = await $fetch(
      `/api/nginx/status?serverId=${serverId.value}`
    );
  } catch {
    nginxStatus.value = { installed: false, running: false };
  } finally {
    nginxLoading.value = false;
  }
}

async function fetchPm2Status() {
  pm2Loading.value = true;
  try {
    pm2Status.value = await $fetch(
      `/api/pm2/status?serverId=${serverId.value}`
    );
  } catch {
    pm2Status.value = { installed: false };
  } finally {
    pm2Loading.value = false;
  }
}

async function fetchDockerStatus() {
  dockerLoading.value = true;
  try {
    dockerStatus.value = await $fetch(
      `/api/docker/status?serverId=${serverId.value}`
    );
  } catch {
    dockerStatus.value = { installed: false, running: false };
  } finally {
    dockerLoading.value = false;
  }
}

async function handleNginxAction(action: string) {
  nginxLoading.value = true;
  try {
    const result = await $fetch("/api/nginx/control", {
      method: "POST",
      body: { serverId: serverId.value, action },
    });
    if ((result as any).success) {
      toast.success((result as any).message);
      await fetchNginxStatus();
    } else {
      toast.error((result as any).message);
    }
  } catch (err: any) {
    toast.error(err.data?.message || "操作失败");
  } finally {
    nginxLoading.value = false;
  }
}

function handleNginxInstallClose() {
  showNginxInstall.value = false;
  fetchNginxStatus();
}

async function testConnection() {
  if (!server.value) return;
  try {
    const result = await store.testConnection(server.value.id);
    if ((result as any).success) {
      toast.success(`连接成功 (${(result as any).latencyMs}ms)`);
    } else {
      toast.error((result as any).message);
    }
  } catch (err: any) {
    toast.error(err.message || "连接失败");
  }
}
</script>
