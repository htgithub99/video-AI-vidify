import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import _ from "lodash";
import { toast } from "sonner";
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
  ProjectKind,
} from "../types";
import { VideoQuality } from "../constants/enums";
import { API_ROUTES, CONTENT_TYPES, CONTENT_TYPE_HEADER, REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS, API_HEADERS, PIPELINE_CLIENT_ERRORS, SplitStrategy, PROJECT_ASSET_GROUP, HTTP_METHODS } from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_PROGRESS, FFMPEG_RENDER_CONSTANTS, PROJECT_IMAGE_FALLBACK_CONFIG, REFERENCE_ASSET_GROUP } from "../constants/config";
import { IMAGE_PROMPT_PIPELINE_VERSION } from "../constants/imagePromptRules";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { smartSplitSentences } from "../lib/textProcessor";
import { logger } from "../utils/logger";
import { safeSystemFetch, generateRandomString } from "../lib/shared-utils";
import { createProjectImageUrl, generateProjectImages, generateProjectImageOnce, getSceneAssetSummary, hasSceneAsset, isUsableGeneratedAssetUrl, prepareProjectMediaPrompt, resolveSceneGenerateType, selectVideoSceneIds, type ProjectImageResult } from "../services/projectImageGenerationService";
import { resolveVisualConfig } from "../services/autoVideoConfigResolver";
import { evaluateEdit, evaluateSubtitles, resolveGenreVoiceArc } from "../services/productionQualityService";
import { appendAssetRevision, createSceneDependencyHash, inheritApprovedSceneAsset } from "../services/dependencyHashService";
import { createManualReviewItems, evaluateFinalQuality } from "../services/finalQualityService";
import { migrateVideoProject } from "../services/projectMigrationService";
import { resolveQualityProfile } from "../services/qualityProfileService";
import { upscaleApprovedSceneAssets } from "../services/imageUpscaleService";
import { createAdvisoryFinalVideoReport } from "../services/finalMultimodalQualityService";
import { createPipelineBenchmark, resolveRolloutConfig } from "../services/rolloutService";
import { applyOptionalMusicAsset, createAudioCueSheet, resolveAutomaticMusicProfile } from "../services/soundDesignService";
import { createRenderAudioTracks } from "../services/audioMixService";
import { createShadowComparison } from "../services/shadowComparisonService";
import { ensureRenderReadySceneAssets } from "../services/renderCompletionFallbackService";
import { evaluateImagePrompts } from "../services/imagePromptQualityService";
import { createScriptGroundedStoryboard, ensureScriptGroundedSceneDetails, ensureStoryboardScriptCoverage } from "../services/storyboardFallbackService";
import { applyProfessionalEditingPolicy } from "../services/editingPolicyService";
import { ensureMediaSourcePlan } from "../services/mediaSourcePlanningService";
import { parseTargetDurationSeconds } from "../services/scriptQualityService";
import { createCharacterIdentityDescription, createSceneGenerationContext, pruneUnsupportedSceneCharacterIds, resolveSceneCharacterIds, SCENE_REFERENCE_CONFIG } from "../services/sceneReferenceService";
import { adaptImagePromptForEngine } from "../services/imageEngineAdapterService";
import { createThumbnailStyleDirective } from "../services/styleReferenceService";
import { hasSourceGenderConflict, hasStyleContaminatedCharacterLibrary, normalizeCharacterLibrary, validateVisualContinuity } from "../services/visualContinuityService";
import { generateDirectedVoice } from "../services/voiceDirectionService";
import { alignVoiceTimeline, removeRedundantSceneAudioBase64 } from "../services/voiceTimelineService";
import { assessVoiceAdvisory } from "../services/voiceQualityRepairService";
import { removeAdjacentRepeatedNarrationSentences, removeAdjacentRepeatedStoryboardScenes } from "../services/scriptContinuityService";
import { createSubtitleCues } from "../services/subtitleService";
import { createThumbnailGenerationPrompt } from "../services/thumbnailPromptService";
import { acceptGeneratedThumbnail } from "../services/thumbnailQualityPipelineService";
import { createSceneContinuityKey, createThumbnailContinuityKey } from "../services/imageGenerationContinuityService";
import { clearSceneVisualAsset } from "../services/projectRegenerationService";
import { compileImagePrompt } from "../services/imagePromptCompilerService";
import { getVisualShotPlanIssues } from "../services/visualPlanningService";
import { resolveStylePreset } from "../constants/stylePresets";
import { createTechnicalQaRegenerationPrompt, getSceneVisualRegenerationReasons, SCENE_VISUAL_QUALITY_CONFIG, shouldRegenerateSceneImage, validateSceneImage } from "../services/sceneVisualQualityService";
import { isHookTopicallyGrounded } from "../services/hookResilienceService";
import { validateChapterLanguage } from "../services/chapterLanguageValidationService";
import { createSourceGroundedSeo } from "../services/seoFallbackService";
import { acquirePipelineRunLease, refreshPipelineRunLease, releasePipelineRunLease } from "../services/pipelineRunLockService";
import { applyCinematicProductionPolicy, getCinematicStoryboardContractIssues, isCinematicEpisodeGenre } from "../services/cinematicProductionPolicyService";
import { Lang } from "../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../constants/texts";
import { calculateSceneDuration, fetchCachedVoiceAudio, getReferenceChangeState, getPipelineInvalidationState, preserveInterruptedStoryboardCheckpoint, hasCompleteSceneAlignment, resolveTargetProject } from "./autoVideoPipelineUtils";

export interface PipelineConfig { scriptContent: string; inputType: ProjectInputType; genre: string; language: ProjectLanguage; duration: string; rewriteLevel: number; similarityReduction: number; creativityLevel: number; factCheck: boolean; audience: string; writingStyle: string; splitStrategy: string; hookStrategy: string; hookDuration: number; hookPosition: string; voiceProvider: string; voiceSpeed: number; voicePitch: number; voiceVolume: number; voiceURI: string; voiceName: string; generationMode: ImageGenerationMode; imageGeneratorEngine: ImageGeneratorEngine; generateType: GenerateType; maxVideoScenes: number; aspectRatio: AspectRatio; promptInputMethod: PromptInputMethod; sampleCount: number; videoDuration: string; videoResolution: string; chromeHeadless: boolean; geminiChatSpeed: GeminiChatSpeed; batchDelay: BatchDelayOption; stylePreset: string; styleBackgroundMode: BackgroundMode; styleTextInImageMode: TextInImageMode; imageFocusMode: ImageFocusMode; referenceImages: string[]; sceneReferenceImages: string[]; characterImages: string[]; thumbnailCount: number; thumbnailStylePreset: string; thumbnailBackgroundMode: BackgroundMode; thumbnailTextInImageMode: ThumbnailTextMode; thumbnailImageFocusMode: ImageFocusMode; thumbnailReferenceImages: string[]; thumbnailSceneReferenceImages?: string[]; projectName: string; resumeMode: boolean; ffmpegQuality: VideoQuality; selectedProjectId?: string | null; forceRegenerateVoice?: boolean; forceRegenerateScenes?: boolean; musicAssetUrl?: string; filmFormat?: "single" | "series"; episodeCount?: number; cinematicMode?: boolean; }

export interface PipelineState { isProcessing: boolean; isCancelling: boolean; currentStepIndex: number; stepProgress: number; logs: string[]; renderedVideoUrl: string; activeCreatedProject: VideoProject | null; }

export interface PipelineActions { startPipeline: (config: PipelineConfig) => Promise<void>; cancelPipeline: () => void; setActiveCreatedProject: React.Dispatch<React.SetStateAction<VideoProject | null>>; setLogs: React.Dispatch<React.SetStateAction<string[]>>; setRenderedVideoUrl: React.Dispatch<React.SetStateAction<string>>; }

const createFallbackCharacterProfile = (_stylePresetName?: string): Record<string, any> => {
  return { name: "An", description: "", prompt: "", narrativeRole: "protagonist", genderPresentation: "neutral", ageRange: "20s", ethnicitySkinTone: "fair", bodyBuild: "standard", faceShape: "standard", eyes: "expressive", nose: "", hair: "", signatureClothing: "casual", accessories: "", colorPalette: "harmonious", silhouette: "recognizable", timelineStages: [], };
};

