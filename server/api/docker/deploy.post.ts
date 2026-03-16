import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";
import type { DockerDeployConfig, DockerDeployResult } from "~/types/server";

const deploySchema = z.object({
  name: z.string().min(1, "容器名称不能为空"),
  type: z.enum(["static", "nodejs", "custom"]),
  serverId: z.string().min(1, "服务器ID不能为空"),
  artifactPath: z.string().optional(),
  port: z.number().min(1).max(65535),
  envVars: z.record(z.string()).optional(),
  image: z.string().optional(),
  buildContext: z.string().optional(),
  dockerfile: z.string().optional(),
  volumes: z.array(z.string()).optional(),
  restartPolicy: z.enum(["always", "unless-stopped", "on-failure", "no"]).optional(),
});

function generateNginxConf(): string {
  return `
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
`.trim();
}

function generateDockerfileForNodejs(): string {
  return `
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 3000
CMD ["npm", "start"]
`.trim();
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = deploySchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || "参数验证失败",
    });
  }

  const config = parsed.data as DockerDeployConfig;
  const server = await getServerConfig(config.serverId);

  if (!server) {
    throw createError({ statusCode: 404, message: "服务器不存在" });
  }

  const ssh = await createSshHandle(server);
  try {
    const isWindows = server.os === "windows";
    const containerName = config.name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    const restartPolicy = config.restartPolicy || "always";
    const envFlags = config.envVars
      ? Object.entries(config.envVars)
          .map(([k, v]) => `-e ${k}="${v}"`)
          .join(" ")
      : "";

    const { stdout: existingContainer } = await ssh.exec(
      `docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`
    );

    if (existingContainer.trim() === containerName) {
      const confirmRemove = await ssh.exec(`docker rm -f ${containerName}`);
      if (confirmRemove.code !== 0) {
        throw createError({ statusCode: 500, message: "移除旧容器失败" });
      }
    }

    if (config.type === "static") {
      if (!config.artifactPath) {
        throw createError({ statusCode: 400, message: "静态部署需要指定产物路径" });
      }

      const workDir = server.workDir || (isWindows ? "C:\\deploy" : "/tmp/deploy");
      const deployDir = isWindows
        ? `${workDir}\\${containerName}`
        : `${workDir}/${containerName}`;

      await ssh.exec(isWindows ? `mkdir "${deployDir}"` : `mkdir -p ${deployDir}`);

      const nginxConf = generateNginxConf();
      const nginxConfPath = isWindows
        ? `${deployDir}\\nginx.conf`
        : `${deployDir}/nginx.conf`;

      if (isWindows) {
        await ssh.exec(
          `echo '${nginxConf.replace(/'/g, "''")}' > "${nginxConfPath}"`
        );
      } else {
        await ssh.exec(`cat > ${nginxConfPath} << 'NGINX_EOF'\n${nginxConf}\nNGINX_EOF`);
      }

      const volumeMounts = [
        `-v "${config.artifactPath}:/usr/share/nginx/html:ro"`,
        `-v "${nginxConfPath}:/etc/nginx/conf.d/default.conf:ro"`,
        ...(config.volumes || []).map((v) => `-v "${v}"`),
      ].join(" ");

      const runCmd = `docker run -d --name ${containerName} -p ${config.port}:80 ${volumeMounts} --restart ${restartPolicy} nginx:alpine`;

      const { code, stderr } = await ssh.exec(runCmd);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: stderr || "启动容器失败" });
      }

      return {
        success: true,
        message: `静态站点部署成功，访问地址: http://<服务器IP>:${config.port}`,
      } as DockerDeployResult;
    }

    if (config.type === "nodejs") {
      if (!config.artifactPath) {
        throw createError({ statusCode: 400, message: "Node.js 部署需要指定产物路径" });
      }

      const workDir = server.workDir || (isWindows ? "C:\\deploy" : "/tmp/deploy");
      const deployDir = isWindows
        ? `${workDir}\\${containerName}`
        : `${workDir}/${containerName}`;

      await ssh.exec(isWindows ? `mkdir "${deployDir}"` : `mkdir -p ${deployDir}`);

      const dockerfile = config.dockerfile || generateDockerfileForNodejs();
      const dockerfilePath = isWindows
        ? `${deployDir}\\Dockerfile`
        : `${deployDir}/Dockerfile`;

      if (isWindows) {
        await ssh.exec(
          `echo '${dockerfile.replace(/'/g, "''")}' > "${dockerfilePath}"`
        );
      } else {
        await ssh.exec(`cat > ${dockerfilePath} << 'DOCKERFILE_EOF'\n${dockerfile}\nDOCKERFILE_EOF`);
      }

      const buildCmd = `docker build -t ${containerName}:latest "${config.artifactPath}"`;
      const { code: buildCode, stderr: buildErr } = await ssh.exec(buildCmd);

      if (buildCode !== 0) {
        throw createError({ statusCode: 500, message: `构建镜像失败: ${buildErr}` });
      }

      const volumeMounts = (config.volumes || [])
        .map((v) => `-v "${v}"`)
        .join(" ");

      const runCmd = `docker run -d --name ${containerName} -p ${config.port}:3000 ${envFlags} ${volumeMounts} --restart ${restartPolicy} ${containerName}:latest`;

      const { code: runCode, stderr: runErr } = await ssh.exec(runCmd);

      if (runCode !== 0) {
        throw createError({ statusCode: 500, message: runErr || "启动容器失败" });
      }

      return {
        success: true,
        message: `Node.js 服务部署成功，访问地址: http://<服务器IP>:${config.port}`,
      } as DockerDeployResult;
    }

    if (config.type === "custom") {
      if (!config.image) {
        throw createError({ statusCode: 400, message: "自定义部署需要指定镜像名称" });
      }

      const volumeMounts = (config.volumes || [])
        .map((v) => `-v "${v}"`)
        .join(" ");

      const runCmd = `docker run -d --name ${containerName} -p ${config.port}:${config.port} ${envFlags} ${volumeMounts} --restart ${restartPolicy} ${config.image}`;

      const { code, stderr } = await ssh.exec(runCmd);

      if (code !== 0) {
        throw createError({ statusCode: 500, message: stderr || "启动容器失败" });
      }

      return {
        success: true,
        message: `容器启动成功，访问地址: http://<服务器IP>:${config.port}`,
      } as DockerDeployResult;
    }

    throw createError({ statusCode: 400, message: "未知的部署类型" });
  } catch (err) {
    if ((err as any).statusCode) throw err;
    throw createError({
      statusCode: 500,
      message: `部署失败: ${(err as Error).message}`,
    });
  } finally {
    ssh.dispose();
  }
});
