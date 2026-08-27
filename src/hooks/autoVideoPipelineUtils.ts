import _ from "lodash";
import { VideoProject, StoryboardScene, VoiceConfig } from "../types";
import { COMMON_STRINGS, ERROR_MESSAGES, REFACTOR_CONSTANTS, STORAGE_KEYS } from "../constants";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_CONFIG } from "../constants/config";
import { blobToBase64 } from "../lib/fileUtils";
import { logger } from "../utils/logger";
import type { PipelineConfig } from "./useAutoVideoPipeline";
import { resolveStylePreset } from "../constants/stylePresets";

export { applyBackgroundMode, applyImageFocusMode, applyTextInImageMode } from "../lib/imagePromptDirectives";

export interface CachedVoiceAudio { audioBase64: string; audioUrl: string; isCached: boolean; }
export interface ReferenceChangeState { hasVisualOverrides: boolean; shouldRegenerateSceneAssets: boolean; shouldRegenerateStoryboard: boolean; shouldRegenerateThumbnails: boolean; }
export interface PipelineInvalidationState { regenerateScript: boolean; regenerateStoryboard: boolean; regenerateVoice: boolean; regenerateSceneAssets: boolean; regenerateSeo: boolean; regenerateThumbnails: boolean; }

const INTERRUPTED_PIPELINE_STATUSES = [REFACTOR_CONSTANTS.STATUS_GENERATING, REFACTOR_CONSTANTS.STATUS_CANCELLED, REFACTOR_CONSTANTS.STATUS_PARTIAL];
const ALIGNMENT_CONFIG = { EPSILON_SECONDS: 0.05 } as const;

export const preserveInterruptedStoryboardCheckpoint = (project: VideoProject | null, config: PipelineConfig, invalidationState: PipelineInvalidationState): PipelineInvalidationState => {
  const hasReusableSceneAssets = !_.isEmpty(project?.storyboard) && _.every(project?.storyboard, (scene) => !_.isEmpty(scene.assetUrl) || !_.isEmpty(scene.assetUrls));
  const canResumeCheckpoint = _.every([config.resumeMode, !config.forceRegenerateScenes, !invalidationState.regenerateScript, hasReusableSceneAssets, _.includes(INTERRUPTED_PIPELINE_STATUSES, project?.status)], Boolean);
  return canResumeCheckpoint ? { ...invalidationState, regenerateStoryboard: false, regenerateSceneAssets: false } : invalidationState;
};

export const fetchCachedVoiceAudio = async (voiceConfig: VoiceConfig): Promise<CachedVoiceAudio> => {
  const audioUrl = _.get(voiceConfig, AUTO_GENERATOR_CONSTANTS.AVG_AUDIO_URL_KEY, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  let audioBase64 = _.get(voiceConfig, AUTO_GENERATOR_CONSTANTS.VOICE_CONFIG_AUDIO_BASE64_PATH, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  if (_.isEmpty(audioBase64) && !_.isEmpty(audioUrl)) {
    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(ERROR_MESSAGES.FETCH_AUDIO_URL_FOR_ALIGN_ERR);
      audioBase64 = await blobToBase64(await response.blob());
    } catch (error) {
      logger.error(ERROR_MESSAGES.FETCH_AUDIO_URL_FOR_ALIGN_ERR, error);
    }
  }
  return { audioBase64, audioUrl, isCached: _.some([audioBase64, audioUrl], (value) => !_.isEmpty(value)) };
};

export interface ResolvedTargetProject { selectedAutoProject: VideoProject | null; existingTargetProject: VideoProject | null; }

export const resolveTargetProject = (projects: VideoProject[], selectedProjectId: string | null | undefined, activeProject: VideoProject | null, projectName: string, scriptContent: string): ResolvedTargetProject => {
  const selectedProject = _.defaultTo(_.find(projects, { id: selectedProjectId }), null);
  const selectedAutoProject = selectedProject
    ? (selectedProject.parentId ? selectedProject : _.defaultTo(_.find(projects, (project) => _.isEqual(project.parentId, _.defaultTo(selectedProject.parentId, selectedProject.id)) && _.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)), selectedProject))
    : null;
  const existingTargetProject = _.defaultTo(selectedAutoProject, _.defaultTo(selectedProjectId ? null : activeProject, _.defaultTo(_.find(projects, (project) => !_.isEmpty(projectName) && _.isEqual(_.trim(project.name), _.trim(projectName))), _.defaultTo(_.find(projects, (project) => !_.isEmpty(scriptContent) && _.isEqual(_.trim(_.get(project, "input.content", "")), _.trim(scriptContent))), _.defaultTo(_.first(projects), null)))));
  return { selectedAutoProject, existingTargetProject };
};

