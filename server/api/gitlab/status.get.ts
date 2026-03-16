import { testGitlabConnection } from "../../utils/gitlab";

export default defineEventHandler(async () => {
  const connected = await testGitlabConnection();
  return { connected };
});
