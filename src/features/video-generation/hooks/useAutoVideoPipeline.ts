import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import {
  SOURCE_TEMPLATE_AI_CHUA_TRA_DU_HO_SO,
  SOURCE_TEMPLATE_AI_DID_NOT_RETURN_A_COMPLETE,
  SOURCE_TEMPLATE_APPROVED_TAKES_ARE_INCOMPLETE_RENDER_IS,
  SOURCE_TEMPLATE_CHARACTERS_IDENTITY_PROMPT_MISSING,
  SOURCE_TEMPLATE_CHARACTERS_ID_MISSING,
  SOURCE_TEMPLATE_CHARACTERS_NAME_MISSING,
  SOURCE_TEMPLATE_CHUA_DU_CANH_QUAY_DAT_CHUAN,
  SOURCE_TEMPLATE_DATA_BASE64,
  SOURCE_TEMPLATE_DOAN_VIDEO_DA_DUOC_TAI_NHUNG,
  SOURCE_TEMPLATE_KE_HOACH_MO_TA_CANH_CHUA,
  SOURCE_TEMPLATE_KICH_BAN_BAN_DA_LUU_CHUA,
  SOURCE_TEMPLATE_KICH_BAN_CHUA_DAT_DIEU_KIEN,
  SOURCE_TEMPLATE_KICH_BAN_LAN_CHUA_DAT_DANG,
  SOURCE_TEMPLATE_MEDIA_RETRY_CHI_CHO_GIU_NGUYEN,
  SOURCE_TEMPLATE_MEDIA_RETRY_ONLY_FOR_SUCCESSFUL_SCENES,
  SOURCE_TEMPLATE_MIXED_MEDIA_IMAGE_FALLBACK_FAILED_FOR,
  SOURCE_TEMPLATE_PHAN_CANH_BAN_DA_LUU_CHUA,
  SOURCE_TEMPLATE_PHAN_CANH_CHUA_DAT_DIEU_KIEN,
  SOURCE_TEMPLATE_PHAN_CANH_LAN_CHUA_DAT_DANG,
  SOURCE_TEMPLATE_PROMPT_MISSING,
  SOURCE_TEMPLATE_SCRIPT_ATTEMPT_IS_INCOMPLETE_RETRYING_ONLY,
  SOURCE_TEMPLATE_SCRIPT_THE_SAVED_RESULT_IS_NOT,
  SOURCE_TEMPLATE_STORYBOARD_ATTEMPT_IS_INCOMPLETE_RETRYING_ONLY,
  SOURCE_TEMPLATE_STORYBOARD_THE_SAVED_RESULT_IS_INCOMPLETE,
  SOURCE_TEMPLATE_SYMBOL,
  SOURCE_TEMPLATE_SYMBOL_16,
  SOURCE_TEMPLATE_SYMBOL_33,
  SOURCE_TEMPLATE_SYMBOL_34,
  SOURCE_TEMPLATE_SYMBOL_35,
  SOURCE_TEMPLATE_SYMBOL_4,
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEMPLATE_THE_CLIP_WAS_DOWNLOADED_BUT_DID,
  SOURCE_TEMPLATE_THE_PROMPT_PLAN_IS_STILL_INVALID,
  SOURCE_TEMPLATE_THE_SCRIPT_DID_NOT_PASS_MANDATORY,
  SOURCE_TEMPLATE_THE_STORYBOARD_DID_NOT_PASS_MANDATORY,
  SOURCE_TEMPLATE_VIDEO_QA_ADVISORY,
  SOURCE_TEMPLATE_VIDEO_QA_MATERIAL_WARNING,
  SOURCE_TEMPLATE_VIDEO_QA_UNAVAILABLE,
  SOURCE_TEMPLATE_VISUAL_QA_RETRY_LIMIT,
  SOURCE_TEXT_ABORTERROR,
  SOURCE_TEXT_ACTIONENDSTATE,
  SOURCE_TEXT_ACTIONSTARTSTATE,
  SOURCE_TEXT_AI_GENERATED,
  SOURCE_TEXT_ARCHIVAL,
  SOURCE_TEXT_ASPECTRATIO,
  SOURCE_TEXT_ASSETTYPE,
  SOURCE_TEXT_ASSETURL,
  SOURCE_TEXT_AUDIOBASE64,
  SOURCE_TEXT_AUDIO_URL,
  SOURCE_TEXT_AUTHENTIC_CANDIDATES_FAILED_SEMANTIC_QA_EXPLICIT,
  SOURCE_TEXT_AUTHENTIC_SOURCE_UNAVAILABLE_AI_RECONSTRUCTION_USED,
  SOURCE_TEXT_AUTO,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_BEST_AVAILABLE_TAKE_AFTER_SINGLE_RETRY,
  SOURCE_TEXT_CAMERAMOTION,
  SOURCE_TEXT_CENTRALQUESTION,
  SOURCE_TEXT_CHARACTERBLOCKING,
  SOURCE_TEXT_CHARACTERS_DUPLICATE_ID,
  SOURCE_TEXT_CHARACTERS_MISSING,
  SOURCE_TEXT_CINEMATICBEATS,
  SOURCE_TEXT_CINEMATICCONTINUITYHANDOFF,
  SOURCE_TEXT_COMPLETED,
  SOURCE_TEXT_COMPLETED_WITH_WARNINGS,
  SOURCE_TEXT_CONTINUE,
  SOURCE_TEXT_DATA,
  SOURCE_TEXT_DATA_DIAGNOSTIC,
  SOURCE_TEXT_DIAGNOSTIC,
  SOURCE_TEXT_DIAGNOSTIC_MESSAGE,
  SOURCE_TEXT_DIALOGUEMODE,
  SOURCE_TEXT_DURATION,
  SOURCE_TEXT_EDITORIALLY_PUBLISHABLE,
  SOURCE_TEXT_EFFECTS,
  SOURCE_TEXT_EXTRACTED,
  SOURCE_TEXT_EYELINEDIRECTION,
  SOURCE_TEXT_FAILED,
  SOURCE_TEXT_FALLBACK,
  SOURCE_TEXT_GENERATED_ASSET_MISSING,
  SOURCE_TEXT_GENERATETYPE,
  SOURCE_TEXT_GENERATIONPROMPT,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_IMAGE,
  SOURCE_TEXT_IMAGEFOCUSMODE,
  SOURCE_TEXT_IMAGEGENERATORENGINE,
  SOURCE_TEXT_IMAGES,
  SOURCE_TEXT_IMAGE_JPEG,
  SOURCE_TEXT_INITIALIZING,
  SOURCE_TEXT_INTERRUPTED,
  SOURCE_TEXT_INTRO,
  SOURCE_TEXT_INTROTITLE,
  SOURCE_TEXT_ISFILMINTRO,
  SOURCE_TEXT_LIGHTINGEFFECT,
  SOURCE_TEXT_LOCATIONSTATE,
  SOURCE_TEXT_MEDIA,
  SOURCE_TEXT_MEDIA_COMPLETED,
  SOURCE_TEXT_MEDIA_GENERATION,
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_NARRATIVEROLE,
  SOURCE_TEXT_NATIVE_VIDEO_AUDIO,
  SOURCE_TEXT_NEW,
  SOURCE_TEXT_NO_READABLE_TEXT_UNLESS_THE_CURRENT,
  SOURCE_TEXT_OMIT,
  SOURCE_TEXT_PHIM_AI,
  SOURCE_TEXT_PROMPT,
  SOURCE_TEXT_PROMPT_PLANNING,
  SOURCE_TEXT_PROMPT_PLANNING_COMPLETED,
  SOURCE_TEXT_PROMPT_PLANNING_FAILED,
  SOURCE_TEXT_PROPSTATE,
  SOURCE_TEXT_QA,
  SOURCE_TEXT_QA_UNAVAILABLE_NO_EVIDENCE_FOR_REGENERATION,
  SOURCE_TEXT_QUALITY_SCORE_BELOW_RECOMMENDED_TARGET,
  SOURCE_TEXT_REACTION,
  SOURCE_TEXT_RENDER,
  SOURCE_TEXT_RENDERING,
  SOURCE_TEXT_RENDER_ONLY,
  SOURCE_TEXT_RENDER_THE_EXACT_REQUIRED_HEADLINE_ONCE,
  SOURCE_TEXT_REPEATED_VISUAL_CONTENT_OMITTED,
  SOURCE_TEXT_RETRY,
  SOURCE_TEXT_REVIEW_UNAVAILABLE,
  SOURCE_TEXT_SCENE,
  SOURCE_TEXT_SCENEREFERENCEIMAGES,
  SOURCE_TEXT_SCENE_IMAGE,
  SOURCE_TEXT_SCREENDIRECTION,
  SOURCE_TEXT_SCRIPT,
  SOURCE_TEXT_SCRIPTSEGMENT,
  SOURCE_TEXT_SCRIPT_REQUEST_FAILED,
  SOURCE_TEXT_SEMANTIC_AND_CONTINUITY_QA_PASSED,
  SOURCE_TEXT_SEMANTIC_QA_PASSED_WITH_ADVISORY,
  SOURCE_TEXT_SERIES,
  SOURCE_TEXT_SHOTPURPOSE,
  SOURCE_TEXT_SHOTROLE,
  SOURCE_TEXT_SINGLE,
  SOURCE_TEXT_SPOKENDIALOGUE,
  SOURCE_TEXT_STORYBOARD,
  SOURCE_TEXT_STORYBOARD_REQUEST_FAILED,
  SOURCE_TEXT_STORYCHANGE,
  SOURCE_TEXT_STORYEVIDENCE,
  SOURCE_TEXT_STORYQUESTION,
  SOURCE_TEXT_STYLE,
  SOURCE_TEXT_STYLEBACKGROUNDMODE,
  SOURCE_TEXT_STYLEPRESET,
  SOURCE_TEXT_STYLEREFERENCEIMAGES,
  SOURCE_TEXT_STYLETEXTINIMAGEMODE,
  SOURCE_TEXT_SUBTITLE,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_SYMBOL_6,
  SOURCE_TEXT_THUMBNAIL,
  SOURCE_TEXT_THUMBNAILREFERENCEIMAGES,
  SOURCE_TEXT_THUMBNAILSCENE,
  SOURCE_TEXT_THUMBNAILSCENEREFERENCEIMAGES,
  SOURCE_TEXT_THUMBNAIL_MUST_MATCH_THE_STORY_AND,
  SOURCE_TEXT_TITLES,
  SOURCE_TEXT_TRANSITION,
  SOURCE_TEXT_USE,
  SOURCE_TEXT_VIDEO_2,
  SOURCE_TEXT_VIEWERPROMISE,
  SOURCE_TEXT_VISIBLEACTION,
  SOURCE_TEXT_VISUALINTENT,
  SOURCE_TEXT_VISUAL_QA_REGENERATION_FAILED,
  SOURCE_TEXT_VISUAL_QA_UNAVAILABLE,
  SOURCE_TEXT_WARDROBESTATE,
} from "../../../constants/sourceText";
import { delayAsync } from "../../../lib/asyncUtils";
import { getErrorMessage } from "../../../utils/errorUtils";
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
  SubtitleMode,
  ShotPurpose,
} from "../../../types";
import { PIPELINE_STEPS, VideoQuality } from "../../../constants/enums";
import { API_ROUTES, CONTENT_TYPES, REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS, API_HEADERS, PIPELINE_CLIENT_ERRORS } from "../../../constants";
import { CONTENT_TYPE_HEADER, PRESET_CONSTANTS, PIPELINE_EXECUTION_ROUTE_TEXTS, PIPELINE_FLOW_TEXTS } from "../../../constants/texts";
import {
  AUTO_GENERATOR_CONSTANTS,
  AUTO_VIDEO_PIPELINE_PROGRESS,
  CINEMATIC_EDIT_ANALYSIS_CONFIG,
  CINEMATIC_GENERATION_RECOVERY_CONFIG,
  CINEMATIC_CONFIG,
  CINEMATIC_SCRIPT_ARTIFACT_CONFIG,
  FFMPEG_RENDER_CONSTANTS,
  FLOW_DIRECT_VIDEO_CONFIG,
  FLOW_VIDEO_MEDIA_CONFIG,
  PROJECT_IMAGE_FALLBACK_CONFIG,
  PIPELINE_GUARANTEE_CONFIG,
  PIPELINE_COMPLETION_CONFIG,
  PIPELINE_FETCH_FAILURE_KEY,
  REFERENCE_ASSET_GROUP,
} from "../../../constants/config";
import { IMAGE_PROMPT_PIPELINE_VERSION } from "../../../constants/imagePromptRules";
import { jsonUtils } from "../../../lib/json";
import { storageUtils } from "../../../lib/storage";
import { smartSplitSentences } from "../../../lib/textProcessor";
import { logger } from "../../../utils/logger";
import { createSystemFetchFailure, safeSystemFetch, generateRandomString, type SystemFetchResult } from "../../../lib/shared-utils";
import {
  createProjectImageUrl,
  generateProjectImages,
  generateProjectImageOnce,
  getSceneAssetSummary,
  hasSceneAsset,
  isProviderGenerationRejection,
  isStaleFlowVideoRecoveryError,
  isPersistedProjectVideoUrl,
  isNonRetryableFlowVideoError,
  isUsableGeneratedAssetUrl,
  prepareProjectMediaPrompt,
  recoverProjectFlowVideo,
  resolveSceneGenerateType,
  selectVideoSceneIds,
  type ProjectImageResult,
} from "../../../services/projectImageGenerationService";
import { resolveVisualConfig } from "../../../services/autoVideoConfigResolver";
import { evaluateEdit, evaluateSubtitles, resolveGenreVoiceArc } from "../../../services/productionQualityService";
import { appendAssetRevision, createSceneDependencyHash, inheritApprovedSceneAsset } from "../../../services/dependencyHashService";
import { createManualReviewItems, evaluateFinalQuality } from "../../../services/finalQualityService";
import { migrateVideoProject } from "../../../services/projectMigrationService";
import { resolveQualityProfile } from "../../../services/qualityProfileService";
import { upscaleApprovedSceneAssets } from "../../../services/imageUpscaleService";
import { createAdvisoryFinalVideoReport } from "../../../services/finalMultimodalQualityService";
import { createPipelineBenchmark, resolveRolloutConfig } from "../../../services/rolloutService";
import { applyOptionalMusicAsset, createAudioCueSheet, resolveAutomaticMusicProfile } from "../../../services/soundDesignService";
import { createRenderAudioTracks } from "../../../services/audioMixService";
import { createShadowComparison } from "../../../services/shadowComparisonService";
import { resolvePipelineAiExecution } from "../../../services/pipelineAiExecutionService";
import { formatSceneList, formatUserFacingLog } from "../../../lib/userLogFormatter";
import { partitionCinematicPlanningResponse } from "../../../services/cinematicPlanningRecoveryService";
import { evaluateImagePrompts } from "../../../services/imagePromptQualityService";
import { parseTargetDurationSeconds } from "../../../services/scriptQualityService";
import { createCharacterIdentityDescription, createSceneGenerationContext, resolveCinematicSceneCharacterReferences, SCENE_REFERENCE_CONFIG } from "../../../services/sceneReferenceService";
import { adaptImagePromptForEngine } from "../../../services/imageEngineAdapterService";
import { createThumbnailStyleDirective } from "../../../services/styleReferenceService";
import { hasSourceGenderConflict, hasStyleContaminatedCharacterLibrary, validateVisualContinuity } from "../../../services/visualContinuityService";
import { generateDirectedVoice } from "../../../services/voiceDirectionService";
import { alignVoiceTimeline, removeRedundantSceneAudioBase64 } from "../../../services/voiceTimelineService";
import { assessVoiceAdvisory } from "../../../services/voiceQualityRepairService";
import { createSubtitleCues } from "../../../services/subtitleService";
import { getThumbnailTechnicalPlanningIssues, resolveThumbnailGenerationPrompt, resolveThumbnailReferenceImages } from "../../../services/thumbnailPromptService";
import { acceptGeneratedThumbnail } from "../../../services/thumbnailQualityPipelineService";
import { createSceneContinuityKey, createThumbnailContinuityKey } from "../../../services/imageGenerationContinuityService";
import { clearSceneGeneratedAsset, clearSceneVisualAsset } from "../../../services/projectRegenerationService";
import { getVisualShotPlanIssues } from "../../../services/visualPlanningService";
import { resolveStylePreset } from "../../../constants/stylePresets";
import { getSceneVisualRegenerationReasons, SCENE_VISUAL_QUALITY_CONFIG, shouldRegenerateSceneImage, validateSceneImage } from "../../../services/sceneVisualQualityService";
import { isHookTopicallyGrounded } from "../../../services/hookResilienceService";
import { validateChapterLanguage } from "../../../services/chapterLanguageValidationService";
import { acquirePipelineRunLease, refreshPipelineRunLease, releasePipelineRunLease } from "../../../services/pipelineRunLockService";
import { applyCinematicProductionPolicy, getBlockingCinematicStoryboardContractIssues, getCinematicDialogueTakeIssues, getCinematicGeneratedTakeIssues, isCinematicVideoTakeRenderable, getCinematicScriptReadinessIssues, getCinematicStoryboardReadinessIssues, createCinematicPlanningBatches, isCinematicEpisodeGenre } from "../../../services/cinematicProductionPolicyService";
import { applyCinematicClipAnalysisDecisions, countCinematicTimelineShots, createCinematicEditTimeline, hasCinematicSceneDialogue } from "../../../services/cinematicEditTimelineService";
import { getBlockingCinematicPromptPreflightIssues } from "../../../services/cinematicPromptPreflightService";
import { Lang } from "../../../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../../../constants/texts";
import { CINEMATIC_CHARACTER_PACK_CONFIG, CINEMATIC_CHAT_PLANNING_CONFIG, CINEMATIC_PROGRESS_MESSAGES, CINEMATIC_PROGRESS_STAGE, CINEMATIC_PLANNING_MESSAGES, CINEMATIC_POLICY_CONFIG, CINEMATIC_ROOM_STAGE, CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION, resolveCinematicClipDuration } from "../../../constants/cinematicConstants";
import { calculateSceneDuration, fetchCachedVoiceAudio, getReferenceChangeState, getPipelineInvalidationState, getGenerationCheckpointSceneProgress, mergeContinuationLogs, preserveInterruptedStoryboardCheckpoint, resolveCinematicContinuationStage, hasCompleteSceneAlignment, resolveTargetProject } from "./autoVideoPipelineUtils";
const getRestoredPipelineProgress = (project: VideoProject): { step: number; progress: number } => {
  const phase = project.generationCheckpoint?.phase;
  if (_.isEqual(phase, SOURCE_TEXT_COMPLETED)) return { step: PIPELINE_STEPS.STEP_4, progress: AUTO_VIDEO_PIPELINE_PROGRESS.COMPLETE };
  if (_.isEqual(phase, SOURCE_TEXT_RENDERING) || _.isEqual(project.generationCheckpoint?.lastSuccessfulPhase, SOURCE_TEXT_RENDER)) return { step: PIPELINE_STEPS.STEP_4, progress: AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE };
  if (_.includes([SOURCE_TEXT_MEDIA_GENERATION, SOURCE_TEXT_MEDIA_COMPLETED] as string[], phase)) return { step: PIPELINE_STEPS.STEP_3, progress: _.isEqual(phase, SOURCE_TEXT_MEDIA_COMPLETED) ? AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE : AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START };
  if (!_.isEmpty(project.storyboard)) return { step: PIPELINE_STEPS.STEP_2, progress: AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE };
  return { step: PIPELINE_STEPS.STEP_1, progress: AUTO_VIDEO_PIPELINE_PROGRESS.START };
};
const createCinematicIntroScene = (intro: any, duration: number): StoryboardScene | undefined => {
  if (_.isEmpty(intro) || _.isEmpty(_.trim(_.toString(intro.script)))) return undefined;
  return {
    id: _.toString(intro.id),
    chapterId: CINEMATIC_POLICY_CONFIG.INTRO_CHAPTER_ID,
    startTime: CINEMATIC_POLICY_CONFIG.INTRO_TIMECODE,
    endTime: CINEMATIC_POLICY_CONFIG.INTRO_TIMECODE,
    duration,
    script: _.toString(intro.script),
    subtitle: _.toString(intro.subtitle),
    prompt: _.toString(intro.generationPrompt),
    generationPrompt: _.toString(intro.generationPrompt),
    generationPromptProfileVersion: CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION,
    cameraMotion: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    characterIds: _.castArray(intro.characterIds || []),
    narrativeRole: CINEMATIC_POLICY_CONFIG.INTRO_NARRATIVE_ROLE,
    storyQuestion: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
    storyChange: _.toString(intro.script),
    isFilmIntro: true,
    introTitle: _.toString(intro.introTitle),
    shotPurpose: ShotPurpose.Transition,
    textAllowed: !_.isEmpty(_.trim(_.toString(intro.introTitle))),
    textOverlay: _.toString(intro.introTitle),
    assetStrategy: CINEMATIC_POLICY_CONFIG.INTRO_ASSET_STRATEGY,
  };
};
const prependCinematicIntro = (scenes: StoryboardScene[], intro: any, duration: number): StoryboardScene[] => {
  if (_.some(scenes, (scene) => Boolean(scene.isFilmIntro) || _.isEqual(scene.id, CINEMATIC_POLICY_CONFIG.INTRO_SCENE_ID))) return scenes;
  const introScene = createCinematicIntroScene(intro, duration);
  return introScene ? [introScene, ...scenes] : scenes;
};
const mergeCharacterReferenceState = (existingCharacters: CharacterConfig[] | undefined, nextCharacters: CharacterConfig[]): CharacterConfig[] => {
  const existingById = _.keyBy(_.defaultTo(existingCharacters, []), SOURCE_TEXT_ID);
  const existingByName = _.keyBy(_.defaultTo(existingCharacters, []), (character) => _.toLower(_.trim(character.name)));
  return _.map(nextCharacters, (character) => {
    const existingCharacter = existingById[character.id] || existingByName[_.toLower(_.trim(character.name))];
    if (!existingCharacter) return character;
    const images = _.isEmpty(character.images) ? _.defaultTo(existingCharacter.images, []) : character.images;
    return {
      ...existingCharacter,
      ...character,
      images,
      flowCharacterName: character.flowCharacterName || existingCharacter.flowCharacterName,
      flowCharacterProjectId: character.flowCharacterProjectId || existingCharacter.flowCharacterProjectId,
      flowCharacterProfileVersion: character.flowCharacterProfileVersion || existingCharacter.flowCharacterProfileVersion,
      extracted: Boolean(character.extracted || existingCharacter.extracted || !_.isEmpty(images)),
    };
  });
};
const preserveExistingList = <T>(nextValues: T[] | undefined, existingValues: T[] | undefined): T[] => (_.isEmpty(nextValues) && !_.isEmpty(existingValues) ? _.defaultTo(existingValues, []) : _.defaultTo(nextValues, []));
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
  subtitleMode?: SubtitleMode;
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
const getCinematicCharacterArtifactIssues = (artifact: any): string[] => {
  const characters = _.castArray(artifact?.characters || []);
  const ids = _.map(characters, (character) => _.trim(_.toString(character?.id)));
  return _.uniq(
    _.compact([
      _.isEmpty(characters) && SOURCE_TEXT_CHARACTERS_MISSING,
      _.uniq(ids).length !== ids.length && SOURCE_TEXT_CHARACTERS_DUPLICATE_ID,
      ..._.flatMap(characters, (character, index) => [
        _.isEmpty(_.trim(_.toString(character?.id))) && SOURCE_TEMPLATE_CHARACTERS_ID_MISSING(`${index}`),
        _.isEmpty(_.trim(_.toString(character?.name))) && SOURCE_TEMPLATE_CHARACTERS_NAME_MISSING(`${index}`),
        _.isEmpty(_.trim(_.toString(character?.prompt))) && _.isEmpty(_.trim(_.toString(character?.referenceGenerationPrompt))) && SOURCE_TEMPLATE_CHARACTERS_IDENTITY_PROMPT_MISSING(`${index}`),
      ]),
    ]),
  );
};
export function useAutoVideoPipeline(projects: VideoProject[], onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void, currentLang: Lang, pipelineScope: "auto" | "cinematic" = SOURCE_TEXT_AUTO) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;
  const PF = PIPELINE_FLOW_TEXTS[currentLang as "vi" | "en"] || PIPELINE_FLOW_TEXTS.vi;
  const isCinematicScope = _.isEqual(pipelineScope, CINEMATIC_CONFIG.STATE_SCOPE);
  const selectedProjectStorageKey = isCinematicScope ? REFACTOR_CONSTANTS.KEY_SELECTED_CINEMATIC_PROJECT : REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT;
  const currentLogsStorageKey = isCinematicScope ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_CURRENT_LOGS : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS;
  const projectLogsStoragePrefix = isCinematicScope ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_PROJECT_LOGS_PREFIX : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX;
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
    const requestedRunIntent = config.runIntent || (config.resumeMode ? SOURCE_TEXT_CONTINUE : SOURCE_TEXT_NEW);
    const requestedContinuation = _.includes([SOURCE_TEXT_CONTINUE, SOURCE_TEXT_RENDER_ONLY] as string[], requestedRunIntent);
    let hydratedContinuationTarget: VideoProject | null = null;
    if (requestedContinuation) {
      const savedTargetSummary = resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent, config.cinematicMode).existingTargetProject;
      if (savedTargetSummary?.id) {
        hydratedContinuationTarget = await fetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PROJECTS}`, `${savedTargetSummary.id}`))
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);
      }
      const savedTarget = hydratedContinuationTarget || savedTargetSummary;
      const savedTargetIsCinematic = Boolean(_.isEqual(savedTarget?.projectKind, ProjectKind.Cinematic) || _.endsWith(_.toString(savedTarget?.name), SOURCE_TEXT_PHIM_AI));
      if (savedTarget && savedTargetIsCinematic) {
        config.projectName = savedTarget.name;
        config.inputType = _.defaultTo(savedTarget.input?.type, config.inputType);
        config.scriptContent = _.toString(savedTarget.input?.content || config.scriptContent);
        config.genre = _.defaultTo(savedTarget.config?.genre, config.genre);
        config.language = _.defaultTo(savedTarget.config?.language, config.language);
        config.duration = _.defaultTo(savedTarget.config?.duration, config.duration);
        config.splitStrategy = _.defaultTo(savedTarget.config?.splitStrategy, config.splitStrategy);
        config.musicAssetUrl = _.defaultTo(savedTarget.config?.musicAssetUrl, config.musicAssetUrl);
        config.subtitleMode = _.defaultTo(savedTarget.config?.subtitleMode, config.subtitleMode);
        config.generationMode = _.defaultTo(savedTarget.visualConfig?.generationMode, config.generationMode);
        config.imageGeneratorEngine = _.defaultTo(savedTarget.visualConfig?.imageGeneratorEngine, config.imageGeneratorEngine);
        config.generateType = _.defaultTo(savedTarget.visualConfig?.generateType, config.generateType);
        config.maxVideoScenes = _.defaultTo(savedTarget.visualConfig?.maxVideoScenes, config.maxVideoScenes);
        config.aspectRatio = _.defaultTo(savedTarget.visualConfig?.aspectRatio, config.aspectRatio) as AspectRatio;
        config.videoDuration = _.defaultTo(savedTarget.visualConfig?.videoDuration, config.videoDuration);
        config.videoResolution = _.defaultTo(savedTarget.visualConfig?.videoResolution, config.videoResolution);
        config.chromeHeadless = _.defaultTo(savedTarget.visualConfig?.chromeHeadless, config.chromeHeadless);
        config.stylePreset = _.defaultTo(savedTarget.visualConfig?.style, config.stylePreset);
        config.thumbnailCount = _.defaultTo(savedTarget.visualConfig?.thumbnailCount, config.thumbnailCount);
        config.thumbnailStylePreset = _.defaultTo(savedTarget.visualConfig?.thumbnailReferencePrompt, config.thumbnailStylePreset);
        config.thumbnailBackgroundMode = _.defaultTo(savedTarget.visualConfig?.thumbnailBackgroundMode, config.thumbnailBackgroundMode);
        config.thumbnailTextInImageMode = _.defaultTo(savedTarget.visualConfig?.thumbnailTextInImageMode, config.thumbnailTextInImageMode);
        config.thumbnailImageFocusMode = _.defaultTo(savedTarget.visualConfig?.thumbnailImageFocusMode, config.thumbnailImageFocusMode);
      }
      if (_.isEmpty(_.trim(config.scriptContent))) {
        config.scriptContent = _.toString(savedTarget?.input?.content || savedTarget?.scriptRewritten || _.join(_.map(savedTarget?.chapters, SOURCE_TEXT_SCRIPTSEGMENT), RT_SHARED.SYMBOL_36A9E7) || _.join(_.map(savedTarget?.storyboard, SOURCE_TEXT_SCRIPT), RT_SHARED.SYMBOL_36A9E7));
      }
    }
    if (_.isEmpty(_.trim(config.scriptContent))) {
      toast.warning(T.alertEmptyScript);
      return;
    }
    const presentationTarget = hydratedContinuationTarget || resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent, config.cinematicMode).existingTargetProject;
    const startsDifferentContent = Boolean(presentationTarget) && _.some([!_.isEqual(presentationTarget?.input?.type, config.inputType), !_.isEqual(_.trim(presentationTarget?.input?.content), _.trim(config.scriptContent))], Boolean);
    const runIntent = requestedRunIntent;
    const isContinuation = _.includes([SOURCE_TEXT_CONTINUE, SOURCE_TEXT_RENDER_ONLY] as string[], runIntent);
    const isCinematicPipeline = Boolean(config.cinematicMode || isCinematicEpisodeGenre(config.genre) || _.isEqual(presentationTarget?.projectKind, ProjectKind.Cinematic) || _.endsWith(_.toString(presentationTarget?.name), SOURCE_TEXT_PHIM_AI));
    config.resumeMode = isContinuation;
    const completedCheckpoint = presentationTarget?.generationCheckpoint;
    const hasCompletedFilm = Boolean(isContinuation && !_.isEmpty(_.trim(_.toString(presentationTarget?.renderedVideoUrl))) && _.isEqual(completedCheckpoint?.phase, SOURCE_TEXT_COMPLETED) && _.isEmpty(completedCheckpoint?.pendingSceneIds));
    if (hasCompletedFilm && presentationTarget) {
      setActiveCreatedProject(presentationTarget);
      setRenderedVideoUrl(_.toString(presentationTarget.renderedVideoUrl));
      setCurrentStepIndex(PIPELINE_STEPS.STEP_4);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.COMPLETE);
      const restoredLogs = _.defaultTo(presentationTarget.generationLogs, []);
      if (!_.isEmpty(restoredLogs)) setLogs(restoredLogs);
      return;
    }
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
    const pipelineArtifactRunId = isContinuation && !startsDifferentContent && !_.isEmpty(_.trim(_.toString(presentationTarget?.lastRunId))) ? _.toString(presentationTarget?.lastRunId) : pipelineRunId;
    activePipelineRunIdRef.current = pipelineRunId;
    const throwIfCancelled = () => {
      if (cancellationRef.current || requestSignal.aborted || !_.isEqual(activePipelineRunIdRef.current, pipelineRunId)) {
        throw new DOMException(T.cancelledError, SOURCE_TEXT_ABORTERROR);
      }
    };
    setIsProcessing(true);
    setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.START);
    setCurrentStepIndex(1);
    const continuationProjectId = _.toString(presentationTarget?.id || config.selectedProjectId || activeCreatedProject?.id);
    const cachedContinuationLogsValue = isContinuation && continuationProjectId ? storageUtils.get(`${projectLogsStoragePrefix}${continuationProjectId}`) : null;
    const cachedContinuationLogs = cachedContinuationLogsValue ? jsonUtils.safeParse<string[]>(cachedContinuationLogsValue, []) : [];
    const visibleContinuationLogs = _.isEqual(activeCreatedProject?.id, presentationTarget?.id) ? logs : [];
    const completedRunLogs = isContinuation ? mergeContinuationLogs(hydratedContinuationTarget?.generationLogs, presentationTarget?.generationLogs, cachedContinuationLogs, visibleContinuationLogs) : [];
    let currentLogs: string[] = _.clone(completedRunLogs);
    setLogs(_.clone(currentLogs));
    storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify(currentLogs));
    let currentLogProjectId = isContinuation ? continuationProjectId : REFACTOR_CONSTANTS.VD_EMPTY_STRING;
    const cinematicProgressMessages = config.language === ProjectLanguage.VI ? CINEMATIC_PROGRESS_MESSAGES.vi : CINEMATIC_PROGRESS_MESSAGES.en;
    const cinematicResumeStage = isCinematicPipeline && isContinuation ? resolveCinematicContinuationStage(presentationTarget) : CINEMATIC_PROGRESS_STAGE.SCRIPT;
    let cinematicProgressStage: number = cinematicResumeStage;
    const appendLog = (msg: string, cinematicUserVisible = false) => {
      if (!_.isEqual(activePipelineRunIdRef.current, pipelineRunId)) return;
      if (isCinematicPipeline && !cinematicUserVisible) return;
      const userMessage = formatUserFacingLog(msg, config.language);
      const previousMessage = _.trim(_.toString(_.last(currentLogs))).replace(/^\[[^\]]+\]\s*/, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      if (_.isEqual(previousMessage, userMessage)) return;
      const timestamp = new Date().toLocaleTimeString();
      const formatted = SOURCE_TEMPLATE_SYMBOL_4(`${timestamp}`, `${userMessage}`);
      currentLogs = _.concat(currentLogs, formatted);
      setLogs(_.clone(currentLogs));
      storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify(currentLogs));
      if (currentLogProjectId) {
        storageUtils.set(`${projectLogsStoragePrefix}${currentLogProjectId}`, jsonUtils.safeStringify(currentLogs));
      }
    };
    const appendCinematicLog = (msg: string, stage?: number) => {
      if (!isCinematicPipeline) return;
      if (_.isNumber(stage)) cinematicProgressStage = _.max([cinematicProgressStage, stage]) || cinematicProgressStage;
      appendLog(msg, true);
    };
    const pipelineStartedAt = Date.now();
    let currentProject: VideoProject | null = resetDerivedPresentation ? null : activeCreatedProject;
    let latestCheckpointStoryboard: StoryboardScene[] = [];
    let roomCleanupProvider = AiPlanningFallbackProvider.Disabled;
    let retainPlanningRoomsForResume = false;
    let pipelineCompleted = false;
    let planningRoomClosedBeforeVideo = false;
    if (isCinematicPipeline) {
      if (_.isEqual(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.SCRIPT)) {
        appendCinematicLog(cinematicProgressMessages.SCRIPT_START, CINEMATIC_PROGRESS_STAGE.SCRIPT);
      } else if (_.isEqual(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.PROMPT)) {
        appendCinematicLog(cinematicProgressMessages.PROMPT_START, CINEMATIC_PROGRESS_STAGE.PROMPT);
      } else if (_.isEqual(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.THUMBNAIL)) {
        appendCinematicLog(cinematicProgressMessages.THUMBNAIL_START, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
      } else {
        appendCinematicLog(_.replace(cinematicProgressMessages.VIDEO_START, SecurityConstants.PLACEHOLDER_0, _.toString(presentationTarget?.storyboard?.length || SecurityConstants.ZERO)), CINEMATIC_PROGRESS_STAGE.VIDEO);
      }
    } else appendLog(T.logPipelineStart);
    appendLog(T.logConfigSummary(config.genre, config.language, config.duration, config.generationMode, config.resumeMode));
    try {
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_INIT);
      let newProjectId: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let newProj: VideoProject;
      const resolvedTarget = resolveTargetProject(projects, config.selectedProjectId, activeCreatedProject, config.projectName, config.scriptContent, config.cinematicMode);
      const selectedAutoProj = resolvedTarget.selectedAutoProject;
      const rawExistingTargetProj = hydratedContinuationTarget || resolvedTarget.existingTargetProject;
      const existingTargetProj = migrateVideoProject(rawExistingTargetProj);
      const resolvedAiExecution = resolvePipelineAiExecution(config, existingTargetProj, isCinematicPipeline);
      roomCleanupProvider = resolvedAiExecution.provider;
      config.planningFallbackProvider = resolvedAiExecution.provider;
      config.planningChatModel = resolvedAiExecution.model;
      config.planningExecutionMode = resolvedAiExecution.mode;
      config.planningChromeHeadless = resolvedAiExecution.chromeHeadless;
      const pipelineSystemFetch = (url: string, payload: any, signal?: AbortSignal) => safeSystemFetch(url, { ...payload, aiExecution: { mode: resolvedAiExecution.mode, provider: resolvedAiExecution.provider, model: resolvedAiExecution.model, projectId: newProjectId || pipelineTargetKey, chromeHeadless: resolvedAiExecution.chromeHeadless } }, signal);
      const routeTexts = _.isEqual(config.language, ProjectLanguage.VI) ? PIPELINE_EXECUTION_ROUTE_TEXTS.vi : PIPELINE_EXECUTION_ROUTE_TEXTS.en;
      const modeLabel = _.isEqual(resolvedAiExecution.mode, AiPlanningExecutionMode.RoomOnly) ? routeTexts.ROOM_ONLY : _.isEqual(resolvedAiExecution.mode, AiPlanningExecutionMode.ApiOnly) ? routeTexts.API_ONLY : routeTexts.HYBRID;
      appendLog(routeTexts.formatRoute(modeLabel, resolvedAiExecution.provider, resolvedAiExecution.model));
      const referenceChangeState = getReferenceChangeState(existingTargetProj, config.referenceImages, config.sceneReferenceImages, config.thumbnailReferenceImages, [], isContinuation);
      let invalidationState = preserveInterruptedStoryboardCheckpoint(existingTargetProj, config, getPipelineInvalidationState(existingTargetProj, config, referenceChangeState));
      const requiresCinematicVisualPromptLanguageUpgrade = Boolean(isCinematicPipeline && existingTargetProj && !_.isEqual(existingTargetProj.cinematicScriptArtifacts?.schemaVersion, CINEMATIC_SCRIPT_ARTIFACT_CONFIG.FILM_PACKAGE_SCHEMA_VERSION));
      if (isContinuation && existingTargetProj) {
        invalidationState = {
          regenerateScript: _.isEmpty(existingTargetProj.scriptRewritten) || requiresCinematicVisualPromptLanguageUpgrade,
          regenerateStoryboard: _.isEmpty(existingTargetProj.storyboard) || requiresCinematicVisualPromptLanguageUpgrade,
          regenerateVoice: !isCinematicEpisodeGenre(config.genre) && _.isEmpty(existingTargetProj.voiceConfig?.audioUrl) && _.isEmpty(existingTargetProj.voiceConfig?.audioBase64),
          regenerateSceneAssets: false,
          regenerateSeo: _.isEmpty(existingTargetProj.seo),
          regenerateThumbnails: _.isEmpty(existingTargetProj.thumbnails) || requiresCinematicVisualPromptLanguageUpgrade,
        };
      }
      const sceneStyleProfileOutdated = _.every([!_.isEmpty(existingTargetProj?.visualConfig?.styleReferenceImages), _.isEmpty(existingTargetProj?.visualBible?.styleProfile?.characterType)], Boolean);
      const thumbnailStyleProfileOutdated = _.every([!_.isEmpty(existingTargetProj?.visualConfig?.thumbnailReferenceImages), _.isEmpty(existingTargetProj?.visualConfig?.thumbnailStyleProfile?.characterType)], Boolean);
      const requiresVisualReferenceMigration = _.some(existingTargetProj?.storyboard, (scene) => _.isEmpty(scene.layout) || _.isNil(scene.textAllowed)) || sceneStyleProfileOutdated || thumbnailStyleProfileOutdated;
      const requiresPromptPlanningMigration = _.some(existingTargetProj?.storyboard, (scene) => {
        if (isCinematicEpisodeGenre(config.genre)) {
          const promptMissing = _.isEmpty(_.trim(scene.generationPrompt));
          const pendingPromptProfileOutdated = !hasSceneAsset(scene) && !_.isEqual(scene.generationPromptProfileVersion, CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION);
          return promptMissing || pendingPromptProfileOutdated;
        }
        if (!_.isEmpty(getVisualShotPlanIssues(scene, scene))) return true;
        const quickVideoPromptRequired = _.includes([GenerateType.Video, GenerateType.Mixed], config.generateType);
        return quickVideoPromptRequired && _.isEmpty(_.trim(scene.generationPrompt));
      });
      const hasPendingSceneAssets = _.some(existingTargetProj?.storyboard, (scene) => _.isEmpty(scene.assetUrl) && _.isEmpty(scene.assetUrls));
      let shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets || (!isContinuation && (requiresVisualReferenceMigration || requiresPromptPlanningMigration));
      if (config.resumeMode && existingTargetProj) {
        newProjectId = existingTargetProj.id;
        newProj = {
          ...existingTargetProj,
          scriptRewritten: existingTargetProj.scriptRewritten,
          chapters: existingTargetProj.chapters,
          factCheckNotes: existingTargetProj.factCheckNotes,
          storyboard: existingTargetProj.storyboard,
          thumbnails: existingTargetProj.thumbnails,
          seo: existingTargetProj.seo,
          renderedVideoUrl: existingTargetProj.renderedVideoUrl,
          manualReviewItems: existingTargetProj.manualReviewItems,
          generationLogs: _.clone(currentLogs),
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
            subtitleMode: config.subtitleMode,
            filmFormat: config.filmFormat,
            episodeCount: config.episodeCount,
            seriesBibleRequired: _.isEqual(config.filmFormat, SOURCE_TEXT_SERIES),
            planningFallbackProvider: resolvedAiExecution.provider,
            planningChatModel: resolvedAiExecution.model,
            planningExecutionMode: resolvedAiExecution.mode,
            planningChromeHeadless: resolvedAiExecution.chromeHeadless,
          },
          hookConfig: {
            ...existingTargetProj.hookConfig,
            type: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : config.hookStrategy,
            duration: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : config.hookDuration,
            count: isCinematicPipeline ? SecurityConstants.ZERO : existingTargetProj.hookConfig.count,
            positions: isCinematicPipeline ? HookPosition.Start : (config.hookPosition as HookPosition),
            versions: isCinematicPipeline ? [] : existingTargetProj.hookConfig.versions,
          },
          voiceConfig: { ...existingTargetProj.voiceConfig, provider: config.voiceProvider, voiceURI: config.voiceURI, voiceName: config.voiceName, speed: config.voiceSpeed, pitch: config.voicePitch, volume: config.voiceVolume },
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
            referenceImages: preserveExistingList(_.take(_.uniq(_.concat(config.referenceImages || [], config.sceneReferenceImages || [])), SCENE_REFERENCE_CONFIG.MAX_IMAGES), existingTargetProj.visualConfig.referenceImages),
            planningFallbackProvider: resolvedAiExecution.provider,
            planningChatModel: resolvedAiExecution.model,
            planningExecutionMode: resolvedAiExecution.mode,
            planningChromeHeadless: resolvedAiExecution.chromeHeadless,
          },
          generationCheckpoint: { intent: runIntent, phase: SOURCE_TEXT_INITIALIZING, lastSuccessfulPhase: existingTargetProj.generationCheckpoint?.lastSuccessfulPhase, ...getGenerationCheckpointSceneProgress(existingTargetProj), updatedAt: new Date().toISOString() },
        };
        setActiveCreatedProject(newProj);
        appendLog(T.logResumeProject(newProj.name));
      } else {
        const selectedProj = _.defaultTo(selectedAutoProj, config.selectedProjectId ? null : existingTargetProj);
        const isChildProject = selectedProj && selectedProj.parentId;
        newProjectId = selectedProj ? selectedProj.id : _.join([REFACTOR_CONSTANTS.AVG_PROJECT_ID_PREFIX, generateRandomString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        const defaultName = selectedProj ? selectedProj.name : _.trim(config.projectName) || _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        newProj = {
          id: newProjectId,
          allowBulkDeleteImages: true,
          isRecreatingStoryboard: true,
          allowAudioCleanup: true,
          allowReferenceCleanup: true,
          resetDerivedData: true,
          parentId: isChildProject ? selectedProj.parentId : undefined,
          projectKind: selectedProj?.projectKind || (isCinematicPipeline ? ProjectKind.Cinematic : ProjectKind.Auto),
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
            subtitleMode: config.subtitleMode,
            filmFormat: config.filmFormat,
            episodeCount: config.episodeCount,
            seriesBibleRequired: _.isEqual(config.filmFormat, SOURCE_TEXT_SERIES),
            planningFallbackProvider: resolvedAiExecution.provider,
            planningChatModel: resolvedAiExecution.model,
            planningExecutionMode: resolvedAiExecution.mode,
            planningChromeHeadless: resolvedAiExecution.chromeHeadless,
          },
          hookConfig: { type: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : config.hookStrategy, duration: isCinematicPipeline ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : config.hookDuration, count: isCinematicPipeline ? SecurityConstants.ZERO : 3, positions: isCinematicPipeline ? HookPosition.Start : (config.hookPosition as HookPosition), versions: [] },
          voiceConfig: { provider: config.voiceProvider, audioType: AudioType.TTS, gender: Gender.Male, age: AgeGroup.Adult, emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL, speed: config.voiceSpeed, pitch: config.voicePitch, volume: config.voiceVolume, voiceURI: config.voiceURI, voiceName: config.voiceName },
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
            planningFallbackProvider: resolvedAiExecution.provider,
            planningChatModel: resolvedAiExecution.model,
            planningExecutionMode: resolvedAiExecution.mode,
            planningChromeHeadless: resolvedAiExecution.chromeHeadless,
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
          generationDiagnostics: [],
          generationCheckpoint: { intent: runIntent, phase: SOURCE_TEXT_INITIALIZING, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [], updatedAt: new Date().toISOString() },
        };
      }
      const referenceGroups: Array<[string, string[]]> = await Promise.all(
        _.map(
          [
            { group: SOURCE_TEXT_STYLE, images: config.referenceImages, configKey: SOURCE_TEXT_STYLEREFERENCEIMAGES },
            { group: SOURCE_TEXT_SCENE, images: config.sceneReferenceImages, configKey: SOURCE_TEXT_SCENEREFERENCEIMAGES },
            { group: SOURCE_TEXT_THUMBNAIL, images: config.thumbnailReferenceImages, configKey: SOURCE_TEXT_THUMBNAILREFERENCEIMAGES },
            { group: SOURCE_TEXT_THUMBNAILSCENE, images: config.thumbnailSceneReferenceImages, configKey: SOURCE_TEXT_THUMBNAILSCENEREFERENCEIMAGES },
          ],
          async ({ group, images, configKey }): Promise<[string, string[]]> => {
            if (_.isEmpty(images)) return [group, _.defaultTo(_.get(newProj.visualConfig, configKey), [])];
            const response = await pipelineSystemFetch(SOURCE_TEMPLATE_SYMBOL_33(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}`, `${newProjectId}`, `${group}`), { images });
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
      if (_.startsWith(musicAssetUrl, SOURCE_TEXT_DATA)) {
        const audioResponse = await pipelineSystemFetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PIPELINE_REFERENCE_AUDIO}`, `${newProjectId}`), { audio: musicAssetUrl });
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
        const finalProj = { ...proj, activeRunId: isCompleted ? null : pipelineRunLease.runId, lastRunId: isCompleted ? pipelineRunLease.runId : proj.lastRunId, generationLogs: _.clone(currentLogs), updatedAt: new Date().toISOString() };
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
      if (!isContinuation) appendLog(AUTO_GENERATOR_CONSTANTS.LOG_REFERENCE_CLEANUP_SUCCESS);
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
      if (isCinematicPipeline && isScriptCached && !isStoryboardCached) {
        const cachedFilmPackage = newProj.cinematicScriptArtifacts?.filmPackage as Record<string, any> | undefined;
        const cachedScenes = _.castArray(cachedFilmPackage?.scenes || []) as StoryboardScene[];
        if (!_.isEmpty(cachedScenes)) {
          realScenes = prependCinematicIntro(cachedScenes, cachedFilmPackage?.intro, resolveCinematicClipDuration(config.videoDuration));
          isStoryboardCached = true;
          appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
          setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);
        }
      }
      if (isCinematicPipeline && isScriptCached && isStoryboardCached && !_.some(realScenes, (scene) => Boolean(scene.isFilmIntro))) {
        const cachedIntro = _.get(newProj.cinematicScriptArtifacts?.filmPackage, SOURCE_TEXT_INTRO);
        const withIntro = prependCinematicIntro(realScenes, cachedIntro, resolveCinematicClipDuration(config.videoDuration));
        if (withIntro.length !== realScenes.length) {
          realScenes = withIntro;
          appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        }
      }
      const cachedOpening = _.first(smartSplitSentences(realScript)) || realScript;
      const cachedNarrationIsOffTopic = !isCinematicPipeline && isScriptCached && !isHookTopicallyGrounded(cachedOpening, config.scriptContent);
      const cachedNarrationLanguageInvalid = !isCinematicPipeline && isScriptCached && !validateChapterLanguage(realScript, _.isEqual(config.language, ProjectLanguage.VI)).valid;
      const cachedCinematicScriptIssues = isCinematicPipeline && isScriptCached ? getCinematicScriptReadinessIssues(realScript, chapters, newProj.scriptQa, newProj.contentSafety) : [];
      if (cachedNarrationIsOffTopic || cachedNarrationLanguageInvalid || !_.isEmpty(cachedCinematicScriptIssues)) {
        isScriptCached = false;
        isStoryboardCached = false;
        shouldRegenerateSceneAssets = true;
        config.forceRegenerateVoice = true;
        realScript = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        realScenes = [];
        if (!_.isEmpty(cachedCinematicScriptIssues)) appendLog(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_KICH_BAN_BAN_DA_LUU_CHUA(`${_.join(cachedCinematicScriptIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_SCRIPT_THE_SAVED_RESULT_IS_NOT(`${_.join(cachedCinematicScriptIssues, SOURCE_TEXT_SYMBOL_10)}`));
      }
      if (isCinematicPipeline && isContinuation && isStoryboardCached) {
        const cachedExpectedClipCount = Math.max(1, Math.ceil(parseTargetDurationSeconds(config.duration) / resolveCinematicClipDuration(config.videoDuration)));
        const cachedStoryboardIssues = getCinematicStoryboardReadinessIssues(realScenes, cachedExpectedClipCount, newProj.storyboardQa);
        if (!_.isEmpty(cachedStoryboardIssues)) {
          isStoryboardCached = false;
          shouldRegenerateSceneAssets = true;
          realScenes = [];
          appendLog(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_PHAN_CANH_BAN_DA_LUU_CHUA(`${_.join(cachedStoryboardIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_STORYBOARD_THE_SAVED_RESULT_IS_INCOMPLETE(`${_.join(cachedStoryboardIssues, SOURCE_TEXT_SYMBOL_10)}`));
        }
      }
      if (!isScriptCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_WRITE);
        appendLog(T.logScriptRequestDetail(_.size(config.scriptContent), config.inputType));
        const scriptPayload = { projectId: newProjectId, originalInput: config.scriptContent, inputType: config.inputType, config: { ...newProj.config, hookConfig: isCinematicPipeline ? undefined : newProj.hookConfig }, selectedHookText: REFACTOR_CONSTANTS.VD_EMPTY_STRING, bypassCache: !config.resumeMode, pipelineRunId: pipelineArtifactRunId };
        let scriptRes: SystemFetchResult = createSystemFetchFailure(PIPELINE_FETCH_FAILURE_KEY.SCRIPT);
        let scriptData: any;
        let scriptReadinessIssues: string[] = [];
        for (let scriptAttempt = 0; scriptAttempt < (isCinematicPipeline ? PIPELINE_GUARANTEE_CONFIG.SCRIPT_ATTEMPTS : 1); scriptAttempt++) {
          scriptRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_SCRIPT, { ...scriptPayload, bypassCache: scriptAttempt > 0 || scriptPayload.bypassCache }, requestSignal);
          throwIfCancelled();
          scriptData = scriptRes.success && scriptRes.data && !scriptRes.data.error ? scriptRes.data : undefined;
          scriptReadinessIssues = scriptData ? getCinematicScriptReadinessIssues(_.toString(scriptData.rewrittenScript), _.castArray(scriptData.chapters || []) as Chapter[], scriptData.scriptQa, scriptData.contentSafety) : [_.toString(scriptRes.error || SOURCE_TEXT_SCRIPT_REQUEST_FAILED)];
          if (!isCinematicPipeline || _.isEmpty(scriptReadinessIssues)) break;
          if (scriptAttempt < PIPELINE_GUARANTEE_CONFIG.SCRIPT_ATTEMPTS - 1)
            appendLog(
              config.language === ProjectLanguage.VI
                ? SOURCE_TEMPLATE_KICH_BAN_LAN_CHUA_DAT_DANG(`${scriptAttempt + 1}`, `${_.join(scriptReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`)
                : SOURCE_TEMPLATE_SCRIPT_ATTEMPT_IS_INCOMPLETE_RETRYING_ONLY(`${resolvedAiExecution.mode}`, `${resolvedAiExecution.provider}`, `${resolvedAiExecution.model}`, `${scriptAttempt + 1}`, `${_.join(scriptReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`),
            );
        }
        if (isCinematicPipeline && (!scriptData || !_.isEmpty(scriptReadinessIssues))) {
          const scriptError = new Error(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_KICH_BAN_CHUA_DAT_DIEU_KIEN(`${_.join(scriptReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_THE_SCRIPT_DID_NOT_PASS_MANDATORY(`${_.join(scriptReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`));
          _.assign(scriptError, { diagnostic: _.get(scriptRes, SOURCE_TEXT_DATA_DIAGNOSTIC) });
          throw scriptError;
        }
        if (!scriptRes.success || !scriptData || scriptRes.data?.error) {
          throw new Error(scriptRes.error || scriptRes.data?.error || PIPELINE_FETCH_FAILURE_KEY.SCRIPT);
        }
        if (_.isEqual(scriptData.scriptQa?.passed, false)) {
          const hasBlockingScriptIssue = !_.isEmpty(scriptData.scriptQa?.blockingErrors);
          appendLog(isCinematicPipeline && !hasBlockingScriptIssue ? REFACTOR_CONSTANTS.INFO_CINEMATIC_SCRIPT_QA_CONTINUED : isCinematicPipeline ? REFACTOR_CONSTANTS.WARN_CINEMATIC_SCRIPT_QA_CONTINUED : REFACTOR_CONSTANTS.WARN_SCRIPT_QA_CONTINUED);
        }
        realScript = _.trim(_.toString(scriptData.rewrittenScript));
        if (_.isEmpty(realScript)) throw new Error(PIPELINE_FETCH_FAILURE_KEY.SCRIPT);
        chapters = (scriptData.chapters || []) as Chapter[];
        factCheckNotes = scriptData.factCheckNotes || "";
        const filmPackageScenes = isCinematicPipeline ? _.map(_.castArray(scriptData.productionScenes || []) as StoryboardScene[], (scene) => (isContinuation ? scene : clearSceneGeneratedAsset(scene))) : [];
        const filmPackageCharacters = isCinematicPipeline ? (_.castArray(scriptData.characters || []) as CharacterConfig[]) : [];
        if (isCinematicPipeline && !_.isEmpty(filmPackageScenes)) {
          realScenes = _.map(prependCinematicIntro(filmPackageScenes, scriptData.intro, resolveCinematicClipDuration(config.videoDuration)), (scene) => (isContinuation ? scene : clearSceneGeneratedAsset(scene)));
          isStoryboardCached = true;
        }
        const aiHookVersions = _.defaultTo(scriptData.hookVersions, []) as HookVersion[];
        if (_.gt(newProj.hookConfig.count, SecurityConstants.ZERO) && !_.isEqual(aiHookVersions.length, newProj.hookConfig.count)) {
          throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        }
        const hookVersions = _.map(aiHookVersions, (hook, index) => ({ id: _.toString(hook.id), content: _.toString(hook.content), type: _.toString(hook.type), selected: _.isEqual(index, SecurityConstants.ZERO), score: hook.score }));
        if (_.some(hookVersions, (hook) => _.some([hook.id, hook.content, hook.type], (value) => _.isEmpty(_.trim(value))))) {
          throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
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
          cinematicScriptArtifacts: scriptData.cinematicScriptArtifacts || newProj.cinematicScriptArtifacts,
          aiMetrics: _.concat(_.defaultTo(newProj.aiMetrics, []), _.defaultTo(scriptData.aiMetrics, [])),
          contentSafety: scriptData.contentSafety as ContentSafetyReport,
          chapters,
          ...(isCinematicPipeline
            ? {
                storyboard: realScenes as VideoProject["storyboard"],
                storyboardQa: undefined,
                visualConfig: { ...newProj.visualConfig, characters: _.map(filmPackageCharacters, (character) => ({ ...character, images: [], extracted: false })), characterAnalysis: _.toString(scriptData.characterAnalysis), characterPrompt: _.toString(_.get(_.first(filmPackageCharacters), SOURCE_TEXT_PROMPT)), characterConsistency: true },
                visualBible: { ...newProj.visualBible, characterSpecs: _.toString(scriptData.characterSpecs), visualStyle: _.toString(scriptData.visualDirection || newProj.visualBible?.visualStyle), locations: _.defaultTo(newProj.visualBible?.locations, []), props: _.defaultTo(newProj.visualBible?.props, []) },
              }
            : {}),
        };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
      }
      const curatedPreset = resolveStylePreset(config.stylePreset || newProj.visualConfig.style || newProj.visualConfig.referencePrompt);
      let currentStylePreset = curatedPreset.positivePrompt;
      let currentThumbnailStyle = resolveStylePreset(config.thumbnailStylePreset || newProj.visualConfig.thumbnailReferencePrompt || currentStylePreset).positivePrompt;
      const hasStyleReferences = !_.isEmpty(newProj.visualConfig.styleReferenceImages);
      if (!isStoryboardCached || config.forceRegenerateScenes || (!isContinuation && requiresVisualReferenceMigration)) {
        newProj = {
          ...newProj,
          visualConfig: { ...newProj.visualConfig, style: currentStylePreset, referencePrompt: currentStylePreset, thumbnailReferencePrompt: currentThumbnailStyle, negativeStylePrompt: curatedPreset.negativePrompt, styleReferenceLocked: hasStyleReferences },
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
                  textPolicy: SOURCE_TEXT_NO_READABLE_TEXT_UNLESS_THE_CURRENT,
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
      const characterSourceContext = _.join(_.compact([config.scriptContent, _.get(newProj.narrativePlan, SOURCE_TEXT_CENTRALQUESTION), _.get(newProj.narrativePlan, SOURCE_TEXT_VIEWERPROMISE)]), RT_SHARED.SYMBOL_01BA47);
      const hasCharacterGenderConflict = hasSourceGenderConflict(characterSourceContext, analyzedCharacters);
      const cinematicCharacterPromptMissing = isCinematicEpisodeGenre(config.genre) && _.some(analyzedCharacters, (character) => _.isEmpty(character.referenceGenerationPrompt) && _.isEmpty(character.images));
      const shouldAnalyzeCharacters = !isCinematicPipeline && (!isScriptCached || config.forceRegenerateScenes || _.isEmpty(analyzedCharacters) || hasLegacyCharacterProfile || hasStyleContaminatedCharacterProfile || hasCharacterGenderConflict || cinematicCharacterPromptMissing);
      if (shouldAnalyzeCharacters) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_ANALYZE);
        const analyzeCharacterRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, { script: realScript, visualStyle: newProj.visualConfig.referencePrompt || newProj.visualConfig.style || config.stylePreset, sourceContext: characterSourceContext, cinematicMode: isCinematicPipeline, bypassCache: true }, requestSignal);
        throwIfCancelled();
        const rawAnalyzedCharacters: any[] = analyzeCharacterRes.success && _.isArray(analyzeCharacterRes.data?.characters) ? analyzeCharacterRes.data.characters : [];
        if (_.gt(rawAnalyzedCharacters.length, CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS)) {
          throw new Error(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
        }
        const cinematicCharacterIssues = isCinematicPipeline && analyzeCharacterRes.success ? getCinematicCharacterArtifactIssues(analyzeCharacterRes.data) : [];
        if (isCinematicPipeline && (!analyzeCharacterRes.success || !_.isEmpty(cinematicCharacterIssues))) {
          throw new Error(
            config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_AI_CHUA_TRA_DU_HO_SO(`${_.join(cinematicCharacterIssues.length ? cinematicCharacterIssues : [analyzeCharacterRes.error], SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_AI_DID_NOT_RETURN_A_COMPLETE(`${_.join(cinematicCharacterIssues.length ? cinematicCharacterIssues : [analyzeCharacterRes.error], SOURCE_TEXT_SYMBOL_10)}`),
          );
        }
        if (isCinematicPipeline && !_.isEmpty(analyzeCharacterRes.data?.artifactWarnings)) {
          appendLog(PF.CHARACTER_DETECTED);
        }
        if (!isCinematicPipeline && (_.isEmpty(rawAnalyzedCharacters) || !analyzeCharacterRes.success)) {
          throw new Error(analyzeCharacterRes.error || PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
        }
        if (!_.isEmpty(rawAnalyzedCharacters)) {
          const nextCharacterLibrary = _.map(rawAnalyzedCharacters, (character: any): CharacterConfig => ({ ...character, images: [], extracted: false }));
          analyzedCharacters = mergeCharacterReferenceState(newProj.visualConfig.characters, nextCharacterLibrary);
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
                    RT_SHARED.SYMBOL_01BA47,
                  ),
              characterPrompt: _.get(_.first(analyzedCharacters), SOURCE_TEXT_PROMPT, REFACTOR_CONSTANTS.VD_EMPTY_STRING),
              characterImages: preserveExistingList(newProj.visualConfig.characterImages, _.flatMap(analyzedCharacters, SOURCE_TEXT_IMAGES)),
              characterExtracted: Boolean(newProj.visualConfig.characterExtracted || _.some(analyzedCharacters, (character) => !_.isEmpty(character.images))),
              characterConsistency: !_.isEmpty(analyzedCharacters),
            },
            visualBible: {
              ...newProj.visualBible,
              characterSpecs: isCinematicPipeline
                ? _.toString(analyzeCharacterRes.data?.characterSpecs)
                : _.join(
                    _.map(analyzedCharacters, (character) => SOURCE_TEMPLATE_SYMBOL_16(`${character.name}`, `${createCharacterIdentityDescription(character)}`)),
                    RT_SHARED.SYMBOL_01BA47,
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
            _.endsWith(_.toString(config.projectName), SOURCE_TEXT_PHIM_AI),
            _.endsWith(_.toString(newProj.name), SOURCE_TEXT_PHIM_AI),
            isCinematicEpisodeGenre(config.genre),
            _.isEqual(newProj.projectKind, ProjectKind.Cinematic),
            isCinematicEpisodeGenre(newProj.config.genre),
            _.includes([SOURCE_TEXT_SINGLE, SOURCE_TEXT_SERIES] as string[], _.toString(config.filmFormat)),
            _.includes([SOURCE_TEXT_SINGLE, SOURCE_TEXT_SERIES] as string[], _.toString(newProj.config.filmFormat)),
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
          config: { ...newProj.config, ...newProj.voiceConfig, visualStylePreset: newProj.visualConfig.style, aspectRatio: newProj.visualConfig.aspectRatio, imageQuality: newProj.visualConfig.quality, videoDuration: config.videoDuration },
          visualStyle: storyboardStyle,
          referenceImages: _.compact(_.concat(_.castArray(config.referenceImages || []), _.castArray(config.sceneReferenceImages || []), _.castArray(newProj.visualConfig?.styleReferenceImages || []))),
          referenceStyle: storyboardStyle,
          referenceCharacters: jsonUtils.safeStringify(isCinematicPipeline ? _.map(analyzedCharacters, (character) => _.omit(character, [SOURCE_TEXT_IMAGES, SOURCE_TEXT_EXTRACTED])) : _.map(analyzedCharacters, (character) => _.omit(character, [SOURCE_TEXT_IMAGES, SOURCE_TEXT_EXTRACTED]))),
          visualDensity: 5,
          bypassCache: true,
        };
        let storyboardRes: SystemFetchResult = createSystemFetchFailure(PIPELINE_FETCH_FAILURE_KEY.STORYBOARD);
        let storyboardReadinessIssues: string[] = [];
        for (let storyboardAttempt = 0; storyboardAttempt < (isCinematicPipeline ? PIPELINE_GUARANTEE_CONFIG.STORYBOARD_ATTEMPTS : 1); storyboardAttempt++) {
          storyboardRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_STORYBOARD, { ...storyboardPayload, bypassCache: storyboardAttempt > 0 || storyboardPayload.bypassCache }, requestSignal);
          throwIfCancelled();
          const candidateScenes = _.castArray(storyboardRes.data?.scenes || []) as StoryboardScene[];
          storyboardReadinessIssues = storyboardRes.success ? getCinematicStoryboardReadinessIssues(candidateScenes, storyboardPayload.cinematicClipCount || candidateScenes.length, storyboardRes.data?.storyboardQa) : [_.toString(storyboardRes.error || storyboardRes.data?.error || SOURCE_TEXT_STORYBOARD_REQUEST_FAILED)];
          if (!isCinematicPipeline || _.isEmpty(storyboardReadinessIssues)) break;
          if (storyboardAttempt < PIPELINE_GUARANTEE_CONFIG.STORYBOARD_ATTEMPTS - 1)
            appendLog(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_PHAN_CANH_LAN_CHUA_DAT_DANG(`${storyboardAttempt + 1}`, `${_.join(storyboardReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_STORYBOARD_ATTEMPT_IS_INCOMPLETE_RETRYING_ONLY(`${storyboardAttempt + 1}`, `${_.join(storyboardReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`));
        }
        if (isCinematicPipeline && !_.isEmpty(storyboardReadinessIssues)) {
          throw new Error(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_PHAN_CANH_CHUA_DAT_DIEU_KIEN(`${_.join(storyboardReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_THE_STORYBOARD_DID_NOT_PASS_MANDATORY(`${_.join(storyboardReadinessIssues, SOURCE_TEXT_SYMBOL_10)}`));
        }
        const storyboardAvailable = Boolean(storyboardRes.success && storyboardRes.data && !storyboardRes.data.error);
        realScenes = storyboardAvailable ? ((storyboardRes.data.scenes || []) as StoryboardScene[]) : [];
        const generatedVisualBible = storyboardAvailable ? (storyboardRes.data.visualBible as VisualBible) : newProj.visualBible;
        const visualBible: VisualBible = { ...generatedVisualBible, visualStyle: currentStylePreset, styleProfile: newProj.visualBible?.styleProfile, styleFingerprint: newProj.visualConfig.styleFingerprint, styleReferenceLocked: hasStyleReferences, locations: _.defaultTo(generatedVisualBible?.locations, []), props: _.defaultTo(generatedVisualBible?.props, []) };
        if (_.isEmpty(realScenes)) {
          throw new Error(storyboardRes.error || storyboardRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_STORYBOARD_SPLIT);
        }
        if (_.isEmpty(realScenes)) throw new Error(AUTO_GENERATOR_CONSTANTS.ERR_NO_SCENES_CREATED);
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
        newProj = { ...newProj, audioCueSheet: applyOptionalMusicAsset(newProj.audioCueSheet, config.musicAssetUrl) };
      }
      const referenceContinuityReport = validateVisualContinuity(realScenes, analyzedCharacters, newProj.visualBible);
      if (!isCinematicPipeline && !referenceContinuityReport.passed) appendLog(_.join(referenceContinuityReport.blockingErrors, REFACTOR_CONSTANTS.VD_BLANK));
      let globalAudioBase64: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let globalAudioUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      const nativeFilmAudio = isCinematicPipeline;
      let isVoiceCached = nativeFilmAudio;
      const genreVoiceArc = nativeFilmAudio ? undefined : resolveGenreVoiceArc(config.genre);
      if (!nativeFilmAudio && config.resumeMode && isScriptCached && !config.forceRegenerateVoice && !invalidationState.regenerateVoice) {
        const cachedVoiceAudio = await fetchCachedVoiceAudio(newProj.voiceConfig);
        if (cachedVoiceAudio.isCached) {
          globalAudioBase64 = cachedVoiceAudio.audioBase64;
          globalAudioUrl = cachedVoiceAudio.audioUrl;
          isVoiceCached = true;
          appendLog(T.logResumeVoice);
          appendLog(T.logVoiceResultDetail(!_.isEmpty(globalAudioUrl) ? SOURCE_TEXT_AUDIO_URL : SOURCE_TEXT_BASE64));
          setStepProgress(REFACTOR_CONSTANTS.AUTO_PROGRESS_VOICE_COMPLETE);
        }
      }
      let voiceUpdatedProj = newProj;
      if (!isVoiceCached) {
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.VOICE_START);
        setCurrentStepIndex(2);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_GEN_TTS.replace(SecurityConstants.PLACEHOLDER_0, config.voiceName || PF.VOICE_DEFAULT_LABEL));
        appendLog(T.logVoiceRequestDetail(config.voiceProvider, config.voiceName, _.size(realScript)));
        const activeVoiceArc = genreVoiceArc || resolveGenreVoiceArc(config.genre);
        const directedVoice = await generateDirectedVoice({
          text: realScript,
          voiceArc: activeVoiceArc,
          basePayload: { text: realScript, voiceURI: config.voiceURI, voice_id: config.voiceURI, provider: config.voiceProvider, speed: config.voiceSpeed, pitch: config.voicePitch, volume: config.voiceVolume, gender: Gender.Male, age: AgeGroup.Adult, emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL },
          signal: requestSignal,
        });
        throwIfCancelled();
        globalAudioBase64 = directedVoice.audioBase64;
        globalAudioUrl = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_TTS_SUCCESS);
        appendLog(T.logVoiceResultDetail(!_.isEmpty(globalAudioUrl) ? SOURCE_TEXT_AUDIO_URL : SOURCE_TEXT_BASE64));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.VOICE_DONE);
        voiceUpdatedProj = { ...newProj, storyboard: realScenes as VideoProject["storyboard"], voiceConfig: { ...newProj.voiceConfig, audioType: AudioType.TTS, provider: directedVoice.provider || config.voiceProvider, audioBase64: globalAudioBase64, audioUrl: globalAudioUrl, voiceArc: activeVoiceArc } as VoiceConfig };
        await syncProject(voiceUpdatedProj);
      } else {
        voiceUpdatedProj = { ...newProj, storyboard: realScenes as VideoProject["storyboard"], voiceConfig: { ...newProj.voiceConfig, audioBase64: globalAudioBase64, audioUrl: globalAudioUrl } as VoiceConfig };
      }
      const hasGlobalNarration = !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl);
      const hasCachedAlignment = config.resumeMode && isScriptCached && !config.forceRegenerateVoice && hasCompleteSceneAlignment(realScenes as StoryboardScene[], hasGlobalNarration);
      let alignmentCompleted = hasCachedAlignment;
      const alignmentRequest =
        globalAudioBase64 && !hasCachedAlignment
          ? (() => {
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_START);
              appendLog(T.logAlignmentPlan(_.size(realScenes)));
              return alignVoiceTimeline({ audioBase64: globalAudioBase64, scenes: realScenes as StoryboardScene[], projectId: newProj?.id, projectName: newProj?.name, signal: requestSignal });
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
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_ERROR + getErrorMessage(audioError, REFACTOR_CONSTANTS.VD_EMPTY_STRING));
          appendLog(AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
        }
      }
      appendLog(T.logReferenceSummary(_.size(config.referenceImages), _.size(config.sceneReferenceImages), SecurityConstants.ZERO, isCinematicPipeline));
      if (isCinematicEpisodeGenre(config.genre)) setCurrentStepIndex(2);
      if (isCinematicPipeline) {
        if (_.lte(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.SCRIPT)) {
          appendCinematicLog(cinematicProgressMessages.SCRIPT_READY, CINEMATIC_PROGRESS_STAGE.SCRIPT);
        }
        if (_.lte(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.PROMPT)) {
          appendCinematicLog(cinematicProgressMessages.PROMPT_START, CINEMATIC_PROGRESS_STAGE.PROMPT);
        }
      }
      const requiresCinematicPlanRepair = isCinematicEpisodeGenre(config.genre) ? !_.isEmpty(getBlockingCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language)) : false;
      if (!isStoryboardCached || config.forceRegenerateScenes || requiresCinematicPlanRepair || (isContinuation && !_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY) && hasPendingSceneAssets && requiresPromptPlanningMigration) || (!isContinuation && (shouldRegenerateSceneAssets || didAnalyzeCharacters || requiresVisualReferenceMigration || requiresPromptPlanningMigration))) {
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
            characterImages: preserveExistingList(voiceUpdatedProj.visualConfig.characterImages, _.flatMap(analyzedCharacters, SOURCE_TEXT_IMAGES)),
            characterExtracted: Boolean(voiceUpdatedProj.visualConfig.characterExtracted || _.some(analyzedCharacters, (character) => !_.isEmpty(character.images))),
            characterConsistency: !_.isEmpty(analyzedCharacters),
          },
        };
        await syncProject(voiceUpdatedProj);
        appendLog(isCinematicEpisodeGenre(config.genre) ? PF.STEP_DIRECTING_CINEMATIC_PROMPTS : PF.STEP_EDITING_IMAGE_PROMPTS);
        const optimizePayload = {
          visualConfig: voiceUpdatedProj.visualConfig,
          visualBible: voiceUpdatedProj.visualBible,
          aspectRatio: config.aspectRatio,
          language: config.language,
          genre: config.genre,
          promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION,
          cinematicVideoPromptProfileVersion: CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION,
          bypassCache: true,
          projectId: newProjectId,
          planningFallbackProvider: resolvedAiExecution.provider,
          planningChatModel: resolvedAiExecution.model,
          planningExecutionMode: resolvedAiExecution.mode,
          planningChromeHeadless: resolvedAiExecution.chromeHeadless,
          chromeHeadless: config.chromeHeadless,
          pipelineRunId: pipelineArtifactRunId,
          pipelineStartedAt,
          keepPlanningRoomOpen: true,
        };
        let optimizeRes: Awaited<ReturnType<typeof safeSystemFetch>>;
        if (isCinematicEpisodeGenre(config.genre)) {
          const planningMasterStoryboard = _.cloneDeep(realScenes);
          const shouldReuseCompletedPlans = isContinuation && !config.forceRegenerateScenes;
          const scenesToPlan = shouldReuseCompletedPlans
            ? _.filter(realScenes, (scene) => (!scene.isFilmIntro || _.isEmpty(_.trim(scene.generationPrompt))) && (_.isEmpty(_.trim(scene.generationPrompt)) || (!hasSceneAsset(scene) && !_.isEqual(scene.generationPromptProfileVersion, CINEMATIC_VIDEO_PROMPT_PROFILE_VERSION))))
            : _.filter(realScenes, (scene) => !scene.isFilmIntro || _.isEmpty(_.trim(scene.generationPrompt)));
          const planningBatches = createCinematicPlanningBatches(scenesToPlan);
          const plannedById = new Map(_.map(realScenes, (scene) => [scene.id, scene]));
          const planningWarnings: string[] = [];
          const planningFailures: Array<Awaited<ReturnType<typeof safeSystemFetch>>> = [];
          let completedSceneCount = 0;
          let checkpointChain = Promise.resolve();
          const checkpointPlanningState = async (phase: string = SOURCE_TEXT_PROMPT_PLANNING) => {
            realScenes = _.map(realScenes, (scene) => plannedById.get(scene.id) || scene);
            latestCheckpointStoryboard = _.cloneDeep(realScenes);
            const completedSceneIds = _.map(
              _.filter(realScenes, (scene) => !_.isEmpty(_.trim(scene.generationPrompt))),
              SOURCE_TEXT_ID,
            );
            const pendingSceneIds = _.difference(_.map(scenesToPlan, SOURCE_TEXT_ID), completedSceneIds);
            const checkpointProject = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], generationCheckpoint: { intent: runIntent, phase, lastSuccessfulPhase: _.isEmpty(pendingSceneIds) ? SOURCE_TEXT_PROMPT_PLANNING : SOURCE_TEXT_STORYBOARD, completedSceneIds, pendingSceneIds, failedSceneIds: [], updatedAt: new Date().toISOString() } };
            voiceUpdatedProj = checkpointProject;
            checkpointChain = checkpointChain.then(async () => {
              await syncProject(checkpointProject);
            });
            await checkpointChain;
          };
          const checkpointCompletedScenes = async (completedScenes: StoryboardScene[]) => {
            if (_.isEmpty(completedScenes)) return;
            _.forEach(completedScenes, (scene) => plannedById.set(scene.id, scene));
            completedSceneCount = _.add(completedSceneCount, completedScenes.length);
            await checkpointPlanningState();
            const completedPromptCount = _.size(_.filter(realScenes, (scene) => !_.isEmpty(_.trim(scene.generationPrompt))));
            appendCinematicLog(_.replace(_.replace(cinematicProgressMessages.PROMPT_PROGRESS, SecurityConstants.PLACEHOLDER_0, _.toString(completedPromptCount)), SecurityConstants.PLACEHOLDER_1, _.toString(realScenes.length)), CINEMATIC_PROGRESS_STAGE.PROMPT);
          };
          const processPlanningBatch = async (batchIndex: number) => {
            throwIfCancelled();
            const planningBatch = planningBatches[batchIndex];
            let batchResponse: Awaited<ReturnType<typeof safeSystemFetch>> = { success: false, error: CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED };
            let pendingPlanningScenes = planningBatch;
            const applyPlanningResponse = async (requestedScenes: StoryboardScene[], response: Awaited<ReturnType<typeof safeSystemFetch>>): Promise<StoryboardScene[]> => {
              const responseScenes = _.castArray(response.data?.storyboard || []) as StoryboardScene[];
              if (_.isEmpty(responseScenes)) return requestedScenes;
              const responsePlanningIssues = _.castArray(response.data?.planningIssues || []);
              const partition = partitionCinematicPlanningResponse(requestedScenes, responseScenes, responsePlanningIssues);
              await checkpointCompletedScenes(partition.completedScenes);
              planningWarnings.push(..._.castArray(response.data?.planningWarnings || []));
              return partition.unresolvedScenes;
            };
            for (let attempt = 0; attempt < CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS; attempt++) {
              const planningWorkerId = CINEMATIC_ROOM_STAGE.PROMPT;
              const attemptTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_BATCH_ATTEMPT : CINEMATIC_PLANNING_MESSAGES.EN_BATCH_ATTEMPT;
              appendLog(
                attemptTemplate
                  .replace(SecurityConstants.PLACEHOLDER_0, planningWorkerId)
                  .replace(SecurityConstants.PLACEHOLDER_1, formatSceneList(pendingPlanningScenes, config.language))
                  .replace(SecurityConstants.PLACEHOLDER_2, _.toString(attempt + 1))
                  .replace(SecurityConstants.PLACEHOLDER_3, _.toString(CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS)),
              );
              await checkpointPlanningState();
              const latestPlanningMasterStoryboard = _.map(planningMasterStoryboard, (scene) => plannedById.get(scene.id) || scene);
              const firstPendingSceneIndex = _.findIndex(latestPlanningMasterStoryboard, { id: _.first(pendingPlanningScenes)?.id });
              const planningPreviousScene = _.gt(firstPendingSceneIndex, 0) ? latestPlanningMasterStoryboard[firstPendingSceneIndex - 1] : undefined;
              batchResponse = await pipelineSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, { ...optimizePayload, storyboard: pendingPlanningScenes, planningMasterStoryboard: latestPlanningMasterStoryboard, planningPreviousScene, planningAttempt: attempt + 1, planningWorkerId }, requestSignal);
              pendingPlanningScenes = await applyPlanningResponse(pendingPlanningScenes, batchResponse);
              if (_.isEmpty(pendingPlanningScenes)) {
                const batchLockedTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_BATCH_LOCKED : CINEMATIC_PLANNING_MESSAGES.EN_BATCH_LOCKED;
                appendLog(
                  batchLockedTemplate
                    .replace(SecurityConstants.PLACEHOLDER_0, _.toString(_.size(planningBatch)))
                    .replace(SecurityConstants.PLACEHOLDER_1, _.toString(completedSceneCount))
                    .replace(SecurityConstants.PLACEHOLDER_2, _.toString(scenesToPlan.length)),
                );
                await checkpointPlanningState();
                return;
              }
              if (attempt < CINEMATIC_POLICY_CONFIG.CLIENT_PLANNING_ATTEMPTS - 1) {
                const pendingSceneIds = _.map(pendingPlanningScenes, SOURCE_TEXT_ID);
                const retryTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_BATCH_RETRY : CINEMATIC_PLANNING_MESSAGES.EN_BATCH_RETRY;
                appendLog(retryTemplate.replace(SecurityConstants.PLACEHOLDER_0, planningWorkerId).replace(SecurityConstants.PLACEHOLDER_1, formatSceneList(pendingSceneIds, config.language)));
                await checkpointPlanningState();
              }
            }
            throwIfCancelled();
            const recoveryFailedTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_SCENE_RECOVERY_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_SCENE_RECOVERY_FAILED;
            appendLog(recoveryFailedTemplate.replace(SecurityConstants.PLACEHOLDER_0, formatSceneList(pendingPlanningScenes, config.language)));
            const responsePlanningIssues = _.castArray(batchResponse.data?.planningIssues || []);
            const recoveryIssues = _.isEmpty(responsePlanningIssues) ? [SOURCE_TEMPLATE_SYMBOL_8(`${CINEMATIC_PLANNING_MESSAGES.ROOM_RESPONSE_ISSUE}`, `${_.toString(batchResponse.data?.diagnostic || batchResponse.error || CINEMATIC_PLANNING_MESSAGES.INCOMPLETE_AFTER_RETRIES_ISSUE)}`)] : responsePlanningIssues;
            await checkpointPlanningState(SOURCE_TEXT_PROMPT_PLANNING_FAILED);
            planningFailures.push({ ...batchResponse, success: false, data: { ..._.defaultTo(batchResponse.data, {}), storyboard: realScenes, planningIssues: _.uniq(recoveryIssues) } });
          };
          optimizeRes = { success: true, data: { storyboard: realScenes, planningWarnings } };
          appendLog(PF.formatDirectorWritingPrompts(scenesToPlan.length));
          await checkpointPlanningState();
          for (let batchIndex = 0; batchIndex < planningBatches.length; batchIndex++) await processPlanningBatch(batchIndex);
          await checkpointChain;
          if (!_.isEmpty(planningFailures)) {
            const firstFailure = _.first(planningFailures)!;
            const allPlanningIssues = _.uniq(_.flatMap(planningFailures, (failure) => _.castArray(failure.data?.planningIssues || [])));
            optimizeRes = { ...firstFailure, success: false, data: { ..._.defaultTo(firstFailure.data, {}), storyboard: realScenes, planningIssues: allPlanningIssues } };
            await checkpointPlanningState(SOURCE_TEXT_PROMPT_PLANNING_FAILED);
          }
          if (optimizeRes.success) {
            optimizeRes = { success: true, data: { storyboard: realScenes, planningWarnings: _.uniq(planningWarnings) } };
            await checkpointPlanningState(SOURCE_TEXT_PROMPT_PLANNING_COMPLETED);
          }
        } else {
          optimizeRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, { ...optimizePayload, storyboard: realScenes }, requestSignal);
        }
        if (!isCinematicEpisodeGenre(config.genre) && !optimizeRes.success) {
          appendLog(PF.LOG_IMAGE_EDITOR_RETRY);
          optimizeRes = await pipelineSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, { ...optimizePayload, storyboard: realScenes }, requestSignal);
        }
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          const styleIdentityChanged = !_.isEqual(currentStylePreset, existingTargetProj?.visualConfig?.style);
          shouldRegenerateSceneAssets = shouldRegenerateSceneAssets || (!isContinuation && (requiresVisualReferenceMigration || didAnalyzeCharacters || styleIdentityChanged));
          appendLog(isCinematicEpisodeGenre(config.genre) ? PF.formatDirectorCompleted(realScenes.length) : PF.formatImageEditorCompleted(realScenes.length));
          if (isCinematicEpisodeGenre(config.genre) && !_.isEmpty(optimizeRes.data?.planningWarnings)) {
            appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_ADVISORY : CINEMATIC_PLANNING_MESSAGES.EN_ADVISORY);
          } else if (!isCinematicEpisodeGenre(config.genre) && !optimizeRes.data?.promptQa?.passed) {
            appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
          }
        } else if (!isCinematicEpisodeGenre(config.genre)) {
          appendLog(REFACTOR_CONSTANTS.WARN_IMAGE_PROMPT_QA_CONTINUED);
        }
        if (isCinematicEpisodeGenre(config.genre)) {
          const finalPlanIssues = getBlockingCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language);
          if (!optimizeRes.success || _.isEmpty(realScenes)) {
            const planningIssues = _.take(_.castArray(optimizeRes.data?.planningIssues || []), CINEMATIC_PLANNING_MESSAGES.ISSUE_DISPLAY_LIMIT);
            const baseMessage = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED : CINEMATIC_PLANNING_MESSAGES.EN_REQUIRED;
            const detailTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_REQUIRED_DETAIL : CINEMATIC_PLANNING_MESSAGES.EN_REQUIRED_DETAIL;
            const detailMessage = _.isEmpty(planningIssues) ? "" : detailTemplate.replace(SecurityConstants.PLACEHOLDER_0, _.join(planningIssues, SOURCE_TEXT_SYMBOL_10));
            throw new Error(_.join(_.compact([baseMessage, detailMessage]), RT_SHARED.SYMBOL_36A9E7));
          }
          if (!_.isEmpty(finalPlanIssues)) {
            throw new Error(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_KE_HOACH_MO_TA_CANH_CHUA(`${_.join(_.take(finalPlanIssues, 12), SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_THE_PROMPT_PLAN_IS_STILL_INVALID(`${_.join(_.take(finalPlanIssues, 12), SOURCE_TEXT_SYMBOL_10)}`));
          }
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle = createThumbnailStyleDirective(voiceUpdatedProj.visualBible?.styleProfile, voiceUpdatedProj.visualConfig?.thumbnailStyleProfile) || voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || config.thumbnailStylePreset;
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const clipDurationSeconds = resolveCinematicClipDuration(config.videoDuration);
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({ ...scene, duration: clipDurationSeconds }));
        const contentScenes = _.reject(realScenes as StoryboardScene[], (scene) => Boolean(scene.isFilmIntro));
        const targetClipCount = _.max([1, Math.ceil(parseTargetDurationSeconds(config.duration) / clipDurationSeconds)]) || 1;
        appendLog((config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_STORY_PLAN_READY : CINEMATIC_PLANNING_MESSAGES.EN_STORY_PLAN_READY).replace(SecurityConstants.PLACEHOLDER_0, _.toString(contentScenes.length)).replace(SecurityConstants.PLACEHOLDER_1, _.toString(clipDurationSeconds)));
        if (!_.isEqual(contentScenes.length, targetClipCount)) {
          appendLog((config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_STORY_PLAN_COUNT_NOTE : CINEMATIC_PLANNING_MESSAGES.EN_STORY_PLAN_COUNT_NOTE).replace(SecurityConstants.PLACEHOLDER_0, _.toString(contentScenes.length)).replace(SecurityConstants.PLACEHOLDER_1, _.toString(targetClipCount)));
        }
      }
      let imagePromptQa: ImagePromptQualityReport | undefined;
      if (!isCinematicEpisodeGenre(config.genre)) {
        imagePromptQa = evaluateImagePrompts(realScenes as StoryboardScene[], { backgroundMode: config.styleBackgroundMode, textMode: config.styleTextInImageMode, targetStyle: currentStylePreset, characters: voiceUpdatedProj.visualConfig.characters, visualBible: voiceUpdatedProj.visualBible }) as ImagePromptQualityReport;
      }
      voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], imagePromptQa };
      await syncProject(voiceUpdatedProj);
      const productionVisualConfig = applyCinematicProductionPolicy({ ...voiceUpdatedProj.visualConfig, generationMode: config.generationMode, imageGeneratorEngine: config.imageGeneratorEngine, generateType: config.generateType, maxVideoScenes: config.maxVideoScenes, videoDuration: config.videoDuration, videoResolution: config.videoResolution }, config.genre, realScenes.length);
      const resolvedVisualConfig = resolveVisualConfig(productionVisualConfig, isCinematicEpisodeGenre(config.genre));
      if (resolvedVisualConfig.blocked) throw new Error(REFACTOR_CONSTANTS.ERR_VISUAL_CONFIG_BLOCKED);
      const executionVisualConfig = resolvedVisualConfig.config;
      if (isCinematicEpisodeGenre(config.genre)) {
        const cinematicContractIssues = getBlockingCinematicStoryboardContractIssues(realScenes as StoryboardScene[], config.videoDuration, config.language);
        if (!_.isEmpty(cinematicContractIssues)) {
          throw new Error(PF.formatAiFilmShootingPlanFailed(_.slice(cinematicContractIssues, 0, 6).join(SOURCE_TEXT_SYMBOL_10)));
        }
        appendLog(PF.formatAiFilmFullVideoMode(realScenes.length));
      }
      if (isCinematicPipeline) {
        if (_.lte(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.PROMPT)) {
          appendCinematicLog(cinematicProgressMessages.PROMPT_READY, CINEMATIC_PROGRESS_STAGE.PROMPT);
        }
        if (_.lte(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.THUMBNAIL)) {
          appendCinematicLog(cinematicProgressMessages.THUMBNAIL_START, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
        }
      }
      voiceUpdatedProj = { ...voiceUpdatedProj, visualConfig: executionVisualConfig };
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_PREPARE);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_START);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat) ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      const mediaTypeLabel = executionVisualConfig.generateType === GenerateType.Video ? PF.MEDIA_TYPE_VIDEO : executionVisualConfig.generateType === GenerateType.Mixed ? PF.MEDIA_TYPE_MIXED : PF.MEDIA_TYPE_IMAGE;
      appendLog(PF.formatPreparingSceneMedia(mediaTypeLabel, modeName, config.aspectRatio));
      const visualConfigPayload = {
        ...executionVisualConfig,
        aspectRatio: config.aspectRatio,
        chromeHeadless: config.chromeHeadless,
        geminiChatSpeed: config.geminiChatSpeed,
        style: currentStylePreset,
        qualityMode: _.defaultTo(voiceUpdatedProj.visualConfig.qualityMode, QualityMode.Balanced),
        generateCount: isCinematicEpisodeGenre(config.genre) ? SecurityConstants.DEFAULT_AMOUNT : resolveQualityProfile(voiceUpdatedProj.visualConfig.qualityMode).draftCandidates,
        styleReferenceImages: [],
        sceneReferenceImages: [],
        referenceImages: [],
        referenceImageNames: [],
        referenceCharacterNames: [],
        thumbnailReferenceImages: [],
        thumbnailSceneReferenceImages: [],
        contentLanguage: config.language,
        preserveVideoAudio: isCinematicEpisodeGenre(config.genre),
        preserveAiPromptText: isCinematicPipeline,
      };
      const thumbnailVisualConfigPayload = isCinematicEpisodeGenre(config.genre) ? { ...visualConfigPayload, generationMode: ImageGenerationMode.GeminiChat, imageGeneratorEngine: ImageGeneratorEngine.LabsSandbox, generateType: GenerateType.Image } : visualConfigPayload;
      const resolvedThumbnailReferenceImages = resolveThumbnailReferenceImages(voiceUpdatedProj.visualConfig);
      const sandboxConfigPayload = { localProjectId: voiceUpdatedProj.id, flowProjectId: voiceUpdatedProj.visualConfig?.flowProjectId };
      const authoritativeCinematicStoryMaterial = isCinematicPipeline
        ? jsonUtils.safeStringify({ creativeBrief: voiceUpdatedProj.creativeBrief, filmPackage: voiceUpdatedProj.cinematicScriptArtifacts?.filmPackage, scenes: _.map(voiceUpdatedProj.storyboard, (scene) => ({ id: scene.id, narrativeRole: scene.narrativeRole, storyChange: scene.storyChange, script: scene.script, subtitle: scene.subtitle, characterIds: scene.characterIds })) })
        : realScript;
      const isVideoStageContinuation = isCinematicPipeline && isContinuation && _.isEqual(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.VIDEO);
      const cachedSeoData = isContinuation && newProj.seo ? newProj.seo : null;
      const seoRequest =
        cachedSeoData || isVideoStageContinuation
          ? null
          : _.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY)
            ? null
            : () => {
                appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_OPTIMIZE);
                return pipelineSystemFetch(API_ROUTES.PIPELINE_SEO, { originalInput: config.scriptContent, config: voiceUpdatedProj.config, seoConfig: voiceUpdatedProj.seoConfig, rewrittenScript: authoritativeCinematicStoryMaterial, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.THUMBNAIL, projectId: newProjectId, pipelineRunId: pipelineArtifactRunId }, requestSignal);
              };
      const existingCinematicThumbnailContractIssues = isCinematicPipeline && !_.isEmpty(voiceUpdatedProj.thumbnails) ? getThumbnailTechnicalPlanningIssues(voiceUpdatedProj.thumbnails!, config.thumbnailCount, config.thumbnailTextInImageMode) : [];
      const shouldRegenerateThumbnails = !_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY) && (Boolean(config.forceRegenerateScenes) || invalidationState.regenerateThumbnails || !_.isEmpty(existingCinematicThumbnailContractIssues));
      const reusableThumbnails = config.resumeMode && !shouldRegenerateThumbnails ? _.defaultTo(newProj.thumbnails, []) : [];
      const hasReusableThumbnailAssets = !_.isEmpty(reusableThumbnails) && _.every(reusableThumbnails, (thumb) => !_.isEmpty(thumb.imageUrl));
      const shouldPlanThumbnails = !isVideoStageContinuation && !_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY) && !hasReusableThumbnailAssets && _.some([_.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat), isCinematicEpisodeGenre(config.genre)], Boolean);
      const thumbnailPlanRequest = shouldPlanThumbnails
        ? () => {
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
            return pipelineSystemFetch(
              API_ROUTES.PIPELINE_THUMBNAILS,
              { rewrittenScript: authoritativeCinematicStoryMaterial, config: voiceUpdatedProj.config, visualConfig: { ...voiceUpdatedProj.visualConfig, thumbnailReferencePrompt: currentThumbnailStyle }, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.THUMBNAIL, projectId: newProjectId, pipelineRunId: pipelineArtifactRunId },
              requestSignal,
            );
          }
        : null;
      let preparedSeoData: unknown = cachedSeoData || newProj.seo;
      const thumbnailPlanningAttempted = Boolean(thumbnailPlanRequest);
      const preparedThumbnailPlan = thumbnailPlanRequest ? await thumbnailPlanRequest() : null;
      const seoRes = seoRequest ? await seoRequest() : null;
      if (!preparedSeoData && seoRes) {
        preparedSeoData = seoRes.success && seoRes.data ? seoRes.data : undefined;
      }
      if (seoRes?.success && preparedSeoData) {
        voiceUpdatedProj = await syncProject({ ...voiceUpdatedProj, seo: preparedSeoData as VideoProject["seo"] });
      }
      const visualDependencies = { ..._.pick(voiceUpdatedProj.visualConfig, [SOURCE_TEXT_STYLE, SOURCE_TEXT_STYLEPRESET, SOURCE_TEXT_IMAGEGENERATORENGINE, SOURCE_TEXT_ASPECTRATIO, SOURCE_TEXT_STYLEBACKGROUNDMODE, SOURCE_TEXT_STYLETEXTINIMAGEMODE, SOURCE_TEXT_IMAGEFOCUSMODE, SOURCE_TEXT_GENERATETYPE]), promptPipelineVersion: IMAGE_PROMPT_PIPELINE_VERSION };
      const previousScenes = _.keyBy(_.defaultTo(existingTargetProj?.storyboard, []), SOURCE_TEXT_ID);
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
        return true;
      });
      const targetSceneIds = new Set(_.map(targetScenesToGen, SOURCE_TEXT_ID));
      if (_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY) && !_.isEmpty(targetScenesToGen)) {
        throw new Error(PF.ERROR_MISSING_SCENE_MEDIA);
      }
      _.forEach(targetScenesToGen, (scene) => {
        scene.assetStatus = SceneAssetStatus.Generating;
        scene.assetError = undefined;
      });
      appendLog(T.logMediaPlan(_.size(targetScenesToGen), _.subtract(_.size(realScenes), _.size(targetScenesToGen)), executionVisualConfig.generateType));
      const existingVideoCount = _.size(_.filter(realScenes as VideoProject["storyboard"], (scene) => _.isEqual(scene.assetType, GenerateType.Video) && hasSceneAsset(scene)));
      const remainingVideoSlots = _.max([_.subtract(_.defaultTo(executionVisualConfig.maxVideoScenes, SecurityConstants.ZERO), existingVideoCount), SecurityConstants.ZERO])!;
      const videoSceneIds = await selectVideoSceneIds(
        _.filter(targetScenesToGen, (scene) => !_.isEqual(scene.assetStrategy, SOURCE_TEXT_ARCHIVAL)),
        executionVisualConfig.generateType,
        remainingVideoSlots,
      );
      let unifiedBatchThumbnails: ThumbnailItem[] | null = null;
      let unifiedThumbnailItems: Array<{ sceneId: string; prompt: string; generateType: GenerateType.Image; referenceImages: string[]; referenceImageNames?: string[]; continuityKey: string; idempotencyKey: string }> = [];
      if (!_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY) && _.some([_.isEqual(executionVisualConfig.generationMode, ImageGenerationMode.GeminiChat), isCinematicEpisodeGenre(config.genre)], Boolean)) {
        if (!_.isEmpty(reusableThumbnails) && _.every(reusableThumbnails, (thumb) => !_.isEmpty(thumb.imageUrl))) {
          unifiedBatchThumbnails = _.cloneDeep(reusableThumbnails);
          appendLog(T.logResumeThumbnails);
        } else {
          const thumbnailPlan = preparedThumbnailPlan;
          unifiedBatchThumbnails = thumbnailPlan?.success && _.isArray(thumbnailPlan.data?.thumbnails) ? thumbnailPlan.data.thumbnails : [];
          unifiedThumbnailItems = _.map(
            _.filter(unifiedBatchThumbnails, (thumb) => _.isEmpty(thumb.imageUrl)),
            (thumb) => {
              const thumbnailStyle = _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
              const generationPrompt = resolveThumbnailGenerationPrompt(thumb, isCinematicPipeline, thumbnailStyle, config.aspectRatio, !_.isEmpty(resolvedThumbnailReferenceImages), voiceUpdatedProj.visualConfig.characters);
              thumb.generationPrompt = generationPrompt;
              return { sceneId: thumb.id, idempotencyKey: _.join([voiceUpdatedProj.id, SOURCE_TEXT_THUMBNAIL, thumb.id], SOURCE_TEXT_SYMBOL_16), prompt: generationPrompt, generateType: GenerateType.Image, referenceImages: resolvedThumbnailReferenceImages, continuityKey: createThumbnailContinuityKey() };
            },
          );
        }
      }
      realScenes = removeRedundantSceneAudioBase64(realScenes, hasGlobalNarration);
      targetScenesToGen = _.map(targetScenesToGen, (targetScene) => _.find(realScenes as StoryboardScene[], { id: targetScene.id }) || targetScene);
      voiceUpdatedProj = { ...voiceUpdatedProj, seo: preparedSeoData as VideoProject["seo"], storyboard: realScenes as VideoProject["storyboard"], thumbnails: unifiedBatchThumbnails || voiceUpdatedProj.thumbnails };
      voiceUpdatedProj = await syncProject(voiceUpdatedProj);
      if (config.resumeMode && !shouldRegenerateSceneAssets) {
        _.forEach((realScenes as VideoProject["storyboard"])!, (sc, idx) => {
          if (hasSceneAsset(sc)) {
            appendLog(T.logResumeSceneSkip(idx + 1, realScenes.length, sc.assetType === GenerateType.Video ? SOURCE_TEXT_VIDEO_2 : SOURCE_TEXT_IMAGE));
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
        const completedSceneIds = _.map(_.filter(realScenes, hasSceneAsset), SOURCE_TEXT_ID);
        const pendingSceneIds = _.map(_.reject(realScenes, hasSceneAsset), SOURCE_TEXT_ID);
        const checkpointProject = {
          ...voiceUpdatedProj,
          storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"],
          thumbnails: _.cloneDeep(unifiedBatchThumbnails || voiceUpdatedProj.thumbnails),
          generationCheckpoint: {
            intent: runIntent,
            phase: _.isEmpty(pendingSceneIds) ? SOURCE_TEXT_MEDIA_COMPLETED : SOURCE_TEXT_MEDIA_GENERATION,
            lastSuccessfulPhase: _.isEmpty(pendingSceneIds) ? SOURCE_TEXT_MEDIA : voiceUpdatedProj.generationCheckpoint?.lastSuccessfulPhase,
            completedSceneIds,
            pendingSceneIds,
            failedSceneIds: _.map(
              _.filter(realScenes, (scene) => !_.isEmpty(scene.assetError)),
              SOURCE_TEXT_ID,
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
            liveScene.remoteVideoMediaId = persistedScene.remoteVideoMediaId;
            liveScene.remoteVideoMediaIds = _.clone(persistedScene.remoteVideoMediaIds);
            liveScene.remoteVideoSourceUrl = persistedScene.remoteVideoSourceUrl;
            liveScene.remoteVideoExpectedCount = persistedScene.remoteVideoExpectedCount;
            liveScene.remoteVideoDownloadPending = persistedScene.remoteVideoDownloadPending;
          });
          voiceUpdatedProj = { ...persistedProject, storyboard: realScenes as VideoProject["storyboard"] };
          latestCheckpointStoryboard = _.cloneDeep(realScenes);
          activeProjectSnapshotRef.current = voiceUpdatedProj;
        });
        return imageCheckpointQueue;
      };
      const recoverPendingFlowDownloads = async (): Promise<void> => {
        const pendingFlowDownloads = _.filter(realScenes as StoryboardScene[], (scene) => scene.remoteVideoDownloadPending && (!_.isEmpty(scene.remoteVideoMediaIds) || !_.isEmpty(scene.remoteVideoMediaId)) && !hasSceneAsset(scene));
        for (const pendingScene of pendingFlowDownloads) {
          throwIfCancelled();
          const recoveryStartTemplate = config.language === ProjectLanguage.VI ? FLOW_VIDEO_MEDIA_CONFIG.VI_RECOVERY_START : FLOW_VIDEO_MEDIA_CONFIG.EN_RECOVERY_START;
          appendLog(recoveryStartTemplate.replace(SecurityConstants.PLACEHOLDER_0, pendingScene.id));
          let recoveredVideo: Awaited<ReturnType<typeof recoverProjectFlowVideo>> | undefined;
          for (let attempt = SecurityConstants.ZERO; attempt < FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_ATTEMPTS; attempt += SecurityConstants.DEFAULT_AMOUNT) {
            throwIfCancelled();
            recoveredVideo = await recoverProjectFlowVideo(
              {
                projectId: voiceUpdatedProj.id,
                sceneId: pendingScene.id,
                mediaIds: !_.isEmpty(pendingScene.remoteVideoMediaIds) ? pendingScene.remoteVideoMediaIds : [pendingScene.remoteVideoMediaId!],
                expectedOutputCount: _.defaultTo(pendingScene.remoteVideoExpectedCount, !_.isEmpty(pendingScene.remoteVideoMediaIds) ? FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT : SecurityConstants.DEFAULT_AMOUNT),
              },
              requestSignal,
            );
            if (recoveredVideo.success || recoveredVideo.remoteMediaCreated === false) break;
            if (attempt < FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_ATTEMPTS - SecurityConstants.DEFAULT_AMOUNT) {
              await delayAsync(FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_RETRY_DELAY_MS);
            }
          }
          if (!recoveredVideo) continue;
          if (recoveredVideo.success && recoveredVideo.fallbackUrl) {
            pendingScene.assetUrl = recoveredVideo.fallbackUrl;
            pendingScene.assetUrls = recoveredVideo.fallbackUrls;
            pendingScene.assetType = GenerateType.Video;
            pendingScene.assetStatus = SceneAssetStatus.Generated;
            pendingScene.assetError = undefined;
            pendingScene.remoteVideoDownloadPending = false;
            appendAssetRevision(pendingScene, recoveredVideo.fallbackUrl, SceneAssetStatus.Generated);
            const recoverySuccessTemplate = config.language === ProjectLanguage.VI ? FLOW_VIDEO_MEDIA_CONFIG.VI_RECOVERY_SUCCESS : FLOW_VIDEO_MEDIA_CONFIG.EN_RECOVERY_SUCCESS;
            appendLog(recoverySuccessTemplate.replace(SecurityConstants.PLACEHOLDER_0, pendingScene.id));
          } else {
            pendingScene.assetStatus = SceneAssetStatus.Failed;
            pendingScene.assetError = _.defaultTo(recoveredVideo.warning, FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR);
            if (isProviderGenerationRejection(pendingScene.assetError) || isStaleFlowVideoRecoveryError(pendingScene.assetError)) {
              pendingScene.remoteVideoMediaId = undefined;
              pendingScene.remoteVideoMediaIds = undefined;
              pendingScene.remoteVideoSourceUrl = undefined;
              pendingScene.remoteVideoDownloadPending = false;
            }
          }
          await persistImageCheckpoint();
        }
      };
      if (isContinuation) await recoverPendingFlowDownloads();
      const createSceneRequestContext = (scene: StoryboardScene, sceneGenerateType: GenerateType) => {
        const context = createSceneGenerationContext(scene, voiceUpdatedProj.visualConfig);
        if (_.isEqual(sceneGenerateType, GenerateType.Video)) {
          const characterReferences = isCinematicEpisodeGenre(config.genre) ? resolveCinematicSceneCharacterReferences(scene, _.defaultTo(voiceUpdatedProj.visualConfig.characters, [])) : {};
          return { ...context, ...characterReferences, prompt: prepareProjectMediaPrompt({ sceneId: scene.id, prompt: _.toString(scene.generationPrompt), generateType: GenerateType.Video }) };
        }
        const aiAuthoredPrompt = _.trim(_.toString(scene.prompt));
        if (_.isEmpty(aiAuthoredPrompt)) throw new Error(SOURCE_TEMPLATE_PROMPT_MISSING(`${scene.id}`));
        const engineAdaptedPrompt = adaptImagePromptForEngine(aiAuthoredPrompt, executionVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen, config.aspectRatio);
        return { ...context, prompt: prepareProjectMediaPrompt({ sceneId: scene.id, prompt: engineAdaptedPrompt, generateType: sceneGenerateType }) };
      };
      const requestAiRewrittenVideoPrompt = async (scene: StoryboardScene, failedPrompt: string, qaIssues: string[]): Promise<string> => {
        const rewriteResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_REPAIR_VIDEO_PROMPT, { prompt: failedPrompt, qaIssues, scene, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.PROMPT }, requestSignal);
        const rewrittenPrompt = _.toString(rewriteResult.data?.review?.repairedPrompt);
        if (!rewriteResult.success || _.isEmpty(_.trim(rewrittenPrompt))) {
          appendLog(PF.formatScenePromptKept(scene.id));
          return failedPrompt;
        }
        const rewrittenIssues = getBlockingCinematicPromptPreflightIssues(scene, rewrittenPrompt, config.videoDuration);
        if (!_.isEmpty(rewrittenIssues)) {
          appendLog(PF.formatScenePromptNoted(scene.id));
        }
        return rewrittenPrompt;
      };
      const requestAiRewrittenVisualPrompt = async (scene: Partial<StoryboardScene>, failedPrompt: string, qaIssues: string[], purpose: "scene image" | "thumbnail"): Promise<string> => {
        const rewriteResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_REPAIR_VISUAL_PROMPT, { prompt: failedPrompt, qaIssues, scene, purpose, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.PROMPT }, requestSignal);
        const rewrittenPrompt = _.trim(_.toString(rewriteResult.data?.review?.repairedPrompt));
        if (!rewriteResult.success || _.isEmpty(rewrittenPrompt)) {
          appendLog(PF.LOG_SCENE_PROMPT_FALLBACK);
          return failedPrompt;
        }
        return rewrittenPrompt;
      };
      const cinematicPreflightPrompts = new Map<string, string>();
      if (isCinematicEpisodeGenre(config.genre)) {
        appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_START : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_START);
        const preflightScenes = _.filter(targetScenesToGen as StoryboardScene[], (scene) => !hasSceneAsset(scene));
        const preflightIssues = _.flatMap(preflightScenes, (scene) => {
          throwIfCancelled();
          const requestContext = createSceneRequestContext(scene, GenerateType.Video);
          const localIssues = getBlockingCinematicPromptPreflightIssues(scene, requestContext.prompt, config.videoDuration);
          scene.cinematicPolicyReview = { violatesPolicy: false, risks: localIssues, rationale: CINEMATIC_PLANNING_MESSAGES.PROJECT_SAFETY_APPROVED_RATIONALE };
          cinematicPreflightPrompts.set(scene.id, requestContext.prompt);
          return localIssues;
        });
        if (!_.isEmpty(preflightIssues)) {
          const failedSceneIds = _.uniq(_.compact(_.map(preflightIssues, (issue) => _.head(_.split(issue, SOURCE_TEXT_SYMBOL_16)))));
          const failureMessage = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_FAILED : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_FAILED;
          const detailTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_FAILED_SCENES : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_FAILED_SCENES;
          const detailMessage = detailTemplate.replace(SecurityConstants.PLACEHOLDER_0, _.join(failedSceneIds, SOURCE_TEXT_SYMBOL_10));
          appendLog(`${failureMessage}${RT_SHARED.SYMBOL_36A9E7}${detailMessage}`);
          logger.warn(`${CINEMATIC_PLANNING_MESSAGES.PREFLIGHT_LOG_PREFIX}${RT_SHARED.SYMBOL_36A9E7}${_.join(preflightIssues, SOURCE_TEXT_SYMBOL_10)}`);
          throw new Error(`${failureMessage}${RT_SHARED.SYMBOL_36A9E7}${detailMessage}`);
        }
        appendLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_PREFLIGHT_PASSED : CINEMATIC_PLANNING_MESSAGES.EN_PREFLIGHT_PASSED);
        await persistImageCheckpoint();
      }
      if (!_.isEmpty(targetScenesToGen) || !_.isEmpty(unifiedThumbnailItems)) {
        for (const archivalScene of _.filter(targetScenesToGen, (scene) => _.isEqual(scene.assetStrategy, SOURCE_TEXT_ARCHIVAL) && !hasSceneAsset(scene))) {
          throwIfCancelled();
          const archivalResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_SEARCH_ARCHIVAL_IMAGE, { query: archivalScene.archivalSearchQuery, chromeHeadless: config.chromeHeadless }, requestSignal);
          const archivalData = archivalResult.data;
          if (archivalResult.success && archivalData?.success && archivalData?.base64) {
            const mimeType = _.toString(archivalData.mimeType || SOURCE_TEXT_IMAGE_JPEG);
            const dataUrl = SOURCE_TEMPLATE_DATA_BASE64(`${mimeType}`, `${archivalData.base64}`);
            archivalScene.assetUrl = dataUrl;
            archivalScene.assetUrls = [dataUrl];
            archivalScene.assetType = GenerateType.Image;
            archivalScene.assetStatus = SceneAssetStatus.Generated;
            archivalScene.archivalSourceUrl = _.toString(archivalData.sourceUrl);
            archivalScene.archivalLicense = _.toString(archivalData.license);
            appendAssetRevision(archivalScene, dataUrl, SceneAssetStatus.Generated);
            appendLog(PF.formatArchivalLoaded(archivalScene.id, _.toString(archivalData.provider || PF.ARCHIVE_SOURCE_DEFAULT)));
            await persistImageCheckpoint();
          } else {
            archivalScene.assetStrategy = SOURCE_TEXT_AI_GENERATED;
            appendLog(PF.formatArchivalFallbackAi(archivalScene.id));
          }
        }
        const remainingTargetScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene) && !scene.remoteVideoDownloadPending);
        const providerRepairAttemptsByScene = new Map<string, number>();
        const runSceneGeneration = async (scenesToProcess: StoryboardScene[], isFallback = false): Promise<void> => {
          let nonRetryableFlowError: Error | null = null;
          const generateScene = async (sc: StoryboardScene, i: number): Promise<void> => {
            throwIfCancelled();
            if (hasSceneAsset(sc)) return;
            const sceneGenerateType = resolveSceneGenerateType(sc.id, executionVisualConfig.generateType, videoSceneIds);
            const generatedRequestContext = createSceneRequestContext(sc, sceneGenerateType);
            const requestContext = { ...generatedRequestContext, prompt: cinematicPreflightPrompts.get(sc.id) || generatedRequestContext.prompt };
            sc.generationPrompt = requestContext.prompt;
            if (isFallback) appendLog(T.logFallbackAttempt(i + 1, scenesToProcess.length, sceneGenerateType));
            else {
              const sceneMediaLabel = sceneGenerateType === GenerateType.Video ? PF.MEDIA_TYPE_VIDEO : PF.MEDIA_TYPE_IMAGE;
              appendLog(PF.formatCreatingSceneMedia(sceneMediaLabel, sc.id, i + 1, scenesToProcess.length));
            }
            try {
              const imageResult = await generateProjectImageOnce(
                { sceneId: sc.id, idempotencyKey: _.join([voiceUpdatedProj.id, sc.id, sc.dependencyHash], CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR), prompt: requestContext.prompt, referenceImages: requestContext.referenceImages, generateType: sceneGenerateType },
                () => ({
                  prompt: requestContext.prompt,
                  style: currentStylePreset,
                  resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                  bypassCache: false,
                  engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                  sandboxConfig: sandboxConfigPayload,
                  visualConfig: visualConfigPayload ? { ...visualConfigPayload, referenceImages: requestContext.referenceImages, referenceImageNames: requestContext.referenceImageNames, referenceCharacterNames: requestContext.referenceCharacterNames, generateType: sceneGenerateType } : visualConfigPayload,
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
                  const dataUrl = _.join([_.isEqual(sceneGenerateType, GenerateType.Video) ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, base64Val], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                  sc.assetUrl = dataUrl;
                  sc.assetUrls = [dataUrl];
                } else if (fallbackUrl) {
                  sc.assetUrl = fallbackUrl;
                  sc.assetUrls = !_.isEmpty(imageResult.fallbackUrls) ? imageResult.fallbackUrls : [fallbackUrl];
                }
                if (!hasSceneAsset(sc)) throw new Error(SOURCE_TEXT_GENERATED_ASSET_MISSING);
                if (_.isEqual(sceneGenerateType, GenerateType.Video) && !isPersistedProjectVideoUrl(sc.assetUrl)) {
                  sc.assetUrl = undefined;
                  sc.assetUrls = [];
                  throw new Error(FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR);
                }
                sc.assetType = sceneGenerateType;
                sc.assetStatus = SceneAssetStatus.Generated;
                if (!_.isEmpty(imageResult.remoteMediaId)) sc.remoteVideoMediaId = imageResult.remoteMediaId;
                if (!_.isEmpty(imageResult.remoteMediaIds)) sc.remoteVideoMediaIds = imageResult.remoteMediaIds;
                if (imageResult.remoteVideoSourceUrl) sc.remoteVideoSourceUrl = imageResult.remoteVideoSourceUrl;
                sc.remoteVideoDownloadPending = false;
                appendAssetRevision(sc, sc.assetUrl, SceneAssetStatus.Generated);
                sc.assetError = undefined;
                await persistImageCheckpoint();
                const sceneMediaLabel = sceneGenerateType === GenerateType.Video ? PF.MEDIA_TYPE_VIDEO : PF.MEDIA_TYPE_IMAGE;
                appendLog(PF.formatSavedSceneMedia(sceneMediaLabel, sc.id));
                if (isCinematicPipeline) {
                  const completedVideoSceneCount = _.size(_.filter(realScenes, hasSceneAsset));
                  appendCinematicLog(_.replace(_.replace(cinematicProgressMessages.VIDEO_PROGRESS, SecurityConstants.PLACEHOLDER_0, _.toString(completedVideoSceneCount)), SecurityConstants.PLACEHOLDER_1, _.toString(realScenes.length)), CINEMATIC_PROGRESS_STAGE.VIDEO);
                }
              } else {
                if (imageResult.remoteMediaCreated) {
                  const hasCompleteRemoteBatch = _.gte(_.size(imageResult.remoteMediaIds), FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT);
                  sc.remoteVideoMediaId = imageResult.remoteMediaId;
                  sc.remoteVideoMediaIds = imageResult.remoteMediaIds;
                  sc.remoteVideoSourceUrl = imageResult.remoteVideoSourceUrl;
                  sc.remoteVideoExpectedCount = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT;
                  sc.remoteVideoDownloadPending = hasCompleteRemoteBatch;
                  sc.assetStatus = SceneAssetStatus.Failed;
                  sc.assetError = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
                  await persistImageCheckpoint();
                }
                throw new Error(_.defaultTo(imageResult.warning, REFACTOR_CONSTANTS.ERR_UNKNOWN));
              }
            } catch (error) {
              const initialFailureReason = getErrorMessage(error, REFACTOR_CONSTANTS.ERR_UNKNOWN);
              if (_.isEqual(sceneGenerateType, GenerateType.Image) && isProviderGenerationRejection(initialFailureReason)) {
                const completedRepairAttempts = _.defaultTo(providerRepairAttemptsByScene.get(sc.id), SecurityConstants.ZERO);
                if (_.lt(completedRepairAttempts, CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS)) {
                  const repairAttempt = _.add(completedRepairAttempts, SecurityConstants.DEFAULT_AMOUNT);
                  providerRepairAttemptsByScene.set(sc.id, repairAttempt);
                  const repairMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_SCENE_IMAGE_REPAIRING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_SCENE_IMAGE_REPAIRING;
                  appendLog(repairMessage.replace(SecurityConstants.PLACEHOLDER_0, sc.id));
                  const repairResponse = await pipelineSystemFetch(API_ROUTES.PIPELINE_REPAIR_VISUAL_PROMPT, { prompt: requestContext.prompt, qaIssues: [initialFailureReason], scene: sc, purpose: CINEMATIC_GENERATION_RECOVERY_CONFIG.SCENE_IMAGE_PROVIDER_REJECTION_PURPOSE, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.PROMPT }, requestSignal);
                  const repairedPrompt = _.trim(_.toString(repairResponse.data?.review?.repairedPrompt));
                  if (repairResponse.success && !_.isEmpty(repairedPrompt)) {
                    sc.prompt = repairedPrompt;
                    sc.generationPrompt = repairedPrompt;
                  }
                }
              }
              let recoveredAsImage = false;
              if (_.isEqual(executionVisualConfig.generateType, GenerateType.Mixed) && _.isEqual(sceneGenerateType, GenerateType.Video)) {
                try {
                  const imageFallbackResult = await generateProjectImageOnce(
                    { sceneId: sc.id, prompt: requestContext.prompt, referenceImages: requestContext.referenceImages, generateType: GenerateType.Image },
                    () => ({
                      prompt: requestContext.prompt,
                      style: currentStylePreset,
                      resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                      bypassCache: true,
                      engine: ImageGeneratorEngine.Imagen,
                      sandboxConfig: sandboxConfigPayload,
                      visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, referenceImageNames: requestContext.referenceImageNames, referenceCharacterNames: requestContext.referenceCharacterNames, generateType: GenerateType.Image },
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
                  logger.warn(SOURCE_TEMPLATE_MIXED_MEDIA_IMAGE_FALLBACK_FAILED_FOR(`${sc.id}`, `${getErrorMessage(imageFallbackError, REFACTOR_CONSTANTS.ERR_UNKNOWN)}`));
                }
              }
              if (!recoveredAsImage) {
                const failureReason = initialFailureReason;
                sc.assetStatus = SceneAssetStatus.Failed;
                sc.assetError = failureReason;
                await persistImageCheckpoint();
                appendLog(T.logBatchImageSceneError(sc.id, failureReason, sceneGenerateType));
                if (_.isEqual(sceneGenerateType, GenerateType.Video) && isNonRetryableFlowVideoError(failureReason)) {
                  nonRetryableFlowError = new Error(PF.formatGoogleFlowStopped(failureReason));
                }
              }
            }
          };
          for (let i = 0; i < scenesToProcess.length; i++) {
            await generateScene(scenesToProcess[i], i);
            if (nonRetryableFlowError) break;
          }
          if (nonRetryableFlowError) {
            _.forEach(scenesToProcess, (scene) => {
              if (!hasSceneAsset(scene) && !_.isEqual(scene.assetStatus, SceneAssetStatus.Failed)) {
                scene.assetStatus = SceneAssetStatus.Pending;
                scene.assetError = undefined;
              }
            });
            await persistImageCheckpoint();
            throw nonRetryableFlowError;
          }
        };
        const usesStrictSequentialVideoQueue = Boolean(isCinematicEpisodeGenre(config.genre) || _.isEqual(executionVisualConfig.generateType, GenerateType.Video));
        const runCinematicVideoQueue = async (scenesToProcess: StoryboardScene[]): Promise<void> => {
          const finishVideoScene = async (scene: StoryboardScene): Promise<void> => {
            for (let attempt = SecurityConstants.ZERO; attempt <= FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT; attempt += SecurityConstants.DEFAULT_AMOUNT) {
              if (_.gt(attempt, SecurityConstants.ZERO)) {
                const retryMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_VIDEO_SCENE_RETRYING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_VIDEO_SCENE_RETRYING;
                appendLog(retryMessage.replace(SecurityConstants.PLACEHOLDER_0, scene.id).replace(SecurityConstants.PLACEHOLDER_1, _.toString(attempt)).replace(SecurityConstants.PLACEHOLDER_2, _.toString(FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT)));
              }
              await runSceneGeneration([scene], _.gt(attempt, SecurityConstants.ZERO));
              if (scene.remoteVideoDownloadPending) {
                const waitingMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_VIDEO_SCENE_WAITING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_VIDEO_SCENE_WAITING;
                appendLog(waitingMessage.replace(SecurityConstants.PLACEHOLDER_0, scene.id));
                await recoverPendingFlowDownloads();
              }
              if (hasSceneAsset(scene) || scene.remoteVideoDownloadPending || isNonRetryableFlowVideoError(scene.assetError)) break;
            }
          };
          for (const scene of scenesToProcess) {
            throwIfCancelled();
            await finishVideoScene(scene);
            if (!hasSceneAsset(scene)) break;
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
              idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash], SOURCE_TEXT_SYMBOL_16),
              prompt: requestContext.prompt,
              referenceImages: requestContext.referenceImages,
              referenceImageNames: requestContext.referenceImageNames,
              referenceCharacterNames: requestContext.referenceCharacterNames,
              continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
              generateType: sceneGenerateType,
            };
          });
          const batchItems = [...sceneBatchItems, ...unifiedThumbnailItems];
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
              appendLog(T.logBatchImageSceneSuccess(result.sceneId, completedCount, totalScenes, scene!.assetType === GenerateType.Video ? SOURCE_TEXT_VIDEO_2 : SOURCE_TEXT_IMAGE));
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
                idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash, SOURCE_TEXT_FALLBACK], SOURCE_TEXT_SYMBOL_16),
                prompt: requestContext.prompt,
                referenceImages: requestContext.referenceImages,
                referenceImageNames: requestContext.referenceImageNames,
                referenceCharacterNames: requestContext.referenceCharacterNames,
                continuityKey: createSceneContinuityKey(scene, voiceUpdatedProj.visualConfig.characters),
                generateType: fallbackGenerateType,
              };
            });
            let fallbackCompleted = 0;
            await generateProjectImages({
              items: fallbackItems,
              visualConfig: { ...visualConfigPayload, generateType: isCinematicEpisodeGenre(config.genre) ? GenerateType.Video : GenerateType.Image, batchTabCount: PROJECT_IMAGE_FALLBACK_CONFIG.TAB_CONCURRENCY },
              style: currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              onBatchResult: (result) => {
                if (result.success) {
                  fallbackCompleted = _.add(fallbackCompleted, 1);
                  const completedItem = _.find(fallbackItems, { sceneId: result.sceneId });
                  appendLog(T.logFallbackProgress(fallbackCompleted, fallbackItems.length, completedItem?.generateType || SOURCE_TEXT_IMAGE));
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
            const failureReason = getErrorMessage(generationError, REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR);
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
            appendLog(PF.LOG_THUMBNAIL_PARALLEL_GEN);
            const thumbnailResults = new Map<string, ProjectImageResult>();
            const applyThumbnailResult = (result: ProjectImageResult): void => {
              thumbnailResults.set(result.sceneId, result);
              if (!result.success) return;
              const thumbnail = _.find(unifiedBatchThumbnails || [], { id: result.sceneId });
              const imageUrl = createProjectImageUrl(result);
              if (thumbnail && !_.isEmpty(imageUrl)) {
                thumbnail.imageUrl = imageUrl;
                void persistImageCheckpoint();
              }
            };
            await generateProjectImages({
              items: unifiedThumbnailItems,
              visualConfig: { ...thumbnailVisualConfigPayload, style: currentThumbnailStyle || currentStylePreset, batchTabCount: SecurityConstants.DEFAULT_AMOUNT },
              style: currentThumbnailStyle || currentStylePreset,
              sandboxConfig: sandboxConfigPayload,
              cancelRef: cancellationRef,
              retainBrowserSession: false,
              onBatchResult: applyThumbnailResult,
            });
            for (let attempt = 0; attempt < CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS; attempt++) {
              const failedItems = _.filter(unifiedThumbnailItems, (item) => !thumbnailResults.get(item.sceneId)?.success);
              if (_.isEmpty(failedItems) || cancellationRef.current) break;
              for (const item of failedItems) {
                const thumbnail = _.find(unifiedBatchThumbnails || [], { id: item.sceneId });
                const previousFailure = thumbnailResults.get(item.sceneId);
                const repairResponse = await pipelineSystemFetch(
                  API_ROUTES.PIPELINE_REPAIR_VISUAL_PROMPT,
                  { prompt: item.prompt, qaIssues: [previousFailure?.warning || REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR], scene: thumbnail, purpose: isProviderGenerationRejection(previousFailure?.warning) ? CINEMATIC_GENERATION_RECOVERY_CONFIG.THUMBNAIL_PROVIDER_REJECTION_PURPOSE : CINEMATIC_GENERATION_RECOVERY_CONFIG.THUMBNAIL_VISUAL_PURPOSE, roomWorkerId: CINEMATIC_ROOM_STAGE.THUMBNAIL },
                  requestSignal,
                );
                const repairedPrompt = _.trim(_.toString(repairResponse.data?.review?.repairedPrompt));
                const retryPrompt = repairResponse.success && !_.isEmpty(repairedPrompt) ? repairedPrompt : item.prompt;
                if (!_.isEqual(retryPrompt, item.prompt)) {
                  item.prompt = retryPrompt;
                  if (thumbnail) {
                    thumbnail.prompt = retryPrompt;
                    thumbnail.generationPrompt = retryPrompt;
                  }
                }
                const retryMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_THUMBNAIL_RETRYING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_THUMBNAIL_RETRYING;
                appendLog(
                  retryMessage
                    .replace(SecurityConstants.PLACEHOLDER_0, item.sceneId)
                    .replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.add(attempt, SecurityConstants.DEFAULT_AMOUNT)))
                    .replace(SecurityConstants.PLACEHOLDER_2, _.toString(CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS)),
                );
                const retryResult = await generateProjectImageOnce(
                  item,
                  () => ({
                    prompt: retryPrompt,
                    style: currentThumbnailStyle || currentStylePreset,
                    resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                    bypassCache: true,
                    engine: ImageGeneratorEngine.LabsSandbox,
                    sandboxConfig: sandboxConfigPayload,
                    visualConfig: { ...thumbnailVisualConfigPayload, style: currentThumbnailStyle || currentStylePreset, batchTabCount: SecurityConstants.DEFAULT_AMOUNT },
                  }),
                  requestSignal,
                );
                applyThumbnailResult(retryResult);
              }
            }
            await imageCheckpointQueue;
            const unresolvedThumbnails = _.filter(unifiedThumbnailItems, (item) => !thumbnailResults.get(item.sceneId)?.success);
            if (!_.isEmpty(unresolvedThumbnails)) {
              const failureMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_THUMBNAIL_REQUIRED : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_THUMBNAIL_REQUIRED;
              throw new Error(failureMessage.replace(SecurityConstants.PLACEHOLDER_0, _.toString(CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS)));
            }
          };
          await generateFilmThumbnails();
          if (!_.isEqual(runIntent, SOURCE_TEXT_RENDER_ONLY)) {
            const existingCharacters = _.defaultTo(voiceUpdatedProj.visualConfig.characters, []);
            if (_.gt(existingCharacters.length, CINEMATIC_CHARACTER_PACK_CONFIG.MAX_CHARACTERS)) {
              throw new Error(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
            }
            const charactersMissingReferences = _.filter(existingCharacters, (character) => !_.isEqual(character.flowCharacterProfileVersion, CINEMATIC_CHARACTER_PACK_CONFIG.FLOW_CHARACTER_PROFILE_VERSION) || !_.isEqual(character.flowCharacterProjectId, sandboxConfigPayload.flowProjectId) || !_.isEqual(character.flowCharacterName, character.name) || _.isEmpty(character.images));
            if (!_.isEmpty(charactersMissingReferences)) {
              appendCinematicLog(config.language === ProjectLanguage.VI ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_START : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_START, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
              let flowCharacterResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_ENSURE_FLOW_CHARACTERS, { projectId: voiceUpdatedProj.id, characters: charactersMissingReferences, chromeHeadless: config.chromeHeadless, language: config.language }, requestSignal);
              const initialCharacterResults = _.castArray(flowCharacterResult.data?.characters || []);
              const rejectedCharacters = _.filter(initialCharacterResults, (result) => !result?.success && isProviderGenerationRejection(result?.warning));
              const repairedCharacters: CharacterConfig[] = [];
              for (const rejectedResult of rejectedCharacters) {
                const character = _.find(charactersMissingReferences, { id: rejectedResult?.id });
                if (!character) continue;
                appendCinematicLog((config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_CHARACTER_PROMPT_REPAIRING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_CHARACTER_PROMPT_REPAIRING).replace(SecurityConstants.PLACEHOLDER_0, character.name), CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
                const originalPrompt = _.trim(_.toString(character.referenceGenerationPrompt || character.prompt || character.description));
                const repairResponse = await pipelineSystemFetch(API_ROUTES.PIPELINE_REPAIR_VISUAL_PROMPT, { prompt: originalPrompt, qaIssues: [_.toString(rejectedResult?.warning)], scene: character, purpose: CINEMATIC_GENERATION_RECOVERY_CONFIG.CHARACTER_PROVIDER_REJECTION_PURPOSE, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.PROMPT }, requestSignal);
                const repairedPrompt = _.trim(_.toString(repairResponse.data?.review?.repairedPrompt));
                if (repairResponse.success && !_.isEmpty(repairedPrompt)) {
                  repairedCharacters.push({ ...character, referenceGenerationPrompt: repairedPrompt });
                }
              }
              if (!_.isEmpty(repairedCharacters) && !cancellationRef.current) {
                for (const character of repairedCharacters) {
                  appendCinematicLog((config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_CHARACTER_RETRYING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_CHARACTER_RETRYING).replace(SecurityConstants.PLACEHOLDER_0, character.name), CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
                }
                const repairedResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_ENSURE_FLOW_CHARACTERS, { projectId: voiceUpdatedProj.id, characters: repairedCharacters, chromeHeadless: config.chromeHeadless, language: config.language }, requestSignal);
                const repairedResults = _.castArray(repairedResult.data?.characters || []);
                const mergedResults = _.map(charactersMissingReferences, (character) => _.find(repairedResults, { id: character.id }) || _.find(initialCharacterResults, { id: character.id }) || { id: character.id, name: character.name, success: false });
                const mergedCharacterData = { characters: mergedResults, newProjectId: repairedResult.data?.newProjectId || flowCharacterResult.data?.newProjectId };
                flowCharacterResult = _.every(mergedResults, (result) => result?.success) ? { success: true, data: mergedCharacterData } : { success: false, data: mergedCharacterData, error: repairedResult.success ? flowCharacterResult.error : repairedResult.error || flowCharacterResult.error };
              }
              const successfulCharacterResults = _.filter(_.castArray(flowCharacterResult.data?.characters || []), (result) => result?.success);
              const createdCharacterIds = new Set(_.map(successfulCharacterResults, SOURCE_TEXT_ID));
              const resolvedFlowProjectId = _.trim(_.toString(flowCharacterResult.data?.newProjectId || sandboxConfigPayload.flowProjectId));
              if (!_.isEmpty(resolvedFlowProjectId)) sandboxConfigPayload.flowProjectId = resolvedFlowProjectId;
              const characterImagesById = _.keyBy(successfulCharacterResults, SOURCE_TEXT_ID);
              const repairedPromptsById = _.keyBy(repairedCharacters, SOURCE_TEXT_ID);
              const charactersWithReferences = _.map(existingCharacters, (character) => {
                const created = createdCharacterIds.has(character.id);
                const repairedPrompt = repairedPromptsById[character.id]?.referenceGenerationPrompt;
                if (!created && !repairedPrompt) return character;
                return {
                  ...character,
                  ...(repairedPrompt ? { referenceGenerationPrompt: repairedPrompt } : {}),
                  ...(created ? { images: _.compact(_.castArray(characterImagesById[character.id]?.imageUrl || character.images)), flowCharacterName: character.name, flowCharacterProjectId: resolvedFlowProjectId, flowCharacterProfileVersion: CINEMATIC_CHARACTER_PACK_CONFIG.FLOW_CHARACTER_PROFILE_VERSION, extracted: true } : {}),
                };
              });
              voiceUpdatedProj = {
                ...voiceUpdatedProj,
                visualConfig: {
                  ...voiceUpdatedProj.visualConfig,
                  characters: charactersWithReferences,
                  flowProjectId: resolvedFlowProjectId || voiceUpdatedProj.visualConfig.flowProjectId,
                  characterImages: _.compact(_.map(charactersWithReferences, (character) => _.first(character.images))),
                  characterExtracted: _.every(charactersWithReferences, (character) => !_.isEmpty(character.flowCharacterName)),
                  characterConsistency: !_.isEmpty(charactersWithReferences),
                },
              };
              voiceUpdatedProj = await syncProject(voiceUpdatedProj);
              const characterReferencesComplete = Boolean(
                flowCharacterResult.success && _.every(charactersWithReferences, (character) => _.isEqual(character.flowCharacterName, character.name) && _.isEqual(character.flowCharacterProjectId, resolvedFlowProjectId) && _.isEqual(character.flowCharacterProfileVersion, CINEMATIC_CHARACTER_PACK_CONFIG.FLOW_CHARACTER_PROFILE_VERSION) && !_.isEmpty(character.images)),
              );
              appendCinematicLog(config.language === ProjectLanguage.VI ? (characterReferencesComplete ? CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_READY : CINEMATIC_PLANNING_MESSAGES.VI_CHARACTER_PACK_PARTIAL) : characterReferencesComplete ? CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_READY : CINEMATIC_PLANNING_MESSAGES.EN_CHARACTER_PACK_PARTIAL, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
              if (!characterReferencesComplete) {
                const failedCharacterReferences = _.map(
                  _.filter(_.castArray(flowCharacterResult.data?.characters || []), (result) => !result?.success),
                  SOURCE_TEXT_NAME,
                );
                const failureTemplate = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_CHARACTER_REFERENCE_REQUIRED : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_CHARACTER_REFERENCE_REQUIRED;
                throw new Error(failureTemplate.replace(SecurityConstants.PLACEHOLDER_0, _.join(_.uniq(failedCharacterReferences), SOURCE_TEXT_SYMBOL_10) || _.toString(flowCharacterResult.error || flowCharacterResult.data?.warning)).replace(SecurityConstants.PLACEHOLDER_1, _.toString(CINEMATIC_GENERATION_RECOVERY_CONFIG.PROVIDER_REPAIR_ATTEMPTS)));
              }
            }
          }
          if (_.lte(cinematicResumeStage, CINEMATIC_PROGRESS_STAGE.THUMBNAIL)) {
            appendCinematicLog(cinematicProgressMessages.THUMBNAIL_READY, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
          }
          appendCinematicLog(_.replace(cinematicProgressMessages.VIDEO_START, SecurityConstants.PLACEHOLDER_0, _.toString(realScenes.length)), CINEMATIC_PROGRESS_STAGE.VIDEO);
          if (usesStrictSequentialVideoQueue) await runCinematicVideoQueue(remainingTargetScenes);
          else await runSceneGeneration(remainingTargetScenes, false);
        }
        const unresolvedSourceScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene));
        if (!usesStrictSequentialVideoQueue && !_.isEmpty(unresolvedSourceScenes) && !cancellationRef.current) {
          if (!isCinematicEpisodeGenre(config.genre)) {
            _.forEach(unresolvedSourceScenes, (scene) => {
              scene.assetStrategy = SOURCE_TEXT_AI_GENERATED;
              scene.archivalRationale = _.trim(_.join([scene.archivalRationale, SOURCE_TEXT_AUTHENTIC_SOURCE_UNAVAILABLE_AI_RECONSTRUCTION_USED], SOURCE_TEXT_SYMBOL_6));
              scene.assetStatus = SceneAssetStatus.Generating;
              scene.assetError = undefined;
            });
            appendLog(PF.formatArchivalUnresolvedAi(unresolvedSourceScenes.length));
            await runSceneGeneration(unresolvedSourceScenes, true);
          }
        }
        for (let mediaAttempt = 1; !usesStrictSequentialVideoQueue && mediaAttempt < PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS; mediaAttempt++) {
          const retryScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene) && !scene.remoteVideoDownloadPending);
          if (_.isEmpty(retryScenes) || cancellationRef.current) break;
          _.forEach(retryScenes, (scene) => {
            scene.assetStatus = SceneAssetStatus.Retrying;
            scene.assetError = undefined;
          });
          appendLog(
            config.language === ProjectLanguage.VI
              ? SOURCE_TEMPLATE_MEDIA_RETRY_CHI_CHO_GIU_NGUYEN(`${mediaAttempt}`, `${PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS - 1}`, `${_.join(_.map(retryScenes, SOURCE_TEXT_ID), SOURCE_TEXT_SYMBOL_10)}`)
              : SOURCE_TEMPLATE_MEDIA_RETRY_ONLY_FOR_SUCCESSFUL_SCENES(`${mediaAttempt}`, `${PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS - 1}`, `${_.join(_.map(retryScenes, SOURCE_TEXT_ID), SOURCE_TEXT_SYMBOL_10)}`),
          );
          await runSceneGeneration(retryScenes, true);
        }
        for (let repairAttempt = SecurityConstants.ZERO; !usesStrictSequentialVideoQueue && repairAttempt < CINEMATIC_GENERATION_RECOVERY_CONFIG.VIDEO_POLICY_REPAIR_ATTEMPTS; repairAttempt += SecurityConstants.DEFAULT_AMOUNT) {
          const rejectedVideoScenes = _.filter(targetScenesToGen, (scene) => !hasSceneAsset(scene) && !scene.remoteVideoDownloadPending && _.isEqual(resolveSceneGenerateType(scene.id, executionVisualConfig.generateType, videoSceneIds), GenerateType.Video) && isProviderGenerationRejection(scene.assetError));
          if (_.isEmpty(rejectedVideoScenes) || cancellationRef.current) break;
          const repairedVideoScenes: StoryboardScene[] = [];
          for (const rejectedScene of rejectedVideoScenes) {
            throwIfCancelled();
            const currentPrompt = cinematicPreflightPrompts.get(rejectedScene.id) || _.toString(rejectedScene.generationPrompt);
            const repairMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_VIDEO_PROMPT_REPAIRING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_VIDEO_PROMPT_REPAIRING;
            appendLog(repairMessage.replace(SecurityConstants.PLACEHOLDER_0, rejectedScene.id).replace(SecurityConstants.PLACEHOLDER_1, _.toString(_.subtract(PIPELINE_GUARANTEE_CONFIG.MEDIA_ATTEMPTS, SecurityConstants.DEFAULT_AMOUNT))));
            const repairedPrompt = await requestAiRewrittenVideoPrompt(rejectedScene, currentPrompt, []);
            if (_.isEmpty(_.trim(repairedPrompt)) || _.isEqual(_.trim(repairedPrompt), _.trim(currentPrompt))) continue;
            rejectedScene.prompt = repairedPrompt;
            rejectedScene.generationPrompt = repairedPrompt;
            rejectedScene.dependencyHash = createSceneDependencyHash(rejectedScene, visualDependencies);
            rejectedScene.assetStatus = SceneAssetStatus.Retrying;
            rejectedScene.assetError = undefined;
            cinematicPreflightPrompts.set(rejectedScene.id, repairedPrompt);
            repairedVideoScenes.push(rejectedScene);
            const retryMessage = config.language === ProjectLanguage.VI ? CINEMATIC_GENERATION_RECOVERY_CONFIG.VI_VIDEO_PROMPT_RETRYING : CINEMATIC_GENERATION_RECOVERY_CONFIG.EN_VIDEO_PROMPT_RETRYING;
            appendLog(retryMessage.replace(SecurityConstants.PLACEHOLDER_0, rejectedScene.id));
          }
          if (_.isEmpty(repairedVideoScenes)) break;
          await persistImageCheckpoint();
          await runSceneGeneration(repairedVideoScenes, true);
        }
        if (!usesStrictSequentialVideoQueue) await recoverPendingFlowDownloads();
      }
      if (isCinematicPipeline && _.lt(cinematicProgressStage, CINEMATIC_PROGRESS_STAGE.VIDEO)) {
        appendCinematicLog(cinematicProgressMessages.THUMBNAIL_READY, CINEMATIC_PROGRESS_STAGE.THUMBNAIL);
        appendCinematicLog(_.replace(cinematicProgressMessages.VIDEO_START, SecurityConstants.PLACEHOLDER_0, _.toString(realScenes.length)), CINEMATIC_PROGRESS_STAGE.VIDEO);
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
            scene.assetError = qaResult.error || SOURCE_TEXT_VISUAL_QA_UNAVAILABLE;
            appendLog(PF.formatImageQaUnevaluated(scene.id));
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
            appendLog(PF.formatImageQaPassed(scene.id));
            break;
          }
          if (regenerationAttempt >= SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS && !_.isEqual(scene.assetStrategy, SOURCE_TEXT_ARCHIVAL)) {
            scene.qaStatus = QaStatus.Failed;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = SOURCE_TEMPLATE_VISUAL_QA_RETRY_LIMIT(`${_.join(regenerationReasons, SOURCE_TEXT_SYMBOL_4)}`);
            const finalRevision = _.findLast(scene.assetRevisions);
            if (finalRevision) {
              finalRevision.status = SceneAssetStatus.Approved;
              finalRevision.approvedAt = new Date().toISOString();
            }
            appendLog(PF.formatImageQaRecompleted(scene.id));
            qaCompleted = true;
            break;
          }
          const rejectedRevision = _.findLast(scene.assetRevisions);
          if (rejectedRevision) rejectedRevision.status = SceneAssetStatus.Rejected;
          scene.assetStatus = SceneAssetStatus.Retrying;
          appendLog(PF.formatImageQaRetrying(scene.id, regenerationAttempt + 1, 1));
          if (_.isEqual(scene.assetStrategy, SOURCE_TEXT_ARCHIVAL)) {
            if (regenerationAttempt < SCENE_VISUAL_QUALITY_CONFIG.MAX_REGENERATION_ATTEMPTS) {
              const replacementResult = await pipelineSystemFetch(API_ROUTES.PIPELINE_SEARCH_ARCHIVAL_IMAGE, { query: scene.archivalSearchQuery, chromeHeadless: config.chromeHeadless, excludeSourceUrls: _.compact([scene.archivalSourceUrl]) }, requestSignal);
              const replacement = replacementResult.data;
              if (replacementResult.success && replacement?.success && replacement?.base64) {
                const replacementMime = _.toString(replacement.mimeType || SOURCE_TEXT_IMAGE_JPEG);
                const replacementUrl = SOURCE_TEMPLATE_DATA_BASE64(`${replacementMime}`, `${replacement.base64}`);
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
            scene.assetStrategy = SOURCE_TEXT_AI_GENERATED;
            scene.archivalSearchQuery = "";
            scene.archivalRationale = _.trim(_.join([scene.archivalRationale, SOURCE_TEXT_AUTHENTIC_CANDIDATES_FAILED_SEMANTIC_QA_EXPLICIT], SOURCE_TEXT_SYMBOL_6));
            scene.archivalSourceUrl = undefined;
            scene.archivalLicense = undefined;
            appendLog(PF.formatArchivalQaSwitchAi(scene.id));
          }
          const requestContext = createSceneRequestContext(scene, GenerateType.Image);
          const qaRetryPrompt = await requestAiRewrittenVisualPrompt(scene, requestContext.prompt, regenerationReasons, SOURCE_TEXT_SCENE_IMAGE);
          const retryResult = await generateProjectImageOnce(
            { sceneId: scene.id, prompt: qaRetryPrompt, referenceImages: requestContext.referenceImages, generateType: GenerateType.Image },
            () => ({
              prompt: qaRetryPrompt,
              style: currentStylePreset,
              resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
              bypassCache: true,
              engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
              sandboxConfig: sandboxConfigPayload,
              visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, referenceImageNames: requestContext.referenceImageNames, referenceCharacterNames: requestContext.referenceCharacterNames, generateType: GenerateType.Image },
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
            retryRevision.operation = SOURCE_TEXT_RETRY;
            await persistImageCheckpoint();
          } else {
            scene.assetStatus = SceneAssetStatus.Generated;
            scene.assetError = retryResult.warning || SOURCE_TEXT_VISUAL_QA_REGENERATION_FAILED;
          }
        }
        if (!qaCompleted && scene.qaStatus !== QaStatus.Unavailable) {
          scene.qaStatus = QaStatus.Failed;
          scene.acceptance = AssetAcceptance.AcceptedWithWarning;
        }
      }
      if (isCinematicEpisodeGenre(config.genre)) {
        const filmVideoScenes = _.filter(realScenes as StoryboardScene[], (scene) => targetSceneIds.has(scene.id) && hasSceneAsset(scene) && _.isEqual(scene.assetType, GenerateType.Video));
        for (const scene of filmVideoScenes) {
          const originalVideoTake = _.cloneDeep(scene);
          let originalVideoQaQuality: any;
          for (let qaAttempt = 0; qaAttempt <= PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS; qaAttempt++) {
            throwIfCancelled();
            scene.assetStatus = SceneAssetStatus.Validating;
            const videoQa = await validateSceneImage(voiceUpdatedProj.id, scene, undefined, [], { purpose: SOURCE_TEXT_VIDEO_2 });
            const videoQaReasons = videoQa.quality ? getSceneVisualRegenerationReasons(videoQa.quality, false) : [];
            if (videoQa.success && videoQa.quality && _.isEmpty(videoQaReasons)) {
              const hasVideoQaAdvisory = !videoQa.approved || !_.isEmpty(videoQa.quality.warnings);
              scene.qaStatus = QaStatus.Passed;
              scene.acceptance = hasVideoQaAdvisory ? AssetAcceptance.AcceptedWithWarning : AssetAcceptance.Approved;
              scene.assetStatus = SceneAssetStatus.Approved;
              scene.assetError = hasVideoQaAdvisory ? SOURCE_TEMPLATE_VIDEO_QA_ADVISORY(`${_.join(videoQa.quality.warnings, SOURCE_TEXT_SYMBOL_4) || SOURCE_TEXT_QUALITY_SCORE_BELOW_RECOMMENDED_TARGET}`) : undefined;
              scene.cinematicTakeDecision = SOURCE_TEXT_USE;
              scene.cinematicTakeDecisionReason = hasVideoQaAdvisory ? SOURCE_TEXT_SEMANTIC_QA_PASSED_WITH_ADVISORY : SOURCE_TEXT_SEMANTIC_AND_CONTINUITY_QA_PASSED;
              const approvedRevision = _.findLast(scene.assetRevisions);
              if (approvedRevision) {
                approvedRevision.status = SceneAssetStatus.Approved;
                approvedRevision.approvedAt = new Date().toISOString();
              }
              break;
            }
            if (!videoQa.success || !videoQa.quality) {
              scene.qaStatus = QaStatus.Unavailable;
              scene.acceptance = AssetAcceptance.AcceptedWithWarning;
              scene.assetStatus = SceneAssetStatus.Approved;
              scene.assetError = SOURCE_TEMPLATE_VIDEO_QA_UNAVAILABLE(`${videoQa.error || SOURCE_TEXT_REVIEW_UNAVAILABLE}`);
              scene.cinematicTakeDecision = SOURCE_TEXT_USE;
              scene.cinematicTakeDecisionReason = SOURCE_TEXT_QA_UNAVAILABLE_NO_EVIDENCE_FOR_REGENERATION;
              const unreviewedRevision = _.findLast(scene.assetRevisions);
              if (unreviewedRevision) {
                unreviewedRevision.status = SceneAssetStatus.Approved;
                unreviewedRevision.approvedAt = new Date().toISOString();
              }
              appendLog(PF.formatVideoQaKept(scene.id));
              break;
            }
            const qaReasons = videoQaReasons;
            if (_.isEqual(qaAttempt, 0)) originalVideoQaQuality = videoQa.quality;
            if (qaAttempt >= PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS) {
              const scoreFields = SCENE_VISUAL_QUALITY_CONFIG.SCORE_FIELDS;
              const originalScore = _.mean(_.map(scoreFields, (field) => _.toNumber(_.get(originalVideoQaQuality, field))));
              const retryScore = _.mean(_.map(scoreFields, (field) => _.toNumber(_.get(videoQa.quality, field))));
              if (_.gt(originalScore, retryScore)) _.assign(scene, originalVideoTake);
              scene.qaStatus = QaStatus.Passed;
              scene.acceptance = AssetAcceptance.AcceptedWithWarning;
              scene.assetStatus = SceneAssetStatus.Approved;
              scene.assetError = SOURCE_TEMPLATE_VIDEO_QA_MATERIAL_WARNING(`${_.join(qaReasons, SOURCE_TEXT_SYMBOL_4)}`);
              scene.cinematicTakeDecision = SOURCE_TEXT_USE;
              scene.cinematicTakeDecisionReason = SOURCE_TEXT_BEST_AVAILABLE_TAKE_AFTER_SINGLE_RETRY;
              const retainedRevision = _.findLast(scene.assetRevisions);
              if (retainedRevision) {
                retainedRevision.status = SceneAssetStatus.Approved;
                retainedRevision.approvedAt = new Date().toISOString();
              }
              break;
            }
            const rejectedRevision = _.findLast(scene.assetRevisions);
            if (rejectedRevision) rejectedRevision.status = SceneAssetStatus.Rejected;
            scene.assetStatus = SceneAssetStatus.Retrying;
            appendLog(PF.formatVideoQaRetrying(scene.id, qaAttempt + 1, PIPELINE_GUARANTEE_CONFIG.VIDEO_QA_REGENERATION_ATTEMPTS));
            const requestContext = createSceneRequestContext(scene, GenerateType.Video);
            const retryPrompt = await requestAiRewrittenVideoPrompt(scene, cinematicPreflightPrompts.get(scene.id) || requestContext.prompt, qaReasons);
            scene.generationPrompt = retryPrompt;
            const retryResult = await generateProjectImageOnce(
              { sceneId: scene.id, idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash, SOURCE_TEXT_QA, qaAttempt], CINEMATIC_CHAT_PLANNING_CONFIG.ROOM_KEY_SEPARATOR), prompt: retryPrompt, referenceImages: requestContext.referenceImages, generateType: GenerateType.Video },
              () => ({
                prompt: retryPrompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: true,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, referenceImages: requestContext.referenceImages, referenceImageNames: requestContext.referenceImageNames, referenceCharacterNames: requestContext.referenceCharacterNames, generateType: GenerateType.Video },
              }),
              requestSignal,
            );
            const retryAssetUrl = createProjectImageUrl(retryResult);
            if (!retryResult.success || !isPersistedProjectVideoUrl(retryAssetUrl)) {
              if (retryResult.remoteMediaCreated && !_.isEmpty(retryResult.remoteMediaId)) {
                scene.remoteVideoMediaId = retryResult.remoteMediaId;
                scene.remoteVideoMediaIds = retryResult.remoteMediaIds;
                scene.remoteVideoExpectedCount = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT;
                scene.remoteVideoDownloadPending = true;
                await persistImageCheckpoint();
              }
              scene.assetError = retryResult.warning || FLOW_VIDEO_MEDIA_CONFIG.PERSISTENCE_ERROR;
              continue;
            }
            scene.assetUrl = retryAssetUrl;
            scene.assetUrls = !_.isEmpty(retryResult.fallbackUrls) ? retryResult.fallbackUrls : [retryAssetUrl];
            scene.assetType = GenerateType.Video;
            scene.assetStatus = SceneAssetStatus.Generated;
            scene.remoteVideoMediaId = retryResult.remoteMediaId;
            scene.remoteVideoMediaIds = retryResult.remoteMediaIds;
            scene.remoteVideoExpectedCount = FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT;
            scene.remoteVideoDownloadPending = false;
            const retryRevision = appendAssetRevision(scene, retryAssetUrl, SceneAssetStatus.Generated);
            retryRevision.operation = SOURCE_TEXT_RETRY;
            await persistImageCheckpoint();
          }
        }
        await persistImageCheckpoint();
      }
      await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {}).catch(() => undefined);
      const technicallyValidScenes = _.filter(realScenes as StoryboardScene[], (scene) => (isCinematicEpisodeGenre(config.genre) ? isCinematicVideoTakeRenderable(scene) : _.every([hasSceneAsset(scene), _.includes([QaStatus.Passed, QaStatus.Unavailable], scene.qaStatus) && _.includes([AssetAcceptance.Approved, AssetAcceptance.AcceptedWithWarning], scene.acceptance)], Boolean)));
      const cinematicQaAdvisoryScenes = isCinematicEpisodeGenre(config.genre) ? _.filter(technicallyValidScenes, (scene) => _.isEqual(scene.qaStatus, QaStatus.Failed) || _.isEqual(scene.acceptance, AssetAcceptance.Rejected)) : [];
      if (!_.isEmpty(cinematicQaAdvisoryScenes)) {
        appendLog(_.replace(cinematicProgressMessages.VIDEO_QA_ADVISORY, SecurityConstants.PLACEHOLDER_0, _.toString(cinematicQaAdvisoryScenes.length)));
      }
      const validationSceneIds = new Set(_.map(technicallyValidScenes, SOURCE_TEXT_ID));
      _.forEach(technicallyValidScenes, (scene) => {
        scene.assetStatus = SceneAssetStatus.Approved;
        if (!scene.qaStatus) scene.qaStatus = QaStatus.Unavailable;
        if (!scene.acceptance) scene.acceptance = AssetAcceptance.AcceptedWithWarning;
        if (!scene.assetError && scene.qaStatus === QaStatus.Unavailable) scene.assetError = SOURCE_TEXT_VISUAL_QA_UNAVAILABLE;
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
          const persisted = await pipelineSystemFetch(SOURCE_TEMPLATE_SYMBOL_33(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}`, `${voiceUpdatedProj.id}`, `${REFERENCE_ASSET_GROUP.UPSCALED}`), { images: [dataUrl] }, requestSignal);
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
          const targetedProject = await syncProject({ ...voiceUpdatedProj, status: REFACTOR_CONSTANTS.STATUS_PARTIAL, activeRunId: undefined, storyboard: realScenes as VideoProject["storyboard"] });
          setActiveCreatedProject(targetedProject);
          if (!_.isEmpty(targetedTakeIssues)) {
            throw new Error(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_DOAN_VIDEO_DA_DUOC_TAI_NHUNG(`${_.join(targetedTakeIssues, SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_THE_CLIP_WAS_DOWNLOADED_BUT_DID(`${_.join(targetedTakeIssues, SOURCE_TEXT_SYMBOL_10)}`));
          }
          appendLog(PF.formatApprovedScenesReady(_.join(_.map(targetedScenes, SOURCE_TEXT_ID), SOURCE_TEXT_SYMBOL_10)));
          setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);
          return;
        }
        const expectedClipCount = Math.max(1, Math.ceil(parseTargetDurationSeconds(config.duration) / resolveCinematicClipDuration(config.videoDuration)));
        const takeIssues = getCinematicGeneratedTakeIssues(realScenes as StoryboardScene[], expectedClipCount);
        if (!_.isEmpty(takeIssues)) {
          await syncProject({ ...voiceUpdatedProj, status: REFACTOR_CONSTANTS.STATUS_PARTIAL, storyboard: realScenes as VideoProject["storyboard"] });
          throw new Error(config.language === ProjectLanguage.VI ? SOURCE_TEMPLATE_CHUA_DU_CANH_QUAY_DAT_CHUAN(`${_.join(_.take(takeIssues, 20), SOURCE_TEXT_SYMBOL_10)}`) : SOURCE_TEMPLATE_APPROVED_TAKES_ARE_INCOMPLETE_RENDER_IS(`${_.join(_.take(takeIssues, 20), SOURCE_TEXT_SYMBOL_10)}`));
        }
      }
      const sceneAssetSummary = getSceneAssetSummary(realScenes as StoryboardScene[]);
      if (isCinematicEpisodeGenre(config.genre) && _.isEmpty(realScenes)) {
        throw new Error(PF.ERROR_NO_READY_VIDEOS_FOR_EDITING);
      }
      if (!sceneAssetSummary.complete) {
        await syncProject({ ...voiceUpdatedProj, status: REFACTOR_CONSTANTS.STATUS_PARTIAL, storyboard: realScenes as VideoProject["storyboard"] });
        throw new Error(_.replace(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_INCOMPLETE, SecurityConstants.PLACEHOLDER_0, _.toString(_.size(sceneAssetSummary.missingSceneIds))));
      }
      const completedMedia = getSceneAssetSummary(realScenes as StoryboardScene[]);
      appendLog(PF.formatReceivedSceneAssets(completedMedia.complete, completedMedia.completed, completedMedia.total));
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.IMAGE_DONE);
      const imageUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], thumbnails: unifiedBatchThumbnails || voiceUpdatedProj.thumbnails };
      await syncProject(imageUpdatedProj);
      let seoData: unknown = preparedSeoData;
      if (cachedSeoData) appendLog(T.logResumeSeo);
      if (!preparedSeoData) {
        if (seoRes?.success && seoRes.data) {
          seoData = seoRes.data;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_SUCCESS);
        } else {
          seoData = undefined;
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
        let parsedThumbs: ThumbnailItem[] = _.cloneDeep(unifiedBatchThumbnails || []);
        if (!_.isEmpty(parsedThumbs)) {
          appendLog(T.logResumeThumbnails);
        } else if (config.resumeMode && !shouldRegenerateThumbnails && !_.isEmpty(existingThumbs)) {
          parsedThumbs = existingThumbs;
          appendLog(T.logResumeThumbnails);
        } else if (!thumbnailPlanningAttempted) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
          const thumbPayload = { rewrittenScript: realScript, config: imageUpdatedProj.config, visualConfig: { ...imageUpdatedProj.visualConfig, thumbnailReferencePrompt: currentThumbnailStyle }, bypassCache: true, roomWorkerId: CINEMATIC_ROOM_STAGE.THUMBNAIL, projectId: newProjectId, pipelineRunId: pipelineArtifactRunId };
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
                const thumbPrompt = resolveThumbnailGenerationPrompt(thumb, isCinematicPipeline, thumbnailStyle, config.aspectRatio, !_.isEmpty(resolvedThumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
                const generationPrompt = thumbPrompt;
                thumb.generationPrompt = generationPrompt;
                return { sceneId: thumb.id, prompt: generationPrompt, generateType: GenerateType.Image, referenceImages: resolvedThumbnailReferenceImages, continuityKey: createThumbnailContinuityKey() };
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
                visualConfig: { ...thumbnailVisualConfigPayload, style: currentThumbnailStyle || currentStylePreset, referenceImages: resolvedThumbnailReferenceImages, batchTabCount: SecurityConstants.DEFAULT_AMOUNT },
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
                    visualConfig: { ...thumbnailVisualConfigPayload, generateType: GenerateType.Image, imageGeneratorEngine: ImageGeneratorEngine.Imagen, style: currentThumbnailStyle || currentStylePreset, referenceImages: resolvedThumbnailReferenceImages },
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
                const thumbPrompt = resolveThumbnailGenerationPrompt(thumb, isCinematicPipeline, thumbnailStyle, config.aspectRatio, !_.isEmpty(resolvedThumbnailReferenceImages), imageUpdatedProj.visualConfig.characters);
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
                      visualConfig: { ...thumbnailVisualConfigPayload, style: thumbnailStyle, referenceImages: resolvedThumbnailReferenceImages },
                    },
                    requestSignal,
                  );
                  let imgUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
                  if (renderThumbRes.success && renderThumbRes.data?.base64) imgUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, renderThumbRes.data.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
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
        appendLog(PF.LOG_THUMBNAIL_SYNCED);
      }
      for (const thumbnail of thumbnailsList) {
        if (!isUsableGeneratedAssetUrl(thumbnail.imageUrl)) {
          thumbnail.approved = false;
          continue;
        }
        _.assign(thumbnail, acceptGeneratedThumbnail(thumbnail));
        let thumbnailQa = await validateSceneImage(newProj.id, { id: thumbnail.id, script: realScript, prompt: thumbnail.prompt, generationPrompt: thumbnail.generationPrompt, assetUrl: thumbnail.imageUrl, expectedSubjectCount: undefined, allowBackgroundPeople: true, visualIntent: thumbnail.subjectFocus, visibleAction: thumbnail.layoutRationale, storyEvidence: thumbnail.textText }, undefined, [], {
          purpose: SOURCE_TEXT_THUMBNAIL,
          expectedHeadline: thumbnail.hasText ? thumbnail.textText : "",
          layoutId: thumbnail.layoutId || thumbnail.layout,
          typographyId: thumbnail.typographyId || thumbnail.typography,
        });
        const thumbnailRegenerationReasons = thumbnailQa.quality ? getSceneVisualRegenerationReasons(thumbnailQa.quality, true) : [];
        if (!isCinematicPipeline && thumbnailQa.success && !_.isEmpty(thumbnailRegenerationReasons) && thumbnail.generationPrompt) {
          const reasons = _.uniq(_.compact([...thumbnailRegenerationReasons, thumbnail.hasText ? SOURCE_TEXT_RENDER_THE_EXACT_REQUIRED_HEADLINE_ONCE : "", SOURCE_TEXT_THUMBNAIL_MUST_MATCH_THE_STORY_AND]));
          const retryPrompt = await requestAiRewrittenVisualPrompt({ id: thumbnail.id, script: realScript, prompt: thumbnail.prompt, generationPrompt: thumbnail.generationPrompt, visualIntent: thumbnail.subjectFocus, visibleAction: thumbnail.layoutRationale, storyEvidence: thumbnail.textText }, thumbnail.generationPrompt, reasons, SOURCE_TEXT_THUMBNAIL);
          const retryResult = await generateProjectImageOnce(
            { sceneId: thumbnail.id, prompt: retryPrompt, generateType: GenerateType.Image, referenceImages: [], continuityKey: createThumbnailContinuityKey() },
            (item) => ({ prompt: item.prompt, style: currentThumbnailStyle || currentStylePreset, resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD, bypassCache: true, engine: ImageGeneratorEngine.Imagen, sandboxConfig: sandboxConfigPayload, visualConfig: { ...thumbnailVisualConfigPayload, generateType: GenerateType.Image, imageGeneratorEngine: ImageGeneratorEngine.Imagen } }),
            requestSignal,
          );
          const retryUrl = createProjectImageUrl(retryResult);
          if (retryResult.success && !_.isEmpty(retryUrl)) {
            thumbnail.imageUrl = retryUrl;
            thumbnail.generationPrompt = retryPrompt;
            thumbnailQa = await validateSceneImage(newProj.id, { id: thumbnail.id, script: realScript, prompt: thumbnail.prompt, generationPrompt: retryPrompt, assetUrl: retryUrl, expectedSubjectCount: undefined, allowBackgroundPeople: true, visualIntent: thumbnail.subjectFocus, visibleAction: thumbnail.layoutRationale, storyEvidence: thumbnail.textText }, undefined, [], {
              purpose: SOURCE_TEXT_THUMBNAIL,
              expectedHeadline: thumbnail.hasText ? thumbnail.textText : "",
              layoutId: thumbnail.layoutId || thumbnail.layout,
              typographyId: thumbnail.typographyId || thumbnail.typography,
            });
          }
        }
        if (thumbnailQa.success) {
          thumbnail.qa = thumbnailQa.quality as any;
          const thumbnailHasMaterialDefect = !_.isEmpty(getSceneVisualRegenerationReasons(thumbnailQa.quality!, true));
          thumbnail.qaStatus = isCinematicPipeline || !thumbnailHasMaterialDefect ? QaStatus.Passed : QaStatus.Failed;
          thumbnail.approved = isCinematicPipeline || !thumbnailHasMaterialDefect;
          thumbnail.acceptance = isCinematicPipeline && thumbnailHasMaterialDefect ? AssetAcceptance.AcceptedWithWarning : thumbnailHasMaterialDefect ? AssetAcceptance.Rejected : thumbnailQa.approved ? AssetAcceptance.Approved : AssetAcceptance.AcceptedWithWarning;
        }
      }
      const completedThumbnailCount = _.size(_.filter(thumbnailsList, (thumbnail) => thumbnail.approved && !_.isEmpty(thumbnail.imageUrl)));
      if (_.lt(completedThumbnailCount, config.thumbnailCount)) appendLog(_.replace(REFACTOR_CONSTANTS.THUMBNAIL_GENERATION_INCOMPLETE, SecurityConstants.PLACEHOLDER_0, _.toString(_.subtract(config.thumbnailCount, completedThumbnailCount))));
      else appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SUCCESS);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(_.size(_.get(seoData, SOURCE_TEXT_TITLES, [])), _.size(thumbnailsList)));
      let slicedUpdatedProj: VideoProject = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList, storyboard: realScenes as VideoProject["storyboard"] };
      if (globalAudioBase64 && alignmentCompleted) appendLog(T.logResumeAlignment);
      await syncProject(slicedUpdatedProj);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE);
      const voiceQualityResult = nativeFilmAudio ? null : await assessVoiceAdvisory({ audioBase64: globalAudioBase64, audioUrl: globalAudioUrl, provider: _.toString(voiceUpdatedProj.voiceConfig.provider || config.voiceProvider), scenes: realScenes as StoryboardScene[], targetDurationSeconds: parseTargetDurationSeconds(config.duration) });
      if (voiceQualityResult) {
        globalAudioBase64 = voiceQualityResult.audioBase64;
        globalAudioUrl = voiceQualityResult.audioUrl;
        realScenes = voiceQualityResult.scenes;
      } else {
        globalAudioBase64 = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        globalAudioUrl = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(PF.LOG_AI_FILM_PRESERVE_AUDIO);
      }
      slicedUpdatedProj = { ...slicedUpdatedProj, audioCueSheet: applyOptionalMusicAsset(createAudioCueSheet(realScenes, config.genre), config.musicAssetUrl) };
      if (nativeFilmAudio) {
        realScenes = _.map(realScenes as StoryboardScene[], (scene) => ({ ...scene, subtitle: hasCinematicSceneDialogue(scene) ? _.trim(scene.spokenDialogue || scene.subtitle) : REFACTOR_CONSTANTS.VD_EMPTY_STRING, subtitleCues: [] }));
      } else {
        realScenes = createSubtitleCues(realScenes as StoryboardScene[]);
      }
      const effectiveSubtitleMode = isCinematicPipeline ? _.defaultTo(config.subtitleMode, SubtitleMode.None) : FFMPEG_RENDER_CONSTANTS.DEFAULT_SUBTITLE_MODE;
      const subtitleQa = evaluateSubtitles(realScenes as StoryboardScene[], effectiveSubtitleMode);
      const editorQa = evaluateEdit(realScenes as StoryboardScene[]);
      slicedUpdatedProj = { ...slicedUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], subtitleQa, editorQa, voiceConfig: { ...slicedUpdatedProj.voiceConfig, audioBase64: globalAudioBase64, audioUrl: globalAudioUrl, provider: voiceQualityResult?.provider || SOURCE_TEXT_NATIVE_VIDEO_AUDIO, voiceArc: genreVoiceArc, audioQa: voiceQualityResult?.quality } };
      await syncProject(slicedUpdatedProj);
      setCurrentStepIndex(4);
      appendLog(nativeFilmAudio ? PF.STEP_EDITORIAL_CUTTING_AUDIO : PF.STEP_EDITORIAL_ALIGNING_RENDER);
      let cinematicEditorialReviewAvailable = false;
      let cinematicLibraryAnalysisAvailable = false;
      if (nativeFilmAudio) {
        let clipAnalysis = await pipelineSystemFetch(
          API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
          {
            projectId: newProj.id,
            language: config.language,
            scenes: _.map(realScenes as StoryboardScene[], (scene) =>
              _.pick(scene, [
                SOURCE_TEXT_ID,
                SOURCE_TEXT_SCRIPT,
                SOURCE_TEXT_SUBTITLE,
                SOURCE_TEXT_NARRATIVEROLE,
                SOURCE_TEXT_STORYQUESTION,
                SOURCE_TEXT_STORYCHANGE,
                SOURCE_TEXT_ISFILMINTRO,
                SOURCE_TEXT_INTROTITLE,
                SOURCE_TEXT_GENERATIONPROMPT,
                SOURCE_TEXT_ASSETURL,
                SOURCE_TEXT_ASSETTYPE,
                SOURCE_TEXT_VISUALINTENT,
                SOURCE_TEXT_VISIBLEACTION,
                SOURCE_TEXT_REACTION,
                SOURCE_TEXT_STORYEVIDENCE,
                SOURCE_TEXT_SHOTPURPOSE,
                SOURCE_TEXT_SHOTROLE,
                SOURCE_TEXT_DIALOGUEMODE,
                SOURCE_TEXT_SPOKENDIALOGUE,
                SOURCE_TEXT_CHARACTERBLOCKING,
                SOURCE_TEXT_EYELINEDIRECTION,
                SOURCE_TEXT_SCREENDIRECTION,
                SOURCE_TEXT_ACTIONSTARTSTATE,
                SOURCE_TEXT_ACTIONENDSTATE,
                SOURCE_TEXT_LOCATIONSTATE,
                SOURCE_TEXT_WARDROBESTATE,
                SOURCE_TEXT_PROPSTATE,
                SOURCE_TEXT_CINEMATICBEATS,
                SOURCE_TEXT_CINEMATICCONTINUITYHANDOFF,
              ]),
            ),
          },
          requestSignal,
        );
        for (let reviewAttempt = 1; reviewAttempt < CINEMATIC_EDIT_ANALYSIS_CONFIG.EDITORIAL_REVIEW_ATTEMPTS && (!clipAnalysis.success || (!clipAnalysis.data?.editorialReviewAvailable && !clipAnalysis.data?.editorialReviewError)); reviewAttempt++) {
          appendLog(PF.LOG_EDITORIAL_RETRY_ANALYSIS);
          clipAnalysis = await pipelineSystemFetch(
            API_ROUTES.PIPELINE_ANALYZE_CINEMATIC_CLIPS,
            {
              projectId: newProj.id,
              language: config.language,
              scenes: _.map(realScenes as StoryboardScene[], (scene) =>
                _.pick(scene, [
                  SOURCE_TEXT_ID,
                  SOURCE_TEXT_SCRIPT,
                  SOURCE_TEXT_SUBTITLE,
                  SOURCE_TEXT_NARRATIVEROLE,
                  SOURCE_TEXT_STORYQUESTION,
                  SOURCE_TEXT_STORYCHANGE,
                  SOURCE_TEXT_ISFILMINTRO,
                  SOURCE_TEXT_INTROTITLE,
                  SOURCE_TEXT_GENERATIONPROMPT,
                  SOURCE_TEXT_ASSETURL,
                  SOURCE_TEXT_ASSETTYPE,
                  SOURCE_TEXT_VISUALINTENT,
                  SOURCE_TEXT_VISIBLEACTION,
                  SOURCE_TEXT_REACTION,
                  SOURCE_TEXT_STORYEVIDENCE,
                  SOURCE_TEXT_SHOTPURPOSE,
                  SOURCE_TEXT_SHOTROLE,
                  SOURCE_TEXT_DIALOGUEMODE,
                  SOURCE_TEXT_SPOKENDIALOGUE,
                  SOURCE_TEXT_CHARACTERBLOCKING,
                  SOURCE_TEXT_EYELINEDIRECTION,
                  SOURCE_TEXT_SCREENDIRECTION,
                  SOURCE_TEXT_ACTIONSTARTSTATE,
                  SOURCE_TEXT_ACTIONENDSTATE,
                  SOURCE_TEXT_LOCATIONSTATE,
                  SOURCE_TEXT_WARDROBESTATE,
                  SOURCE_TEXT_PROPSTATE,
                  SOURCE_TEXT_CINEMATICBEATS,
                  SOURCE_TEXT_CINEMATICCONTINUITYHANDOFF,
                ]),
              ),
              reviewAttempt: reviewAttempt + 1,
            },
            requestSignal,
          );
        }
        if (clipAnalysis.success && _.isArray(clipAnalysis.data?.decisions)) {
          cinematicLibraryAnalysisAvailable = Boolean(clipAnalysis.data?.libraryAnalysisAvailable);
          realScenes = applyCinematicClipAnalysisDecisions(realScenes as StoryboardScene[], clipAnalysis.data.decisions);
          const keptScenes = _.reject(realScenes, (scene) => _.isEqual(scene.cinematicTakeDecision, SOURCE_TEXT_OMIT));
          const omittedScenes = _.filter(realScenes, (scene) => _.isEqual(scene.cinematicTakeDecision, SOURCE_TEXT_OMIT));
          const sourceDuration = _.sumBy(realScenes, (scene) => _.toNumber(scene.duration));
          const selectedDuration = _.sumBy(keptScenes, (scene) => (_.isNumber(scene.cinematicSelectedDuration) ? scene.cinematicSelectedDuration : _.max([0, _.toNumber(scene.duration) - _.toNumber(scene.sourceTrimStartSeconds) - _.toNumber(scene.sourceTrimEndSeconds)]) || 0));
          const protectedDialogueCount = _.size(_.filter(keptScenes, (scene) => hasCinematicSceneDialogue(scene) && scene.cinematicSpeechAnalysisAvailable && _.gt(scene.cinematicDialogueCoverageRatio || 0, 0)));
          const repeatedOmittedCount = _.size(_.filter(omittedScenes, (scene) => _.includes(scene.clipQaWarnings, SOURCE_TEXT_REPEATED_VISUAL_CONTENT_OMITTED)));
          const wrongDialogueCount = _.size(_.filter(omittedScenes, (scene) => scene.cinematicDialogueMismatch));
          if (clipAnalysis.data?.editorialReviewAvailable) {
            cinematicEditorialReviewAvailable = true;
            appendLog(PF.formatEditorialAiSummary(realScenes.length, keptScenes.length, omittedScenes.length, _.round(sourceDuration, 1), _.round(selectedDuration, 1), protectedDialogueCount, repeatedOmittedCount, wrongDialogueCount));
          } else {
            appendLog(cinematicLibraryAnalysisAvailable ? PF.formatEditorialAutoSummary(keptScenes.length, omittedScenes.length, _.round(sourceDuration, 1), _.round(selectedDuration, 1), wrongDialogueCount) : PF.formatEditorialTechCheck(realScenes.length));
          }
        }
        slicedUpdatedProj = await syncProject({ ...slicedUpdatedProj, storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"] });
      }
      await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {}).catch(() => undefined);
      if (!planningRoomClosedBeforeVideo && _.isEqual(resolvedAiExecution.mode, AiPlanningExecutionMode.RoomOnly) && !_.isEqual(resolvedAiExecution.provider, AiPlanningFallbackProvider.Disabled) && !_.isEmpty(newProjectId)) {
        await safeSystemFetch(API_ROUTES.PIPELINE_CLOSE_CHAT_PLANNING_ROOMS, { provider: resolvedAiExecution.provider, projectId: newProjectId, workerIds: _.values(CINEMATIC_ROOM_STAGE) }).catch(() => undefined);
        planningRoomClosedBeforeVideo = true;
        appendLog(PF.LOG_AI_SCRIPT_READY_FOR_VIDEO);
      }
      let acceptedScenes = nativeFilmAudio ? _.reject(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.cinematicTakeDecision, SOURCE_TEXT_OMIT)) : (realScenes as StoryboardScene[]);
      if (nativeFilmAudio && cinematicEditorialReviewAvailable) {
        const dialogueTakeIssues = getCinematicDialogueTakeIssues(acceptedScenes);
        if (!_.isEmpty(dialogueTakeIssues)) {
          const failedDialogueSceneIds = new Set(_.map(dialogueTakeIssues, (issue) => _.head(_.split(issue, SOURCE_TEXT_SYMBOL_16))));
          _.forEach(realScenes, (scene) => {
            if (!failedDialogueSceneIds.has(scene.id)) return;
            scene.qaStatus = QaStatus.Passed;
            scene.acceptance = AssetAcceptance.AcceptedWithWarning;
            scene.assetStatus = SceneAssetStatus.Approved;
            scene.assetError = _.join(
              _.filter(dialogueTakeIssues, (issue) => _.startsWith(issue, SOURCE_TEMPLATE_SYMBOL_34(`${scene.id}`))),
              SOURCE_TEXT_SYMBOL_10,
            );
          });
          await persistImageCheckpoint();
          appendLog(PF.formatDialogueSceneAdvisories(_.join([...failedDialogueSceneIds], SOURCE_TEXT_SYMBOL_10)));
          acceptedScenes = _.reject(realScenes as StoryboardScene[], (scene) => _.isEqual(scene.cinematicTakeDecision, SOURCE_TEXT_OMIT));
        }
      }
      const editedTimeline = nativeFilmAudio ? createCinematicEditTimeline(acceptedScenes) : acceptedScenes;
      const renderableScenes = editedTimeline;
      const omittedCount = _.subtract(realScenes.length, acceptedScenes.length);
      if (omittedCount > 0) appendLog(PF.formatEditorialOmittedSummary(omittedCount));
      const expectedRenderDuration = nativeFilmAudio ? _.sumBy(renderableScenes, (scene) => _.max([SecurityConstants.ZERO, _.toNumber(scene.duration)]) || SecurityConstants.ZERO) : calculateSceneDuration(renderableScenes);
      if (nativeFilmAudio) {
        const storyCheckText = cinematicEditorialReviewAvailable ? PF.STORY_CHECK_AI : cinematicLibraryAnalysisAvailable ? PF.STORY_CHECK_LIBRARY : PF.STORY_CHECK_SAFE;
        appendCinematicLog(PF.formatEditorialTimelineSummary(countCinematicTimelineShots(acceptedScenes), acceptedScenes.length, _.round(expectedRenderDuration, 1), storyCheckText), CINEMATIC_PROGRESS_STAGE.VIDEO);
      }
      appendLog(T.logRenderPlan(_.size(renderableScenes), expectedRenderDuration, !_.isEmpty(globalAudioBase64) || !_.isEmpty(globalAudioUrl)));
      const renderPayload = {
        projectId: newProj.id,
        expectedSourceSceneIds: _.map(acceptedScenes, SOURCE_TEXT_ID),
        expectedDurationSeconds: expectedRenderDuration,
        scenes: _.map(renderableScenes, (sc) => ({
          id: _.get(sc, REFACTOR_CONSTANTS.AVG_ID_KEY),
          duration: _.get(sc, SOURCE_TEXT_DURATION) || AUTO_GENERATOR_CONSTANTS.DEFAULT_SCENE_DURATION,
          imageUrl: _.get(sc, SOURCE_TEXT_ASSETURL),
          audioBase64: _.isEmpty(globalAudioBase64) && _.isEmpty(globalAudioUrl) ? _.get(sc, SOURCE_TEXT_AUDIOBASE64) : undefined,
          text: nativeFilmAudio ? undefined : _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
          subtitle: nativeFilmAudio ? _.trim(sc.spokenDialogue) || undefined : sc.subtitle || sc.script,
          subtitleCues: sc.subtitleCues,
          assetType: _.get(sc, REFACTOR_CONSTANTS.AVG_ASSET_TYPE_KEY, GenerateType.Image),
          cameraMotion: _.get(sc, SOURCE_TEXT_CAMERAMOTION),
          effects: _.get(sc, SOURCE_TEXT_EFFECTS),
          lightingEffect: _.get(sc, SOURCE_TEXT_LIGHTINGEFFECT),
          transition: _.get(sc, SOURCE_TEXT_TRANSITION),
          shotPurpose: _.get(sc, SOURCE_TEXT_SHOTPURPOSE),
          visibleAction: _.get(sc, SOURCE_TEXT_VISIBLEACTION),
          reaction: _.get(sc, SOURCE_TEXT_REACTION),
          sourceTrimStartSeconds: sc.sourceTrimStartSeconds,
          sourceTrimEndSeconds: sc.sourceTrimEndSeconds,
          sourceCrop: sc.sourceCrop,
          cinematicTakeDecision: sc.cinematicTakeDecision,
          cinematicAudioBridgeMode: sc.cinematicAudioBridgeMode,
          cinematicDialogueDetected: sc.cinematicDialogueDetected,
        })),
        quality: config.ffmpegQuality,
        globalAudioUrl: globalAudioUrl || undefined,
        globalAudioBase64: globalAudioBase64 || undefined,
        aspectRatio: _.isEqual(config.aspectRatio, AspectRatio.NineSixteen) ? FFMPEG_RENDER_CONSTANTS.ASPECT_RATIO_9_16 : REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_16_9,
        subtitleMode: effectiveSubtitleMode,
        audioTracks: createRenderAudioTracks(slicedUpdatedProj.audioCueSheet),
        autoMusicProfile: _.isEmpty(config.musicAssetUrl) ? resolveAutomaticMusicProfile(config.genre) : undefined,
        preserveVideoAudio: nativeFilmAudio,
      };
      throwIfCancelled();
      const renderRes = await fetch(API_ROUTES.PIPELINE_FFMPEG_RENDER, { method: REFACTOR_CONSTANTS.HTTP_METHOD_POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON, [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING }, body: jsonUtils.safeStringify(renderPayload), signal: requestSignal });
      const renderText = await renderRes.text();
      const renderData = jsonUtils.safeParse<{ success: boolean; jobId?: string; error?: string }>(renderText, { success: false });
      if (renderData.success && renderData.jobId) {
        const jobId = renderData.jobId;
        activeRenderJobIdRef.current = jobId;
        await syncProject({ ...slicedUpdatedProj, storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"], generationCheckpoint: { intent: runIntent, phase: SOURCE_TEXT_RENDERING, lastSuccessfulPhase: SOURCE_TEXT_MEDIA, completedSceneIds: _.map(renderableScenes, SOURCE_TEXT_ID), pendingSceneIds: [], failedSceneIds: [], renderJobId: jobId, updatedAt: new Date().toISOString() } });
        appendLog(T.logRenderJob(jobId));
        let lastLoggedProgress: number | null = null;
        let renderPending = true;
        let renderStatusFailureCount = SecurityConstants.ZERO;
        while (renderPending) {
          throwIfCancelled();
          let statusData: { success: boolean; status: string; progress?: number; url?: string; error?: string };
          try {
            const statusRes = await fetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER_STATUS}${jobId}`, { headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING }, signal: requestSignal });
            if (!statusRes.ok) throw new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED);
            statusData = await statusRes.json();
            renderStatusFailureCount = SecurityConstants.ZERO;
          } catch (statusError) {
            renderStatusFailureCount = _.add(renderStatusFailureCount, SecurityConstants.DEFAULT_AMOUNT);
            if (_.gt(renderStatusFailureCount, REFACTOR_CONSTANTS.RENDER_STATUS_MAX_RETRIES)) throw statusError;
            appendLog(SOURCE_TEMPLATE_SYMBOL_35(`${REFACTOR_CONSTANTS.MSG_RENDER_STATUS_RETRY_PREFIX}`, `${renderStatusFailureCount}`, `${REFACTOR_CONSTANTS.RENDER_STATUS_MAX_RETRIES}`));
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
              const finalQaResponse = await pipelineSystemFetch(API_ROUTES.PIPELINE_VALIDATE_FINAL_VIDEO, { videoUrl: statusData.url, script: realScript, viewerPromise: _.get(newProj.narrativePlan, SOURCE_TEXT_VIEWERPROMISE), duration: config.duration, genre: config.genre, bypassCache: true }, requestSignal);
              if (finalQaResponse.success && finalQaResponse.data?.quality) {
                finalMultimodalQa = { ...finalQaResponse.data.quality, reviewAvailable: true };
              }
            }
            const renderCandidateBase: VideoProject = { ...slicedUpdatedProj, storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"], seo: _.defaultTo(seoData as VideoProject["seo"], undefined), thumbnails: _.defaultTo(thumbnailsList, undefined), renderedVideoUrl: statusData.url, finalMultimodalQa };
            const renderCandidateProj: VideoProject = { ...renderCandidateBase, manualReviewItems: createManualReviewItems(renderCandidateBase) };
            const finalQc = evaluateFinalQuality(renderCandidateProj);
            const benchmark = createPipelineBenchmark(renderCandidateProj, pipelineStartedAt);
            const shadowComparison = renderCandidateProj.rollout?.shadowMode ? createShadowComparison(existingTargetProj, { ...renderCandidateProj, benchmark }) : undefined;
            const renderCompletedProj = { ...renderCandidateProj, finalQc, benchmark, shadowComparison, status: finalQc.publishable ? REFACTOR_CONSTANTS.STATUS_COMPLETED : REFACTOR_CONSTANTS.STATUS_PARTIAL };
            renderCompletedProj.generationCheckpoint = { intent: runIntent, phase: finalQc.publishable ? REFACTOR_CONSTANTS.STATUS_COMPLETED : PIPELINE_COMPLETION_CONFIG.RENDERED_WITH_BLOCKERS_PHASE, lastSuccessfulPhase: SOURCE_TEXT_RENDER, completedSceneIds: _.map(realScenes, SOURCE_TEXT_ID), pendingSceneIds: [], failedSceneIds: [], renderJobId: null, updatedAt: new Date().toISOString() };
            setRenderedVideoUrl(statusData.url);
            appendCinematicLog(cinematicProgressMessages.VIDEO_READY, CINEMATIC_PROGRESS_STAGE.VIDEO);
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_SUCCESS, SecurityConstants.PLACEHOLDER_0, statusData.url));
            appendLog(finalQc.releaseStatus === SOURCE_TEXT_EDITORIALLY_PUBLISHABLE ? PF.LOG_RELEASE_READY_AUTO_EDITED : finalQc.releaseStatus === SOURCE_TEXT_COMPLETED_WITH_WARNINGS ? PF.formatReleaseReadyWithWarnings(finalQc.warnings.length) : PF.formatReleaseHasBlockers(finalQc.blockingErrors.length));
            appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
            await syncProject(renderCompletedProj);
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
      pipelineCompleted = true;
    } catch (error: unknown) {
      if (cancellationRef.current || (error instanceof DOMException && _.isEqual(error.name, SOURCE_TEXT_ABORTERROR))) {
        if (isCinematicPipeline) appendCinematicLog(cinematicProgressMessages.CANCELLED, cinematicProgressStage);
        else {
          appendLog(T.logCancelled);
          appendLog(T.logPipelineCancelledElapsed((Date.now() - pipelineStartedAt) / 1000));
        }
        const latestProject = activeProjectSnapshotRef.current || currentProject;
        if (latestProject) {
          const checkpointProgress = getGenerationCheckpointSceneProgress(latestProject);
          const cancelledProject = {
            ...latestProject,
            status: REFACTOR_CONSTANTS.STATUS_CANCELLED,
            activeRunId: null,
            lastRunId: pipelineArtifactRunId,
            generationLogs: _.clone(currentLogs),
            generationCheckpoint: { ...(latestProject.generationCheckpoint || { intent: runIntent, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }), phase: SOURCE_TEXT_INTERRUPTED, ...checkpointProgress, renderJobId: activeRenderJobIdRef.current, updatedAt: new Date().toISOString() },
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
      const errorMessage = getErrorMessage(error, REFACTOR_CONSTANTS.ERR_RENDER_FAILED);
      retainPlanningRoomsForResume = _.includes(errorMessage, CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MESSAGE) || _.includes(_.toString(_.get(error, SOURCE_TEXT_DIAGNOSTIC_MESSAGE)), CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_MESSAGE);
      const generationDiagnostic = { timestamp: new Date().toISOString(), message: errorMessage, detail: _.get(error, SOURCE_TEXT_DIAGNOSTIC) };
      const latestProject = activeProjectSnapshotRef.current || currentProject;
      const checkpointSourceProject = latestProject ? { ...latestProject, storyboard: _.isEmpty(latestCheckpointStoryboard) ? latestProject.storyboard : latestCheckpointStoryboard } : null;
      const checkpointProgress = checkpointSourceProject ? getGenerationCheckpointSceneProgress(checkpointSourceProject) : undefined;
      if (isCinematicPipeline) {
        const promptStoppedMessage = checkpointProgress
          ? cinematicProgressMessages.PROMPT_STOPPED.replace(SecurityConstants.PLACEHOLDER_0, _.toString(checkpointProgress.completedSceneIds.length))
              .replace(SecurityConstants.PLACEHOLDER_1, _.toString(checkpointSourceProject?.storyboard?.length || 0))
              .replace(SecurityConstants.PLACEHOLDER_2, formatSceneList(checkpointProgress.pendingSceneIds, config.language))
          : cinematicProgressMessages.PLANNING_STOPPED;
        const planningResponseFormatFailed = /chat_planning_invalid_(?:json_)?response/i.test(errorMessage);
        const stoppedMessage = planningResponseFormatFailed
          ? !_.isEmpty(checkpointSourceProject?.cinematicScriptArtifacts?.filmPackage) || !_.isEmpty(checkpointSourceProject?.storyboard)
            ? cinematicProgressMessages.PLANNING_FORMAT_STOPPED
            : cinematicProgressMessages.PLANNING_FORMAT_EMPTY
          : _.isEqual(cinematicProgressStage, CINEMATIC_PROGRESS_STAGE.VIDEO)
            ? checkpointProgress && !_.isEmpty(checkpointProgress.pendingSceneIds)
              ? cinematicProgressMessages.VIDEO_STOPPED.replace(SecurityConstants.PLACEHOLDER_0, _.toString(checkpointProgress.completedSceneIds.length))
                  .replace(SecurityConstants.PLACEHOLDER_1, _.toString(checkpointSourceProject?.storyboard?.length || SecurityConstants.ZERO))
                  .replace(SecurityConstants.PLACEHOLDER_2, formatSceneList(checkpointProgress.pendingSceneIds, config.language))
              : cinematicProgressMessages.VIDEO_RENDER_STOPPED
            : _.isEqual(cinematicProgressStage, CINEMATIC_PROGRESS_STAGE.PROMPT)
              ? promptStoppedMessage
              : _.replace(cinematicProgressMessages.PLANNING_STOPPED, SecurityConstants.PLACEHOLDER_0, _.toString(cinematicProgressStage));
        appendCinematicLog(stoppedMessage, cinematicProgressStage);
      } else {
        appendLog(AUTO_GENERATOR_CONSTANTS.ERR_AUTO_GEN_FAILED.replace(SecurityConstants.PLACEHOLDER_0, errorMessage));
        appendLog(T.logPipelineFailedElapsed((Date.now() - pipelineStartedAt) / 1000));
      }
      const failedProj = {
        ...(checkpointSourceProject || {}),
        id: latestProject?.id || REFACTOR_CONSTANTS.STATUS_FAILED,
        status: latestProject ? REFACTOR_CONSTANTS.STATUS_PARTIAL : REFACTOR_CONSTANTS.STATUS_FAILED,
        activeRunId: null,
        lastRunId: pipelineArtifactRunId,
        manualReviewItems: checkpointSourceProject ? createManualReviewItems(checkpointSourceProject) : [],
        generationLogs: _.clone(currentLogs),
        generationDiagnostics: _.concat(checkpointSourceProject?.generationDiagnostics || [], generationDiagnostic),
        generationCheckpoint: { ...(checkpointSourceProject?.generationCheckpoint || { intent: runIntent, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }), phase: SOURCE_TEXT_FAILED, ...checkpointProgress, renderJobId: activeRenderJobIdRef.current, updatedAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      } as VideoProject;
      setActiveCreatedProject(failedProj);
      await onUpdateProject(failedProj, true);
    } finally {
      const roomCleanupProjectId = _.toString(activeProjectSnapshotRef.current?.id || currentProject?.id || currentLogProjectId);
      if (pipelineCompleted && !retainPlanningRoomsForResume && _.isEqual(config.planningExecutionMode, AiPlanningExecutionMode.RoomOnly) && !_.isEqual(roomCleanupProvider, AiPlanningFallbackProvider.Disabled) && !_.isEmpty(roomCleanupProjectId)) {
        await safeSystemFetch(API_ROUTES.PIPELINE_CLOSE_CHAT_PLANNING_ROOMS, { provider: roomCleanupProvider, projectId: roomCleanupProjectId, workerIds: _.values(CINEMATIC_ROOM_STAGE) }).catch(() => undefined);
      }
      await safeSystemFetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, {}).catch((error) => logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, error));
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
      const checkpointProgress = getGenerationCheckpointSceneProgress(project);
      const cancelledProject: VideoProject = {
        ...project,
        status: REFACTOR_CONSTANTS.STATUS_CANCELLED,
        activeRunId: null,
        lastRunId: pipelineRunId,
        generationCheckpoint: { ...(project.generationCheckpoint || { intent: SOURCE_TEXT_NEW, completedSceneIds: [], pendingSceneIds: [], failedSceneIds: [] }), phase: SOURCE_TEXT_INTERRUPTED, ...checkpointProgress, renderJobId, updatedAt: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      };
      activeProjectSnapshotRef.current = cancelledProject;
      setActiveCreatedProject(cancelledProject);
      void Promise.resolve(onUpdateProject(cancelledProject, true)).catch((error) => logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, error));
    }
    requestAbortControllerRef.current?.abort();
    void safeSystemFetch(API_ROUTES.PIPELINE_CANCEL_ACTIVE_RUN, { projectId: project?.id, pipelineRunId, renderJobId }).catch((error) => logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, error));
  };
  const pipelineState: PipelineState = { isProcessing, isCancelling, currentStepIndex, stepProgress, logs, renderedVideoUrl, activeCreatedProject };
  const pipelineActions: PipelineActions = useMemo(() => ({ startPipeline, cancelPipeline, setActiveCreatedProject, setLogs, setRenderedVideoUrl }), [startPipeline, cancelPipeline]);
  return { pipelineState, pipelineActions, syncSelectedProject };
}
