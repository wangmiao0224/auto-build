import {
  getGitlabConfigs,
  createGitlabConfig,
  testGitlabConnection,
} from "../../utils/gitlab";
import type { GitlabConfigInput } from "../../../types/gitlab";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "名称不能为空"),
  url: z.string().url("URL 格式不正确"),
  token: z.string().min(1, "Token 不能为空"),
  webhookSecret: z.string().optional().default(""),
  apiTimeout: z.number().int().min(5).max(120).optional().default(30),
  apiRetryCount: z.number().int().min(0).max(10).optional().default(3),
  defaultBranch: z.string().optional().default("main"),
  proxyUrl: z.string().optional().default(""),
  cacheTime: z.number().int().min(0).max(3600).optional().default(300),
  isDefault: z.boolean().optional().default(false),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const data = parsed.data as GitlabConfigInput;

  const testResult = await testGitlabConnection(data);
  if (!testResult.success) {
    throw createError({
      statusCode: 400,
      message: `连接测试失败: ${testResult.message}`,
    });
  }

  const config = await createGitlabConfig(data);

  return {
    ...config,
    token: "***",
  };
});
