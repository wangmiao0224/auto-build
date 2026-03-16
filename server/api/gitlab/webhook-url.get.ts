import { getWebhookUrl, getGitlabConfig } from "../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id as string | undefined;

  if (id) {
    const config = await getGitlabConfig(id);
    if (!config) {
      throw createError({ statusCode: 404, message: "配置不存在" });
    }
    return {
      id: config.id,
      name: config.name,
      webhookUrl: getWebhookUrl(config.id),
      webhookSecret: config.webhookSecret ? "已配置" : "未配置",
    };
  }

  const { getGitlabConfigs } = await import("../../utils/gitlab");
  const configs = await getGitlabConfigs();

  return configs.map((c) => ({
    id: c.id,
    name: c.name,
    webhookUrl: getWebhookUrl(c.id),
    webhookSecret: c.webhookSecret ? "已配置" : "未配置",
  }));
});
