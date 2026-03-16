import { readConfig, writeConfig } from "../../../utils/storage";
import type { ProjectConfig } from "../../../types/project";

export default defineEventHandler(async (event) => {
  const projectId = parseInt(getRouterParam(event, "id") as string);

  const projects = await readConfig<ProjectConfig[]>("projects", []);
  const project = projects.find((p) => p.projectId === projectId);

  if (!project) {
    throw createError({
      statusCode: 404,
      message: "项目不存在",
    });
  }

  return project;
});
