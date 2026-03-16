import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { serverId, name, type, action } = body as {
    serverId: string;
    name: string;
    type: "pm2" | "docker";
    action: "restart" | "stop" | "start" | "delete";
  };

  if (!serverId || !name || !action)
    throw createError({
      statusCode: 400,
      message: "serverId, name and action required",
    });

  const allowed = ["restart", "stop", "start", "delete"];
  if (!allowed.includes(action))
    throw createError({ statusCode: 400, message: "Invalid action" });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const isWindows = cfg.os === "windows";
  const ssh = await createSshHandle(cfg);
  try {
    let cmd: string;

    if (type === "docker") {
      const dockerCmd = isWindows
        ? '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"'
        : "docker";

      if (action === "restart") {
        cmd = `${dockerCmd} restart ${name}`;
      } else if (action === "stop") {
        cmd = `${dockerCmd} stop ${name}`;
      } else if (action === "start") {
        cmd = `${dockerCmd} start ${name}`;
      } else {
        cmd = `${dockerCmd} rm -f ${name}`;
      }
    } else {
      cmd = `pm2 ${action} "${name}" 2>&1`;
    }

    const { stdout, stderr, code } = await ssh.exec(cmd);
    if (code !== 0)
      throw createError({
        statusCode: 500,
        message: stderr || stdout || "操作失败",
      });
    return { success: true, output: stdout };
  } finally {
    ssh.dispose();
  }
});