export const getReferenceChangeState = (project: VideoProject | null, styleImages: string[], sceneImages: string[], thumbnailImages: string[], characterImages: string[]): ReferenceChangeState => {
  const styleChanged = !_.isEqual(styleImages, _.defaultTo(project?.visualConfig?.styleReferenceImages, []));
  const sceneChanged = !_.isEqual(sceneImages, _.defaultTo(project?.visualConfig?.sceneReferenceImages, []));
  const thumbnailChanged = !_.isEqual(thumbnailImages, _.defaultTo(project?.visualConfig?.thumbnailReferenceImages, []));
  const characterChanged = !_.isEqual(characterImages, _.defaultTo(project?.visualConfig?.characters?.[0]?.images, []));
  return {
    shouldRegenerateStoryboard: styleChanged || characterChanged,
    hasVisualOverrides: _.some([styleChanged, thumbnailChanged, characterChanged]),
    shouldRegenerateSceneAssets: styleChanged || sceneChanged || characterChanged,
    shouldRegenerateThumbnails: styleChanged || thumbnailChanged || characterChanged,
  };
};

const buildComparisonConfigs = (config: PipelineConfig) => ({
  projectConfig: { genre: config.genre, language: config.language, duration: config.duration, rewriteLevel: config.rewriteLevel, similarityReduction: config.similarityReduction, creativityLevel: config.creativityLevel, factCheck: config.factCheck, audience: config.audience, writingStyle: config.writingStyle, splitStrategy: config.splitStrategy },
  voiceConfig: { provider: config.voiceProvider, voiceURI: config.voiceURI, voiceName: config.voiceName, speed: config.voiceSpeed, pitch: config.voicePitch, volume: config.voiceVolume },
  visualConfig: { generationMode: config.generationMode, imageGeneratorEngine: config.imageGeneratorEngine, generateType: config.generateType, maxVideoScenes: config.maxVideoScenes, imageFocusMode: config.imageFocusMode, aspectRatio: config.aspectRatio, style: config.stylePreset, chromeHeadless: config.chromeHeadless, videoDuration: config.videoDuration, styleBackgroundMode: config.styleBackgroundMode, styleTextInImageMode: config.styleTextInImageMode, thumbnailBackgroundMode: config.thumbnailBackgroundMode, thumbnailTextInImageMode: config.thumbnailTextInImageMode, thumbnailImageFocusMode: config.thumbnailImageFocusMode },
});

