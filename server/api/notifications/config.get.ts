import { readConfig } from "../../utils/storage";
import type { NotificationConfig } from "../../../types/notification";

const defaultTemplate = `## 构建通知
项目：{projectName}
分支：{branch}
Tag：{tagName}
状态：{status}
Pipeline：#{pipelineId}
链接：{webUrl}`;

const defaultConfig: NotificationConfig = {
  dingtalk: {
    enabled: false,
    webhook: "",
    secret: "",
    template: defaultTemplate,
    onSuccess: true,
    onFailure: true,
    atUserIds: [],
    atMobiles: [],
  },
  wecom: {
    enabled: false,
    webhook: "",
    template: defaultTemplate,
    onSuccess: true,
    onFailure: true,
    atUserIds: [],
  },
  webhook: { enabled: false, url: "", method: "POST", auth: "" },
  quietHours: { enabled: false, start: "22:00", end: "08:00" },
  rateLimit: { enabled: false, intervalMinutes: 5 },
};

export default defineEventHandler(async () => {
  return readConfig<NotificationConfig>("notification-config", defaultConfig);
});
