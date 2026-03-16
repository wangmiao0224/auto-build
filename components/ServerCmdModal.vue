<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="$emit('close')"
        />
        <div
          class="relative w-full max-w-4xl bg-dark-900 rounded-2xl shadow-2xl border border-dark-700/50 max-h-[85vh] flex flex-col overflow-hidden"
        >
          <!-- 终端头部 -->
          <div
            class="bg-dark-800 border-b border-dark-700 px-4 py-2 flex items-center gap-2"
          >
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500" />
              <div class="w-3 h-3 rounded-full bg-yellow-500" />
              <div class="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div class="flex-1 text-center text-xs text-gray-400 font-mono">
              Terminal - {{ serverId }}
            </div>
            <button
              class="w-6 h-6 rounded hover:bg-dark-700 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              @click="$emit('close')"
            >
              <svg
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
            </button>
          </div>

          <!-- 终端内容 -->
          <div class="flex-1 p-4 overflow-hidden flex flex-col">
            <!-- 命令输入区域 -->
            <div
              class="mb-4 bg-dark-800/50 border border-dark-700 rounded-lg p-3"
            >
              <div class="flex items-center gap-2">
                <span class="text-green-400 font-mono">$</span>
                <input
                  ref="commandInput"
                  v-model="command"
                  class="flex-1 bg-transparent border-none outline-none text-white font-mono"
                  placeholder="输入命令..."
                  @keyup.enter="executeCommand"
                  @keydown.arrow-up="navigateHistory(-1)"
                  @keydown.arrow-down="navigateHistory(1)"
                />
                <button
                  @click="executeCommand"
                  class="px-3 py-1 rounded bg-green-500 text-black text-xs font-medium hover:bg-green-400 transition-colors"
                  :disabled="executing"
                >
                  <span v-if="executing">执行中...</span>
                  <span v-else>执行</span>
                </button>
              </div>
            </div>

            <!-- 输出区域 -->
            <div
              class="flex-1 bg-dark-800/80 rounded-lg border border-dark-700 overflow-hidden flex flex-col"
            >
              <!-- 输出头部 -->
              <div
                class="px-4 py-2 border-b border-dark-700 bg-dark-800/50 flex items-center justify-between"
              >
                <span class="text-xs text-gray-500 font-mono">Output</span>
                <div class="flex items-center gap-2">
                  <button
                    @click="clearOutput"
                    class="text-xs text-gray-500 hover:text-white hover:bg-dark-700 px-2 py-1 rounded transition-colors"
                  >
                    清空
                  </button>
                  <button
                    @click="copyOutput"
                    class="text-xs text-gray-500 hover:text-white hover:bg-dark-700 px-2 py-1 rounded transition-colors"
                  >
                    复制
                  </button>
                </div>
              </div>
              <!-- 输出内容 -->
              <div class="flex-1 p-4 overflow-y-auto font-mono text-sm">
                <div
                  v-for="(line, index) in outputLines"
                  :key="index"
                  class="mb-1"
                >
                  <span v-if="line.type === 'command'" class="text-green-400"
                    >$ {{ line.content }}</span
                  >
                  <span
                    v-else-if="line.type === 'output'"
                    class="text-gray-300"
                    >{{ line.content }}</span
                  >
                  <span
                    v-else-if="line.type === 'error'"
                    class="text-red-400"
                    >{{ line.content }}</span
                  >
                </div>
                <div
                  v-if="executing"
                  class="flex items-center gap-2 text-gray-500"
                >
                  <div
                    class="w-2 h-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"
                  />
                  <span>执行中...</span>
                </div>
              </div>
            </div>

            <!-- 常用命令 -->
            <div class="mt-4">
              <div class="text-xs text-gray-500 mb-2 font-mono">常用命令:</div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="cmd in commonCommands"
                  :key="cmd"
                  @click="
                    command = cmd;
                    focusInput();
                  "
                  class="px-3 py-1.5 rounded bg-dark-800 border border-dark-700 text-xs text-gray-300 hover:bg-dark-700 hover:text-white transition-colors font-mono"
                >
                  {{ cmd }}
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
import { ref, onMounted, nextTick } from "vue";

const props = defineProps<{ serverId: string }>();
const emit = defineEmits<{ close: [] }>();

const toast = useToast();
const command = ref("");
const outputLines = ref<
  Array<{ type: "command" | "output" | "error"; content: string }>
>([]);
const executing = ref(false);
const commandHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const commandInput = ref<HTMLInputElement>();

const commonCommands = [
  "ls -la",
  "pwd",
  "whoami",
  "uname -a",
  "df -h",
  "free -m",
  "top -b -n 1",
  "netstat -tuln",
  "ps aux",
  "uptime",
];

onMounted(() => {
  // 添加欢迎信息
  outputLines.value.push({
    type: "output",
    content: `Welcome to Terminal for server ${props.serverId}`,
  });
  outputLines.value.push({
    type: "output",
    content: "Type commands below or use the quick commands above.",
  });
  outputLines.value.push({
    type: "output",
    content: "",
  });
});

async function executeCommand() {
  if (!command.value.trim()) return;

  // 添加到历史记录
  if (command.value.trim()) {
    commandHistory.value.push(command.value.trim());
    historyIndex.value = commandHistory.value.length;
  }

  // 显示命令
  outputLines.value.push({
    type: "command",
    content: command.value,
  });

  executing.value = true;
  const cmd = command.value;
  command.value = "";

  try {
    const result = await $fetch("/api/server/exec", {
      method: "POST",
      body: { serverId: props.serverId, command: cmd },
    });

    if ((result as any).output) {
      (result as any).output.split("\n").forEach((line: string) => {
        if (line.trim()) {
          outputLines.value.push({
            type: "output",
            content: line,
          });
        }
      });
    }
  } catch (err: any) {
    outputLines.value.push({
      type: "error",
      content: `Error: ${err.data?.message || err.message}`,
    });
  } finally {
    executing.value = false;
    // 滚动到底部
    nextTick(() => {
      const outputElement = document.querySelector(".font-mono");
      if (outputElement) {
        outputElement.scrollTop = outputElement.scrollHeight;
      }
    });
  }
}

function clearOutput() {
  outputLines.value = [];
}

function copyOutput() {
  const output = outputLines.value.map((line) => line.content).join("\n");
  navigator.clipboard.writeText(output);
  toast.success("已复制到剪贴板");
}

function navigateHistory(direction: number) {
  const newIndex = historyIndex.value + direction;
  if (newIndex >= 0 && newIndex < commandHistory.value.length) {
    historyIndex.value = newIndex;
    command.value = commandHistory.value[newIndex];
  } else if (newIndex === commandHistory.value.length) {
    historyIndex.value = newIndex;
    command.value = "";
  }
}

function focusInput() {
  nextTick(() => {
    commandInput.value?.focus();
  });
}
</script>
