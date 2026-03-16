export type PipelineStatus =
  | "created"
  | "waiting_for_resource"
  | "preparing"
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "canceled"
  | "skipped"
  | "manual"
  | "scheduled";

export type JobStatus =
  | "created"
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "canceled"
  | "skipped"
  | "manual";

export interface BuildJob {
  id: number;
  name: string;
  stage: string;
  status: JobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  webUrl: string;
}

export interface BuildStage {
  name: string;
  status: JobStatus;
  jobs: BuildJob[];
}

export interface BuildParams {
  TAG_NAME: string;
  TAR_USERNAME: string;
  TAR_PASSWORD: string;
  TAR_TARGET: string;
  TAR_PATH: string;
  BUILD_COMMAND: string;
}

export interface BuildRecord {
  id: string;
  configId?: string;
  gitlabId?: string;
  projectId: number;
  projectName: string;
  branch: string;
  pipelineId: number;
  status: PipelineStatus;
  tagName: string;
  tarTarget: string;
  tarPath: string;
  buildCommand: string;
  serverId: string | null;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  triggeredBy: string;
  webUrl: string;
  stages?: BuildStage[];
  currentStage?: string;
}

export interface BuildHistory {
  projectId: number;
  branch: string;
  records: BuildRecord[];
}

export interface ProxyRoute {
  prefix: string;
  target: string;
  rewrite?: boolean;
}

export interface RunConfig {
  name: string;
  port: number;
  proxyIp?: string;
  proxyRoutes: ProxyRoute[];
}

export interface RunningProcess {
  name: string;
  status: "running" | "stopped";
  pid?: number;
  port?: number;
  startedAt?: string;
}

export interface BuildConfig {
  fileNamePattern: string;
  tagNamePattern: string;
  createGitTag: boolean;
  buildTimeout: number;
  historyRetentionDays: number;
  notifyOnStart: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyOnCancel: boolean;
  sendArtifactToWecom: boolean;
  artifactOversizedAction: "skip" | "link" | "notify";
  artifactSendRetryCount: number;
}
