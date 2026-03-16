import { readConfig } from "../../utils/storage";
import type { BuildRecord, BuildConfig } from "../../../types/build";
import { getGitlabConfig } from "../../utils/gitlab";
import archiver from "archiver";

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

const defaultBuildConfig: BuildConfig = {
  fileNamePattern: "{projectName}_{branch}_{tagName}",
  tagNamePattern: "{tagName}",
  createGitTag: false,
  buildTimeout: 60,
  historyRetentionDays: 30,
  notifyOnStart: false,
  notifyOnSuccess: true,
  notifyOnFailure: true,
  notifyOnCancel: false,
  sendArtifactToWecom: false,
  artifactOversizedAction: "skip",
  artifactSendRetryCount: 3,
};

function generateFileName(
  pattern: string,
  record: BuildRecord,
  suffix: string = ""
): string {
  const now = new Date();
  const date = now.toISOString().split("T")[0] || "";
  const time = now.toTimeString().split(" ")[0]?.replace(/:/g, "") || "";

  const safeProjectName = record.projectName.replace(
    /[^a-zA-Z0-9\u4e00-\u9fa5_-]/g,
    "_"
  );
  const safeBranch = record.branch.replace(/\//g, "_");

  let fileName = pattern
    .replace(/{projectName}/g, safeProjectName)
    .replace(/{branch}/g, safeBranch)
    .replace(/{tagName}/g, record.tagName)
    .replace(/{date}/g, date)
    .replace(/{time}/g, time);

  if (suffix) {
    fileName += suffix;
  }

  return `${fileName}.zip`;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const recordId = String(query.recordId || "");

  if (!recordId) {
    throw createError({ statusCode: 400, message: "recordId required" });
  }

  const history = await readConfig<BuildRecord[]>("build-history", []);
  const record = history.find((r) => r.id === recordId);

  if (!record) {
    throw createError({ statusCode: 404, message: "构建记录不存在" });
  }

  if (record.status !== "success") {
    throw createError({ statusCode: 400, message: "构建未成功，无法下载" });
  }

  const gitlabConfig = await getGitlabConfig(record.gitlabId);
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    throw createError({
      statusCode: 400,
      message: "GitLab 未配置",
    });
  }

  const jobsUrl = `${gitlabConfig.url}/api/v4/projects/${record.projectId}/pipelines/${record.pipelineId}/jobs`;
  const headers = { "PRIVATE-TOKEN": gitlabConfig.token };

  const jobsRes = await fetch(jobsUrl, { headers });
  if (!jobsRes.ok) {
    throw createError({
      statusCode: jobsRes.status,
      message: "获取 Pipeline Jobs 失败",
    });
  }

  const jobs = (await jobsRes.json()) as GitLabJob[];
  const jobsWithArtifacts = jobs.filter(
    (job) => job.artifacts && job.artifacts.length > 0
  );

  if (jobsWithArtifacts.length === 0) {
    throw createError({
      statusCode: 404,
      message: "该 Pipeline 没有任何产物",
    });
  }

  const buildConfig = await readConfig<BuildConfig>(
    "build-config",
    defaultBuildConfig
  );

  if (jobsWithArtifacts.length === 1) {
    const job = jobsWithArtifacts[0]!;
    const artifactUrl = `${gitlabConfig.url}/api/v4/projects/${record.projectId}/jobs/${job.id}/artifacts`;
    const artifactRes = await fetch(artifactUrl, { headers });

    if (!artifactRes.ok) {
      throw createError({
        statusCode: artifactRes.status,
        message: "下载产物失败",
      });
    }

    const buffer = Buffer.from(await artifactRes.arrayBuffer());
    const fileName = generateFileName(buildConfig.fileNamePattern, record);

    setResponseHeaders(event, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(
        fileName
      )}"`,
      "Content-Length": buffer.length.toString(),
    });

    return buffer;
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk) => chunks.push(chunk));

  const archivePromise = new Promise<Buffer>((resolve, reject) => {
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
  });

  for (const job of jobsWithArtifacts) {
    const artifactUrl = `${gitlabConfig.url}/api/v4/projects/${record.projectId}/jobs/${job.id}/artifacts`;
    const artifactRes = await fetch(artifactUrl, { headers });

    if (artifactRes.ok) {
      const buffer = Buffer.from(await artifactRes.arrayBuffer());
      const fileName = `${job.name}.zip`;
      archive.append(buffer, { name: fileName });
    }
  }

  archive.finalize();
  const mergedBuffer = await archivePromise;
  const fileName = generateFileName(
    buildConfig.fileNamePattern,
    record,
    "_artifacts"
  );

  setResponseHeaders(event, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${encodeURIComponent(
      fileName
    )}"`,
    "Content-Length": mergedBuffer.length.toString(),
  });

  return mergedBuffer;
});
