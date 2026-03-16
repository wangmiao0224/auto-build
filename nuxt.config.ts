export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: true,
  srcDir: ".",

  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },

  modules: [
    "@nuxtjs/tailwindcss",
    "@element-plus/nuxt",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],

  elementPlus: {
    importStyle: "css",
    themes: ["dark"],
  },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "FastDeploy — 前端集成平台",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "前端集成平台 - GitLab 构建 · 产物管理 · 服务器部署",
        },
      ],
    },
  },

  runtimeConfig: {
    gitlabUrl: process.env.NUXT_GITLAB_URL || "",
    gitlabToken: process.env.NUXT_GITLAB_TOKEN || "",
    configEncryptKey:
      process.env.NUXT_ENCRYPT_KEY || "fastbuild-default-key-change-me!",
    gitlabWebhookSecret: process.env.GITLAB_WEBHOOK_SECRET || "",
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY || "",
    openaiBaseUrl:
      process.env.NUXT_OPENAI_BASE_URL || "https://api.openai.com/v1",
    openaiModel: process.env.NUXT_OPENAI_MODEL || "gpt-4o-mini",
    wechatWebhookUrl: process.env.WECHAT_WEBHOOK_URL || "",
    public: {
      appName: "FastDeploy",
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ["ssh2", "ssh2-sftp-client"],
    },
  },

  routeRules: {
    "/": { swr: 60 },
    "/api/**": { cache: false },
  },
});
