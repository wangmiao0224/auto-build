export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
}

export function useToast() {
  const messages = useState<ToastMessage[]>("toast-messages", () => []);
  const show = (
    type: ToastMessage["type"],
    message: string,
    options?: { title?: string; duration?: number }
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = options?.duration ?? (type === "error" ? 5000 : 3000);

    messages.value.push({
      id,
      type,
      title: options?.title,
      message,
      duration,
    });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration);
    }
  };

  const remove = (id: string) => {
    const index = messages.value.findIndex((m) => m.id === id);
    if (index > -1) {
      messages.value.splice(index, 1);
    }
  };

  const success = (message: string, title?: string) =>
    show("success", message, { title });

  const error = (message: string, title?: string) =>
    show("error", message, { title, duration: 5000 });

  const warning = (message: string, title?: string) =>
    show("warning", message, { title });

  const info = (message: string, title?: string) =>
    show("info", message, { title });

  return {
    messages: readonly(messages),
    show,
    remove,
    success,
    error,
    warning,
    info,
  };
}
