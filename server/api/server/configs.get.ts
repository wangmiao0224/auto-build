import { readConfig } from "../../utils/storage";
import type { ServerConfig } from "../../../types/server";

export default defineEventHandler(async () => {
  const configs = await readConfig<ServerConfig[]>("server-configs", []);
  return configs.map((c) => ({
    ...c,
    password: "***",
  }));
});
