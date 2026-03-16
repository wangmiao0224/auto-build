import { readConfig, writeConfig } from "../../utils/storage";
import type {
  BuildRecord,
  PipelineStatus,
  BuildConfig,
} from "../../../types/build";
import type { NotificationConfig } from "../../../types/notification";
import {
  sendArtifactToWecom,
  defaultNotificationConfig,
  shouldSendNotification,
  parseAtUserIds,
} from "../../utils/wecom-artifact";

interface GitLabPipelineEvent {
  object_kind: "pipeline";
  object_attributes: {
    id: number;
    status: PipelineStatus;
    ref: string;
    tag: boolean;
    sha: string;
    before_sha: string;
    source: string;
    created_at: string;
    finished_at: string | null;
    duration: number | null;
    variables: Array<{ key: string; value: string }>;
  };
  project: {
    id: number;
    name: string;
    web_url: string;
  };
  user: {
    name: string;
    username: string;
  };
}

const defaultTemplate = `## 构建通知
项目：{projectName}
分支：{branch}
Tag：{tagName}
状态：{status}
Pipeline：#{pipelineId}
链接：{webUrl}`;

function renderTemplate(
  template: string,
  record: BuildRecord,
  status: PipelineStatus
): string {
  const isSuccess = isSuccessStatus(status);
  const statusEmoji = isSuccess ? "✅" : isFailedStatus(status) ? "❌" : "🔄";
  const statusText = isSuccess
    ? "成功"
    : isFailedStatus(status)
    ? "失败"
    : status;

  return template
    .replace(/{projectName}/g, record.projectName)
    .replace(/{branch}/g, record.branch)
    .replace(/{tagName}/g, record.tagName)
    .replace(/{status}/g, `${statusEmoji} ${statusText}`)
    .replace(/{pipelineId}/g, String(record.pipelineId))
    .replace(/{webUrl}/g, record.webUrl)
    .replace(/{duration}/g, record.duration ? `${record.duration}s` : "-");
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

function isSuccessStatus(status: PipelineStatus): boolean {
  return status === "success";
}

function isFailedStatus(status: PipelineStatus): boolean {
  return status === "failed";
}

function isCanceledStatus(status: PipelineStatus): boolean {
  return status === "canceled";
}

function isTerminalStatus(status: PipelineStatus): boolean {
  return ["success", "failed", "canceled", "skipped"].includes(status);
}

function shouldNotify(
  buildConfig: BuildConfig,
  status: PipelineStatus
): boolean {
  if (isSuccessStatus(status) && buildConfig.notifyOnSuccess) return true;
  if (isFailedStatus(status) && buildConfig.notifyOnFailure) return true;
  if (isCanceledStatus(status) && buildConfig.notifyOnCancel) return true;
  return false;
}

async function sendNotification(
  config: NotificationConfig,
  record: BuildRecord,
  status: PipelineStatus
) {
  const isSuccess = isSuccessStatus(status);
  const isFailed = isFailedStatus(status);

  const results: string[] = [];

  if (config.dingtalk.enabled && config.dingtalk.webhook) {
    const shouldSend =
      (isSuccess && config.dingtalk.onSuccess) ||
      (isFailed && config.dingtalk.onFailure);
    if (shouldSend) {
      try {
        const template = config.dingtalk.template || defaultTemplate;
        const content = renderTemplate(template, record, status);
        const atUserIds = parseAtUserIds(config.dingtalk.atUserIds);
        const atMobiles = parseAtUserIds(config.dingtalk.atMobiles);
        const isAtAll =
          isFailed && atUserIds.length === 0 && atMobiles.length === 0;
        await $fetch(config.dingtalk.webhook, {
          method: "POST",
          body: {
            msgtype: "markdown",
            markdown: { content },
            at: {
              atMobiles: atMobiles,
              atUserIds: atUserIds,
              isAtAll: isAtAll,
            },
          },
          headers: { "Content-Type": "application/json" },
        });
        results.push("钉钉: 发送成功");
      } catch (e) {
        results.push(`钉钉: 发送失败 - ${(e as Error).message}`);
      }
    }
  }

  if (config.wecom.enabled && config.wecom.webhook) {
    const shouldSend =
      (isSuccess && config.wecom.onSuccess) ||
      (isFailed && config.wecom.onFailure);
    if (shouldSend) {
      try {
        const template = config.wecom.template || defaultTemplate;
        const content = renderTemplate(template, record, status);
        const atUserIds = parseAtUserIds(config.wecom.atUserIds);
        const mentionedList = isFailed && atUserIds.length > 0 ? atUserIds : [];
        await $fetch(config.wecom.webhook, {
          method: "POST",
          body: {
            msgtype: "markdown",
            markdown: {
              content,
              mentioned_list: mentionedList,
            },
          },
          headers: { "Content-Type": "application/json" },
        });
        results.push("企业微信: 发送成功");
      } catch (e) {
        results.push(`企业微信: 发送失败 - ${(e as Error).message}`);
      }
    }
  }

  if (config.webhook.enabled && config.webhook.url) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.webhook.auth) {
        headers["Authorization"] = config.webhook.auth;
      }
      await $fetch(config.webhook.url, {
        method: config.webhook.method as "POST" | "GET",
        body: {
          projectName: record.projectName,
          branch: record.branch,
          tagName: record.tagName,
          pipelineId: record.pipelineId,
          status: status,
          webUrl: record.webUrl,
          startedAt: record.startedAt,
          finishedAt: record.finishedAt,
          duration: record.duration,
        },
        headers,
      });
      results.push("自定义Webhook: 发送成功");
    } catch (e) {
      results.push(`自定义Webhook: 发送失败 - ${(e as Error).message}`);
    }
  }

  return results;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const gitlabId = query.gitlabId as string | undefined;
  const body = await readBody<GitLabPipelineEvent>(event);

  if (body.object_kind !== "pipeline") {
    return { message: "Ignored: not a pipeline event" };
  }

  if (gitlabId) {
    const { getGitlabConfig } = await import("../../utils/gitlab");
    const config = await getGitlabConfig(gitlabId);
    if (config?.webhookSecret) {
      const headers = getHeaders(event);
      const signature = headers["x-gitlab-token"] as string;
      if (signature !== config.webhookSecret) {
        throw createError({ statusCode: 401, message: "Invalid webhook secret" });
      }
    }
  }

  const { object_attributes, project } = body;
  const {
    id: pipelineId,
    status,
    ref,
    finished_at,
    duration,
  } = object_attributes;

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const idx = history.findIndex((r) => r.pipelineId === pipelineId);

  if (idx === -1) {
    return { message: "Pipeline not found in history" };
  }

  const record = history[idx]!;
  record.status = status;
  record.finishedAt = finished_at;
  record.duration = duration;
  if (gitlabId) {
    record.gitlabId = gitlabId;
  }

  history[idx] = record;
  await writeConfig("build-history", history);

  if (isTerminalStatus(status)) {
    const buildConfig = await readConfig<BuildConfig>(
      "build-config",
      defaultBuildConfig
    );

    if (shouldNotify(buildConfig, status)) {
      const notifConfig = await readConfig<NotificationConfig>(
        "notification-config",
        defaultNotificationConfig
      );

      if (shouldSendNotification(notifConfig, record.projectId)) {
        const results = await sendNotification(notifConfig, record, status);
        console.log(
          `[Webhook] Pipeline #${pipelineId} ${status}, notifications:`,
          results
        );
      }
    }

    if (isSuccessStatus(status) && buildConfig.sendArtifactToWecom) {
      sendArtifactToWecom(record).catch((e) => {
        console.error("[Webhook] 发送产物到企业微信失败:", e);
      });
    }
  }

  return { message: "OK", pipelineId, status };
});
