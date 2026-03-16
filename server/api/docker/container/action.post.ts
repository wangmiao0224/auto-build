import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";

const actionSchema = z.object({
  serverId: z.string(),
  containerId: z.string(),
  action: z.enum(["start", "stop", "restart", "remove"]),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const { serverId, containerId, action } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    let cmd: string;
    switch (action) {
      case "start":
        cmd = `docker start ${containerId}`;
        break;
      case "stop":
        cmd = `docker stop ${containerId}`;
        break;
      case "restart":
        cmd = `docker restart ${containerId}`;
        break;
      case "remove":
        cmd = `docker rm -f ${containerId}`;
        break;
      default:
        throw createError({ statusCode: 400, message: "未知操作" });
    }

    const { stdout, stderr, code } = await ssh.exec(cmd);

    if (code !== 0) {
      throw createError({ statusCode: 500, message: stderr || "操作失败" });
    }

    return {
      success: true,
      message: `${action} 成功`,
      output: stdout,
    };
  } catch (err) {
    if ((err as any).statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: `操作失败: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});
