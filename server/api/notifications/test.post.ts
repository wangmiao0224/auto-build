import { readConfig } from "../../utils/storage";
import type { NotificationConfig } from "../../../types/notification";
import { defaultNotificationConfig } from "../../utils/wecom-artifact";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { channel } = body as { channel: string };

  const config = await readConfig<NotificationConfig>(
    "notification-config",
    defaultNotificationConfig
  );

  try {
    if (channel === "dingtalk") {
      const { webhook } = config.dingtalk;
      if (!webhook) return { success: false, message: "Webhook URL 未配置" };
      await $fetch(webhook, {
        method: "POST",
        body: JSON.stringify({
          msgtype: "markdown",
          markdown: {
            content:
              "## ✅ FastBuild 通知测试\n\n这是一条测试消息，通知配置正常工作。",
          },
        }),
        headers: { "Content-Type": "application/json" },
      });
      return { success: true, message: "测试消息已发送" };
    }

    if (channel === "wecom") {
      const { webhook } = config.wecom;
      if (!webhook) return { success: false, message: "Webhook URL 未配置" };
      await $fetch(webhook, {
        method: "POST",
        body: JSON.stringify({
          msgtype: "markdown",
          markdown: {
            content:
              "## ✅ FastBuild 通知测试\n\n这是一条测试消息，通知配置正常工作。",
          },
        }),
        headers: { "Content-Type": "application/json" },
      });
      return { success: true, message: "测试消息已发送" };
    }

    return { success: false, message: `未知渠道: ${channel}` };
  } catch (err: unknown) {
    const e = err as Error;
    return { success: false, message: e.message || "发送失败" };
  }
});
