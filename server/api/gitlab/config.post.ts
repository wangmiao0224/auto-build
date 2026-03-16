import { readConfig, writeConfig } from "../../utils/storage";
import { resetGitlabClient, testGitlabConnection } from "../../utils/gitlab";
import { Gitlab } from "@gitbeaker/rest";

interface GitlabConfig {
  url: string;
  token: string;
}

interface RequestBody {
  url: string;
  token: string;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event);

  if (!body.url || !body.token) {
    throw createError({
      statusCode: 400,
      message: "URL 和 Token 不能为空",
    });
  }

  let normalizedUrl = body.url.trim();
  if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
    normalizedUrl = "https://" + normalizedUrl;
  }
  if (normalizedUrl.endsWith("/")) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  try {
    const testClient = new Gitlab({
      host: normalizedUrl,
      token: body.token,
    });
    await testClient.Users.showCurrentUser();
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 401) {
      throw createError({
        statusCode: 401,
        message: "GitLab Token 无效或已过期",
      });
    }
    if (status === 403) {
      throw createError({
        statusCode: 403,
        message: "GitLab 权限不足",
      });
    }
    throw createError({
      statusCode: 400,
      message: "无法连接到 GitLab，请检查 URL 是否正确",
    });
  }

  const existingConfig = await readConfig<GitlabConfig>("gitlab-config", {
    url: "",
    token: "",
  });

  await writeConfig<GitlabConfig>("gitlab-config", {
    url: normalizedUrl,
    token: body.token,
  });

  resetGitlabClient();

  return { success: true };
});
