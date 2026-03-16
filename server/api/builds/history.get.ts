import { readConfig } from "../../utils/storage";
import type { BuildRecord } from "../../../types/build";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const projectId = query.projectId
    ? parseInt(query.projectId as string)
    : null;
  const limit = parseInt((query.limit as string) || "50");

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const filtered = projectId
    ? history.filter((r) => r.projectId === projectId)
    : history;
  return filtered.slice(0, limit);
});
