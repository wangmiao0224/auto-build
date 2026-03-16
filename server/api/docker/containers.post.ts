import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";
import type { DockerContainer, DockerPort } from "~/types/server";

const actionSchema = z.object({
  serverId: z.string(),
  action: z.enum(["list", "start", "stop", "restart", "remove", "logs"]),
  containerId: z.string().optional(),
  containerName: z.string().optional(),
});

function parseContainerLine(line: string, isWindows: boolean): DockerContainer | null {
  if (!line.trim() || line.includes("CONTAINER ID")) return null;
  
  const parts = line.split(/\s{2,}/);
  if (parts.length < 4) return null;

  const id = parts[0];
  const image = parts[1];
  const status = parts[2].toLowerCase();
  const ports: DockerPort[] = [];
  
  if (parts[3]) {
    const portMatches = parts[3].matchAll(/(\d+(?:\.\d+.\d+.\d+)?:)?(\d+)->(\d+)\/(tcp|udp)/gi);
    for (const match of portMatches) {
      ports.push({
        hostPort: match[2] ? parseInt(match[2]) : undefined,
        containerPort: parseInt(match[3]),
        protocol: match[4],
      });
    }
  }

  const name = parts[parts.length - 1] || id.substring(0, 12);

  let containerStatus: DockerContainer["status"] = "unknown";
  if (status.includes("up") || status.includes("running")) containerStatus = "running";
  else if (status.includes("exited")) containerStatus = "exited";
  else if (status.includes("paused")) containerStatus = "paused";
  else if (status.includes("created")) containerStatus = "created";

  return {
    id,
    name,
    image,
    status: containerStatus,
    state: status,
    ports,
    created: new Date().toISOString(),
  };
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const { serverId, action, containerId, containerName } = parsed.data;
  const server = await getServerConfig(serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    const isWindows = server.os === "windows";

    if (action === "list") {
      const formatFlag = isWindows 
        ? "" 
        : "--format '{{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Names}}'";
      
      const listCmd = isWindows
        ? "docker ps -a"
        : `docker ps -a ${formatFlag}`;

      const { stdout, code } = await ssh.exec(listCmd);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: "获取容器列表失败" });
      }

      const containers: DockerContainer[] = [];
      const lines = stdout.split("\n");

      for (const line of lines) {
        const container = parseContainerLine(line, isWindows);
        if (container) containers.push(container);
      }

      return { containers };
    }

    const target = containerId || containerName;
    if (!target) {
      throw createError({ statusCode: 400, message: "容器ID或名称不能为空" });
    }

    let cmd: string;
    switch (action) {
      case "start":
        cmd = `docker start ${target}`;
        break;
      case "stop":
        cmd = `docker stop ${target}`;
        break;
      case "restart":
        cmd = `docker restart ${target}`;
        break;
      case "remove":
        cmd = `docker rm -f ${target}`;
        break;
      case "logs":
        cmd = `docker logs --tail 100 ${target}`;
        break;
      default:
        throw createError({ statusCode: 400, message: "未知操作" });
    }

    const { stdout, stderr, code } = await ssh.exec(cmd);

    if (code !== 0 && action !== "logs") {
      throw createError({ statusCode: 500, message: stderr || "操作失败" });
    }

    return {
      success: true,
      message: `${action} 成功`,
      output: action === "logs" ? stdout || stderr : undefined,
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
