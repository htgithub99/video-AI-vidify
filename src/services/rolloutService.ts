import { SOURCE_TEXT_ACTUALCOSTUSD, SOURCE_TEXT_ADVISORY, SOURCE_TEXT_CANARY, SOURCE_TEXT_ENV_VITE_PIPELINE_CANARY_PERCENT, SOURCE_TEXT_ENV_VITE_PIPELINE_SHADOW_MODE, SOURCE_TEXT_ESTIMATEDCOSTUSD_2, SOURCE_TEXT_FAILED, SOURCE_TEXT_LATENCYMS, SOURCE_TEXT_REJECTED, SOURCE_TEXT_STABLE, SOURCE_TEXT_TRUE } from "../constants/sourceText";
import _ from "lodash";
import { PipelineBenchmark, PipelineRolloutConfig, VideoProject } from "../types";
const percentage = (id: string): number => _.sum(_.map(id, (character) => character.charCodeAt(0))) % 100;
export const resolveRolloutConfig = (projectId: string): PipelineRolloutConfig => {
  const canaryPercent = _.clamp(_.toInteger(_.get(import.meta, SOURCE_TEXT_ENV_VITE_PIPELINE_CANARY_PERCENT, 10)), 0, 100);
  const canaryEnabled = percentage(projectId) < canaryPercent;
  return { releaseChannel: canaryEnabled ? SOURCE_TEXT_CANARY : SOURCE_TEXT_STABLE, canaryEnabled, shadowMode: _.isEqual(_.get(import.meta, SOURCE_TEXT_ENV_VITE_PIPELINE_SHADOW_MODE), SOURCE_TEXT_TRUE), qaMode: SOURCE_TEXT_ADVISORY, maxEditorialRepairAttempts: 1, flags: { creativeBrief: true, scriptQa: true, visualQa: true, audioQa: true, thumbnailQa: true, finalQc: true } };
};
export const createPipelineBenchmark = (project: VideoProject, startedAt: number): PipelineBenchmark => ({
  totalLatencyMs: Date.now() - startedAt,
  aiLatencyMs: _.sumBy(project.aiMetrics, SOURCE_TEXT_LATENCYMS),
  estimatedCostUsd: _.round(_.sumBy(project.aiMetrics, SOURCE_TEXT_ESTIMATEDCOSTUSD_2), 6),
  actualCostUsd: _.round(_.sumBy(project.aiMetrics, SOURCE_TEXT_ACTUALCOSTUSD), 6),
  retryCount: _.sumBy(project.storyboard, (scene) => _.size(scene.assetRevisions) - 1),
  rejectCount: _.size(_.filter(project.storyboard, (scene) => scene.assetStatus === SOURCE_TEXT_REJECTED || scene.assetStatus === SOURCE_TEXT_FAILED)),
  generatedAt: new Date().toISOString(),
});
