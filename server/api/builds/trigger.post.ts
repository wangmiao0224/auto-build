import { z } from "zod";
import { readConfig, writeConfig } from "../../utils/storage";
import type {
  BuildRecord,
  BuildConfig,
  PipelineStatus,
} from "../../../types/build";
import type { NotificationConfig } from "../../../types/notification";
import { randomUUID } from "node:crypto";
import { getGitlabConfig } from "../../utils/gitlab";
import {
  defaultNotificationConfig,
  shouldSendNotification,
  parseAtUserIds,
} from "../../utils/wecom-artifact";

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

function renderTemplate(
  template: string,
  record: BuildRecord,
  status: PipelineStatus | "running"
): string {
  const statusEmoji =
    status === "running" ? "🚀" : status === "success" ? "✅" : "❌";
  const statusText =
    status === "running" ? "开始构建" : status === "success" ? "成功" : "失败";

  return template
    .replace(/{projectName}/g, record.projectName)
    .replace(/{branch}/g, record.branch)
    .replace(/{tagName}/g, record.tagName)
    .replace(/{status}/g, `${statusEmoji} ${statusText}`)
    .replace(/{pipelineId}/g, String(record.pipelineId))
    .replace(/{webUrl}/g, record.webUrl)
    .replace(/{duration}/g, record.duration ? `${record.duration}s` : "-");
}

async function sendStartNotification(
  notifConfig: NotificationConfig,
  record: BuildRecord
) {
  const results: string[] = [];

  if (notifConfig.dingtalk.enabled && notifConfig.dingtalk.webhook) {
    try {
      const template = notifConfig.dingtalk.template || defaultTemplate;
      const content = renderTemplate(template, record, "running");
      await $fetch(notifConfig.dingtalk.webhook, {
        method: "POST",
        body: {
          msgtype: "markdown",
          markdown: { content },
        },
        headers: { "Content-Type": "application/json" },
      });
      results.push("钉钉: 发送成功");
    } catch (e) {
      results.push(`钉钉: 发送失败 - ${(e as Error).message}`);
    }
  }

  if (notifConfig.wecom.enabled && notifConfig.wecom.webhook) {
    try {
      const template = notifConfig.wecom.template || defaultTemplate;
      const content = renderTemplate(template, record, "running");
      await $fetch(notifConfig.wecom.webhook, {
        method: "POST",
        body: {
          msgtype: "markdown",
          markdown: { content },
        },
        headers: { "Content-Type": "application/json" },
      });
      results.push("企业微信: 发送成功");
    } catch (e) {
      results.push(`企业微信: 发送失败 - ${(e as Error).message}`);
    }
  }

  if (notifConfig.webhook.enabled && notifConfig.webhook.url) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (notifConfig.webhook.auth) {
        headers["Authorization"] = notifConfig.webhook.auth;
      }
      await $fetch(notifConfig.webhook.url, {
        method: notifConfig.webhook.method as "POST" | "GET",
        body: {
          projectName: record.projectName,
          branch: record.branch,
          tagName: record.tagName,
          pipelineId: record.pipelineId,
          status: "running",
          webUrl: record.webUrl,
          startedAt: record.startedAt,
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

const schema = z.object({
  configId: z.string().optional(),
  gitlabId: z.string().optional(),
  projectId: z.number(),
  projectName: z.string(),
  branch: z.string(),
  triggerId: z.number(),
  triggerToken: z.string(),
  serverId: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数错误",
    });
  }

  const {
    configId,
    gitlabId,
    projectId,
    projectName,
    branch,
    triggerToken,
    serverId,
  } = parsed.data;

  const gitlabConfig = await getGitlabConfig(gitlabId);
  if (!gitlabConfig) {
    throw createError({
      statusCode: 400,
      message: "GitLab 未配置，请先添加 GitLab 实例",
    });
  }

  const timestamp = Date.now();
  const branchSafe = branch.replace(/\//g, "_");
  const tagName = `${branchSafe}_${timestamp}`;

  const triggerUrl = `${gitlabConfig.url}/api/v4/projects/${projectId}/trigger/pipeline`;

  const formData = new URLSearchParams();
  formData.append("token", triggerToken);
  formData.append("ref", branch);
  formData.append("variables[TAG_NAME]", tagName);

  const res = await fetch(triggerUrl, {
    method: "POST",
    body: formData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) {
    const text = await res.text();
    throw createError({
      statusCode: res.status,
      message: `触发构建失败: ${text}`,
    });
  }

  const pipeline = (await res.json()) as {
    id: number;
    web_url: string;
    status: string;
  };

  const record: BuildRecord = {
    id: randomUUID(),
    configId,
    gitlabId,
    projectId,
    projectName,
    branch,
    pipelineId: pipeline.id,
    status: pipeline.status as any,
    tagName,
    tarTarget: "",
    tarPath: "",
    buildCommand: "",
    serverId,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    duration: null,
    triggeredBy: "manual",
    webUrl: pipeline.web_url,
  };

  const history = await readConfig<BuildRecord[]>("build-history", []);
  history.unshift(record);
  if (history.length > 200) history.length = 200;
  await writeConfig("build-history", history);

  const buildConfig = await readConfig<BuildConfig>(
    "build-config",
    defaultBuildConfig
  );

  if (buildConfig.notifyOnStart) {
    const notifConfig = await readConfig<NotificationConfig>(
      "notification-config",
      defaultNotificationConfig
    );

    if (shouldSendNotification(notifConfig, projectId)) {
      const results = await sendStartNotification(notifConfig, record);
      console.log(
        `[Trigger] Pipeline #${pipeline.id} started, notifications:`,
        results
      );
    }
  }

  return record;
});
