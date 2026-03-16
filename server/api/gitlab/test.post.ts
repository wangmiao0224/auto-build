import { testGitlabConnection } from "../../utils/gitlab";
import { z } from "zod";

const schema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  token: z.string().optional(),
  proxyUrl: z.string().optional(),
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

  const { id, url, token, proxyUrl } = parsed.data;

  if (id) {
    const { getGitlabConfig } = await import("../../utils/gitlab");
    const config = await getGitlabConfig(id);
    if (!config) {
      throw createError({ statusCode: 404, message: "配置不存在" });
    }
    return testGitlabConnection(config);
  }

  if (!url || !token) {
    throw createError({
      statusCode: 400,
      message: "URL 和 Token 不能为空",
    });
  }

  return testGitlabConnection({ url, token, proxyUrl } as any);
});
