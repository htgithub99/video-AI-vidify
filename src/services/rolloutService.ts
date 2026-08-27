import _ from "lodash";
import { PipelineBenchmark, PipelineRolloutConfig, VideoProject } from "../types";
const percentage = (id: string): number => _.sum(_.map(id, (character) => character.charCodeAt(0))) % 100;
export const resolveRolloutConfig = (projectId: string): PipelineRolloutConfig => {
  const canaryPercent = _.clamp(_.toInteger(_.get(import.meta, "env.VITE_PIPELINE_CANARY_PERCENT", 10)), 0, 100);
  const canaryEnabled = percentage(projectId) < canaryPercent;
  return {
    releaseChannel: canaryEnabled ? "canary" : "stable",
    canaryEnabled,
    shadowMode: _.isEqual(_.get(import.meta, "env.VITE_PIPELINE_SHADOW_MODE"), "true"),
    qaMode: "advisory",
    maxEditorialRepairAttempts: 1,
    flags: { creativeBrief: true, scriptQa: true, visualQa: true, audioQa: true, thumbnailQa: true, finalQc: true },
  };
};
export const createPipelineBenchmark = (project: VideoProject, startedAt: number): PipelineBenchmark => ({
  totalLatencyMs: Date.now() - startedAt,
  aiLatencyMs: _.sumBy(project.aiMetrics, "latencyMs"),
  estimatedCostUsd: _.round(_.sumBy(project.aiMetrics, "estimatedCostUsd"), 6),
  actualCostUsd: _.round(_.sumBy(project.aiMetrics, "actualCostUsd"), 6),
  retryCount: _.sumBy(project.storyboard, (scene) => _.size(scene.assetRevisions) - 1),
  rejectCount: _.size(_.filter(project.storyboard, (scene) => scene.assetStatus === "rejected" || scene.assetStatus === "failed")),
  generatedAt: new Date().toISOString(),
});
