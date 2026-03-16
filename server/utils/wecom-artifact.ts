import { readConfig } from "./storage";
import type { BuildRecord, BuildConfig } from "../../types/build";
import type { NotificationConfig } from "../../types/notification";
import { getGitlabConfig } from "./gitlab";

interface GitLabJob {
  id: number;
  name: string;
  stage: string;
  status: string;
  artifacts: Array<{
    file_type: string;
    size: number;
    filename: string;
  }>;
}

const defaultBuildConfig: BuildConfig = {
  fileNamePattern: "{projectName}_{branch}_{tagName}",
  tagNamePattern: "{tagName}",
  createGitTag: false,
  buildTimeout: 60,
  historyRetentionDays: 30,
  notifyOnStart: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  notifyOnCancel: false,
  sendArtifactToWecom: false,
  artifactOversizedAction: "skip",
  artifactSendRetryCount: 3,
};

const defaultTemplate = `## 构建通知
项目：{projectName}
分支：{branch}
Tag：{tagName}
状态：{status}
Pipeline：#{pipelineId}
链接：{webUrl}`;

export const defaultNotificationConfig: NotificationConfig = {
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

export function isInQuietHours(config: NotificationConfig): boolean {
  if (!config.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const { start, end } = config.quietHours;

  if (start < end) {
    return currentTime >= start && currentTime <= end;
  } else {
    return currentTime >= start || currentTime <= end;
  }
}

const lastNotificationTime: Map<string, number> = new Map();

export function shouldSendNotification(
  config: NotificationConfig,
  projectId: number
): boolean {
  if (isInQuietHours(config)) {
    return false;
  }

  if (config.rateLimit.enabled) {
    const key = String(projectId);
    const lastTime = lastNotificationTime.get(key);
    const now = Date.now();

    if (lastTime) {
      const elapsed = (now - lastTime) / 1000 / 60;
      if (elapsed < config.rateLimit.intervalMinutes) {
        return false;
      }
    }

    lastNotificationTime.set(key, now);
  }

  return true;
}

export function parseAtUserIds(input: string | string[]): string[] {
  if (Array.isArray(input)) return input;
  if (!input) return [];
  return input
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function generateFileName(
  pattern: string,
  record: BuildRecord,
  suffix: string = ""
): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0] || "";
  const time = now.toTimeString().split(" ")[0]?.replace(/:/g, "") || "";

  const safeProjectName = record.projectName.replace(
    /[^a-zA-Z0-9\u4e00-\u9fa5_-]/g,
    "_"
  );
  const safeBranch = record.branch.replace(/\//g, "_");

  let fileName = pattern
    .replace(/{projectName}/g, safeProjectName)
    .replace(/{branch}/g, safeBranch)
    .replace(/{tagName}/g, record.tagName)
    .replace(/{date}/g, date)
    .replace(/{time}/g, time);

  if (suffix) {
    fileName += suffix;
  }

  return `${fileName}.zip`;
}

function extractWebhookKey(webhook: string): string | null {
  const match = webhook.match(/key=([a-zA-Z0-9-]+)/);
  return match && match[1] ? match[1] : null;
}

async function downloadArtifact(
  record: BuildRecord
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const gitlabConfig = await getGitlabConfig();
  if (!gitlabConfig.url || !gitlabConfig.token) {
    console.error("[WecomArtifact] GitLab 未配置");
    return null;
  }

  const jobsUrl = `${gitlabConfig.url}/api/v4/projects/${record.projectId}/pipelines/${record.pipelineId}/jobs`;
  const headers = { "PRIVATE-TOKEN": gitlabConfig.token };

  const jobsRes = await fetch(jobsUrl, { headers });
  if (!jobsRes.ok) {
    console.error("[WecomArtifact] 获取 Jobs 失败");
    return null;
  }

  const jobs = (await jobsRes.json()) as GitLabJob[];
  const jobsWithArtifacts = jobs.filter(
    (job) => job.artifacts && job.artifacts.length > 0
  );

  if (jobsWithArtifacts.length === 0) {
    console.error("[WecomArtifact] 没有产物");
    return null;
  }

  const buildConfig = await readConfig<BuildConfig>(
    "build-config",
    defaultBuildConfig
  );

  const job = jobsWithArtifacts[0]!;
  const artifactUrl = `${gitlabConfig.url}/api/v4/projects/${record.projectId}/jobs/${job.id}/artifacts`;
  const artifactRes = await fetch(artifactUrl, { headers });

  if (!artifactRes.ok) {
    console.error("[WecomArtifact] 下载产物失败");
    return null;
  }

  const buffer = Buffer.from(await artifactRes.arrayBuffer());
  const fileName = generateFileName(buildConfig.fileNamePattern, record);

  return { buffer, fileName };
}

async function uploadToWecom(
  webhookKey: string,
  buffer: Buffer,
  fileName: string
): Promise<string | null> {
  const uploadUrl = `https://qyapi.weixin.qq.com/cgi-bin/webhook/upload_media?key=${webhookKey}&type=file`;

  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: "application/zip" });
  formData.append("media", blob, fileName);

  try {
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("[WecomArtifact] 上传失败:", res.status);
      return null;
    }

    const data = (await res.json()) as { errcode?: number; media_id?: string };
    if (data.errcode !== 0 || !data.media_id) {
      console.error("[WecomArtifact] 上传返回错误:", data);
      return null;
    }

    return data.media_id;
  } catch (e) {
    console.error("[WecomArtifact] 上传异常:", e);
    return null;
  }
}

async function sendFileToWecom(
  webhook: string,
  mediaId: string
): Promise<boolean> {
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "file",
        file: { media_id: mediaId },
      }),
    });

    if (!res.ok) {
      console.error("[WecomArtifact] 发送文件失败:", res.status);
      return false;
    }

    const data = (await res.json()) as { errcode?: number };
    if (data.errcode !== 0) {
      console.error("[WecomArtifact] 发送返回错误:", data);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[WecomArtifact] 发送异常:", e);
    return false;
  }
}

export async function sendArtifactToWecom(
  record: BuildRecord
): Promise<boolean> {
  const notifConfig = await readConfig<NotificationConfig>(
    "notification-config",
    defaultNotificationConfig
  );

  if (!notifConfig.wecom.enabled || !notifConfig.wecom.webhook) {
    console.log("[WecomArtifact] 企业微信未配置");
    return false;
  }

  const webhookKey = extractWebhookKey(notifConfig.wecom.webhook);
  if (!webhookKey) {
    console.error("[WecomArtifact] 无法提取 webhook key");
    return false;
  }

  const artifact = await downloadArtifact(record);
  if (!artifact) {
    return false;
  }

  if (artifact.buffer.length > 20 * 1024 * 1024) {
    console.error("[WecomArtifact] 文件超过 20MB 限制");
    return false;
  }

  const mediaId = await uploadToWecom(
    webhookKey,
    artifact.buffer,
    artifact.fileName
  );
  if (!mediaId) {
    return false;
  }

  const success = await sendFileToWecom(notifConfig.wecom.webhook, mediaId);
  if (success) {
    console.log(`[WecomArtifact] 发送成功: ${artifact.fileName}`);
  }

  return success;
}
