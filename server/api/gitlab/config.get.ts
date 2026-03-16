import { readConfig, writeConfig } from "../../utils/storage";
import { resetGitlabClient } from "../../utils/gitlab";

interface GitlabConfig {
  url: string;
  token: string;
}

export default defineEventHandler(async (event) => {
  const config = await readConfig<GitlabConfig>("gitlab-config", {
    url: "",
    token: "",
  });

  return {
    url: config.url,
    hasToken: !!config.token,
  };
});
