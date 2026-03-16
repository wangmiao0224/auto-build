import { z } from "zod";
import { getServerConfig, createSshHandle } from "~/server/utils/ssh";
import { readConfig } from "~/server/utils/storage";
import { getGitlabConfig } from "~/server/utils/gitlab";
import type { BuildRecord } from "~/types/build";

interface GitLabJob {
  id: number;
  name: string;
  stage: string;
  status: string;
  artifacts: Array<{
    file_type: string;
    size: number;
    filename: string;
  }>;
}

const runArtifactSchema = z.object({
  serverId: z.string().min(1, "服务器ID不能为空"),
  name: z.string().min(1, "容器名称不能为空"),
  image: z.string().min(1, "镜像名称不能为空"),
  imageId: z.string().optional(),
  buildId: z.string().min(1, "构建ID不能为空"),
  ports: z
    .array(
      z.object({
        host: z.number(),
        container: z.number(),
      })
    )
    .optional(),
  env: z.record(z.string(), z.string()).optional(),
  nginxConfig: z.string().optional(),
  restartPolicy: z
    .enum(["always", "unless-stopped", "on-failure", "no"])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const parsed = runArtifactSchema.safeParse(body);

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

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const buildRecord = history.find((r) => r.id === config.buildId);

  if (!buildRecord) {
    throw createError({ statusCode: 404, message: "构建记录不存在" });
  }

  const gitlabConfig = await getGitlabConfig(buildRecord.gitlabId);
  if (!gitlabConfig) {
    throw createError({ statusCode: 404, message: "GitLab 配置不存在" });
  }

  const headers: Record<string, string> = {
    "PRIVATE-TOKEN": gitlabConfig.token,
  };

  const jobsUrl = `${gitlabConfig.url}/api/v4/projects/${buildRecord.projectId}/pipelines/${buildRecord.pipelineId}/jobs`;
  const jobsRes = await fetch(jobsUrl, { headers });

  if (!jobsRes.ok) {
    throw createError({
      statusCode: jobsRes.status,
      message: "获取构建任务失败",
    });
  }

  const jobs = (await jobsRes.json()) as GitLabJob[];
  const jobsWithArtifacts = jobs.filter(
    (job) => job.artifacts && job.artifacts.length > 0
  );

  if (jobsWithArtifacts.length === 0) {
    throw createError({
      statusCode: 404,
      message: "该构建没有产物",
    });
  }

  const job = jobsWithArtifacts[0]!;
  const artifactUrl = `${gitlabConfig.url}/api/v4/projects/${buildRecord.projectId}/jobs/${job.id}/artifacts`;

  const isWindows = server.os === "windows";

  const ssh = await createSshHandle(server);
  try {
    const dockerCmd = isWindows
      ? '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"'
      : "docker";

    const { code: dockerCheckCode, stderr: dockerCheckErr } = await ssh.exec(
      `${dockerCmd} version`
    );
    if (dockerCheckCode !== 0) {
      throw createError({
        statusCode: 500,
        message: `Docker 未安装或未运行: ${
          dockerCheckErr || "请确保 Docker Desktop 已启动"
        }`,
      });
    }

    const workDir = isWindows ? "C:\\deploy" : "/tmp/deploy";
    const artifactPath = `${workDir}/${config.buildId}.zip`;

    const mkdirCmd = isWindows
      ? `if not exist "${workDir}" mkdir "${workDir}"`
      : `mkdir -p ${workDir}`;
    await ssh.exec(mkdirCmd);

    const downloadCmd = isWindows
      ? `curl -L -o "${artifactPath}" -H "PRIVATE-TOKEN: ${gitlabConfig.token}" "${artifactUrl}"`
      : `curl -L -o ${artifactPath} -H "PRIVATE-TOKEN: ${gitlabConfig.token}" "${artifactUrl}"`;

    const { code: downloadCode, stderr: downloadErr } = await ssh.exec(
      downloadCmd
    );

    if (downloadCode !== 0) {
      throw createError({
        statusCode: 500,
        message: `下载产物失败: ${downloadErr}`,
      });
    }

    const safeName =
      config.name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "") || "app";

    const extractDir = `${workDir}/${safeName}`;
    const extractCmd = isWindows
      ? `if not exist "${extractDir}" mkdir "${extractDir}" && powershell -Command "Expand-Archive -Path '${artifactPath}' -DestinationPath '${extractDir}' -Force"`
      : `mkdir -p ${extractDir} && unzip -o ${artifactPath} -d ${extractDir}`;

    const { code: extractCode, stderr: extractErr } = await ssh.exec(
      extractCmd
    );

    if (extractCode !== 0) {
      throw createError({
        statusCode: 500,
        message: `解压产物失败: ${extractErr}`,
      });
    }

    const existingCmd = isWindows
      ? `${dockerCmd} ps -a --filter "name=${safeName}" --format "{{.Names}}"`
      : `${dockerCmd} ps -a --filter "name=${safeName}" --format "{{.Names}}" 2>/dev/null`;

    const { stdout: existing } = await ssh.exec(existingCmd);
    if (existing.trim() === safeName) {
      const removeCmd = `${dockerCmd} rm -f ${safeName}`;
      await ssh.exec(removeCmd);
    }

    if (!config.imageId) {
      const checkImageCmd = isWindows
        ? `${dockerCmd} images -q ${config.image}`
        : `${dockerCmd} images -q ${config.image} 2>/dev/null`;

      const { stdout: localImageId } = await ssh.exec(checkImageCmd);

      if (!localImageId.trim()) {
        const pullCmd = `${dockerCmd} pull ${config.image}`;
        const { code: pullCode, stderr: pullErr } = await ssh.exec(pullCmd);

        if (pullCode !== 0) {
          throw createError({
            statusCode: 500,
            message: `拉取镜像失败: ${pullErr}`,
          });
        }
      }
    }

    const runArgs: string[] = [];

    runArgs.push("-d");
    runArgs.push(`--name ${safeName}`);
    runArgs.push(`--restart ${config.restartPolicy || "always"}`);

    if (config.ports && config.ports.length > 0) {
      config.ports.forEach((p) => {
        runArgs.push(`-p ${p.host}:${p.container}`);
      });
    }

    if (config.env && Object.keys(config.env).length > 0) {
      Object.entries(config.env).forEach(([key, value]) => {
        runArgs.push(`-e ${key}="${value}"`);
      });
    }

    runArgs.push(config.image);

    const runCmd = `${dockerCmd} run ${runArgs.join(" ")}`;
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

    const copyCmd = isWindows
      ? `${dockerCmd} cp "${extractDir}\\." ${safeName}:/app`
      : `${dockerCmd} cp ${extractDir}/. ${safeName}:/app`;
    const { code: copyCode, stderr: copyErr } = await ssh.exec(copyCmd);

    if (copyCode !== 0) {
      await ssh.exec(`${dockerCmd} rm -f ${safeName}`);
      throw createError({
        statusCode: 500,
        message: `复制文件到容器失败: ${copyErr}`,
      });
    }

    const restartCmd = `${dockerCmd} restart ${safeName}`;
    await ssh.exec(restartCmd);

    if (config.nginxConfig && config.nginxConfig.trim()) {
      try {
        await writeNginxConfig(ssh, safeName, config.nginxConfig, isWindows);
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
