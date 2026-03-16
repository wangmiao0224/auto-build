<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-white">AI 助手</h1>
      <p class="text-gray-500 text-sm mt-0.5">
        智能分析构建日志、错误信息，提供修复建议
      </p>
    </div>

    <!-- 聊天区域 -->
    <div
      class="bg-dark-800 border border-dark-700/60 rounded-xl overflow-hidden flex flex-col"
      style="height: calc(100vh - 220px); min-height: 400px"
    >
      <!-- 消息列表 -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto p-5 space-y-4">
        <!-- 欢迎消息 -->
        <div
          v-if="messages.length === 0"
          class="flex flex-col items-center justify-center h-full gap-4 text-center"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-primary-500/15 flex items-center justify-center text-3xl"
          >
            🤖
          </div>
          <div>
            <p class="text-gray-300 font-medium">FastBuild AI 助手</p>
            <p class="text-gray-500 text-sm mt-1">
              粘贴构建日志或错误信息，获取智能分析和修复建议
            </p>
          </div>
          <div class="flex flex-wrap justify-center gap-2 max-w-sm">
            <button
              v-for="prompt in suggestedPrompts"
              :key="prompt"
              class="px-3 py-1.5 bg-dark-700 border border-dark-600 hover:border-primary-500/40 text-xs text-gray-400 hover:text-gray-200 rounded-lg transition-all"
              @click="inputText = prompt"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <!-- 消息 -->
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="[
            'flex gap-3',
            msg.role === 'user' ? 'justify-end' : 'justify-start',
          ]"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
          >
            🤖
          </div>
          <div
            :class="[
              'max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-200 border border-dark-600/60',
            ]"
          >
            <pre
              v-if="msg.role === 'assistant'"
              class="whitespace-pre-wrap font-sans"
              >{{ msg.content }}</pre
            >
            <span v-else>{{ msg.content }}</span>
          </div>
          <div
            v-if="msg.role === 'user'"
            class="w-7 h-7 rounded-lg bg-dark-600 flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
          >
            👤
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="loading" class="flex gap-3 justify-start">
          <div
            class="w-7 h-7 rounded-lg bg-primary-500/15 flex items-center justify-center text-sm flex-shrink-0"
          >
            🤖
          </div>
          <div
            class="bg-dark-700 border border-dark-600/60 rounded-xl px-4 py-3"
          >
            <div class="flex items-center gap-1.5">
              <div
                class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 0ms"
              />
              <div
                class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 150ms"
              />
              <div
                class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                style="animation-delay: 300ms"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="border-t border-dark-700/60 p-4">
        <div class="flex gap-3">
          <textarea
            v-model="inputText"
            class="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            placeholder="输入问题或粘贴错误日志..."
            rows="2"
            @keydown.ctrl.enter="sendMessage"
            @keydown.meta.enter="sendMessage"
          />
          <button
            class="px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex-shrink-0 self-end"
            :disabled="loading || !inputText.trim()"
            @click="sendMessage"
          >
            发送
          </button>
        </div>
        <p class="text-xs text-gray-600 mt-2">Ctrl+Enter / ⌘+Enter 发送</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const messages = ref<{ role: "user" | "assistant"; content: string }[]>([]);
const inputText = ref("");
const loading = ref(false);
const messagesEl = ref<HTMLElement | null>(null);

const suggestedPrompts = [
  "分析这段构建错误",
  "Docker 镜像构建失败怎么排查？",
  "GitLab CI Pipeline 超时如何优化？",
  "npm install 出现依赖冲突如何解决？",
];

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || loading.value) return;
  messages.value.push({ role: "user", content: text });
  inputText.value = "";
  loading.value = true;
  scrollToBottom();
  try {
    const res = await $fetch<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: { message: text, history: messages.value.slice(-10) },
    });
    messages.value.push({ role: "assistant", content: res.reply });
  } catch (err: unknown) {
    messages.value.push({
      role: "assistant",
      content: `错误：${(err as Error).message}`,
    });
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value)
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
}
</script>
