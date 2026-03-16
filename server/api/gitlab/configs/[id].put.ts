import {
  getGitlabConfigs,
  updateGitlabConfig,
  testGitlabConnection,
} from "../../../utils/gitlab";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "名称不能为空").optional(),
  url: z.string().url("URL 格式不正确").optional(),
  token: z.string().optional(),
  webhookSecret: z.string().optional(),
  apiTimeout: z.number().int().min(5).max(120).optional(),
  apiRetryCount: z.number().int().min(0).max(10).optional(),
  defaultBranch: z.string().optional(),
  proxyUrl: z.string().optional(),
  cacheTime: z.number().int().min(0).max(3600).optional(),
  isDefault: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID 不能为空" });
  }

  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const data = parsed.data;

  const configs = await getGitlabConfigs();
  const existing = configs.find((c) => c.id === id);
  if (!existing) {
    throw createError({ statusCode: 404, message: "配置不存在" });
  }

  if (data.url || data.token || data.proxyUrl) {
    const mergedConfig = {
      ...existing,
      ...data,
      token: data.token || existing.token,
    };

    const testResult = await testGitlabConnection(mergedConfig);
    if (!testResult.success) {
      throw createError({
        statusCode: 400,
        message: `连接测试失败: ${testResult.message}`,
      });
    }
  }

  const updateData = { ...data };
  if (!data.token) {
    delete updateData.token;
  }

  const updated = await updateGitlabConfig(id, updateData);
  if (!updated) {
    throw createError({ statusCode: 404, message: "配置不存在" });
  }

  return {
    ...updated,
    token: "***",
  };
});
