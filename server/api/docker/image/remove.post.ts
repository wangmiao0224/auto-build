import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";

const schema = z.object({
  serverId: z.string(),
  imageId: z.string(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const { serverId, imageId } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    const cmd = `docker rmi -f ${imageId}`;
    const { stdout, stderr, code } = await ssh.exec(cmd);

    if (code !== 0) {
      throw createError({ statusCode: 500, message: stderr || "删除失败" });
    }

    return {
      success: true,
      message: "镜像删除成功",
      output: stdout,
    };
  } catch (err) {
    if ((err as any).statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: `删除失败: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});
