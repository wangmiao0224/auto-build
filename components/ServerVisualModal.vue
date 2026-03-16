<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="flex flex-col">
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="$emit('close')"
        >
          <div
            class="absolute inset-0 bg-black/70 backdrop-blur-sm"
            @click="$emit('close')"
          />
          <div
            class="relative w-full max-w-5xl bg-dark-900 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[85vh] flex flex-col overflow-hidden"
          >
            <!-- 文件管理器头部 -->
            <div
              class="bg-dark-800 border-b border-dark-700 px-4 py-2 flex items-center gap-2"
            >
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-red-500" />
                <div class="w-3 h-3 rounded-full bg-yellow-500" />
                <div class="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div
                class="flex items-center gap-2 text-xs text-gray-400 font-mono"
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>文件浏览器</span>
              </div>
              <button
                @click="$emit('close')"
                class="ml-auto p-1 hover:bg-dark-700 rounded"
              >
                <svg
                  class="w-4 h-4 text-gray-400"
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

            <!-- 文件管理器内容 -->
            <div class="flex-1 flex overflow-hidden flex-col">
              <!-- 地址栏 -->
              <div
                class="bg-dark-800/50 border-b border-dark-700 px-4 py-2 flex items-center gap-2"
              >
                <button
                  @click="navigateTo(isWindows ? 'C:\\' : '/')"
                  class="text-xs text-gray-400 hover:text-white transition-colors font-mono"
                >
                  {{ isWindows ? "C:" : "/" }}
                </button>
                <span class="text-gray-600">{{ isWindows ? "\\" : "/" }}</span>
                <div class="flex-1 flex items-center gap-1 overflow-x-auto">
                  <button
                    v-for="item in breadcrumbItems"
                    :key="item.path"
                    @click="navigateTo(item.path)"
                    class="text-xs text-gray-400 hover:text-white transition-colors font-mono whitespace-nowrap"
                  >
                    {{ item.name }}
                  </button>
                </div>
                <button
                  @click="goBack"
                  :disabled="currentPath === (isWindows ? 'C:\\' : '/')"
                  class="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                <button
                  @click="goForward"
                  :disabled="forwardStack.length === 0"
                  class="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <button
                  @click="refreshFiles"
                  class="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white transition-colors"
                  title="刷新"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
                <button
                  @click="createNewFolder"
                  class="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white transition-colors"
                  title="新建文件夹"
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
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
                <label
                  class="p-1 rounded hover:bg-dark-700 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  title="上传文件"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  <input
                    type="file"
                    class="hidden"
                    @change="handleFileUpload"
                  />
                </label>
              </div>

              <div class="flex-1 flex overflow-hidden">
                <!-- 侧边栏快捷方式 -->
                <div
                  class="w-48 border-r border-dark-700/50 bg-dark-800/30 p-3 space-y-1"
                >
                  <div class="text-xs text-gray-500 font-mono mb-2 px-2">
                    快捷访问
                  </div>
                  <button
                    v-for="item in shortcuts"
                    :key="item.path"
                    @click="navigateTo(item.path)"
                    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-dark-700/50 transition-all"
                  >
                    <div
                      class="w-6 h-6 rounded flex items-center justify-center"
                      :class="item.bgClass"
                    >
                      <component
                        :is="item.icon"
                        class="w-3.5 h-3.5"
                        :class="item.iconClass"
                      />
                    </div>
                    <span>{{ item.name }}</span>
                  </button>
                </div>

                <!-- 文件列表区域 -->
                <div class="flex-1 overflow-y-auto">
                  <!-- 加载状态 -->
                  <div
                    v-if="loading"
                    class="flex items-center justify-center py-20"
                  >
                    <div class="text-center">
                      <div
                        class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                      />
                      <p class="text-gray-500 text-sm">加载中...</p>
                    </div>
                  </div>

                  <!-- 空状态 -->
                  <div
                    v-else-if="files.length === 0"
                    class="flex items-center justify-center py-20"
                  >
                    <div class="text-center text-gray-500">
                      <svg
                        class="w-12 h-12 mx-auto mb-3 opacity-50"
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
                      <p class="text-sm">该目录为空</p>
                    </div>
                  </div>

                  <!-- 文件表格 -->
                  <table v-else class="w-full">
                    <thead class="bg-dark-800/50 sticky top-0">
                      <tr class="text-left text-xs text-gray-500 font-mono">
                        <th class="px-4 py-2 font-medium">名称</th>
                        <th class="px-4 py-2 font-medium w-24">大小</th>
                        <th class="px-4 py-2 font-medium w-40">修改时间</th>
                        <th class="px-4 py-2 font-medium w-16">操作</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-dark-700/30">
                      <!-- 父目录 -->
                      <tr
                        v-if="currentPath !== (isWindows ? 'C:\\' : '/')"
                        @click="goBack"
                        class="hover:bg-dark-700/30 cursor-pointer"
                      >
                        <td class="px-4 py-2.5">
                          <div class="flex items-center gap-3">
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
                                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                              />
                            </svg>
                            <span class="text-gray-400">..</span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-gray-500">-</td>
                        <td class="px-4 py-2.5 text-gray-500">-</td>
                        <td class="px-4 py-2.5"></td>
                      </tr>
                      <!-- 文件/目录列表 -->
                      <tr
                        v-for="file in sortedFiles"
                        :key="file.name"
                        @click="
                          file.type === 'directory'
                            ? navigateTo(file.path)
                            : openFile(file)
                        "
                        class="hover:bg-dark-700/30 cursor-pointer"
                      >
                        <td class="px-4 py-2.5">
                          <div class="flex items-center gap-3">
                            <!-- 图标 -->
                            <div
                              class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                            >
                              <template v-if="file.type === 'directory'">
                                <svg
                                  class="w-5 h-5 text-purple-400"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v1H4a1 1 0 01-1-1V5a1 1 0 011-1h8l1 1v4h7a2 2 0 012 2v8a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </template>
                              <template v-else>
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </template>
                            </div>
                            <span class="text-gray-200 truncate">{{
                              file.name
                            }}</span>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-gray-400 font-mono text-sm">
                          {{
                            file.type === "directory"
                              ? "-"
                              : formatFileSize(file.size)
                          }}
                        </td>
                        <td class="px-4 py-2.5 text-gray-400 font-mono text-sm">
                          {{ formatFileTime(file.mtime) }}
                        </td>
                        <td class="px-4 py-2.5">
                          <div class="flex items-center gap-1">
                            <button
                              v-if="file.type === 'directory'"
                              @click.stop="navigateTo(file.path)"
                              class="p-1.5 rounded hover:bg-dark-600 text-gray-500 hover:text-white transition-colors"
                              title="打开"
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
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                            <button
                              v-if="file.type === 'file'"
                              @click.stop="previewFile(file)"
                              class="p-1.5 rounded hover:bg-dark-600 text-gray-500 hover:text-white transition-colors"
                              title="预览"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              @click.stop="renameFile(file)"
                              class="p-1.5 rounded hover:bg-dark-600 text-gray-500 hover:text-white transition-colors"
                              title="重命名"
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
                              @click.stop="moveFile(file)"
                              class="p-1.5 rounded hover:bg-dark-600 text-gray-500 hover:text-white transition-colors"
                              title="移动"
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
                                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                />
                              </svg>
                            </button>
                            <button
                              @click.stop="copyFile(file)"
                              class="p-1.5 rounded hover:bg-dark-600 text-gray-500 hover:text-white transition-colors"
                              title="复制"
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
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </button>
                            <button
                              @click.stop="deleteFile(file)"
                              class="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                              title="删除"
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
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- 底部状态栏 -->
              <div
                class="bg-dark-800 border-t border-dark-700 px-4 py-1.5 flex items-center justify-between text-xs text-gray-500 font-mono"
              >
                <span>{{ files.length }} 个项目</span>
                <span>{{ currentPath }}</span>
              </div>
            </div>
          </div>

          <!-- 预览弹窗 -->
          <Teleport to="body">
            <div
              v-if="previewVisible"
              class="fixed inset-0 z-[60] flex items-center justify-center p-4"
              @click.self="previewVisible = false"
            >
              <div
                class="absolute inset-0 bg-black/70"
                @click="previewVisible = false"
              />
              <div
                class="relative w-full max-w-4xl h-[80vh] bg-dark-900 rounded-xl border border-dark-700 flex flex-col"
              >
                <div
                  class="flex items-center justify-between px-4 py-3 border-b border-dark-700"
                >
                  <h3 class="text-lg font-medium text-white">
                    {{ selectedFile?.name }}
                  </h3>
                  <button
                    @click="previewVisible = false"
                    class="p-1 hover:bg-dark-700 rounded"
                  >
                    <svg
                      class="w-5 h-5 text-gray-400"
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
                <div class="flex-1 overflow-auto p-4">
                  <div
                    v-if="previewLoading"
                    class="flex items-center justify-center h-full"
                  >
                    <div
                      class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
                    />
                  </div>
                  <pre
                    v-else
                    class="text-sm text-gray-300 whitespace-pre-wrap font-mono"
                    >{{ fileContent }}</pre
                  >
                </div>
              </div>
            </div>
          </Teleport>

          <!-- 重命名弹窗 -->
          <Teleport to="body">
            <div
              v-if="renameVisible"
              class="fixed inset-0 z-[60] flex items-center justify-center p-4"
              @click.self="renameVisible = false"
            >
              <div
                class="absolute inset-0 bg-black/70"
                @click="renameVisible = false"
              />
              <div
                class="relative w-full max-w-md bg-dark-900 rounded-xl border border-dark-700 p-6"
              >
                <h3 class="text-lg font-medium text-white mb-4">重命名</h3>
                <input
                  v-model="newFileName"
                  class="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
                  placeholder="新名称"
                />
                <div class="flex justify-end gap-3 mt-4">
                  <button
                    @click="renameVisible = false"
                    class="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    @click="confirmRename"
                    class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- 移动弹窗 -->
          <Teleport to="body">
            <div
              v-if="moveVisible"
              class="fixed inset-0 z-[60] flex items-center justify-center p-4"
              @click.self="moveVisible = false"
            >
              <div
                class="absolute inset-0 bg-black/70"
                @click="moveVisible = false"
              />
              <div
                class="relative w-full max-w-md bg-dark-900 rounded-xl border border-dark-700 p-6"
              >
                <h3 class="text-lg font-medium text-white mb-4">移动到</h3>
                <input
                  v-model="moveTargetPath"
                  class="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
                  placeholder="目标路径"
                />
                <div class="flex justify-end gap-3 mt-4">
                  <button
                    @click="moveVisible = false"
                    class="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    @click="confirmMove"
                    class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- 复制弹窗 -->
          <Teleport to="body">
            <div
              v-if="copyVisible"
              class="fixed inset-0 z-[60] flex items-center justify-center p-4"
              @click.self="copyVisible = false"
            >
              <div
                class="absolute inset-0 bg-black/70"
                @click="copyVisible = false"
              />
              <div
                class="relative w-full max-w-md bg-dark-900 rounded-xl border border-dark-700 p-6"
              >
                <h3 class="text-lg font-medium text-white mb-4">复制到</h3>
                <input
                  v-model="copyTargetPath"
                  class="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
                  placeholder="目标路径"
                />
                <div class="flex justify-end gap-3 mt-4">
                  <button
                    @click="copyVisible = false"
                    class="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    @click="confirmCopy"
                    class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </Teleport>

          <!-- 新建文件夹弹窗 -->
          <Teleport to="body">
            <div
              v-if="createFolderVisible"
              class="fixed inset-0 z-[60] flex items-center justify-center p-4"
              @click.self="createFolderVisible = false"
            >
              <div
                class="absolute inset-0 bg-black/70"
                @click="createFolderVisible = false"
              />
              <div
                class="relative w-full max-w-md bg-dark-900 rounded-xl border border-dark-700 p-6"
              >
                <h3 class="text-lg font-medium text-white mb-4">新建文件夹</h3>
                <input
                  v-model="newFolderName"
                  class="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white"
                  placeholder="文件夹名称"
                />
                <div class="flex justify-end gap-3 mt-4">
                  <button
                    @click="createFolderVisible = false"
                    class="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    取消
                  </button>
                  <button
                    @click="confirmCreateFolder"
                    class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          </Teleport>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";

