import { getServerConfig, createSshHandle } from "../../utils/ssh";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { serverId, command } = body as { serverId: string; command: string };

  if (!serverId || !command)
    throw createError({
      statusCode: 400,
      message: "serverId and command required",
    });

  const cfg = await getServerConfig(serverId);
  if (!cfg) throw createError({ statusCode: 404, message: "Server not found" });

  const ssh = await createSshHandle(cfg);
  try {
    const { stdout, stderr, code } = await ssh.exec(command);
    return { output: stdout + (stderr ? `\n[stderr]\n${stderr}` : ""), code };
  } finally {
    ssh.dispose();
  }
});
