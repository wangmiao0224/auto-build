import { getServerConfig, createSshHandle } from "../../../utils/ssh";
import { readConfig } from "../../../utils/storage";
import type { BuildRecord } from "../../../../types/build";
import type { ServerConfig } from "../../../../types/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const recordId = String(query.recordId || "");

  if (!recordId) {
    throw createError({ statusCode: 400, message: "recordId required" });
  }

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
    return { running: false, message: "未找到对应的服务器配置" };
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
    const process = processes.find((p: any) => p.name === pm2Name);

    if (!process) {
      return { running: false };
    }

    return {
      running: process.pm2_env?.status === "online",
      status: process.pm2_env?.status,
      pid: process.pid,
      memory: process.monit?.memory,
      cpu: process.monit?.cpu,
      uptime: process.pm2_env?.pm_uptime,
    };
  } finally {
    ssh.dispose();
  }
});
