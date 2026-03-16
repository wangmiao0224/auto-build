import { getGitlabClient, handleGitlabError } from "../../utils/gitlab";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const search = (query.search as string) || "";
  const page = parseInt((query.page as string) || "1");
  const perPage = parseInt((query.per_page as string) || "20");
  const gitlabId = query.gitlabId as string | undefined;

  try {
    const gl = await getGitlabClient(gitlabId);
    const projects = await gl.Projects.all({
      membership: true,
      search,
      page,
      perPage,
      orderBy: "last_activity_at",
      sort: "desc",
    });

    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      nameWithNamespace: p.name_with_namespace,
      description: p.description,
      webUrl: p.web_url,
      avatarUrl: p.avatar_url,
      defaultBranch: p.default_branch,
      visibility: p.visibility,
      lastActivityAt: p.last_activity_at,
    }));
  } catch (err) {
    handleGitlabError(err);
  }
});