const props = defineProps<{ serverId: string }>();
const emit = defineEmits<{ close: [] }>();

const toast = useToast();
const { confirm } = useConfirm();
const currentPath = ref("C:\\");
const files = ref<any[]>([]);
const loading = ref(false);
const backStack = ref<string[]>([]);
const forwardStack = ref<string[]>([]);
const serverOs = ref("windows");
const selectedFile = ref<any>(null);
const fileContent = ref("");
const previewVisible = ref(false);
const previewLoading = ref(false);
const renameVisible = ref(false);
const newFileName = ref("");
const moveVisible = ref(false);
const moveTargetPath = ref("");
const copyVisible = ref(false);
const copyTargetPath = ref("");
const createFolderVisible = ref(false);
const newFolderName = ref("");

const isWindows = computed(() => serverOs.value === "windows");

const pathParts = computed(() => {
  if (isWindows.value) {
    return currentPath.value.split("\\").filter(Boolean);
  }
  return currentPath.value.split("/").filter(Boolean);
});

const breadcrumbItems = computed(() => {
  const parts = isWindows.value
    ? currentPath.value.split("\\").filter(Boolean)
    : currentPath.value.split("/").filter(Boolean);
  return parts.map((part, index) => ({
    name: part,
    path: getPathForIndex(index),
    showSep: index < parts.length - 1,
  }));
});

