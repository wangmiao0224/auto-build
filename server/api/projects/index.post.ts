import { readConfig, writeConfig } from "../../utils/storage";
import type { ProjectConfig } from "../../../types/project";
import { randomUUID } from "node:crypto";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const projectId =
    typeof body.projectId === "string"
      ? parseInt(body.projectId, 10)
      : body.projectId;

  if (!projectId || !body.projectName || !body.selectedBranch) {
    throw createError({
      statusCode: 400,
      message: "缺少必填字段",
    });
  }

  const projects = await readConfig<ProjectConfig[]>("projects", []);

  if (body.id) {
    const existingIndex = projects.findIndex((p) => p.id === body.id);
    if (existingIndex !== -1) {
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...body,
        projectId,
        updatedAt: new Date().toISOString(),
      };
      await writeConfig("projects", projects);
      return { success: true };
    }
  }

  const newProject: ProjectConfig = {
    id: randomUUID(),
    projectId,
    projectName: body.projectName,
    selectedBranch: body.selectedBranch,
    selectedTriggerId: body.selectedTriggerId || null,
    serverId: body.serverId,
    updatedAt: new Date().toISOString(),
  };

  projects.push(newProject);
  await writeConfig("projects", projects);

  return { success: true, id: newProject.id };
});
