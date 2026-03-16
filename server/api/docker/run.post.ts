import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";

const runSchema = z.object({
  serverId: z.string().min(1, "服务器ID不能为空"),
  name: z.string().min(1, "容器名称不能为空"),
  image: z.string().min(1, "镜像名称不能为空"),
  imageId: z.string().optional(),
  ports: z
    .array(
      z.object({
        host: z.number(),
        container: z.number(),
      })
    )
    .optional(),
  volumes: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  nginxConfig: z.string().optional(),
  restartPolicy: z
    .enum(["always", "unless-stopped", "on-failure", "no"])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = runSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const config = parsed.data;
  const server = await getServerConfig(config.serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    const isWindows = server.os === "windows";

    if (!config.imageId) {
      const checkImageCmd = isWindows
        ? `docker images -q ${config.image}`
        : `docker images -q ${config.image} 2>/dev/null`;

      const { stdout: localImageId } = await ssh.exec(checkImageCmd);

      if (!localImageId.trim()) {
        const pullCmd = `docker pull ${config.image}`;
        const { code: pullCode, stderr: pullErr } = await ssh.exec(pullCmd);

        if (pullCode !== 0) {
          throw createError({
            statusCode: 500,
            message: `拉取镜像失败: ${pullErr}`,
          });
        }
      }
    }

    const existingCmd = isWindows
      ? `docker ps -a --filter "name=${config.name}" --format "{{.Names}}"`
      : `docker ps -a --filter "name=${config.name}" --format "{{.Names}}" 2>/dev/null`;

    const { stdout: existing } = await ssh.exec(existingCmd);
    if (existing.trim() === config.name) {
      const removeCmd = `docker rm -f ${config.name}`;
      await ssh.exec(removeCmd);
    }

    const runArgs: string[] = [];

    runArgs.push("-d");
    runArgs.push(`--name ${config.name}`);

    runArgs.push(`--restart ${config.restartPolicy || "always"}`);

    if (config.ports && config.ports.length > 0) {
      config.ports.forEach((p) => {
        runArgs.push(`-p ${p.host}:${p.container}`);
      });
    }

    if (config.volumes && config.volumes.length > 0) {
      config.volumes.forEach((v) => {
        runArgs.push(`-v ${v}`);
      });
    }

    if (config.env && Object.keys(config.env).length > 0) {
      Object.entries(config.env).forEach(([key, value]) => {
        runArgs.push(`-e ${key}="${value}"`);
      });
    }

    runArgs.push(config.image);

    const runCmd = `docker run ${runArgs.join(" ")}`;
    const {
      stdout: containerId,
      code: runCode,
      stderr: runErr,
    } = await ssh.exec(runCmd);

    if (runCode !== 0) {
      throw createError({
        statusCode: 500,
        message: `创建容器失败: ${runErr}`,
      });
    }

    if (config.nginxConfig && config.nginxConfig.trim()) {
      try {
        await writeNginxConfig(ssh, config.name, config.nginxConfig, isWindows);
      } catch (proxyErr) {
        console.error("Nginx 配置失败:", proxyErr);
      }
    }

    return {
      success: true,
      message: "容器运行成功",
      containerId: containerId.trim(),
    };
  } catch (err) {
    if ((err as any).statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: `运行失败: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});

async function writeNginxConfig(
  ssh: any,
  containerName: string,
  nginxConfig: string,
  isWindows: boolean
) {
  const configPath = isWindows
    ? `C:\\nginx\\conf\\conf.d\\${containerName}.conf`
    : `/etc/nginx/conf.d/${containerName}.conf`;

  let writeCmd: string;
  if (isWindows) {
    const base64Content = Buffer.from(nginxConfig).toString("base64");
    writeCmd = `powershell -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${base64Content}')) | Set-Content -Path '${configPath}' -Encoding UTF8"`;
  } else {
    const base64Content = Buffer.from(nginxConfig).toString("base64");
    writeCmd = `echo '${base64Content}' | base64 -d | sudo tee ${configPath}`;
  }

  await ssh.exec(writeCmd);

  const reloadCmd = isWindows
    ? "nginx -s reload"
    : "sudo nginx -s reload || sudo systemctl reload nginx";

  await ssh.exec(reloadCmd);
}