const sortedFiles = computed(() => {
  const dirs = files.value.filter((f) => f.type === "directory");
  const regularFiles = files.value.filter((f) => f.type !== "directory");
  return [
    ...dirs.sort((a, b) => a.name.localeCompare(b.name)),
    ...regularFiles.sort((a, b) => a.name.localeCompare(b.name)),
  ];
});

const HomeIcon = {
  render: () =>
    h(
      "svg",
      {
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
      },
      [
        h("path", {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        }),
      ]
    ),
};

const DriveIcon = {
  render: () =>
    h(
      "svg",
      {
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        strokeWidth: 2,
      },
      [
        h("path", {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          d: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
        }),
      ]
    ),
};

const shortcuts = computed(() => {
  if (isWindows.value) {
    return [
      {
        name: "C盘",
        path: "C:\\",
        bgClass: "bg-blue-500/10",
        iconClass: "text-blue-400",
        icon: DriveIcon,
      },
      {
        name: "D盘",
        path: "D:\\",
        bgClass: "bg-purple-500/10",
        iconClass: "text-purple-400",
        icon: DriveIcon,
      },
      {
        name: "用户目录",
        path: "C:\\Users",
        bgClass: "bg-green-500/10",
        iconClass: "text-green-400",
        icon: HomeIcon,
      },
      {
        name: "桌面",
        path: "C:\\Users\\Administrator\\Desktop",
        bgClass: "bg-orange-500/10",
        iconClass: "text-orange-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                }),
              ]
            ),
        },
      },
      {
        name: "临时目录",
        path: "C:\\Users\\ADMINI~1\\AppData\\Local\\Temp",
        bgClass: "bg-yellow-500/10",
        iconClass: "text-yellow-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                }),
              ]
            ),
        },
      },
    ];
  } else {
    return [
      {
        name: "主目录",
        path: "/root",
        bgClass: "bg-blue-500/10",
        iconClass: "text-blue-400",
        icon: HomeIcon,
      },
      {
        name: "根目录",
        path: "/",
        bgClass: "bg-purple-500/10",
        iconClass: "text-purple-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
                }),
              ]
            ),
        },
      },
      {
        name: "临时目录",
        path: "/tmp",
        bgClass: "bg-orange-500/10",
        iconClass: "text-orange-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                }),
              ]
            ),
        },
      },
      {
        name: "日志目录",
        path: "/var/log",
        bgClass: "bg-green-500/10",
        iconClass: "text-green-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                }),
              ]
            ),
        },
      },
      {
        name: "配置目录",
        path: "/etc",
        bgClass: "bg-yellow-500/10",
        iconClass: "text-yellow-400",
        icon: {
          render: () =>
            h(
              "svg",
              {
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
              },
              [
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
                }),
                h("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                }),
              ]
            ),
        },
      },
    ];
  }
});

