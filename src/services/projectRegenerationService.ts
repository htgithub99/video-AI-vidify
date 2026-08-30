import _ from "lodash";
import { CharacterConfig, GenerateType, StoryboardScene, VideoProject } from "../types";
import { API_ROUTES, HTTP_METHODS, API_HEADERS, STORAGE_KEYS, REFACTOR_CONSTANTS } from "../constants";
import { REGENERATION_TARGET, PROJECT_ASSET_GROUP, AUTO_GENERATOR_CONSTANTS } from "../constants/config";
import { storageUtils } from "../lib/storage";

export const clearSceneVisualAsset = (scene: StoryboardScene): StoryboardScene => ({
  ...scene,
  prompt: "",
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

const clearMatchingSceneAssets = (scenes: StoryboardScene[] | undefined, predicate: (scene: StoryboardScene) => boolean): StoryboardScene[] =>
  _.map(_.defaultTo(scenes, []), (scene) => (predicate(scene) ? clearSceneVisualAsset(scene) : scene));

const clearFinalRenderState = (project: VideoProject): VideoProject => ({
  ...project,
  renderedVideoUrl: undefined,
  finalQc: undefined,
  finalMultimodalQa: undefined,
  manualReviewItems: [],
});

const cleanCharacterVisualConfig = (characters: CharacterConfig[] | undefined): CharacterConfig[] =>
  _.map(_.defaultTo(characters, []), (character) => ({
    ..._.omit(character, ["referenceViews", "referenceApproved"]),
    images: [],
    extracted: false,
  })) as CharacterConfig[];

export const clearProjectImageOutputs = (project: VideoProject): VideoProject =>
  clearFinalRenderState({
    ...project,
    storyboard: clearMatchingSceneAssets(project.storyboard, (scene) => !_.isEqual(scene.assetType, GenerateType.Video)),
    thumbnails: [],
    visualConfig: {
      ...project.visualConfig,
      referencePrompt: project.visualConfig?.style || "",
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

export const clearProjectVideoOutputs = (project: VideoProject): VideoProject =>
  clearFinalRenderState({
    ...project,
    storyboard: clearMatchingSceneAssets(project.storyboard, (scene) => _.isEqual(scene.assetType, GenerateType.Video)),
  });

export const clearAllProjectVisualOutputs = (project: VideoProject): VideoProject => clearProjectVideoOutputs(clearProjectImageOutputs(project));

export const deleteProjectRegenerationAssets = async (projectId: string, target: string): Promise<boolean> => {
  const groups = _.isEqual(target, REGENERATION_TARGET.VOICE)
    ? [PROJECT_ASSET_GROUP.VOICES, PROJECT_ASSET_GROUP.VIDEOS]
    : _.isEqual(target, REGENERATION_TARGET.IMAGES)
      ? [PROJECT_ASSET_GROUP.VISUALS]
      : [PROJECT_ASSET_GROUP.VIDEOS];

  for (const group of groups) {
    const response = await fetch(`${API_ROUTES.PIPELINE_PROJECT_ASSETS}/${projectId}/${group}`, {
      method: HTTP_METHODS.DELETE,
      headers: {
        [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING,
      },
    });
    if (!response.ok) return false;
  }
  return true;
};

export const applyProjectRegenerationReset = (project: VideoProject, target: string): { updatedProject: VideoProject; changed: boolean } => {
  let updatedProject = _.cloneDeep(project);
  let changed = false;
  const isVoice = _.isEqual(target, REGENERATION_TARGET.VOICE);
  const isImages = _.isEqual(target, REGENERATION_TARGET.IMAGES);
  const isVideos = _.isEqual(target, REGENERATION_TARGET.RENDER);

  if (isVoice && !_.isEmpty(updatedProject.voiceConfig)) {
    _.set(updatedProject.voiceConfig, AUTO_GENERATOR_CONSTANTS.VOICE_CONFIG_AUDIO_BASE64_PATH, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    _.set(updatedProject.voiceConfig, AUTO_GENERATOR_CONSTANTS.AVG_AUDIO_URL_KEY, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    updatedProject.renderedVideoUrl = undefined;
    updatedProject.storyboard = _.map(_.defaultTo(updatedProject.storyboard, []), (scene) => ({
      ...scene,
      audioUrl: undefined,
      audioBase64: undefined,
    }));
    changed = true;
  } else if (isImages) {
    updatedProject = clearAllProjectVisualOutputs(updatedProject);
    changed = true;
  } else if (isVideos) {
    updatedProject = clearProjectVideoOutputs(updatedProject);
    changed = true;
  }
  return { updatedProject, changed };
};
