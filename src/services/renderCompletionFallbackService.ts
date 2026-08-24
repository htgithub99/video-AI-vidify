import _ from "lodash";
import { AssetAcceptance, GenerateType, QaStatus, SceneAssetStatus, StoryboardScene } from "../types";

// Used only after every remote image path has failed. A local renderable asset is
// preferable to aborting the entire paid/long-running production at the final step.
const EMERGENCY_NEUTRAL_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL1WQAAAABJRU5ErkJggg==";

export interface RenderCompletionFallbackResult {
  scenes: StoryboardScene[];
  repairedSceneIds: string[];
  usedNeutralFallback: boolean;
}

export const ensureRenderReadySceneAssets = (sourceScenes: StoryboardScene[]): RenderCompletionFallbackResult => {
  const scenes = _.cloneDeep(sourceScenes);
  const usableAssets = _.compact(_.map(scenes, "assetUrl"));
  const usedNeutralFallback = _.isEmpty(usableAssets);
  const repairedSceneIds: string[] = [];

  _.forEach(scenes, (scene, index) => {
    if (!_.isEmpty(scene.assetUrl)) return;
    const nearestScene = _.minBy(
      _.filter(scenes, candidate => !_.isEmpty(candidate.assetUrl)),
      candidate => Math.abs(_.findIndex(scenes, { id: candidate.id }) - index),
    );
    const fallbackAsset = nearestScene?.assetUrl || EMERGENCY_NEUTRAL_IMAGE;
    scene.assetUrl = fallbackAsset;
    scene.assetUrls = [fallbackAsset];
    scene.assetType = GenerateType.Image;
    scene.assetStatus = SceneAssetStatus.Generated;
    scene.qaStatus = QaStatus.Unavailable;
    scene.acceptance = AssetAcceptance.AcceptedWithWarning;
    scene.assetError = nearestScene
      ? "completion_fallback_reused_nearest_visual"
      : "completion_fallback_neutral_visual";
    repairedSceneIds.push(scene.id);
  });

  return { scenes, repairedSceneIds, usedNeutralFallback };
};
