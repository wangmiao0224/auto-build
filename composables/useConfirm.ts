import { useState, useNuxtApp } from "#app";

const confirmState = {
  isVisible: false as boolean,
  options: {
    message: "",
    title: "提示",
    type: "warning" as "warning" | "danger" | "info",
    confirmText: "确认",
    cancelText: "取消",
  },
  resolve: null as ((value: boolean) => void) | null,
};

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "warning" | "danger" | "info";
}

export function useConfirm() {
  const isVisible = useState("global-confirm-visible", () => false);
  const options = useState<ConfirmOptions>("global-confirm-options", () => ({
    message: "",
    title: "提示",
    type: "warning",
    confirmText: "确认",
    cancelText: "取消",
  }));
  const resolveRef = useState<((value: boolean) => void) | null>(
    "global-confirm-resolve",
    () => null
  );

  const confirm = (opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.value = resolve;
      options.value = {
        message: opts.message,
        title: opts.title || "提示",
        type: opts.type || "warning",
        confirmText: opts.confirmText || "确认",
        cancelText: opts.cancelText || "取消",
      };
      isVisible.value = true;
    });
  };

  const handleConfirm = () => {
    if (resolveRef.value) {
      resolveRef.value(true);
      resolveRef.value = null;
    }
    isVisible.value = false;
  };

  const handleCancel = () => {
    if (resolveRef.value) {
      resolveRef.value(false);
      resolveRef.value = null;
    }
    isVisible.value = false;
  };

  return {
    isVisible: readonly(isVisible),
    options: readonly(options),
    confirm,
    handleConfirm,
    handleCancel,
  };
}
