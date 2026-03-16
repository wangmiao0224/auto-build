<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-bold text-white">通知配置</h1>
      <p class="text-gray-500 text-sm mt-0.5">
        配置构建结果通知渠道（钉钉、企业微信、Webhook）
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 钉钉通知 -->
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
              <div class="text-xs text-gray-500">通过 Webhook 发送到钉钉群</div>
            </div>
          </div>
          <button
            :class="[
              'w-10 h-5 rounded-full transition-all',
              config.dingtalk.enabled ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="config.dingtalk.enabled = !config.dingtalk.enabled"
          >
            <div
              :class="[
                'w-4 h-4 rounded-full bg-white shadow transition-transform',
                config.dingtalk.enabled ? 'translate-x-5' : 'translate-x-1',
              ]"
            />
          </button>
        </div>
        <div v-if="config.dingtalk.enabled" class="space-y-3">
          <div>
            <label class="form-label">Webhook URL</label>
            <input
              v-model="config.dingtalk.webhook"
              class="form-input"
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
            />
          </div>
          <div>
            <label class="form-label">签名 Secret（可选）</label>
            <input
              v-model="config.dingtalk.secret"
              class="form-input"
              placeholder="SEC..."
            />
          </div>
          <div class="flex items-center gap-2 pt-1">
            <input
              id="dt-success"
              v-model="config.dingtalk.onSuccess"
              type="checkbox"
              class="accent-primary-500"
            />
            <label for="dt-success" class="text-xs text-gray-400"
              >构建成功时通知</label
            >
            <input
              id="dt-fail"
              v-model="config.dingtalk.onFailure"
              type="checkbox"
              class="accent-primary-500 ml-3"
            />
            <label for="dt-fail" class="text-xs text-gray-400"
              >构建失败时通知</label
            >
          </div>
          <button
            class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
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
              'w-10 h-5 rounded-full transition-all',
              config.wecom.enabled ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="config.wecom.enabled = !config.wecom.enabled"
          >
            <div
              :class="[
                'w-4 h-4 rounded-full bg-white shadow transition-transform',
                config.wecom.enabled ? 'translate-x-5' : 'translate-x-1',
              ]"
            />
          </button>
        </div>
        <div v-if="config.wecom.enabled" class="space-y-3">
          <div>
            <label class="form-label">Webhook URL</label>
            <input
              v-model="config.wecom.webhook"
              class="form-input"
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
            />
          </div>
          <div class="flex items-center gap-2 pt-1">
            <input
              id="wc-success"
              v-model="config.wecom.onSuccess"
              type="checkbox"
              class="accent-primary-500"
            />
            <label for="wc-success" class="text-xs text-gray-400"
              >构建成功时通知</label
            >
            <input
              id="wc-fail"
              v-model="config.wecom.onFailure"
              type="checkbox"
              class="accent-primary-500 ml-3"
            />
            <label for="wc-fail" class="text-xs text-gray-400"
              >构建失败时通知</label
            >
          </div>
          <button
            class="text-xs text-primary-400 hover:text-primary-300 transition-colors"
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
              <div class="text-sm font-semibold text-white">自定义 Webhook</div>
              <div class="text-xs text-gray-500">构建完成后回调指定 URL</div>
            </div>
          </div>
          <button
            :class="[
              'w-10 h-5 rounded-full transition-all',
              config.webhook.enabled ? 'bg-primary-600' : 'bg-dark-600',
            ]"
            @click="config.webhook.enabled = !config.webhook.enabled"
          >
            <div
              :class="[
                'w-4 h-4 rounded-full bg-white shadow transition-transform',
                config.webhook.enabled ? 'translate-x-5' : 'translate-x-1',
              ]"
            />
          </button>
        </div>
        <div v-if="config.webhook.enabled" class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="form-label">回调 URL</label>
            <input
              v-model="config.webhook.url"
              class="form-input"
              placeholder="https://your-server.com/webhook/build"
            />
          </div>
          <div>
            <label class="form-label">请求方法</label>
            <select v-model="config.webhook.method" class="form-input">
              <option>POST</option>
              <option>PUT</option>
            </select>
          </div>
          <div>
            <label class="form-label">Authorization Header（可选）</label>
            <input
              v-model="config.webhook.auth"
              class="form-input"
              placeholder="Bearer token..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="flex justify-end">
      <button
        class="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium text-sm transition-all"
        :disabled="saving"
        @click="saveConfig"
      >
        {{ saving ? "保存中..." : "保存配置" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();
const saving = ref(false);

const config = reactive({
  dingtalk: {
    enabled: false,
    webhook: "",
    secret: "",
    onSuccess: true,
    onFailure: true,
  },
  wecom: { enabled: false, webhook: "", onSuccess: true, onFailure: true },
  webhook: { enabled: false, url: "", method: "POST", auth: "" },
});

onMounted(async () => {
  try {
    const data = await $fetch<typeof config>("/api/notifications/config");
    if (data) Object.assign(config, data);
  } catch {}
});

async function saveConfig() {
  saving.value = true;
  try {
    await $fetch("/api/notifications/config", { method: "POST", body: config });
  } finally {
    saving.value = false;
  }
}

async function testChannel(channel: string) {
  try {
    const res = await $fetch<{ success: boolean; message: string }>(
      "/api/notifications/test",
      {
        method: "POST",
        body: { channel },
      }
    );
    if (res.success) {
      toast.success("测试消息发送成功");
    } else {
      toast.error(`发送失败：${res.message}`);
    }
  } catch (err: unknown) {
    toast.error(`发送失败：${(err as Error).message}`);
  }
}
</script>

<style scoped>
.form-label {
  @apply block text-xs font-medium text-gray-400 mb-1.5;
}
.form-input {
  @apply w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary-500 transition-colors;
}
</style>
