import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";
import type { DockerImage } from "~/types/server";

const actionSchema = z.object({
  serverId: z.string(),
  action: z.enum(["list", "pull", "remove"]),
  imageName: z.string().optional(),
  imageId: z.string().optional(),
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

  const { serverId, action, imageName, imageId } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    const isWindows = server.os === "windows";

    if (action === "list") {
      const listCmd = 'docker images --format "{{.ID}}\\t{{.Repository}}\\t{{.Tag}}\\t{{.Size}}\\t{{.CreatedAt}}"';

      const { stdout, code } = await ssh.exec(listCmd);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: "获取镜像列表失败" });
      }

      const images: DockerImage[] = [];
      const lines = stdout.split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        const [id, name, tag, size, created] = line.split("\t");

        if (!id || !name) continue;

        images.push({
          id: id.substring(0, 12),
          name: name || "<none>",
          tag: tag || "latest",
          size: size || "unknown",
          created: created || new Date().toISOString(),
        });
      }

      return { images };
    }

    if (action === "pull") {
      if (!imageName) {
        throw createError({ statusCode: 400, message: "镜像名称不能为空" });
      }

      const { stdout, stderr, code } = await ssh.exec(`docker pull ${imageName}`);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: stderr || "拉取镜像失败" });
      }

      return {
        success: true,
        message: `镜像 ${imageName} 拉取成功`,
        output: stdout,
      };
    }

    if (action === "remove") {
      const target = imageId || imageName;
      if (!target) {
        throw createError({ statusCode: 400, message: "镜像ID或名称不能为空" });
      }

      const { stdout, stderr, code } = await ssh.exec(`docker rmi -f ${target}`);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: stderr || "删除镜像失败" });
      }

      return {
        success: true,
        message: `镜像删除成功`,
        output: stdout,
      };
    }

    throw createError({ statusCode: 400, message: "未知操作" });
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
