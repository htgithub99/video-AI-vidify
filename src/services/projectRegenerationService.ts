import _ from "lodash";
import { GenerateType, StoryboardScene, VideoProject } from "../types";

export const clearSceneVisualAsset = (scene: StoryboardScene): StoryboardScene => ({
  ...scene,
  generationPrompt: undefined,
  assetType: undefined,
  assetUrl: undefined,
  assetUrls: [],
  assetStatus: undefined,
  assetError: undefined,
  assetRevisionId: undefined,
  assetRevisions: [],
  dependencyHash: undefined,
});

const clearMatchingSceneAssets = (
  scenes: StoryboardScene[] | undefined,
  predicate: (scene: StoryboardScene) => boolean,
): StoryboardScene[] => _.map(_.defaultTo(scenes, []), scene => (
  predicate(scene) ? clearSceneVisualAsset(scene) : scene
));

const clearFinalRenderState = (project: VideoProject): VideoProject => ({
  ...project,
  renderedVideoUrl: undefined,
  finalQc: undefined,
  finalMultimodalQa: undefined,
  manualReviewItems: [],
});

export const clearProjectImageOutputs = (project: VideoProject): VideoProject => clearFinalRenderState({
  ...project,
  storyboard: clearMatchingSceneAssets(
    project.storyboard,
    scene => !_.isEqual(scene.assetType, GenerateType.Video),
  ),
  thumbnails: [],
  visualConfig: {
    ...project.visualConfig,
    characters: _.map(_.defaultTo(project.visualConfig?.characters, []), character => {
      const cleanedCharacter = {
        ...character,
        images: [],
        extracted: false,
      };
      _.unset(cleanedCharacter, "referenceViews");
      _.unset(cleanedCharacter, "referenceApproved");
      return cleanedCharacter;
    }),
    characterImages: [],
    characterExtracted: false,
  },
  imagePromptQa: undefined,
  dependencyHashes: {
    ...project.dependencyHashes,
    storyboard: undefined,
    thumbnails: undefined,
  },
});

export const clearProjectVideoOutputs = (project: VideoProject): VideoProject => clearFinalRenderState({
  ...project,
  storyboard: clearMatchingSceneAssets(
    project.storyboard,
    scene => _.isEqual(scene.assetType, GenerateType.Video),
  ),
});

export const clearAllProjectVisualOutputs = (project: VideoProject): VideoProject => (
  clearProjectVideoOutputs(clearProjectImageOutputs(project))
);
