import _ from "lodash";
import { CharacterConfig, GenerateType, StoryboardScene, VideoProject } from "../types";

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
): StoryboardScene[] => _.map(_.defaultTo(scenes, []), (scene) => (
  predicate(scene) ? clearSceneVisualAsset(scene) : scene
));

const clearFinalRenderState = (project: VideoProject): VideoProject => ({
  ...project,
  renderedVideoUrl: undefined,
  finalQc: undefined,
  finalMultimodalQa: undefined,
  manualReviewItems: [],
});

const cleanCharacterVisualConfig = (
  characters: CharacterConfig[] | undefined,
): CharacterConfig[] => _.map(_.defaultTo(characters, []), (character) => ({
  ..._.omit(character, ["referenceViews", "referenceApproved"]),
  images: [],
  extracted: false,
})) as CharacterConfig[];

const cleanThumbnailOutputs = (thumbnails: VideoProject["thumbnails"]) => (
  _.map(_.defaultTo(thumbnails, []), (thumb) => ({
    ...thumb,
    imageUrl: undefined,
    generationPrompt: undefined,
    generationStatus: undefined,
    generationError: undefined,
  }))
);

export const clearProjectImageOutputs = (project: VideoProject): VideoProject => clearFinalRenderState({
  ...project,
  storyboard: clearMatchingSceneAssets(
    project.storyboard,
    (scene) => !_.isEqual(scene.assetType, GenerateType.Video),
  ),
  thumbnails: cleanThumbnailOutputs(project.thumbnails),
  visualConfig: {
    ...project.visualConfig,
    characters: cleanCharacterVisualConfig(project.visualConfig?.characters),
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
    (scene) => _.isEqual(scene.assetType, GenerateType.Video),
  ),
});

export const clearAllProjectVisualOutputs = (project: VideoProject): VideoProject => (
  clearProjectVideoOutputs(clearProjectImageOutputs(project))
);
