import { getGitlabClient, handleGitlabError } from "../../../utils/gitlab";
import { readConfig, writeConfig } from "../../../utils/storage";
import type {
  BuildRecord,
  BuildStage,
  BuildJob,
} from "../../../../types/build";

export default defineEventHandler(async (event) => {
  const pipelineId = parseInt(getRouterParam(event, "pipelineId") as string);
  const query = getQuery(event);
  const projectId = parseInt(query.projectId as string);
  const gitlabId = query.gitlabId as string | undefined;

  try {
    const gl = await getGitlabClient(gitlabId);
    const pipeline = await gl.Pipelines.show(projectId, pipelineId);

    const jobs = await gl.Jobs.all(projectId, { pipelineId });
    const stages = groupJobsByStage(jobs as any[]);

    const history = await readConfig<BuildRecord[]>("build-history", []);
    const idx = history.findIndex((r) => r.pipelineId === pipelineId);
    if (idx !== -1 && history[idx]) {
      history[idx].status = pipeline.status as any;
      history[idx].finishedAt = (pipeline as any).finished_at || null;
      history[idx].duration = (pipeline as any).duration || null;
      history[idx].stages = stages;
      history[idx].currentStage = getCurrentStage(stages);
      await writeConfig("build-history", history);
    }

    return {
      pipelineId,
      status: pipeline.status,
      finishedAt: (pipeline as any).finished_at,
      duration: (pipeline as any).duration,
      webUrl: (pipeline as any).web_url,
      stages,
      currentStage: getCurrentStage(stages),
    };
  } catch (err) {
    handleGitlabError(err);
  }
});

function groupJobsByStage(jobs: any[]): BuildStage[] {
  const stageMap = new Map<string, BuildJob[]>();

  for (const job of jobs) {
    const stageName = job.stage;
    if (!stageMap.has(stageName)) {
      stageMap.set(stageName, []);
    }
    stageMap.get(stageName)!.push({
      id: job.id,
      name: job.name,
      stage: job.stage,
      status: job.status,
      startedAt: job.started_at || null,
      finishedAt: job.finished_at || null,
      duration: job.duration || null,
      webUrl: job.web_url,
    });
  }

  const stages: BuildStage[] = [];
  for (const [name, stageJobs] of stageMap) {
    const status = getStageStatus(stageJobs);
    stages.push({
      name,
      status,
      jobs: stageJobs,
    });
  }

  return stages;
}

function getStageStatus(jobs: BuildJob[]): BuildJob["status"] {
  if (jobs.some((j) => j.status === "failed")) return "failed";
  if (jobs.some((j) => j.status === "running")) return "running";
  if (jobs.every((j) => j.status === "success")) return "success";
  if (jobs.some((j) => j.status === "canceled")) return "canceled";
  if (jobs.some((j) => j.status === "skipped")) return "skipped";
  if (jobs.some((j) => j.status === "manual")) return "manual";
  if (jobs.some((j) => j.status === "pending")) return "pending";
  return "created";
}

function getCurrentStage(stages: BuildStage[]): string | undefined {
  const running = stages.find((s) => s.status === "running");
  if (running) return running.name;
  const pending = stages.find((s) => s.status === "pending");
  if (pending) return pending.name;
  return undefined;
}
