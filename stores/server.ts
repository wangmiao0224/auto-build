import type { ServerConfig } from "~/types/server";

export const useServerStore = defineStore("server", () => {
  const configs = ref<ServerConfig[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchConfigs() {
    loading.value = true;
    error.value = null;
    try {
      configs.value = await $fetch("/api/server/configs");
    } catch (err: unknown) {
      error.value = (err as Error).message || "加载失败";
    } finally {
      loading.value = false;
    }
  }

  async function addConfig(
    data: Omit<ServerConfig, "id" | "createdAt" | "updatedAt">
  ) {
    try {
      const result = await $fetch("/api/server/configs", {
        method: "POST",
        body: data,
      });
      configs.value.push(result as ServerConfig);
      return result;
    } catch (err: unknown) {
      throw err;
    }
  }

  async function updateConfig(id: string, data: Partial<ServerConfig>) {
    try {
      const result = await $fetch(`/api/server/configs/${id}`, {
        method: "PUT",
        body: data,
      });
      const idx = configs.value.findIndex((c) => c.id === id);
      if (idx !== -1) configs.value[idx] = result as ServerConfig;
      return result;
    } catch (err: unknown) {
      throw err;
    }
  }

  async function deleteConfig(id: string) {
    try {
      await $fetch(`/api/server/configs/${id}`, { method: "DELETE" });
      configs.value = configs.value.filter((c) => c.id !== id);
    } catch (err: unknown) {
      throw err;
    }
  }

  async function testConnection(serverId: string) {
    try {
      return await $fetch("/api/server/test", {
        method: "POST",
        body: { serverId },
      });
    } catch (err: unknown) {
      throw err;
    }
  }

  return {
    configs,
    loading,
    error,
    fetchConfigs,
    addConfig,
    updateConfig,
    deleteConfig,
    testConnection,
  };
});
