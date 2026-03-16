import { getGitlabClient, handleGitlabError } from "../../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const pipelineId = parseInt(getRouterParam(event, "pipelineId") as string);
  const query = getQuery(event);
  const projectId = parseInt(query.projectId as string);
  const gitlabId = query.gitlabId as string | undefined;

  if (!projectId || !pipelineId) {
    throw createError({
      statusCode: 400,
      message: "缺少 projectId 或 pipelineId",
    });
  }

  try {
    const gl = await getGitlabClient(gitlabId);
    await gl.Pipelines.cancel(projectId, pipelineId);
    return { success: true };
  } catch (err) {
    handleGitlabError(err);
  }
});
