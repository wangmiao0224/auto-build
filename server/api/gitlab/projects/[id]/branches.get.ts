import { getGitlabClient, handleGitlabError } from "../../../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const projectId = getRouterParam(event, "id");
  const query = getQuery(event);
  const gitlabId = query.gitlabId as string | undefined;

  try {
    const gl = await getGitlabClient(gitlabId);
    const branches = await gl.Branches.all(projectId as string);
    return branches.map((b: any) => ({
      name: b.name,
      commit: {
        id: b.commit?.id,
        shortId: b.commit?.short_id,
        title: b.commit?.title,
        authorName: b.commit?.author_name,
        authoredDate: b.commit?.authored_date,
      },
      protected: b.protected,
      merged: b.merged,
    }));
  } catch (err) {
    handleGitlabError(err);
  }
});