export function useAutoVideoPipeline(projects: VideoProject[], onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void, currentLang: Lang) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const processingRef = useRef(false);
  const cancellationRef = useRef(false);
  const requestAbortControllerRef = useRef<AbortController | null>(null);
  const activeRenderJobIdRef = useRef<string | null>(null);
  const boundSelectedProjectIdRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      cancellationRef.current = true;
      requestAbortControllerRef.current?.abort();
    },
    [],
  );

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
            const cachedLogsStr = storageUtils.get(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${foundProj.id}`);
            const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
            const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
            if (!_.isEmpty(projectLogs)) setLogs(projectLogs);
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
      const cachedLogsStr = storageUtils.get(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${foundProj.id}`);
      const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
      const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
      setLogs(projectLogs || []);
    }
  }, [projects, activeCreatedProject]);

  const syncSelectedProject = useCallback(
    (selectedProjectId: string | null | undefined) => {
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
        const cachedLogsStr = storageUtils.get(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${foundProj.id}`);
        const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
        const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
        setLogs(projectLogs || []);
      }
    },
    [activeCreatedProject, projects],
  );

  const startPipeline = async (config: PipelineConfig) => {
    if (processingRef.current) return;
    if (_.isEmpty(_.trim(config.scriptContent))) {
      toast.warning(T.alertEmptyScript);
      return;
    }
    const presentationTarget = resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent).existingTargetProject;
    const startsDifferentContent = Boolean(presentationTarget) && _.some([!_.isEqual(presentationTarget?.input?.type, config.inputType), !_.isEqual(_.trim(presentationTarget?.input?.content), _.trim(config.scriptContent))], Boolean);
    const resetDerivedPresentation = !config.resumeMode || startsDifferentContent;

    processingRef.current = true;
    cancellationRef.current = false;
    setIsCancelling(false);

    const availableMusicAssetUrl = config.musicAssetUrl || activeCreatedProject?.config.musicAssetUrl;
    config.musicAssetUrl = availableMusicAssetUrl;

    const canReuseExistingRunTarget = Boolean(config.resumeMode && !startsDifferentContent);
    const newRunTargetKey = _.kebabCase(_.join([config.projectName, config.scriptContent], REFACTOR_CONSTANTS.VD_EMPTY_STRING));
    const pipelineTargetKey = _.toString(canReuseExistingRunTarget ? config.selectedProjectId || activeCreatedProject?.id || newRunTargetKey : newRunTargetKey);
    const pipelineRunLease = acquirePipelineRunLease(pipelineTargetKey);
    if (!pipelineRunLease.acquired) {
      processingRef.current = false;
      toast.warning(REFACTOR_CONSTANTS.ERR_PIPELINE_ALREADY_RUNNING);
      return;
    }

    requestAbortControllerRef.current = new AbortController();
    const requestSignal = requestAbortControllerRef.current.signal;

    const throwIfCancelled = () => {
      if (cancellationRef.current) throw new DOMException(T.cancelledError, "AbortError");
    };

    setIsProcessing(true);
    setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.START);
    setCurrentStepIndex(1);
    setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    if (resetDerivedPresentation) setActiveCreatedProject(null);

    let currentLogs: string[] = config.resumeMode ? _.clone(logs) : [];
    setLogs(_.clone(currentLogs));
    if (!config.resumeMode) storageUtils.set(REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS, jsonUtils.safeStringify([]));
    let currentLogProjectId = config.resumeMode ? _.toString(config.selectedProjectId || activeCreatedProject?.id) : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    const appendLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${msg}`;
      currentLogs = _.concat(currentLogs, formatted);
      setLogs(_.clone(currentLogs));
      storageUtils.set(REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS, jsonUtils.safeStringify(currentLogs));
      if (currentLogProjectId) {
        storageUtils.set(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${currentLogProjectId}`, jsonUtils.safeStringify(currentLogs));
      }
    };

    const pipelineStartedAt = Date.now();
    let currentProject: VideoProject | null = resetDerivedPresentation ? null : activeCreatedProject;
    appendLog(T.logPipelineStart);
    appendLog(T.logConfigSummary(config.genre, config.language, config.duration, config.generationMode, config.resumeMode));

    try {
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_INIT);

      let newProjectId: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let newProj: VideoProject;
      const { selectedAutoProject: selectedAutoProj, existingTargetProject: rawExistingTargetProj } = resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent);
      const existingTargetProj = migrateVideoProject(rawExistingTargetProj);
      const referenceChangeState = getReferenceChangeState(existingTargetProj, config.referenceImages, config.sceneReferenceImages, config.thumbnailReferenceImages, []);
      const invalidationState = preserveInterruptedStoryboardCheckpoint(existingTargetProj, config, getPipelineInvalidationState(existingTargetProj, config, referenceChangeState));
      const sceneStyleProfileOutdated = _.every([!_.isEmpty(existingTargetProj?.visualConfig?.styleReferenceImages), _.isEmpty(existingTargetProj?.visualBible?.styleProfile?.characterType)], Boolean);
      const thumbnailStyleProfileOutdated = _.every([!_.isEmpty(existingTargetProj?.visualConfig?.thumbnailReferenceImages), _.isEmpty(existingTargetProj?.visualConfig?.thumbnailStyleProfile?.characterType)], Boolean);
      const requiresVisualReferenceMigration = _.some(existingTargetProj?.storyboard, (scene) => _.isEmpty(scene.layout) || _.isNil(scene.textAllowed)) || sceneStyleProfileOutdated || thumbnailStyleProfileOutdated;
      const requiresPromptPlanningMigration = _.some(existingTargetProj?.storyboard, (scene) => !_.isEmpty(getVisualShotPlanIssues(scene, scene)) || (isCinematicEpisodeGenre(config.genre) && !_.isEqual(_.size(scene.cinematicBeats), 3)));
      let shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets || requiresVisualReferenceMigration || requiresPromptPlanningMigration;

      if (config.resumeMode && existingTargetProj) {
        newProjectId = existingTargetProj.id;
        newProj = {
          ...existingTargetProj,
          scriptRewritten: invalidationState.regenerateScript ? undefined : existingTargetProj.scriptRewritten,
          chapters: invalidationState.regenerateScript ? [] : existingTargetProj.chapters,
          factCheckNotes: invalidationState.regenerateScript ? undefined : existingTargetProj.factCheckNotes,
          storyboard: invalidationState.regenerateStoryboard ? [] : existingTargetProj.storyboard,
          thumbnails: invalidationState.regenerateThumbnails || config.forceRegenerateScenes ? [] : existingTargetProj.thumbnails,
          seo: invalidationState.regenerateSeo ? undefined : existingTargetProj.seo,
          renderedVideoUrl: invalidationState.regenerateSceneAssets || invalidationState.regenerateVoice ? undefined : existingTargetProj.renderedVideoUrl,
          manualReviewItems: invalidationState.regenerateSceneAssets || invalidationState.regenerateScript ? [] : existingTargetProj.manualReviewItems,
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
            filmFormat: config.filmFormat,
            episodeCount: config.episodeCount,
            seriesBibleRequired: _.isEqual(config.filmFormat, "series"),
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
            videoResolution: config.videoResolution,
            generateCount: config.sampleCount,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            thumbnailReferenceImages: config.thumbnailReferenceImages,
            thumbnailSceneReferenceImages: config.thumbnailSceneReferenceImages,
            referenceImages: _.take(_.uniq(_.concat(config.referenceImages || [], config.sceneReferenceImages || [])), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
          },
        };
        setActiveCreatedProject(newProj);
        appendLog(T.logResumeProject(newProj.name));
      } else {
        const selectedProj = _.defaultTo(selectedAutoProj, activeCreatedProject);
        const isChildProject = selectedProj && selectedProj.parentId;

        newProjectId = selectedProj ? selectedProj.id : _.join([REFACTOR_CONSTANTS.AVG_PROJECT_ID_PREFIX, generateRandomString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

        const defaultName = selectedProj ? selectedProj.name : _.trim(config.projectName) || _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

        if (selectedProj?.id) {
          const deleteAssetGroups = [PROJECT_ASSET_GROUP.VOICES, PROJECT_ASSET_GROUP.VISUALS, PROJECT_ASSET_GROUP.VIDEOS];
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
          projectKind: selectedProj?.projectKind,
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
            filmFormat: config.filmFormat,
            episodeCount: config.episodeCount,
            seriesBibleRequired: _.isEqual(config.filmFormat, "series"),
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
            videoResolution: config.videoResolution,
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

      const referenceGroups: Array<[string, string[]]> = await Promise.all(
        _.map(
          [ { group: "style", images: config.referenceImages, configKey: "styleReferenceImages" },
            { group: "scene", images: config.sceneReferenceImages, configKey: "sceneReferenceImages" },
            { group: "thumbnail", images: config.thumbnailReferenceImages, configKey: "thumbnailReferenceImages" },
            { group: "thumbnailScene", images: config.thumbnailSceneReferenceImages, configKey: "thumbnailSceneReferenceImages" }, ],
          async ({ group, images, configKey }): Promise<[string, string[]]> => {
            if (_.isEmpty(images)) return [group, _.defaultTo(_.get(newProj.visualConfig, configKey), [])];
            const response = await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${newProjectId}/${group}`, { images });
            if (!response.success) {
              appendLog(_.replace(PIPELINE_CLIENT_ERRORS.REFERENCE_PERSIST_CONTINUED, PIPELINE_CLIENT_ERRORS.REFERENCE_GROUP_TOKEN, group));
              return [group, images];
            }
            const persistedAssets = _.defaultTo(response.data?.assets, []);
            return [group, _.isEmpty(persistedAssets) ? images : persistedAssets];
          },
        ),
      );
      const canonicalReferences = _.fromPairs(referenceGroups);
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
          referenceImages: _.take(_.uniq(_.concat(canonicalReferences.style, canonicalReferences.scene)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
          thumbnailReferenceImages: canonicalReferences.thumbnail,
          thumbnailSceneReferenceImages: canonicalReferences.thumbnailScene,
          characterImages: [],
        },
      };
      config.musicAssetUrl = musicAssetUrl;
      newProj = { ...newProj, rollout: resolveRolloutConfig(newProjectId) };
      await storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, newProjectId);
      currentLogProjectId = newProjectId;
      storageUtils.set(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${newProjectId}`, jsonUtils.safeStringify(currentLogs));
      setActiveCreatedProject(newProj);
      currentProject = newProj;

      const syncProject = async (proj: VideoProject) => {
        if (!refreshPipelineRunLease(pipelineRunLease)) throw new Error(REFACTOR_CONSTANTS.ERR_PIPELINE_RUN_REPLACED);
        const isCompleted = _.isEqual(proj.status, REFACTOR_CONSTANTS.STATUS_COMPLETED);
        const finalProj = { ...proj, activeRunId: isCompleted ? null : pipelineRunLease.runId, lastRunId: isCompleted ? pipelineRunLease.runId : proj.lastRunId, generationLogs: _.clone(currentLogs), updatedAt: new Date().toISOString() };
        currentProject = finalProj;
        setActiveCreatedProject(finalProj);
        const persistedProject = await onUpdateProject(finalProj, true);
        if (persistedProject) {
          currentProject = persistedProject;
          setActiveCreatedProject(persistedProject);
        }
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
        chapters = _.defaultTo(newProj.chapters, []) as Chapter[];
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

      const cachedOpening = _.first(smartSplitSentences(realScript)) || realScript;
      const cachedNarrationIsOffTopic = isScriptCached && !isHookTopicallyGrounded(cachedOpening, config.scriptContent);
      const cachedNarrationLanguageInvalid = isScriptCached && !validateChapterLanguage(realScript, _.isEqual(config.language, ProjectLanguage.VI)).valid;
      if (cachedNarrationIsOffTopic || cachedNarrationLanguageInvalid) {
        isScriptCached = false;
        isStoryboardCached = false;
        shouldRegenerateSceneAssets = true;
        config.forceRegenerateVoice = true;
        realScript = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        realScenes = [];
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
        const scriptData: any =
          scriptRes.success && scriptRes.data && !scriptRes.data.error
            ? scriptRes.data
            : {
                rewrittenScript: config.scriptContent,
                chapters: [],
                factCheckNotes: "",
                hookVersions: [],
                scriptQa: undefined,
                aiMetrics: [],
                contentSafety: undefined,
              };
        if (!scriptRes.success || !scriptRes.data || scriptRes.data.error) {
          appendLog(config.language === ProjectLanguage.VI ? "AI viết kịch bản chưa khả dụng; tiếp tục bằng nội dung người dùng để bảo đảm video vẫn được tạo." : "AI script writing is unavailable; continuing with the user's content so the video still completes.");
        }
        if (_.isEqual(scriptData.scriptQa?.passed, false)) {
          appendLog(REFACTOR_CONSTANTS.WARN_SCRIPT_QA_CONTINUED);
        }

        realScript = scriptData.rewrittenScript || config.scriptContent;
        chapters = (scriptData.chapters || []) as Chapter[];
        factCheckNotes = scriptData.factCheckNotes || "";
        const hookVersions = _.map(_.take(_.defaultTo(scriptData.hookVersions, []) as HookVersion[], newProj.hookConfig.count), (hook, index) => ({
          id: _.toString(_.defaultTo(hook.id, _.join(["hook", _.add(index, 1)], "_"))),
          content: _.toString(hook.content),
          type: _.toString(_.defaultTo(hook.type, newProj.hookConfig.type)),
          selected: _.isEqual(index, SecurityConstants.ZERO),
          score: hook.score,
        }));
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
          creativeBrief: scriptData.creativeBrief as CreativeBrief,
          narrativePlan: scriptData.narrativePlan,
          chapterPlans: scriptData.chapterPlans,
          factPack: scriptData.factPack as FactPack,
          scriptQa: scriptData.scriptQa as ScriptQualityReport | undefined,
          aiMetrics: _.concat(_.defaultTo(newProj.aiMetrics, []), _.defaultTo(scriptData.aiMetrics, [])),
          contentSafety: scriptData.contentSafety as ContentSafetyReport,
          chapters,
        };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
      }

      const narrationBeforeContinuityRepair = realScript;
      realScript = removeAdjacentRepeatedNarrationSentences(realScript);
      const didRepairRepeatedNarration = !_.isEqual(realScript, narrationBeforeContinuityRepair);
      if (didRepairRepeatedNarration) {
        newProj = { ...newProj, scriptRewritten: realScript };
        await syncProject(newProj);
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
            ...(config.forceRegenerateScenes
              ? {
                  colorPalette: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  characterSpecs: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  landscapeSpecs: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  lightingMood: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  background: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  lineStyle: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  colorMode: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  shading: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  textPolicy: "No readable text unless the current scene explicitly requires it.",
                  styleProfile: undefined,
                }
              : {}),
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
      const hasLegacyCharacterProfile = _.some(analyzedCharacters, (character) => _.some([_.isEqual(character.name, PRESET_CONSTANTS.CHARACTER_NAME), _.isEqual(character.description, PRESET_CONSTANTS.CHARACTER_BIO)]));
      const hasStyleContaminatedCharacterProfile = hasStyleContaminatedCharacterLibrary(analyzedCharacters);
      const characterSourceContext = _.join(_.compact([config.scriptContent, _.get(newProj.narrativePlan, "centralQuestion"), _.get(newProj.narrativePlan, "viewerPromise")]), "\n");
      const hasCharacterGenderConflict = hasSourceGenderConflict(characterSourceContext, analyzedCharacters);
      const shouldAnalyzeCharacters = !isScriptCached || config.forceRegenerateScenes || _.isEmpty(analyzedCharacters) || hasLegacyCharacterProfile || hasStyleContaminatedCharacterProfile || hasCharacterGenderConflict;
      if (shouldAnalyzeCharacters) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE);
        const analyzeCharacterRes = await safeSystemFetch(
          API_ROUTES.PIPELINE_ANALYZE_CHARACTER,
          {
            script: realScript,
            visualStyle: newProj.visualConfig.referencePrompt || newProj.visualConfig.style || config.stylePreset,
            sourceContext: characterSourceContext,
            bypassCache: true,
          },
          requestSignal,
        );
        throwIfCancelled();
        let rawAnalyzedCharacters: any[] = analyzeCharacterRes.success && _.isArray(analyzeCharacterRes.data?.characters) ? _.take(analyzeCharacterRes.data.characters, REFACTOR_CONSTANTS.HOOK_COUNT) : [];
        if (_.isEmpty(rawAnalyzedCharacters)) {
          appendLog(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
          rawAnalyzedCharacters = [createFallbackCharacterProfile(config.stylePreset || newProj.visualConfig.style)];
        }
        if (!_.isEmpty(rawAnalyzedCharacters)) {
          analyzedCharacters = normalizeCharacterLibrary(
            _.map(rawAnalyzedCharacters, (character: any, index: number): CharacterConfig => ({
              id: _.join([AUTO_GENERATOR_CONSTANTS.CHARACTER_ID_PREFIX, _.add(index, 1)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              name: character.name,
              description: character.description,
              prompt: character.prompt || character.description,
              ..._.pick(character, ["narrativeRole", "genderPresentation", "ageRange", "ethnicitySkinTone", "bodyBuild", "faceShape", "eyes", "nose", "hair", "signatureClothing", "accessories", "colorPalette", "silhouette", "timelineStages"]),
              images: [],
              extracted: false,
            })),
          );
          didAnalyzeCharacters = true;
          newProj = {
            ...newProj,
            visualConfig: {
              ...newProj.visualConfig,
              characters: analyzedCharacters,
              characterAnalysis: _.join(
                _.map(analyzedCharacters, (character) => _.join([character.name, character.description], REFACTOR_CONSTANTS.VD_BLANK)),
                "\n",
              ),
              characterPrompt: _.get(_.first(analyzedCharacters), "prompt", REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              characterImages: [],
              characterExtracted: false,
              characterConsistency: !_.isEmpty(analyzedCharacters),
            },
            visualBible: {
              ...newProj.visualBible,
              characterSpecs: _.join(
                _.map(analyzedCharacters, (character) => `${character.name}: ${createCharacterIdentityDescription(character)}`),
                "\n",
              ),
            },
          };
          await syncProject(newProj);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE_SUCCESS);
        }
      }

      if (!isStoryboardCached) {
        const storyboardStyle = currentStylePreset;
        const isCinematicPipeline = _.some([config.cinematicMode, _.endsWith(_.toString(config.projectName), " - Phim AI"), _.endsWith(_.toString(newProj.name), " - Phim AI"), isCinematicEpisodeGenre(config.genre), _.isEqual(newProj.projectKind, ProjectKind.Cinematic), isCinematicEpisodeGenre(newProj.config.genre), _.includes(["single", "series"], _.toString(config.filmFormat)), _.includes(["single", "series"], _.toString(newProj.config.filmFormat))], Boolean);
        const cinematicDurationSeconds = _.max([parseTargetDurationSeconds(config.duration), parseTargetDurationSeconds(newProj.config.duration)]) || 10;
        appendLog(`[Film Debug] cinematic=${isCinematicPipeline}; ui=${Boolean(config.cinematicMode)}; format=${_.toString(config.filmFormat)}; genre=${_.toString(config.genre)}; project=${_.toString(newProj.name)}; clips=${Math.max(1, Math.ceil(cinematicDurationSeconds / 10))}`);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SPLIT);
        appendLog(T.logStoryboardRequestDetail(config.splitStrategy, !_.isEmpty(config.referenceImages)));
        const storyboardPayload = {
          rewrittenScript: realScript,
          chapters,
          voiceDuration: isCinematicPipeline ? cinematicDurationSeconds : undefined,
          cinematicClipCount: isCinematicPipeline ? Math.max(1, Math.ceil(cinematicDurationSeconds / 10)) : undefined,
          config: {
            ...newProj.config,
            ...newProj.voiceConfig,
            visualStylePreset: newProj.visualConfig.style,
            aspectRatio: newProj.visualConfig.aspectRatio,
            imageQuality: newProj.visualConfig.quality,
          },
          visualStyle: storyboardStyle,
          referenceImages: _.compact(_.concat(_.castArray(config.referenceImages || []), _.castArray(config.sceneReferenceImages || []), _.castArray(newProj.visualConfig?.styleReferenceImages || []))),
          referenceStyle: storyboardStyle,
          referenceCharacters: jsonUtils.safeStringify(
            _.map(analyzedCharacters, (character) => ({
              name: character.name,
              description: character.prompt || character.description,
            })),
          ),
          visualDensity: 5,
          bypassCache: true,
        };

        const storyboardRes = await safeSystemFetch(API_ROUTES.PIPELINE_STORYBOARD, storyboardPayload, requestSignal);
        throwIfCancelled();
        const storyboardAvailable = Boolean(storyboardRes.success && storyboardRes.data && !storyboardRes.data.error);
        realScenes = storyboardAvailable ? ((storyboardRes.data.scenes || []) as StoryboardScene[]) : [];
        const generatedVisualBible = storyboardAvailable ? (storyboardRes.data.visualBible as VisualBible) : newProj.visualBible;
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
        if (!isCinematicEpisodeGenre(config.genre)) {
          realScenes = ensureStoryboardScriptCoverage(realScenes, {
            rewrittenScript: realScript,
            chapters,
            splitStrategy: config.splitStrategy as SplitStrategy,
            aspectRatio: config.aspectRatio,
            targetStyle: storyboardStyle,
            visualBible,
          });
        }
        const storyboardQa = storyboardAvailable ? (storyboardRes.data.storyboardQa as StoryboardQualityReport | undefined) : undefined;
        if (!storyboardQa?.passed) appendLog(REFACTOR_CONSTANTS.WARN_STORYBOARD_QA_RESULT);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, String(realScenes.length)));
        appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);

        const audioCueSheet = applyOptionalMusicAsset(createAudioCueSheet(realScenes, config.genre), config.musicAssetUrl);
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

      realScenes = removeAdjacentRepeatedStoryboardScenes(realScenes);
      realScenes = _.map(realScenes, (scene) => ({
        ...scene,
        characterIds: resolveSceneCharacterIds(scene, analyzedCharacters),
      }));
      const referenceContinuityReport = validateVisualContinuity(realScenes, analyzedCharacters, newProj.visualBible);
      if (!referenceContinuityReport.passed) appendLog(_.join(referenceContinuityReport.blockingErrors, REFACTOR_CONSTANTS.VD_BLANK));

      let globalAudioBase64: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let globalAudioUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      const nativeFilmAudio = isCinematicEpisodeGenre(config.genre);
      let isVoiceCached = nativeFilmAudio;
      const voicePayload = { text: realScript, voiceURI: config.voiceURI, voice_id: config.voiceURI, provider: config.voiceProvider, speed: config.voiceSpeed, pitch: config.voicePitch, volume: config.voiceVolume, gender: Gender.Male, age: AgeGroup.Adult, emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL, };
      const genreVoiceArc = resolveGenreVoiceArc(config.genre);
      const generatePipelineVoice = () =>
        generateDirectedVoice({
          text: realScript,
          voiceArc: genreVoiceArc,
          basePayload: voicePayload,
          signal: requestSignal,
        });

      if (config.resumeMode && isScriptCached && !config.forceRegenerateVoice && !invalidationState.regenerateVoice && !didRepairRepeatedNarration) {
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
            voiceArc: genreVoiceArc,
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

      const hasGlobalNarration = !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl);
      const hasCachedAlignment = config.resumeMode && isScriptCached && !config.forceRegenerateVoice && !didRepairRepeatedNarration && hasCompleteSceneAlignment(realScenes as StoryboardScene[], hasGlobalNarration);
      let alignmentCompleted = hasCachedAlignment;
      const alignmentRequest =
        globalAudioBase64 && !hasCachedAlignment
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
          realScenes = removeRedundantSceneAudioBase64(realScenes, hasGlobalNarration);
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

      appendLog(T.logReferenceSummary(_.size(config.referenceImages), _.size(config.sceneReferenceImages), SecurityConstants.ZERO));

      if (!isStoryboardCached || config.forceRegenerateScenes || shouldRegenerateSceneAssets || didAnalyzeCharacters || requiresVisualReferenceMigration || requiresPromptPlanningMigration) {
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

        appendLog(
          config.language === ProjectLanguage.VI
            ? isCinematicEpisodeGenre(config.genre)
              ? "🎬 AI đang đạo diễn prompt video hoàn chỉnh, lời thoại, 3–5 shot và continuity cho từng clip."
              : "🖼️ AI đang biên tập prompt hình ảnh theo nội dung, phong cách và tính nhất quán của từng phân cảnh."
            : isCinematicEpisodeGenre(config.genre)
              ? "🎬 AI is directing each complete video prompt with dialogue, 3–5 shots, and continuity."
              : "🖼️ AI is editing each scene prompt for story relevance, style, and continuity.",
        );
        const optimizePayload = { storyboard: realScenes, visualConfig: voiceUpdatedProj.visualConfig, visualBible: voiceUpdatedProj.visualBible, aspectRatio: config.aspectRatio, language: config.language, genre: config.genre, promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION, bypassCache: true, };
        let optimizeRes = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, optimizePayload, requestSignal);
        if (!optimizeRes.success) {
          appendLog(config.language === ProjectLanguage.VI ? "[Biên tập hình ảnh] AI chưa trả đủ kế hoạch; đang yêu cầu viết lại toàn bộ đúng một lần." : "[Visual editorial] AI did not return a complete plan; requesting one full rewrite.");
          optimizeRes = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, optimizePayload, requestSignal);
        }
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          const styleIdentityChanged = !_.isEqual(currentStylePreset, existingTargetProj?.visualConfig?.style);
          shouldRegenerateSceneAssets = shouldRegenerateSceneAssets || requiresVisualReferenceMigration || didAnalyzeCharacters || styleIdentityChanged;
          appendLog(config.language === ProjectLanguage.VI ? (isCinematicEpisodeGenre(config.genre) ? `✅ AI đã hoàn thành ${realScenes.length} prompt video với 3–5 shot được chọn theo nội dung.` : `✅ AI đã hoàn thành prompt hình ảnh cho ${realScenes.length} phân cảnh.`) : isCinematicEpisodeGenre(config.genre) ? `✅ AI completed ${realScenes.length} video prompts with 3–5 story-driven shots.` : `✅ AI completed image prompts for ${realScenes.length} scenes.`);
          if (!optimizeRes.data?.promptQa?.passed || !_.isEmpty(optimizeRes.data?.planningWarnings)) {
            appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
          }
        } else {
          appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle = createThumbnailStyleDirective(voiceUpdatedProj.visualBible?.styleProfile, voiceUpdatedProj.visualConfig?.thumbnailStyleProfile) || voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || config.thumbnailStylePreset;
      }

      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = ensureScriptGroundedSceneDetails(realScenes as StoryboardScene[], {
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          visualBible: voiceUpdatedProj.visualBible,
        });
      }
      const requestedArchivalCount = _.size(_.filter(realScenes as StoryboardScene[], { assetStrategy: "archival" }));
      realScenes = ensureMediaSourcePlan(realScenes as StoryboardScene[], config.genre);
      if (isCinematicEpisodeGenre(config.genre)) {
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({
          ...scene,
          assetStrategy: "ai_generated" as const,
          archivalSearchQuery: "",
          archivalRationale: "",
        }));
      }
      const verifiedArchivalPlanCount = _.size(_.filter(realScenes as StoryboardScene[], { assetStrategy: "archival" }));
      if (verifiedArchivalPlanCount < requestedArchivalCount) {
        appendLog(config.language === ProjectLanguage.VI ? `[Kế hoạch tư liệu] Loại ${requestedArchivalCount - verifiedArchivalPlanCount} cảnh thiếu storyEvidence hoặc truy vấn nguồn chuyên biệt; dùng AI tái dựng để tránh ảnh thật sai.` : `[Archive plan] Removed ${requestedArchivalCount - verifiedArchivalPlanCount} scenes without storyEvidence or a dedicated source query; using AI reconstruction to prevent unrelated authentic media.`);
      }
      realScenes = pruneUnsupportedSceneCharacterIds(realScenes as StoryboardScene[], voiceUpdatedProj.visualConfig.characters || []);
      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = applyProfessionalEditingPolicy(realScenes as StoryboardScene[], voiceUpdatedProj.visualBible);
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const sourceShotCount = realScenes.length;
        const targetClipCount = _.max([1, Math.ceil(parseTargetDurationSeconds(config.duration) / 10)]) || 1;
        const plannedCameraSetupCount = _.sumBy(realScenes as StoryboardScene[], (scene) => _.size(scene.cinematicBeats));
        appendLog(
          config.language === ProjectLanguage.VI
            ? `[Phim AI] AI đã thiết kế ${plannedCameraSetupCount} cảnh quay có timeline trong ${realScenes.length} clip 10 giây từ ${sourceShotCount} nhịp truyện; mỗi clip có 3–5 shot do AI quyết định và một kết quả nhìn thấy được.`
            : `[AI Film] AI authored ${plannedCameraSetupCount} timed camera setups across ${realScenes.length} ten-second clips from ${sourceShotCount} story beats; every clip requires an AI-selected 3 to 5 continuous shots and a visible consequence.`,
        );
        if (!_.isEqual(realScenes.length, targetClipCount)) {
          appendLog(config.language === ProjectLanguage.VI ? `[Phim AI] Cảnh báo kế hoạch: AI trả ${realScenes.length}/${targetClipCount} clip theo thời lượng yêu cầu; giữ nguyên dữ liệu AI để hợp đồng kiểm tra thay vì code tự ghép cảnh.` : `[AI Film] Planning warning: AI returned ${realScenes.length}/${targetClipCount} clips; preserving the AI plan for contract validation instead of synthesizing scene bundles in code.`);
        }
      }
      realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({
        ...scene,
        prompt: compileImagePrompt(scene, {
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          characters: voiceUpdatedProj.visualConfig.characters,
          visualBible: voiceUpdatedProj.visualBible,
        }),
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

      const productionVisualConfig = applyCinematicProductionPolicy(
        {
          ...voiceUpdatedProj.visualConfig,
          generationMode: config.generationMode,
          imageGeneratorEngine: config.imageGeneratorEngine,
          generateType: config.generateType,
          maxVideoScenes: config.maxVideoScenes,
          videoDuration: config.videoDuration,
          videoResolution: config.videoResolution,
        },
        config.genre,
        realScenes.length,
      );
      const resolvedVisualConfig = resolveVisualConfig(productionVisualConfig, isCinematicEpisodeGenre(config.genre));
      if (resolvedVisualConfig.blocked) throw new Error(REFACTOR_CONSTANTS.ERR_VISUAL_CONFIG_BLOCKED);
      const executionVisualConfig = resolvedVisualConfig.config;
      if (isCinematicEpisodeGenre(config.genre)) {
        const cinematicContractIssues = getCinematicStoryboardContractIssues(realScenes as StoryboardScene[]);
        if (!_.isEmpty(cinematicContractIssues)) {
          appendLog(config.language === ProjectLanguage.VI ? `[Phim AI] Cảnh báo hợp đồng biên tập sau lần sửa AI: ${cinematicContractIssues.slice(0, 6).join(", ")}. Giữ phương án AI đầy đủ nhất và tiếp tục tạo phim.` : `[AI Film] Editorial-contract warning after the AI correction: ${cinematicContractIssues.slice(0, 6).join(", ")}. Keeping the most complete AI-authored plan and continuing production.`);
        }
        appendLog(config.language === ProjectLanguage.VI ? `[Phim AI] Chế độ video toàn cảnh: ${realScenes.length}/${realScenes.length} cảnh được gửi tới model video đã chọn.` : `[AI Film] Video-only production: ${realScenes.length}/${realScenes.length} shots use the selected video model.`);
      }
      voiceUpdatedProj = {
        ...voiceUpdatedProj,
        visualConfig: executionVisualConfig,
      };
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_PREPARE);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat) ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      appendLog(
        config.language === ProjectLanguage.VI
          ? `🎨 Đang chuẩn bị tạo ${executionVisualConfig.generateType === GenerateType.Video ? "clip video" : executionVisualConfig.generateType === GenerateType.Mixed ? "hình ảnh và clip video" : "hình ảnh"} phân cảnh qua ${modeName}; tỷ lệ ${config.aspectRatio}.`
          : `🎨 Preparing to generate scene ${executionVisualConfig.generateType === GenerateType.Video ? "video clips" : executionVisualConfig.generateType === GenerateType.Mixed ? "images and video clips" : "images"} through ${modeName} at ${config.aspectRatio}.`,
      );

      const visualConfigPayload = { ...executionVisualConfig, aspectRatio: config.aspectRatio, chromeHeadless: config.chromeHeadless, geminiChatSpeed: config.geminiChatSpeed, style: currentStylePreset, qualityMode: _.defaultTo(voiceUpdatedProj.visualConfig.qualityMode, QualityMode.Balanced), generateCount: resolveQualityProfile(voiceUpdatedProj.visualConfig.qualityMode).draftCandidates, styleReferenceImages: [], sceneReferenceImages: [], referenceImages: [], thumbnailReferenceImages: [], thumbnailSceneReferenceImages: [], contentLanguage: config.language, preserveVideoAudio: isCinematicEpisodeGenre(config.genre), };
      const thumbnailVisualConfigPayload = isCinematicEpisodeGenre(config.genre)
        ? { ...visualConfigPayload, generationMode: ImageGenerationMode.GeminiChat, imageGeneratorEngine: ImageGeneratorEngine.LabsSandbox, generateType: GenerateType.Image }
        : visualConfigPayload;

      const sandboxConfigPayload = { localProjectId: voiceUpdatedProj.id, flowProjectId: voiceUpdatedProj.visualConfig?.flowProjectId, };
      const cachedSeoData = config.resumeMode && !invalidationState.regenerateSeo && newProj.seo ? newProj.seo : null;
      const seoRequest = cachedSeoData
        ? null
        : (() => {
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_OPTIMIZE);
            return safeSystemFetch(
              API_ROUTES.PIPELINE_SEO,
              {
                originalInput: config.scriptContent,
                config: voiceUpdatedProj.config,
                seoConfig: voiceUpdatedProj.seoConfig,
                rewrittenScript: realScript,
                bypassCache: true,
              },
              requestSignal,
            );
          })();
      const shouldRegenerateThumbnails = Boolean(config.forceRegenerateScenes) || invalidationState.regenerateThumbnails;
      let preparedSeoData: unknown = cachedSeoData;

      if (!preparedSeoData && seoRequest) {
        const seoRes = await seoRequest;
        preparedSeoData = seoRes.success && seoRes.data ? seoRes.data : createSourceGroundedSeo(realScript, newProj.seoConfig);
      }

      const visualDependencies = { ..._.pick(voiceUpdatedProj.visualConfig, ["style", "stylePreset", "imageGeneratorEngine", "aspectRatio", "styleBackgroundMode", "styleTextInImageMode", "imageFocusMode", "generateType"]), promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION, };
      const previousScenes = _.keyBy(_.defaultTo(existingTargetProj?.storyboard, []), "id");
      realScenes = _.map(realScenes as StoryboardScene[], (scene) => {
        const sceneWithDependency = { ...scene, dependencyHash: createSceneDependencyHash(scene, visualDependencies), };
        if (config.forceRegenerateScenes) {
          return { ...clearSceneVisualAsset(sceneWithDependency), dependencyHash: sceneWithDependency.dependencyHash, };
        }
        return inheritApprovedSceneAsset(sceneWithDependency, previousScenes[scene.id]);
      });
      let targetScenesToGen = _.filter(realScenes as VideoProject["storyboard"], (sc) => {
        if (config.forceRegenerateScenes) return true;
        if (config.resumeMode && !shouldRegenerateSceneAssets && hasSceneAsset(sc)) return false;
        return true;
      });
      _.forEach(targetScenesToGen, (scene) => {
        scene.assetStatus = SceneAssetStatus.Generating;
        scene.assetError = undefined;
      });
      appendLog(T.logMediaPlan(_.size(targetScenesToGen), _.subtract(_.size(realScenes), _.size(targetScenesToGen)), executionVisualConfig.generateType));
      const existingVideoCount = _.size(_.filter(realScenes as VideoProject["storyboard"], (scene) => _.isEqual(scene.assetType, GenerateType.Video) && hasSceneAsset(scene)));
      const remainingVideoSlots = _.max([_.subtract(_.defaultTo(executionVisualConfig.maxVideoScenes, SecurityConstants.ZERO), existingVideoCount), SecurityConstants.ZERO])!;
      const videoSceneIds = await selectVideoSceneIds(
        _.filter(targetScenesToGen, (scene) => !_.isEqual(scene.assetStrategy, "archival")),
        executionVisualConfig.generateType,
        remainingVideoSlots,
      );

      let unifiedBatchThumbnails: ThumbnailItem[] | null = null;
      let unifiedThumbnailItems: Array<{
        sceneId: string;
        prompt: string;
        generateType: GenerateType.Image;
        referenceImages: string[];
        continuityKey: string;
        idempotencyKey: string;
      }> = [];
      if (_.some([_.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat), isCinematicEpisodeGenre(config.genre)], Boolean)) {
        const reusableThumbnails = config.resumeMode && !shouldRegenerateThumbnails ? _.defaultTo(newProj.thumbnails, []) : [];
        if (!_.isEmpty(reusableThumbnails) && _.every(reusableThumbnails, (thumb) => !_.isEmpty(thumb.imageUrl))) {
          unifiedBatchThumbnails = _.cloneDeep(reusableThumbnails);
          appendLog(T.logResumeThumbnails);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
          const thumbnailPlan = await safeSystemFetch(
            API_ROUTES.PIPELINE_THUMBNAILS,
            {
              rewrittenScript: realScript,
              config: voiceUpdatedProj.config,
              visualConfig: { ...voiceUpdatedProj.visualConfig, thumbnailReferencePrompt: currentThumbnailStyle },
              bypassCache: true,
            },
            requestSignal,
          );
          unifiedBatchThumbnails = thumbnailPlan.success && _.isArray(thumbnailPlan.data?.thumbnails) ? thumbnailPlan.data.thumbnails : [];
          const thumbnailReferenceImages: string[] = [];
          unifiedThumbnailItems = _.map(
                _.filter(unifiedBatchThumbnails, (thumb) => _.isEmpty(thumb.imageUrl)),
                (thumb) => {
                  const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                  const generationPrompt = createThumbnailGenerationPrompt(thumb, thumbnailStyle, config.aspectRatio, false, voiceUpdatedProj.visualConfig.characters);
                  thumb.generationPrompt = generationPrompt;
                  return { sceneId: thumb.id, idempotencyKey: _.join([voiceUpdatedProj.id, "thumbnail", thumb.id], ":"), prompt: generationPrompt, generateType: GenerateType.Image, referenceImages: thumbnailReferenceImages, continuityKey: createThumbnailContinuityKey(), };
                },
              );
        }
      }

      realScenes = removeRedundantSceneAudioBase64(realScenes, hasGlobalNarration);
      targetScenesToGen = _.map(targetScenesToGen, (targetScene) => _.find(realScenes as StoryboardScene[], { id: targetScene.id }) || targetScene);
      voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"] };

      if (config.resumeMode && !shouldRegenerateSceneAssets) {
        (realScenes as VideoProject["storyboard"])!.forEach((sc, idx) => {
          if (hasSceneAsset(sc)) {
            appendLog(T.logResumeSceneSkip(idx + 1, realScenes.length, sc.assetType === GenerateType.Video ? "video" : "image"));
          }
        });
      }

      let imageCheckpointQueue = Promise.resolve();
      const persistImageCheckpoint = (): Promise<void> => {
        const checkpointProject = { ...voiceUpdatedProj, storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"], thumbnails: _.cloneDeep(unifiedBatchThumbnails || voiceUpdatedProj.thumbnails), };
        imageCheckpointQueue = imageCheckpointQueue.then(() => syncProject(checkpointProject));
        return imageCheckpointQueue;
      };

      const hasReferenceImages = Boolean(!_.isEmpty(voiceUpdatedProj.visualConfig?.referenceImages) || !_.isEmpty(voiceUpdatedProj.visualConfig?.sceneReferenceImages) || !_.isEmpty(voiceUpdatedProj.visualConfig?.styleReferenceImages));

      const createSceneRequestContext = (scene: StoryboardScene, sceneGenerateType: GenerateType) => {
        const context = createSceneGenerationContext(scene, voiceUpdatedProj.visualConfig);
        const compiledPrompt = compileImagePrompt(scene, {
          referenceLocked: hasReferenceImages,
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          visualBible: voiceUpdatedProj.visualBible,
          characters: voiceUpdatedProj.visualConfig?.characters,
        });
        const aiAuthoredVideoPrompt = isCinematicEpisodeGenre(config.genre) && _.isEqual(sceneGenerateType, GenerateType.Video) ? _.trim(scene.generationPrompt) : "";
        const engineAdaptedPrompt = adaptImagePromptForEngine(!_.isEmpty(aiAuthoredVideoPrompt) ? aiAuthoredVideoPrompt : compiledPrompt, executionVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen, config.aspectRatio);
        return {
          ...context,
          prompt: prepareProjectMediaPrompt({ sceneId: scene.id, prompt: engineAdaptedPrompt, generateType: sceneGenerateType }),
        };
      };

      if (!_.isEmpty(targetScenesToGen) || !_.isEmpty(unifiedThumbnailItems)) {
        for (const archivalScene of _.filter(targetScenesToGen, (scene) => _.isEqual(scene.assetStrategy, "archival") && !hasSceneAsset(scene))) {
          throwIfCancelled();
          const archivalResult = await safeSystemFetch(
            API_ROUTES.PIPELINE_SEARCH_ARCHIVAL_IMAGE,
            {
              query: archivalScene.archivalSearchQuery,
              chromeHeadless: config.chromeHeadless,
            },
            requestSignal,
          );
          const archivalData = archivalResult.data;
          if (archivalResult.success && archivalData?.success && archivalData?.base64) {
            const mimeType = _.toString(archivalData.mimeType || "image/jpeg");
            const dataUrl = `data:${mimeType};base64,${archivalData.base64}`;
            archivalScene.assetUrl = dataUrl;
            archivalScene.assetUrls = [dataUrl];
            archivalScene.assetType = GenerateType.Image;
            archivalScene.assetStatus = SceneAssetStatus.Generated;
            archivalScene.archivalSourceUrl = _.toString(archivalData.sourceUrl);
            archivalScene.archivalLicense = _.toString(archivalData.license);
            appendAssetRevision(archivalScene, dataUrl, SceneAssetStatus.Generated);
            appendLog(`Đã tải ảnh tư liệu thật cho ${archivalScene.id} từ ${_.toString(archivalData.provider || "nguồn lưu trữ")}.`);
            await persistImageCheckpoint();
          } else {
            archivalScene.assetStrategy = "ai_generated";
            appendLog(`Không tìm thấy tư liệu phù hợp cho ${archivalScene.id}; chuyển riêng cảnh này sang ảnh AI.`);
          }
        }
        const remainingTargetScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene));
        const runSceneGeneration = async (scenesToProcess: StoryboardScene[], isFallback = false): Promise<void> => {
          const generateScene = async (sc: StoryboardScene, i: number): Promise<void> => {
            throwIfCancelled();
            if (hasSceneAsset(sc)) return;

            const sceneGenerateType = resolveSceneGenerateType(sc.id, executionVisualConfig.generateType, videoSceneIds);
            const requestContext = createSceneRequestContext(sc, sceneGenerateType);
            sc.generationPrompt = requestContext.prompt;

            if (isFallback) appendLog(T.logFallbackProgress(i + 1, scenesToProcess.length, sceneGenerateType)); else {
              appendLog(config.language === ProjectLanguage.VI ? `🎨 Đang tạo ${sceneGenerateType === GenerateType.Video ? "clip video" : "hình ảnh"} cho ${sc.id} (${i + 1}/${scenesToProcess.length}).` : `🎨 Generating the ${sceneGenerateType === GenerateType.Video ? "video clip" : "image"} for ${sc.id} (${i + 1}/${scenesToProcess.length}).`);
            }

            try {
              const imageResult = await generateProjectImageOnce(
                {
                  sceneId: sc.id,
                  prompt: requestContext.prompt,
                  referenceImages: requestContext.referenceImages,
                  generateType: sceneGenerateType,
                },
                () => ({
                  prompt: requestContext.prompt,
                  style: currentStylePreset,
                  resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                  bypassCache: false,
                  engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                  sandboxConfig: sandboxConfigPayload,
                  visualConfig: visualConfigPayload ? { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: sceneGenerateType } : visualConfigPayload,
                }),
                requestSignal,
              );

              if (imageResult.success) {
                const base64Val = imageResult.base64;
                const fallbackUrl = imageResult.fallbackUrl;
                if (base64Val) {
                  const dataUrl = _.join([_.isEqual(sceneGenerateType, GenerateType.Video) ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, base64Val], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
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
              let recoveredAsImage = false;
              if (_.isEqual(executionVisualConfig.generateType, GenerateType.Mixed) && _.isEqual(sceneGenerateType, GenerateType.Video)) {
                try {
                  const imageFallbackResult = await generateProjectImageOnce(
                    {
                      sceneId: sc.id,
                      prompt: requestContext.prompt,
                      referenceImages: requestContext.referenceImages,
                      generateType: GenerateType.Image,
                    },
                    () => ({
                      prompt: requestContext.prompt,
                      style: currentStylePreset,
                      resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                      bypassCache: true,
                      engine: ImageGeneratorEngine.Imagen,
                      sandboxConfig: sandboxConfigPayload,
                      visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: GenerateType.Image },
                    }),
                    requestSignal,
                  );
                  const fallbackImageUrl = createProjectImageUrl(imageFallbackResult);
                  if (imageFallbackResult.success && !_.isEmpty(fallbackImageUrl)) {
                    sc.assetUrl = fallbackImageUrl;
                    sc.assetUrls = [fallbackImageUrl];
                    sc.assetType = GenerateType.Image;
                    sc.assetStatus = SceneAssetStatus.Generated;
                    sc.assetError = undefined;
                    appendAssetRevision(sc, fallbackImageUrl, SceneAssetStatus.Generated);
                    await persistImageCheckpoint();
                    recoveredAsImage = true;
                  }
                } catch (imageFallbackError) {
                  logger.warn(`[Mixed Media] Image fallback failed for ${sc.id}: ${imageFallbackError instanceof Error ? imageFallbackError.message : REFACTOR_CONSTANTS.ERR_UNKNOWN}`);
                }
              }
              if (!recoveredAsImage) {
                sc.assetStatus = SceneAssetStatus.Failed;
                sc.assetError = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_UNKNOWN;
                appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
              }
            }
          };
          for (let i = 0; i < scenesToProcess.length; i++) {
            await generateScene(scenesToProcess[i], i);
          }
        };

        if (_.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat)) {
          appendLog(T.logBatchImageStreamStart(executionVisualConfig.generateType, _.size(remainingTargetScenes)));
          const sceneBatchItems = _.map(remainingTargetScenes, (scene) => {
            const sceneGenerateType = resolveSceneGenerateType(scene.id, executionVisualConfig.generateType, videoSceneIds);
            const requestContext = createSceneRequestContext(scene, sceneGenerateType);
            scene.generationPrompt = requestContext.prompt;
            return { sceneId: scene.id, idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash], ":"), prompt: requestContext.prompt, referenceImages: requestContext.referenceImages, continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters), generateType: sceneGenerateType, };
          });
          const batchItems = _.concat(sceneBatchItems, unifiedThumbnailItems);
          let completedCount = SecurityConstants.ZERO;
          let batchFailureCount = SecurityConstants.ZERO;

          const applyResult = (result: ProjectImageResult) => {
            const imageUrl = createProjectImageUrl(result);
            const thumbnail = _.find(unifiedBatchThumbnails || [], (item) => _.isEqual(item.id, result.sceneId));
            if (thumbnail && !_.isEmpty(imageUrl)) {
              thumbnail.imageUrl = imageUrl;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, _.toString(_.size(_.filter(unifiedBatchThumbnails, (item) => !_.isEmpty(item.imageUrl))))).replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.size(unifiedBatchThumbnails))));
              void persistImageCheckpoint();
              return;
            }
            const scene = _.find(realScenes as VideoProject["storyboard"], (item) => _.isEqual(item.id, result.sceneId));
            if (_.every([scene, !_.isEmpty(imageUrl)], Boolean)) {
              scene!.assetUrl = imageUrl;
              scene!.assetUrls = [imageUrl];
              scene!.assetType = result.assetType || GenerateType.Image;
              scene!.assetStatus = SceneAssetStatus.Generated;
              appendAssetRevision(scene!, imageUrl, SceneAssetStatus.Generated);
              scene!.assetError = undefined;
              completedCount = _.add(completedCount, SecurityConstants.DEFAULT_AMOUNT);
              const totalScenes = _.size(remainingTargetScenes);
              appendLog(T.logBatchImageSceneSuccess(result.sceneId, completedCount, totalScenes, scene!.assetType === GenerateType.Video ? "video" : "image"));
              void persistImageCheckpoint();
            }
          };

          const runThreeTabFallback = async (missingScenes: StoryboardScene[]): Promise<void> => {
            const fallbackItems = _.map(missingScenes, (scene) => {
              const fallbackGenerateType = isCinematicEpisodeGenre(config.genre) ? GenerateType.Video : GenerateType.Image;
              const requestContext = createSceneRequestContext(scene, fallbackGenerateType);
              scene.generationPrompt = requestContext.prompt;
              return { sceneId: scene.id, idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash, "fallback"], ":"), prompt: requestContext.prompt, referenceImages: requestContext.referenceImages, continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters), generateType: fallbackGenerateType, };
            });
            let fallbackCompleted = 0;
            await generateProjectImages({
              items: fallbackItems,
              visualConfig: {
                ...visualConfigPayload,
                generateType: isCinematicEpisodeGenre(config.genre) ? GenerateType.Video : GenerateType.Image,
                batchTabCount: PROJECT_IMAGE_FALLBACK_CONFIG.TAB_CONCURRENCY,
              },
              style: currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              onBatchResult: (result) => {
                if (result.success) {
                  fallbackCompleted = _.add(fallbackCompleted, 1);
                  const completedItem = _.find(fallbackItems, { sceneId: result.sceneId });
                  appendLog(T.logFallbackProgress(fallbackCompleted, fallbackItems.length, completedItem?.generateType || "image"));
                  applyResult(result);
                  return;
                }
                const failedScene = _.find(missingScenes, { id: result.sceneId });
                if (failedScene && !hasSceneAsset(failedScene)) {
                  failedScene.assetStatus = SceneAssetStatus.Failed;
                  failedScene.assetError = result.warning || REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
                }
              },
            });
          };

          try {
            const generationSummary = await generateProjectImages({
              items: batchItems,
              visualConfig: visualConfigPayload,
              style: currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              onBatchResult: (result) => {
                if (result.success) {
                  applyResult(result);
                  return;
                }
                batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                const failureReason = _.defaultTo(result.warning, REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR);
                if (_.some(unifiedBatchThumbnails || [], (item) => _.isEqual(item.id, result.sceneId))) {
                  void persistImageCheckpoint();
                  return;
                }
                const failedScene = _.find(realScenes as VideoProject["storyboard"], (item) => _.isEqual(item.id, result.sceneId));
                if (failedScene && !hasSceneAsset(failedScene)) {
                  failedScene.assetStatus = SceneAssetStatus.Failed;
                  failedScene.assetError = failureReason;
                }
                void persistImageCheckpoint();
              },
            });
            if (generationSummary.cancelled) throw new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_CANCELLED);
            appendLog(T.logImageGenerationSummary(completedCount, batchFailureCount, _.size(batchItems), executionVisualConfig.generateType));

            const failedSceneIds = new Set(generationSummary.failedSceneIds);
            const missingScenes = _.filter(remainingTargetScenes, (scene) => failedSceneIds.has(scene.id) && !hasSceneAsset(scene));
            if (!_.isEmpty(missingScenes) && !cancellationRef.current) {
              appendLog(T.logBatchFailuresSummary(_.size(missingScenes), _.size(remainingTargetScenes), T.fallbackThreeTabsReason, executionVisualConfig.generateType));
              await runThreeTabFallback(missingScenes);
            }
          } catch (generationError) {
            if (cancellationRef.current) throw generationError;
            const failureReason = generationError instanceof Error ? generationError.message : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
            appendLog(T.logBatchStreamErrorFallback(failureReason, executionVisualConfig.generateType));
            const missingScenes = _.filter(remainingTargetScenes, (scene) => !hasSceneAsset(scene));
            if (!_.isEmpty(missingScenes)) {
              await runThreeTabFallback(missingScenes);
            }
          } finally {
            await imageCheckpointQueue;
          }
        } else {
          const generateFilmThumbnails = async (): Promise<void> => {
            if (_.isEmpty(unifiedThumbnailItems)) return;
            appendLog(config.language === ProjectLanguage.VI ? "[Ảnh bìa] Gemini đang tạo ảnh bìa song song với clip phim." : "[Thumbnail] Gemini is generating thumbnails in parallel with film clips.");
            await generateProjectImages({
              items: unifiedThumbnailItems,
              visualConfig: {
                ...thumbnailVisualConfigPayload,
                style: currentThumbnailStyle || currentStylePreset,
                batchTabCount: _.min([3, _.size(unifiedThumbnailItems)]) || 1,
              },
              style: currentThumbnailStyle || currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              onBatchResult: (result) => {
                if (!result.success) return;
                const thumbnail = _.find(unifiedBatchThumbnails || [], { id: result.sceneId });
                const imageUrl = createProjectImageUrl(result);
                if (thumbnail && !_.isEmpty(imageUrl)) thumbnail.imageUrl = imageUrl;
              },
            });
          };
          await Promise.all([runSceneGeneration(remainingTargetScenes, false), generateFilmThumbnails()]);
        }

        const unresolvedSourceScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene));
        if (!_.isEmpty(unresolvedSourceScenes) && !cancellationRef.current) {
          if (isCinematicEpisodeGenre(config.genre)) {
            const missingIds = _.join(_.map(unresolvedSourceScenes, "id"), ", ");
            appendLog(config.language === ProjectLanguage.VI ? `[Phim AI] Dừng quy trình: không tạo được clip video ${missingIds}. Không chuyển sang ảnh và không dựng phim thiếu cảnh.` : `[AI Film] Pipeline stopped: video clips ${missingIds} could not be generated. No image substitution or incomplete edit will be produced.`);
            throw new Error(config.language === ProjectLanguage.VI ? `Không tạo được đầy đủ clip video bắt buộc: ${missingIds}` : `Required video clips could not be generated: ${missingIds}`);
          }
          _.forEach(unresolvedSourceScenes, (scene) => {
            scene.assetStrategy = "ai_generated";
            scene.archivalRationale = _.trim(_.join([scene.archivalRationale, "Authentic source unavailable; AI reconstruction used so production can continue"], "; "));
            scene.assetStatus = SceneAssetStatus.Generating;
            scene.assetError = undefined;
          });
          appendLog(config.language === ProjectLanguage.VI ? `[Tư liệu] ${unresolvedSourceScenes.length} cảnh chưa có nguồn phù hợp; chuyển sang tái dựng AI để video tiếp tục.` : `[Archive] ${unresolvedSourceScenes.length} scenes have no suitable source; using AI reconstruction so production continues.`);
          await runSceneGeneration(unresolvedSourceScenes, true);
        }
      }
      const qaEligibleScenes = _.filter(realScenes as StoryboardScene[], (scene) => _.every([hasSceneAsset(scene), scene.assetType !== GenerateType.Video], Boolean));
      for (const scene of qaEligibleScenes) {
        const sceneIndex = _.findIndex(realScenes, (item) => _.isEqual(item.id, scene.id));
        const adjacentAssetUrls = _.compact(_.map(_.slice(realScenes as StoryboardScene[], _.max([0, sceneIndex - 2]) || 0, sceneIndex), (item) => item.assetUrl));
        let qaCompleted = false;
        for (let regenerationAttempt = 0; regenerationAttempt <= SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS; regenerationAttempt++) {
          throwIfCancelled();
          scene.assetStatus = SceneAssetStatus.Validating;
          const qaResult = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { adjacentAssetUrls });
          if (!qaResult.success || !qaResult.quality) {
            scene.qaStatus = QaStatus.Unavailable;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetError = qaResult.error || "visual_qa_unavailable";
            appendLog(config.language === ProjectLanguage.VI ? `[QA ảnh] ${scene.id}: chưa thể kiểm tra; tiếp tục với ảnh hiện có.` : `[Image QA] ${scene.id}: review unavailable; continuing with the current image.`);
            break;
          }

          const regenerationReasons = getSceneVisualRegenerationReasons(qaResult.quality, Boolean(scene.textAllowed));
          if (!shouldRegenerateSceneImage(qaResult.quality, Boolean(scene.textAllowed))) {
            scene.qaStatus = QaStatus.Passed;
            scene.acceptance = AssetAcceptance.Approved;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = undefined;
            const approvedRevision = _.findLast(scene.assetRevisions);
            if (approvedRevision) {
              approvedRevision.status = SceneAssetStatus.Approved;
              approvedRevision.approvedAt = new Date().toISOString();
            }
            qaCompleted = true;
            appendLog(config.language === ProjectLanguage.VI ? `[QA ảnh] ${scene.id}: đạt kiểm tra hình thể và số lượng nhân vật.` : `[Image QA] ${scene.id}: anatomy and subject count passed.`);
            break;
          }

          if (regenerationAttempt >= SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS && !_.isEqual(scene.assetStrategy, "archival")) {
            scene.qaStatus = QaStatus.Failed;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = `visual_qa_retry_limit: ${_.join(regenerationReasons, ",")}`;
            const finalRevision = _.findLast(scene.assetRevisions);
            if (finalRevision) {
              finalRevision.status = SceneAssetStatus.Approved;
              finalRevision.approvedAt = new Date().toISOString();
            }
            appendLog(config.language === ProjectLanguage.VI ? `[QA ảnh] ${scene.id}: vẫn còn cảnh báo sau 2 lần tạo lại; tiếp tục để video hoàn thành.` : `[Image QA] ${scene.id}: warnings remain after 2 regenerations; continuing so the video completes.`);
            qaCompleted = true;
            break;
          }

          const rejectedRevision = _.findLast(scene.assetRevisions);
          if (rejectedRevision) rejectedRevision.status = SceneAssetStatus.Rejected;
          scene.assetStatus = SceneAssetStatus.Retrying;
          appendLog(config.language === ProjectLanguage.VI ? `[QA ảnh] ${scene.id}: phát hiện ${_.join(regenerationReasons, ", ")}; tạo lại lần ${regenerationAttempt + 1}/2.` : `[Image QA] ${scene.id}: detected ${_.join(regenerationReasons, ", ")}; regeneration ${regenerationAttempt + 1}/2.`);

          if (_.isEqual(scene.assetStrategy, "archival")) {
            if (regenerationAttempt < SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS) {
              const replacementResult = await safeSystemFetch(
                API_ROUTES.PIPELINE_SEARCH_ARCHIVAL_IMAGE,
                {
                  query: scene.archivalSearchQuery,
                  chromeHeadless: config.chromeHeadless,
                  excludeSourceUrls: _.compact([scene.archivalSourceUrl]),
                },
                requestSignal,
              );
              const replacement = replacementResult.data;
              if (replacementResult.success && replacement?.success && replacement?.base64) {
                const replacementMime = _.toString(replacement.mimeType || "image/jpeg");
                const replacementUrl = `data:${replacementMime};base64,${replacement.base64}`;
                scene.assetUrl = replacementUrl;
                scene.assetUrls = [replacementUrl];
                scene.archivalSourceUrl = _.toString(replacement.sourceUrl);
                scene.archivalLicense = _.toString(replacement.license);
                scene.assetStatus = SceneAssetStatus.Generated;
                appendAssetRevision(scene, replacementUrl, SceneAssetStatus.Generated);
                await persistImageCheckpoint();
                continue;
              }
            }
            scene.assetStrategy = "ai_generated";
            scene.archivalSearchQuery = "";
            scene.archivalRationale = _.trim(_.join([scene.archivalRationale, "Authentic candidates failed semantic QA; explicit AI reconstruction required"], "; "));
            scene.archivalSourceUrl = undefined;
            scene.archivalLicense = undefined;
            appendLog(config.language === ProjectLanguage.VI ? `[QA tư liệu] ${scene.id}: nguồn thật không chứng minh đúng câu thoại; chuyển sang ảnh AI tái dựng.` : `[Archive QA] ${scene.id}: authentic sources did not prove the narration; switching to AI reconstruction.`);
          }

          const requestContext = createSceneRequestContext(scene, GenerateType.Image);
          const qaRetryPrompt = createTechnicalQaRegenerationPrompt(requestContext.prompt, regenerationReasons);
          const retryResult = await generateProjectImageOnce(
            {
              sceneId: scene.id,
              prompt: qaRetryPrompt,
              referenceImages: requestContext.referenceImages,
              generateType: GenerateType.Image,
            },
            () => ({
              prompt: qaRetryPrompt,
              style: currentStylePreset,
              resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
              bypassCache: true,
              engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
              sandboxConfig: sandboxConfigPayload,
              visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: GenerateType.Image },
            }),
            requestSignal,
          );
          const retryAssetUrl = createProjectImageUrl(retryResult);
          if (retryResult.success && !_.isEmpty(retryAssetUrl)) {
            scene.assetUrl = retryAssetUrl;
            scene.assetUrls = [retryAssetUrl];
            scene.assetType = GenerateType.Image;
            scene.assetStatus = SceneAssetStatus.Generated;
            const retryRevision = appendAssetRevision(scene, retryAssetUrl, SceneAssetStatus.Generated);
            retryRevision.operation = "retry";
            await persistImageCheckpoint();
          } else {
            scene.assetStatus = SceneAssetStatus.Generated;
            scene.assetError = retryResult.warning || "visual_qa_regeneration_failed";
          }
        }
        if (!qaCompleted && scene.qaStatus !== QaStatus.Unavailable) {
          scene.qaStatus = QaStatus.Failed;
          scene.acceptance = AssetAcceptance.AcceptedWithWarning;
        }
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const filmVideoScenes = _.filter(realScenes as StoryboardScene[], (scene) => hasSceneAsset(scene) && _.isEqual(scene.assetType, GenerateType.Video));
        for (const scene of filmVideoScenes) {
          throwIfCancelled();
          let videoQa = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { purpose: "video" });
          const needsVideoRetry = videoQa.success && videoQa.quality && _.some([!videoQa.quality.usableForVideo, !_.isEmpty(videoQa.quality.blockingErrors), _.lt(videoQa.quality.narrativeAlignment || 0, 70), _.lt(videoQa.quality.characterConsistency || 0, 70), _.lt(videoQa.quality.editability || 0, 70)], Boolean);
          if (needsVideoRetry) {
            const reasons = _.uniq(_.compact([...getSceneVisualRegenerationReasons(videoQa.quality!, false), ...videoQa.quality!.blockingErrors, "preserve_identity_continuity_and_complete_all_timed_camera_beats", "finish_with_the_promised_visible_consequence"]));
            const retryPrompt = createTechnicalQaRegenerationPrompt(scene.generationPrompt || scene.prompt, reasons);
            const retryResult = await generateProjectImageOnce(
              {
                sceneId: scene.id,
                prompt: retryPrompt,
                generateType: GenerateType.Video,
                referenceImages: [],
                continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
              },
              (item) => ({
                prompt: item.prompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: true,
                engine: executionVisualConfig.imageGeneratorEngine,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, generateType: GenerateType.Video },
              }),
              requestSignal,
            );
            const retryUrl = createProjectImageUrl(retryResult);
            if (retryResult.success && !_.isEmpty(retryUrl)) {
              scene.assetUrl = retryUrl;
              scene.assetUrls = [retryUrl];
              scene.generationPrompt = retryPrompt;
              appendAssetRevision(scene, retryUrl, SceneAssetStatus.Generated);
              scene.cinematicTakeDecision = "regenerate_once";
              scene.cinematicTakeDecisionReason = _.join(reasons, ",");
              scene.cinematicRegenerationCount = 1;
              videoQa = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { purpose: "video" });
            }
          }
          if (!videoQa.success || !videoQa.quality) {
            scene.qaStatus = QaStatus.Unavailable;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetError = videoQa.error || "video_semantic_qa_unavailable";
          } else if (videoQa.approved) {
            scene.qaStatus = QaStatus.Passed;
            scene.acceptance = AssetAcceptance.Approved;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = undefined;
            scene.cinematicTakeDecision = scene.cinematicRegenerationCount ? "regenerate_once" : "use";
            scene.cinematicTakeDecisionReason = scene.cinematicRegenerationCount ? "directed_retry_passed_semantic_qa" : "semantic_and_continuity_qa_passed";
          } else {
            scene.qaStatus = QaStatus.Failed;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = `video_qa_warning: ${_.join(videoQa.quality.blockingErrors, ",")}`;
            scene.cinematicTakeDecision = "cover";
            scene.cinematicTakeDecisionReason = _.join(_.uniq([...videoQa.quality.blockingErrors, ...getSceneVisualRegenerationReasons(videoQa.quality, false)]), ",") || "semantic_quality_below_release_target";
          }
        }
        await persistImageCheckpoint();
      }

      const technicallyValidScenes = _.filter(realScenes as StoryboardScene[], (scene) => hasSceneAsset(scene));
      const validationSceneIds = new Set(_.map(technicallyValidScenes, "id"));
      _.forEach(technicallyValidScenes, (scene) => {
        scene.assetStatus = SceneAssetStatus.Approved;
        if (!scene.qaStatus) scene.qaStatus = QaStatus.Unavailable;
        if (!scene.acceptance) scene.acceptance = AssetAcceptance.AcceptedWithWarning;
        if (!scene.assetError && scene.qaStatus === QaStatus.Unavailable) scene.assetError = "visual_qa_unavailable";
        const revision = _.findLast(scene.assetRevisions);
        if (revision) {
          revision.status = SceneAssetStatus.Approved;
          revision.approvedAt = new Date().toISOString();
        }
      });
      await persistImageCheckpoint();

      const approvedImageScenes = _.filter(technicallyValidScenes, (scene) => _.every([scene.assetType !== GenerateType.Video, scene.assetStatus === SceneAssetStatus.Approved], Boolean));
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
      const missingFilmTakes = isCinematicEpisodeGenre(config.genre) ? _.filter(realScenes as StoryboardScene[], (scene) => !hasSceneAsset(scene) || scene.assetType !== GenerateType.Video) : [];
      if (!_.isEmpty(missingFilmTakes)) {
        const missingIds = _.join(_.map(missingFilmTakes, "id"), ", ");
        throw new Error(config.language === ProjectLanguage.VI ? `Dừng dựng phim vì thiếu take video hợp lệ: ${missingIds}` : `Film render stopped because valid video takes are missing: ${missingIds}`);
      }
      const completionFallback = ensureRenderReadySceneAssets(realScenes as StoryboardScene[], {
        cinematicVideoOnly: false,
      });
      if (!_.isEmpty(completionFallback.repairedSceneIds)) {
        realScenes = completionFallback.scenes;
        appendLog(config.language === ProjectLanguage.VI ? `[Hoàn thành bắt buộc] Đã phục hồi ${completionFallback.repairedSceneIds.length} cảnh thiếu hình bằng tài sản cục bộ an toàn để tiếp tục render.` : `[Completion guarantee] Recovered ${completionFallback.repairedSceneIds.length} scenes with safe local visual assets so rendering can continue.`);
        await persistImageCheckpoint();
      }
      const sceneAssetSummary = getSceneAssetSummary(realScenes as StoryboardScene[]);
      if (isCinematicEpisodeGenre(config.genre) && _.isEmpty(realScenes)) {
        throw new Error(config.language === ProjectLanguage.VI ? "Chưa có take video thật nào có thể dựng. Hãy kiểm tra phiên Gemini rồi tiếp tục dự án." : "No genuine video take is available for editing. Check the Gemini session and resume the project.");
      }
      if (!sceneAssetSummary.complete) {
        await syncProject({
          ...voiceUpdatedProj,
          status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
          storyboard: realScenes as VideoProject["storyboard"],
        });
        throw new Error(_.replace(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_INCOMPLETE, SecurityConstants.PLACEHOLDER_0, _.toString(_.size(sceneAssetSummary.missingSceneIds))));
      }
      const completedMedia = getSceneAssetSummary(realScenes as StoryboardScene[]);
      appendLog(config.language === ProjectLanguage.VI ? `${completedMedia.complete ? "✅" : "⚠️"} Đã nhận ${completedMedia.completed}/${completedMedia.total} tài nguyên phân cảnh cần thiết.` : `${completedMedia.complete ? "✅" : "⚠️"} Received ${completedMedia.completed}/${completedMedia.total} required scene assets.`);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);

      const imageUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], thumbnails: unifiedBatchThumbnails || voiceUpdatedProj.thumbnails, };
      await syncProject(imageUpdatedProj);

      let seoData: unknown = preparedSeoData;
      if (cachedSeoData) appendLog(T.logResumeSeo);

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

      let thumbnailsList: ThumbnailItem[] = unifiedBatchThumbnails || [];
      let isThumbsCached = unifiedBatchThumbnails !== null && !_.isEmpty(unifiedBatchThumbnails) && _.every(unifiedBatchThumbnails, (thumbnail) => !_.isEmpty(thumbnail.imageUrl));
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
          if (thumbRes.success && thumbRes.data?.thumbnails) parsedThumbs = thumbRes.data.thumbnails;
        }

        if (!_.isEmpty(parsedThumbs)) {
          if (_.isEmpty(existingThumbs) || shouldRegenerateThumbnails) {
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_IDEAS_CREATED, SecurityConstants.PLACEHOLDER_0, _.toString(parsedThumbs.length)));
          }
          const targetThumbsToGen = _.filter(parsedThumbs, (thumb) => {
            if (config.resumeMode && !shouldRegenerateThumbnails && !_.isEmpty(thumb.imageUrl)) return false;
            return true;
          });
          const thumbnailReferenceImages: string[] = [];

          if (config.resumeMode && !shouldRegenerateThumbnails) {
            _.forEach(parsedThumbs, (thumb, idx) => {
              if (!_.isEmpty(thumb.imageUrl)) {
                appendLog(T.logResumeSceneSkip(idx + 1, parsedThumbs.length));
              }
            });
          }

          if (!_.isEmpty(targetThumbsToGen)) {
            if (_.some([_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat), isCinematicEpisodeGenre(config.genre)], Boolean)) {
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_START);

              const batchThumbItems = _.map(targetThumbsToGen, (thumb) => {
                const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                const thumbPrompt = createThumbnailGenerationPrompt(thumb, thumbnailStyle, config.aspectRatio, !_.isEmpty(thumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
                const generationPrompt = thumbPrompt;
                thumb.generationPrompt = generationPrompt;
                return { sceneId: thumb.id, prompt: generationPrompt, generateType: GenerateType.Image, referenceImages: thumbnailReferenceImages, continuityKey: createThumbnailContinuityKey(), };
              });

              let completedCount = SecurityConstants.ZERO;
              let batchFailureCount = SecurityConstants.ZERO;
              const applyThumbResult = (result: ProjectImageResult) => {
                const imageUrl = createProjectImageUrl(result);
                const thumb = _.find(parsedThumbs, (item) => _.isEqual(item.id, result.sceneId));
                if (thumb && !_.isEmpty(imageUrl)) {
                  thumb.imageUrl = imageUrl;
                  completedCount = _.add(completedCount, SecurityConstants.DEFAULT_AMOUNT);
                  appendLog(_.replace(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_SUCCESS, SecurityConstants.PLACEHOLDER_0, _.toString(completedCount)), SecurityConstants.PLACEHOLDER_1, _.toString(targetThumbsToGen.length)));
                }
              };

              const thumbnailGenerationSummary = await generateProjectImages({
                items: batchThumbItems,
                visualConfig: { ...thumbnailVisualConfigPayload, style: currentThumbnailStyle || currentStylePreset, referenceImages: thumbnailReferenceImages, batchTabCount: _.size(targetThumbsToGen) },
                style: currentThumbnailStyle || currentStylePreset,
                sandboxConfig: sandboxConfigPayload,
                cancelRef: cancellationRef,
                onBatchResult: (result) => {
                  if (result.success) {
                    applyThumbResult(result);
                    return;
                  }
                  batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                },
              });
              if (thumbnailGenerationSummary.cancelled) throw new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_CANCELLED);
              const missingBatchThumbs = _.filter(targetThumbsToGen, (thumb) => _.isEmpty(thumb.imageUrl));
              for (const thumb of missingBatchThumbs) {
                const retryItem = _.find(batchThumbItems, (item) => _.isEqual(item.sceneId, thumb.id));
                if (!retryItem || cancellationRef.current) continue;
                const retryResult = await generateProjectImageOnce(
                  retryItem,
                  (item) => ({
                    prompt: item.prompt,
                    style: currentThumbnailStyle || currentStylePreset,
                    resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                    bypassCache: true,
                    engine: ImageGeneratorEngine.Imagen,
                    sandboxConfig: sandboxConfigPayload,
                    visualConfig: {
                      ...thumbnailVisualConfigPayload,
                      generateType: GenerateType.Image,
                      imageGeneratorEngine: ImageGeneratorEngine.Imagen,
                      style: currentThumbnailStyle || currentStylePreset,
                      referenceImages: thumbnailReferenceImages,
                    },
                  }),
                  requestSignal,
                );
                applyThumbResult(retryResult);
              }
            } else {
              for (let i = 0; i < targetThumbsToGen.length; i++) {
                const thumb = targetThumbsToGen[i];
                appendLog(_.replace(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SCENE_GEN, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1)), SecurityConstants.PLACEHOLDER_1, _.toString(targetThumbsToGen.length)));
                const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                const thumbPrompt = createThumbnailGenerationPrompt(thumb, thumbnailStyle, config.aspectRatio, !_.isEmpty(thumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
                const finalThumbPrompt = thumbPrompt;
                thumb.generationPrompt = finalThumbPrompt;

                try {
                  const renderThumbRes = await safeSystemFetch(
                    API_ROUTES.PIPELINE_GENERATE_IMAGE,
                    {
                      prompt: finalThumbPrompt,
                      style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)),
                      resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                      bypassCache: true,
                      engine: _.defaultTo(voiceUpdatedProj.visualConfig.imageGeneratorEngine, ImageGeneratorEngine.Imagen),
                      sandboxConfig: sandboxConfigPayload,
                      visualConfig: { ...thumbnailVisualConfigPayload, style: thumbnailStyle, referenceImages: thumbnailReferenceImages },
                    },
                    requestSignal,
                  );
                  let imgUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
                  if (renderThumbRes.success && renderThumbRes.data?.base64) imgUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, renderThumbRes.data.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING); else if (renderThumbRes.data?.fallbackUrl) imgUrl = renderThumbRes.data.fallbackUrl;

                  const targetThumb = _.find(parsedThumbs, { id: thumb.id });
                  if (targetThumb) targetThumb.imageUrl = imgUrl;
                } catch {
                  appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_WARNING_SINGLE, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1)));
                }
              }
            }
          }
          thumbnailsList = parsedThumbs;
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_FAILED);
        }
      }

      if (isCinematicEpisodeGenre(config.genre)) {
        appendLog(config.language === ProjectLanguage.VI ? "[Ảnh bìa] Đã đồng bộ kết quả ảnh bìa Gemini với dự án phim." : "[Thumbnail] Gemini thumbnail results are synchronized with the film project.");
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const mayUseTextFreeFilmFrame = _.isEqual(config.thumbnailTextInImageMode, ThumbnailTextMode.NoText);
        const missingFilmThumbnails = mayUseTextFreeFilmFrame ? _.filter(thumbnailsList, (thumbnail) => _.isEmpty(thumbnail.imageUrl)) : [];
        const sourceVideoScenes = _.filter(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.assetType, GenerateType.Video) && !_.isEmpty(scene.assetUrl));
        for (let index = 0; index < missingFilmThumbnails.length; index++) {
          const thumbnail = missingFilmThumbnails[index];
          const sourceScene = sourceVideoScenes[index % _.max([1, sourceVideoScenes.length])!];
          if (!sourceScene) break;
          const extracted = await safeSystemFetch(
            API_ROUTES.PIPELINE_EXTRACT_THUMBNAIL_FRAME,
            {
              projectId: newProj.id,
              thumbnailId: thumbnail.id,
              assetUrl: sourceScene.assetUrl,
            },
            requestSignal,
          );
          if (extracted.success && !_.isEmpty(extracted.data?.imageUrl)) {
            thumbnail.imageUrl = extracted.data.imageUrl;
            thumbnail.approved = true;
            appendLog(config.language === ProjectLanguage.VI ? `[Ảnh bìa] Gemini chưa trả ảnh cho ${thumbnail.id}; đã dùng keyframe sạch từ cảnh phim để không để trống thumbnail.` : `[Thumbnail] Gemini did not return ${thumbnail.id}; using a clean film keyframe so the thumbnail is never blank.`);
          }
        }
      }
      for (const thumbnail of thumbnailsList) {
        if (!isUsableGeneratedAssetUrl(thumbnail.imageUrl)) {
          thumbnail.approved = false;
          continue;
        }
        Object.assign(thumbnail, acceptGeneratedThumbnail(thumbnail));
        let thumbnailQa = await validateSceneImage(
          newProj.id,
          {
            id: thumbnail.id,
            script: realScript,
            prompt: thumbnail.prompt,
            generationPrompt: thumbnail.generationPrompt,
            assetUrl: thumbnail.imageUrl,
            expectedSubjectCount: undefined,
            allowBackgroundPeople: true,
            visualIntent: thumbnail.subjectFocus,
            visibleAction: thumbnail.layoutRationale,
            storyEvidence: thumbnail.textText,
          },
          undefined,
          [],
          {
            purpose: "thumbnail",
            expectedHeadline: thumbnail.hasText ? thumbnail.textText : "",
            layoutId: thumbnail.layoutId || thumbnail.layout,
            typographyId: thumbnail.typographyId || thumbnail.typography,
          },
        );
        if (thumbnailQa.success && !thumbnailQa.approved && thumbnail.generationPrompt) {
          const reasons = _.uniq(_.compact([...getSceneVisualRegenerationReasons(thumbnailQa.quality!, true), thumbnail.hasText ? "render_the_exact_required_headline_once_with_correct_spelling" : "", "thumbnail_must_match_the_story_and_selected_layout"]));
          const retryPrompt = createTechnicalQaRegenerationPrompt(thumbnail.generationPrompt, reasons);
          const retryResult = await generateProjectImageOnce(
            {
              sceneId: thumbnail.id,
              prompt: retryPrompt,
              generateType: GenerateType.Image,
              referenceImages: [],
              continuityKey: createThumbnailContinuityKey(),
            },
            (item) => ({
              prompt: item.prompt,
              style: currentThumbnailStyle || currentStylePreset,
              resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
              bypassCache: true,
              engine: ImageGeneratorEngine.Imagen,
              sandboxConfig: sandboxConfigPayload,
              visualConfig: { ...thumbnailVisualConfigPayload, generateType: GenerateType.Image, imageGeneratorEngine: ImageGeneratorEngine.Imagen },
            }),
            requestSignal,
          );
          const retryUrl = createProjectImageUrl(retryResult);
          if (retryResult.success && !_.isEmpty(retryUrl)) {
            thumbnail.imageUrl = retryUrl;
            thumbnail.generationPrompt = retryPrompt;
            thumbnailQa = await validateSceneImage(
              newProj.id,
              {
                id: thumbnail.id,
                script: realScript,
                prompt: thumbnail.prompt,
                generationPrompt: retryPrompt,
                assetUrl: retryUrl,
                expectedSubjectCount: undefined,
                allowBackgroundPeople: true,
                visualIntent: thumbnail.subjectFocus,
                visibleAction: thumbnail.layoutRationale,
                storyEvidence: thumbnail.textText,
              },
              undefined,
              [],
              { purpose: "thumbnail", expectedHeadline: thumbnail.hasText ? thumbnail.textText : "", layoutId: thumbnail.layoutId || thumbnail.layout, typographyId: thumbnail.typographyId || thumbnail.typography },
            );
          }
        }
        if (thumbnailQa.success) {
          thumbnail.qa = thumbnailQa.quality as any;
          thumbnail.qaStatus = thumbnailQa.approved ? QaStatus.Passed : QaStatus.Failed;
          thumbnail.approved = thumbnailQa.approved;
          thumbnail.acceptance = thumbnailQa.approved ? AssetAcceptance.Approved : AssetAcceptance.Rejected;
        }
      }
      const completedThumbnailCount = _.size(_.filter(thumbnailsList, (thumbnail) => thumbnail.approved && !_.isEmpty(thumbnail.imageUrl)));
      if (_.lt(completedThumbnailCount, config.thumbnailCount)) appendLog(_.replace(REFACTOR_CONSTANTS.THUMBNAIL_GENERATION_INCOMPLETE, SecurityConstants.PLACEHOLDER_0, _.toString(_.subtract(config.thumbnailCount, completedThumbnailCount))));
      else appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SUCCESS);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(_.size(_.get(seoData, "titles", [])), _.size(thumbnailsList)));

      let slicedUpdatedProj: VideoProject = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList, storyboard: realScenes as VideoProject["storyboard"] };
      if (globalAudioBase64 && alignmentCompleted) appendLog(T.logResumeAlignment);
      await syncProject(slicedUpdatedProj);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE);

      const voiceQualityResult = nativeFilmAudio
        ? null
        : await assessVoiceAdvisory({
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl,
            provider: _.toString(voiceUpdatedProj.voiceConfig.provider || config.voiceProvider),
            scenes: realScenes as StoryboardScene[],
            targetDurationSeconds: parseTargetDurationSeconds(config.duration),
          });
      if (voiceQualityResult) {
        globalAudioBase64 = voiceQualityResult.audioBase64;
        globalAudioUrl = voiceQualityResult.audioUrl;
        realScenes = voiceQualityResult.scenes;
      } else {
        globalAudioBase64 = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        globalAudioUrl = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(config.language === ProjectLanguage.VI ? "[Phim AI] Giữ thoại, ambience và âm thanh hiện trường trong từng clip; không phủ giọng đọc TTS toàn cục." : "[AI Film] Preserving dialogue, ambience and production sound from each clip; global TTS narration is disabled.");
      }

      slicedUpdatedProj = {
        ...slicedUpdatedProj,
        audioCueSheet: applyOptionalMusicAsset(createAudioCueSheet(realScenes, config.genre), config.musicAssetUrl),
      };

      if (nativeFilmAudio) {
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({
          ...scene,
          subtitle: _.includes(["on_screen_dialogue", "off_screen_dialogue"], scene.dialogueMode) ? _.trim(scene.spokenDialogue) : REFACTOR_CONSTANTS.VD_EMPTY_STRING,
          subtitleCues: [],
        }));
      } else {
        realScenes = createSubtitleCues(realScenes as StoryboardScene[]);
      }
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
          provider: voiceQualityResult?.provider || "native_video_audio",
          voiceArc: genreVoiceArc,
          audioQa: voiceQualityResult?.quality,
        },
      };
      await syncProject(slicedUpdatedProj);

      setCurrentStepIndex(4);
      appendLog(config.language === ProjectLanguage.VI ? (nativeFilmAudio ? "🎞️ Đang kiểm tra điểm cắt, nối các clip, cân bằng âm thanh hiện trường và kết xuất phim." : "🎞️ Đang căn thời lượng, ghép hình/video với lời thoại, phụ đề, nhạc và kết xuất bản cuối.") : nativeFilmAudio ? "🎞️ Checking edit points, joining clips, balancing production audio, and rendering the film." : "🎞️ Aligning timing, assembling visuals with narration, subtitles and music, then rendering the final video.");

      if (nativeFilmAudio) {
        const clipAnalysis = await safeSystemFetch(
          API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
          {
            projectId: newProj.id,
            scenes: _.map(realScenes as StoryboardScene[], (scene) => _.pick(scene, ["id", "assetUrl", "assetType", "shotRole", "dialogueMode"])),
          },
          requestSignal,
        );
        if (clipAnalysis.success && _.isArray(clipAnalysis.data?.decisions)) {
          const decisionsByScene = _.keyBy(clipAnalysis.data.decisions, "sceneId");
          realScenes = _.map(realScenes as StoryboardScene[], (scene) => {
            const decision = decisionsByScene[scene.id];
            const technicalDecision = _.toString(decision?.takeDecision);
            const takeDecision: StoryboardScene["cinematicTakeDecision"] = _.isEqual(technicalDecision, "omit") ? "omit" : _.isEqual(technicalDecision, "trim") ? "trim" : scene.cinematicTakeDecision || "use";
            return decision
              ? {
                  ...scene,
                  sourceTrimStartSeconds: _.toNumber(decision.trimStartSeconds),
                  sourceTrimEndSeconds: _.toNumber(decision.trimEndSeconds),
                  sourceCrop: _.toString(decision.sourceCrop || ""),
                  clipQaWarnings: _.castArray(decision.warnings || []),
                  cinematicTakeDecision: takeDecision,
                  cinematicTakeDecisionReason: _.join(_.compact([scene.cinematicTakeDecisionReason, decision.reason]), ";"),
                }
              : scene;
          });
          const adjustedCount = _.size(_.filter(realScenes, (scene) => _.gt(_.defaultTo(scene.sourceTrimStartSeconds, 0), 0) || _.gt(_.defaultTo(scene.sourceTrimEndSeconds, 0), 0)));
          appendLog(config.language === ProjectLanguage.VI ? `[Dựng phim] Đã phân tích song song ${realScenes.length} clip và tự đặt điểm in/out an toàn cho ${adjustedCount} clip.` : `[Film edit] Analyzed ${realScenes.length} clips in parallel and set safe in/out points for ${adjustedCount} clips.`);
        }
      }

      const renderableScenes = nativeFilmAudio ? _.reject(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.cinematicTakeDecision, "omit")) : (realScenes as StoryboardScene[]);
      const omittedCount = _.subtract(realScenes.length, renderableScenes.length);
      if (omittedCount > 0) appendLog(config.language === ProjectLanguage.VI ? `[Dựng phim] Bỏ ${omittedCount} take hỏng kỹ thuật khỏi bản dựng; giữ nguyên các take hợp lệ để hoàn thành phim.` : `[Film edit] Omitted ${omittedCount} technically broken takes and retained all valid takes for completion.`);
      const expectedRenderDuration = calculateSceneDuration(renderableScenes);
      appendLog(T.logRenderPlan(_.size(renderableScenes), expectedRenderDuration, !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl)));

      const renderPayload = {
        projectId: newProj.id,
        scenes: _.map(renderableScenes, (sc) => ({
          id: _.get(sc, REFACTOR_CONSTANTS.AVG_ID_KEY),
          duration: _.get(sc, "duration") || AUTO_GENERATOR_CONSTANTS.DEFAULT_SCENE_DURATION,
          imageUrl: _.get(sc, "assetUrl"),
          audioBase64: _.isEmpty(globalAudioBase64) && _.isEmpty(globalAudioUrl) ? _.get(sc, "audioBase64") : undefined,
          text: nativeFilmAudio ? undefined : _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
          subtitle: nativeFilmAudio ? _.trim(sc.spokenDialogue) || undefined : sc.subtitle || sc.script,
          subtitleCues: sc.subtitleCues,
          assetType: _.get(sc, REFACTOR_CONSTANTS.AVG_ASSET_TYPE_KEY, GenerateType.Image),
          cameraMotion: _.get(sc, "cameraMotion"),
          effects: _.get(sc, "effects"),
          lightingEffect: _.get(sc, "lightingEffect"),
          transition: _.get(sc, "transition"),
          shotPurpose: _.get(sc, "shotPurpose"),
          visibleAction: _.get(sc, "visibleAction"),
          reaction: _.get(sc, "reaction"),
          sourceTrimStartSeconds: sc.sourceTrimStartSeconds,
          sourceTrimEndSeconds: sc.sourceTrimEndSeconds,
          sourceCrop: sc.sourceCrop,
          cinematicTakeDecision: sc.cinematicTakeDecision,
        })),
        quality: config.ffmpegQuality,
        globalAudioUrl: globalAudioUrl || undefined,
        globalAudioBase64: globalAudioBase64 || undefined,
        aspectRatio: _.isEqual(config.aspectRatio, AspectRatio.NineSixteen) ? FFMPEG_RENDER_CONSTANTS.ASPECT_RATIO_9_16 : REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_16_9,
        subtitleMode: FFMPEG_RENDER_CONSTANTS.DEFAULT_SUBTITLE_MODE,
        audioTracks: createRenderAudioTracks(slicedUpdatedProj.audioCueSheet),
        autoMusicProfile: _.isEmpty(config.musicAssetUrl) ? resolveAutomaticMusicProfile(config.genre) : undefined,
        preserveVideoAudio: nativeFilmAudio,
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
            await new Promise((resolve) => {
              window.setTimeout(resolve, REFACTOR_CONSTANTS.RENDER_STATUS_RETRY_BASE_MS * renderStatusFailureCount);
            });
            continue;
          }
          if (!statusData.success) throw new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED);

          if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_COMPLETED)) {
            renderPending = false;
            activeRenderJobIdRef.current = null;
            let finalMultimodalQa = createAdvisoryFinalVideoReport();
            if (nativeFilmAudio && statusData.url) {
              const finalQaResponse = await safeSystemFetch(
                API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO,
                {
                  videoUrl: statusData.url,
                  script: realScript,
                  viewerPromise: _.get(newProj.narrativePlan, "viewerPromise"),
                  duration: config.duration,
                  genre: config.genre,
                  bypassCache: true,
                },
                requestSignal,
              );
              if (finalQaResponse.success && finalQaResponse.data?.quality) {
                finalMultimodalQa = {
                  ...finalQaResponse.data.quality,
                  reviewAvailable: true,
                };
              }
            }
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? finalQc.releaseStatus === "editorially_publishable"
                  ? "[Phát hành] Bản phim hoàn tất và đạt chuẩn biên tập tự động."
                  : finalQc.releaseStatus === "completed_with_warnings"
                    ? `[Phát hành] Bản phim đã hoàn tất kỹ thuật, còn ${finalQc.warnings.length} cảnh báo cần xem trước khi đăng.`
                    : `[Phát hành] Đã tạo được tệp phim nhưng còn ${finalQc.blockingErrors.length} lỗi chặn chuẩn phát hành.`
                : finalQc.releaseStatus === "editorially_publishable"
                  ? "[Release] Film completed and passed automated editorial review."
                  : finalQc.releaseStatus === "completed_with_warnings"
                    ? `[Release] Film is technically complete with ${finalQc.warnings.length} warnings to review before publishing.`
                    : `[Release] Film file was created with ${finalQc.blockingErrors.length} release-blocking issues.`,
            );
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
            await new Promise((resolve) => {
              window.setTimeout(resolve, REFACTOR_CONSTANTS.POLLING_INTERVAL_MS);
            });
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

  const pipelineActions: PipelineActions = useMemo(
    () => ({
      startPipeline,
      cancelPipeline,
      setActiveCreatedProject,
      setLogs,
      setRenderedVideoUrl,
    }),
    [startPipeline, cancelPipeline],
  );

  return { pipelineState, pipelineActions, syncSelectedProject };
}
