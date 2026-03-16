import { z } from "zod";
import { getServerConfig, createSshHandle } from "../../utils/ssh";
import { readConfig } from "../../utils/storage";
import type { BuildRecord, ProxyRoute } from "../../../types/build";
import type { ServerConfig } from "../../../types/server";

function generateNginxConfig(
  name: string,
  port: number,
  routes: ProxyRoute[]
): string {
  const locationBlocks = routes
    .map((route) => {
      const proxyPass = route.rewrite
        ? `rewrite ^${route.prefix}/?(.*)$ /$1 break;\n    proxy_pass ${route.target};`
        : `proxy_pass ${route.target};`;
      return `location ${route.prefix} {
    ${proxyPass}
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }`;
    })
    .join("\n  ");

  return `upstream ${name} {
  server 127.0.0.1:${port};
}

server {
  listen 80;
  server_name _;

  location / {
    proxy_pass http://${name};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  ${locationBlocks}
}`;
}

function parseEnvVars(envVars: string): string {
  if (!envVars) return "";
  return envVars
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && line.includes("="))
    .join(" ");
}

const schema = z.object({
  recordId: z.string(),
  name: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  runCommand: z.string().default("npm start"),
  proxyIp: z.string().optional(),
  proxyRoutes: z
    .array(
      z.object({
        prefix: z.string(),
        target: z.string(),
        rewrite: z.boolean().optional(),
      })
    )
    .optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "参数验证失败";
    throw createError({
      statusCode: 400,
      message: errorMsg,
    });
  }

  const {
    recordId,
    name,
    port = 3000,
    runCommand,
    proxyIp,
    proxyRoutes = [],
  } = parsed.data;

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const record = history.find((r) => r.id === recordId);

  if (!record) {
    throw createError({ statusCode: 404, message: "构建记录不存在" });
  }

  if (record.status !== "success") {
    throw createError({ statusCode: 400, message: "构建未成功，无法运行" });
  }

  const servers = await readConfig<ServerConfig[]>("server-configs", []);
  let server: ServerConfig | undefined;

  if (record.serverId) {
    server = servers.find((s) => s.id === record.serverId);
  } else if (record.tarTarget) {
    server = servers.find((s) => s.host === record.tarTarget);
  }

  if (!server) {
    throw createError({ statusCode: 404, message: "未找到对应的服务器配置" });
  }

  const ssh = await createSshHandle(server);
  try {
    const artifactName = `${record.tagName}.zip`;
    const isWindows = server.os === "windows";
    const pathSep = isWindows ? "\\" : "/";
    const artifactPath = `${record.tarPath}${pathSep}${artifactName}`;
    const deployDir = `${server.workDir}${pathSep}deploy${pathSep}${record.projectName}${pathSep}${record.tagName}`;
    const finalName = name || `${record.projectName}-${record.tagName}`;
    const finalPort = port;

    let checkCmd: string;
    let mkdirCmd: string;
    let unzipCmd: string;
    let findPackageCmd: string;

    if (isWindows) {
      checkCmd = `if exist "${artifactPath}" (echo exists) else (echo not_found)`;
      mkdirCmd = `if not exist "${deployDir}" mkdir "${deployDir}"`;
      unzipCmd = `powershell -Command "Expand-Archive -Path '${artifactPath}' -DestinationPath '${deployDir}' -Force"`;
      findPackageCmd = `powershell -Command "Get-ChildItem -Path '${deployDir}' -Recurse -Filter 'package.json' | Select-Object -First 1 -ExpandProperty DirectoryName"`;
    } else {
      checkCmd = `test -f "${artifactPath}" && echo "exists" || echo "not_found"`;
      mkdirCmd = `mkdir -p "${deployDir}"`;
      unzipCmd = `unzip -o "${artifactPath}" -d "${deployDir}"`;
      findPackageCmd = `find "${deployDir}" -name "package.json" -type f | head -1`;
    }

    const { stdout: checkArtifact } = await ssh.exec(checkCmd);

    if (checkArtifact.trim() !== "exists") {
      throw createError({
        statusCode: 404,
        message: `产物文件不存在: ${artifactPath}`,
      });
    }

    await ssh.exec(mkdirCmd);

    if (server.preDeployScript) {
      const preScript = server.preDeployScript.replace(
        /\{deployDir\}/g,
        deployDir
      );
      await ssh.exec(preScript);
    }

    await ssh.exec(unzipCmd);

    const { stdout: findPackageJson } = await ssh.exec(findPackageCmd);
    let packageDir: string;

    if (isWindows) {
      packageDir = findPackageJson.trim() || deployDir;
    } else {
      packageDir = findPackageJson.trim()
        ? findPackageJson.trim().replace("/package.json", "")
        : deployDir;
    }

    await ssh.exec(`cd "${packageDir}" && npm install --production`);

    let envVars = `PORT=${finalPort}`;
    if (proxyIp) {
      envVars += ` HTTP_PROXY=${proxyIp} HTTPS_PROXY=${proxyIp}`;
    }
    const serverEnvVars = parseEnvVars(server.envVars || "");
    if (serverEnvVars) {
      envVars += ` ${serverEnvVars}`;
    }

    const startScript = `cd "${packageDir}" && ${envVars} ${runCommand}`;
    const {
      stdout: pm2Result,
      code,
      stderr,
    } = await ssh.exec(
      `pm2 start --name "${finalName}" -- ${startScript} 2>&1`
    );

    if (code !== 0) {
      throw createError({
        statusCode: 500,
        message: `启动失败: ${stderr || pm2Result}`,
      });
    }

    if (proxyRoutes.length > 0) {
      const nginxConfig = generateNginxConfig(
        finalName,
        finalPort,
        proxyRoutes
      );
      const nginxPath = `/etc/nginx/conf.d/${finalName}.conf`;
      await ssh.exec(
        `echo '${nginxConfig}' | sudo tee ${nginxPath} && sudo nginx -s reload`
      );
    }

    if (server.postDeployScript) {
      const postScript = server.postDeployScript.replace(
        /\{deployDir\}/g,
        deployDir
      );
      await ssh.exec(postScript);
    }

    let healthCheckResult: { success: boolean; message: string } | undefined;
    if (server.healthCheckUrl) {
      const timeout = server.healthCheckTimeout || 30;
      try {
        const checkCmd = `curl -sf --connect-timeout ${timeout} "${server.healthCheckUrl}"`;
        const { code: healthCode } = await ssh.exec(checkCmd);
        healthCheckResult = {
          success: healthCode === 0,
          message: healthCode === 0 ? "健康检查通过" : "健康检查失败",
        };
      } catch (e) {
        healthCheckResult = { success: false, message: "健康检查异常" };
      }
    }

    return {
      success: true,
      message: "项目已启动",
      pm2Name: finalName,
      port: finalPort,
      deployDir: packageDir,
      proxyRoutes,
      healthCheck: healthCheckResult,
    };
  } finally {
    ssh.dispose();
  }
});
