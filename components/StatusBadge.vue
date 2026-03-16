<template>
  <div
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      sizeClass,
      colorClass,
    ]"
  >
    <div :class="['rounded-full flex-shrink-0', dotSize, dotColor]" />
    <span v-if="size !== 'dot'">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string;
  size?: "sm" | "md" | "dot";
}>();

const statusMap: Record<string, { label: string; color: string; dot: string }> =
  {
    running: {
      label: "运行中",
      color: "bg-blue-500/15 text-blue-400",
      dot: "bg-blue-400 animate-pulse",
    },
    pending: {
      label: "等待中",
      color: "bg-yellow-500/15 text-yellow-400",
      dot: "bg-yellow-400 animate-pulse",
    },
    preparing: {
      label: "准备中",
      color: "bg-yellow-500/15 text-yellow-400",
      dot: "bg-yellow-400",
    },
    created: {
      label: "已创建",
      color: "bg-gray-500/15 text-gray-400",
      dot: "bg-gray-400",
    },
    success: {
      label: "成功",
      color: "bg-success-500/15 text-success-400",
      dot: "bg-success-400",
    },
    failed: {
      label: "失败",
      color: "bg-red-500/15 text-red-400",
      dot: "bg-red-400",
    },
    canceled: {
      label: "已取消",
      color: "bg-gray-500/15 text-gray-400",
      dot: "bg-gray-400",
    },
    skipped: {
      label: "已跳过",
      color: "bg-gray-500/15 text-gray-400",
      dot: "bg-gray-400",
    },
    manual: {
      label: "手动",
      color: "bg-purple-500/15 text-purple-400",
      dot: "bg-purple-400",
    },
    scheduled: {
      label: "计划中",
      color: "bg-orange-500/15 text-orange-400",
      dot: "bg-orange-400",
    },
    stopped: {
      label: "已停止",
      color: "bg-gray-500/15 text-gray-400",
      dot: "bg-gray-500",
    },
    error: {
      label: "错误",
      color: "bg-red-500/15 text-red-400",
      dot: "bg-red-400",
    },
    unknown: {
      label: "未知",
      color: "bg-gray-500/15 text-gray-500",
      dot: "bg-gray-600",
    },
  };

const info = computed(() => statusMap[props.status] ?? statusMap.unknown);
const label = computed(() => info.value.label);
const colorClass = computed(() => info.value.color);
const dotColor = computed(() => info.value.dot);

const sizeClass = computed(() => {
  if (props.size === "dot") return "px-0 py-0";
  if (props.size === "sm") return "px-2 py-0.5 text-xs";
  return "px-2.5 py-1 text-xs";
});

const dotSize = computed(() => {
  if (props.size === "dot") return "w-2 h-2";
  return "w-1.5 h-1.5";
});
</script>
