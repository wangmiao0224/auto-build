import { readConfig, writeConfig } from "../../../utils/storage";
import type { ProjectConfig } from "../../../types/project";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id") as string;

  const projects = await readConfig<ProjectConfig[]>("projects", []);
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) {
    throw createError({
      statusCode: 404,
      message: "项目不存在",
    });
  }

  await writeConfig("projects", filtered);

  return { success: true };
});
