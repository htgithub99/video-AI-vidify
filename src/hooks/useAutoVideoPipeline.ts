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
  AiPlanningFallbackProvider,
  AiPlanningChatModel,
  AiPlanningExecutionMode,
} from "../types";
import { PIPELINE_STEPS, VideoQuality } from "../constants/enums";
import {
  API_ROUTES,
  CONTENT_TYPES,
  CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS,
  SecurityConstants,
  STORAGE_KEYS,
  API_HEADERS,
  PIPELINE_CLIENT_ERRORS,
  SplitStrategy,
} from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import {
  AUTO_GENERATOR_CONSTANTS,
  AUTO_VIDEO_PIPELINE_PROGRESS,
  CINEMATIC_EDIT_ANALYSIS_CONFIG,
  CINEMATIC_CONFIG,
  FFMPEG_RENDER_CONSTANTS,
  FLOW_VIDEO_MEDIA_CONFIG,
  PROJECT_IMAGE_FALLBACK_CONFIG,
  PIPELINE_GUARANTEE_CONFIG,
  PIPELINE_FETCH_FAILURE_KEY,
  REFERENCE_ASSET_GROUP,
} from "../constants/config";
import { IMAGE_PROMPT_PIPELINE_VERSION } from "../constants/imagePromptRules";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { smartSplitSentences } from "../lib/textProcessor";
import { logger } from "../utils/logger";
import { createSystemFetchFailure, safeSystemFetch, generateRandomString, type SystemFetchResult } from "../lib/shared-utils";
import {
  createProjectImageUrl,
  generateProjectImages,
  generateProjectImageOnce,
  getSceneAssetSummary,
  hasSceneAsset,
  isPersistedProjectVideoUrl,
  isUsableGeneratedAssetUrl,
  prepareProjectMediaPrompt,
  recoverProjectFlowVideo,
  resolveSceneGenerateType,
  selectVideoSceneIds,
  type ProjectImageResult,
} from "../services/projectImageGenerationService";
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

const getRestoredPipelineProgress = (project: VideoProject): { step: number; progress: number } => {
  const phase = project.generationCheckpoint?.phase;
  if (_.isEqual(phase, "completed")) return { step: PIPELINE_STEPS.STEP_4, progress: AUTO_VIDEO_PIPELINE_PROGRESS.COMPLETE };
  if (_.isEqual(phase, "rendering") || _.isEqual(project.generationCheckpoint?.lastSuccessfulPhase, "render"))
    return { step: PIPELINE_STEPS.STEP_4, progress: AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE };
  if (_.includes(["media_generation", "media_completed"], phase))
    return { step: PIPELINE_STEPS.STEP_3, progress: _.isEqual(phase, "media_completed") ? AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE : AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START };
  if (!_.isEmpty(project.storyboard)) return { step: PIPELINE_STEPS.STEP_2, progress: AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE };
  return { step: PIPELINE_STEPS.STEP_1, progress: AUTO_VIDEO_PIPELINE_PROGRESS.START };
};

const hasAccessibleReferenceImage = async (source: string, signal?: AbortSignal): Promise<boolean> => {
  if (_.isEmpty(source)) return false;
  if (_.startsWith(source, REFACTOR_CONSTANTS.DATA_URL_PREFIX)) return true;
  try {
    const response = await fetch(source, { method: REFACTOR_CONSTANTS.HTTP_METHOD_HEAD, signal });
    return response.ok && _.startsWith(_.defaultTo(response.headers.get(CONTENT_TYPE_HEADER), ""), REFACTOR_CONSTANTS.IMAGE_MIME_TYPE_PREFIX);
  } catch {
    return false;
  }
};

const hasCompleteCharacterReferences = async (character: CharacterConfig, signal?: AbortSignal): Promise<boolean> => {
  const images = _.uniq(_.filter(_.castArray(character.images || []), _.isString));
  if (_.isEmpty(images)) return false;
  const availability = await Promise.all(_.map(images, (image) => hasAccessibleReferenceImage(image, signal)));
  return _.every(availability, Boolean);
};

const mergeCharacterReferenceState = (existingCharacters: CharacterConfig[] | undefined, nextCharacters: CharacterConfig[]): CharacterConfig[] => {
  const existingById = _.keyBy(_.defaultTo(existingCharacters, []), "id");
  const existingByName = _.keyBy(_.defaultTo(existingCharacters, []), (character) => _.toLower(_.trim(character.name)));

  return _.map(nextCharacters, (character) => {
    const existingCharacter = existingById[character.id] || existingByName[_.toLower(_.trim(character.name))];
    if (!existingCharacter) return character;
    const images = _.isEmpty(character.images) ? _.defaultTo(existingCharacter.images, []) : character.images;
    return {
      ...existingCharacter,
      ...character,
      images,
      extracted: Boolean(character.extracted || existingCharacter.extracted || !_.isEmpty(images)),
    };
  });
};

const preserveExistingList = <T,>(nextValues: T[] | undefined, existingValues: T[] | undefined): T[] =>
  _.isEmpty(nextValues) && !_.isEmpty(existingValues) ? _.defaultTo(existingValues, []) : _.defaultTo(nextValues, []);
import { evaluateImagePrompts } from "../services/imagePromptQualityService";
import { createScriptGroundedStoryboard, ensureScriptGroundedSceneDetails, ensureStoryboardScriptCoverage } from "../services/storyboardFallbackService";
import { applyProfessionalEditingPolicy } from "../services/editingPolicyService";
import { ensureMediaSourcePlan } from "../services/mediaSourcePlanningService";
import { parseTargetDurationSeconds } from "../services/scriptQualityService";
import {
  createCharacterIdentityDescription,
  createSceneGenerationContext,
  pruneUnsupportedSceneCharacterIds,
  resolveCinematicSceneCharacterReferences,
  resolveSceneCharacterIds,
  SCENE_REFERENCE_CONFIG,
} from "../services/sceneReferenceService";
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
import {
  createTechnicalQaRegenerationPrompt,
  getSceneVisualRegenerationReasons,
  SCENE_VISUAL_QUALITY_CONFIG,
  shouldRegenerateSceneImage,
  validateSceneImage,
} from "../services/sceneVisualQualityService";
import { isHookTopicallyGrounded } from "../services/hookResilienceService";
import { validateChapterLanguage } from "../services/chapterLanguageValidationService";
import { createSourceGroundedSeo } from "../services/seoFallbackService";
import { acquirePipelineRunLease, refreshPipelineRunLease, releasePipelineRunLease } from "../services/pipelineRunLockService";
import {
  applyCinematicProductionPolicy,
  getCinematicDialogueTakeIssues,
  getCinematicGeneratedTakeIssues,
  getCinematicScriptReadinessIssues,
  getCinematicStoryboardContractIssues,
  getCinematicStoryboardReadinessIssues,
  isCinematicEpisodeGenre,
} from "../services/cinematicProductionPolicyService";
import {
  applyCinematicClipAnalysisDecisions,
  countCinematicTimelineShots,
  createCinematicEditTimeline,
  trimCinematicTimelineToDialogue,
} from "../services/cinematicEditTimelineService";
import { getCinematicPromptPreflightIssues, resolveAuthoritativeCinematicPrompt } from "../services/cinematicPromptPreflightService";
import { createCinematicVideoPrompt } from "../services/cinematicEpisodeService";
import { Lang } from "../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../constants/texts";
import {
  CINEMATIC_CHARACTER_PACK_CONFIG,
  CINEMATIC_CHAT_PLANNING_CONFIG,
  CINEMATIC_PLANNING_MESSAGES,
  CINEMATIC_POLICY_CONFIG,
  resolveCinematicClipDuration,
} from "../constants/cinematicConstants";
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
  videoResolution: string;
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
  runIntent?: "new" | "continue" | "render_only";
  ffmpegQuality: VideoQuality;
  selectedProjectId?: string | null;
  forceRegenerateVoice?: boolean;
  forceRegenerateScenes?: boolean;
  targetSceneIds?: string[];
  musicAssetUrl?: string;
  filmFormat?: "single" | "series";
  episodeCount?: number;
  cinematicMode?: boolean;
  planningFallbackProvider?: AiPlanningFallbackProvider;
  planningChatModel?: AiPlanningChatModel;
  planningExecutionMode?: AiPlanningExecutionMode;
  planningChromeHeadless?: boolean;
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

const createFallbackCharacterProfile = (_stylePresetName?: string): Record<string, any> => {
  return {
    name: "An",
    description: "",
    prompt: "",
    narrativeRole: "protagonist",
    genderPresentation: "neutral",
    ageRange: "20s",
    ethnicitySkinTone: "fair",
    bodyBuild: "standard",
    faceShape: "standard",
    eyes: "expressive",
    nose: "",
    hair: "",
    signatureClothing: "casual",
    accessories: "",
    colorPalette: "harmonious",
    silhouette: "recognizable",
    timelineStages: [],
  };
};

const getCinematicCharacterArtifactIssues = (artifact: any): string[] => {
  const characters = _.castArray(artifact?.characters || []);
  const requiredIdentityFields = [
    "id",
    "name",
    "narrativeRole",
    "genderPresentation",
    "ageRange",
    "bodyBuild",
    "faceShape",
    "eyes",
    "hair",
    "signatureClothing",
    "colorPalette",
    "silhouette",
    "description",
    "prompt",
    "referenceGenerationPrompt",
  ];
  const ids = _.map(characters, (character) => _.trim(_.toString(character?.id)));
  return _.uniq(
    _.compact([
      _.isEmpty(characters) && "characters:missing",
      _.uniq(ids).length !== ids.length && "characters:duplicate_id",
      _.isEmpty(_.trim(_.toString(artifact?.characterAnalysis))) && "characterAnalysis:missing",
      _.isEmpty(_.trim(_.toString(artifact?.characterSpecs))) && "characterSpecs:missing",
      ..._.flatMap(characters, (character, index) => [
        ..._.map(
          _.filter(requiredIdentityFields, (field) => _.isEmpty(_.trim(_.toString(_.get(character, field))))),
          (field) => `characters:${index}:${field}:missing`,
        ),
        (!_.isArray(character?.timelineStages) || _.isEmpty(character.timelineStages)) && `characters:${index}:timelineStages:missing`,
      ]),
    ]),
  );
};

