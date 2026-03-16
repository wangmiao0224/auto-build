import { getServerConfig, createSshHandle } from "~/server/utils/ssh";
import type { DockerStatus } from "~/types/server";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const serverId = query.serverId as string;

  if (!serverId) {
    throw createError({ statusCode: 400, message: "serverId is required" });
  }

  const server = await getServerConfig(serverId);
  if (!server) {
    throw createError({ statusCode: 404, message: "Server not found" });
  }

  const ssh = await createSshHandle(server);
  try {
    let versionCmd: string;
    let runningCmd: string;

    if (server.os === "windows") {
      versionCmd = "docker --version 2>nul";
      runningCmd = "docker info 2>nul | findstr /i \"Running\"";
    } else {
      versionCmd = "docker --version 2>/dev/null";
      runningCmd = "docker info 2>/dev/null | grep -i 'Running' || docker ps 2>/dev/null | head -1";
    }

    const { stdout: versionOut, code: versionCode } = await ssh.exec(versionCmd);
    
    if (versionCode !== 0 || !versionOut.includes("Docker")) {
      return {
        installed: false,
        running: false,
        error: "Docker 未安装",
      } as DockerStatus;
    }

    const versionMatch = versionOut.match(/Docker version ([\d.]+)/);
    const version = versionMatch?.[1] || "unknown";

    const { stdout: runningOut, code: runningCode } = await ssh.exec(runningCmd);
    
    const isRunning = runningCode === 0 && (runningOut.includes("Running") || runningOut.includes("CONTAINER"));

    return {
      installed: true,
      running: isRunning,
      version,
    } as DockerStatus;
  } catch (err: any) {
    return {
      installed: false,
      running: false,
      error: err.message,
    } as DockerStatus;
  } finally {
    ssh.dispose();
  }
});
