import { useState, useRef, useEffect } from "react";
import _ from "lodash";
import {
  VideoProject,
  ProjectInputType,
  ProjectLanguage,
  Gender,
  AgeGroup,
  AspectRatio,
  ImageGenerationMode,
  ImageGeneratorEngine,
  GenerateType,
  BatchDelayOption,
  GeminiChatSpeed,
  PromptInputMethod,
  VoiceConfig,
  ThumbnailItem,
  HookPosition,
  HookVersion,
  AudioType,
  AssetsMode,
  Chapter,
  StoryboardScene,
  BackgroundMode,
  TextInImageMode,
  ThumbnailTextMode,
  ImageFocusMode,
  CharacterConfig,
  SceneAssetStatus,
  CreativeBrief,
  FactPack,
  ScriptQualityReport,
  StoryboardQualityReport,
  VisualBible,
  QualityMode,
  ContentSafetyReport,
  ImagePromptQualityReport,
  AssetAcceptance,
  QaStatus,
} from "../types";
import { VideoQuality } from "../constants/enums";
import {
  API_ROUTES, CONTENT_TYPES, CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS,
  API_HEADERS, PIPELINE_CLIENT_ERRORS, SplitStrategy,
  PROJECT_ASSET_GROUP, HTTP_METHODS,
} from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_PROGRESS, FFMPEG_RENDER_CONSTANTS, REFERENCE_ASSET_GROUP } from "../constants/config";
import { IMAGE_PROMPT_PIPELINE_VERSION } from "../constants/imagePromptRules";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { safeSystemFetch, generateRandomString } from "../lib/shared-utils";
import {
  createProjectImageUrl,
  generateProjectImages,
  generateProjectImageOnce,
  getSceneAssetSummary,
  hasSceneAsset,
  isUsableGeneratedAssetUrl,
  resolveSceneGenerateType,
  selectVideoSceneIds,
  type ProjectImageResult,
} from "../services/projectImageGenerationService";
import { resolveVisualConfig } from "../services/autoVideoConfigResolver";
import { DEFAULT_VOICE_ARC, evaluateEdit, evaluateSubtitles } from "../services/productionQualityService";
import { appendAssetRevision, createSceneDependencyHash, inheritApprovedSceneAsset } from "../services/dependencyHashService";
import { createManualReviewItems, evaluateFinalQuality } from "../services/finalQualityService";
import { migrateVideoProject } from "../services/projectMigrationService";
import { resolveQualityProfile } from "../services/qualityProfileService";
import { upscaleApprovedSceneAssets } from "../services/imageUpscaleService";
import { createAdvisoryFinalVideoReport } from "../services/finalMultimodalQualityService";
import { createPipelineBenchmark, resolveRolloutConfig } from "../services/rolloutService";
import { applyOptionalMusicAsset, createAudioCueSheet } from "../services/soundDesignService";
import { createRenderAudioTracks } from "../services/audioMixService";
import { createShadowComparison } from "../services/shadowComparisonService";
import { appendImagePromptAspectRatio, evaluateImagePrompts } from "../services/imagePromptQualityService";
import { createScriptGroundedStoryboard, ensureStoryboardScriptCoverage } from "../services/storyboardFallbackService";
import { applyProfessionalEditingPolicy } from "../services/editingPolicyService";
import { createSceneGenerationContext, resolveSceneCharacterIds, SCENE_REFERENCE_CONFIG } from "../services/sceneReferenceService";
import { adaptImagePromptForEngine } from "../services/imageEngineAdapterService";
import { createThumbnailStyleDirective } from "../services/styleReferenceService";
import { normalizeCharacterLibrary, validateVisualContinuity } from "../services/visualContinuityService";
import { generateDirectedVoice } from "../services/voiceDirectionService";
import { alignVoiceTimeline } from "../services/voiceTimelineService";
import { assessVoiceAdvisory } from "../services/voiceQualityRepairService";
import { createSubtitleCues } from "../services/subtitleService";
import { createThumbnailGenerationPrompt, resolveThumbnailReferenceImages } from "../services/thumbnailPromptService";
import { acceptGeneratedThumbnail } from "../services/thumbnailQualityPipelineService";
import { createSceneContinuityKey, createThumbnailContinuityKey } from "../services/imageGenerationContinuityService";
import { clearSceneVisualAsset } from "../services/projectRegenerationService";
import { compileImagePrompt } from "../services/imagePromptCompilerService";
import { resolveStylePreset } from "../constants/stylePresets";
import { createSourceGroundedSeo } from "../services/seoFallbackService";
import { acquirePipelineRunLease, refreshPipelineRunLease, releasePipelineRunLease } from "../services/pipelineRunLockService";
import { Lang } from "../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../constants/texts";
import {
  calculateSceneDuration,
  fetchCachedVoiceAudio,
  getReferenceChangeState,
  getPipelineInvalidationState,
  preserveInterruptedStoryboardCheckpoint,
  hasCompleteSceneAlignment,
  resolveTargetProject,
} from "./autoVideoPipelineUtils";

export interface PipelineConfig {
  scriptContent: string;
  inputType: ProjectInputType;
  genre: string;
  language: ProjectLanguage;
  duration: string;
  rewriteLevel: number;
  similarityReduction: number;
  creativityLevel: number;
  factCheck: boolean;
  audience: string;
  writingStyle: string;
  splitStrategy: string;
  hookStrategy: string;
  hookDuration: number;
  hookPosition: string;
  voiceProvider: string;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
  voiceURI: string;
  voiceName: string;
  generationMode: ImageGenerationMode;
  imageGeneratorEngine: ImageGeneratorEngine;
  generateType: GenerateType;
  maxVideoScenes: number;
  aspectRatio: AspectRatio;
  promptInputMethod: PromptInputMethod;
  sampleCount: number;
  videoDuration: string;
  chromeHeadless: boolean;
  geminiChatSpeed: GeminiChatSpeed;
  batchDelay: BatchDelayOption;
  stylePreset: string;
  styleBackgroundMode: BackgroundMode;
  styleTextInImageMode: TextInImageMode;
  imageFocusMode: ImageFocusMode;
  referenceImages: string[];
  sceneReferenceImages: string[];
  characterImages: string[];
  thumbnailCount: number;
  thumbnailStylePreset: string;
  thumbnailBackgroundMode: BackgroundMode;
  thumbnailTextInImageMode: ThumbnailTextMode;
  thumbnailImageFocusMode: ImageFocusMode;
  thumbnailReferenceImages: string[];
  thumbnailSceneReferenceImages?: string[];
  projectName: string;
  resumeMode: boolean;
  ffmpegQuality: VideoQuality;
  selectedProjectId?: string | null;
  forceRegenerateVoice?: boolean;
  forceRegenerateScenes?: boolean;
  musicAssetUrl?: string;
}

export interface PipelineState {
  isProcessing: boolean;
  isCancelling: boolean;
  currentStepIndex: number;
  stepProgress: number;
  logs: string[];
  renderedVideoUrl: string;
  activeCreatedProject: VideoProject | null;
}

export interface PipelineActions {
  startPipeline: (config: PipelineConfig) => Promise<void>;
  cancelPipeline: () => void;
  setActiveCreatedProject: React.Dispatch<React.SetStateAction<VideoProject | null>>;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
  setRenderedVideoUrl: React.Dispatch<React.SetStateAction<string>>;
}

const createFallbackCharacterProfile = (stylePresetName?: string): Record<string, any> => {
  const activePreset = resolveStylePreset(stylePresetName);
  return {
    name: "Main Character",
    description: activePreset.characterRule || activePreset.description,
    prompt: activePreset.characterRule || activePreset.positivePrompt,
    narrativeRole: "protagonist",
    genderPresentation: "neutral",
    ageRange: "20s",
    ethnicitySkinTone: "fair",
    bodyBuild: "standard",
    faceShape: "standard",
    eyes: "expressive",
    nose: "",
    hair: "styled",
    signatureClothing: "casual",
    accessories: "",
    colorPalette: "harmonious",
    silhouette: "recognizable",
    timelineStages: [],
  };
};

