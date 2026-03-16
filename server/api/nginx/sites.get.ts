import { getServerConfig, createSshHandle } from "../../utils/ssh";
import type { NginxSite } from "../../../types/server";

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

  if (server.os === "windows") {
    throw createError({ statusCode: 400, message: "Windows 暂不支持站点管理" });
  }

  const ssh = await createSshHandle(server);
  try {
    const { stdout: sitesAvailable } = await ssh.exec(
      "ls -1 /etc/nginx/sites-available 2>/dev/null || ls -1 /etc/nginx/conf.d/*.conf 2>/dev/null | xargs -n1 basename"
    );

    const { stdout: sitesEnabled } = await ssh.exec(
      "ls -1 /etc/nginx/sites-enabled 2>/dev/null || echo ''"
    );
    const enabledSet = new Set(sitesEnabled.trim().split("\n").filter(Boolean));

    const sites: NginxSite[] = [];
    const siteNames = sitesAvailable.trim().split("\n").filter(Boolean);

    for (const siteName of siteNames) {
      if (siteName === "default") continue;

      const confPath = `/etc/nginx/sites-available/${siteName}`;
      const { stdout: content } = await ssh.exec(`cat ${confPath} 2>/dev/null || cat /etc/nginx/conf.d/${siteName} 2>/dev/null`);

      const serverNameMatch = content.match(/server_name\s+([^;]+);/);
      const rootMatch = content.match(/root\s+([^;]+);/);
      const portMatch = content.match(/listen\s+(\d+)/);
      const sslMatch = content.match(/ssl_certificate/);
      const http2Match = content.match(/http2/);

      sites.push({
        name: siteName.replace(/\.conf$/, ""),
        serverName: serverNameMatch?.[1]?.trim() || "_",
        root: rootMatch?.[1]?.trim() || "",
        port: portMatch?.[1] ? parseInt(portMatch[1], 10) : 80,
        ssl: !!sslMatch,
        http2: !!http2Match,
        locations: [],
        enabled: enabledSet.has(siteName),
      });
    }

    return sites;
  } finally {
    ssh.dispose();
  }
});
