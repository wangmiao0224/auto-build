import { readConfig, writeConfig } from "../../../utils/storage";
import type { ServerConfig } from "../../../../types/server";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const configs = await readConfig<ServerConfig[]>("server-configs", []);
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1)
    throw createError({ statusCode: 404, message: "服务器配置不存在" });
  configs.splice(idx, 1);
  await writeConfig("server-configs", configs);
  return { success: true };
});
