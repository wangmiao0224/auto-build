import { readConfig, writeConfig } from "../../utils/storage";
import type { ProjectConfig } from "../../../types/project";

export default defineEventHandler(async () => {
  const projects = await readConfig<ProjectConfig[]>("projects", []);
  return projects;
});