onMounted(async () => {
  try {
    const result = await $fetch("/api/server/configs");
    const serverList = (result as any[]) || [];
    const currentServer = serverList.find((s: any) => s.id === props.serverId);
    if (currentServer?.os) {
      serverOs.value = currentServer.os;
      currentPath.value = serverOs.value === "windows" ? "C:\\" : "/";
    }
  } catch {
    // use defaults
  }
  refreshFiles();
});

function getPathForIndex(index: number): string {
  const parts = pathParts.value.slice(0, index + 1);
  if (isWindows.value) {
    return parts.join("\\") + "\\";
  }
  return "/" + parts.join("/");
}

async function refreshFiles() {
  loading.value = true;
  try {
    const result = await $fetch("/api/server/files", {
      method: "POST",
      body: { serverId: props.serverId, path: currentPath.value },
    });
    files.value = (result as any).files || [];
  } catch (err: any) {
    toast.error("获取文件列表失败: " + (err.data?.message || err.message));
  } finally {
    loading.value = false;
  }
}

function navigateTo(path: string) {
  if (currentPath.value !== path) {
    backStack.value.push(currentPath.value);
    forwardStack.value = [];
  }
  currentPath.value = path;
  refreshFiles();
}

function goBack() {
  if (backStack.value.length > 0) {
    const prev = backStack.value.pop()!;
    forwardStack.value.push(currentPath.value);
    currentPath.value = prev;
    refreshFiles();
  }
}

