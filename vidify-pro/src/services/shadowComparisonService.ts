import _ from "lodash";
import {
  PipelineShadowComparison,
  SceneAssetStatus,
  VideoProject,
} from "../types";
const approved = (p?: VideoProject | null) =>
  _.size(_.filter(p?.storyboard, { assetStatus: SceneAssetStatus.Approved }));
const duration = (p?: VideoProject | null) =>
  _.sumBy(p?.storyboard, "duration");
export const createShadowComparison = (
  b: VideoProject | null,
  c: VideoProject,
): PipelineShadowComparison => {
  const sceneCountDelta = _.size(c.storyboard) - _.size(b?.storyboard);
  const approvedSceneDelta = approved(c) - approved(b);
  const scriptContinuityDelta =
    (c.scriptQa?.continuityScore || 0) - (b?.scriptQa?.continuityScore || 0);
  const hookPayoffDelta =
    (c.scriptQa?.hookPayoffScore || 0) - (b?.scriptQa?.hookPayoffScore || 0);
  const durationDeltaSeconds = duration(c) - duration(b);
  const regressions = _.compact([
    approvedSceneDelta < 0 && "approved_scene_count_regressed",
    scriptContinuityDelta < 0 && "script_continuity_regressed",
    hookPayoffDelta < 0 && "hook_payoff_regressed",
    Math.abs(durationDeltaSeconds) > 30 && "duration_changed_materially",
  ]);
  return {
    baselineProjectId: b?.id,
    comparedAt: new Date().toISOString(),
    sceneCountDelta,
    approvedSceneDelta,
    scriptContinuityDelta,
    hookPayoffDelta,
    durationDeltaSeconds,
    estimatedCostUsd: c.benchmark?.estimatedCostUsd || 0,
    regressions,
    improved:
      _.isEmpty(regressions) &&
      _.some([
        approvedSceneDelta > 0,
        scriptContinuityDelta > 0,
        hookPayoffDelta > 0,
      ]),
  };
};
