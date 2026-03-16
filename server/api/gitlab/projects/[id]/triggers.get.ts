import { getGitlabClient, handleGitlabError } from "../../../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "id");
  const query = getQuery(event);
  const gitlabId = query.gitlabId as string | undefined;

  try {
    const gl = await getGitlabClient(gitlabId);
    const triggers = await gl.PipelineTriggerTokens.all(projectId as string);
    return triggers.map((t: any) => ({
      id: t.id,
      description: t.description,
      token: t.token,
      createdAt: t.created_at,
      lastUsed: t.last_used,
    }));
  } catch (err) {
    handleGitlabError(err);
  }
});