export function useAutoVideoPipeline(
  projects: VideoProject[],
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<void> | void,
  currentLang: Lang,
) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const processingRef = useRef(false);
  const cancellationRef = useRef(false);
  const requestAbortControllerRef = useRef<AbortController | null>(null);
  const activeRenderJobIdRef = useRef<string | null>(null);
  const boundSelectedProjectIdRef = useRef<string | null>(null);

  useEffect(() => () => {
    cancellationRef.current = true;
    requestAbortControllerRef.current?.abort();
  }, []);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [activeCreatedProject, setActiveCreatedProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    const restoreAutoProject = async () => {
      if (processingRef.current) return;
      try {
        const savedId = await storageUtils.getAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT);
        if (savedId && !activeCreatedProject) {
          const foundProj = _.find(projects, { id: savedId });
          if (foundProj) {
            setActiveCreatedProject(foundProj);
            if (foundProj.renderedVideoUrl) setRenderedVideoUrl(foundProj.renderedVideoUrl);
            if (foundProj.generationLogs) setLogs(foundProj.generationLogs);
          }
        }
      } catch (e) {
        logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, e);
      }
    };
    restoreAutoProject();
  }, [projects, activeCreatedProject]);

  useEffect(() => {
    if (processingRef.current) return;
    const selectedProjectId = boundSelectedProjectIdRef.current;
    if (!selectedProjectId) return;
    const selectionChanged = !_.isEqual(boundSelectedProjectIdRef.current, selectedProjectId);
    if (!selectionChanged && activeCreatedProject) return;
    const foundProj = _.find(projects, { id: selectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      setLogs(foundProj.generationLogs || []);
    }
  }, [projects, activeCreatedProject]);

  const syncSelectedProject = (selectedProjectId: string | null | undefined) => {
    if (processingRef.current) return;
    if (!selectedProjectId) return;
    const selectionChanged = !_.isEqual(boundSelectedProjectIdRef.current, selectedProjectId);
    if (!selectionChanged && activeCreatedProject) return;
    boundSelectedProjectIdRef.current = selectedProjectId;
    const foundProj = _.find(projects, { id: selectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      setLogs(foundProj.generationLogs || []);
    }
  };

  const startPipeline = async (config: PipelineConfig) => {
    if (processingRef.current) return;
    if (_.isEmpty(_.trim(config.scriptContent))) {
      alert(T.alertEmptyScript);
      return;
    }
    processingRef.current = true;
    cancellationRef.current = false;
    setIsCancelling(false);

    const availableMusicAssetUrl = config.musicAssetUrl || activeCreatedProject?.config.musicAssetUrl;
    config.musicAssetUrl = availableMusicAssetUrl;

    const pipelineTargetKey = _.toString(config.selectedProjectId || activeCreatedProject?.id || _.kebabCase(_.join([config.projectName, config.scriptContent], REFACTOR_CONSTANTS.VD_EMPTY_STRING)));
    const pipelineRunLease = acquirePipelineRunLease(pipelineTargetKey);
    if (!pipelineRunLease.acquired) {
      processingRef.current = false;
      alert(REFACTOR_CONSTANTS.ERR_PIPELINE_ALREADY_RUNNING);
      return;
    }

    requestAbortControllerRef.current = new AbortController();
    const requestSignal = requestAbortControllerRef.current.signal;

    const throwIfCancelled = () => {
      if (cancellationRef.current) {
        throw new DOMException(T.cancelledError, "AbortError");
      }
    };

    setIsProcessing(true);
    setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.START);
    setCurrentStepIndex(1);
    setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

    let currentLogs: string[] = config.resumeMode ? _.clone(logs) : [];
    setLogs(_.clone(currentLogs));
    const appendLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${msg}`;
      currentLogs = _.concat(currentLogs, formatted);
      setLogs(_.clone(currentLogs));
    };

    const pipelineStartedAt = Date.now();
    let currentProject: VideoProject | null = activeCreatedProject;
    appendLog(T.logPipelineStart);
    appendLog(T.logConfigSummary(
      config.genre,
      config.language,
      config.duration,
      config.generationMode,
      config.resumeMode,
    ));

    try {
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_INIT);

      let newProjectId: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let newProj: VideoProject;
      const { selectedAutoProject: selectedAutoProj, existingTargetProject: rawExistingTargetProj } = resolveTargetProject(
        projects,
        config.selectedProjectId,
        activeCreatedProject,
        config.projectName,
        config.scriptContent,
      );
      const existingTargetProj = migrateVideoProject(rawExistingTargetProj);
      const referenceChangeState = getReferenceChangeState(
        existingTargetProj,
        config.referenceImages,
        config.sceneReferenceImages,
        config.thumbnailReferenceImages,
        [],
      );
      const invalidationState = preserveInterruptedStoryboardCheckpoint(
        existingTargetProj,
        config,
        getPipelineInvalidationState(existingTargetProj, config, referenceChangeState),
      );
      const sceneStyleProfileOutdated = _.every([
        !_.isEmpty(existingTargetProj?.visualConfig?.styleReferenceImages),
        _.isEmpty(existingTargetProj?.visualBible?.styleProfile?.characterType),
      ], Boolean);
      const thumbnailStyleProfileOutdated = _.every([
        !_.isEmpty(existingTargetProj?.visualConfig?.thumbnailReferenceImages),
        _.isEmpty(existingTargetProj?.visualConfig?.thumbnailStyleProfile?.characterType),
      ], Boolean);
      const requiresVisualReferenceMigration = _.some(
        existingTargetProj?.storyboard,
        scene => _.isEmpty(scene.layout) || _.isNil(scene.textAllowed),
      ) || sceneStyleProfileOutdated || thumbnailStyleProfileOutdated;
      let shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets || requiresVisualReferenceMigration;

      if (config.resumeMode && existingTargetProj) {
        newProjectId = existingTargetProj.id;
        newProj = {
          ...existingTargetProj,
          thumbnails: config.forceRegenerateScenes ? [] : existingTargetProj.thumbnails,
          status: REFACTOR_CONSTANTS.STATUS_GENERATING,
          activeRunId: pipelineRunLease.runId,
          input: { type: config.inputType, content: config.scriptContent },
          config: {
            ...existingTargetProj.config,
            genre: config.genre,
            language: config.language,
            duration: config.duration,
            rewriteLevel: config.rewriteLevel,
            similarityReduction: config.similarityReduction,
            creativityLevel: config.creativityLevel,
            factCheck: config.factCheck,
            audience: config.audience,
            writingStyle: config.writingStyle,
            splitStrategy: config.splitStrategy,
            musicAssetUrl: config.musicAssetUrl,
          },
          hookConfig: {
            ...existingTargetProj.hookConfig,
            type: config.hookStrategy,
            duration: config.hookDuration,
            positions: config.hookPosition as HookPosition,
          },
          voiceConfig: {
            ...existingTargetProj.voiceConfig,
            provider: config.voiceProvider,
            voiceURI: config.voiceURI,
            voiceName: config.voiceName,
            speed: config.voiceSpeed,
            pitch: config.voicePitch,
            volume: config.voiceVolume,
          },
          visualConfig: {
            ...existingTargetProj.visualConfig,
            style: config.stylePreset || existingTargetProj.visualConfig.style,
            referencePrompt: config.stylePreset || existingTargetProj.visualConfig.referencePrompt,
            thumbnailReferencePrompt: config.thumbnailStylePreset || config.stylePreset || existingTargetProj.visualConfig.thumbnailReferencePrompt,
            generationMode: config.generationMode,
            imageGeneratorEngine: config.imageGeneratorEngine,
            generateType: config.generateType,
            maxVideoScenes: config.maxVideoScenes,
            aspectRatio: config.aspectRatio,
            chromeHeadless: config.chromeHeadless,
            styleBackgroundMode: config.styleBackgroundMode,
            styleTextInImageMode: config.styleTextInImageMode,
            imageFocusMode: config.imageFocusMode,
            thumbnailBackgroundMode: config.thumbnailBackgroundMode,
            thumbnailTextInImageMode: config.thumbnailTextInImageMode,
            thumbnailImageFocusMode: config.thumbnailImageFocusMode,
            thumbnailCount: config.thumbnailCount,
            batchDelay: config.batchDelay,
            geminiChatSpeed: config.geminiChatSpeed,
            promptInputMethod: config.promptInputMethod,
            videoDuration: config.videoDuration,
            generateCount: config.sampleCount,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            thumbnailReferenceImages: config.thumbnailReferenceImages,
            thumbnailSceneReferenceImages: config.thumbnailSceneReferenceImages,
            referenceImages: _.take(
              _.uniq(_.concat(config.referenceImages || [], config.sceneReferenceImages || [])),
              SCENE_REFERENCE_CONFIG.MAX_IMAGES,
            ),
          },
        };
        setActiveCreatedProject(newProj);
        appendLog(T.logResumeProject(newProj.name));
      } else {
        const selectedProj = _.defaultTo(selectedAutoProj, activeCreatedProject);
        const isChildProject = selectedProj && selectedProj.parentId;

        newProjectId = selectedProj
          ? selectedProj.id
          : _.join([REFACTOR_CONSTANTS.AVG_PROJECT_ID_PREFIX, generateRandomString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

        const defaultName = selectedProj
          ? selectedProj.name
          : (_.trim(config.projectName) || _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING));

        if (selectedProj?.id) {
          const deleteAssetGroups = [
            PROJECT_ASSET_GROUP.VOICES,
            PROJECT_ASSET_GROUP.VISUALS,
            PROJECT_ASSET_GROUP.VIDEOS,
          ];
          for (const group of deleteAssetGroups) {
            try {
              await fetch(`${API_ROUTES.PIPELINE_PROJECT_ASSETS}/${selectedProj.id}/${group}`, {
                method: HTTP_METHODS.DELETE,
                headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING },
              });
            } catch (_) {}
          }
        }

        newProj = {
          id: newProjectId,
          parentId: isChildProject ? selectedProj.parentId : undefined,
          name: defaultName,
          description: _.join([REFACTOR_CONSTANTS.AVG_AUTO_DESC_PREFIX, new Date().toLocaleString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          createdAt: _.defaultTo(selectedProj?.createdAt, new Date().toISOString()),
          updatedAt: new Date().toISOString(),
          status: REFACTOR_CONSTANTS.STATUS_GENERATING,
          activeRunId: pipelineRunLease.runId,
          input: { type: config.inputType, content: config.scriptContent },
          config: {
            genre: config.genre,
            language: config.language,
            duration: config.duration,
            rewriteLevel: config.rewriteLevel,
            similarityReduction: config.similarityReduction,
            creativityLevel: config.creativityLevel,
            factCheck: config.factCheck,
            audience: config.audience,
            writingStyle: config.writingStyle,
            splitStrategy: config.splitStrategy,
          },
          hookConfig: {
            type: config.hookStrategy,
            duration: config.hookDuration,
            count: 3,
            positions: config.hookPosition as HookPosition,
            versions: [],
          },
          voiceConfig: {
            provider: config.voiceProvider,
            audioType: AudioType.TTS,
            gender: Gender.Male,
            age: AgeGroup.Adult,
            emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL,
            speed: config.voiceSpeed,
            pitch: config.voicePitch,
            volume: config.voiceVolume,
            voiceURI: config.voiceURI,
            voiceName: config.voiceName,
          },
          visualConfig: {
            source: REFACTOR_CONSTANTS.AVG_VISUAL_SOURCE_AUTO,
            style: config.stylePreset,
            styleBackgroundMode: config.styleBackgroundMode,
            styleTextInImageMode: config.styleTextInImageMode,
            imageFocusMode: config.imageFocusMode,
            thumbnailBackgroundMode: config.thumbnailBackgroundMode,
            thumbnailTextInImageMode: config.thumbnailTextInImageMode,
            thumbnailImageFocusMode: config.thumbnailImageFocusMode,
            quality: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
            density: 5,
            characterConsistency: false,
            assetsMode: AssetsMode.Mixed,
            imageGeneratorEngine: config.imageGeneratorEngine,
            generateType: config.generateType,
            maxVideoScenes: config.maxVideoScenes,
            aspectRatio: config.aspectRatio,
            promptInputMethod: config.promptInputMethod,
            generateCount: config.sampleCount,
            chromeHeadless: config.chromeHeadless,
            generationMode: config.generationMode,
            geminiChatSpeed: config.geminiChatSpeed,
            batchDelay: config.batchDelay,
            videoDuration: config.videoDuration,
            thumbnailCount: config.thumbnailCount,
            thumbnailReferenceImages: config.thumbnailReferenceImages,
            thumbnailSceneReferenceImages: config.thumbnailSceneReferenceImages,
            thumbnailReferencePrompt: config.thumbnailStylePreset,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            referenceImages: _.take(_.uniq(_.concat(config.referenceImages, config.sceneReferenceImages)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
            referencePrompt: config.stylePreset,
            characters: [],
          },
          seoConfig: { numTitles: 3, numDescriptions: 1, numHashtags: 5, numTags: 10 },
          creditsUsed: 0,
          scriptRewritten: undefined,
          chapters: [],
          factCheckNotes: undefined,
          storyboard: [],
          thumbnails: [],
          renderedVideoUrl: undefined,
          seo: undefined,
          manualReviewItems: [],
          generationLogs: [],
        };
      }

      const referenceGroups: Array<[string,string[]]> = await Promise.all(_.map([
        {group:"style",images:config.referenceImages,configKey:"styleReferenceImages"},
        {group:"scene",images:config.sceneReferenceImages,configKey:"sceneReferenceImages"},
        {group:"thumbnail",images:config.thumbnailReferenceImages,configKey:"thumbnailReferenceImages"},
        {group:"thumbnailScene",images:config.thumbnailSceneReferenceImages,configKey:"thumbnailSceneReferenceImages"},
      ], async ({group, images, configKey}): Promise<[string,string[]]> => {
        if (_.isEmpty(images)) return [group,_.defaultTo(_.get(newProj.visualConfig,configKey),[])];
        const response=await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${newProjectId}/${group}`,{images});
        if (!response.success) {
          appendLog(_.replace(
            PIPELINE_CLIENT_ERRORS.REFERENCE_PERSIST_CONTINUED,
            PIPELINE_CLIENT_ERRORS.REFERENCE_GROUP_TOKEN,
            group,
          ));
          return [group, images];
        }
        const persistedAssets = _.defaultTo(response.data?.assets, []);
        return [group, _.isEmpty(persistedAssets) ? images : persistedAssets];
      }));
      const canonicalReferences=_.fromPairs(referenceGroups);
      let musicAssetUrl = config.musicAssetUrl;
      if (_.startsWith(musicAssetUrl, "data:")) {
        const audioResponse = await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_AUDIO}/${newProjectId}`, { audio: musicAssetUrl });
        if (!audioResponse.success || _.isEmpty(audioResponse.data?.assetUrl)) {
          appendLog(PIPELINE_CLIENT_ERRORS.AUDIO_REFERENCE_SKIPPED);
          musicAssetUrl = undefined;
        } else {
          musicAssetUrl = audioResponse.data.assetUrl;
        }
      }
      newProj = {
        ...newProj,
        config: { ...newProj.config, musicAssetUrl },
        visualConfig: {
          ...newProj.visualConfig,
          styleReferenceImages: canonicalReferences.style,
          sceneReferenceImages: canonicalReferences.scene,
          referenceImages: _.take(
            _.uniq(_.concat(canonicalReferences.style, canonicalReferences.scene)),
            SCENE_REFERENCE_CONFIG.MAX_IMAGES,
          ),
          thumbnailReferenceImages: canonicalReferences.thumbnail,
          thumbnailSceneReferenceImages: canonicalReferences.thumbnailScene,
          characterImages: [],
        },
      };
      config.musicAssetUrl = musicAssetUrl;
      newProj = { ...newProj, rollout: resolveRolloutConfig(newProjectId) };
      await storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, newProjectId);
      setActiveCreatedProject(newProj);
      currentProject = newProj;

      const syncProject = async (proj: VideoProject) => {
        if (!refreshPipelineRunLease(pipelineRunLease)) throw new Error(REFACTOR_CONSTANTS.ERR_PIPELINE_RUN_REPLACED);
        const isCompleted = _.isEqual(proj.status, REFACTOR_CONSTANTS.STATUS_COMPLETED);
        const finalProj = { ...proj, activeRunId: isCompleted ? null : pipelineRunLease.runId, lastRunId: isCompleted ? pipelineRunLease.runId : proj.lastRunId, generationLogs: _.clone(currentLogs), updatedAt: new Date().toISOString() };
        currentProject = finalProj;
        setActiveCreatedProject(finalProj);
        await onUpdateProject(finalProj, true);
      };

      await syncProject(newProj);
      appendLog(T.logProjectResolved(newProjectId, Boolean(config.resumeMode && existingTargetProj)));
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, _.get(newProj, REFACTOR_CONSTANTS.AVG_NAME_KEY)));
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.PROJECT_DONE);

      let realScript: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let chapters: Chapter[] = [];
      let factCheckNotes: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let realScenes: StoryboardScene[] = [];
      let isScriptCached = false;
      let isStoryboardCached = false;

      if (config.resumeMode && !invalidationState.regenerateScript && !_.isEmpty(newProj.scriptRewritten)) {
        realScript = newProj.scriptRewritten!;
        chapters = (_.defaultTo(newProj.chapters, []) as Chapter[]);
        factCheckNotes = _.defaultTo(newProj.factCheckNotes, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        isScriptCached = true;
        appendLog(T.logResumeScript);
        appendLog(T.logScriptResultDetail(_.size(_.words(realScript)), _.size(chapters)));
        setStepProgress(REFACTOR_CONSTANTS.AUTO_PROGRESS_SCRIPT_COMPLETE);
      }

      if (config.resumeMode && !invalidationState.regenerateStoryboard && !_.isEmpty(newProj.storyboard)) {
        realScenes = _.cloneDeep(newProj.storyboard!) as StoryboardScene[];
        isStoryboardCached = true;
        appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);
      }

      if (!isScriptCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_WRITE);
        appendLog(T.logScriptRequestDetail(_.size(config.scriptContent), config.inputType));
        const scriptPayload = {
          originalInput: config.scriptContent,
          inputType: config.inputType,
          config: { ...newProj.config, hookConfig: newProj.hookConfig },
          selectedHookText: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
          bypassCache: !config.resumeMode,
        };

        const scriptRes = await safeSystemFetch(API_ROUTES.PIPELINE_SCRIPT, scriptPayload, requestSignal);
        throwIfCancelled();
        if (!scriptRes.success || !scriptRes.data || scriptRes.data.error) {
          throw new Error(scriptRes.error || scriptRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_SCRIPT_REWRITE);
        }

        realScript = scriptRes.data.rewrittenScript || config.scriptContent;
        chapters = (scriptRes.data.chapters || []) as Chapter[];
        factCheckNotes = scriptRes.data.factCheckNotes || "";
        const hookVersions = _.map(
          _.take(_.defaultTo(scriptRes.data.hookVersions, []) as HookVersion[], newProj.hookConfig.count),
          (hook, index) => ({
            id: _.toString(_.defaultTo(hook.id, _.join(["hook", _.add(index, 1)], "_"))),
            content: _.toString(hook.content),
            type: _.toString(_.defaultTo(hook.type, newProj.hookConfig.type)),
            selected: _.isEqual(index, SecurityConstants.ZERO),
            score: hook.score,
          }),
        );
        if (_.every([_.gt(newProj.hookConfig.count, SecurityConstants.ZERO), _.isEmpty(hookVersions)], Boolean)) {
          appendLog(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        }
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_REWRITE_SUCCESS);
        appendLog(T.logScriptResultDetail(_.size(_.words(realScript)), _.size(chapters)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SCRIPT_DONE);

        const scriptUpdatedProj = {
          ...newProj,
          hookConfig: { ...newProj.hookConfig, versions: hookVersions },
          scriptRewritten: realScript,
          factCheckNotes,
          creativeBrief: scriptRes.data.creativeBrief as CreativeBrief,
          narrativePlan: scriptRes.data.narrativePlan,
          chapterPlans: scriptRes.data.chapterPlans,
          factPack: scriptRes.data.factPack as FactPack,
          scriptQa: scriptRes.data.scriptQa as ScriptQualityReport | undefined,
          aiMetrics: _.concat(_.defaultTo(newProj.aiMetrics, []), _.defaultTo(scriptRes.data.aiMetrics, [])),
          contentSafety: scriptRes.data.contentSafety as ContentSafetyReport,
          chapters,
        };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
      }

      const curatedPreset = resolveStylePreset(config.stylePreset || newProj.visualConfig.style || newProj.visualConfig.referencePrompt);
      let currentStylePreset = curatedPreset.positivePrompt;
      let currentThumbnailStyle = resolveStylePreset(config.thumbnailStylePreset || newProj.visualConfig.thumbnailReferencePrompt || currentStylePreset).positivePrompt;
      const hasStyleReferences = !_.isEmpty(newProj.visualConfig.styleReferenceImages);

      if (!isStoryboardCached || config.forceRegenerateScenes || requiresVisualReferenceMigration) {
        newProj = {
          ...newProj,
          visualConfig: {
            ...newProj.visualConfig,
            style: currentStylePreset,
            referencePrompt: currentStylePreset,
            thumbnailReferencePrompt: currentThumbnailStyle,
            negativeStylePrompt: curatedPreset.negativePrompt,
            styleReferenceLocked: hasStyleReferences,
          },
          visualBible: {
            ...newProj.visualBible,
            visualStyle: currentStylePreset,
            styleReferenceLocked: hasStyleReferences,
            locations: _.defaultTo(newProj.visualBible?.locations, []),
            props: _.defaultTo(newProj.visualBible?.props, []),
          },
        };
        await syncProject(newProj);
      }

      let analyzedCharacters = _.defaultTo(newProj.visualConfig.characters, [] as CharacterConfig[]);
      let didAnalyzeCharacters = false;
      const hasLegacyCharacterProfile = _.some(analyzedCharacters, (character) => _.some([
        _.isEqual(character.name, PRESET_CONSTANTS.CHARACTER_NAME),
        _.isEqual(character.description, PRESET_CONSTANTS.CHARACTER_BIO),
      ]));
      if (!isScriptCached || _.isEmpty(analyzedCharacters) || hasLegacyCharacterProfile) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE);
        const analyzeCharacterRes = await safeSystemFetch(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, {
          script: realScript,
          visualStyle: newProj.visualConfig.referencePrompt
            || newProj.visualConfig.style
            || config.stylePreset,
        }, requestSignal);
        throwIfCancelled();
        let rawAnalyzedCharacters: any[] = analyzeCharacterRes.success && _.isArray(analyzeCharacterRes.data?.characters)
          ? _.take(analyzeCharacterRes.data.characters, REFACTOR_CONSTANTS.HOOK_COUNT)
          : [];
        if (_.isEmpty(rawAnalyzedCharacters)) {
          appendLog(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
          rawAnalyzedCharacters = [
            createFallbackCharacterProfile(config.stylePreset || newProj.visualConfig.style),
          ];
        }
        if (!_.isEmpty(rawAnalyzedCharacters)) {
          analyzedCharacters = normalizeCharacterLibrary(_.map(
            rawAnalyzedCharacters,
            (character: any, index: number): CharacterConfig => ({
              id: _.join([AUTO_GENERATOR_CONSTANTS.CHARACTER_ID_PREFIX, _.add(index, 1)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              name: character.name,
              description: character.description,
              prompt: character.prompt || character.description,
              ..._.pick(character, ["narrativeRole","genderPresentation","ageRange","ethnicitySkinTone","bodyBuild","faceShape","eyes","nose","hair","signatureClothing","accessories","colorPalette","silhouette","timelineStages"]),
              images: [],
              extracted: false,
            }),
          ));
          didAnalyzeCharacters = true;
          newProj = {
            ...newProj,
            visualConfig: {
              ...newProj.visualConfig,
              characters: analyzedCharacters,
              characterAnalysis: _.join(_.map(analyzedCharacters, (character) => _.join([character.name, character.description], REFACTOR_CONSTANTS.VD_BLANK)), "\n"),
              characterPrompt: _.get(_.first(analyzedCharacters), "prompt", REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              characterImages: [],
              characterExtracted: false,
              characterConsistency: !_.isEmpty(analyzedCharacters),
            },
          };
          await syncProject(newProj);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE_SUCCESS);
        }
      }

      if (!isStoryboardCached) {
        const storyboardStyle = currentStylePreset;
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SPLIT);
        appendLog(T.logStoryboardRequestDetail(config.splitStrategy, !_.isEmpty(config.referenceImages)));
        const storyboardPayload = {
          rewrittenScript: realScript,
          chapters,
          config: {
            ...newProj.config,
            ...newProj.voiceConfig,
            visualStylePreset: newProj.visualConfig.style,
            aspectRatio: newProj.visualConfig.aspectRatio,
            imageQuality: newProj.visualConfig.quality,
          },
          visualStyle: storyboardStyle,
          referenceImages: _.compact(_.concat(
            _.castArray(config.referenceImages || []),
            _.castArray(config.sceneReferenceImages || []),
            _.castArray(newProj.visualConfig?.styleReferenceImages || []),
          )),
          referenceStyle: storyboardStyle,
          referenceCharacters: jsonUtils.safeStringify(_.map(analyzedCharacters, (character) => ({
            name: character.name,
            description: character.prompt || character.description,
          }))),
          visualDensity: 5,
          bypassCache: true,
        };

        const storyboardRes = await safeSystemFetch(API_ROUTES.PIPELINE_STORYBOARD, storyboardPayload, requestSignal);
        throwIfCancelled();
        const storyboardAvailable = Boolean(storyboardRes.success && storyboardRes.data && !storyboardRes.data.error);
        realScenes = storyboardAvailable
          ? (storyboardRes.data.scenes || []) as StoryboardScene[]
          : [];
        const generatedVisualBible = storyboardAvailable
          ? storyboardRes.data.visualBible as VisualBible
          : newProj.visualBible;
        const visualBible: VisualBible = {
          ...generatedVisualBible,
          visualStyle: currentStylePreset,
          styleProfile: newProj.visualBible?.styleProfile,
          styleFingerprint: newProj.visualConfig.styleFingerprint,
          styleReferenceLocked: hasStyleReferences,
          locations: _.defaultTo(generatedVisualBible?.locations, []),
          props: _.defaultTo(generatedVisualBible?.props, []),
        };
        if (_.isEmpty(realScenes)) {
          realScenes = createScriptGroundedStoryboard({
            rewrittenScript: realScript,
            chapters,
            splitStrategy: config.splitStrategy as SplitStrategy,
            aspectRatio: config.aspectRatio,
            targetStyle: storyboardStyle,
            visualBible,
          });
          appendLog(storyboardRes.error || storyboardRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_STORYBOARD_SPLIT);
          appendLog(REFACTOR_CONSTANTS.WARN_STORYBOARD_QA_RESULT);
        }
        if (_.isEmpty(realScenes)) throw new Error(AUTO_GENERATOR_CONSTANTS.ERR_NO_SCENES_CREATED);
        realScenes = ensureStoryboardScriptCoverage(realScenes, {
          rewrittenScript: realScript,
          chapters,
          splitStrategy: config.splitStrategy as SplitStrategy,
          aspectRatio: config.aspectRatio,
          targetStyle: storyboardStyle,
          visualBible,
        });
        const storyboardQa = storyboardAvailable
          ? storyboardRes.data.storyboardQa as StoryboardQualityReport | undefined
          : undefined;
        if (!storyboardQa?.passed) appendLog(REFACTOR_CONSTANTS.WARN_STORYBOARD_QA_RESULT);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, String(realScenes.length)));
        appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);

        const audioCueSheet = applyOptionalMusicAsset(createAudioCueSheet(realScenes), config.musicAssetUrl);
        const storyboardUpdatedProj = { ...newProj, scriptRewritten: realScript, factCheckNotes, chapters, storyboard: realScenes as VideoProject["storyboard"], visualBible, storyboardQa, audioCueSheet };
        await syncProject(storyboardUpdatedProj);
        newProj = storyboardUpdatedProj;
      }
      if (isStoryboardCached && newProj.audioCueSheet) {
        newProj = {
          ...newProj,
          audioCueSheet: applyOptionalMusicAsset(newProj.audioCueSheet, config.musicAssetUrl),
        };
      }

      realScenes = _.map(realScenes, scene => ({
        ...scene,
        characterIds: resolveSceneCharacterIds(scene, analyzedCharacters),
      }));
      const referenceContinuityReport = validateVisualContinuity(realScenes, analyzedCharacters, newProj.visualBible);
      if (!referenceContinuityReport.passed) appendLog(_.join(referenceContinuityReport.blockingErrors, REFACTOR_CONSTANTS.VD_BLANK));

      let globalAudioBase64: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let globalAudioUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let isVoiceCached = false;
      const voicePayload = {
        text: realScript,
        voiceURI: config.voiceURI,
        voice_id: config.voiceURI,
        provider: config.voiceProvider,
        speed: config.voiceSpeed,
        pitch: config.voicePitch,
        volume: config.voiceVolume,
        gender: Gender.Male,
        age: AgeGroup.Adult,
        emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL,
      };
      const generatePipelineVoice = () => generateDirectedVoice({
        text: realScript,
        voiceArc: DEFAULT_VOICE_ARC,
        basePayload: voicePayload,
        signal: requestSignal,
      });

      if (config.resumeMode && !config.forceRegenerateVoice && !invalidationState.regenerateVoice) {
        const cachedVoiceAudio = await fetchCachedVoiceAudio(newProj.voiceConfig);
        if (cachedVoiceAudio.isCached) {
          globalAudioBase64 = cachedVoiceAudio.audioBase64;
          globalAudioUrl = cachedVoiceAudio.audioUrl;
          isVoiceCached = true;
          appendLog(T.logResumeVoice);
          appendLog(T.logVoiceResultDetail(!_.isEmpty(globalAudioUrl) ? "audio URL" : "base64"));
          setStepProgress(REFACTOR_CONSTANTS.AUTO_PROGRESS_VOICE_COMPLETE);
        }
      }

      let voiceUpdatedProj = newProj;
      if (!isVoiceCached) {
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.VOICE_START);
        setCurrentStepIndex(2);

        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_GEN_TTS.replace(SecurityConstants.PLACEHOLDER_0, config.voiceName || "Mặc định"));
        appendLog(T.logVoiceRequestDetail(config.voiceProvider, config.voiceName, _.size(realScript)));
        const directedVoice = await generatePipelineVoice();
        throwIfCancelled();
        globalAudioBase64 = directedVoice.audioBase64;
        globalAudioUrl = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_TTS_SUCCESS);
        appendLog(T.logVoiceResultDetail(!_.isEmpty(globalAudioUrl) ? "audio URL" : "base64"));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.VOICE_DONE);

        voiceUpdatedProj = {
          ...newProj,
          storyboard: realScenes as VideoProject["storyboard"],
          voiceConfig: {
            ...newProj.voiceConfig,
            audioType: AudioType.TTS,
            provider: directedVoice.provider || config.voiceProvider,
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl,
            voiceArc: DEFAULT_VOICE_ARC,
          } as VoiceConfig,
        };
        await syncProject(voiceUpdatedProj);
      } else {
        voiceUpdatedProj = {
          ...newProj,
          storyboard: realScenes as VideoProject["storyboard"],
          voiceConfig: {
            ...newProj.voiceConfig,
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl,
          } as VoiceConfig,
        };
      }

      const hasCachedAlignment = config.resumeMode && !config.forceRegenerateVoice && hasCompleteSceneAlignment(realScenes as StoryboardScene[]);
      let alignmentCompleted = hasCachedAlignment;
      const alignmentRequest = globalAudioBase64 && !hasCachedAlignment
        ? (() => {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_START);
          appendLog(T.logAlignmentPlan(_.size(realScenes)));
          return alignVoiceTimeline({
            audioBase64: globalAudioBase64,
            scenes: realScenes as StoryboardScene[],
            projectId: newProj?.id,
            projectName: newProj?.name,
            signal: requestSignal,
          });
        })()
        : null;

      if (alignmentRequest) {
        try {
          const alignmentResult = await alignmentRequest;
          realScenes = alignmentResult.scenes;
          voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"] };
          await syncProject(voiceUpdatedProj);
          alignmentCompleted = true;
          if (alignmentResult.warning) appendLog(alignmentResult.warning);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_SUCCESS);
        } catch (audioError: unknown) {
          logger.error(T.errAudioAlignBackend, audioError);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_ERROR + (audioError instanceof Error ? audioError.message : REFACTOR_CONSTANTS.VD_EMPTY_STRING));
          appendLog(AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
        }
      }

      appendLog(T.logReferenceSummary(
        _.size(config.referenceImages),
        _.size(config.sceneReferenceImages),
        SecurityConstants.ZERO,
      ));

      if (!isStoryboardCached || config.forceRegenerateScenes || shouldRegenerateSceneAssets || didAnalyzeCharacters || requiresVisualReferenceMigration) {
        voiceUpdatedProj = {
          ...voiceUpdatedProj,
          visualConfig: {
            ...voiceUpdatedProj.visualConfig,
            style: currentStylePreset,
            styleReferenceImages: newProj.visualConfig.styleReferenceImages,
            sceneReferenceImages: newProj.visualConfig.sceneReferenceImages,
            referenceImages: _.take(_.uniq(_.concat(newProj.visualConfig.styleReferenceImages, newProj.visualConfig.sceneReferenceImages)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
            referencePrompt: currentStylePreset,
            thumbnailReferencePrompt: currentThumbnailStyle,
            styleBackgroundMode: config.styleBackgroundMode,
            thumbnailBackgroundMode: config.thumbnailBackgroundMode,
            styleTextInImageMode: config.styleTextInImageMode,
            thumbnailTextInImageMode: config.thumbnailTextInImageMode,
            imageFocusMode: config.imageFocusMode,
            thumbnailImageFocusMode: config.thumbnailImageFocusMode,
          },
        };
        await syncProject(voiceUpdatedProj);

        voiceUpdatedProj = {
          ...voiceUpdatedProj,
          visualConfig: {
            ...voiceUpdatedProj.visualConfig,
            characters: analyzedCharacters,
            characterImages: [],
            characterExtracted: false,
            characterConsistency: !_.isEmpty(analyzedCharacters),
          },
        };
        await syncProject(voiceUpdatedProj);

        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE);
        const optimizeRes = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, {
          storyboard: realScenes,
          visualConfig: voiceUpdatedProj.visualConfig,
          visualBible: voiceUpdatedProj.visualBible,
          aspectRatio: config.aspectRatio,
          language: config.language,
          promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION,
          bypassCache: true,
        }, requestSignal);
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          const styleIdentityChanged = !_.isEqual(currentStylePreset, existingTargetProj?.visualConfig?.style);
          shouldRegenerateSceneAssets = shouldRegenerateSceneAssets || requiresVisualReferenceMigration || didAnalyzeCharacters || styleIdentityChanged;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE_SUCCESS);
        } else {
          appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle = createThumbnailStyleDirective(
          voiceUpdatedProj.visualBible?.styleProfile,
          voiceUpdatedProj.visualConfig?.thumbnailStyleProfile,
        ) || voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || config.thumbnailStylePreset;
      }

      realScenes = applyProfessionalEditingPolicy(realScenes as StoryboardScene[], voiceUpdatedProj.visualBible);
      realScenes = _.map(realScenes as StoryboardScene[], scene => ({
        ...scene,
        prompt: appendImagePromptAspectRatio(scene.prompt || "", config.aspectRatio),
      }));
      const imagePromptQa = evaluateImagePrompts(realScenes as StoryboardScene[], {
        backgroundMode: config.styleBackgroundMode,
        textMode: config.styleTextInImageMode,
        targetStyle: currentStylePreset,
        characters: voiceUpdatedProj.visualConfig.characters,
        visualBible: voiceUpdatedProj.visualBible,
      }) as ImagePromptQualityReport;
      voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], imagePromptQa };
      await syncProject(voiceUpdatedProj);

      const resolvedVisualConfig = resolveVisualConfig({
        ...voiceUpdatedProj.visualConfig,
        generationMode: config.generationMode,
        imageGeneratorEngine: config.imageGeneratorEngine,
        generateType: config.generateType,
        maxVideoScenes: config.maxVideoScenes,
        videoDuration: config.videoDuration,
      });
      if (resolvedVisualConfig.blocked) {
        throw new Error(REFACTOR_CONSTANTS.ERR_VISUAL_CONFIG_BLOCKED);
      }
      const executionVisualConfig = resolvedVisualConfig.config;
      voiceUpdatedProj = {
        ...voiceUpdatedProj,
        visualConfig: executionVisualConfig,
      };
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_PREPARE);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)
        ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM
        : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_GEN.replace(SecurityConstants.PLACEHOLDER_0, modeName));

      const visualConfigPayload = {
        ...executionVisualConfig,
        aspectRatio: config.aspectRatio,
        chromeHeadless: config.chromeHeadless,
        geminiChatSpeed: config.geminiChatSpeed,
        style: currentStylePreset,
        qualityMode: _.defaultTo(voiceUpdatedProj.visualConfig.qualityMode, QualityMode.Balanced),
        generateCount: resolveQualityProfile(voiceUpdatedProj.visualConfig.qualityMode).draftCandidates,
        sceneReferenceImages: config.sceneReferenceImages,
        referenceImages: _.take(_.uniq(_.concat(config.referenceImages, config.sceneReferenceImages)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
        contentLanguage: config.language,
      };

      const sandboxConfigPayload = { projectId: voiceUpdatedProj.id };
      const cachedSeoData = config.resumeMode && !invalidationState.regenerateSeo && newProj.seo
        ? newProj.seo
        : null;
      const seoRequest = cachedSeoData
        ? null
        : (() => {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_OPTIMIZE);
          return safeSystemFetch(API_ROUTES.PIPELINE_SEO, {
            originalInput: config.scriptContent,
            config: voiceUpdatedProj.config,
            seoConfig: voiceUpdatedProj.seoConfig,
            rewrittenScript: realScript,
            bypassCache: true,
          }, requestSignal);
        })();
      const shouldRegenerateThumbnails = Boolean(config.forceRegenerateScenes)
        || invalidationState.regenerateThumbnails;
      let preparedSeoData: unknown = cachedSeoData;

      if (!preparedSeoData && seoRequest) {
        const seoRes = await seoRequest;
        preparedSeoData = seoRes.success && seoRes.data
          ? seoRes.data
          : createSourceGroundedSeo(realScript, newProj.seoConfig);
      }

      const visualDependencies = {
        ..._.pick(voiceUpdatedProj.visualConfig, ["style", "stylePreset", "imageGeneratorEngine", "aspectRatio", "styleBackgroundMode", "styleTextInImageMode", "imageFocusMode", "generateType"]),
        promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION,
      };
      const previousScenes = _.keyBy(_.defaultTo(existingTargetProj?.storyboard, []), "id");
      realScenes = _.map(realScenes as StoryboardScene[], scene => {
        const sceneWithDependency = {
          ...scene,
          dependencyHash: createSceneDependencyHash(scene, visualDependencies),
        };
        if (config.forceRegenerateScenes) {
          return {
            ...clearSceneVisualAsset(sceneWithDependency),
            dependencyHash: sceneWithDependency.dependencyHash,
          };
        }
        return inheritApprovedSceneAsset(sceneWithDependency, previousScenes[scene.id]);
      });
      const targetScenesToGen = _.filter(realScenes as VideoProject["storyboard"], (sc) => {
        if (config.forceRegenerateScenes) return true;
        if (config.resumeMode && !shouldRegenerateSceneAssets && hasSceneAsset(sc)) return false;
        return true;
      });
      _.forEach(targetScenesToGen, (scene) => {
        scene.assetStatus = SceneAssetStatus.Generating;
        scene.assetError = undefined;
      });
      appendLog(T.logMediaPlan(
        _.size(targetScenesToGen),
        _.subtract(_.size(realScenes), _.size(targetScenesToGen)),
        executionVisualConfig.generateType,
      ));
      const existingVideoCount = _.size(_.filter(
        realScenes as VideoProject["storyboard"],
        (scene) => _.isEqual(scene.assetType, GenerateType.Video) && hasSceneAsset(scene),
      ));
      const remainingVideoSlots = _.max([_.subtract(_.defaultTo(executionVisualConfig.maxVideoScenes, SecurityConstants.ZERO), existingVideoCount), SecurityConstants.ZERO])!;
      const videoSceneIds = await selectVideoSceneIds(targetScenesToGen, executionVisualConfig.generateType, remainingVideoSlots);

      if (config.resumeMode && !shouldRegenerateSceneAssets) {
        (realScenes as VideoProject["storyboard"])!.forEach((sc, idx) => {
          if (hasSceneAsset(sc)) {
            appendLog(T.logResumeSceneSkip(idx + 1, realScenes.length));
          }
        });
      }

      let imageCheckpointQueue = Promise.resolve();
      const persistImageCheckpoint = (): Promise<void> => {
        const checkpointProject = {
          ...voiceUpdatedProj,
          storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"],
          thumbnails: voiceUpdatedProj.thumbnails,
        };
        imageCheckpointQueue = imageCheckpointQueue.then(() => syncProject(checkpointProject));
        return imageCheckpointQueue;
      };

      const hasReferenceImages = Boolean(
        !_.isEmpty(voiceUpdatedProj.visualConfig?.referenceImages) ||
        !_.isEmpty(voiceUpdatedProj.visualConfig?.sceneReferenceImages) ||
        !_.isEmpty(voiceUpdatedProj.visualConfig?.styleReferenceImages)
      );

      const createSceneRequestContext = (scene: StoryboardScene) => {
        const context = createSceneGenerationContext(
          scene,
          voiceUpdatedProj.visualConfig,
        );
        const compiledPrompt = compileImagePrompt(scene, {
          referenceLocked: hasReferenceImages,
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          visualBible: voiceUpdatedProj.visualBible,
          characters: voiceUpdatedProj.visualConfig?.characters,
        });
        return {
          ...context,
          prompt: adaptImagePromptForEngine(
            compiledPrompt,
            executionVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
            config.aspectRatio,
          ),
        };
      };

      if (!_.isEmpty(targetScenesToGen)) {
        const runSequentialGeneration = async (scenesToProcess: StoryboardScene[], isFallback = false): Promise<void> => {
          for (let i = 0; i < scenesToProcess.length; i++) {
            throwIfCancelled();
            const sc = scenesToProcess[i];
            if (hasSceneAsset(sc)) continue;

            const requestContext = createSceneRequestContext(sc);
            sc.generationPrompt = requestContext.prompt;
            const sceneGenerateType = resolveSceneGenerateType(sc.id, executionVisualConfig.generateType, videoSceneIds);

            if (isFallback) {
              appendLog(T.logFallbackProgress(i + 1, scenesToProcess.length));
            } else {
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_SCENE_GEN
                .replace(SecurityConstants.PLACEHOLDER_0, String(i + 1))
                .replace(SecurityConstants.PLACEHOLDER_1, String(scenesToProcess.length)));
            }

            try {
              const imageResult = await generateProjectImageOnce({
                sceneId: sc.id,
                prompt: requestContext.prompt,
                referenceImages: requestContext.referenceImages,
                generateType: sceneGenerateType,
              }, () => ({
                prompt: requestContext.prompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: false,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: visualConfigPayload ? { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: sceneGenerateType } : visualConfigPayload,
              }), requestSignal);

              if (imageResult.success) {
                const base64Val = imageResult.base64;
                const fallbackUrl = imageResult.fallbackUrl;
                if (base64Val) {
                  const dataUrl = _.join([
                    _.isEqual(sceneGenerateType, GenerateType.Video) ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX,
                    base64Val,
                  ], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                  sc.assetUrl = dataUrl;
                  sc.assetUrls = [dataUrl];
                } else if (fallbackUrl) {
                  sc.assetUrl = fallbackUrl;
                  sc.assetUrls = [fallbackUrl];
                }
                sc.assetType = sceneGenerateType;
                sc.assetStatus = SceneAssetStatus.Generated;
                appendAssetRevision(sc, sc.assetUrl, SceneAssetStatus.Generated);
                sc.assetError = undefined;
                await persistImageCheckpoint();
              } else {
                throw new Error(_.defaultTo(imageResult.warning, REFACTOR_CONSTANTS.ERR_UNKNOWN));
              }
            } catch (error) {
              sc.assetStatus = SceneAssetStatus.Failed;
              sc.assetError = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_UNKNOWN;
              appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
            }
          }
        };

        if (_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)) {
          appendLog(T.logBatchImageStreamStart);
          const sceneBatchItems = _.map(targetScenesToGen, (scene) => {
            const requestContext = createSceneRequestContext(scene);
            scene.generationPrompt = requestContext.prompt;
            return {
              sceneId: scene.id,
              idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash], ":"),
              prompt: requestContext.prompt,
              referenceImages: requestContext.referenceImages,
              continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
              generateType: resolveSceneGenerateType(scene.id, executionVisualConfig.generateType, videoSceneIds),
            };
          });
          const batchItems = sceneBatchItems;
          let completedCount = SecurityConstants.ZERO;
          let batchFailureCount = SecurityConstants.ZERO;

          const applyResult = (result: ProjectImageResult) => {
            const imageUrl = createProjectImageUrl(result);
            const scene = _.find(realScenes as VideoProject["storyboard"], (item) => _.isEqual(item.id, result.sceneId));
            if (_.every([scene, !_.isEmpty(imageUrl)], Boolean)) {
              scene!.assetUrl = imageUrl;
              scene!.assetUrls = [imageUrl];
              scene!.assetType = result.assetType || GenerateType.Image;
              scene!.assetStatus = SceneAssetStatus.Generated;
              appendAssetRevision(scene!, imageUrl, SceneAssetStatus.Generated);
              scene!.assetError = undefined;
              completedCount = _.add(completedCount, SecurityConstants.DEFAULT_AMOUNT);
              const totalScenes = _.size(targetScenesToGen);
              appendLog(T.logBatchImageSceneSuccess(result.sceneId, completedCount, totalScenes));
              void persistImageCheckpoint();
            }
          };

          try {
            const generationSummary = await generateProjectImages({
              items: batchItems,
              visualConfig: visualConfigPayload,
              style: currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              onBatchResult: (result) => {
                if (result.success) { applyResult(result); return; }
                batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                const failureReason = _.defaultTo(result.warning, REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR);
                const failedScene = _.find(realScenes as VideoProject["storyboard"], (item) => _.isEqual(item.id, result.sceneId));
                if (failedScene && !hasSceneAsset(failedScene)) {
                  failedScene.assetStatus = SceneAssetStatus.Failed;
                  failedScene.assetError = failureReason;
                }
                void persistImageCheckpoint();
              },
            });
            if (generationSummary.cancelled) {
              throw new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_CANCELLED);
            }
            appendLog(T.logImageGenerationSummary(completedCount, batchFailureCount, _.size(batchItems)));

            const missingScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene));
            if (!_.isEmpty(missingScenes) && !cancellationRef.current) {
              appendLog(T.logBatchFailuresSummary(_.size(missingScenes), _.size(targetScenesToGen), "chuyển sang tạo dự phòng tuần tự"));
              await runSequentialGeneration(missingScenes, true);
            }
          } catch (generationError) {
            if (cancellationRef.current) throw generationError;
            const failureReason = generationError instanceof Error
              ? generationError.message
              : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
            appendLog(T.logBatchStreamErrorFallback(failureReason));
            const missingScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene));
            if (!_.isEmpty(missingScenes)) {
              await runSequentialGeneration(missingScenes, true);
            }
          } finally {
            await imageCheckpointQueue;
          }
        } else {
          await runSequentialGeneration(targetScenesToGen, false);
        }
      }
      const technicallyValidScenes = _.filter(realScenes as StoryboardScene[], scene => hasSceneAsset(scene));
      const validationSceneIds = new Set(_.map(technicallyValidScenes, "id"));
      _.forEach(technicallyValidScenes, scene => {
        scene.assetStatus = SceneAssetStatus.Approved;
        scene.qaStatus = QaStatus.Unavailable;
        scene.acceptance = AssetAcceptance.AcceptedWithWarning;
        scene.assetError = "visual_qa_unavailable";
        const revision = _.findLast(scene.assetRevisions);
        if (revision) {
          revision.status = SceneAssetStatus.Approved;
          revision.approvedAt = new Date().toISOString();
        }
      });
      await persistImageCheckpoint();

      const approvedImageScenes = _.filter(technicallyValidScenes, scene => _.every([
        scene.assetType !== GenerateType.Video,
        scene.assetStatus === SceneAssetStatus.Approved,
      ], Boolean));
      await upscaleApprovedSceneAssets({
        scenes: approvedImageScenes,
        validatedSceneIds: validationSceneIds,
        qualityMode: executionVisualConfig.qualityMode,
        persistAsset: async (dataUrl) => {
          const persisted = await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${voiceUpdatedProj.id}/${REFERENCE_ASSET_GROUP.UPSCALED}`, { images: [dataUrl] }, requestSignal);
          const persistedAssetUrl = _.toString(_.first(_.castArray(persisted.data?.assets)));
          return _.isEmpty(persistedAssetUrl) ? dataUrl : persistedAssetUrl;
        },
        persistCheckpoint: persistImageCheckpoint,
        onLog: appendLog,
      });
      const sceneAssetSummary = getSceneAssetSummary(realScenes as StoryboardScene[]);
      if (!sceneAssetSummary.complete) {
        await syncProject({
          ...voiceUpdatedProj,
          status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
          storyboard: realScenes as VideoProject["storyboard"],
        });
        throw new Error(_.replace(
          REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_INCOMPLETE,
          SecurityConstants.PLACEHOLDER_0,
          _.toString(_.size(sceneAssetSummary.missingSceneIds)),
        ));
      }
      appendLog(AUTO_GENERATOR_CONSTANTS.API_IMAGE_SUCCESS);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);

      const imageUpdatedProj = {
        ...voiceUpdatedProj,
        storyboard: realScenes as VideoProject["storyboard"],
        thumbnails: voiceUpdatedProj.thumbnails,
      };
      await syncProject(imageUpdatedProj);

      let seoData: unknown = preparedSeoData;
      if (cachedSeoData) {
        appendLog(T.logResumeSeo);
      }

      if (!preparedSeoData) {
        const seoRes = await seoRequest;
        if (seoRes.success && seoRes.data) {
          seoData = seoRes.data;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_SUCCESS);
        } else {
          seoData = createSourceGroundedSeo(realScript, newProj.seoConfig);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_FAILED);
        }
      }

      let thumbnailsList: ThumbnailItem[] = [];
      let isThumbsCached = false;
      let existingThumbs: ThumbnailItem[] = [];
      if (config.resumeMode && !shouldRegenerateThumbnails && !_.isEmpty(newProj.thumbnails)) {
        existingThumbs = newProj.thumbnails!;
        if (_.every(existingThumbs, (t) => !_.isEmpty(t.imageUrl))) {
          thumbnailsList = existingThumbs;
          isThumbsCached = true;
          appendLog(T.logResumeThumbnails);
        }
      }

      if (!isThumbsCached) {
        let parsedThumbs: ThumbnailItem[] = [];

        if (config.resumeMode && !shouldRegenerateThumbnails && !_.isEmpty(existingThumbs)) {
          parsedThumbs = existingThumbs;
          appendLog(T.logResumeThumbnails);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
          const thumbPayload = {
            rewrittenScript: realScript,
            config: imageUpdatedProj.config,
            visualConfig: { ...imageUpdatedProj.visualConfig, thumbnailReferencePrompt: currentThumbnailStyle },
            bypassCache: true,
          };
          const thumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_THUMBNAILS, thumbPayload, requestSignal);
          if (thumbRes.success && thumbRes.data?.thumbnails) {
            parsedThumbs = thumbRes.data.thumbnails;
          }
        }

        if (!_.isEmpty(parsedThumbs)) {
          if (_.isEmpty(existingThumbs) || shouldRegenerateThumbnails) {
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_IDEAS_CREATED, SecurityConstants.PLACEHOLDER_0, _.toString(parsedThumbs.length)));
          }
          const targetThumbsToGen = _.filter(parsedThumbs, (thumb) => {
            if (config.resumeMode && !shouldRegenerateThumbnails && !_.isEmpty(thumb.imageUrl)) return false;
            return true;
          });
          const thumbnailReferenceImages = resolveThumbnailReferenceImages(imageUpdatedProj.visualConfig);

          if (config.resumeMode && !shouldRegenerateThumbnails) {
            _.forEach(parsedThumbs, (thumb, idx) => {
              if (!_.isEmpty(thumb.imageUrl)) {
                appendLog(T.logResumeSceneSkip(idx + 1, parsedThumbs.length));
              }
            });
          }

          if (!_.isEmpty(targetThumbsToGen)) {
            if (_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)) {
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_START);

              const batchThumbItems = _.map(targetThumbsToGen, (thumb) => {
                const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                const thumbPrompt = createThumbnailGenerationPrompt(thumb, thumbnailStyle, config.aspectRatio, !_.isEmpty(thumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
                const generationPrompt = thumbPrompt;
                thumb.generationPrompt = generationPrompt;
                return {
                  sceneId: thumb.id,
                  prompt: generationPrompt,
                  generateType: GenerateType.Image,
                  referenceImages: thumbnailReferenceImages,
                  continuityKey: createThumbnailContinuityKey(),
                };
              });

              let completedCount = SecurityConstants.ZERO;
              let batchFailureCount = SecurityConstants.ZERO;
              const applyThumbResult = (result: ProjectImageResult) => {
                const imageUrl = createProjectImageUrl(result);
                const thumb = _.find(parsedThumbs, (item) => _.isEqual(item.id, result.sceneId));
                if (thumb && !_.isEmpty(imageUrl)) {
                  thumb.imageUrl = imageUrl;
                  completedCount = _.add(completedCount, SecurityConstants.DEFAULT_AMOUNT);
                  appendLog(
                    _.replace(
                      _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_SUCCESS, SecurityConstants.PLACEHOLDER_0, _.toString(completedCount)),
                      SecurityConstants.PLACEHOLDER_1,
                      _.toString(targetThumbsToGen.length)
                    )
                  );
                }
              };

              const thumbnailGenerationSummary = await generateProjectImages({
                items: batchThumbItems,
                visualConfig: { ...visualConfigPayload, style: currentThumbnailStyle || currentStylePreset, referenceImages: thumbnailReferenceImages, batchTabCount: _.size(targetThumbsToGen) },
                style: currentThumbnailStyle || currentStylePreset,
                sandboxConfig: sandboxConfigPayload,
                cancelRef: cancellationRef,
                onBatchResult: (result) => {
                  if (result.success) { applyThumbResult(result); return; }
                  batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                },
              });
              if (thumbnailGenerationSummary.cancelled) {
                throw new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_CANCELLED);
              }
            } else {
              for (let i = 0; i < targetThumbsToGen.length; i++) {
                const thumb = targetThumbsToGen[i];
                appendLog(_.replace(
                  _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SCENE_GEN, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1)),
                  SecurityConstants.PLACEHOLDER_1,
                  _.toString(targetThumbsToGen.length),
                ));
                const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                const thumbPrompt = createThumbnailGenerationPrompt(thumb, thumbnailStyle, config.aspectRatio, !_.isEmpty(thumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
                const finalThumbPrompt = thumbPrompt;
                thumb.generationPrompt = finalThumbPrompt;

                try {
                  const renderThumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                    prompt: finalThumbPrompt,
                    style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)),
                    resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                    bypassCache: true,
                    engine: _.defaultTo(voiceUpdatedProj.visualConfig.imageGeneratorEngine, ImageGeneratorEngine.Imagen),
                    sandboxConfig: sandboxConfigPayload,
                    visualConfig: { ...visualConfigPayload, style: thumbnailStyle, referenceImages: thumbnailReferenceImages },
                  }, requestSignal);
                  let imgUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
                  if (renderThumbRes.success && renderThumbRes.data?.base64) {
                    imgUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, renderThumbRes.data.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                  } else if (renderThumbRes.data?.fallbackUrl) {
                    imgUrl = renderThumbRes.data.fallbackUrl;
                  }

                  const targetThumb = _.find(parsedThumbs, { id: thumb.id });
                  if (targetThumb) targetThumb.imageUrl = imgUrl;
                } catch {
                  appendLog(
                    _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_WARNING_SINGLE, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1))
                  );
                }
              }
            }
          }
          thumbnailsList = parsedThumbs;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SUCCESS);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_FAILED);
        }
      }
      const completedThumbnailCount = _.size(_.filter(
        thumbnailsList,
        (thumbnail) => !_.isEmpty(thumbnail.imageUrl),
      ));
      if (_.lt(completedThumbnailCount, config.thumbnailCount)) appendLog(_.replace(
        REFACTOR_CONSTANTS.THUMBNAIL_GENERATION_INCOMPLETE,
        SecurityConstants.PLACEHOLDER_0,
        _.toString(_.subtract(config.thumbnailCount, completedThumbnailCount)),
      ));
      for (const thumbnail of thumbnailsList) {
        if (!isUsableGeneratedAssetUrl(thumbnail.imageUrl)) {
          thumbnail.approved = false;
          continue;
        }
        Object.assign(thumbnail, acceptGeneratedThumbnail(thumbnail));
      }
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(
        _.size(_.get(seoData, "titles", [])),
        _.size(thumbnailsList),
      ));

      let slicedUpdatedProj: VideoProject = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList, storyboard: realScenes as VideoProject["storyboard"] };
      if (globalAudioBase64 && alignmentCompleted) {
        appendLog(T.logResumeAlignment);
      }
      await syncProject(slicedUpdatedProj);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE);

      const voiceQualityResult = await assessVoiceAdvisory({
        audioBase64: globalAudioBase64,
        audioUrl: globalAudioUrl,
        provider: _.toString(voiceUpdatedProj.voiceConfig.provider || config.voiceProvider),
        scenes: realScenes as StoryboardScene[],
        targetDurationSeconds: calculateSceneDuration(realScenes as StoryboardScene[]),
      });
      globalAudioBase64 = voiceQualityResult.audioBase64;
      globalAudioUrl = voiceQualityResult.audioUrl;
      realScenes = voiceQualityResult.scenes;

      slicedUpdatedProj = {
        ...slicedUpdatedProj,
        audioCueSheet: applyOptionalMusicAsset(createAudioCueSheet(realScenes), config.musicAssetUrl),
      };

      realScenes = createSubtitleCues(realScenes as StoryboardScene[]);
      const subtitleQa = evaluateSubtitles(realScenes as StoryboardScene[]);
      const editorQa = evaluateEdit(realScenes as StoryboardScene[]);
      slicedUpdatedProj = {
        ...slicedUpdatedProj,
        storyboard: realScenes as VideoProject["storyboard"],
        subtitleQa,
        editorQa,
        voiceConfig: {
          ...slicedUpdatedProj.voiceConfig,
          audioBase64: globalAudioBase64,
          audioUrl: globalAudioUrl,
          provider: voiceQualityResult.provider,
          voiceArc: DEFAULT_VOICE_ARC,
          audioQa: voiceQualityResult.quality,
        },
      };
      await syncProject(slicedUpdatedProj);

      setCurrentStepIndex(4);
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_GEN);

      const expectedRenderDuration = calculateSceneDuration(realScenes as StoryboardScene[]);
      appendLog(T.logRenderPlan(
        _.size(realScenes),
        expectedRenderDuration,
        !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl),
      ));

      const renderPayload = {
        projectId: newProj.id,
        scenes: _.map(realScenes as VideoProject["storyboard"], (sc) => ({
          id: _.get(sc, REFACTOR_CONSTANTS.AVG_ID_KEY),
          duration: _.get(sc, "duration") || AUTO_GENERATOR_CONSTANTS.DEFAULT_SCENE_DURATION,
          imageUrl: _.get(sc, "assetUrl"),
          audioBase64: _.get(sc, "audioBase64"),
          text: _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
          subtitle: sc.subtitle || sc.script,
          subtitleCues: sc.subtitleCues,
          assetType: _.get(sc, REFACTOR_CONSTANTS.AVG_ASSET_TYPE_KEY, GenerateType.Image),
          cameraMotion: _.get(sc, "cameraMotion"),
          effects: _.get(sc, "effects"),
          lightingEffect: _.get(sc, "lightingEffect"),
          transition: _.get(sc, "transition"),
        })),
        quality: config.ffmpegQuality,
        globalAudioUrl: globalAudioUrl || undefined,
        globalAudioBase64: globalAudioBase64 || undefined,
        aspectRatio: _.isEqual(config.aspectRatio, AspectRatio.NineSixteen)
          ? FFMPEG_RENDER_CONSTANTS.ASPECT_RATIO_9_16
          : REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_16_9,
        subtitleMode: FFMPEG_RENDER_CONSTANTS.DEFAULT_SUBTITLE_MODE,
        audioTracks: createRenderAudioTracks(slicedUpdatedProj.audioCueSheet),
      };

      throwIfCancelled();
      const renderRes = await fetch(API_ROUTES.PIPELINE_FFMPEG_RENDER, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: {
          [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON,
          [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING,
        },
        body: jsonUtils.safeStringify(renderPayload),
        signal: requestSignal,
      });

      const renderText = await renderRes.text();
      const renderData = jsonUtils.safeParse<{ success: boolean; jobId?: string; error?: string }>(renderText, { success: false });

      if (renderData.success && renderData.jobId) {
        const jobId = renderData.jobId;
        activeRenderJobIdRef.current = jobId;
        appendLog(T.logRenderJob(jobId));
        let lastLoggedProgress: number | null = null;
        let renderPending = true;
        let renderStatusFailureCount = SecurityConstants.ZERO;
        while (renderPending) {
          throwIfCancelled();
          let statusData: { success: boolean; status: string; progress?: number; url?: string; error?: string };
          try {
            const statusRes = await fetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER_STATUS}${jobId}`, {
              headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING },
              signal: requestSignal,
            });
            if (!statusRes.ok) throw new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED);
            statusData = await statusRes.json();
            renderStatusFailureCount = SecurityConstants.ZERO;
          } catch (statusError) {
            renderStatusFailureCount = _.add(renderStatusFailureCount, SecurityConstants.DEFAULT_AMOUNT);
            if (_.gt(renderStatusFailureCount, REFACTOR_CONSTANTS.RENDER_STATUS_MAX_RETRIES)) throw statusError;
            appendLog(`${REFACTOR_CONSTANTS.MSG_RENDER_STATUS_RETRY_PREFIX}${renderStatusFailureCount}/${REFACTOR_CONSTANTS.RENDER_STATUS_MAX_RETRIES}`);
            await new Promise(resolve => { window.setTimeout(resolve, REFACTOR_CONSTANTS.RENDER_STATUS_RETRY_BASE_MS * renderStatusFailureCount); });
            continue;
          }
          if (!statusData.success) throw new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED);

          if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_COMPLETED)) {
            renderPending = false;
            activeRenderJobIdRef.current = null;
            const finalMultimodalQa = createAdvisoryFinalVideoReport();
            const renderCandidateBase: VideoProject = {
              ...slicedUpdatedProj,
              seo: _.defaultTo(seoData as VideoProject["seo"], undefined),
              thumbnails: _.defaultTo(thumbnailsList, undefined),
              renderedVideoUrl: statusData.url,
              finalMultimodalQa,
            };
            const renderCandidateProj: VideoProject = {
              ...renderCandidateBase,
              manualReviewItems: createManualReviewItems(renderCandidateBase),
            };
            const finalQc = evaluateFinalQuality(renderCandidateProj);
            const benchmark = createPipelineBenchmark(renderCandidateProj, pipelineStartedAt);
            const shadowComparison = renderCandidateProj.rollout?.shadowMode ? createShadowComparison(existingTargetProj, { ...renderCandidateProj, benchmark }) : undefined;
            const renderCompletedProj = { ...renderCandidateProj, finalQc, benchmark, shadowComparison, status: REFACTOR_CONSTANTS.STATUS_COMPLETED };
            await syncProject(renderCompletedProj);
            setRenderedVideoUrl(statusData.url);
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_SUCCESS, SecurityConstants.PLACEHOLDER_0, statusData.url));
            appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
            continue;
          }
          if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_FAILED)) throw new Error(statusData.error || REFACTOR_CONSTANTS.ERR_RENDER_FAILED);

          const currentProgress = _.defaultTo(statusData.progress, SecurityConstants.ZERO);
          if (!_.isEqual(currentProgress, lastLoggedProgress)) {
            lastLoggedProgress = currentProgress;
            appendLog(`${REFACTOR_CONSTANTS.MSG_RENDER_PREFIX}${currentProgress}${REFACTOR_CONSTANTS.MSG_PERCENT}`);
          }
          if (renderPending) {
            await new Promise((resolve) => { window.setTimeout(resolve, REFACTOR_CONSTANTS.POLLING_INTERVAL_MS); });
          }
        }
      } else {
        throw new Error(renderData.error || REFACTOR_CONSTANTS.ERR_RENDER_QUEUE);
      }

      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.COMPLETE);
    } catch (error: unknown) {
      if (cancellationRef.current || (error instanceof DOMException && _.isEqual(error.name, "AbortError"))) {
        appendLog(T.logCancelled);
        appendLog(T.logPipelineCancelledElapsed((Date.now() - pipelineStartedAt) / 1000));
        if (currentProject) {
          const cancelledProject = { ...currentProject, status: REFACTOR_CONSTANTS.STATUS_CANCELLED, activeRunId: null, lastRunId: pipelineRunLease.runId, generationLogs: _.clone(currentLogs), updatedAt: new Date().toISOString() };
          setActiveCreatedProject(cancelledProject);
          await onUpdateProject(cancelledProject, true);
        }
        setStepProgress(0);
        setCurrentStepIndex(0);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_RENDER_FAILED;
      appendLog(AUTO_GENERATOR_CONSTANTS.ERR_AUTO_GEN_FAILED.replace(SecurityConstants.PLACEHOLDER_0, errorMessage));
      appendLog(T.logPipelineFailedElapsed((Date.now() - pipelineStartedAt) / 1000));
      const failedProj = {
        ...(currentProject || {}),
        id: currentProject?.id || REFACTOR_CONSTANTS.STATUS_FAILED,
        status: currentProject ? REFACTOR_CONSTANTS.STATUS_PARTIAL : REFACTOR_CONSTANTS.STATUS_FAILED,
        activeRunId: null,
        lastRunId: pipelineRunLease.runId,
        manualReviewItems: currentProject ? createManualReviewItems(currentProject) : [],
        generationLogs: _.clone(currentLogs),
        updatedAt: new Date().toISOString(),
      } as VideoProject;
      setActiveCreatedProject(failedProj);
      await onUpdateProject(failedProj, true);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      requestAbortControllerRef.current = null;
      activeRenderJobIdRef.current = null;
      setIsCancelling(false);
      releasePipelineRunLease(pipelineRunLease);
    }
  };

  const cancelPipeline = () => {
    if (!processingRef.current || cancellationRef.current) return;
    cancellationRef.current = true;
    setIsCancelling(true);
    requestAbortControllerRef.current?.abort();
    if (activeRenderJobIdRef.current) {
      void safeSystemFetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER_CANCEL}${activeRenderJobIdRef.current}`, {});
    }
  };

  const pipelineState: PipelineState = {
    isProcessing,
    isCancelling,
    currentStepIndex,
    stepProgress,
    logs,
    renderedVideoUrl,
    activeCreatedProject,
  };

  const pipelineActions: PipelineActions = {
    startPipeline,
    cancelPipeline,
    setActiveCreatedProject,
    setLogs,
    setRenderedVideoUrl,
  };

  return { pipelineState, pipelineActions, syncSelectedProject };
}
