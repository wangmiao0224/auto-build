<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-white">项目管理</h1>
        <p class="text-gray-500 text-sm mt-0.5">管理构建项目，触发部署任务</p>
      </div>
      <button
        class="btn-primary flex items-center gap-2"
        @click="openCreateModal"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        创建项目
      </button>
    </div>

    <div
      v-if="projectStore.loading || buildStore.loading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
        />
        <span class="text-gray-500 text-sm">加载中...</span>
      </div>
    </div>

    <div
      v-else-if="projectStore.savedProjects.length === 0"
      class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-4"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-dark-700/60 flex items-center justify-center"
      >
        <svg
          class="w-8 h-8 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-gray-400 text-sm">还没有创建任何项目</p>
        <p class="text-gray-600 text-xs mt-1">点击上方按钮创建第一个项目</p>
      </div>
      <button class="btn-primary mt-2" @click="openCreateModal">
        创建项目
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="project in projectStore.savedProjects"
        :key="project.id"
        class="bg-dark-800 border border-dark-700/60 rounded-xl p-5 hover:border-dark-600 transition-all"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-400 font-bold"
            >
              {{ project.projectName.charAt(0).toUpperCase() }}
            </div>
            <div>
              <div class="text-sm font-semibold text-white">
                {{ project.projectName }}
              </div>
              <div class="flex items-center gap-2 mt-1">
                <svg
                  class="w-3 h-3 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                  />
                </svg>
                <span class="text-xs text-gray-500">{{
                  project.selectedBranch
                }}</span>
                <span
                  v-if="getServerName(project.serverId)"
                  class="text-xs text-gray-600"
                  >· {{ getServerName(project.serverId) }}</span
                >
              </div>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
            @click="deleteProject(project)"
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

        <div class="mt-4 pt-4 border-t border-dark-700/60">
          <template v-if="getRunningBuild(project.id)">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 flex-wrap">
                <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span class="text-xs text-blue-400">部署中</span>
                <span class="text-xs text-gray-600 font-mono"
                  >#{{ getRunningBuild(project.id)?.pipelineId }}</span
                >
                <template v-if="getRunningBuild(project.id)?.stages?.length">
                  <span class="text-gray-600">|</span>
                  <div
                    v-for="(stage, sIdx) in getRunningBuild(project.id)?.stages"
                    :key="stage.name"
                    :class="[
                      'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all',
                      stage.status === 'success' &&
                        'bg-green-500/15 text-green-400',
                      stage.status === 'running' &&
                        'bg-blue-500/15 text-blue-400',
                      stage.status === 'failed' && 'bg-red-500/15 text-red-400',
                      stage.status === 'pending' &&
                        'bg-yellow-500/15 text-yellow-400',
                      stage.status === 'created' &&
                        'bg-gray-500/10 text-gray-500',
                      stage.status === 'skipped' &&
                        'bg-gray-500/10 text-gray-500',
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
                      v-if="
                        sIdx <
                        (getRunningBuild(project.id)?.stages?.length || 0) - 1
                      "
                      class="text-gray-600 ml-1"
                      >→</span
                    >
                  </div>
                </template>
              </div>
              <button
                class="px-3 py-1.5 text-xs bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg transition-all"
                :disabled="buildStore.canceling"
                @click="cancelBuild(project)"
              >
                取消部署
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-gray-600" />
                <span class="text-xs text-gray-500">空闲</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="getLatestSuccessBuild(project.id)"
                  class="px-3 py-1.5 text-xs bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg transition-all"
                  @click="handleRun(project)"
                >
                  运行
                </button>
                <button
                  v-if="getLatestSuccessBuild(project.id)"
                  class="px-3 py-1.5 text-xs bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 rounded-lg transition-all"
                  @click="handleDownload(project)"
                >
                  下载
                </button>
                <button
                  class="px-3 py-1.5 text-xs bg-primary-500/15 text-primary-400 hover:bg-primary-500/25 rounded-lg transition-all"
                  :disabled="buildStore.triggering || !project.serverId"
                  @click="triggerBuild(project)"
                >
                  {{ buildStore.triggering ? "触发中..." : "打包" }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCreateModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/60" @click="closeCreateModal" />
          <div
            class="relative bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-dark-700/60 flex-shrink-0"
            >
              <div>
                <h3 class="text-base font-semibold text-white">创建项目</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  从 GitLab 选择项目并配置构建
                </p>
              </div>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 flex items-center justify-center transition-all"
                @click="closeCreateModal"
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

            <div class="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >项目名称 <span class="text-red-400">*</span></label
                >
                <input
                  v-model="createForm.name"
                  class="form-input"
                  placeholder="输入项目名称..."
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >选择服务器 <span class="text-red-400">*</span></label
                >
                <div
                  v-if="serverStore.configs.length === 0"
                  class="text-xs text-gray-500 py-2"
                >
                  请先在<a
                    href="/config"
                    class="text-primary-400 hover:underline"
                    >系统配置</a
                  >中添加服务器
                </div>
                <div v-else class="space-y-1.5 max-h-32 overflow-y-auto">
                  <div
                    v-for="server in serverStore.configs"
                    :key="server.id"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                      createForm.serverId === server.id
                        ? 'bg-primary-500/15 border border-primary-500/30'
                        : 'hover:bg-dark-700/60 border border-transparent',
                    ]"
                    @click="createForm.serverId = server.id"
                  >
                    <div class="w-2 h-2 rounded-full bg-success-500" />
                    <span class="text-sm text-gray-200 flex-1">{{
                      server.name
                    }}</span>
                    <span class="text-xs text-gray-500">{{ server.host }}</span>
                    <svg
                      v-if="createForm.serverId === server.id"
                      class="w-4 h-4 text-primary-400"
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
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >搜索 GitLab 项目</label
                >
                <div class="relative">
                  <svg
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                    />
                  </svg>
                  <input
                    v-model="searchQuery"
                    class="w-full bg-dark-700/60 border border-dark-600/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="输入项目名称搜索..."
                    @input="onSearch"
                  />
                </div>
              </div>

              <div
                v-if="loadingGitlab"
                class="flex items-center justify-center py-8"
              >
                <div
                  class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
                />
              </div>

              <div
                v-else-if="projectStore.gitlabProjects.length === 0"
                class="text-center py-8"
              >
                <p class="text-gray-500 text-sm">未找到项目</p>
              </div>

              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                <div
                  v-for="p in projectStore.gitlabProjects"
                  :key="p.id"
                  :class="[
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all',
                    selectedGitlabProject?.id === p.id
                      ? 'bg-primary-500/15 border border-primary-500/30'
                      : 'hover:bg-dark-700/60 border border-transparent',
                  ]"
                  @click="selectGitlabProject(p)"
                >
                  <div
                    class="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center text-primary-400 text-xs font-bold flex-shrink-0"
                  >
                    {{ p.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm text-gray-200 truncate">
                      {{ p.name }}
                    </div>
                    <div class="text-xs text-gray-600 truncate">
                      {{ p.nameWithNamespace }}
                    </div>
                  </div>
                  <svg
                    v-if="selectedGitlabProject?.id === p.id"
                    class="w-4 h-4 text-primary-400"
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
                </div>
              </div>

              <div v-if="selectedGitlabProject">
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >选择分支</label
                >
                <div class="relative mb-2">
                  <svg
                    class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"
                    />
                  </svg>
                  <input
                    v-model="branchSearchQuery"
                    class="w-full bg-dark-700/40 border border-dark-600/40 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="搜索分支..."
                  />
                </div>
                <div
                  v-if="loadingBranches"
                  class="flex items-center justify-center py-4"
                >
                  <div
                    class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
                  />
                </div>
                <div
                  v-else-if="filteredBranches.length === 0"
                  class="text-center py-4 text-gray-500 text-xs"
                >
                  未找到匹配的分支
                </div>
                <div v-else class="space-y-1.5 max-h-32 overflow-y-auto">
                  <div
                    v-for="branch in filteredBranches"
                    :key="branch.name"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                      createForm.branch === branch.name
                        ? 'bg-primary-500/15 border border-primary-500/30'
                        : 'hover:bg-dark-700/60 border border-transparent',
                    ]"
                    @click="createForm.branch = branch.name"
                  >
                    <svg
                      class="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                      />
                    </svg>
                    <span class="text-sm text-gray-200">{{ branch.name }}</span>
                    <svg
                      v-if="createForm.branch === branch.name"
                      class="w-4 h-4 text-primary-400 ml-auto"
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
                  </div>
                </div>
              </div>

              <div
                v-if="selectedGitlabProject && projectStore.triggers.length > 0"
              >
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >选择触发器（可选）</label
                >
                <div class="space-y-1.5 max-h-24 overflow-y-auto">
                  <div
                    v-for="trigger in projectStore.triggers"
                    :key="trigger.id"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all',
                      createForm.triggerId === trigger.id
                        ? 'bg-primary-500/15 border border-primary-500/30'
                        : 'hover:bg-dark-700/60 border border-transparent',
                    ]"
                    @click="createForm.triggerId = trigger.id"
                  >
                    <span class="text-sm text-gray-200 flex-1">{{
                      trigger.description || "未命名触发器"
                    }}</span>
                    <svg
                      v-if="createForm.triggerId === trigger.id"
                      class="w-4 h-4 text-primary-400"
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
                  </div>
                </div>
              </div>
            </div>

            <div
              class="px-6 py-4 border-t border-dark-700/60 flex-shrink-0 flex gap-3"
            >
              <button class="flex-1 btn-ghost" @click="closeCreateModal">
                取消
              </button>
              <button
                class="flex-1 btn-primary"
                :disabled="
                  !createForm.name ||
                  !createForm.serverId ||
                  !selectedGitlabProject ||
                  !createForm.branch ||
                  saving
                "
                @click="createProject"
              >
                {{ saving ? "创建中..." : "创建项目" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="runModal.show"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            class="absolute inset-0 bg-black/60"
            @click="runModal.show = false"
          />
          <div
            class="relative bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div
              class="flex items-center justify-between px-6 py-5 border-b border-dark-700/60"
            >
              <div>
                <h3 class="text-base font-semibold text-white">运行项目</h3>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ runModal.project?.projectName }} -
                  {{ runModal.build?.tagName }}
                </p>
              </div>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 flex items-center justify-center transition-all"
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
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >端口</label
                >
                <input
                  v-model.number="runModal.port"
                  type="number"
                  class="form-input"
                  placeholder="3000"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-400 mb-2"
                  >启动命令</label
                >
                <input
                  v-model="runModal.runCommand"
                  class="form-input"
                  placeholder="npm start"
                />
              </div>
            </div>

            <div class="px-6 py-4 border-t border-dark-700/60 flex gap-3">
              <button class="flex-1 btn-ghost" @click="runModal.show = false">
                取消
              </button>
              <button
                class="flex-1 btn-primary"
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
import { useProjectStore } from "~/stores/project";
import { useBuildStore } from "~/stores/build";
import { useServerStore } from "~/stores/server";
import type { GitLabProject, ProjectConfig } from "~/types/project";
import type { BuildRecord } from "~/types/build";

