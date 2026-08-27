import _ from "lodash";
import { AssetAcceptance, GenerateType, QaStatus, SceneAssetStatus, StoryboardScene } from "../types";

const EMERGENCY_NEUTRAL_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL1WQAAAABJRU5ErkJggg==";

export interface RenderCompletionFallbackResult {
  scenes: StoryboardScene[];
  repairedSceneIds: string[];
  usedNeutralFallback: boolean;
}

export interface RenderCompletionFallbackOptions {
  cinematicVideoOnly?: boolean;
}

export const ensureRenderReadySceneAssets = (sourceScenes: StoryboardScene[], options: RenderCompletionFallbackOptions = {}): RenderCompletionFallbackResult => {
  const scenes = _.cloneDeep(sourceScenes);
  const usableAssets = _.compact(_.map(scenes, "assetUrl"));
  const usedNeutralFallback = _.isEmpty(usableAssets);
  const repairedSceneIds: string[] = [];

  if (options.cinematicVideoOnly) {
    const usableFilmScenes = _.filter(scenes, scene => (
      !_.isEmpty(scene.assetUrl)
      && _.isEqual(scene.assetType, GenerateType.Video)
      && !_.startsWith(scene.assetError, "completion_fallback_")
    ));
    const removedSceneIds = _.map(_.differenceBy(scenes, usableFilmScenes, "id"), "id");
    return {
      scenes: usableFilmScenes,
      repairedSceneIds: removedSceneIds,
      usedNeutralFallback: _.isEmpty(usableFilmScenes),
    };
  }

  _.forEach(scenes, (scene, index) => {
    if (!_.isEmpty(scene.assetUrl)) return;
    const nearestScene = _.minBy(
      _.filter(scenes, candidate => !_.isEmpty(candidate.assetUrl)),
      candidate => Math.abs(_.findIndex(scenes, { id: candidate.id }) - index),
    );
    const fallbackAsset = nearestScene?.assetUrl || EMERGENCY_NEUTRAL_IMAGE;
    scene.assetUrl = fallbackAsset;
    scene.assetUrls = [fallbackAsset];
    scene.assetType = nearestScene?.assetType || GenerateType.Image;
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
