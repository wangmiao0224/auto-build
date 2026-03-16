<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-white">系统配置</h1>
      <p class="text-gray-500 text-sm mt-0.5">
        GitLab、服务器与通知渠道统一配置
      </p>
    </div>

    <!-- Tab 切换 -->
    <div
      class="flex gap-1 bg-dark-800 border border-dark-700/60 rounded-xl p-1 w-fit"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium transition-all',
          activeTab === tab.key
            ? 'bg-primary-600 text-white'
            : 'text-gray-400 hover:text-gray-200',
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- GitLab 配置 -->
    <div v-if="activeTab === 'gitlab'" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-400">管理多个 GitLab 实例</div>
        <button class="btn-primary text-sm" @click="openGitlabModal()">
          + 添加实例
        </button>
      </div>

      <div
        v-for="gl in gitlabConfigs"
        :key="gl.id"
        class="bg-dark-800 border border-dark-700/60 rounded-xl p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-xl"
            >
              🦊
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-white">{{
                  gl.name
                }}</span>
                <span
                  v-if="gl.isDefault"
                  class="px-1.5 py-0.5 text-xs bg-primary-600/20 text-primary-400 rounded"
                  >默认</span
                >
              </div>
              <div class="text-xs text-gray-500 font-mono">{{ gl.url }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="btn-ghost text-xs"
              @click="testGitlabConnection(gl.id)"
            >
              测试
            </button>
            <button class="btn-ghost text-xs" @click="openGitlabModal(gl)">
              编辑
            </button>
            <button
              class="btn-ghost text-xs text-red-400"
              @click="deleteGitlabConfig(gl.id)"
            >
              删除
            </button>
          </div>
        </div>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <div>
            <span class="text-gray-600">Webhook:</span>
            <code class="ml-1 text-primary-400">{{ gl.webhookUrl }}</code>
          </div>
          <div>
            <span class="text-gray-600">Secret:</span>
            <span class="ml-1">{{ gl.webhookSecret }}</span>
          </div>
        </div>
      </div>

      <div
        v-if="gitlabConfigs.length === 0"
        class="text-center py-12 text-gray-500"
      >
        暂无 GitLab 实例，点击上方按钮添加
      </div>

      <!-- GitLab Modal -->
      <Teleport to="body">
        <Transition name="modal">
          <div
            v-if="showGitlabModal"
            class="fixed inset-0 z-50 flex items-center justify-center p-4"
            @click.self="closeGitlabModal"
          >
            <div
              class="absolute inset-0 bg-black/60 backdrop-blur-sm"
              @click="closeGitlabModal"
            />
            <div
              class="relative bg-dark-800 border border-dark-700/60 rounded-xl w-full max-w-lg shadow-2xl"
            >
              <div
                class="flex items-center justify-between px-6 py-4 border-b border-dark-700/60"
              >
                <h3 class="text-base font-semibold text-white">
                  {{ editingGitlab ? "编辑 GitLab 实例" : "添加 GitLab 实例" }}
                </h3>
                <button
                  class="text-gray-500 hover:text-gray-300 transition-colors"
                  @click="closeGitlabModal"
                >
                  <svg
                    class="w-5 h-5"
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
              <div class="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                <div class="grid grid-cols-2 gap-4">
                  <div class="col-span-2">
                    <label class="form-label"
                      >名称 <span class="text-red-400">*</span></label
                    >
                    <input
                      v-model="gitlabForm.name"
                      class="form-input"
                      placeholder="如：公司 GitLab、GitLab.com"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="form-label"
                      >GitLab URL <span class="text-red-400">*</span></label
                    >
                    <input
                      v-model="gitlabForm.url"
                      class="form-input"
                      placeholder="https://gitlab.example.com"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="form-label"
                      >Personal Access Token
                      <span class="text-red-400">*</span></label
                    >
                    <input
                      v-model="gitlabForm.token"
                      class="form-input"
                      type="password"
                      :placeholder="
                        editingGitlab ? '不修改请留空' : 'glpat-xxxxxxxxxxxx'
                      "
                    />
                    <p class="text-xs text-gray-600 mt-1">
                      Token 需要 api、read_api 权限
                    </p>
                  </div>
                  <div class="col-span-2">
                    <label class="form-label">Webhook Secret</label>
                    <input
                      v-model="gitlabForm.webhookSecret"
                      class="form-input"
                      type="password"
                      placeholder="用于验证 Webhook 请求"
                    />
                  </div>
                  <div>
                    <label class="form-label">API 超时（秒）</label>
                    <input
                      v-model.number="gitlabForm.apiTimeout"
                      class="form-input"
                      type="number"
                      min="5"
                      max="120"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label class="form-label">重试次数</label>
                    <input
                      v-model.number="gitlabForm.apiRetryCount"
                      class="form-input"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label class="form-label">默认分支</label>
                    <input
                      v-model="gitlabForm.defaultBranch"
                      class="form-input"
                      placeholder="main"
                    />
                  </div>
                  <div>
                    <label class="form-label">缓存时间（秒）</label>
                    <input
                      v-model.number="gitlabForm.cacheTime"
                      class="form-input"
                      type="number"
                      min="0"
                      max="3600"
                      placeholder="300"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="form-label">代理地址</label>
                    <input
                      v-model="gitlabForm.proxyUrl"
                      class="form-input"
                      placeholder="http://proxy.example.com:8080"
                    />
                    <p class="text-xs text-gray-600 mt-1">
                      内网访问 GitLab 时使用
                    </p>
                  </div>
                  <div class="col-span-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="gitlabForm.isDefault"
                        type="checkbox"
                        class="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 rounded focus:ring-primary-500"
                      />
                      <span class="text-sm text-gray-300">设为默认实例</span>
                    </label>
                  </div>
                </div>
              </div>
              <div
                class="flex items-center justify-between px-6 py-4 border-t border-dark-700/60"
              >
                <button class="btn-ghost text-sm" @click="closeGitlabModal">
                  取消
                </button>
                <button
                  class="btn-primary text-sm"
                  :disabled="gitlabSaving"
                  @click="saveGitlabConfig"
                >
                  <span v-if="gitlabSaving" class="flex items-center gap-2">
                    <div
                      class="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin"
                    />
                    保存中...
                  </span>
                  <span v-else>保存</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>

    <!-- 打包配置 -->
    <div v-if="activeTab === 'build'" class="space-y-4">
      <div
        class="bg-dark-800 border border-dark-700/60 rounded-xl p-6 max-w-2xl"
      >
        <div class="flex items-center gap-3 mb-5">
          <div
            class="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-xl"
          >
            📦
          </div>
          <div>
            <div class="text-sm font-semibold text-white">打包配置</div>
            <div class="text-xs text-gray-500">
              下载文件命名、Git Tag、消息推送
            </div>
          </div>
        </div>
        <div class="space-y-5">
          <div>
            <label class="form-label">下载文件名命名规则</label>
            <input
              v-model="buildConfig.fileNamePattern"
              class="form-input"
              placeholder="{projectName}_{branch}_{tagName}"
            />
            <p class="text-xs text-gray-600 mt-1.5">
              可用变量: {projectName} 项目名、{branch} 分支、{tagName}
              标签名、{date} 日期、{time} 时间
            </p>
          </div>
          <div>
            <label class="form-label">Git Tag 命名规则</label>
            <input
              v-model="buildConfig.tagNamePattern"
              class="form-input"
              placeholder="{tagName}"
            />
            <p class="text-xs text-gray-600 mt-1.5">
              可用变量: {tagName} 标签名、{branch} 分支、{date} 日期、{time}
              时间
            </p>
          </div>
          <div
            class="flex items-center justify-between py-3 border-t border-dark-700/60"
          >
            <div>
              <div class="text-sm font-medium text-white">
                构建成功生成 Git Tag
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                构建成功后自动创建 Git Tag
              </div>
            </div>
            <button
              :class="[
                'w-10 h-5 rounded-full transition-all relative',
                buildConfig.createGitTag ? 'bg-primary-600' : 'bg-dark-600',
              ]"
              @click="buildConfig.createGitTag = !buildConfig.createGitTag"
            >
              <div
                :class="[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  buildConfig.createGitTag ? 'translate-x-5' : 'translate-x-1',
                ]"
              />
            </button>
          </div>
          <div class="grid grid-cols-2 gap-4 border-t border-dark-700/60 pt-4">
            <div>
              <label class="form-label">构建超时时间（分钟）</label>
              <input
                v-model.number="buildConfig.buildTimeout"
                type="number"
                min="1"
                class="form-input"
                placeholder="60"
              />
              <p class="text-xs text-gray-600 mt-1.5">超时后自动标记构建失败</p>
            </div>
            <div>
              <label class="form-label">历史记录保留天数</label>
              <input
                v-model.number="buildConfig.historyRetentionDays"
                type="number"
                min="1"
                class="form-input"
                placeholder="30"
              />
              <p class="text-xs text-gray-600 mt-1.5">
                超过天数的历史记录自动清理
              </p>
            </div>
          </div>
          <div class="border-t border-dark-700/60 pt-4">
            <label class="form-label mb-3">消息推送类型</label>
            <div class="grid grid-cols-2 gap-3">
              <label
                class="flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all cursor-pointer"
                :class="
                  buildConfig.notifyOnStart
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                "
              >
                <input
                  v-model="buildConfig.notifyOnStart"
                  type="checkbox"
                  class="w-4 h-4 accent-primary-500"
                />
                <span class="text-sm text-gray-300">开始打包</span>
              </label>
              <label
                class="flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all cursor-pointer"
                :class="
                  buildConfig.notifyOnSuccess
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                "
              >
                <input
                  v-model="buildConfig.notifyOnSuccess"
                  type="checkbox"
                  class="w-4 h-4 accent-primary-500"
                />
                <span class="text-sm text-gray-300">构建成功</span>
              </label>
              <label
                class="flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all cursor-pointer"
                :class="
                  buildConfig.notifyOnFailure
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                "
              >
                <input
                  v-model="buildConfig.notifyOnFailure"
                  type="checkbox"
                  class="w-4 h-4 accent-primary-500"
                />
                <span class="text-sm text-gray-300">构建失败</span>
              </label>
              <label
                class="flex items-center gap-2.5 px-4 py-3 rounded-lg border transition-all cursor-pointer"
                :class="
                  buildConfig.notifyOnCancel
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-dark-500'
                "
              >
                <input
                  v-model="buildConfig.notifyOnCancel"
                  type="checkbox"
                  class="w-4 h-4 accent-primary-500"
                />
                <span class="text-sm text-gray-300">取消构建</span>
              </label>
            </div>
          </div>
          <div
            class="flex items-center justify-between py-3 border-t border-dark-700/60"
          >
            <div>
              <div class="text-sm font-medium text-white">
                构建成功发送产物到企业微信群
              </div>
              <div class="text-xs text-gray-500 mt-0.5">
                自动将构建产物发送到企业微信群（需配置企业微信机器人）
              </div>
            </div>
            <button
              :class="[
                'w-10 h-5 rounded-full transition-all relative',
                buildConfig.sendArtifactToWecom
                  ? 'bg-primary-600'
                  : 'bg-dark-600',
              ]"
              @click="
                buildConfig.sendArtifactToWecom =
                  !buildConfig.sendArtifactToWecom
              "
            >
              <div
                :class="[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  buildConfig.sendArtifactToWecom
                    ? 'translate-x-5'
                    : 'translate-x-1',
                ]"
              />
            </button>
          </div>
          <div
            v-if="buildConfig.sendArtifactToWecom"
            class="grid grid-cols-2 gap-4 border-t border-dark-700/60 pt-4"
          >
            <div>
              <label class="form-label">产物超过 20MB 时</label>
              <select
                v-model="buildConfig.artifactOversizedAction"
                class="form-input"
              >
                <option value="skip">跳过发送</option>
                <option value="link">发送下载链接</option>
                <option value="notify">仅发送通知</option>
              </select>
            </div>
            <div>
              <label class="form-label">发送失败重试次数</label>
              <input
                v-model.number="buildConfig.artifactSendRetryCount"
                type="number"
                min="0"
                max="10"
                class="form-input"
                placeholder="3"
              />
            </div>
          </div>
        </div>
        <div
          class="flex items-center gap-3 mt-5 pt-5 border-t border-dark-700/60"
        >
          <button
            class="btn-primary text-sm"
            :disabled="buildSaving"
            @click="saveBuildConfig"
          >
            {{ buildSaving ? "保存中..." : "保存配置" }}
          </button>
          <span
            v-if="buildMsg"
            :class="[
              'text-xs',
              buildMsg.ok ? 'text-success-400' : 'text-red-400',
            ]"
            >{{ buildMsg.text }}</span
          >
        </div>
      </div>
    </div>

    <!-- 服务器配置 -->
    <div v-if="activeTab === 'server'" class="space-y-4">
      <div class="flex justify-end">
        <button
          class="btn-primary flex items-center gap-2 text-sm"
          @click="showServerModal = true"
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
          添加服务器
        </button>
      </div>
      <div v-if="serverStore.loading" class="flex justify-center py-12">
        <div
          class="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
      <div
        v-else-if="serverStore.configs.length === 0"
        class="bg-dark-800 border border-dark-700/60 rounded-xl py-16 flex flex-col items-center gap-3"
      >
        <div class="text-4xl opacity-30">🖥️</div>
        <p class="text-gray-500 text-sm">暂无服务器配置</p>
        <button class="btn-primary text-sm" @click="showServerModal = true">
          添加第一台服务器
        </button>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div
          v-for="server in serverStore.configs"
          :key="server.id"
          class="bg-dark-800 border border-dark-700/60 rounded-xl p-5 hover:border-dark-600 transition-all group"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"
                  />
                </svg>
              </div>
              <div>
                <div class="text-sm font-semibold text-white">
                  {{ server.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ server.username }}@{{ server.host }}:{{ server.port }}
                </div>
              </div>
            </div>
            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all flex items-center justify-center"
                title="服务管理"
                @click="router.push(`/server/${server.id}`)"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all flex items-center justify-center"
                title="测试连接"
                @click="testServerConn(server)"
              >
                <svg
                  class="w-3.5 h-3.5"
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
              </button>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-600 transition-all flex items-center justify-center"
                title="编辑"
                @click="editServer(server)"
              >
                <svg
                  class="w-3.5 h-3.5"
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
              </button>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
                title="删除"
                @click="deleteServer(server.id)"
              >
                <svg
                  class="w-3.5 h-3.5"
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
            v-if="serverTestResults[server.id]"
            class="mt-2 pt-2 border-t border-dark-700/60"
          >
            <span
              :class="[
                'text-xs',
                serverTestResults[server.id].success
                  ? 'text-success-400'
                  : 'text-red-400',
              ]"
            >
              {{ serverTestResults[server.id].message }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知配置 -->
    <div v-if="activeTab === 'notification'" class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 钉钉 -->
        <div class="bg-dark-800 border border-dark-700/60 rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-lg"
              >
                🔔
              </div>
              <div>
                <div class="text-sm font-semibold text-white">钉钉通知</div>
                <div class="text-xs text-gray-500">
                  通过 Webhook 发送到钉钉群
                </div>
              </div>
            </div>
            <button
              :class="[
                'w-10 h-5 rounded-full transition-all relative',
                notifConfig.dingtalk.enabled ? 'bg-primary-600' : 'bg-dark-600',
              ]"
              @click="
                notifConfig.dingtalk.enabled = !notifConfig.dingtalk.enabled
              "
            >
              <div
                :class="[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  notifConfig.dingtalk.enabled
                    ? 'translate-x-5'
                    : 'translate-x-1',
                ]"
              />
            </button>
          </div>
          <div v-if="notifConfig.dingtalk.enabled" class="space-y-3">
            <div>
              <label class="form-label">Webhook URL</label
              ><input
                v-model="notifConfig.dingtalk.webhook"
                class="form-input"
                placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              />
            </div>
            <div>
              <label class="form-label">签名 Secret（可选）</label
              ><input
                v-model="notifConfig.dingtalk.secret"
                class="form-input"
                placeholder="SEC..."
              />
            </div>
            <div>
              <label class="form-label">消息格式模板</label>
              <textarea
                v-model="notifConfig.dingtalk.template"
                class="form-input min-h-[100px] resize-y"
                placeholder="## 构建通知&#10;项目：{projectName}&#10;分支：{branch}&#10;状态：{status}"
              />
              <p class="text-xs text-gray-600 mt-1">
                支持 Markdown。变量: {projectName} {branch} {tagName} {status}
                {pipelineId} {webUrl} {duration}
              </p>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <label
                class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer"
                ><input
                  v-model="notifConfig.dingtalk.onSuccess"
                  type="checkbox"
                  class="accent-primary-500"
                />成功时通知</label
              >
              <label
                class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer"
                ><input
                  v-model="notifConfig.dingtalk.onFailure"
                  type="checkbox"
                  class="accent-primary-500"
                />失败时通知</label
              >
            </div>
            <div class="border-t border-dark-700/60 pt-3 mt-2">
              <label class="form-label">@人员配置</label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="notifConfig.dingtalk.atUserIds"
                  class="form-input text-xs"
                  placeholder="用户ID，逗号分隔"
                />
                <input
                  v-model="notifConfig.dingtalk.atMobiles"
                  class="form-input text-xs"
                  placeholder="手机号，逗号分隔"
                />
              </div>
              <p class="text-xs text-gray-600 mt-1">失败时会 @ 配置的人员</p>
            </div>
            <button
              class="text-xs text-primary-400 hover:text-primary-300"
              @click="testChannel('dingtalk')"
            >
              发送测试消息
            </button>
          </div>
        </div>
        <!-- 企业微信 -->
        <div class="bg-dark-800 border border-dark-700/60 rounded-xl p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-success-500/15 flex items-center justify-center text-lg"
              >
                💬
              </div>
              <div>
                <div class="text-sm font-semibold text-white">企业微信</div>
                <div class="text-xs text-gray-500">发送到企业微信群机器人</div>
              </div>
            </div>
            <button
              :class="[
                'w-10 h-5 rounded-full transition-all relative',
                notifConfig.wecom.enabled ? 'bg-primary-600' : 'bg-dark-600',
              ]"
              @click="notifConfig.wecom.enabled = !notifConfig.wecom.enabled"
            >
              <div
                :class="[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  notifConfig.wecom.enabled ? 'translate-x-5' : 'translate-x-1',
                ]"
              />
            </button>
          </div>
          <div v-if="notifConfig.wecom.enabled" class="space-y-3">
            <div>
              <label class="form-label">Webhook URL</label
              ><input
                v-model="notifConfig.wecom.webhook"
                class="form-input"
                placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              />
            </div>
            <div>
              <label class="form-label">消息格式模板</label>
              <textarea
                v-model="notifConfig.wecom.template"
                class="form-input min-h-[100px] resize-y"
                placeholder="构建通知&#10;项目：{projectName}&#10;分支：{branch}&#10;状态：{status}"
              />
              <p class="text-xs text-gray-600 mt-1">
                支持 Markdown。变量: {projectName} {branch} {tagName} {status}
                {pipelineId} {webUrl} {duration}
              </p>
            </div>
            <div class="flex items-center gap-3 pt-1">
              <label
                class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer"
                ><input
                  v-model="notifConfig.wecom.onSuccess"
                  type="checkbox"
                  class="accent-primary-500"
                />成功时通知</label
              >
              <label
                class="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer"
                ><input
                  v-model="notifConfig.wecom.onFailure"
                  type="checkbox"
                  class="accent-primary-500"
                />失败时通知</label
              >
            </div>
            <div class="border-t border-dark-700/60 pt-3 mt-2">
              <label class="form-label">@人员配置</label>
              <input
                v-model="notifConfig.wecom.atUserIds"
                class="form-input text-xs"
                placeholder="用户ID，逗号分隔"
              />
              <p class="text-xs text-gray-600 mt-1">失败时会 @ 配置的人员</p>
            </div>
            <button
              class="text-xs text-primary-400 hover:text-primary-300"
              @click="testChannel('wecom')"
            >
              发送测试消息
            </button>
          </div>
        </div>
        <!-- 自定义 Webhook -->
        <div
          class="bg-dark-800 border border-dark-700/60 rounded-xl p-5 lg:col-span-2"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div
                class="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-lg"
              >
                🔗
              </div>
              <div>
                <div class="text-sm font-semibold text-white">
                  自定义 Webhook
                </div>
                <div class="text-xs text-gray-500">构建完成后回调指定 URL</div>
              </div>
            </div>
            <button
              :class="[
                'w-10 h-5 rounded-full transition-all relative',
                notifConfig.webhook.enabled ? 'bg-primary-600' : 'bg-dark-600',
              ]"
              @click="
                notifConfig.webhook.enabled = !notifConfig.webhook.enabled
              "
            >
              <div
                :class="[
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  notifConfig.webhook.enabled
                    ? 'translate-x-5'
                    : 'translate-x-1',
                ]"
              />
            </button>
          </div>
          <div
            v-if="notifConfig.webhook.enabled"
            class="grid grid-cols-2 gap-4"
          >
            <div class="col-span-2">
              <label class="form-label">回调 URL</label
              ><input
                v-model="notifConfig.webhook.url"
                class="form-input"
                placeholder="https://your-server.com/webhook/build"
              />
            </div>
            <div>
              <label class="form-label">请求方法</label
              ><select v-model="notifConfig.webhook.method" class="form-input">
                <option>POST</option>
                <option>PUT</option>
              </select>
            </div>
            <div>
              <label class="form-label">Authorization Header（可选）</label
              ><input
                v-model="notifConfig.webhook.auth"
                class="form-input"
                placeholder="Bearer token..."
              />
            </div>
          </div>
        </div>
        <!-- 静默时段 & 频率限制 -->
        <div
          class="bg-dark-800 border border-dark-700/60 rounded-xl p-5 lg:col-span-2"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="text-sm font-medium text-white">静默时段</div>
                  <div class="text-xs text-gray-500">夜间不发送通知</div>
                </div>
                <button
                  :class="[
                    'w-10 h-5 rounded-full transition-all relative',
                    notifConfig.quietHours.enabled
                      ? 'bg-primary-600'
                      : 'bg-dark-600',
                  ]"
                  @click="
                    notifConfig.quietHours.enabled =
                      !notifConfig.quietHours.enabled
                  "
                >
                  <div
                    :class="[
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      notifConfig.quietHours.enabled
                        ? 'translate-x-5'
                        : 'translate-x-1',
                    ]"
                  />
                </button>
              </div>
              <div
                v-if="notifConfig.quietHours.enabled"
                class="grid grid-cols-2 gap-2"
              >
                <div>
                  <label class="form-label text-xs">开始时间</label>
                  <input
                    v-model="notifConfig.quietHours.start"
                    type="time"
                    class="form-input"
                  />
                </div>
                <div>
                  <label class="form-label text-xs">结束时间</label>
                  <input
                    v-model="notifConfig.quietHours.end"
                    type="time"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between mb-3">
                <div>
                  <div class="text-sm font-medium text-white">通知频率限制</div>
                  <div class="text-xs text-gray-500">
                    同一项目短时间内只通知一次
                  </div>
                </div>
                <button
                  :class="[
                    'w-10 h-5 rounded-full transition-all relative',
                    notifConfig.rateLimit.enabled
                      ? 'bg-primary-600'
                      : 'bg-dark-600',
                  ]"
                  @click="
                    notifConfig.rateLimit.enabled =
                      !notifConfig.rateLimit.enabled
                  "
                >
                  <div
                    :class="[
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                      notifConfig.rateLimit.enabled
                        ? 'translate-x-5'
                        : 'translate-x-1',
                    ]"
                  />
                </button>
              </div>
              <div v-if="notifConfig.rateLimit.enabled">
                <label class="form-label text-xs">间隔时间（分钟）</label>
                <input
                  v-model.number="notifConfig.rateLimit.intervalMinutes"
                  type="number"
                  min="1"
                  class="form-input"
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end">
        <button
          class="btn-primary text-sm"
          :disabled="notifSaving"
          @click="saveNotifConfig"
        >
          {{ notifSaving ? "保存中..." : "保存通知配置" }}
        </button>
      </div>
    </div>

    <!-- 服务器 Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showServerModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="closeServerModal"
        >
          <div
            class="absolute inset-0 bg-black/60 backdrop-blur-sm"
            @click="closeServerModal"
          />
          <div
            class="relative w-full max-w-lg bg-dark-800 border border-dark-700/60 rounded-2xl shadow-2xl"
          >
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-dark-700/60"
            >
              <h3 class="text-base font-semibold text-white">
                {{ editingServer ? "编辑服务器" : "添加服务器" }}
              </h3>
              <button
                class="w-7 h-7 rounded-lg text-gray-500 hover:text-gray-200 hover:bg-dark-700 flex items-center justify-center"
                @click="closeServerModal"
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
            <div class="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="form-label"
                    >名称 <span class="text-red-400">*</span></label
                  ><input
                    v-model="serverForm.name"
                    class="form-input"
                    placeholder="如：生产服务器01"
                  />
                </div>
                <div>
                  <label class="form-label"
                    >主机 IP <span class="text-red-400">*</span></label
                  ><input
                    v-model="serverForm.host"
                    class="form-input"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label class="form-label">SSH 端口</label
                  ><input
                    v-model.number="serverForm.port"
                    class="form-input"
                    type="number"
                    placeholder="22"
                  />
                </div>
                <div>
                  <label class="form-label"
                    >用户名 <span class="text-red-400">*</span></label
                  ><input
                    v-model="serverForm.username"
                    class="form-input"
                    placeholder="root"
                  />
                </div>
                <div>
                  <label class="form-label">密码</label
                  ><input
                    v-model="serverForm.password"
                    class="form-input"
                    type="password"
                    :placeholder="editingServer ? '不修改请留空' : '服务器密码'"
                  />
                </div>
                <div>
                  <label class="form-label">SSH 私钥</label
                  ><textarea
                    v-model="serverForm.privateKey"
                    class="form-input min-h-[60px] text-xs font-mono"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  />
                </div>
                <div>
                  <label class="form-label">私钥密码</label
                  ><input
                    v-model="serverForm.passphrase"
                    class="form-input"
                    type="password"
                    placeholder="私钥密码（如有）"
                  />
                </div>
                <div class="col-span-2">
                  <label class="form-label"
                    >工作目录 <span class="text-red-400">*</span></label
                  ><input
                    v-model="serverForm.workDir"
                    class="form-input"
                    placeholder="/home/deploy"
                  />
                </div>
                <div>
                  <label class="form-label">分组</label
                  ><input
                    v-model="serverForm.group"
                    class="form-input"
                    placeholder="如：生产环境、测试环境"
                  />
                </div>
                <div class="col-span-2">
                  <label class="form-label"
                    >操作系统 <span class="text-red-400">*</span></label
                  >
                  <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="serverForm.os"
                        type="radio"
                        value="linux"
                        class="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 focus:ring-primary-500"
                      />
                      <span class="text-sm text-gray-300">Linux</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        v-model="serverForm.os"
                        type="radio"
                        value="windows"
                        class="w-4 h-4 text-primary-600 bg-dark-700 border-dark-600 focus:ring-primary-500"
                      />
                      <span class="text-sm text-gray-300">Windows</span>
                    </label>
                  </div>
                </div>
                <div class="col-span-2">
                  <label class="form-label">环境变量</label
                  ><textarea
                    v-model="serverForm.envVars"
                    class="form-input min-h-[60px]"
                    placeholder="NODE_ENV=production&#10;API_URL=https://api.example.com"
                  />
                  <p class="text-xs text-gray-600 mt-1">
                    每行一个，格式：KEY=VALUE
                  </p>
                </div>
                <div class="col-span-2">
                  <label class="form-label">部署前脚本</label
                  ><textarea
                    v-model="serverForm.preDeployScript"
                    class="form-input min-h-[60px] font-mono text-xs"
                    placeholder="echo '开始部署'&#10;pm2 stop all"
                  />
                </div>
                <div class="col-span-2">
                  <label class="form-label">部署后脚本</label
                  ><textarea
                    v-model="serverForm.postDeployScript"
                    class="form-input min-h-[60px] font-mono text-xs"
                    placeholder="pm2 restart all&#10;nginx -s reload"
                  />
                </div>
                <div class="col-span-2">
                  <label class="form-label">健康检查 URL</label
                  ><input
                    v-model="serverForm.healthCheckUrl"
                    class="form-input"
                    placeholder="http://localhost:3000/health"
                  />
                </div>
                <div>
                  <label class="form-label">健康检查超时（秒）</label
                  ><input
                    v-model.number="serverForm.healthCheckTimeout"
                    class="form-input"
                    type="number"
                    min="1"
                    max="300"
                    placeholder="30"
                  />
                </div>
                <div class="col-span-2">
                  <label class="form-label">备注</label
                  ><input
                    v-model="serverForm.description"
                    class="form-input"
                    placeholder="可选备注信息"
                  />
                </div>
              </div>
            </div>
            <div
              class="flex items-center justify-between px-6 py-4 border-t border-dark-700/60"
            >
              <button class="btn-ghost text-sm" @click="closeServerModal">
                取消
              </button>
              <button
                class="btn-primary text-sm"
                :disabled="serverSaving"
                @click="saveServer"
              >
                {{ serverSaving ? "保存中..." : "保存" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useServerStore } from "~/stores/server";
import type { ServerConfig } from "~/types/server";

const router = useRouter();
const route = useRoute();
const serverStore = useServerStore();
const toast = useToast();
const { confirm } = useConfirm();

const tabs = [
  { key: "gitlab", label: "GitLab 配置" },
  { key: "build", label: "打包配置" },
  { key: "server", label: "服务器配置" },
  { key: "notification", label: "通知配置" },
];
const activeTab = ref(route.query.tab || "gitlab");

// GitLab
const gitlabConfigs = ref<any[]>([]);
const showGitlabModal = ref(false);
const gitlabSaving = ref(false);
const editingGitlab = ref<any>(null);
const gitlabForm = reactive({
  name: "",
  url: "",
  token: "",
  webhookSecret: "",
  apiTimeout: 30,
  apiRetryCount: 3,
  defaultBranch: "main",
  proxyUrl: "",
  cacheTime: 300,
  isDefault: false,
});

async function loadGitlabConfigs() {
  try {
    const configs = await $fetch<any[]>("/api/gitlab/configs");
    gitlabConfigs.value = configs;
  } catch {
    gitlabConfigs.value = [];
  }
}

function openGitlabModal(gl?: any) {
  editingGitlab.value = gl || null;
  if (gl) {
    Object.assign(gitlabForm, {
      name: gl.name,
      url: gl.url,
      token: "",
      webhookSecret: "",
      apiTimeout: gl.apiTimeout || 30,
      apiRetryCount: gl.apiRetryCount || 3,
      defaultBranch: gl.defaultBranch || "main",
      proxyUrl: gl.proxyUrl || "",
      cacheTime: gl.cacheTime || 300,
      isDefault: gl.isDefault || false,
    });
  } else {
    Object.assign(gitlabForm, {
      name: "",
      url: "",
      token: "",
      webhookSecret: "",
      apiTimeout: 30,
      apiRetryCount: 3,
      defaultBranch: "main",
      proxyUrl: "",
      cacheTime: 300,
      isDefault: false,
    });
  }
  showGitlabModal.value = true;
}

function closeGitlabModal() {
  showGitlabModal.value = false;
  editingGitlab.value = null;
}

async function saveGitlabConfig() {
  if (!gitlabForm.name || !gitlabForm.url) {
    return toast.warning("请填写必填字段");
  }
  if (!editingGitlab.value && !gitlabForm.token) {
    return toast.warning("Token 不能为空");
  }

  gitlabSaving.value = true;
  try {
    if (editingGitlab.value) {
      await $fetch(`/api/gitlab/configs/${editingGitlab.value.id}`, {
        method: "PUT",
        body: gitlabForm,
      });
    } else {
      await $fetch("/api/gitlab/configs", {
        method: "POST",
        body: gitlabForm,
      });
    }
    closeGitlabModal();
    await loadGitlabConfigs();
    toast.success("保存成功");
  } catch (e: any) {
    toast.error("保存失败：" + e.message);
  } finally {
    gitlabSaving.value = false;
  }
}

async function deleteGitlabConfig(id: string) {
  const ok = await confirm({
    title: "确认删除",
    message: "确定要删除此 GitLab 实例吗？",
    type: "danger",
    confirmText: "删除",
    cancelText: "取消",
  });
  if (!ok) return;
  try {
    await $fetch(`/api/gitlab/configs/${id}`, { method: "DELETE" });
    await loadGitlabConfigs();
    toast.success("删除成功");
  } catch (e: any) {
    toast.error("删除失败：" + e.message);
  }
}

async function testGitlabConnection(id: string) {
  try {
    const result = await $fetch<{ success: boolean; message: string }>(
      "/api/gitlab/test",
      {
        method: "POST",
        body: { id },
      }
    );
    if (result.success) {
      toast.success("连接成功");
    } else {
      toast.error(`连接失败: ${result.message}`);
    }
  } catch (e: any) {
    toast.error("测试失败：" + e.message);
  }
}

// Build Config
const buildSaving = ref(false);
const buildMsg = ref<{ ok: boolean; text: string } | null>(null);
const buildConfig = reactive({
  fileNamePattern: "{projectName}_{branch}_{tagName}",
  tagNamePattern: "{tagName}",
  createGitTag: false,
  buildTimeout: 60,
  historyRetentionDays: 30,
  notifyOnStart: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  notifyOnCancel: false,
  sendArtifactToWecom: false,
  artifactOversizedAction: "skip" as "skip" | "link" | "notify",
  artifactSendRetryCount: 3,
});

async function loadBuildConfig() {
  try {
    const r = await $fetch<typeof buildConfig>("/api/builds/config");
    if (r) Object.assign(buildConfig, r);
  } catch {}
}

async function saveBuildConfig() {
  buildSaving.value = true;
  buildMsg.value = null;
  try {
    await $fetch("/api/builds/config", { method: "POST", body: buildConfig });
    buildMsg.value = { ok: true, text: "保存成功" };
  } catch (e: any) {
    buildMsg.value = { ok: false, text: e?.message ?? "保存失败" };
  } finally {
    buildSaving.value = false;
  }
}

// Server
const showServerModal = ref(false);
const serverSaving = ref(false);
const editingServer = ref<ServerConfig | null>(null);
const serverTestResults = ref<
  Record<string, { success: boolean; message: string }>
>({});
const serverForm = reactive({
  name: "",
  host: "",
  port: 22,
  username: "",
  password: "",
  privateKey: "",
  passphrase: "",
  workDir: "",
  os: "linux" as "windows" | "linux",
  group: "",
  envVars: "",
  preDeployScript: "",
  postDeployScript: "",
  healthCheckUrl: "",
  healthCheckTimeout: 30,
  description: "",
});

function editServer(s: ServerConfig) {
  editingServer.value = s;
  Object.assign(serverForm, {
    name: s.name,
    host: s.host,
    port: s.port,
    username: s.username,
    password: "",
    privateKey: "",
    passphrase: "",
    workDir: s.workDir,
    os: s.os || "linux",
    group: s.group || "",
    envVars: s.envVars || "",
    preDeployScript: s.preDeployScript || "",
    postDeployScript: s.postDeployScript || "",
    healthCheckUrl: s.healthCheckUrl || "",
    healthCheckTimeout: s.healthCheckTimeout || 30,
    description: s.description,
  });
  showServerModal.value = true;
}

function closeServerModal() {
  showServerModal.value = false;
  editingServer.value = null;
  Object.assign(serverForm, {
    name: "",
    host: "",
    port: 22,
    username: "",
    password: "",
    privateKey: "",
    passphrase: "",
    workDir: "",
    os: "linux",
    group: "",
    envVars: "",
    preDeployScript: "",
    postDeployScript: "",
    healthCheckUrl: "",
    healthCheckTimeout: 30,
    description: "",
  });
}

async function saveServer() {
  if (
    !serverForm.name ||
    !serverForm.host ||
    !serverForm.username ||
    !serverForm.workDir
  )
    return toast.warning("请填写必填字段");
  if (!editingServer.value && !serverForm.password && !serverForm.privateKey) {
    return toast.warning("密码或私钥至少填写一项");
  }
  serverSaving.value = true;
  try {
    if (editingServer.value) {
      await serverStore.updateConfig(editingServer.value.id, serverForm);
    } else {
      await serverStore.addConfig(serverForm);
    }
    closeServerModal();
    toast.success("保存成功");
  } catch (e: any) {
    toast.error("保存失败：" + e.message);
  } finally {
    serverSaving.value = false;
  }
}

async function deleteServer(id: string) {
  const ok = await confirm({
    title: "确认删除",
    message: "确定要删除此服务器配置吗？",
    type: "danger",
    confirmText: "删除",
    cancelText: "取消",
  });
  if (!ok) return;
  try {
    await serverStore.deleteConfig(id);
    toast.success("删除成功");
  } catch (e: any) {
    toast.error("删除失败：" + e.message);
  }
}

async function testServerConn(s: ServerConfig) {
  serverTestResults.value[s.id] = { success: false, message: "测试中..." };
  try {
    const r = (await serverStore.testConnection(s.id)) as any;
    serverTestResults.value[s.id] = r;
  } catch (e: any) {
    serverTestResults.value[s.id] = { success: false, message: e.message };
  }
}

// Notification
const notifSaving = ref(false);
const notifConfig = reactive({
  dingtalk: {
    enabled: false,
    webhook: "",
    secret: "",
    template: `## 构建通知
项目：{projectName}
分支：{branch}
Tag：{tagName}
状态：{status}
Pipeline：#{pipelineId}
链接：{webUrl}`,
    onSuccess: true,
    onFailure: true,
    atUserIds: "",
    atMobiles: "",
  },
  wecom: {
    enabled: false,
    webhook: "",
    template: `构建通知
项目：{projectName}
分支：{branch}
Tag：{tagName}
状态：{status}
Pipeline：#{pipelineId}
链接：{webUrl}`,
    onSuccess: true,
    onFailure: true,
    atUserIds: "",
  },
  webhook: { enabled: false, url: "", method: "POST", auth: "" },
  quietHours: { enabled: false, start: "22:00", end: "08:00" },
  rateLimit: { enabled: false, intervalMinutes: 5 },
});

async function saveNotifConfig() {
  notifSaving.value = true;
  try {
    await $fetch("/api/notifications/config", {
      method: "POST",
      body: notifConfig,
    });
  } finally {
    notifSaving.value = false;
  }
}

async function testChannel(channel: string) {
  try {
    const r = await $fetch<{ success: boolean; message: string }>(
      "/api/notifications/test",
      { method: "POST", body: { channel } }
    );
    if (r.success) {
      toast.success("测试消息发送成功");
    } else {
      toast.error(`发送失败：${r.message}`);
    }
  } catch (e: any) {
    toast.error(`发送失败：${e.message}`);
  }
}

onMounted(async () => {
  serverStore.fetchConfigs();
  loadGitlabConfigs();
  loadBuildConfig();
  try {
    const d = await $fetch<typeof notifConfig>("/api/notifications/config");
    if (d) Object.assign(notifConfig, d);
  } catch {}
});
</script>

<style scoped>
.btn-primary {
  @apply px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-ghost {
  @apply px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-dark-700 rounded-lg font-medium transition-all;
}
.form-label {
  @apply block text-xs font-medium text-gray-400 mb-1.5;
}
.form-input {
  @apply w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors;
}
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
