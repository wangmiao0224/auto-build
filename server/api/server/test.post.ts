import { z } from "zod";
import { readConfig } from "../../utils/storage";
import type { ServerConfig } from "../../../types/server";
import { Client } from "ssh2";

const schema = z.object({
  serverId: z.string().optional(),
  host: z.string().optional(),
  port: z.number().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

function sshConnect(
  host: string,
  port: number,
  username: string,
  password: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const start = Date.now();
    const timer = setTimeout(() => {
      conn.destroy();
      reject(new Error("连接超时（10s）"));
    }, 10000);

    conn
      .on("ready", () => {
        clearTimeout(timer);
        const latency = Date.now() - start;
        conn.end();
        resolve(latency);
      })
      .on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      })
      .connect({ host, port, username, password, readyTimeout: 10000 });
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0].message,
    });
  }

  let host: string, port: number, username: string, password: string;

  if (parsed.data.serverId) {
    const configs = await readConfig<ServerConfig[]>("server-configs", []);
    const cfg = configs.find((c) => c.id === parsed.data.serverId);
    if (!cfg)
      throw createError({ statusCode: 404, message: "服务器配置不存在" });
    host = cfg.host;
    port = cfg.port;
    username = cfg.username;
    password = cfg.password;
  } else {
    host = parsed.data.host!;
    port = parsed.data.port || 22;
    username = parsed.data.username!;
    password = parsed.data.password!;
  }

  try {
    const latencyMs = await sshConnect(host, port, username, password);
    return { success: true, message: "连接成功", latencyMs };
  } catch (err: unknown) {
    const e = err as Error;
    return { success: false, message: e.message || "连接失败" };
  }
});
