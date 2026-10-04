import { SOURCE_TEXT_DURATION } from "../constants/sourceText";
import _ from "lodash";
import { SHADOW_COMPARISON_CONFIG } from "../constants/config";
import { PipelineShadowComparison, SceneAssetStatus, VideoProject } from "../types";
const getApprovedSceneCount = (project?: VideoProject | null): number => _.size(_.filter(project?.storyboard, { assetStatus: SceneAssetStatus.Approved }));
const getStoryboardDuration = (project?: VideoProject | null): number => _.sumBy(project?.storyboard, SOURCE_TEXT_DURATION);
export const createShadowComparison = (baseline: VideoProject | null, current: VideoProject): PipelineShadowComparison => {
  const sceneCountDelta = _.size(current.storyboard) - _.size(baseline?.storyboard);
  const approvedSceneDelta = getApprovedSceneCount(current) - getApprovedSceneCount(baseline);
  const scriptContinuityDelta = (current.scriptQa?.continuityScore || 0) - (baseline?.scriptQa?.continuityScore || 0);
  const hookPayoffDelta = (current.scriptQa?.hookPayoffScore || 0) - (baseline?.scriptQa?.hookPayoffScore || 0);
  const durationDeltaSeconds = getStoryboardDuration(current) - getStoryboardDuration(baseline);
  const regressions = _.compact([
    approvedSceneDelta < 0 && SHADOW_COMPARISON_CONFIG.APPROVED_SCENE_REGRESSION,
    scriptContinuityDelta < 0 && SHADOW_COMPARISON_CONFIG.SCRIPT_CONTINUITY_REGRESSION,
    hookPayoffDelta < 0 && SHADOW_COMPARISON_CONFIG.HOOK_PAYOFF_REGRESSION,
    Math.abs(durationDeltaSeconds) > SHADOW_COMPARISON_CONFIG.MATERIAL_DURATION_DELTA_SECONDS && SHADOW_COMPARISON_CONFIG.MATERIAL_DURATION_CHANGE,
  ]);
  const improved = _.isEmpty(regressions) && _.some([approvedSceneDelta > 0, scriptContinuityDelta > 0, hookPayoffDelta > 0]);
  return {
    baselineProjectId: baseline?.id,
    comparedAt: new Date().toISOString(),
    sceneCountDelta,
    approvedSceneDelta,
    scriptContinuityDelta,
    hookPayoffDelta,
    durationDeltaSeconds,
    estimatedCostUsd: current.benchmark?.estimatedCostUsd || 0,
    regressions,
    improved,
  };
};