export const getPipelineInvalidationState = (project: VideoProject | null, config: PipelineConfig, references: ReferenceChangeState): PipelineInvalidationState => {
  if (!project) return { regenerateScript: true, regenerateStoryboard: true, regenerateVoice: true, regenerateSceneAssets: true, regenerateSeo: true, regenerateThumbnails: true };

  const { projectConfig: currentProjectConfig, voiceConfig: currentVoiceConfig, visualConfig: currentVisualConfig } = buildComparisonConfigs(config);
  const inputChanged = !_.isEqual(project.input?.type, config.inputType) || !_.isEqual(_.trim(project.input?.content), _.trim(config.scriptContent));
  const scriptConfigChanged = !_.isEqual(_.pick(project.config, AUTO_VIDEO_PIPELINE_CONFIG.SCRIPT_CONFIG_KEYS), _.pick(currentProjectConfig, AUTO_VIDEO_PIPELINE_CONFIG.SCRIPT_CONFIG_KEYS));
  const storyboardConfigChanged = !_.isEqual(_.pick(project.config, AUTO_VIDEO_PIPELINE_CONFIG.STORYBOARD_CONFIG_KEYS), _.pick(currentProjectConfig, AUTO_VIDEO_PIPELINE_CONFIG.STORYBOARD_CONFIG_KEYS));
  const storyboardVisualConfigChanged = !_.isEqual(_.pick(project.visualConfig, AUTO_VIDEO_PIPELINE_CONFIG.STORYBOARD_VISUAL_CONFIG_KEYS), _.pick(currentVisualConfig, AUTO_VIDEO_PIPELINE_CONFIG.STORYBOARD_VISUAL_CONFIG_KEYS));
  const voiceConfigChanged = !_.isEqual(_.pick(project.voiceConfig, AUTO_VIDEO_PIPELINE_CONFIG.VOICE_CONFIG_KEYS), _.pick(currentVoiceConfig, AUTO_VIDEO_PIPELINE_CONFIG.VOICE_CONFIG_KEYS));
  const visualConfigChanged = !_.isEqual(_.pick(project.visualConfig, AUTO_VIDEO_PIPELINE_CONFIG.VISUAL_CONFIG_KEYS), _.pick(currentVisualConfig, AUTO_VIDEO_PIPELINE_CONFIG.VISUAL_CONFIG_KEYS));
  const hasScript = !_.isEmpty(project.scriptRewritten), hasStoryboard = !_.isEmpty(project.storyboard), hasVoice = !_.isEmpty(project.voiceConfig?.audioUrl) || !_.isEmpty(project.voiceConfig?.audioBase64);
  const previousThumbnailStyle = resolveStylePreset(project.visualConfig?.thumbnailReferencePrompt || project.visualConfig?.style).positivePrompt;
  const requestedThumbnailStyle = resolveStylePreset(config.thumbnailStylePreset || config.stylePreset).positivePrompt;

  let regenerateScript = inputChanged || scriptConfigChanged || !project.contentSafety?.allowed || !hasScript;
  let regenerateStoryboard = regenerateScript || storyboardConfigChanged || storyboardVisualConfigChanged || references.shouldRegenerateStoryboard || !hasStoryboard;
  let regenerateVoice = regenerateScript || voiceConfigChanged || !hasVoice;
  let regenerateSceneAssets = regenerateStoryboard || visualConfigChanged || references.shouldRegenerateSceneAssets;

  if (config.forceRegenerateScenes) {
    if (hasScript) regenerateScript = false;
    if (hasStoryboard) regenerateStoryboard = false;
    if (hasVoice) regenerateVoice = false;
    regenerateSceneAssets = true;
  } else if (config.forceRegenerateVoice) {
    if (hasScript) regenerateScript = false;
    if (hasStoryboard) regenerateStoryboard = false;
    regenerateVoice = true;
    regenerateSceneAssets = false;
  }

  return {
    regenerateScript, regenerateStoryboard, regenerateVoice, regenerateSceneAssets,
    regenerateSeo: regenerateScript,
    regenerateThumbnails: regenerateScript || Boolean(config.forceRegenerateScenes) || references.shouldRegenerateThumbnails || !_.isEqual(project.visualConfig?.thumbnailCount, config.thumbnailCount) || !_.isEqual(project.visualConfig?.thumbnailBackgroundMode, config.thumbnailBackgroundMode) || !_.isEqual(project.visualConfig?.thumbnailTextInImageMode, config.thumbnailTextInImageMode) || !_.isEqual(project.visualConfig?.thumbnailImageFocusMode, config.thumbnailImageFocusMode) || !_.isEqual(previousThumbnailStyle, requestedThumbnailStyle),
  };
};

export const hasCompleteSceneAlignment = (scenes: StoryboardScene[], hasGlobalNarration: boolean = false): boolean => _.every(
  scenes,
  (scene, index) => _.every([
    !_.isEmpty(scene.startTime), !_.isEmpty(scene.endTime), !_.isUndefined(scene.duration),
    _.isFinite(scene._start), _.isFinite(scene._end), _.gte(_.toNumber(scene._end), _.toNumber(scene._start)),
    index === 0 || Math.abs(_.toNumber(scene._start) - _.toNumber(scenes[index - 1]._end)) < ALIGNMENT_CONFIG.EPSILON_SECONDS,
    hasGlobalNarration || _.some([scene.audioBase64, scene.audioUrl], (audio) => !_.isEmpty(audio)),
  ]),
);

export const applyGeneratedMediaLanguage = (prompt: string, directive: string): string => (_.includes(prompt, AUTO_VIDEO_PIPELINE_CONFIG.GENERATED_MEDIA_LANGUAGE_MARKER) ? prompt : _.join([prompt, directive], REFACTOR_CONSTANTS.AVG_BLANK));
export const calculateSceneDuration = (scenes: StoryboardScene[]): number => _.sumBy(scenes, (scene) => _.toNumber(scene.duration) || 0);
export const getAutoVideoConfigStorageKey = (projectId?: string | null): string => (projectId ? _.join([STORAGE_KEYS.AUTO_GENERATOR_CONFIG, projectId], REFACTOR_CONSTANTS.VD_UNDERSCORE) : STORAGE_KEYS.AUTO_GENERATOR_CONFIG);


