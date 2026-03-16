import { getServerConfig, createSshHandle } from "../../utils/ssh";
import type { NginxStatus } from "../../../types/server";

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
    if (server.os === "windows") {
      const nginxDir = `${server.workDir}\\nginx`;
      const { stdout: checkOut } = await ssh.exec(
        `if exist "${nginxDir}\\nginx.exe" (echo exists) else (echo not_found)`
      );

      if (checkOut.trim() !== "exists") {
        return {
          installed: false,
          running: false,
        } as NginxStatus;
      }

      const { stdout: procOut } = await ssh.exec(
        `tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I "nginx.exe"`
      );
      const running =
        procOut.trim().length > 0 &&
        procOut.toLowerCase().includes("nginx.exe");

      return {
        installed: true,
        running,
        version: "1.24.0",
        configPath: `${nginxDir}\\conf\\nginx.conf`,
      } as NginxStatus;
    }

    const { stdout: whichNginx, code: whichCode } = await ssh.exec(
      "which nginx 2>/dev/null || echo 'not_found'"
    );

    if (whichCode !== 0 || whichNginx.trim() === "not_found") {
      return {
        installed: false,
        running: false,
      } as NginxStatus;
    }

    const { stdout: versionOut } = await ssh.exec("nginx -v 2>&1");
    const versionMatch = versionOut.match(/nginx\/([\d.]+)/);
    const version = versionMatch ? versionMatch[1] : undefined;

    const { stdout: configOut } = await ssh.exec(
      "nginx -V 2>&1 | grep 'configure arguments' | grep -o 'conf-path=[^ ]*' | cut -d= -f2"
    );
    const configPath = configOut.trim() || "/etc/nginx/nginx.conf";

    const { stdout: statusOut } = await ssh.exec(
      "systemctl is-active nginx 2>/dev/null || service nginx status 2>/dev/null || pgrep -x nginx > /dev/null && echo 'active' || echo 'inactive'"
    );
    const running =
      statusOut.trim() === "active" || statusOut.includes("running");

    return {
      installed: true,
      running,
      version,
      configPath,
    } as NginxStatus;
  } catch (err) {
    return {
      installed: false,
      running: false,
      error: (err as Error).message,
    } as NginxStatus;
  } finally {
    ssh.dispose();
  }
});
