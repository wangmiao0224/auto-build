import { readConfig, writeConfig } from "../../utils/storage";
import type { BuildConfig } from "../../../types/build";

const defaultConfig: BuildConfig = {
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

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    const config = await readConfig<BuildConfig>("build-config", defaultConfig);
    return config;
  }

  if (method === "POST") {
    const body = await readBody(event);
    const config: BuildConfig = {
      fileNamePattern: body.fileNamePattern || defaultConfig.fileNamePattern,
      tagNamePattern: body.tagNamePattern || defaultConfig.tagNamePattern,
      createGitTag: body.createGitTag ?? false,
      buildTimeout: body.buildTimeout ?? 60,
      historyRetentionDays: body.historyRetentionDays ?? 30,
      notifyOnStart: body.notifyOnStart ?? false,
      notifyOnSuccess: body.notifyOnSuccess ?? true,
      notifyOnFailure: body.notifyOnFailure ?? true,
      notifyOnCancel: body.notifyOnCancel ?? false,
      sendArtifactToWecom: body.sendArtifactToWecom ?? false,
      artifactOversizedAction: body.artifactOversizedAction ?? "skip",
      artifactSendRetryCount: body.artifactSendRetryCount ?? 3,
    };
    await writeConfig("build-config", config);
    return { success: true };
  }

  throw createError({ statusCode: 405, message: "Method not allowed" });
});
