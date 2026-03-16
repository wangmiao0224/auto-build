import { getGitlabConfigs } from "../../utils/gitlab";

export default defineEventHandler(async () => {
  const configs = await getGitlabConfigs();
  return configs.map((c) => ({
    ...c,
    token: "***",
  }));
});
