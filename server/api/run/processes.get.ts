import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = String(query.serverId || "");

  if (!serverId)
    throw createError({ statusCode: 400, message: "serverId required" });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const isWindows = cfg.os === "windows";
  const ssh = await createSshHandle(cfg);
  try {
    const processes: any[] = [];

    const { stdout: pm2Output, code: pm2Code } = await ssh.exec(
      "pm2 jlist 2>/dev/null || echo '[]'"
    );

    if (pm2Code === 0) {
      try {
        const pm2List = JSON.parse(pm2Output.trim() || "[]");
        pm2List.forEach((p: any) => {
          processes.push({
            name: p.name,
            type: "pm2",
            status: p.pm2_env?.status === "online" ? "running" : "stopped",
            cpu: p.monit?.cpu ?? 0,
            memory: formatBytes(p.monit?.memory ?? 0),
            port: p.pm2_env?.env?.PORT,
            startedAt: p.pm2_env?.pm_uptime
              ? new Date(p.pm2_env.pm_uptime).toISOString()
              : undefined,
          });
        });
      } catch {}
    }

    const dockerCmd = isWindows
      ? '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"'
      : "docker";

    const { stdout: dockerOutput, code: dockerCode } = await ssh.exec(
      `${dockerCmd} ps --format "{{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.CreatedAt}}"`
    );

    if (dockerCode === 0 && dockerOutput.trim()) {
      const lines = dockerOutput.trim().split("\n");
      lines.forEach((line) => {
        const [name, status, ports, createdAt] = line.split("\t");
        if (!name) return;

        const portMatch = ports?.match(/(\d+)->/);
        const port = portMatch ? parseInt(portMatch[1]!) : undefined;

        processes.push({
          name: name.trim(),
          type: "docker",
          status: status?.includes("Up") ? "running" : "stopped",
          cpu: 0,
          memory: "-",
          port,
          startedAt: createdAt?.trim(),
        });
      });
    }

    return processes;
  } finally {
    ssh.dispose();
  }
});

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
