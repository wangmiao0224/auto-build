import { z } from "zod";
import { readConfig, writeConfig } from "../../utils/storage";
import type { ServerConfig } from "../../../types/server";
import { randomUUID } from "node:crypto";

const schema = z.object({
  name: z.string().min(1, "名称不能为空"),
  host: z.string().min(1, "IP 不能为空"),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().optional().default(""),
  privateKey: z.string().optional().default(""),
  passphrase: z.string().optional().default(""),
  workDir: z.string().min(1, "工作目录不能为空"),
  os: z.enum(["windows", "linux"]).default("linux"),
  group: z.string().optional().default(""),
  envVars: z.string().optional().default(""),
  preDeployScript: z.string().optional().default(""),
  postDeployScript: z.string().optional().default(""),
  healthCheckUrl: z.string().optional().default(""),
  healthCheckTimeout: z.number().int().min(1).max(300).optional().default(30),
  description: z.string().optional().default(""),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "验证失败",
    });
  }

  const data = parsed.data;
  const configs = await readConfig<ServerConfig[]>("server-configs", []);

  const newConfig: ServerConfig = {
    id: randomUUID(),
    name: data.name,
    host: data.host,
    port: data.port,
    username: data.username,
    password: data.password,
    privateKey: data.privateKey,
    passphrase: data.passphrase,
    workDir: data.workDir,
    os: data.os,
    group: data.group,
    envVars: data.envVars,
    preDeployScript: data.preDeployScript,
    postDeployScript: data.postDeployScript,
    healthCheckUrl: data.healthCheckUrl,
    healthCheckTimeout: data.healthCheckTimeout,
    description: data.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  configs.push(newConfig);
  await writeConfig("server-configs", configs);

  return {
    ...newConfig,
    password: "***",
    privateKey: "***",
    passphrase: "***",
  };
});
