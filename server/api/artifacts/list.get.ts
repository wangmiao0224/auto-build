import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = String(query.serverId || "");
  const remotePath = String(query.path || "");

  if (!serverId)
    throw createError({ statusCode: 400, message: "serverId required" });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const ssh = await createSshHandle(cfg);
  try {
    const basePath = (cfg as any).artifactsPath || "/opt/artifacts";
    const targetPath = remotePath ? `${basePath}/${remotePath}` : basePath;

    const { stdout, code } = await ssh.exec(
      `ls -la --time-style=+%s "${targetPath}" 2>&1`
    );
    if (code !== 0) return [];

    const files: Array<{
      name: string;
      isDir: boolean;
      size: number;
      mtime: number;
    }> = [];
    const lines = stdout.split("\n").slice(1);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 9) continue;
      const perms = parts[0];
      const size = parseInt(parts[4]) || 0;
      const mtime = parseInt(parts[5]) || 0;
      const name = parts.slice(8).join(" ");
      if (!name || name === "." || name === "..") continue;
      files.push({ name, isDir: perms.startsWith("d"), size, mtime });
    }
    return files.sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0));
  } finally {
    ssh.dispose();
  }
});
