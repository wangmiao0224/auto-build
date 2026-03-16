import type { BuildRecord } from "~/types/build";

export const useBuildStore = defineStore("build", () => {
  const history = ref<BuildRecord[]>([]);
  const loading = ref(false);
  const triggering = ref(false);
  const canceling = ref(false);
  const pollingMap = ref<Map<number, ReturnType<typeof setInterval>>>(
    new Map()
  );

  async function fetchHistory(projectId?: number) {
    loading.value = true;
    try {
      history.value = await $fetch("/api/builds/history", {
        query: projectId ? { projectId } : {},
      });
      history.value.forEach((record) => {
        const terminalStatuses = ["success", "failed", "canceled", "skipped"];
        if (!terminalStatuses.includes(record.status)) {
          startPolling(record);
        }
      });
    } finally {
      loading.value = false;
    }
  }

  async function triggerBuild(payload: {
    configId?: string;
    projectId: number;
    projectName: string;
    branch: string;
    triggerId: number;
    triggerToken: string;
    serverId: string;
  }) {
    triggering.value = true;
    try {
      const record = await $fetch<BuildRecord>("/api/builds/trigger", {
        method: "POST",
        body: payload,
      });
      history.value.unshift(record);
      startPolling(record);
      return record;
    } finally {
      triggering.value = false;
    }
  }

  async function cancelBuild(pipelineId: number, projectId: number) {
    canceling.value = true;
    try {
      await $fetch(`/api/builds/cancel/${pipelineId}`, {
        method: "POST",
        query: { projectId },
      });
      const idx = history.value.findIndex((r) => r.pipelineId === pipelineId);
      if (idx !== -1) {
        history.value[idx] = {
          ...history.value[idx],
          status: "canceled",
          finishedAt: new Date().toISOString(),
        };
      }
      stopPolling(pipelineId);
    } finally {
      canceling.value = false;
    }
  }

  function startPolling(record: BuildRecord) {
    const terminalStatuses = ["success", "failed", "canceled", "skipped"];
    if (terminalStatuses.includes(record.status)) return;

    const timer = setInterval(async () => {
      try {
        const status = await $fetch(`/api/builds/status/${record.pipelineId}`, {
          query: { projectId: record.projectId },
        });
        const idx = history.value.findIndex(
          (r) => r.pipelineId === record.pipelineId
        );
        if (idx !== -1) {
          history.value[idx] = { ...history.value[idx], ...(status as any) };
        }
        if (terminalStatuses.includes((status as any).status)) {
          clearInterval(timer);
          pollingMap.value.delete(record.pipelineId);
        }
      } catch {
        clearInterval(timer);
        pollingMap.value.delete(record.pipelineId);
      }
    }, 5000);

    pollingMap.value.set(record.pipelineId, timer);
  }

  function stopPolling(pipelineId: number) {
    const timer = pollingMap.value.get(pipelineId);
    if (timer) {
      clearInterval(timer);
      pollingMap.value.delete(pipelineId);
    }
  }

  function stopAllPolling() {
    pollingMap.value.forEach((timer) => clearInterval(timer));
    pollingMap.value.clear();
  }

  function getRunningBuild(configId: string): BuildRecord | undefined {
    const runningStatuses = [
      "created",
      "waiting_for_resource",
      "preparing",
      "pending",
      "running",
    ];
    return history.value.find(
      (r) => r.configId === configId && runningStatuses.includes(r.status)
    );
  }

  return {
    history,
    loading,
    triggering,
    canceling,
    fetchHistory,
    triggerBuild,
    cancelBuild,
    startPolling,
    stopPolling,
    stopAllPolling,
    getRunningBuild,
  };
});
