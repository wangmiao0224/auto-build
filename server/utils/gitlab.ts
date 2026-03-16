import { Gitlab } from "@gitbeaker/rest";
import { readConfig } from "./storage";
import type { GitlabConfig } from "../../types/gitlab";
import { randomUUID } from "node:crypto";

const clients: Map<string, InstanceType<typeof Gitlab>> = new Map();

export const defaultGitlabConfig: Omit<
  GitlabConfig,
  "id" | "createdAt" | "updatedAt"
> = {
  name: "",
  url: "",
  token: "",
  webhookSecret: "",
  apiTimeout: 30,
  apiRetryCount: 3,
  defaultBranch: "main",
  proxyUrl: "",
  cacheTime: 300,
  isDefault: false,
};

export async function getGitlabConfigs(): Promise<GitlabConfig[]> {
  return readConfig<GitlabConfig[]>("gitlab-configs", []);
}

export async function getGitlabConfig(
  id?: string
): Promise<GitlabConfig | undefined> {
  const configs = await getGitlabConfigs();
  if (id) {
    return configs.find((c) => c.id === id);
  }
  return configs.find((c) => c.isDefault) || configs[0];
}

export async function getDefaultGitlabConfig(): Promise<
  GitlabConfig | undefined
> {
  const configs = await getGitlabConfigs();
  return configs.find((c) => c.isDefault) || configs[0];
}

export async function getGitlabClient(
  configId?: string
): Promise<InstanceType<typeof Gitlab>> {
  const config = await getGitlabConfig(configId);
  if (!config) {
    throw createError({
      statusCode: 400,
      message: "GitLab 未配置，请先添加 GitLab 实例",
    });
  }

  if (!config.url || !config.token) {
    throw createError({
      statusCode: 400,
      message: "GitLab URL 或 Token 未配置",
    });
  }

  const cacheKey = config.id;
  if (clients.has(cacheKey)) {
    return clients.get(cacheKey)!;
  }

  const client = new Gitlab({
    host: config.url,
    token: config.token,
    ...(config.proxyUrl && { proxy: config.proxyUrl }),
  });

  clients.set(cacheKey, client);
  return client;
}

export function resetGitlabClient(configId?: string) {
  if (configId) {
    clients.delete(configId);
  } else {
    clients.clear();
  }
}

export async function testGitlabConnection(
  config: Partial<GitlabConfig>
): Promise<{
  success: boolean;
  message: string;
  latencyMs?: number;
  version?: string;
}> {
  if (!config.url || !config.token) {
    return { success: false, message: "URL 和 Token 不能为空" };
  }

  try {
    const start = Date.now();
    const testClient = new Gitlab({
      host: config.url,
      token: config.token,
      ...(config.proxyUrl && { proxy: config.proxyUrl }),
    });

    const user = await testClient.Users.showCurrentUser();
    const latencyMs = Date.now() - start;

    return {
      success: true,
      message: `连接成功，用户: ${user.username}`,
      latencyMs,
      version: user.web_url,
    };
  } catch (err: unknown) {
    const error = err as { message?: string };
    return {
      success: false,
      message: error.message || "连接失败",
    };
  }
}

export function handleGitlabError(err: unknown): never {
  const error = err as { response?: { status?: number }; message?: string };
  const status = error?.response?.status;
  if (status === 401)
    throw createError({
      statusCode: 401,
      message: "GitLab Token 无效或已过期",
    });
  if (status === 403)
    throw createError({ statusCode: 403, message: "GitLab 权限不足" });
  if (status === 404)
    throw createError({ statusCode: 404, message: "GitLab 资源不存在" });
  if (status === 429)
    throw createError({
      statusCode: 429,
      message: "GitLab API 请求频率超限，请稍后重试",
    });
  throw createError({
    statusCode: 500,
    message: error?.message || "GitLab API 请求失败",
  });
}

export function getWebhookUrl(configId: string): string {
  const config = useRuntimeConfig();
  const baseUrl =
    config.public.baseUrl || process.env.BASE_URL || "http://localhost:3000";
  return `${baseUrl}/api/gitlab/webhook?gitlabId=${configId}`;
}

export async function createGitlabConfig(
  data: Partial<GitlabConfig>
): Promise<GitlabConfig> {
  const configs = await getGitlabConfigs();
  const now = new Date().toISOString();

  const newConfig: GitlabConfig = {
    id: randomUUID(),
    name: data.name || "GitLab",
    url: data.url || "",
    token: data.token || "",
    webhookSecret: data.webhookSecret || "",
    apiTimeout: data.apiTimeout || 30,
    apiRetryCount: data.apiRetryCount || 3,
    defaultBranch: data.defaultBranch || "main",
    proxyUrl: data.proxyUrl || "",
    cacheTime: data.cacheTime || 300,
    isDefault: data.isDefault || configs.length === 0,
    createdAt: now,
    updatedAt: now,
  };

  if (newConfig.isDefault) {
    configs.forEach((c) => (c.isDefault = false));
  }

  configs.push(newConfig);
  await saveGitlabConfigs(configs);
  return newConfig;
}

export async function updateGitlabConfig(
  id: string,
  data: Partial<GitlabConfig>
): Promise<GitlabConfig | null> {
  const configs = await getGitlabConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  if (data.isDefault) {
    configs.forEach((c) => (c.isDefault = false));
  }

  configs[idx] = {
    ...configs[idx]!,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  resetGitlabClient(id);
  await saveGitlabConfigs(configs);
  return configs[idx]!;
}

export async function deleteGitlabConfig(id: string): Promise<boolean> {
  const configs = await getGitlabConfigs();
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1) return false;

  const wasDefault = configs[idx]!.isDefault;
  configs.splice(idx, 1);

  if (wasDefault && configs.length > 0) {
    configs[0]!.isDefault = true;
  }

  resetGitlabClient(id);
  await saveGitlabConfigs(configs);
  return true;
}

async function saveGitlabConfigs(configs: GitlabConfig[]): Promise<void> {
  const { writeConfig } = await import("./storage");
  await writeConfig("gitlab-configs", configs);
}
