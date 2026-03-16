import { z } from "zod";
import { getServerConfig, createSshHandle } from "../../utils/ssh";
import { readConfig } from "../../utils/storage";
import type { BuildRecord } from "../../../types/build";
import type { ServerConfig } from "../../../types/server";

const schema = z.object({
  recordId: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.errors[0].message,
    });
  }

  const { recordId } = parsed.data;

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const record = history.find((r) => r.id === recordId);

  if (!record) {
    throw createError({ statusCode: 404, message: "构建记录不存在" });
  }

  const servers = await readConfig<ServerConfig[]>("server-configs", []);
  let server: ServerConfig | undefined;

  if (record.serverId) {
    server = servers.find((s) => s.id === record.serverId);
  } else if (record.tarTarget) {
    server = servers.find((s) => s.host === record.tarTarget);
  }

  if (!server) {
    throw createError({ statusCode: 404, message: "未找到对应的服务器配置" });
  }

  const ssh = await createSshHandle(server);
  try {
    const pm2Name = `${record.projectName}-${record.tagName}`;
    const isWindows = server.os === "windows";

    let listCmd: string;
    if (isWindows) {
      listCmd = `pm2 jlist`;
    } else {
      listCmd = `pm2 jlist 2>/dev/null || echo '[]'`;
    }

    const { stdout: listOutput } = await ssh.exec(listCmd);

    const processes = JSON.parse(listOutput.trim() || "[]");
    const exists = processes.some((p: any) => p.name === pm2Name);

    if (!exists) {
      return { success: true, message: "进程不存在或已停止" };
    }

    const { stdout, code, stderr } = await ssh.exec(
      `pm2 stop "${pm2Name}" && pm2 delete "${pm2Name}" 2>&1`
    );

    if (code !== 0) {
      throw createError({
        statusCode: 500,
        message: `停止失败: ${stderr || stdout}`,
      });
    }

    return { success: true, message: "项目已停止" };
  } finally {
    ssh.dispose();
  }
});
