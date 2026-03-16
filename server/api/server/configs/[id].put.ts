import { z } from "zod";
import { readConfig, writeConfig } from "../../../utils/storage";
import type { ServerConfig } from "../../../../types/server";

const schema = z.object({
  name: z.string().min(1).optional(),
  host: z.string().min(1).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().min(1).optional(),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  passphrase: z.string().optional(),
  workDir: z.string().min(1).optional(),
  os: z.enum(["windows", "linux"]).optional(),
  group: z.string().optional(),
  envVars: z.string().optional(),
  preDeployScript: z.string().optional(),
  postDeployScript: z.string().optional(),
  healthCheckUrl: z.string().optional(),
  healthCheckTimeout: z.number().int().min(1).max(300).optional(),
  description: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "验证失败",
    });
  }

  const configs = await readConfig<ServerConfig[]>("server-configs", []);
  const idx = configs.findIndex((c) => c.id === id);
  if (idx === -1)
    throw createError({ statusCode: 404, message: "服务器配置不存在" });

  const data = parsed.data;
  const updated = {
    ...configs[idx]!,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  configs[idx] = updated;
  await writeConfig("server-configs", configs);

  return { ...updated, password: "***", privateKey: "***", passphrase: "***" };
});