export function useAutoVideoPipeline(
  projects: VideoProject[],
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void,
  currentLang: Lang,
  pipelineScope: "auto" | "cinematic" = "auto",
) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;
  const isCinematicScope = _.isEqual(pipelineScope, CINEMATIC_CONFIG.STATE_SCOPE);
  const selectedProjectStorageKey = isCinematicScope ? REFACTOR_CONSTANTS.KEY_SELECTED_CINEMATIC_PROJECT : REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT;
  const currentLogsStorageKey = isCinematicScope ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_CURRENT_LOGS : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS;
  const projectLogsStoragePrefix = isCinematicScope
    ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_PROJECT_LOGS_PREFIX
    : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX;

  const processingRef = useRef(false);
  const cancellationRef = useRef(false);
  const requestAbortControllerRef = useRef<AbortController | null>(null);
  const activeRenderJobIdRef = useRef<string | null>(null);
  const activePipelineRunIdRef = useRef<string | null>(null);
  const activeProjectSnapshotRef = useRef<VideoProject | null>(null);
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
    activeProjectSnapshotRef.current = activeCreatedProject;
  }, [activeCreatedProject]);

  useEffect(() => {
    const restoreAutoProject = async () => {
      if (processingRef.current) return;
      try {
        const savedId = await storageUtils.getAsync(selectedProjectStorageKey);
        if (savedId && !activeCreatedProject) {
          const foundProj = _.find(projects, { id: savedId });
          if (foundProj) {
            setActiveCreatedProject(foundProj);
            const restoredProgress = getRestoredPipelineProgress(foundProj);
            setCurrentStepIndex(restoredProgress.step);
            setStepProgress(restoredProgress.progress);
            if (foundProj.renderedVideoUrl) setRenderedVideoUrl(foundProj.renderedVideoUrl);
            const cachedLogsStr = storageUtils.get(`${projectLogsStoragePrefix}${foundProj.id}`);
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
      const restoredProgress = getRestoredPipelineProgress(foundProj);
      setCurrentStepIndex(restoredProgress.step);
      setStepProgress(restoredProgress.progress);
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const cachedLogsStr = storageUtils.get(`${projectLogsStoragePrefix}${foundProj.id}`);
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
        const restoredProgress = getRestoredPipelineProgress(foundProj);
        setCurrentStepIndex(restoredProgress.step);
        setStepProgress(restoredProgress.progress);
      storageUtils.setAsync(selectedProjectStorageKey, selectedProjectId);
        setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        const cachedLogsStr = storageUtils.get(`${projectLogsStoragePrefix}${foundProj.id}`);
        const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
        const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
        setLogs(projectLogs || []);
      }
    },
    [activeCreatedProject, projects],
  );

  const startPipeline = async (config: PipelineConfig) => {
    if (processingRef.current) return;
    const requestedRunIntent = config.runIntent || (config.resumeMode ? "continue" : "new");
    const requestedContinuation = _.includes(["continue", "render_only"], requestedRunIntent);
    let hydratedContinuationTarget: VideoProject | null = null;
    if (requestedContinuation) {
      const savedTargetSummary = resolveTargetProject(
        projects,
        config.selectedProjectId,
        activeCreatedProject,
        config.projectName,
        config.scriptContent,
        config.cinematicMode,
      ).existingTargetProject;
      if (savedTargetSummary?.id) {
        hydratedContinuationTarget = await fetch(`${API_ROUTES.PROJECTS}/${savedTargetSummary.id}`)
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);
      }
      const savedTarget = hydratedContinuationTarget || savedTargetSummary;
      if (_.isEmpty(_.trim(config.scriptContent))) {
      config.scriptContent = _.toString(
        savedTarget?.input?.content ||
          savedTarget?.scriptRewritten ||
          _.join(_.map(savedTarget?.chapters, "scriptSegment"), " ") ||
          _.join(_.map(savedTarget?.storyboard, "script"), " "),
      );
      }
    }
    if (_.isEmpty(_.trim(config.scriptContent))) {
      toast.warning(T.alertEmptyScript);
      return;
    }
    const presentationTarget =
      hydratedContinuationTarget ||
      resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent, config.cinematicMode).existingTargetProject;
    const startsDifferentContent =
      Boolean(presentationTarget) &&
      _.some([!_.isEqual(presentationTarget?.input?.type, config.inputType), !_.isEqual(_.trim(presentationTarget?.input?.content), _.trim(config.scriptContent))], Boolean);
    const runIntent = requestedRunIntent;
    const isContinuation = _.includes(["continue", "render_only"], runIntent);
    const isCinematicPipeline = Boolean(
      config.cinematicMode ||
        isCinematicEpisodeGenre(config.genre) ||
        _.isEqual(presentationTarget?.projectKind, ProjectKind.Cinematic) ||
        _.endsWith(_.toString(presentationTarget?.name), " - Phim AI"),
    );
    config.resumeMode = isContinuation;
    const resetDerivedPresentation = !isContinuation || startsDifferentContent;

    if (resetDerivedPresentation) {
      setActiveCreatedProject(null);
      setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      setLogs([]);
      setCurrentStepIndex(0);
      setStepProgress(0);
    }

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
    const pipelineRunId = pipelineRunLease.runId;
    activePipelineRunIdRef.current = pipelineRunId;

    const throwIfCancelled = () => {
      if (cancellationRef.current || requestSignal.aborted || !_.isEqual(activePipelineRunIdRef.current, pipelineRunId)) {
        throw new DOMException(T.cancelledError, "AbortError");
      }
    };

    setIsProcessing(true);
    setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.START);
    setCurrentStepIndex(1);

    let currentLogs: string[] = config.resumeMode ? _.clone(logs) : [];
    setLogs(_.clone(currentLogs));
    if (!config.resumeMode) storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify([]));
    let currentLogProjectId = config.resumeMode ? _.toString(config.selectedProjectId || activeCreatedProject?.id) : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    const appendLog = (msg: string) => {
      if (!_.isEqual(activePipelineRunIdRef.current, pipelineRunId)) return;
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${msg}`;
      currentLogs = _.concat(currentLogs, formatted);
      setLogs(_.clone(currentLogs));
      storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify(currentLogs));
      if (currentLogProjectId) {
        storageUtils.set(`${projectLogsStoragePrefix}${currentLogProjectId}`, jsonUtils.safeStringify(currentLogs));
      }
    };

    const pipelineStartedAt = Date.now();
    let currentProject: VideoProject | null = resetDerivedPresentation ? null : activeCreatedProject;
    appendLog(
      config.cinematicMode
        ? config.language === ProjectLanguage.VI
          ? config.resumeMode
            ? CINEMATIC_PLANNING_MESSAGES.VI_CONTINUE
            : CINEMATIC_PLANNING_MESSAGES.VI_START_NEW
          : config.resumeMode
            ? CINEMATIC_PLANNING_MESSAGES.EN_CONTINUE
            : CINEMATIC_PLANNING_MESSAGES.EN_START_NEW
        : T.logPipelineStart,
    );
    appendLog(T.logConfigSummary(config.genre, config.language, config.duration, config.generationMode, config.resumeMode));

    try {
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_INIT);

      let newProjectId: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      const pipelineSystemFetch = (url: string, payload: any, signal?: AbortSignal) =>
        safeSystemFetch(
          url,
          {
            ...payload,
            aiExecution: {
              mode: config.planningExecutionMode,
              provider: config.planningFallbackProvider,
              model: config.planningChatModel,
              projectId: newProjectId || pipelineTargetKey,
              chromeHeadless: config.planningChromeHeadless,
            },
          },
          signal,
        );
      let newProj: VideoProject;
      const resolvedTarget = resolveTargetProject(
        projects,
        config.selectedProjectId,
        activeCreatedProject,
        config.projectName,
        config.scriptContent,
        config.cinematicMode,
      );
      const selectedAutoProj = resolvedTarget.selectedAutoProject;
      const rawExistingTargetProj = hydratedContinuationTarget || resolvedTarget.existingTargetProject;
      const existingTargetProj = migrateVideoProject(rawExistingTargetProj);
      const referenceChangeState = getReferenceChangeState(
        existingTargetProj,
        config.referenceImages,
        config.sceneReferenceImages,
        config.thumbnailReferenceImages,
        [],
        isContinuation,
      );
      let invalidationState = preserveInterruptedStoryboardCheckpoint(existingTargetProj, config, getPipelineInvalidationState(existingTargetProj, config, referenceChangeState));
      if (isContinuation && existingTargetProj) {
        invalidationState = {
          regenerateScript: _.isEmpty(existingTargetProj.scriptRewritten),
          regenerateStoryboard: _.isEmpty(existingTargetProj.storyboard),
          regenerateVoice: !isCinematicEpisodeGenre(config.genre) && _.isEmpty(existingTargetProj.voiceConfig?.audioUrl) && _.isEmpty(existingTargetProj.voiceConfig?.audioBase64),
          regenerateSceneAssets: false,
          regenerateSeo: _.isEmpty(existingTargetProj.seo),
          regenerateThumbnails: _.isEmpty(existingTargetProj.thumbnails),
        };
      }
      const sceneStyleProfileOutdated = _.every(
        [!_.isEmpty(existingTargetProj?.visualConfig?.styleReferenceImages), _.isEmpty(existingTargetProj?.visualBible?.styleProfile?.characterType)],
        Boolean,
      );
      const thumbnailStyleProfileOutdated = _.every(
        [!_.isEmpty(existingTargetProj?.visualConfig?.thumbnailReferenceImages), _.isEmpty(existingTargetProj?.visualConfig?.thumbnailStyleProfile?.characterType)],
        Boolean,
      );
      const requiresVisualReferenceMigration =
        _.some(existingTargetProj?.storyboard, (scene) => _.isEmpty(scene.layout) || _.isNil(scene.textAllowed)) || sceneStyleProfileOutdated || thumbnailStyleProfileOutdated;
      const requiresPromptPlanningMigration = _.some(existingTargetProj?.storyboard, (scene) => {
        if (!_.isEmpty(getVisualShotPlanIssues(scene, scene))) return true;
        if (!isCinematicEpisodeGenre(config.genre)) return false;
        const beatCount = _.size(scene.cinematicBeats);
        const generationPrompt = _.trim(_.toString(scene.generationPrompt));
        return (
          !_.inRange(beatCount, 3, 6) ||
          _.isEmpty(generationPrompt) ||
          /one continuous (?:coherent )?(?:editorial )?shot|no internal cut|single[- ]take|Video motion direction:/i.test(generationPrompt)
        );
      });
      const hasPendingSceneAssets = _.some(existingTargetProj?.storyboard, (scene) => _.isEmpty(scene.assetUrl) && _.isEmpty(scene.assetUrls));
      let shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets || (!isContinuation && (requiresVisualReferenceMigration || requiresPromptPlanningMigration));

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
            planningFallbackProvider: config.planningFallbackProvider,
            planningChatModel: config.planningChatModel,
            planningExecutionMode: config.planningExecutionMode,
            planningChromeHeadless: config.planningChromeHeadless,
          },
          hookConfig: {
            ...existingTargetProj.hookConfig,
            type: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : config.hookStrategy,
            duration: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : config.hookDuration,
            count: isCinematicPipeline ? SecurityConstants.ZERO : existingTargetProj.hookConfig.count,
            positions: isCinematicPipeline ? HookPosition.Start : (config.hookPosition as HookPosition),
            versions: isCinematicPipeline ? [] : existingTargetProj.hookConfig.versions,
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
            styleReferenceImages: preserveExistingList(config.referenceImages, existingTargetProj.visualConfig.styleReferenceImages),
            sceneReferenceImages: preserveExistingList(config.sceneReferenceImages, existingTargetProj.visualConfig.sceneReferenceImages),
            thumbnailReferenceImages: preserveExistingList(config.thumbnailReferenceImages, existingTargetProj.visualConfig.thumbnailReferenceImages),
            thumbnailSceneReferenceImages: preserveExistingList(config.thumbnailSceneReferenceImages, existingTargetProj.visualConfig.thumbnailSceneReferenceImages),
            referenceImages: preserveExistingList(
              _.take(_.uniq(_.concat(config.referenceImages || [], config.sceneReferenceImages || [])), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
              existingTargetProj.visualConfig.referenceImages,
            ),
            planningFallbackProvider: config.planningFallbackProvider,
            planningChatModel: config.planningChatModel,
            planningExecutionMode: config.planningExecutionMode,
            planningChromeHeadless: config.planningChromeHeadless,
          },
          generationCheckpoint: {
            intent: runIntent,
            phase: "initializing",
            lastSuccessfulPhase: existingTargetProj.generationCheckpoint?.lastSuccessfulPhase,
            completedSceneIds: _.map(
              _.filter(existingTargetProj.storyboard, (scene) => !_.isEmpty(scene.assetUrl)),
              "id",
            ),
            pendingSceneIds: _.map(
              _.filter(existingTargetProj.storyboard, (scene) => _.isEmpty(scene.assetUrl)),
              "id",
            ),
            failedSceneIds: [],
            updatedAt: new Date().toISOString(),
          },
        };
        setActiveCreatedProject(newProj);
        appendLog(T.logResumeProject(newProj.name));
      } else {
        const selectedProj = _.defaultTo(selectedAutoProj, activeCreatedProject);
        const isChildProject = selectedProj && selectedProj.parentId;

        newProjectId = selectedProj ? selectedProj.id : _.join([REFACTOR_CONSTANTS.AVG_PROJECT_ID_PREFIX, generateRandomString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

        const defaultName = selectedProj
          ? selectedProj.name
          : _.trim(config.projectName) || _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

        newProj = {
          id: newProjectId,
          allowBulkDeleteImages: true,
          isRecreatingStoryboard: true,
          allowAudioCleanup: true,
          resetDerivedData: true,
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
            type: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : config.hookStrategy,
            duration: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : config.hookDuration,
            count: isCinematicPipeline ? SecurityConstants.ZERO : 3,
            positions: isCinematicPipeline ? HookPosition.Start : (config.hookPosition as HookPosition),
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
            planningFallbackProvider: config.planningFallbackProvider,
            planningChatModel: config.planningChatModel,
            planningExecutionMode: config.planningExecutionMode,
            planningChromeHeadless: config.planningChromeHeadless,
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
          generationCheckpoint: { intent: runIntent, phase: "initializing", completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [], updatedAt: new Date().toISOString() },
        };
      }

      const referenceGroups: Array<[string, string[]]> = await Promise.all(
        _.map(
          [
            { group: "style", images: config.referenceImages, configKey: "styleReferenceImages" },
            { group: "scene", images: config.sceneReferenceImages, configKey: "sceneReferenceImages" },
            { group: "thumbnail", images: config.thumbnailReferenceImages, configKey: "thumbnailReferenceImages" },
            { group: "thumbnailScene", images: config.thumbnailSceneReferenceImages, configKey: "thumbnailSceneReferenceImages" },
          ],
          async ({ group, images, configKey }): Promise<[string, string[]]> => {
            if (_.isEmpty(images)) return [group, _.defaultTo(_.get(newProj.visualConfig, configKey), [])];
            const response = await pipelineSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${newProjectId}/${group}`, { images });
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
        const audioResponse = await pipelineSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_AUDIO}/${newProjectId}`, { audio: musicAssetUrl });
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
          characterImages: isContinuation ? _.defaultTo(newProj.visualConfig.characterImages, []) : [],
        },
      };
      config.musicAssetUrl = musicAssetUrl;
      newProj = { ...newProj, rollout: resolveRolloutConfig(newProjectId) };
      await storageUtils.setAsync(selectedProjectStorageKey, newProjectId);
      currentLogProjectId = newProjectId;
      storageUtils.set(`${projectLogsStoragePrefix}${newProjectId}`, jsonUtils.safeStringify(currentLogs));
      setActiveCreatedProject(newProj);
      activeProjectSnapshotRef.current = newProj;
      currentProject = newProj;

      const syncProject = async (proj: VideoProject): Promise<VideoProject> => {
        throwIfCancelled();
        if (!refreshPipelineRunLease(pipelineRunLease)) throw new Error(REFACTOR_CONSTANTS.ERR_PIPELINE_RUN_REPLACED);
        const isCompleted = _.isEqual(proj.status, REFACTOR_CONSTANTS.STATUS_COMPLETED);
        const finalProj = {
          ...proj,
          activeRunId: isCompleted ? null : pipelineRunLease.runId,
          lastRunId: isCompleted ? pipelineRunLease.runId : proj.lastRunId,
          generationLogs: _.clone(currentLogs),
          updatedAt: new Date().toISOString(),
        };
        currentProject = finalProj;
        activeProjectSnapshotRef.current = finalProj;
        setActiveCreatedProject(finalProj);
        const persistedProject = await onUpdateProject(finalProj, true);
        throwIfCancelled();
        if (persistedProject) {
          currentProject = persistedProject;
          activeProjectSnapshotRef.current = persistedProject;
          setActiveCreatedProject(persistedProject);
        }
        return persistedProject || finalProj;
      };

      await syncProject(newProj);
      newProj = currentProject || newProj;
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
      const cachedNarrationIsOffTopic = !isCinematicPipeline && isScriptCached && !isHookTopicallyGrounded(cachedOpening, config.scriptContent);
      const cachedNarrationLanguageInvalid = isScriptCached && !validateChapterLanguage(realScript, _.isEqual(config.language, ProjectLanguage.VI)).valid;
      const cachedCinematicScriptIssues = isCinematicPipeline && isScriptCached
        ? getCinematicScriptReadinessIssues(realScript, chapters, newProj.scriptQa, newProj.contentSafety)
        : [];
      if (cachedNarrationIsOffTopic || cachedNarrationLanguageInvalid || !_.isEmpty(cachedCinematicScriptIssues)) {
        isScriptCached = false;
        isStoryboardCached = false;
        shouldRegenerateSceneAssets = true;
        config.forceRegenerateVoice = true;
        realScript = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        realScenes = [];
        if (!_.isEmpty(cachedCinematicScriptIssues))
          appendLog(
            config.language === ProjectLanguage.VI
              ? `[Kịch bản] Bản đã lưu chưa đạt: ${_.join(cachedCinematicScriptIssues, ", ")}. Chỉ chạy lại bước kịch bản.`
              : `[Script] The saved result is not ready: ${_.join(cachedCinematicScriptIssues, ", ")}. Retrying only the script step.`,
          );
      }
      if (isCinematicPipeline && isContinuation && isStoryboardCached) {
        const cachedExpectedClipCount = Math.max(1, Math.ceil(parseTargetDurationSeconds(config.duration) / resolveCinematicClipDuration(config.videoDuration)));
        const cachedStoryboardIssues = getCinematicStoryboardReadinessIssues(realScenes, cachedExpectedClipCount, newProj.storyboardQa);
        if (!_.isEmpty(cachedStoryboardIssues)) {
          isStoryboardCached = false;
          shouldRegenerateSceneAssets = true;
          realScenes = [];
          appendLog(
            config.language === ProjectLanguage.VI
              ? `[Storyboard] Bản đã lưu chưa đạt (${_.join(cachedStoryboardIssues, ", ")}); dựng lại storyboard nhưng sẽ tái sử dụng asset đúng theo scene ID.`
              : `[Storyboard] The saved result is incomplete (${_.join(cachedStoryboardIssues, ", ")}); rebuilding the storyboard while reusing valid assets by scene ID.`,
          );
        }
      }

      if (!isScriptCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_WRITE);
        appendLog(T.logScriptRequestDetail(_.size(config.scriptContent), config.inputType));
        const scriptPayload = {
          projectId: newProjectId,
          originalInput: config.scriptContent,
          inputType: config.inputType,
          config: { ...newProj.config, hookConfig: isCinematicPipeline ? undefined : newProj.hookConfig },
          selectedHookText: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
          bypassCache: !config.resumeMode,
        };

        let scriptRes: SystemFetchResult = createSystemFetchFailure(PIPELINE_FETCH_FAILURE_KEY.SCRIPT);
        let scriptData: any;
        let scriptReadinessIssues: string[] = [];
        for (let scriptAttempt = 0; scriptAttempt < (isCinematicPipeline ? PIPELINE_GUARANTEE_CONFIG.SCRIPT_ATTEMPTS : 1); scriptAttempt++) {
          scriptRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_SCRIPT, { ...scriptPayload, bypassCache: scriptAttempt > 0 || scriptPayload.bypassCache }, requestSignal);
          throwIfCancelled();
          scriptData = scriptRes.success && scriptRes.data && !scriptRes.data.error ? scriptRes.data : undefined;
          scriptReadinessIssues = scriptData
            ? getCinematicScriptReadinessIssues(
                _.toString(scriptData.rewrittenScript),
                _.castArray(scriptData.chapters || []) as Chapter[],
                scriptData.scriptQa,
                scriptData.contentSafety,
              )
            : [_.toString(scriptRes.error || "script_request_failed")];
          if (!isCinematicPipeline || _.isEmpty(scriptReadinessIssues)) break;
          if (scriptAttempt < PIPELINE_GUARANTEE_CONFIG.SCRIPT_ATTEMPTS - 1)
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Kịch bản] Lần ${scriptAttempt + 1} chưa đạt (${_.join(scriptReadinessIssues, ", ")}); đang retry riêng bước kịch bản.`
                : `[Script] Attempt ${scriptAttempt + 1} is incomplete (${_.join(scriptReadinessIssues, ", ")}); retrying only the script step.`,
            );
        }
        if (isCinematicPipeline && (!scriptData || !_.isEmpty(scriptReadinessIssues))) {
          throw new Error(
            config.language === ProjectLanguage.VI
              ? `Kịch bản chưa đạt điều kiện bắt buộc: ${_.join(scriptReadinessIssues, ", ")}`
              : `The script did not pass mandatory readiness: ${_.join(scriptReadinessIssues, ", ")}`,
          );
        }
        scriptData =
          scriptData ||
          ({
                rewrittenScript: config.scriptContent,
                chapters: [],
                factCheckNotes: "",
                hookVersions: [],
                scriptQa: undefined,
                aiMetrics: [],
                contentSafety: undefined,
              } as any);
        if (!scriptRes.success || !scriptRes.data || scriptRes.data.error) {
          appendLog(
            config.language === ProjectLanguage.VI
              ? "AI viết kịch bản chưa khả dụng; tiếp tục bằng nội dung người dùng để bảo đảm video vẫn được tạo."
              : "AI script writing is unavailable; continuing with the user's content so the video still completes.",
          );
        }
        if (_.isEqual(scriptData.scriptQa?.passed, false)) {
          const hasBlockingScriptIssue = !_.isEmpty(scriptData.scriptQa?.blockingErrors);
          appendLog(
            isCinematicPipeline && !hasBlockingScriptIssue
              ? REFACTOR_CONSTANTS.INFO_CINEMATIC_SCRIPT_QA_CONTINUED
              : isCinematicPipeline
                ? REFACTOR_CONSTANTS.WARN_CINEMATIC_SCRIPT_QA_CONTINUED
                : REFACTOR_CONSTANTS.WARN_SCRIPT_QA_CONTINUED,
          );
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
        if (_.every([!isCinematicPipeline, _.gt(newProj.hookConfig.count, SecurityConstants.ZERO), _.isEmpty(hookVersions)], Boolean)) {
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
      if (!isCinematicPipeline) realScript = removeAdjacentRepeatedNarrationSentences(realScript);
      const didRepairRepeatedNarration = !isCinematicPipeline && !_.isEqual(realScript, narrationBeforeContinuityRepair);
      if (didRepairRepeatedNarration) {
        newProj = { ...newProj, scriptRewritten: realScript };
        await syncProject(newProj);
      }

      const curatedPreset = resolveStylePreset(config.stylePreset || newProj.visualConfig.style || newProj.visualConfig.referencePrompt);
      let currentStylePreset = curatedPreset.positivePrompt;
      let currentThumbnailStyle = resolveStylePreset(config.thumbnailStylePreset || newProj.visualConfig.thumbnailReferencePrompt || currentStylePreset).positivePrompt;
      const hasStyleReferences = !_.isEmpty(newProj.visualConfig.styleReferenceImages);

      if (!isStoryboardCached || config.forceRegenerateScenes || (!isContinuation && requiresVisualReferenceMigration)) {
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
      const hasLegacyCharacterProfile = _.some(analyzedCharacters, (character) =>
        _.some([_.isEqual(character.name, PRESET_CONSTANTS.CHARACTER_NAME), _.isEqual(character.description, PRESET_CONSTANTS.CHARACTER_BIO)]),
      );
      const hasStyleContaminatedCharacterProfile = hasStyleContaminatedCharacterLibrary(analyzedCharacters);
      const characterSourceContext = _.join(
        _.compact([config.scriptContent, _.get(newProj.narrativePlan, "centralQuestion"), _.get(newProj.narrativePlan, "viewerPromise")]),
        "\n",
      );
      const hasCharacterGenderConflict = hasSourceGenderConflict(characterSourceContext, analyzedCharacters);
      const cinematicCharacterPromptMissing =
        isCinematicEpisodeGenre(config.genre) && _.some(analyzedCharacters, (character) => _.isEmpty(character.referenceGenerationPrompt) && _.isEmpty(character.images));
      const shouldAnalyzeCharacters =
        !isScriptCached ||
        config.forceRegenerateScenes ||
        _.isEmpty(analyzedCharacters) ||
        hasLegacyCharacterProfile ||
        hasStyleContaminatedCharacterProfile ||
        hasCharacterGenderConflict ||
        cinematicCharacterPromptMissing;
      if (shouldAnalyzeCharacters) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE);
        const analyzeCharacterRes = await pipelineSystemFetch(
          API_ROUTES.PIPELINE_ANALYZE_CHARACTER,
          {
            script: realScript,
            visualStyle: newProj.visualConfig.referencePrompt || newProj.visualConfig.style || config.stylePreset,
            sourceContext: characterSourceContext,
            cinematicMode: isCinematicPipeline,
            bypassCache: true,
          },
          requestSignal,
        );
        throwIfCancelled();
        let rawAnalyzedCharacters: any[] =
          analyzeCharacterRes.success && _.isArray(analyzeCharacterRes.data?.characters) ? _.take(analyzeCharacterRes.data.characters, REFACTOR_CONSTANTS.HOOK_COUNT) : [];
        const cinematicCharacterIssues = isCinematicPipeline ? getCinematicCharacterArtifactIssues(analyzeCharacterRes.data) : [];
        if (isCinematicPipeline && (!analyzeCharacterRes.success || !_.isEmpty(cinematicCharacterIssues))) {
          throw new Error(
            config.language === ProjectLanguage.VI
              ? `AI chưa trả đủ hồ sơ nhân vật điện ảnh: ${_.join(cinematicCharacterIssues.length ? cinematicCharacterIssues : [analyzeCharacterRes.error], ", ")}`
              : `AI did not return a complete cinematic character artifact: ${_.join(
                  cinematicCharacterIssues.length ? cinematicCharacterIssues : [analyzeCharacterRes.error],
                  ", ",
                )}`,
          );
        }
        if (!isCinematicPipeline && _.isEmpty(rawAnalyzedCharacters)) {
          appendLog(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
          rawAnalyzedCharacters = [createFallbackCharacterProfile(config.stylePreset || newProj.visualConfig.style)];
        }
        if (!_.isEmpty(rawAnalyzedCharacters)) {
          const nextCharacterLibrary = isCinematicPipeline
            ? _.map(rawAnalyzedCharacters, (character: any): CharacterConfig => ({ ...character, images: [], extracted: false }))
            : normalizeCharacterLibrary(
                _.map(rawAnalyzedCharacters, (character: any, index: number): CharacterConfig => ({
                  id: _.join([AUTO_GENERATOR_CONSTANTS.CHARACTER_ID_PREFIX, _.add(index, 1)], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
                  name: character.name,
                  description: character.description,
                  prompt: character.prompt || character.description,
                  ..._.pick(character, [
                    "referenceGenerationPrompt",
                    "narrativeRole",
                    "genderPresentation",
                    "ageRange",
                    "ethnicitySkinTone",
                    "bodyBuild",
                    "faceShape",
                    "eyes",
                    "nose",
                    "hair",
                    "signatureClothing",
                    "accessories",
                    "colorPalette",
                    "silhouette",
                    "timelineStages",
                  ]),
                  images: [],
                  extracted: false,
                })),
              );
          analyzedCharacters = mergeCharacterReferenceState(
            newProj.visualConfig.characters,
            nextCharacterLibrary,
          );
          didAnalyzeCharacters = true;
          newProj = {
            ...newProj,
            visualConfig: {
              ...newProj.visualConfig,
              characters: analyzedCharacters,
              characterAnalysis: isCinematicPipeline
                ? _.toString(analyzeCharacterRes.data?.characterAnalysis)
                : _.join(
                    _.map(analyzedCharacters, (character) => _.join([character.name, character.description], REFACTOR_CONSTANTS.VD_BLANK)),
                    "\n",
                  ),
              characterPrompt: _.get(_.first(analyzedCharacters), "prompt", REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              characterImages: preserveExistingList(newProj.visualConfig.characterImages, _.flatMap(analyzedCharacters, "images")),
              characterExtracted: Boolean(newProj.visualConfig.characterExtracted || _.some(analyzedCharacters, (character) => !_.isEmpty(character.images))),
              characterConsistency: !_.isEmpty(analyzedCharacters),
            },
            visualBible: {
              ...newProj.visualBible,
              characterSpecs: isCinematicPipeline
                ? _.toString(analyzeCharacterRes.data?.characterSpecs)
                : _.join(
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
        const isCinematicPipeline = _.some(
          [
            config.cinematicMode,
            _.endsWith(_.toString(config.projectName), " - Phim AI"),
            _.endsWith(_.toString(newProj.name), " - Phim AI"),
            isCinematicEpisodeGenre(config.genre),
            _.isEqual(newProj.projectKind, ProjectKind.Cinematic),
            isCinematicEpisodeGenre(newProj.config.genre),
            _.includes(["single", "series"], _.toString(config.filmFormat)),
            _.includes(["single", "series"], _.toString(newProj.config.filmFormat)),
          ],
          Boolean,
        );
        const cinematicDurationSeconds = _.max([parseTargetDurationSeconds(config.duration), parseTargetDurationSeconds(newProj.config.duration)]) || 10;
        const cinematicClipDurationSeconds = resolveCinematicClipDuration(config.videoDuration);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SPLIT);
        appendLog(T.logStoryboardRequestDetail(config.splitStrategy, !_.isEmpty(config.referenceImages)));
        const storyboardPayload = {
          rewrittenScript: realScript,
          chapters,
          voiceDuration: isCinematicPipeline ? cinematicDurationSeconds : undefined,
          cinematicClipCount: isCinematicPipeline ? Math.max(1, Math.ceil(cinematicDurationSeconds / cinematicClipDurationSeconds)) : undefined,
          config: {
            ...newProj.config,
            ...newProj.voiceConfig,
            visualStylePreset: newProj.visualConfig.style,
            aspectRatio: newProj.visualConfig.aspectRatio,
            imageQuality: newProj.visualConfig.quality,
            videoDuration: config.videoDuration,
          },
          visualStyle: storyboardStyle,
          referenceImages: _.compact(
            _.concat(_.castArray(config.referenceImages || []), _.castArray(config.sceneReferenceImages || []), _.castArray(newProj.visualConfig?.styleReferenceImages || [])),
          ),
          referenceStyle: storyboardStyle,
          referenceCharacters: jsonUtils.safeStringify(
            isCinematicPipeline
              ? _.map(analyzedCharacters, (character) => _.omit(character, ["images", "extracted"]))
              : _.map(analyzedCharacters, (character) => ({
                  name: character.name,
                  description: character.prompt || character.description,
                })),
          ),
          visualDensity: 5,
          bypassCache: true,
        };

        let storyboardRes: SystemFetchResult = createSystemFetchFailure(PIPELINE_FETCH_FAILURE_KEY.STORYBOARD);
        let storyboardReadinessIssues: string[] = [];
        for (let storyboardAttempt = 0; storyboardAttempt < (isCinematicPipeline ? PIPELINE_GUARANTEE_CONFIG.STORYBOARD_ATTEMPTS : 1); storyboardAttempt++) {
          storyboardRes = await pipelineSystemFetch(
            API_ROUTES.PIPELINE_STORYBOARD,
            { ...storyboardPayload, bypassCache: storyboardAttempt > 0 || storyboardPayload.bypassCache },
            requestSignal,
          );
          throwIfCancelled();
          const candidateScenes = _.castArray(storyboardRes.data?.scenes || []) as StoryboardScene[];
          storyboardReadinessIssues = storyboardRes.success
            ? getCinematicStoryboardReadinessIssues(candidateScenes, storyboardPayload.cinematicClipCount || candidateScenes.length, storyboardRes.data?.storyboardQa)
            : [_.toString(storyboardRes.error || storyboardRes.data?.error || "storyboard_request_failed")];
          if (!isCinematicPipeline || _.isEmpty(storyboardReadinessIssues)) break;
          if (storyboardAttempt < PIPELINE_GUARANTEE_CONFIG.STORYBOARD_ATTEMPTS - 1)
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Storyboard] Lần ${storyboardAttempt + 1} chưa đạt (${_.join(storyboardReadinessIssues, ", ")}); đang retry riêng bước storyboard.`
                : `[Storyboard] Attempt ${storyboardAttempt + 1} is incomplete (${_.join(storyboardReadinessIssues, ", ")}); retrying only the storyboard step.`,
            );
        }
        if (isCinematicPipeline && !_.isEmpty(storyboardReadinessIssues)) {
          throw new Error(
            config.language === ProjectLanguage.VI
              ? `Storyboard chưa đạt điều kiện bắt buộc: ${_.join(storyboardReadinessIssues, ", ")}`
              : `The storyboard did not pass mandatory readiness: ${_.join(storyboardReadinessIssues, ", ")}`,
          );
        }
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
          if (isCinematicPipeline) throw new Error(storyboardRes.error || storyboardRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_STORYBOARD_SPLIT);
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
        const storyboardUpdatedProj = {
          ...newProj,
          scriptRewritten: realScript,
          factCheckNotes,
          chapters,
          storyboard: realScenes as VideoProject["storyboard"],
          visualBible,
          storyboardQa,
          audioCueSheet,
        };
        await syncProject(storyboardUpdatedProj);
        newProj = storyboardUpdatedProj;
      }
      if (isStoryboardCached && newProj.audioCueSheet) {
        newProj = {
          ...newProj,
          audioCueSheet: applyOptionalMusicAsset(newProj.audioCueSheet, config.musicAssetUrl),
        };
      }

      if (!isCinematicPipeline) {
        realScenes = removeAdjacentRepeatedStoryboardScenes(realScenes);
        realScenes = _.map(realScenes, (scene) => ({
          ...scene,
          characterIds: resolveSceneCharacterIds(scene, analyzedCharacters),
        }));
      }
      const referenceContinuityReport = validateVisualContinuity(realScenes, analyzedCharacters, newProj.visualBible);
      if (!isCinematicPipeline && !referenceContinuityReport.passed) appendLog(_.join(referenceContinuityReport.blockingErrors, REFACTOR_CONSTANTS.VD_BLANK));

      let globalAudioBase64: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let globalAudioUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      const nativeFilmAudio = isCinematicPipeline;
      let isVoiceCached = nativeFilmAudio;
      const genreVoiceArc = nativeFilmAudio ? undefined : resolveGenreVoiceArc(config.genre);

      if (!nativeFilmAudio && config.resumeMode && isScriptCached && !config.forceRegenerateVoice && !invalidationState.regenerateVoice && !didRepairRepeatedNarration) {
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
        const activeVoiceArc = genreVoiceArc || resolveGenreVoiceArc(config.genre);
        const directedVoice = await generateDirectedVoice({
          text: realScript,
          voiceArc: activeVoiceArc,
          basePayload: {
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
          },
          signal: requestSignal,
        });
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
            voiceArc: activeVoiceArc,
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
      const hasCachedAlignment =
        config.resumeMode &&
        isScriptCached &&
        !config.forceRegenerateVoice &&
        !didRepairRepeatedNarration &&
        hasCompleteSceneAlignment(realScenes as StoryboardScene[], hasGlobalNarration);
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

      appendLog(T.logReferenceSummary(_.size(config.referenceImages), _.size(config.sceneReferenceImages), SecurityConstants.ZERO, isCinematicPipeline));
      if (isCinematicEpisodeGenre(config.genre)) setCurrentStepIndex(2);

      const requiresCinematicPlanRepair = isCinematicEpisodeGenre(config.genre)
        ? !_.isEmpty(getCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language))
        : false;

      if (
        !isStoryboardCached ||
        config.forceRegenerateScenes ||
        requiresCinematicPlanRepair ||
        (isContinuation && !_.isEqual(runIntent, "render_only") && hasPendingSceneAssets && requiresPromptPlanningMigration) ||
        (!isContinuation && (shouldRegenerateSceneAssets || didAnalyzeCharacters || requiresVisualReferenceMigration || requiresPromptPlanningMigration))
      ) {
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
            characters: mergeCharacterReferenceState(voiceUpdatedProj.visualConfig.characters, analyzedCharacters),
            characterImages: preserveExistingList(voiceUpdatedProj.visualConfig.characterImages, _.flatMap(analyzedCharacters, "images")),
            characterExtracted: Boolean(
              voiceUpdatedProj.visualConfig.characterExtracted || _.some(analyzedCharacters, (character) => !_.isEmpty(character.images)),
            ),
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
        const optimizePayload = {
          visualConfig: voiceUpdatedProj.visualConfig,
          visualBible: voiceUpdatedProj.visualBible,
          aspectRatio: config.aspectRatio,
          language: config.language,
          genre: config.genre,
          promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION,
          bypassCache: true,
          projectId: newProjectId,
          planningFallbackProvider: config.planningFallbackProvider,
          planningChatModel: config.planningChatModel,
          planningExecutionMode: config.planningExecutionMode,
          planningChromeHeadless: config.planningChromeHeadless,
          chromeHeadless: config.chromeHeadless,
          pipelineRunId: pipelineRunLease.runId,
          pipelineStartedAt,
        };
        let optimizeRes: Awaited<ReturnType<typeof safeSystemFetch>>;
        if (isCinematicEpisodeGenre(config.genre)) {
          const planningMasterStoryboard = _.cloneDeep(realScenes);
          const shouldReuseCompletedPlans = isContinuation && !config.forceRegenerateScenes;
          const scenesToPlan = shouldReuseCompletedPlans ? _.filter(realScenes, (scene) => _.isEmpty(_.trim(scene.generationPrompt))) : realScenes;
          const planningBatches = _.chunk(scenesToPlan, CINEMATIC_POLICY_CONFIG.PLANNING_CHUNK_SIZE);
          const plannedById = new Map(_.map(realScenes, (scene) => [scene.id, scene]));
          const planningWarnings: string[] = [];
          const planningFailures: Array<Awaited<ReturnType<typeof safeSystemFetch>>> = [];
          let completedSceneCount = 0;
          let nextPlanningBatchIndex = 0;
          let checkpointChain = Promise.resolve();
          const checkpointCompletedScenes = async (completedScenes: StoryboardScene[]) => {
            if (_.isEmpty(completedScenes)) return;
            _.forEach(completedScenes, (scene) => plannedById.set(scene.id, scene));
            completedSceneCount = _.add(completedSceneCount, completedScenes.length);
            realScenes = _.map(realScenes, (scene) => plannedById.get(scene.id) || scene);
            const checkpointProject = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"] };
            voiceUpdatedProj = checkpointProject;
            checkpointChain = checkpointChain.then(async () => {
              await syncProject(checkpointProject);
            });
            await checkpointChain;
          };
          const processPlanningBatch = async (workerIndex: number, batchIndex: number) => {
            throwIfCancelled();
            const planningBatch = planningBatches[batchIndex];
            const firstSceneIndex = _.findIndex(planningMasterStoryboard, { id: _.first(planningBatch)?.id });
            const planningPreviousScene = _.gt(firstSceneIndex, 0) ? planningMasterStoryboard[firstSceneIndex - 1] : undefined;
            let batchResponse: Awaited<ReturnType<typeof safeSystemFetch>> = { success: false, error: CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED };
            let pendingPlanningScenes = planningBatch;
            for (let attempt = 0; attempt < CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS; attempt++) {
              const basePlanningWorkerId = `${CINEMATIC_CHAT_PLANNING_CONFIG.WORKER_ID_PREFIX}${workerIndex}`;
              const planningWorkerId = _.isEqual(attempt, CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS - 1)
                ? `${basePlanningWorkerId}-recovery-${batchIndex}`
                : basePlanningWorkerId;
              batchResponse = await pipelineSystemFetch(
                API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS,
                {
                  ...optimizePayload,
                  storyboard: pendingPlanningScenes,
                  planningMasterStoryboard,
                  planningPreviousScene,
                  planningAttempt: attempt + 1,
                  planningWorkerId,
                },
                requestSignal,
              );
              const requestedSceneIds = _.map(pendingPlanningScenes, "id");
              const responseScenes = _.castArray(batchResponse.data?.storyboard || []) as StoryboardScene[];
              const responsePlanningIssues = _.castArray(batchResponse.data?.planningIssues || []);
              const explicitIssueSceneIds = _.uniq(
                _.compact(
                  _.map(responsePlanningIssues, (issue) => {
                    const sceneId = _.head(_.split(_.toString(issue), ":"));
                    return _.includes(requestedSceneIds, sceneId) ? sceneId : undefined;
                  }),
                ),
              );
              const issueSceneIds = !_.isEmpty(responsePlanningIssues) && _.isEmpty(explicitIssueSceneIds) ? requestedSceneIds : explicitIssueSceneIds;
              const completedResponseScenes = _.filter(
                responseScenes,
                (scene) => _.includes(requestedSceneIds, scene.id) && !_.includes(issueSceneIds, scene.id) && !_.isEmpty(_.trim(scene.generationPrompt)),
              );
              await checkpointCompletedScenes(completedResponseScenes);
              const completedSceneIds = _.map(completedResponseScenes, "id");
              const unresolvedSceneIds = _.isEmpty(issueSceneIds)
                ? _.difference(requestedSceneIds, completedSceneIds)
                : _.union(issueSceneIds, _.difference(requestedSceneIds, completedSceneIds));
              pendingPlanningScenes = _.filter(pendingPlanningScenes, (scene) => _.includes(unresolvedSceneIds, scene.id));
              if (_.isEmpty(pendingPlanningScenes)) {
                planningWarnings.push(..._.castArray(batchResponse.data?.planningWarnings || []));
                const batchLockedTemplate =
                  config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_BATCH_LOCKED : CINEMATIC_PLANNING_MESSAGES.EN_BATCH_LOCKED;
                appendLog(
                  batchLockedTemplate
                    .replace("{0}", _.toString(_.size(planningBatch)))
                    .replace("{1}", _.toString(completedSceneCount))
                    .replace("{2}", _.toString(scenesToPlan.length)),
                );
                return;
              }
              if (attempt < CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS - 1) {
                const pendingSceneIds = _.map(pendingPlanningScenes, "id");
                const issueSummary = _.join(_.take(responsePlanningIssues, 3), ", ") || _.toString(batchResponse.error || "incomplete_response");
                appendLog(
                  config.language === ProjectLanguage.VI
                    ? `[Đạo diễn phim][${planningWorkerId}][${_.join(pendingSceneIds, ",")}] Lần ${attempt + 1} chưa đạt: ${issueSummary}. AI đang viết lại nguyên cảnh.`
                    : `[Film direction][${planningWorkerId}][${_.join(pendingSceneIds, ",")}] Attempt ${attempt + 1} failed: ${issueSummary}. AI is rewriting the complete scene.`,
                );
              }
            }
            const finalBatchIssues = _.castArray(batchResponse.data?.planningIssues || []);
            const transportIssues = _.map(
              pendingPlanningScenes,
              (scene) => `${scene.id}:room_response:${_.toString(batchResponse.error || "incomplete_after_retries")}`,
            );
            planningFailures.push({
              ...batchResponse,
              success: false,
              data: {
                ..._.defaultTo(batchResponse.data, {}),
                planningIssues: _.isEmpty(finalBatchIssues) ? transportIssues : finalBatchIssues,
              },
            });
          };
          const planningWorker = async (workerIndex: number) => {
            while (nextPlanningBatchIndex < planningBatches.length) {
              const batchIndex = nextPlanningBatchIndex;
              nextPlanningBatchIndex = _.add(nextPlanningBatchIndex, 1);
              await processPlanningBatch(workerIndex, batchIndex);
            }
          };
          optimizeRes = { success: true, data: { storyboard: realScenes, planningWarnings } };
          const planningWorkerCount = Math.min(CINEMATIC_POLICY_CONFIG.PLANNING_WORKER_COUNT, planningBatches.length);
          await Promise.all(_.map(_.range(planningWorkerCount), planningWorker));
          await checkpointChain;
          if (!_.isEmpty(planningFailures)) {
            const firstFailure = _.first(planningFailures)!;
            const allPlanningIssues = _.uniq(_.flatMap(planningFailures, (failure) => _.castArray(failure.data?.planningIssues || [])));
            optimizeRes = {
              ...firstFailure,
              success: false,
              data: {
                ..._.defaultTo(firstFailure.data, {}),
                storyboard: realScenes,
                planningIssues: allPlanningIssues,
              },
            };
          }
          if (optimizeRes.success) optimizeRes = { success: true, data: { storyboard: realScenes, planningWarnings: _.uniq(planningWarnings) } };
        } else {
          optimizeRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, { ...optimizePayload, storyboard: realScenes }, requestSignal);
        }
        if (!isCinematicEpisodeGenre(config.genre) && !optimizeRes.success) {
          appendLog(
            config.language === ProjectLanguage.VI
              ? "[Biên tập hình ảnh] AI chưa trả đủ kế hoạch; đang yêu cầu viết lại toàn bộ đúng một lần."
              : "[Visual editorial] AI did not return a complete plan; requesting one full rewrite.",
          );
          optimizeRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, { ...optimizePayload, storyboard: realScenes }, requestSignal);
        }
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          const styleIdentityChanged = !_.isEqual(currentStylePreset, existingTargetProj?.visualConfig?.style);
          shouldRegenerateSceneAssets = shouldRegenerateSceneAssets || (!isContinuation && (requiresVisualReferenceMigration || didAnalyzeCharacters || styleIdentityChanged));
          appendLog(
            config.language === ProjectLanguage.VI
              ? isCinematicEpisodeGenre(config.genre)
                ? `✅ AI đã hoàn thành ${realScenes.length} prompt video với 3–5 shot được chọn theo nội dung.`
                : `✅ AI đã hoàn thành prompt hình ảnh cho ${realScenes.length} phân cảnh.`
              : isCinematicEpisodeGenre(config.genre)
                ? `✅ AI completed ${realScenes.length} video prompts with 3–5 story-driven shots.`
                : `✅ AI completed image prompts for ${realScenes.length} scenes.`,
          );
          if (isCinematicEpisodeGenre(config.genre) && !_.isEmpty(optimizeRes.data?.planningWarnings)) {
            appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_ADVISORY : CINEMATIC_PLANNING_MESSAGES.EN_ADVISORY);
          } else if (!isCinematicEpisodeGenre(config.genre) && !optimizeRes.data?.promptQa?.passed) {
            appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
          }
        } else if (!isCinematicEpisodeGenre(config.genre)) {
          appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
        }
        if (isCinematicEpisodeGenre(config.genre)) {
          const finalPlanIssues = getCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language);
          if (!optimizeRes.success || _.isEmpty(realScenes)) {
            const planningIssues = _.take(_.castArray(optimizeRes.data?.planningIssues || []), CINEMATIC_PLANNING_MESSAGES.ISSUE_DISPLAY_LIMIT);
            const baseMessage = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED : CINEMATIC_PLANNING_MESSAGES.EN_REQUIRED;
            const detailTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED_DETAIL : CINEMATIC_PLANNING_MESSAGES.EN_REQUIRED_DETAIL;
            const detailMessage = _.isEmpty(planningIssues) ? "" : detailTemplate.replace("{0}", _.join(planningIssues, ", "));
            throw new Error(_.join(_.compact([baseMessage, detailMessage]), " "));
          }
          if (!_.isEmpty(finalPlanIssues)) {
            throw new Error(
              config.language === ProjectLanguage.VI
                ? `Kế hoạch prompt chưa đạt sau các lần sửa theo cảnh: ${_.join(_.take(finalPlanIssues, 12), ", ")}`
                : `The prompt plan is still invalid after scene-level repairs: ${_.join(_.take(finalPlanIssues, 12), ", ")}`,
            );
          }
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle =
          createThumbnailStyleDirective(voiceUpdatedProj.visualBible?.styleProfile, voiceUpdatedProj.visualConfig?.thumbnailStyleProfile) ||
          voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt ||
          config.thumbnailStylePreset;
      }

      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = ensureScriptGroundedSceneDetails(realScenes as StoryboardScene[], {
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          visualBible: voiceUpdatedProj.visualBible,
        });
      }
      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = ensureMediaSourcePlan(realScenes as StoryboardScene[], config.genre);
      }
      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = pruneUnsupportedSceneCharacterIds(realScenes as StoryboardScene[], voiceUpdatedProj.visualConfig.characters || []);
      }
      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = applyProfessionalEditingPolicy(realScenes as StoryboardScene[], voiceUpdatedProj.visualBible);
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const clipDurationSeconds = resolveCinematicClipDuration(config.videoDuration);
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({ ...scene, duration: clipDurationSeconds }));
        const sourceShotCount = realScenes.length;
        const targetClipCount = _.max([1, Math.ceil(parseTargetDurationSeconds(config.duration) / clipDurationSeconds)]) || 1;
        const plannedCameraSetupCount = _.sumBy(realScenes as StoryboardScene[], (scene) => _.size(scene.cinematicBeats));
        appendLog(
          config.language === ProjectLanguage.VI
            ? `[Phim AI] AI đã thiết kế ${plannedCameraSetupCount} cảnh quay có timeline trong ${realScenes.length} clip ${clipDurationSeconds} giây từ ${sourceShotCount} nhịp truyện; mỗi clip có 3–5 shot do AI quyết định và một kết quả nhìn thấy được.`
            : `[AI Film] AI authored ${plannedCameraSetupCount} timed camera setups across ${realScenes.length} ${clipDurationSeconds}-second clips from ${sourceShotCount} story beats; every clip requires an AI-selected 3 to 5 continuous shots and a visible consequence.`,
        );
        if (!_.isEqual(realScenes.length, targetClipCount)) {
          appendLog(
            config.language === ProjectLanguage.VI
              ? `[Phim AI] Cảnh báo kế hoạch: AI trả ${realScenes.length}/${targetClipCount} clip theo thời lượng yêu cầu; giữ nguyên dữ liệu AI để hợp đồng kiểm tra thay vì code tự ghép cảnh.`
              : `[AI Film] Planning warning: AI returned ${realScenes.length}/${targetClipCount} clips; preserving the AI plan for contract validation instead of synthesizing scene bundles in code.`,
          );
        }
      }
      let imagePromptQa: ImagePromptQualityReport | undefined;
      if (!isCinematicEpisodeGenre(config.genre)) {
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({
          ...scene,
          prompt: compileImagePrompt(scene, {
            aspectRatio: config.aspectRatio,
            targetStyle: currentStylePreset,
            characters: voiceUpdatedProj.visualConfig.characters,
            visualBible: voiceUpdatedProj.visualBible,
          }),
        }));
        imagePromptQa = evaluateImagePrompts(realScenes as StoryboardScene[], {
          backgroundMode: config.styleBackgroundMode,
          textMode: config.styleTextInImageMode,
          targetStyle: currentStylePreset,
          characters: voiceUpdatedProj.visualConfig.characters,
          visualBible: voiceUpdatedProj.visualBible,
        }) as ImagePromptQualityReport;
      }
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
        const cinematicContractIssues = getCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language);
        if (!_.isEmpty(cinematicContractIssues)) {
          throw new Error(
            config.language === ProjectLanguage.VI
              ? `[Phim AI] Kế hoạch quay chưa đạt kiểm tra bắt buộc: ${cinematicContractIssues.slice(0, 6).join(", ")}.`
              : `[AI Film] The shooting plan failed mandatory validation: ${cinematicContractIssues.slice(0, 6).join(", ")}.`,
          );
        }
        appendLog(
          config.language === ProjectLanguage.VI
            ? `[Phim AI] Chế độ video toàn cảnh: ${realScenes.length}/${realScenes.length} cảnh được gửi tới model video đã chọn.`
            : `[AI Film] Video-only production: ${realScenes.length}/${realScenes.length} shots use the selected video model.`,
        );
      }
      voiceUpdatedProj = {
        ...voiceUpdatedProj,
        visualConfig: executionVisualConfig,
      };
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_PREPARE);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat)
        ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM
        : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      appendLog(
        config.language === ProjectLanguage.VI
          ? `🎨 Đang chuẩn bị tạo ${executionVisualConfig.generateType === GenerateType.Video ? "clip video" : executionVisualConfig.generateType === GenerateType.Mixed ? "hình ảnh và clip video" : "hình ảnh"} phân cảnh qua ${modeName}; tỷ lệ ${config.aspectRatio}.`
          : `🎨 Preparing to generate scene ${executionVisualConfig.generateType === GenerateType.Video ? "video clips" : executionVisualConfig.generateType === GenerateType.Mixed ? "images and video clips" : "images"} through ${modeName} at ${config.aspectRatio}.`,
      );

      const visualConfigPayload = {
        ...executionVisualConfig,
        aspectRatio: config.aspectRatio,
        chromeHeadless: config.chromeHeadless,
        geminiChatSpeed: config.geminiChatSpeed,
        style: currentStylePreset,
        qualityMode: _.defaultTo(voiceUpdatedProj.visualConfig.qualityMode, QualityMode.Balanced),
        generateCount: resolveQualityProfile(voiceUpdatedProj.visualConfig.qualityMode).draftCandidates,
        styleReferenceImages: [],
        sceneReferenceImages: [],
        referenceImages: [],
        thumbnailReferenceImages: [],
        thumbnailSceneReferenceImages: [],
        contentLanguage: config.language,
        preserveVideoAudio: isCinematicEpisodeGenre(config.genre),
      };
      const thumbnailVisualConfigPayload = isCinematicEpisodeGenre(config.genre)
        ? { ...visualConfigPayload, generationMode: ImageGenerationMode.GeminiChat, imageGeneratorEngine: ImageGeneratorEngine.LabsSandbox, generateType: GenerateType.Image }
        : visualConfigPayload;

      const sandboxConfigPayload = { localProjectId: voiceUpdatedProj.id, flowProjectId: voiceUpdatedProj.visualConfig?.flowProjectId };
      if (isCinematicEpisodeGenre(config.genre) && !_.isEqual(runIntent, "render_only")) {
        const existingCharacters = _.take(_.defaultTo(voiceUpdatedProj.visualConfig.characters, []), CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS);
        const referenceAvailability = await Promise.all(_.map(existingCharacters, (character) => hasCompleteCharacterReferences(character, requestSignal)));
        const charactersMissingReferences = _.filter(
          existingCharacters,
          (_character, index) => _.isEqual(runIntent, "new") || !referenceAvailability[index],
        );
        if (!_.isEmpty(charactersMissingReferences)) {
          appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_START : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_START);
          const generatedReferences = new Map<string, string>();
          for (const character of charactersMissingReferences) {
            throwIfCancelled();
            if (_.isEmpty(character.referenceGenerationPrompt))
              throw new Error(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_FAILED);
            const result = await generateProjectImageOnce(
              {
                sceneId: `character_${character.id}`,
                prompt: character.referenceGenerationPrompt,
                generateType: GenerateType.Image,
              },
              () => ({
                prompt: character.referenceGenerationPrompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: false,
                engine: ImageGeneratorEngine.LabsSandbox,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: {
                  ...thumbnailVisualConfigPayload,
                  aspectRatio: AspectRatio.ThreeFour,
                  generateType: GenerateType.Image,
                  generationMode: ImageGenerationMode.GeminiChat,
                  imageGeneratorEngine: ImageGeneratorEngine.LabsSandbox,
                  generateCount: CINEMATIC_CHARACTER_PACK_CONFIG.REFERENCE_COUNT_PER_CHARACTER,
                  referenceImages: [],
                },
              }),
              requestSignal,
            );
            const generatedImage = createProjectImageUrl(result);
            if (!result.success || _.isEmpty(generatedImage))
              throw new Error(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_FAILED);
            const persisted = await pipelineSystemFetch(
              `${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${voiceUpdatedProj.id}/${REFERENCE_ASSET_GROUP.CHARACTER}`,
              { images: [generatedImage] },
              requestSignal,
            );
            const persistedImage = _.first(_.defaultTo(persisted.data?.assets, []));
            if (!persisted.success || _.isEmpty(persistedImage))
              throw new Error(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_FAILED);
            generatedReferences.set(character.id, _.toString(persistedImage));
          }
          const charactersWithReferences = _.map(existingCharacters, (character) => {
            const generatedReference = generatedReferences.get(character.id);
            return generatedReference ? { ...character, images: [generatedReference], extracted: true } : character;
          });
          voiceUpdatedProj = {
            ...voiceUpdatedProj,
            visualConfig: {
              ...voiceUpdatedProj.visualConfig,
              characters: charactersWithReferences,
              characterImages: _.flatMap(charactersWithReferences, "images"),
              characterExtracted: _.every(charactersWithReferences, (character) => !_.isEmpty(character.images)),
              characterConsistency: !_.isEmpty(charactersWithReferences),
            },
          };
          voiceUpdatedProj = await syncProject(voiceUpdatedProj);
          appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_READY : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_READY);
        }
      }
      const cachedSeoData = isContinuation && newProj.seo ? newProj.seo : null;
      const seoRequest = cachedSeoData
        ? null
        : _.isEqual(runIntent, "render_only")
          ? null
          : (() => {
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_OPTIMIZE);
              return pipelineSystemFetch(
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
      const shouldRegenerateThumbnails = !_.isEqual(runIntent, "render_only") && (Boolean(config.forceRegenerateScenes) || invalidationState.regenerateThumbnails);
      let preparedSeoData: unknown = cachedSeoData || newProj.seo;

      if (!preparedSeoData && seoRequest) {
        const seoRes = await seoRequest;
        preparedSeoData = seoRes.success && seoRes.data ? seoRes.data : createSourceGroundedSeo(realScript, newProj.seoConfig);
      }

      const visualDependencies = {
        ..._.pick(voiceUpdatedProj.visualConfig, [
          "style",
          "stylePreset",
          "imageGeneratorEngine",
          "aspectRatio",
          "styleBackgroundMode",
          "styleTextInImageMode",
          "imageFocusMode",
          "generateType",
        ]),
        promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION,
      };
      const previousScenes = _.keyBy(_.defaultTo(existingTargetProj?.storyboard, []), "id");
      realScenes = _.map(realScenes as StoryboardScene[], (scene) => {
        const sceneWithDependency = { ...scene, dependencyHash: createSceneDependencyHash(scene, visualDependencies) };
        if (config.forceRegenerateScenes) {
          return { ...clearSceneVisualAsset(sceneWithDependency), dependencyHash: sceneWithDependency.dependencyHash };
        }
        return inheritApprovedSceneAsset(sceneWithDependency, previousScenes[scene.id]);
      });
      let targetScenesToGen = _.filter(realScenes as VideoProject["storyboard"], (sc) => {
        if (!_.isEmpty(config.targetSceneIds)) return _.includes(config.targetSceneIds, sc.id);
        if (config.forceRegenerateScenes) return true;
        if (isContinuation && hasSceneAsset(sc)) return false;
        if (isContinuation && sc.remoteVideoDownloadPending) return false;
        return true;
      });
      const targetSceneIds = new Set(_.map(targetScenesToGen, "id"));
      if (_.isEqual(runIntent, "render_only") && !_.isEmpty(targetScenesToGen)) {
        throw new Error(
          config.language === ProjectLanguage.VI
            ? "Một số cảnh đang thiếu media. Hãy chọn Tiếp tục để hoàn thiện các cảnh còn thiếu."
            : "Some scenes are missing media. Choose Continue to complete them first.",
        );
      }
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
      if (
        !_.isEqual(runIntent, "render_only") &&
        _.some([_.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat), isCinematicEpisodeGenre(config.genre)], Boolean)
      ) {
        const reusableThumbnails = config.resumeMode && !shouldRegenerateThumbnails ? _.defaultTo(newProj.thumbnails, []) : [];
        if (!_.isEmpty(reusableThumbnails) && _.every(reusableThumbnails, (thumb) => !_.isEmpty(thumb.imageUrl))) {
          unifiedBatchThumbnails = _.cloneDeep(reusableThumbnails);
          appendLog(T.logResumeThumbnails);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
          const thumbnailPlan = await pipelineSystemFetch(
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
              return {
                sceneId: thumb.id,
                idempotencyKey: _.join([voiceUpdatedProj.id, "thumbnail", thumb.id], ":"),
                prompt: generationPrompt,
                generateType: GenerateType.Image,
                referenceImages: thumbnailReferenceImages,
                continuityKey: createThumbnailContinuityKey(),
              };
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
        try {
          throwIfCancelled();
        } catch {
          return Promise.resolve();
        }
        const completedSceneIds = _.map(_.filter(realScenes, hasSceneAsset), "id");
        const pendingSceneIds = _.map(_.reject(realScenes, hasSceneAsset), "id");
        const checkpointProject = {
          ...voiceUpdatedProj,
          storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"],
          thumbnails: _.cloneDeep(unifiedBatchThumbnails || voiceUpdatedProj.thumbnails),
          generationCheckpoint: {
            intent: runIntent,
            phase: _.isEmpty(pendingSceneIds) ? "media_completed" : "media_generation",
            lastSuccessfulPhase: _.isEmpty(pendingSceneIds) ? "media" : voiceUpdatedProj.generationCheckpoint?.lastSuccessfulPhase,
            completedSceneIds,
            pendingSceneIds,
            failedSceneIds: _.map(
              _.filter(realScenes, (scene) => !_.isEmpty(scene.assetError)),
              "id",
            ),
            renderJobId: activeRenderJobIdRef.current,
            updatedAt: new Date().toISOString(),
          },
        };
        imageCheckpointQueue = imageCheckpointQueue.then(async () => {
          throwIfCancelled();
          const persistedProject = await syncProject(checkpointProject);
          throwIfCancelled();
          _.forEach(persistedProject.storyboard, (persistedScene) => {
            const liveScene = _.find(realScenes, { id: persistedScene.id });
            if (!liveScene) return;
            liveScene.assetUrl = persistedScene.assetUrl;
            liveScene.assetUrls = _.clone(persistedScene.assetUrls);
            liveScene.assetStatus = persistedScene.assetStatus;
            liveScene.assetError = persistedScene.assetError;
          });
          voiceUpdatedProj = { ...persistedProject, storyboard: realScenes as VideoProject["storyboard"] };
        });
        return imageCheckpointQueue;
      };

      if (isContinuation) {
        const pendingFlowDownloads = _.filter(
          realScenes as StoryboardScene[],
          (scene) => scene.remoteVideoDownloadPending && !_.isEmpty(scene.remoteVideoMediaId) && !hasSceneAsset(scene),
        );
        for (const pendingScene of pendingFlowDownloads) {
          throwIfCancelled();
          appendLog(
            config.language === ProjectLanguage.VI
              ? `Đang tải lại clip đã tạo cho ${pendingScene.id}; không tạo video mới.`
              : `Downloading the existing clip for ${pendingScene.id}; no new video will be generated.`,
          );
          const recoveredVideo = await recoverProjectFlowVideo(
            { projectId: voiceUpdatedProj.id, sceneId: pendingScene.id, mediaId: pendingScene.remoteVideoMediaId! },
            requestSignal,
          );
          if (recoveredVideo.success && recoveredVideo.fallbackUrl) {
            pendingScene.assetUrl = recoveredVideo.fallbackUrl;
            pendingScene.assetUrls = [recoveredVideo.fallbackUrl];
            pendingScene.assetType = GenerateType.Video;
            pendingScene.assetStatus = SceneAssetStatus.Generated;
            pendingScene.assetError = undefined;
            pendingScene.remoteVideoDownloadPending = false;
            appendAssetRevision(pendingScene, recoveredVideo.fallbackUrl, SceneAssetStatus.Generated);
            appendLog(
              config.language === ProjectLanguage.VI
                ? `✓ Đã tải và lưu clip hiện có cho ${pendingScene.id}.`
                : `✓ Downloaded and saved the existing clip for ${pendingScene.id}.`,
            );
          } else {
            pendingScene.assetStatus = SceneAssetStatus.Failed;
            pendingScene.assetError = _.defaultTo(recoveredVideo.warning, FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR);
          }
          await persistImageCheckpoint();
        }
      }

      const hasReferenceImages = Boolean(
        !_.isEmpty(voiceUpdatedProj.visualConfig?.referenceImages) ||
        !_.isEmpty(voiceUpdatedProj.visualConfig?.sceneReferenceImages) ||
        !_.isEmpty(voiceUpdatedProj.visualConfig?.styleReferenceImages),
      );

      const createSceneRequestContext = (scene: StoryboardScene, sceneGenerateType: GenerateType) => {
        const context = createSceneGenerationContext(scene, voiceUpdatedProj.visualConfig);
        if (isCinematicEpisodeGenre(config.genre) && _.isEqual(sceneGenerateType, GenerateType.Video)) {
          const characterReferences = resolveCinematicSceneCharacterReferences(scene, _.defaultTo(voiceUpdatedProj.visualConfig.characters, []));
          const compiledPrompt = createCinematicVideoPrompt(
            scene,
            scene.prompt,
            GenerateType.Video,
            config.videoDuration,
            _.defaultTo(voiceUpdatedProj.visualConfig.characters, []),
          );
          return {
            ...context,
            ...characterReferences,
            prompt: compiledPrompt,
          };
        }
        const compiledPrompt = compileImagePrompt(scene, {
          referenceLocked: hasReferenceImages,
          aspectRatio: config.aspectRatio,
          targetStyle: currentStylePreset,
          visualBible: voiceUpdatedProj.visualBible,
          characters: voiceUpdatedProj.visualConfig?.characters,
        });
        const engineAdaptedPrompt = adaptImagePromptForEngine(compiledPrompt, executionVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen, config.aspectRatio);
        return {
          ...context,
          prompt: prepareProjectMediaPrompt({ sceneId: scene.id, prompt: engineAdaptedPrompt, generateType: sceneGenerateType }),
        };
      };

      const requestAiRewrittenVideoPrompt = async (scene: StoryboardScene, failedPrompt: string, qaIssues: string[]): Promise<string> => {
        const rewriteResult = await pipelineSystemFetch(
          API_ROUTES.PIPELINE_REPAIR_VIDEO_PROMPT,
          { prompt: failedPrompt, qaIssues, scene, bypassCache: true },
          requestSignal,
        );
        const rewrittenPrompt = _.toString(rewriteResult.data?.review?.repairedPrompt);
        if (!rewriteResult.success || _.isEmpty(_.trim(rewrittenPrompt))) {
          throw new Error(`AI did not return a complete replacement video prompt for ${scene.id}.`);
        }
        const rewrittenIssues = getCinematicPromptPreflightIssues(scene, rewrittenPrompt, config.videoDuration);
        if (!_.isEmpty(rewrittenIssues)) {
          throw new Error(`AI replacement prompt for ${scene.id} failed validation: ${_.join(rewrittenIssues, ", ")}`);
        }
        return rewrittenPrompt;
      };

      const cinematicPreflightPrompts = new Map<string, string>();
      if (isCinematicEpisodeGenre(config.genre)) {
        appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_START : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_START);
        const preflightScenes = _.filter(targetScenesToGen as StoryboardScene[], (scene) => !hasSceneAsset(scene));
        const preflightIssuesByScene = new Map<string, string[]>();
        const reviewedPromptsByScene = new Map<string, { prompt: string; review: any }>();
        const canReuseProjectSafetyReview = Boolean(
          voiceUpdatedProj.contentSafety?.allowed &&
            !voiceUpdatedProj.contentSafety.sensitiveTopic &&
            _.isEmpty(voiceUpdatedProj.contentSafety.blockingErrors) &&
            _.isEmpty(voiceUpdatedProj.contentSafety.warnings),
        );
        const reviewScenePrompt = async (scene: StoryboardScene) => {
          throwIfCancelled();
          const requestContext = createSceneRequestContext(scene, GenerateType.Video);
          const localIssues = getCinematicPromptPreflightIssues(scene, requestContext.prompt, config.videoDuration);
          if (!_.isEmpty(localIssues)) {
            requestContext.prompt = await requestAiRewrittenVideoPrompt(scene, requestContext.prompt, localIssues);
            scene.generationPrompt = requestContext.prompt;
          }
          if (canReuseProjectSafetyReview) {
            reviewedPromptsByScene.set(scene.id, {
              prompt: requestContext.prompt,
              review: {
                violatesPolicy: false,
                risks: [],
                rationale: CINEMATIC_PLANNING_MESSAGES.PROJECT_SAFETY_APPROVED_RATIONALE,
              },
            });
            return;
          }
          let policyResult: SystemFetchResult = createSystemFetchFailure(PIPELINE_FETCH_FAILURE_KEY.VIDEO_PROMPT_REVIEW);
          for (let reviewAttempt = 0; reviewAttempt < CINEMATIC_POLICY_CONFIG.PREFLIGHT_REVIEW_ATTEMPTS; reviewAttempt++) {
            policyResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_REPAIR_VIDEO_PROMPT, { prompt: requestContext.prompt, bypassCache: reviewAttempt > 0 }, requestSignal);
            const candidateReview = policyResult.data?.review;
            if (policyResult.success && !_.isEqual(_.toString(candidateReview?.rationale), "review_unavailable")) break;
            if (reviewAttempt < CINEMATIC_POLICY_CONFIG.PREFLIGHT_REVIEW_ATTEMPTS - 1)
              appendLog(
                config.language === ProjectLanguage.VI
                  ? `[Preflight] Kiểm tra an toàn ${scene.id} chưa phản hồi; retry riêng cảnh này.`
                  : `[Preflight] Safety review for ${scene.id} is unavailable; retrying only this scene.`,
              );
          }
          const review = policyResult.data?.review;
          const reviewUnavailable = !policyResult.success || _.isEqual(_.toString(review?.rationale), "review_unavailable");
          const approvedPrompt = resolveAuthoritativeCinematicPrompt(requestContext.prompt, review);
          const issues = _.compact([
            reviewUnavailable ? `${scene.id}:content_safety_review_unavailable` : undefined,
            ...getCinematicPromptPreflightIssues(scene, approvedPrompt, config.videoDuration),
          ]);
          if (!_.isEmpty(issues)) preflightIssuesByScene.set(scene.id, issues);
          reviewedPromptsByScene.set(scene.id, { prompt: approvedPrompt, review });
        };
        let nextPreflightSceneIndex = 0;
        const reviewWorker = async () => {
          while (nextPreflightSceneIndex < preflightScenes.length) {
            const sceneIndex = nextPreflightSceneIndex;
            nextPreflightSceneIndex = _.add(nextPreflightSceneIndex, 1);
            await reviewScenePrompt(preflightScenes[sceneIndex]);
          }
        };
        const reviewWorkerCount = Math.min(CINEMATIC_POLICY_CONFIG.PREFLIGHT_REVIEW_WORKER_COUNT, preflightScenes.length);
        await Promise.all(_.map(_.range(reviewWorkerCount), reviewWorker));
        _.forEach(preflightScenes, (scene) => {
          const reviewed = reviewedPromptsByScene.get(scene.id);
          if (!reviewed) return;
          scene.cinematicPolicyReview = {
            violatesPolicy: Boolean(reviewed.review?.violatesPolicy),
            risks: _.map(_.castArray(reviewed.review?.risks || []), _.toString),
            rationale: _.toString(reviewed.review?.rationale),
          };
          scene.generationPrompt = reviewed.prompt;
          cinematicPreflightPrompts.set(scene.id, reviewed.prompt);
        });
        const preflightIssues = _.flatMap(preflightScenes, (scene) => preflightIssuesByScene.get(scene.id) || []);
        if (!_.isEmpty(preflightIssues)) {
          const failedSceneIds = _.uniq(_.compact(_.map(preflightIssues, (issue) => _.head(_.split(issue, ":")))));
          const failureMessage = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_FAILED;
          const detailTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_FAILED_SCENES : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_FAILED_SCENES;
          const detailMessage = detailTemplate.replace("{0}", _.join(failedSceneIds, ", "));
          appendLog(`${failureMessage} ${detailMessage}`);
          logger.warn(`${CINEMATIC_PLANNING_MESSAGES.PREFLIGHT_LOG_PREFIX} ${_.join(preflightIssues, ", ")}`);
          throw new Error(`${failureMessage} ${detailMessage}`);
        }
        appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_PASSED : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_PASSED);
        await persistImageCheckpoint();
      }

      if (!_.isEmpty(targetScenesToGen) || !_.isEmpty(unifiedThumbnailItems)) {
        for (const archivalScene of _.filter(targetScenesToGen, (scene) => _.isEqual(scene.assetStrategy, "archival") && !hasSceneAsset(scene))) {
          throwIfCancelled();
          const archivalResult = await pipelineSystemFetch(
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
        const remainingTargetScenes = _.filter(
          targetScenesToGen,
          (scene) => !hasSceneAsset(scene) && !scene.remoteVideoDownloadPending,
        );
        const runSceneGeneration = async (scenesToProcess: StoryboardScene[], isFallback = false): Promise<void> => {
          const generateScene = async (sc: StoryboardScene, i: number): Promise<void> => {
            throwIfCancelled();
            if (hasSceneAsset(sc)) return;

            const sceneGenerateType = resolveSceneGenerateType(sc.id, executionVisualConfig.generateType, videoSceneIds);
            const generatedRequestContext = createSceneRequestContext(sc, sceneGenerateType);
            const requestContext = { ...generatedRequestContext, prompt: cinematicPreflightPrompts.get(sc.id) || generatedRequestContext.prompt };
            sc.generationPrompt = requestContext.prompt;

            if (isFallback) appendLog(T.logFallbackProgress(i + 1, scenesToProcess.length, sceneGenerateType));
            else {
              appendLog(
                config.language === ProjectLanguage.VI
                  ? `🎨 Đang tạo ${sceneGenerateType === GenerateType.Video ? "clip video" : "hình ảnh"} cho ${sc.id} (${i + 1}/${scenesToProcess.length}).`
                  : `🎨 Generating the ${sceneGenerateType === GenerateType.Video ? "video clip" : "image"} for ${sc.id} (${i + 1}/${scenesToProcess.length}).`,
              );
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
                  visualConfig: visualConfigPayload
                    ? { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: sceneGenerateType }
                    : visualConfigPayload,
                }),
                requestSignal,
              );

              if (!_.isEmpty(imageResult.newProjectId) && !_.isEqual(sandboxConfigPayload.flowProjectId, imageResult.newProjectId)) {
                sandboxConfigPayload.flowProjectId = imageResult.newProjectId;
                voiceUpdatedProj.visualConfig.flowProjectId = imageResult.newProjectId;
              }
              if (imageResult.success) {
                const base64Val = imageResult.base64;
                const fallbackUrl = imageResult.fallbackUrl;
                if (base64Val) {
                  const dataUrl = _.join(
                    [_.isEqual(sceneGenerateType, GenerateType.Video) ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, base64Val],
                    REFACTOR_CONSTANTS.VD_EMPTY_STRING,
                  );
                  sc.assetUrl = dataUrl;
                  sc.assetUrls = [dataUrl];
                } else if (fallbackUrl) {
                  sc.assetUrl = fallbackUrl;
                  sc.assetUrls = [fallbackUrl];
                }
                if (!hasSceneAsset(sc)) throw new Error("generated_asset_missing");
                if (_.isEqual(sceneGenerateType, GenerateType.Video) && !isPersistedProjectVideoUrl(sc.assetUrl)) {
                  sc.assetUrl = undefined;
                  sc.assetUrls = [];
                  throw new Error(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
                }
                sc.assetType = sceneGenerateType;
                sc.assetStatus = SceneAssetStatus.Generated;
                if (!_.isEmpty(imageResult.remoteMediaId)) sc.remoteVideoMediaId = imageResult.remoteMediaId;
                sc.remoteVideoDownloadPending = false;
                appendAssetRevision(sc, sc.assetUrl, SceneAssetStatus.Generated);
                sc.assetError = undefined;
                await persistImageCheckpoint();
                appendLog(
                  config.language === ProjectLanguage.VI
                    ? `✓ Đã tải và lưu ${sceneGenerateType === GenerateType.Video ? "clip video" : "hình ảnh"} ${sc.id}.`
                    : `✓ Downloaded and saved the ${sceneGenerateType === GenerateType.Video ? "video clip" : "image"} for ${sc.id}.`,
                );
              } else {
                if (imageResult.remoteMediaCreated) {
                  sc.remoteVideoMediaId = imageResult.remoteMediaId;
                  sc.remoteVideoDownloadPending = true;
                  sc.assetStatus = SceneAssetStatus.Failed;
                  sc.assetError = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
                  await persistImageCheckpoint();
                }
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
                  logger.warn(
                    `[Mixed Media] Image fallback failed for ${sc.id}: ${imageFallbackError instanceof Error ? imageFallbackError.message : REFACTOR_CONSTANTS.ERR_UNKNOWN}`,
                  );
                }
              }
              if (!recoveredAsImage) {
                sc.assetStatus = SceneAssetStatus.Failed;
                sc.assetError = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_UNKNOWN;
                await persistImageCheckpoint();
                appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
              }
            }
          };
          for (let i = 0; i < scenesToProcess.length; i++) {
            await generateScene(scenesToProcess[i], i);
          }
        };

        if (_.every([!isCinematicEpisodeGenre(config.genre), _.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat)], Boolean)) {
          appendLog(T.logBatchImageStreamStart(executionVisualConfig.generateType, _.size(remainingTargetScenes)));
          const sceneBatchItems = _.map(remainingTargetScenes, (scene) => {
            const sceneGenerateType = resolveSceneGenerateType(scene.id, executionVisualConfig.generateType, videoSceneIds);
            const requestContext = createSceneRequestContext(scene, sceneGenerateType);
            scene.generationPrompt = requestContext.prompt;
            return {
              sceneId: scene.id,
              idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash], ":"),
              prompt: requestContext.prompt,
              referenceImages: requestContext.referenceImages,
              continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
              generateType: sceneGenerateType,
            };
          });
          const batchItems = _.concat(sceneBatchItems, unifiedThumbnailItems);
          let completedCount = SecurityConstants.ZERO;
          let batchFailureCount = SecurityConstants.ZERO;

          const applyResult = (result: ProjectImageResult) => {
            const imageUrl = createProjectImageUrl(result);
            const thumbnail = _.find(unifiedBatchThumbnails || [], (item) => _.isEqual(item.id, result.sceneId));
            if (thumbnail && !_.isEmpty(imageUrl)) {
              thumbnail.imageUrl = imageUrl;
              appendLog(
                AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_SUCCESS.replace(
                  SecurityConstants.PLACEHOLDER_0,
                  _.toString(_.size(_.filter(unifiedBatchThumbnails, (item) => !_.isEmpty(item.imageUrl)))),
                ).replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.size(unifiedBatchThumbnails))),
              );
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
              return {
                sceneId: scene.id,
                idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash, "fallback"], ":"),
                prompt: requestContext.prompt,
                referenceImages: requestContext.referenceImages,
                continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
                generateType: fallbackGenerateType,
              };
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? "[Ảnh bìa] Gemini đang tạo ảnh bìa song song với clip phim."
                : "[Thumbnail] Gemini is generating thumbnails in parallel with film clips.",
            );
            await generateProjectImages({
              items: unifiedThumbnailItems,
              visualConfig: {
                ...thumbnailVisualConfigPayload,
                style: currentThumbnailStyle || currentStylePreset,
                batchTabCount: _.size(unifiedThumbnailItems),
              },
              style: currentThumbnailStyle || currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              retainBrowserSession: true,
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
          if (!isCinematicEpisodeGenre(config.genre)) {
            _.forEach(unresolvedSourceScenes, (scene) => {
              scene.assetStrategy = "ai_generated";
              scene.archivalRationale = _.trim(_.join([scene.archivalRationale, "Authentic source unavailable; AI reconstruction used so production can continue"], "; "));
              scene.assetStatus = SceneAssetStatus.Generating;
              scene.assetError = undefined;
            });
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Tư liệu] ${unresolvedSourceScenes.length} cảnh chưa có nguồn phù hợp; chuyển sang tái dựng AI để video tiếp tục.`
                : `[Archive] ${unresolvedSourceScenes.length} scenes have no suitable source; using AI reconstruction so production continues.`,
            );
            await runSceneGeneration(unresolvedSourceScenes, true);
          }
        }
        for (let mediaAttempt = 1; mediaAttempt < PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS; mediaAttempt++) {
          const retryScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene) && !scene.remoteVideoDownloadPending);
          if (_.isEmpty(retryScenes) || cancellationRef.current) break;
          _.forEach(retryScenes, (scene) => {
            scene.assetStatus = SceneAssetStatus.Retrying;
            scene.assetError = undefined;
          });
          appendLog(
            config.language === ProjectLanguage.VI
              ? `[Media] Retry ${mediaAttempt}/${PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS - 1} chỉ cho ${_.join(_.map(retryScenes, "id"), ", ")}; giữ nguyên các cảnh đã thành công.`
              : `[Media] Retry ${mediaAttempt}/${PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS - 1} only for ${_.join(_.map(retryScenes, "id"), ", ")}; successful scenes are preserved.`,
          );
          await runSceneGeneration(retryScenes, true);
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[QA ảnh] ${scene.id}: chưa thể kiểm tra; tiếp tục với ảnh hiện có.`
                : `[Image QA] ${scene.id}: review unavailable; continuing with the current image.`,
            );
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[QA ảnh] ${scene.id}: đạt kiểm tra hình thể và số lượng nhân vật.`
                : `[Image QA] ${scene.id}: anatomy and subject count passed.`,
            );
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[QA ảnh] ${scene.id}: vẫn còn cảnh báo sau 2 lần tạo lại; tiếp tục để video hoàn thành.`
                : `[Image QA] ${scene.id}: warnings remain after 2 regenerations; continuing so the video completes.`,
            );
            qaCompleted = true;
            break;
          }

          const rejectedRevision = _.findLast(scene.assetRevisions);
          if (rejectedRevision) rejectedRevision.status = SceneAssetStatus.Rejected;
          scene.assetStatus = SceneAssetStatus.Retrying;
          appendLog(
            config.language === ProjectLanguage.VI
              ? `[QA ảnh] ${scene.id}: phát hiện ${_.join(regenerationReasons, ", ")}; tạo lại lần ${regenerationAttempt + 1}/2.`
              : `[Image QA] ${scene.id}: detected ${_.join(regenerationReasons, ", ")}; regeneration ${regenerationAttempt + 1}/2.`,
          );

          if (_.isEqual(scene.assetStrategy, "archival")) {
            if (regenerationAttempt < SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS) {
              const replacementResult = await pipelineSystemFetch(
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[QA tư liệu] ${scene.id}: nguồn thật không chứng minh đúng câu thoại; chuyển sang ảnh AI tái dựng.`
                : `[Archive QA] ${scene.id}: authentic sources did not prove the narration; switching to AI reconstruction.`,
            );
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
        const filmVideoScenes = _.filter(
          realScenes as StoryboardScene[],
          (scene) => targetSceneIds.has(scene.id) && hasSceneAsset(scene) && _.isEqual(scene.assetType, GenerateType.Video),
        );
        for (const scene of filmVideoScenes) {
          for (let qaAttempt = 0; qaAttempt <= PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS; qaAttempt++) {
            throwIfCancelled();
            scene.assetStatus = SceneAssetStatus.Validating;
            const videoQa = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { purpose: "video" });
            if (videoQa.success && videoQa.quality && videoQa.approved) {
              scene.qaStatus = QaStatus.Passed;
              scene.acceptance = AssetAcceptance.Approved;
              scene.assetStatus = SceneAssetStatus.Approved;
              scene.assetError = undefined;
              scene.cinematicTakeDecision = "use";
              scene.cinematicTakeDecisionReason = "semantic_and_continuity_qa_passed";
              const approvedRevision = _.findLast(scene.assetRevisions);
              if (approvedRevision) {
                approvedRevision.status = SceneAssetStatus.Approved;
                approvedRevision.approvedAt = new Date().toISOString();
              }
              break;
            }

            const qaReasons = videoQa.quality
              ? _.uniq([...videoQa.quality.blockingErrors, ...getSceneVisualRegenerationReasons(videoQa.quality, false)])
              : [videoQa.error || "video_semantic_qa_unavailable"];
            if (qaAttempt >= PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS) {
              scene.qaStatus = videoQa.quality ? QaStatus.Failed : QaStatus.Unavailable;
              scene.acceptance = AssetAcceptance.Rejected;
              scene.assetStatus = SceneAssetStatus.Failed;
              scene.assetError = `video_qa_failed: ${_.join(qaReasons, ",")}`;
              scene.cinematicTakeDecision = "regenerate_once";
              scene.cinematicTakeDecisionReason = _.join(qaReasons, ",") || "semantic_quality_below_release_target";
              break;
            }

            const rejectedRevision = _.findLast(scene.assetRevisions);
            if (rejectedRevision) rejectedRevision.status = SceneAssetStatus.Rejected;
            scene.assetStatus = SceneAssetStatus.Retrying;
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[QA video] ${scene.id} sai ${_.join(qaReasons, ", ")}; chỉ tạo lại cảnh này (${qaAttempt + 1}/${PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS}).`
                : `[Video QA] ${scene.id} failed ${_.join(qaReasons, ", ")}; regenerating only this scene (${qaAttempt + 1}/${PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS}).`,
            );
            const requestContext = createSceneRequestContext(scene, GenerateType.Video);
            const retryPrompt = await requestAiRewrittenVideoPrompt(scene, cinematicPreflightPrompts.get(scene.id) || requestContext.prompt, qaReasons);
            scene.generationPrompt = retryPrompt;
            const retryResult = await generateProjectImageOnce(
              {
                sceneId: scene.id,
                prompt: retryPrompt,
                referenceImages: requestContext.referenceImages,
                generateType: GenerateType.Video,
              },
              () => ({
                prompt: retryPrompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: true,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: GenerateType.Video },
              }),
              requestSignal,
            );
            const retryAssetUrl = createProjectImageUrl(retryResult);
            if (!retryResult.success || !isPersistedProjectVideoUrl(retryAssetUrl)) {
              if (retryResult.remoteMediaCreated && !_.isEmpty(retryResult.remoteMediaId)) {
                scene.remoteVideoMediaId = retryResult.remoteMediaId;
                scene.remoteVideoDownloadPending = true;
                await persistImageCheckpoint();
              }
              scene.assetError = retryResult.warning || FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR;
              continue;
            }
            scene.assetUrl = retryAssetUrl;
            scene.assetUrls = [retryAssetUrl];
            scene.assetType = GenerateType.Video;
            scene.assetStatus = SceneAssetStatus.Generated;
            const retryRevision = appendAssetRevision(scene, retryAssetUrl, SceneAssetStatus.Generated);
            retryRevision.operation = "retry";
            await persistImageCheckpoint();
          }
        }
        await persistImageCheckpoint();
      }

      const technicallyValidScenes = _.filter(realScenes as StoryboardScene[], (scene) =>
        _.every(
          [
            hasSceneAsset(scene),
            !isCinematicEpisodeGenre(config.genre) ||
              (_.isEqual(scene.qaStatus, QaStatus.Passed) && _.isEqual(scene.acceptance, AssetAcceptance.Approved)),
          ],
          Boolean,
        ),
      );
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

      const approvedImageScenes = _.filter(technicallyValidScenes, (scene) =>
        _.every([scene.assetType !== GenerateType.Video, scene.assetStatus === SceneAssetStatus.Approved], Boolean),
      );
      await upscaleApprovedSceneAssets({
        scenes: approvedImageScenes,
        validatedSceneIds: validationSceneIds,
        qualityMode: executionVisualConfig.qualityMode,
        persistAsset: async (dataUrl) => {
          const persisted = await pipelineSystemFetch(
            `${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${voiceUpdatedProj.id}/${REFERENCE_ASSET_GROUP.UPSCALED}`,
            { images: [dataUrl] },
            requestSignal,
          );
          const persistedAssetUrl = _.toString(_.first(_.castArray(persisted.data?.assets)));
          return _.isEmpty(persistedAssetUrl) ? dataUrl : persistedAssetUrl;
        },
        persistCheckpoint: persistImageCheckpoint,
        onLog: appendLog,
      });
      if (isCinematicEpisodeGenre(config.genre)) {
        if (!_.isEmpty(config.targetSceneIds)) {
          const targetedScenes = _.filter(realScenes as StoryboardScene[], (scene) => targetSceneIds.has(scene.id));
          const targetedTakeIssues = getCinematicGeneratedTakeIssues(targetedScenes, targetedScenes.length);
          const targetedProject = await syncProject({
            ...voiceUpdatedProj,
            status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
            activeRunId: undefined,
            storyboard: realScenes as VideoProject["storyboard"],
          });
          setActiveCreatedProject(targetedProject);
          if (!_.isEmpty(targetedTakeIssues)) {
            throw new Error(
              config.language === ProjectLanguage.VI
                ? `Clip đã được tải nhưng chưa đạt QA: ${_.join(targetedTakeIssues, ", ")}`
                : `The clip was downloaded but did not pass QA: ${_.join(targetedTakeIssues, ", ")}`,
            );
          }
          appendLog(
            config.language === ProjectLanguage.VI
              ? `Đã tạo, tải và duyệt ${_.join(_.map(targetedScenes, "id"), ", ")}. Dùng Ghép lại khi toàn bộ cảnh đã sẵn sàng.`
              : `Created, downloaded and approved ${_.join(_.map(targetedScenes, "id"), ", ")}. Use Re-render when every scene is ready.`,
          );
          setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);
          return;
        }
        const expectedClipCount = Math.max(1, Math.ceil(parseTargetDurationSeconds(config.duration) / resolveCinematicClipDuration(config.videoDuration)));
        const takeIssues = getCinematicGeneratedTakeIssues(realScenes as StoryboardScene[], expectedClipCount);
        if (!_.isEmpty(takeIssues)) {
          await syncProject({
            ...voiceUpdatedProj,
            status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
            storyboard: realScenes as VideoProject["storyboard"],
          });
          throw new Error(
            config.language === ProjectLanguage.VI
              ? `Chưa đủ take đạt chuẩn, không render: ${_.join(_.take(takeIssues, 20), ", ")}`
              : `Approved takes are incomplete; render is blocked: ${_.join(_.take(takeIssues, 20), ", ")}`,
          );
        }
      }
      const sceneAssetSummary = getSceneAssetSummary(realScenes as StoryboardScene[]);
      if (isCinematicEpisodeGenre(config.genre) && _.isEmpty(realScenes)) {
        throw new Error(
          config.language === ProjectLanguage.VI
            ? "Chưa có take video thật nào có thể dựng. Hãy kiểm tra phiên Gemini rồi tiếp tục dự án."
            : "No genuine video take is available for editing. Check the Gemini session and resume the project.",
        );
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
      appendLog(
        config.language === ProjectLanguage.VI
          ? `${completedMedia.complete ? "✅" : "⚠️"} Đã nhận ${completedMedia.completed}/${completedMedia.total} tài nguyên phân cảnh cần thiết.`
          : `${completedMedia.complete ? "✅" : "⚠️"} Received ${completedMedia.completed}/${completedMedia.total} required scene assets.`,
      );
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);

      const imageUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], thumbnails: unifiedBatchThumbnails || voiceUpdatedProj.thumbnails };
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
          const thumbRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_THUMBNAILS, thumbPayload, requestSignal);
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
                const thumbPrompt = createThumbnailGenerationPrompt(
                  thumb,
                  thumbnailStyle,
                  config.aspectRatio,
                  !_.isEmpty(thumbnailReferenceImages),
                  imageUpdatedProj.visualConfig.characters,
                );
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
                      _.toString(targetThumbsToGen.length),
                    ),
                  );
                }
              };

              const thumbnailGenerationSummary = await generateProjectImages({
                items: batchThumbItems,
                visualConfig: {
                  ...thumbnailVisualConfigPayload,
                  style: currentThumbnailStyle || currentStylePreset,
                  referenceImages: thumbnailReferenceImages,
                  batchTabCount: _.size(targetThumbsToGen),
                },
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
                appendLog(
                  _.replace(
                    _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SCENE_GEN, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1)),
                    SecurityConstants.PLACEHOLDER_1,
                    _.toString(targetThumbsToGen.length),
                  ),
                );
                const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
                const thumbPrompt = createThumbnailGenerationPrompt(
                  thumb,
                  thumbnailStyle,
                  config.aspectRatio,
                  !_.isEmpty(thumbnailReferenceImages),
                  imageUpdatedProj.visualConfig.characters,
                );
                const finalThumbPrompt = thumbPrompt;
                thumb.generationPrompt = finalThumbPrompt;

                try {
                  const renderThumbRes = await pipelineSystemFetch(
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
                  if (renderThumbRes.success && renderThumbRes.data?.base64)
                    imgUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, renderThumbRes.data.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                  else if (renderThumbRes.data?.fallbackUrl) imgUrl = renderThumbRes.data.fallbackUrl;

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
        appendLog(
          config.language === ProjectLanguage.VI
            ? "[Ảnh bìa] Đã đồng bộ kết quả ảnh bìa Gemini với dự án phim."
            : "[Thumbnail] Gemini thumbnail results are synchronized with the film project.",
        );
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const mayUseTextFreeFilmFrame = _.isEqual(config.thumbnailTextInImageMode, ThumbnailTextMode.NoText);
        const missingFilmThumbnails = mayUseTextFreeFilmFrame ? _.filter(thumbnailsList, (thumbnail) => _.isEmpty(thumbnail.imageUrl)) : [];
        const sourceVideoScenes = _.filter(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.assetType, GenerateType.Video) && !_.isEmpty(scene.assetUrl));
        for (let index = 0; index < missingFilmThumbnails.length; index++) {
          const thumbnail = missingFilmThumbnails[index];
          const sourceScene = sourceVideoScenes[index % _.max([1, sourceVideoScenes.length])!];
          if (!sourceScene) break;
          const extracted = await pipelineSystemFetch(
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
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Ảnh bìa] Gemini chưa trả ảnh cho ${thumbnail.id}; đã dùng keyframe sạch từ cảnh phim để không để trống thumbnail.`
                : `[Thumbnail] Gemini did not return ${thumbnail.id}; using a clean film keyframe so the thumbnail is never blank.`,
            );
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
          const reasons = _.uniq(
            _.compact([
              ...getSceneVisualRegenerationReasons(thumbnailQa.quality!, true),
              thumbnail.hasText ? "render_the_exact_required_headline_once_with_correct_spelling" : "",
              "thumbnail_must_match_the_story_and_selected_layout",
            ]),
          );
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
              {
                purpose: "thumbnail",
                expectedHeadline: thumbnail.hasText ? thumbnail.textText : "",
                layoutId: thumbnail.layoutId || thumbnail.layout,
                typographyId: thumbnail.typographyId || thumbnail.typography,
              },
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
      if (_.lt(completedThumbnailCount, config.thumbnailCount))
        appendLog(
          _.replace(REFACTOR_CONSTANTS.THUMBNAIL_GENERATION_INCOMPLETE, SecurityConstants.PLACEHOLDER_0, _.toString(_.subtract(config.thumbnailCount, completedThumbnailCount))),
        );
      else appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SUCCESS);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(_.size(_.get(seoData, "titles", [])), _.size(thumbnailsList)));

      let slicedUpdatedProj: VideoProject = {
        ...imageUpdatedProj,
        seo: seoData as VideoProject["seo"],
        thumbnails: thumbnailsList,
        storyboard: realScenes as VideoProject["storyboard"],
      };
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
        appendLog(
          config.language === ProjectLanguage.VI
            ? "[Phim AI] Giữ thoại, ambience và âm thanh hiện trường trong từng clip; không phủ giọng đọc TTS toàn cục."
            : "[AI Film] Preserving dialogue, ambience and production sound from each clip; global TTS narration is disabled.",
        );
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
      appendLog(
        config.language === ProjectLanguage.VI
          ? nativeFilmAudio
            ? "🎞️ Đang kiểm tra điểm cắt, nối các clip, cân bằng âm thanh hiện trường và kết xuất phim."
            : "🎞️ Đang căn thời lượng, ghép hình/video với lời thoại, phụ đề, nhạc và kết xuất bản cuối."
          : nativeFilmAudio
            ? "🎞️ Checking edit points, joining clips, balancing production audio, and rendering the film."
            : "🎞️ Aligning timing, assembling visuals with narration, subtitles and music, then rendering the final video.",
      );

      if (nativeFilmAudio) {
        let clipAnalysis = await pipelineSystemFetch(
          API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
          {
            projectId: newProj.id,
            scenes: _.map(realScenes as StoryboardScene[], (scene) =>
              _.pick(scene, [
                "id",
                "assetUrl",
                "assetType",
                "visualIntent",
                "visibleAction",
                "reaction",
                "storyEvidence",
                "shotPurpose",
                "shotRole",
                "dialogueMode",
                "spokenDialogue",
                "characterBlocking",
                "eyelineDirection",
                "screenDirection",
                "actionStartState",
                "actionEndState",
                "locationState",
                "wardrobeState",
                "propState",
                "cinematicBeats",
                "cinematicContinuityHandoff",
              ]),
            ),
          },
          requestSignal,
        );
        for (
          let reviewAttempt = 1;
          reviewAttempt < CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_REVIEW_ATTEMPTS && (!clipAnalysis.success || !clipAnalysis.data?.editorialReviewAvailable);
          reviewAttempt++
        ) {
          appendLog(
            config.language === ProjectLanguage.VI
              ? "[Dựng phim] Chưa đọc được đầy đủ hình và âm thanh của các take; đang phân tích lại một lần."
              : "[Film edit] The take review did not read all picture and production audio; analyzing once more.",
          );
          clipAnalysis = await pipelineSystemFetch(
            API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
            {
              projectId: newProj.id,
              scenes: _.map(realScenes as StoryboardScene[], (scene) =>
                _.pick(scene, [
                  "id",
                  "assetUrl",
                  "assetType",
                  "visualIntent",
                  "visibleAction",
                  "reaction",
                  "storyEvidence",
                  "shotPurpose",
                  "shotRole",
                  "dialogueMode",
                  "spokenDialogue",
                  "characterBlocking",
                  "eyelineDirection",
                  "screenDirection",
                  "actionStartState",
                  "actionEndState",
                  "locationState",
                  "wardrobeState",
                  "propState",
                  "cinematicBeats",
                  "cinematicContinuityHandoff",
                ]),
              ),
              reviewAttempt: reviewAttempt + 1,
            },
            requestSignal,
          );
        }
        if (clipAnalysis.success && _.isArray(clipAnalysis.data?.decisions)) {
          realScenes = applyCinematicClipAnalysisDecisions(realScenes as StoryboardScene[], clipAnalysis.data.decisions);
          const adjustedCount = _.size(
            _.filter(realScenes, (scene) => _.gt(_.defaultTo(scene.sourceTrimStartSeconds, 0), 0) || _.gt(_.defaultTo(scene.sourceTrimEndSeconds, 0), 0)),
          );
          if (clipAnalysis.data?.editorialReviewAvailable) {
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Dựng phim] AI đã xem hình và nghe audio của ${realScenes.length} clip; áp dụng điểm in/out mới cho ${adjustedCount} clip.`
                : `[Film edit] AI reviewed picture and production audio for ${realScenes.length} clips; new in/out points were applied to ${adjustedCount} clips.`,
            );
            _.forEach(realScenes, (scene) => {
              const sourceDuration = _.toNumber(scene.duration);
              const start = _.toNumber(scene.sourceTrimStartSeconds);
              const end = _.max([start, sourceDuration - _.toNumber(scene.sourceTrimEndSeconds)]) || sourceDuration;
              const dialogueStatus = _.includes(["on_screen_dialogue", "off_screen_dialogue"], scene.dialogueMode)
                ? scene.cinematicDialogueDetected
                  ? `${_.round(scene.cinematicDialogueCoverageScore || 0)}%`
                  : config.language === ProjectLanguage.VI
                    ? "thiếu thoại"
                    : "dialogue missing"
                : config.language === ProjectLanguage.VI
                  ? "cảnh không thoại"
                  : "silent scene";
              const editSegmentCount = _.size(scene.cinematicEditSegments);
              appendLog(
                config.language === ProjectLanguage.VI
                  ? `[Dựng phim] ${scene.id}: nhận diện ${scene.cinematicObservedShotCount || 0} shot, chọn ${editSegmentCount} đoạn trong ${start.toFixed(2)}–${end.toFixed(2)}s; ${dialogueStatus}.`
                  : `[Film edit] ${scene.id}: detected ${scene.cinematicObservedShotCount || 0} shots, selected ${editSegmentCount} ranges within ${start.toFixed(2)}–${end.toFixed(2)}s; ${dialogueStatus}.`,
              );
            });
          } else {
            appendLog(
              config.language === ProjectLanguage.VI
                ? `[Dựng phim] Chỉ hoàn tất kiểm tra kỹ thuật ${realScenes.length} clip; AI chưa đọc được nội dung và audio nên không ghi nhận là đã chọn điểm dựng.`
                : `[Film edit] Technical checks completed for ${realScenes.length} clips; AI could not review story and audio, so no editorial selection is claimed.`,
            );
          }
        }
      }

      let acceptedScenes = nativeFilmAudio
        ? _.reject(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.cinematicTakeDecision, "omit"))
        : (realScenes as StoryboardScene[]);
      if (nativeFilmAudio) {
        const dialogueTakeIssues = getCinematicDialogueTakeIssues(acceptedScenes);
        if (!_.isEmpty(dialogueTakeIssues)) {
          const failedDialogueSceneIds = new Set(_.map(dialogueTakeIssues, (issue) => _.head(_.split(issue, ":"))));
          const failedDialogueScenes = _.filter(realScenes, (scene) => failedDialogueSceneIds.has(scene.id));
          _.forEach(failedDialogueScenes, (scene) => {
            if (!failedDialogueSceneIds.has(scene.id)) return;
            scene.assetUrl = undefined;
            scene.assetUrls = [];
            scene.assetStatus = SceneAssetStatus.Retrying;
            scene.assetError = undefined;
          });
          await persistImageCheckpoint();
          appendLog(
            config.language === ProjectLanguage.VI
              ? `Thoại chưa đạt ở ${_.join([...failedDialogueSceneIds], ", ")}; chỉ tạo lại đúng các cảnh này.`
              : `Dialogue failed in ${_.join([...failedDialogueSceneIds], ", ")}; regenerating only these scenes.`,
          );
          for (const scene of failedDialogueScenes) {
            const requestContext = createSceneRequestContext(scene, GenerateType.Video);
            const retryPrompt = await requestAiRewrittenVideoPrompt(scene, cinematicPreflightPrompts.get(scene.id) || requestContext.prompt, [
              `dialogue_missing_or_incomplete:${_.trim(scene.spokenDialogue)}`,
              `speaker_must_be:${_.trim(scene.speakerCharacterId)}`,
            ]);
            scene.generationPrompt = retryPrompt;
            const retryResult = await generateProjectImageOnce(
              { sceneId: scene.id, prompt: retryPrompt, referenceImages: requestContext.referenceImages, generateType: GenerateType.Video },
              () => ({
                prompt: retryPrompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: true,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: GenerateType.Video },
              }),
              requestSignal,
            );
            const retryAssetUrl = createProjectImageUrl(retryResult);
            if (!retryResult.success || !isPersistedProjectVideoUrl(retryAssetUrl)) {
              scene.assetStatus = SceneAssetStatus.Failed;
              scene.assetError = retryResult.warning || FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR;
              continue;
            }
            scene.assetUrl = retryAssetUrl;
            scene.assetUrls = [retryAssetUrl];
            scene.assetType = GenerateType.Video;
            scene.assetStatus = SceneAssetStatus.Generated;
            if (!_.isEmpty(retryResult.remoteMediaId)) scene.remoteVideoMediaId = retryResult.remoteMediaId;
            scene.remoteVideoDownloadPending = false;
            const retryRevision = appendAssetRevision(scene, retryAssetUrl, SceneAssetStatus.Generated);
            retryRevision.operation = "retry";
          }
          await persistImageCheckpoint();
          const regeneratedScenes: StoryboardScene[] = [];
          for (const scene of _.filter(failedDialogueScenes, (candidate) => hasSceneAsset(candidate)) as StoryboardScene[]) {
            const retryVisualQa = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { purpose: "video" });
            if (retryVisualQa.success && retryVisualQa.quality && retryVisualQa.approved) {
              scene.qaStatus = QaStatus.Passed;
              scene.acceptance = AssetAcceptance.Approved;
              scene.assetStatus = SceneAssetStatus.Approved;
              scene.assetError = undefined;
              regeneratedScenes.push(scene);
            } else {
              scene.qaStatus = retryVisualQa.quality ? QaStatus.Failed : QaStatus.Unavailable;
              scene.acceptance = AssetAcceptance.Rejected;
              scene.assetStatus = SceneAssetStatus.Failed;
              scene.assetError = "dialogue_retry_visual_qa_failed";
            }
          }
          await persistImageCheckpoint();
          const retryAnalysis = await pipelineSystemFetch(
            API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
            {
              projectId: newProj.id,
              scenes: _.map(regeneratedScenes, (scene) =>
                _.pick(scene, ["id", "assetUrl", "assetType", "dialogueMode", "spokenDialogue", "speakerCharacterId", "cinematicBeats"]),
              ),
              reviewAttempt: CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_REVIEW_ATTEMPTS,
            },
            requestSignal,
          );
          if (retryAnalysis.success && retryAnalysis.data?.editorialReviewAvailable && _.isArray(retryAnalysis.data?.decisions)) {
            realScenes = applyCinematicClipAnalysisDecisions(realScenes as StoryboardScene[], retryAnalysis.data.decisions);
          }
          const remainingDialogueIssues = getCinematicDialogueTakeIssues(
            _.filter(realScenes as StoryboardScene[], (scene) => failedDialogueSceneIds.has(scene.id)),
          );
          if (!_.isEmpty(remainingDialogueIssues)) {
            _.forEach(realScenes, (scene) => {
              if (!failedDialogueSceneIds.has(scene.id)) return;
              scene.assetStatus = SceneAssetStatus.Failed;
              scene.assetError = _.join(_.filter(remainingDialogueIssues, (issue) => _.startsWith(issue, `${scene.id}:`)), ", ");
            });
            await persistImageCheckpoint();
            throw new Error(
              config.language === ProjectLanguage.VI
                ? `Thoại vẫn chưa đạt ở ${_.join([...failedDialogueSceneIds], ", ")} sau lần sửa riêng cảnh.`
                : `Dialogue still failed in ${_.join([...failedDialogueSceneIds], ", ")} after the scene-only retry.`,
            );
          }
          acceptedScenes = _.reject(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.cinematicTakeDecision, "omit"));
        }
      }
      const editedTimeline = nativeFilmAudio ? createCinematicEditTimeline(acceptedScenes) : acceptedScenes;
      const renderableScenes = nativeFilmAudio ? trimCinematicTimelineToDialogue(editedTimeline) : editedTimeline;
      if (nativeFilmAudio && _.isEmpty(renderableScenes)) {
        throw new Error(config.language === ProjectLanguage.VI ? "Không xác định được biên thoại đầu và cuối để dựng phim." : "The first and final dialogue boundaries could not be determined for editing.");
      }
      const omittedCount = _.subtract(realScenes.length, acceptedScenes.length);
      if (omittedCount > 0)
        appendLog(
          config.language === ProjectLanguage.VI
            ? `[Dựng phim] Bỏ ${omittedCount} take hỏng kỹ thuật khỏi bản dựng; giữ nguyên các take hợp lệ để hoàn thành phim.`
            : `[Film edit] Omitted ${omittedCount} technically broken takes and retained all valid takes for completion.`,
        );
      const expectedRenderDuration = calculateSceneDuration(renderableScenes);
      if (nativeFilmAudio)
        appendLog(
          config.language === ProjectLanguage.VI
            ? `[Timeline] Bản dựng gồm ${countCinematicTimelineShots(acceptedScenes)} shot được AI chọn từ ${acceptedScenes.length} clip nguồn; thời lượng ${_.round(expectedRenderDuration, 1)} giây.`
            : `[Timeline] The edit contains ${countCinematicTimelineShots(acceptedScenes)} AI-selected shots from ${acceptedScenes.length} source clips; duration ${_.round(expectedRenderDuration, 1)} seconds.`,
        );
      appendLog(T.logRenderPlan(_.size(renderableScenes), expectedRenderDuration, !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl)));

      const renderPayload = {
        projectId: newProj.id,
        expectedSourceSceneIds: _.map(realScenes, "id"),
        expectedDurationSeconds: parseTargetDurationSeconds(config.duration),
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
        await syncProject({
          ...slicedUpdatedProj,
          generationCheckpoint: {
            intent: runIntent,
            phase: "rendering",
            lastSuccessfulPhase: "media",
            completedSceneIds: _.map(renderableScenes, "id"),
            pendingSceneIds: [],
            failedSceneIds: [],
            renderJobId: jobId,
            updatedAt: new Date().toISOString(),
          },
        });
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
              const finalQaResponse = await pipelineSystemFetch(
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
            renderCompletedProj.generationCheckpoint = {
              intent: runIntent,
              phase: "completed",
              lastSuccessfulPhase: "render",
              completedSceneIds: _.map(realScenes, "id"),
              pendingSceneIds: [],
              failedSceneIds: [],
              renderJobId: null,
              updatedAt: new Date().toISOString(),
            };
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
          const cancelledProject = {
            ...currentProject,
            status: REFACTOR_CONSTANTS.STATUS_CANCELLED,
            activeRunId: null,
            lastRunId: pipelineRunLease.runId,
            generationLogs: _.clone(currentLogs),
            generationCheckpoint: {
              ...(currentProject.generationCheckpoint || { intent: runIntent, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }),
              phase: "interrupted",
              renderJobId: activeRenderJobIdRef.current,
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
          setActiveCreatedProject(cancelledProject);
          activeProjectSnapshotRef.current = cancelledProject;
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
        generationCheckpoint: {
          ...(currentProject?.generationCheckpoint || { intent: runIntent, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }),
          phase: "failed",
          renderJobId: activeRenderJobIdRef.current,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      } as VideoProject;
      setActiveCreatedProject(failedProj);
      await onUpdateProject(failedProj, true);
    } finally {
      if (_.isEqual(activePipelineRunIdRef.current, pipelineRunId)) {
        setIsProcessing(false);
        processingRef.current = false;
        requestAbortControllerRef.current = null;
        activeRenderJobIdRef.current = null;
        activePipelineRunIdRef.current = null;
        setIsCancelling(false);
      }
      releasePipelineRunLease(pipelineRunLease);
    }
  };

  const cancelPipeline = () => {
    if (!processingRef.current || cancellationRef.current) return;
    cancellationRef.current = true;
    setIsCancelling(true);
    const pipelineRunId = activePipelineRunIdRef.current;
    const renderJobId = activeRenderJobIdRef.current;
    const project = activeProjectSnapshotRef.current;
    if (project && pipelineRunId) {
      const cancelledProject: VideoProject = {
        ...project,
        status: REFACTOR_CONSTANTS.STATUS_CANCELLED,
        activeRunId: null,
        lastRunId: pipelineRunId,
        generationCheckpoint: {
          ...(project.generationCheckpoint || { intent: "new", completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }),
          phase: "interrupted",
          renderJobId,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };
      activeProjectSnapshotRef.current = cancelledProject;
      setActiveCreatedProject(cancelledProject);
      void Promise.resolve(onUpdateProject(cancelledProject, true)).catch((error) => logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, error));
    }
    requestAbortControllerRef.current?.abort();
    void safeSystemFetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, {
      projectId: project?.id,
      pipelineRunId,
      renderJobId,
    }).catch((error) => logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, error));
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
