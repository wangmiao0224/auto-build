import { getServerConfig, createSshHandle } from "../../utils/ssh";
import type { NginxConfig } from "../../../types/server";

const defaultConfig: NginxConfig = {
  workerProcesses: "auto",
  workerConnections: 1024,
  keepaliveTimeout: 65,
  clientMaxBodySize: "100M",
  gzip: true,
  gzipLevel: 6,
  gzipTypes: [
    "application/javascript",
    "application/json",
    "application/xml",
    "text/css",
    "text/plain",
    "text/xml",
  ],
  cacheEnabled: true,
  cacheDuration: "30s",
  httpPort: 80,
  httpsPort: 443,
};

function parseNginxConfig(content: string): Partial<NginxConfig> {
  const config: Partial<NginxConfig> = {};

  const workerMatch = content.match(/worker_processes\s+(\w+);/);
  if (workerMatch && workerMatch[1]) {
    config.workerProcesses =
      workerMatch[1] === "auto" ? "auto" : parseInt(workerMatch[1], 10);
  }

  const connMatch = content.match(/worker_connections\s+(\d+);/);
  if (connMatch && connMatch[1]) {
    config.workerConnections = parseInt(connMatch[1], 10);
  }

  const keepaliveMatch = content.match(/keepalive_timeout\s+(\d+);/);
  if (keepaliveMatch && keepaliveMatch[1]) {
    config.keepaliveTimeout = parseInt(keepaliveMatch[1], 10);
  }

  const bodySizeMatch = content.match(/client_max_body_size\s+([^;]+);/);
  if (bodySizeMatch && bodySizeMatch[1]) {
    config.clientMaxBodySize = bodySizeMatch[1].trim();
  }

  const gzipMatch = content.match(/gzip\s+(on|off);/);
  if (gzipMatch && gzipMatch[1]) {
    config.gzip = gzipMatch[1] === "on";
  }

  const gzipLevelMatch = content.match(/gzip_comp_level\s+(\d+);/);
  if (gzipLevelMatch && gzipLevelMatch[1]) {
    config.gzipLevel = parseInt(gzipLevelMatch[1], 10);
  }

  const gzipTypesMatch = content.match(/gzip_types\s+([^;]+);/);
  if (gzipTypesMatch && gzipTypesMatch[1]) {
    config.gzipTypes = gzipTypesMatch[1].trim().split(/\s+/);
  }

  const cacheMatch = content.match(/open_file_cache\s+/);
  config.cacheEnabled = !!cacheMatch;

  return config;
}

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
      const confPath = `${server.workDir}\\nginx\\conf\\nginx.conf`;
      const { stdout: configContent, code } = await ssh.exec(`type "${confPath}"`);

      if (code !== 0) {
        return { ...defaultConfig, configPath: confPath };
      }

      const parsed = parseNginxConfig(configContent);
      return {
        ...defaultConfig,
        ...parsed,
        configPath: confPath,
      };
    }

    const { stdout: configPath } = await ssh.exec(
      "nginx -V 2>&1 | grep 'configure arguments' | grep -o 'conf-path=[^ ]*' | cut -d= -f2"
    );
    const confPath = configPath.trim() || "/etc/nginx/nginx.conf";

    const { stdout: configContent, code } = await ssh.exec(`cat ${confPath}`);

    if (code !== 0) {
      return { ...defaultConfig, configPath: confPath };
    }

    const parsed = parseNginxConfig(configContent);
    return {
      ...defaultConfig,
      ...parsed,
      configPath: confPath,
    };
  } finally {
    ssh.dispose();
  }
});