const projectStore = useProjectStore();
const buildStore = useBuildStore();
const serverStore = useServerStore();
const toast = useToast();
const { confirm } = useConfirm();

const showCreateModal = ref(false);
const searchQuery = ref("");
const branchSearchQuery = ref("");
const selectedGitlabProject = ref<GitLabProject | null>(null);
const loadingGitlab = ref(false);
const loadingBranches = ref(false);
const saving = ref(false);

const createForm = reactive({
  name: "",
  branch: "",
  serverId: "",
  triggerId: null as number | null,
});

const filteredBranches = computed(() => {
  if (!branchSearchQuery.value.trim()) {
    return projectStore.branches;
  }
  const query = branchSearchQuery.value.toLowerCase();
  return projectStore.branches.filter((b) =>
    b.name.toLowerCase().includes(query)
  );
});

let searchTimer: ReturnType<typeof setTimeout> | null = null;

onMounted(async () => {
  await Promise.allSettled([
    projectStore.fetchSavedProjects(),
    buildStore.fetchHistory(),
    serverStore.fetchConfigs(),
  ]);
});

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      loadingGitlab.value = true;
      try {
        await projectStore.fetchGitlabProjects(searchQuery.value);
      } finally {
        loadingGitlab.value = false;
      }
    } else {
      projectStore.gitlabProjects = [];
    }
  }, 400);
}