function goForward() {
  if (forwardStack.value.length > 0) {
    const next = forwardStack.value.pop()!;
    backStack.value.push(currentPath.value);
    currentPath.value = next;
    refreshFiles();
  }
}

function openFile(file: any) {
  previewFile(file);
}

function previewFile(file: any) {
  if (file.type !== "file") {
    navigateTo(file.path);
    return;
  }
  selectedFile.value = file;
  previewLoading.value = true;
  previewVisible.value = true;

  $fetch("/api/server/fileops", {
    method: "POST",
    body: { serverId: props.serverId, action: "read", path: file.path },
  })
    .then((res: any) => {
      if (res.success) {
        fileContent.value = res.data || res.output || "";
      } else {
        fileContent.value = "读取失败: " + (res.message || "未知错误");
      }
    })
    .catch((err: any) => {
      fileContent.value = "读取失败: " + (err.message || "未知错误");
    })
    .finally(() => {
      previewLoading.value = false;
    });
}

function downloadFile(file: any) {
  previewFile(file);
}

async function deleteFile(file: any) {
  const ok = await confirm({
    title: "确认删除",
    message: `确定要删除 "${file.name}" 吗？此操作不可恢复！`,
    type: "danger",
    confirmText: "删除",
    cancelText: "取消",
  });
  if (!ok) return;

  $fetch("/api/server/fileops", {
    method: "POST",
    body: { serverId: props.serverId, action: "delete", path: file.path },
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("删除成功");
        refreshFiles();
      } else {
        toast.error("删除失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("删除失败: " + (err.message || "未知错误"));
    });
}

function renameFile(file: any) {
  selectedFile.value = file;
  newFileName.value = file.name;
  renameVisible.value = true;
}

function moveFile(file: any) {
  selectedFile.value = file;
  moveTargetPath.value = currentPath.value;
  moveVisible.value = true;
}

function copyFile(file: any) {
  selectedFile.value = file;
  copyTargetPath.value = currentPath.value;
  copyVisible.value = true;
}

function confirmRename() {
  if (!newFileName.value || newFileName.value === selectedFile.value.name) {
    renameVisible.value = false;
    return;
  }

  const newPath = selectedFile.value.path.replace(
    /[^\\\/]+$/,
    newFileName.value
  );

  $fetch("/api/server/fileops", {
    method: "POST",
    body: {
      serverId: props.serverId,
      action: "rename",
      path: selectedFile.value.path,
      newPath: newPath,
    },
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("重命名成功");
        renameVisible.value = false;
        refreshFiles();
      } else {
        toast.error("重命名失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("重命名失败: " + (err.message || "未知错误"));
    });
}

function confirmMove() {
  const targetPath =
    moveTargetPath.value.endsWith("\\") || moveTargetPath.value.endsWith("/")
      ? moveTargetPath.value + selectedFile.value.name
      : moveTargetPath.value;

  $fetch("/api/server/fileops", {
    method: "POST",
    body: {
      serverId: props.serverId,
      action: "move",
      path: selectedFile.value.path,
      newPath: targetPath,
    },
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("移动成功");
        moveVisible.value = false;
        refreshFiles();
      } else {
        toast.error("移动失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("移动失败: " + (err.message || "未知错误"));
    });
}

function confirmCopy() {
  const targetPath =
    copyTargetPath.value.endsWith("\\") || copyTargetPath.value.endsWith("/")
      ? copyTargetPath.value + selectedFile.value.name
      : copyTargetPath.value;

  $fetch("/api/server/fileops", {
    method: "POST",
    body: {
      serverId: props.serverId,
      action: "copy",
      path: selectedFile.value.path,
      newPath: targetPath,
    },
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("复制成功");
        copyVisible.value = false;
        refreshFiles();
      } else {
        toast.error("复制失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("复制失败: " + (err.message || "未知错误"));
    });
}

function createNewFolder() {
  newFolderName.value = "";
  createFolderVisible.value = true;
}

function confirmCreateFolder() {
  if (!newFolderName.value) {
    createFolderVisible.value = false;
    return;
  }

  $fetch("/api/server/fileops", {
    method: "POST",
    body: {
      serverId: props.serverId,
      action: "createDir",
      path: currentPath.value,
      fileName: newFolderName.value,
    },
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("创建成功");
        createFolderVisible.value = false;
        refreshFiles();
      } else {
        toast.error("创建失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("创建失败: " + (err.message || "未知错误"));
    });
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("serverId", props.serverId);
  formData.append("targetPath", currentPath.value);
  formData.append("file", file);

  $fetch("/api/server/fileops", {
    method: "POST",
    body: formData,
  })
    .then((res: any) => {
      if (res.success) {
        toast.success("上传成功");
        refreshFiles();
      } else {
        toast.error("上传失败: " + (res.message || "未知错误"));
      }
    })
    .catch((err: any) => {
      toast.error("上传失败: " + (err.message || "未知错误"));
    })
    .finally(() => {
      target.value = "";
    });
}

function formatFileSize(size: number) {
  if (!size || size === 0) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}

function formatFileTime(mtime: string) {
  if (!mtime) return "-";
  try {
    return new Date(mtime).toLocaleString("zh-CN");
  } catch {
    return mtime;
  }
}
</script>