async function selectGitlabProject(project: GitLabProject) {
  selectedGitlabProject.value = project;
  createForm.branch = project.defaultBranch;
  createForm.triggerId = null;
  loadingBranches.value = true;
  try {
    await projectStore.selectGitlabProject(project);
  } finally {
    loadingBranches.value = false;
  }
}

function openCreateModal() {
  showCreateModal.value = true;
  searchQuery.value = "";
  branchSearchQuery.value = "";
  selectedGitlabProject.value = null;
  createForm.name = "";
  createForm.branch = "";
  createForm.serverId = "";
  createForm.triggerId = null;
  projectStore.gitlabProjects = [];
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function createProject() {
  if (
    !createForm.name ||
    !createForm.serverId ||
    !selectedGitlabProject.value ||
    !createForm.branch
  )
    return;

  saving.value = true;
  try {
    await projectStore.saveProject({
      projectId: selectedGitlabProject.value.id,
      projectName: createForm.name,
      selectedBranch: createForm.branch,
      selectedTriggerId: createForm.triggerId,
      serverId: createForm.serverId,
      updatedAt: new Date().toISOString(),
    });
    closeCreateModal();
  } finally {
    saving.value = false;
  }
}

async function deleteProject(project: ProjectConfig) {
  const ok = await confirm({
    title: "确认删除",
    message: `确定要删除项目 "${project.projectName}" 吗？`,
    type: "danger",
    confirmText: "删除",
    cancelText: "取消",
  });
  if (!ok) return;
  await projectStore.deleteProject(project.id);
}

function getRunningBuild(
  configId: string | undefined
): BuildRecord | undefined {
  if (!configId) return undefined;
  return buildStore.getRunningBuild(configId);
}

function getServerName(serverId: string): string {
  if (!serverId) return "";
  const server = serverStore.configs.find((s) => s.id === serverId);
  return server?.name || "";
}

async function cancelBuild(project: ProjectConfig) {
  const running = getRunningBuild(project.id);
  if (!running) return;
  const ok = await confirm({
    title: "确认取消",
    message: "确定要取消当前正在进行的部署吗？",
    type: "warning",
    confirmText: "取消部署",
    cancelText: "继续",
  });
  if (!ok) return;
  await buildStore.cancelBuild(running.pipelineId, project.projectId);
}

async function triggerBuild(project: ProjectConfig) {
  if (!project.serverId) {
    toast.warning("请先为项目配置服务器");
    return;
  }

  let trigger = project.selectedTriggerId
    ? projectStore.triggers.find((t) => t.id === project.selectedTriggerId)
    : null;

  if (!trigger && project.selectedTriggerId) {
    try {
      const triggers = await $fetch(
        `/api/gitlab/projects/${project.projectId}/triggers`
      );
      trigger = (triggers as any[]).find(
        (t) => t.id === project.selectedTriggerId
      );
    } catch {
      // ignore
    }
  }

  if (!trigger) {
    toast.warning("未配置触发器，请先在 GitLab 项目中创建 Pipeline Trigger");
    return;
  }

  await buildStore.triggerBuild({
    configId: project.id,
    projectId: project.projectId,
    projectName: project.projectName,
    branch: project.selectedBranch,
    triggerId: trigger.id,
    triggerToken: trigger.token,
    serverId: project.serverId,
  });
}

function getLatestSuccessBuild(configId: string): BuildRecord | undefined {
  return buildStore.history.find(
    (r) => r.configId === configId && r.status === "success"
  );
}

function handleRun(project: ProjectConfig) {
  const build = getLatestSuccessBuild(project.id);
  if (!build) return;
  runModal.project = project;
  runModal.build = build;
  runModal.port = 3000;
  runModal.runCommand = "npm start";
  runModal.show = true;
}

function handleDownload(project: ProjectConfig) {
  const build = getLatestSuccessBuild(project.id);
  if (!build) return;
  downloadArtifact(build);
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

const runModal = reactive({
  show: false,
  project: null as ProjectConfig | null,
  build: null as BuildRecord | null,
  port: 3000,
  runCommand: "npm start",
  loading: false,
});

async function confirmRun() {
  if (!runModal.build) return;
  runModal.loading = true;
  try {
    await $fetch("/api/builds/run", {
      method: "POST",
      body: {
        recordId: runModal.build.id,
        port: runModal.port,
        runCommand: runModal.runCommand,
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
.form-input {
  @apply w-full bg-dark-700/60 border border-dark-600/60 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
