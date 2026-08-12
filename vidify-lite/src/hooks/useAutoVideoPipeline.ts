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
  AudioCueStatus,
  AudioCueType,
} from "../types";
import { VideoQuality } from "../constants/enums";
import {
  API_ROUTES, CONTENT_TYPES, CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS,
  API_HEADERS, PIPELINE_CLIENT_ERRORS,
} from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_PROGRESS, FFMPEG_RENDER_CONSTANTS, REFERENCE_ASSET_GROUP, STYLE_EXTRACTION_CONFIG } from "../constants/config";
import { IMAGE_PROMPT_PIPELINE_VERSION } from "../constants/imagePromptRules";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { formatTimeHelper } from "../utils/helpers";
import { safeSystemFetch, generateRandomString } from "../lib/shared-utils";
import {
  createProjectImageUrl,
  generateProjectImages,
  getSceneAssetSummary,
  hasSceneAsset,
  isUsableGeneratedAssetUrl,
  resolveSceneGenerateType,
  selectVideoSceneIds,
  type ProjectImageResult,
} from "../services/projectImageGenerationService";
import { resolveVisualConfig } from "../services/autoVideoConfigResolver";
import { parseTargetDurationSeconds } from "../services/scriptQualityService";
import { DEFAULT_VOICE_ARC, evaluateEdit, evaluateSubtitles, evaluateThumbnail } from "../services/productionQualityService";
import { validateAudioQuality } from "../services/audioQualityService";
import { appendAssetRevision, createSceneDependencyHash, inheritApprovedSceneAsset } from "../services/dependencyHashService";
import { createManualReviewItems, evaluateFinalQuality } from "../services/finalQualityService";
import { migrateVideoProject } from "../services/projectMigrationService";
import { resolveQualityProfile } from "../services/qualityProfileService";
import { upscaleApprovedSceneAssets } from "../services/imageUpscaleService";
import { validateFinalVideo } from "../services/finalMultimodalQualityService";
import { createPipelineBenchmark, resolveRolloutConfig } from "../services/rolloutService";
import { createAudioCueSheet } from "../services/soundDesignService";
import { createRenderAudioTracks, validateAudioCueAssets } from "../services/audioMixService";
import { createShadowComparison } from "../services/shadowComparisonService";
import { appendImagePromptAspectRatio, evaluateImagePrompts } from "../services/imagePromptQualityService";
import { applyProfessionalEditingPolicy } from "../services/editingPolicyService";
import { createSceneGenerationContext, resolveSceneCharacterIds, SCENE_REFERENCE_CONFIG } from "../services/sceneReferenceService";
import { adaptImagePromptForEngine } from "../services/imageEngineAdapterService";
import { generateCharacterReferenceLibrary } from "../services/characterReferenceService";
import { normalizeCharacterLibrary, validateVisualContinuity } from "../services/visualContinuityService";
import { generateDirectedVoice } from "../services/voiceDirectionService";
import { createSubtitleCues } from "../services/subtitleService";
import { validateAndRepairVisualAsset } from "../services/visualAssetRepairService";
import { createThumbnailGenerationPrompt, resolveThumbnailReferenceImages } from "../services/thumbnailPromptService";
import { clearSceneVisualAsset } from "../services/projectRegenerationService";
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
  thumbnailTextInImageMode: TextInImageMode;
  thumbnailImageFocusMode: ImageFocusMode;
  thumbnailReferenceImages: string[];
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

const applyVoiceAlignments = (scenes: StoryboardScene[], alignments: Array<{ id: string; start: number; end: number; duration: number; audioBase64?: string; audioUrl?: string }>): StoryboardScene[] => _.map(scenes, scene => {
  const alignment = _.find(alignments, item => _.isEqual(item.id, scene.id));
  return alignment ? { ...scene, duration: alignment.duration, startTime: formatTimeHelper(alignment.start), endTime: formatTimeHelper(alignment.end), _start: alignment.start, _end: alignment.end, audioBase64: alignment.audioBase64, audioUrl: alignment.audioUrl } : scene;
});
const hasSameNamedCharacters = (scene: StoryboardScene, candidate: StoryboardScene): boolean => {
  const sceneCharacterIds = _.sortBy(_.uniq(_.compact(scene.characterIds)));
  const candidateCharacterIds = _.sortBy(_.uniq(_.compact(candidate.characterIds)));
  return !_.isEmpty(sceneCharacterIds) && _.isEqual(sceneCharacterIds, candidateCharacterIds);
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
    const availableMusicAssetUrl = config.musicAssetUrl || activeCreatedProject?.config.musicAssetUrl;
    if (_.isEmpty(availableMusicAssetUrl)) {
      alert(REFACTOR_CONSTANTS.ERR_SOUND_ASSET_MISSING);
      return;
    }
    config.musicAssetUrl = availableMusicAssetUrl;

    const pipelineTargetKey = _.toString(config.selectedProjectId || activeCreatedProject?.id || _.kebabCase(_.join([config.projectName, config.scriptContent], REFACTOR_CONSTANTS.VD_EMPTY_STRING)));
    const pipelineRunLease = acquirePipelineRunLease(pipelineTargetKey);
    if (!pipelineRunLease.acquired) {
      alert(REFACTOR_CONSTANTS.ERR_PIPELINE_ALREADY_RUNNING);
      return;
    }

    processingRef.current = true;
    cancellationRef.current = false;
    setIsCancelling(false);
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
      const requiresVisualReferenceMigration = _.some(
        existingTargetProj?.storyboard,
        scene => _.isEmpty(scene.layout) || _.isNil(scene.textAllowed),
      );
      let shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets || requiresVisualReferenceMigration;

      if (config.resumeMode && existingTargetProj) {
        newProjectId = existingTargetProj.id;
        newProj = {
          ...existingTargetProj,
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
            thumbnailReferencePrompt: config.thumbnailStylePreset,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            referenceImages: _.take(_.uniq(_.concat(config.referenceImages, config.sceneReferenceImages)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
            referencePrompt: config.stylePreset,
            characters: [],
          },
          seoConfig: { numTitles: 3, numDescriptions: 1, numHashtags: 5, numTags: 10 },
          creditsUsed: 0,
        };
      }

      const referenceGroups: Array<[string,string[]]> = await Promise.all(_.map([
        {group:"style",images:config.referenceImages,configKey:"styleReferenceImages"}, {group:"scene",images:config.sceneReferenceImages,configKey:"sceneReferenceImages"}, {group:"thumbnail",images:config.thumbnailReferenceImages,configKey:"thumbnailReferenceImages"},
      ], async ({group, images, configKey}): Promise<[string,string[]]> => {
        if (_.isEmpty(images)) return [group,_.defaultTo(_.get(newProj.visualConfig,configKey),[])];
        const response=await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${newProjectId}/${group}`,{images});
        if (!response.success) {
          throw new Error(response.error || PIPELINE_CLIENT_ERRORS.REFERENCE_PERSIST_TEMPLATE.replace("{group}", group));
        }
        return [group,_.defaultTo(response.data?.assets,[])];
      }));
      const canonicalReferences=_.fromPairs(referenceGroups);
      let musicAssetUrl = config.musicAssetUrl;
      if (_.startsWith(musicAssetUrl, "data:")) {
        const audioResponse = await safeSystemFetch(`${API_ROUTES.PIPELINE_REFERENCE_AUDIO}/${newProjectId}`, { audio: musicAssetUrl });
        if (!audioResponse.success || _.isEmpty(audioResponse.data?.assetUrl)) throw new Error(PIPELINE_CLIENT_ERRORS.AUDIO_REFERENCE_PERSIST_FAILED);
        musicAssetUrl = audioResponse.data.assetUrl;
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
          characterImages: [],
        },
      };
      config.musicAssetUrl = musicAssetUrl;
      newProj={...newProj,rollout:resolveRolloutConfig(newProjectId)};
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
          throw new Error(REFACTOR_CONSTANTS.ERR_HOOK_VERSIONS_MISSING);
        }
        const scriptQa = scriptRes.data.scriptQa as ScriptQualityReport | undefined;
        if (!scriptQa?.passed) {
          appendLog(_.join([REFACTOR_CONSTANTS.ERR_SCRIPT_QUALITY_REJECTED, ..._.defaultTo(scriptQa?.warnings, [])], " "));
        }
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_REWRITE_SUCCESS);
        appendLog(T.logScriptResultDetail(
          _.size(_.words(realScript)),
          _.size(chapters),
        ));
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
          scriptQa,
          aiMetrics: _.concat(_.defaultTo(newProj.aiMetrics, []), _.defaultTo(scriptRes.data.aiMetrics, [])),
          contentSafety: scriptRes.data.contentSafety as ContentSafetyReport,
          chapters,
        };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
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
        let rawAnalyzedCharacters = analyzeCharacterRes.success && _.isArray(analyzeCharacterRes.data?.characters)
          ? _.take(analyzeCharacterRes.data.characters, REFACTOR_CONSTANTS.HOOK_COUNT)
          : [];
        if (_.isEmpty(rawAnalyzedCharacters)) throw new Error(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
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
        let storyboardStyle = newProj.visualConfig.referencePrompt || newProj.visualConfig.style || config.stylePreset;
        if (!_.isEmpty(config.referenceImages)) {
          const styleResponse = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images: config.referenceImages, backgroundMode: config.styleBackgroundMode, fallbackStyle: storyboardStyle }, requestSignal);
          throwIfCancelled();
          if (!styleResponse.success || _.isEmpty(styleResponse.data?.style)) throw new Error(styleResponse.error || STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR);
          storyboardStyle = styleResponse.data.style;
          newProj = { ...newProj, visualConfig: { ...newProj.visualConfig, style: storyboardStyle, referencePrompt: storyboardStyle, styleReferenceImages: config.referenceImages } };
          await syncProject(newProj);
        }
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
          referenceImages: _.defaultTo(newProj.visualConfig.styleReferenceImages, config.referenceImages),
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
        if (!storyboardRes.success || !storyboardRes.data || storyboardRes.data.error) {
          throw new Error(storyboardRes.error || storyboardRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_STORYBOARD_SPLIT);
        }

        realScenes = (storyboardRes.data.scenes || []) as StoryboardScene[];
        if (_.isEmpty(realScenes)) throw new Error(AUTO_GENERATOR_CONSTANTS.ERR_NO_SCENES_CREATED);
        const storyboardQa = storyboardRes.data.storyboardQa as StoryboardQualityReport | undefined;
        if (!storyboardQa?.passed) appendLog(REFACTOR_CONSTANTS.WARN_STORYBOARD_QA_RESULT);
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, String(realScenes.length)));
        appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);

        const audioCueSheet = createAudioCueSheet(realScenes);
        const musicCue = _.find(audioCueSheet.cues, { type: AudioCueType.Music });
        if (musicCue && !_.isEmpty(config.musicAssetUrl)) {
          musicCue.assetUrl = config.musicAssetUrl;
          musicCue.status = AudioCueStatus.Approved;
        }
        const storyboardUpdatedProj = { ...newProj, scriptRewritten: realScript, factCheckNotes, chapters, storyboard: realScenes as VideoProject["storyboard"], visualBible: storyboardRes.data.visualBible as VisualBible, storyboardQa, audioCueSheet };
        await syncProject(storyboardUpdatedProj);
        newProj = storyboardUpdatedProj;
      }
      if (isStoryboardCached && newProj.audioCueSheet) {
        const musicCue = _.find(newProj.audioCueSheet.cues, { type: AudioCueType.Music });
        if (musicCue && !_.isEmpty(config.musicAssetUrl)) {
          musicCue.assetUrl = config.musicAssetUrl;
          musicCue.status = AudioCueStatus.Approved;
        }
      }

      realScenes = _.map(realScenes, scene => ({
        ...scene,
        characterIds: resolveSceneCharacterIds(scene, analyzedCharacters),
      }));
      const recurringCharacterIds = new Set(_.flatMap(realScenes, scene => scene.characterIds));
      const recurringCharacters = _.filter(analyzedCharacters, character => recurringCharacterIds.has(character.id));
      if (!_.isEmpty(recurringCharacters)) {
        const approvedCharacters = await generateCharacterReferenceLibrary({
          projectId: newProj.id,
          characters: recurringCharacters,
          visualConfig: newProj.visualConfig,
          targetStyle: newProj.visualConfig.referencePrompt || newProj.visualConfig.style || config.stylePreset,
          signal: requestSignal,
        });
        const persistedCharacterReferences = await Promise.all(_.map(approvedCharacters, async character => {
          const response = await safeSystemFetch(
            `${API_ROUTES.PIPELINE_REFERENCE_ASSETS}/${newProj.id}/${REFERENCE_ASSET_GROUP.CHARACTER}`,
            { images: character.images },
            requestSignal,
          );
          if (!response.success || _.isEmpty(response.data?.assets)) throw new Error(PIPELINE_CLIENT_ERRORS.CHARACTER_REFERENCE_PERSIST_FAILED);
          return { ...character, images: _.defaultTo(response.data.assets, []) };
        }));
        const approvedById = _.keyBy(persistedCharacterReferences, "id");
        analyzedCharacters = _.map(analyzedCharacters, character => approvedById[character.id] || character);
        newProj = {
          ...newProj,
          visualConfig: {
            ...newProj.visualConfig,
            characters: analyzedCharacters,
            characterImages: _.uniq(_.flatMap(persistedCharacterReferences, "images")),
            characterExtracted: true,
          },
        };
        await syncProject(newProj);
      }
      const referenceContinuityReport = validateVisualContinuity(realScenes, analyzedCharacters, newProj.visualBible);
      const referenceErrors = _.filter(referenceContinuityReport.blockingErrors, error => _.startsWith(error, "character_reference_required"));
      if (!_.isEmpty(referenceErrors)) throw new Error(_.join(referenceErrors, REFACTOR_CONSTANTS.VD_BLANK));

      let globalAudioBase64: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let globalAudioUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
      let isVoiceCached = false;

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

        const directedVoice = await generateDirectedVoice({
          text: realScript,
          voiceArc: DEFAULT_VOICE_ARC,
          basePayload: voicePayload,
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
          return safeSystemFetch(API_ROUTES.PIPELINE_ALIGN_VOICE, {
            audioBase64: globalAudioBase64,
            scenes: _.map(realScenes as VideoProject["storyboard"], (scene) => ({
              id: scene.id,
              script: scene.script || scene.subtitle || REFACTOR_CONSTANTS.VD_EMPTY_STRING,
            })),
            segment: true,
            projectId: newProj?.id,
            projectName: newProj?.name,
          }, requestSignal);
        })()
        : null;

      if (alignmentRequest) {
        try {
          const alignRes = await alignmentRequest;
          if (!alignRes.success || !alignRes.data?.success || !_.isArray(alignRes.data.alignments)) throw new Error(alignRes.error || alignRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
          realScenes = applyVoiceAlignments(realScenes as StoryboardScene[], alignRes.data.alignments);
          voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"] };
          await syncProject(voiceUpdatedProj);
          alignmentCompleted = true;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_SUCCESS);
        } catch (audioError: unknown) {
          logger.error(T.errAudioAlignBackend, audioError);
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_ERROR + (audioError instanceof Error ? audioError.message : REFACTOR_CONSTANTS.VD_EMPTY_STRING));
          throw new Error(AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
        }
      }

      let currentStylePreset = config.stylePreset;
      let currentThumbnailStyle = config.thumbnailStylePreset;
      appendLog(T.logReferenceSummary(
        _.size(config.referenceImages),
        _.size(config.sceneReferenceImages),
        SecurityConstants.ZERO,
      ));

      if (!isStoryboardCached || config.forceRegenerateScenes || didAnalyzeCharacters || requiresVisualReferenceMigration) {
        if (!_.isEmpty(config.referenceImages)) appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT);
        if (!_.isEmpty(config.thumbnailReferenceImages)) appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT);

        const [extractStyleRes, extractThumbStyleRes] = await Promise.all([
          !_.isEmpty(config.referenceImages)
            ? safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, {
              images: config.referenceImages,
              backgroundMode: config.styleBackgroundMode,
              fallbackStyle: currentStylePreset,
            }, requestSignal)
            : Promise.resolve(null),
          !_.isEmpty(config.thumbnailReferenceImages)
            ? safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, {
              images: config.thumbnailReferenceImages,
              backgroundMode: config.thumbnailBackgroundMode,
              fallbackStyle: currentThumbnailStyle,
            }, requestSignal)
            : Promise.resolve(null),
        ]);
        throwIfCancelled();

        if (!_.isEmpty(config.referenceImages) && (!extractStyleRes?.success || _.isEmpty(extractStyleRes.data?.style))) {
          throw new Error(extractStyleRes?.error || STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR);
        }
        if (!_.isEmpty(config.thumbnailReferenceImages) && (!extractThumbStyleRes?.success || _.isEmpty(extractThumbStyleRes.data?.style))) {
          throw new Error(extractThumbStyleRes?.error || STYLE_EXTRACTION_CONFIG.UNAVAILABLE_ERROR);
        }

        if (extractStyleRes?.success && extractStyleRes.data?.style) {
          currentStylePreset = extractStyleRes.data.style;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT_SUCCESS.replace(
            SecurityConstants.PLACEHOLDER_0,
            _.join([REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE, _.truncate(currentStylePreset, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }), REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          ));
        }

        if (extractThumbStyleRes?.success && extractThumbStyleRes.data?.style) {
          currentThumbnailStyle = extractThumbStyleRes.data.style;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT_SUCCESS.replace(
            SecurityConstants.PLACEHOLDER_0,
            _.join([REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE, _.truncate(currentThumbnailStyle, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }), REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          ));
        }

        voiceUpdatedProj = {
          ...voiceUpdatedProj,
          visualConfig: {
            ...voiceUpdatedProj.visualConfig,
            style: currentStylePreset,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            referenceImages: _.take(_.uniq(_.concat(config.referenceImages, config.sceneReferenceImages)), SCENE_REFERENCE_CONFIG.MAX_IMAGES),
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
          bypassCache: Boolean(config.forceRegenerateScenes),
        }, requestSignal);
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          const styleIdentityChanged = !_.isEqual(currentStylePreset, existingTargetProj?.visualConfig?.style);
          shouldRegenerateSceneAssets = shouldRegenerateSceneAssets || requiresVisualReferenceMigration || didAnalyzeCharacters || styleIdentityChanged;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE_SUCCESS);
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle = voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || config.thumbnailStylePreset;
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
        requireStructuredPlan: true,
      }) as ImagePromptQualityReport;
      const promptContinuityReport = validateVisualContinuity(realScenes, voiceUpdatedProj.visualConfig.characters || [], voiceUpdatedProj.visualBible);
      if (!promptContinuityReport.passed) throw new Error(_.join(promptContinuityReport.blockingErrors, REFACTOR_CONSTANTS.VD_BLANK));
      voiceUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"], imagePromptQa };
      await syncProject(voiceUpdatedProj);
      if (!imagePromptQa.passed) throw new Error(REFACTOR_CONSTANTS.ERR_IMAGE_PROMPT_QUALITY_REJECTED);

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
      _.forEach(resolvedVisualConfig.issues, ({ code, severity }) => {
        appendLog(`[CONFIG ${_.toUpper(severity)}] ${code}`);
      });
      const executionVisualConfig = resolvedVisualConfig.config;
      voiceUpdatedProj = {
        ...voiceUpdatedProj,
        visualConfig: executionVisualConfig,
      };
      await syncProject(voiceUpdatedProj);
      setStepProgress(60);

      setStepProgress(65);
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
        const checkpointProject = { ...voiceUpdatedProj, storyboard: _.cloneDeep(realScenes) as VideoProject["storyboard"] };
        imageCheckpointQueue = imageCheckpointQueue.then(() => syncProject(checkpointProject));
        return imageCheckpointQueue;
      };

      const createSceneRequestContext = (scene: StoryboardScene) => {
        const context = createSceneGenerationContext(
          scene,
          voiceUpdatedProj.visualConfig,
          { includeCharacterImages: true },
        );
        return {
          ...context,
          prompt: adaptImagePromptForEngine(
            context.prompt,
            executionVisualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
            config.aspectRatio,
          ),
        };
      };

      if (targetScenesToGen && targetScenesToGen.length > 0) {
        if (_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)) {
          appendLog(T.logBatchImageStreamStart);
          const batchItems = _.map(targetScenesToGen, (scene) => {
            const requestContext = createSceneRequestContext(scene);
            scene.generationPrompt = requestContext.prompt;
            return {
              sceneId: scene.id,
              idempotencyKey: _.join([voiceUpdatedProj.id, scene.id, scene.dependencyHash], ":"),
              prompt: requestContext.prompt,
              referenceImages: requestContext.referenceImages,
              generateType: resolveSceneGenerateType(scene.id, executionVisualConfig.generateType, videoSceneIds),
            };
          });
          let completedCount = SecurityConstants.ZERO;
          let batchFailureCount = SecurityConstants.ZERO;
          let batchFailureReason: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
          let fallbackFailureCount = SecurityConstants.ZERO;

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
              if (_.some([
                _.isEqual(completedCount, SecurityConstants.DEFAULT_AMOUNT),
                _.isEqual(completedCount, totalScenes),
                _.isEqual(completedCount % 5, SecurityConstants.ZERO),
              ])) {
                appendLog(T.logBatchImageSceneSuccess(result.sceneId, completedCount, totalScenes));
              }
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
              createFallbackPayload: (item) => ({
                prompt: item.prompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                bypassCache: false,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, referenceImages: item.referenceImages, generateType: item.generateType },
              }),
              onBatchResult: (result) => {
                if (result.success) { applyResult(result); return; }
                batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                if (_.isEmpty(batchFailureReason)) {
                  batchFailureReason = _.find([result.warning, REFACTOR_CONSTANTS.UNKNOWN_WARNING], (value) => !_.isEmpty(value)) as string;
                }
              },
              onFallbackStart: (error) => appendLog(T.logBatchFailuresSummary(
                batchFailureCount,
                _.size(targetScenesToGen),
                _.find([batchFailureReason, error.message], (value) => !_.isEmpty(value)) as string,
              )),
              onFallbackItemStart: (_item, index, total) => {
                const current = _.add(index, SecurityConstants.DEFAULT_AMOUNT);
                if (_.some([
                  _.isEqual(current, SecurityConstants.DEFAULT_AMOUNT),
                  _.isEqual(current, total),
                  _.isEqual(current % 5, SecurityConstants.ZERO),
                ])) {
                  appendLog(T.logFallbackProgress(current, total));
                }
              },
              onFallbackResult: (result) => {
                if (result.success) { applyResult(result); return; }
                fallbackFailureCount = _.add(fallbackFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                const failedScene = _.find(realScenes as VideoProject["storyboard"], (item) => _.isEqual(item.id, result.sceneId));
                if (failedScene && !hasSceneAsset(failedScene)) {
                  failedScene.assetStatus = SceneAssetStatus.Failed;
                  failedScene.assetError = result.warning || REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
                  void persistImageCheckpoint();
                }
              },
            });
            if (generationSummary.cancelled) {
              throw new Error(REFACTOR_CONSTANTS.PROJECT_IMAGE_GENERATION_CANCELLED);
            }
            appendLog(T.logImageGenerationSummary(completedCount, fallbackFailureCount, _.size(targetScenesToGen)));
          } catch (generationError) {
            const failureReason = generationError instanceof Error
              ? generationError.message
              : REFACTOR_CONSTANTS.PROJECT_IMAGE_BATCH_ERROR;
            _.forEach(targetScenesToGen, (scene) => {
              if (hasSceneAsset(scene)) return;
              scene.assetStatus = SceneAssetStatus.Failed;
              scene.assetError = failureReason;
            });
            await persistImageCheckpoint();
            throw generationError;
          } finally {
            await imageCheckpointQueue;
          }
        } else {
          for (let i = 0; i < targetScenesToGen.length; i++) {
            const sc = targetScenesToGen[i];
            const requestContext = createSceneRequestContext(sc);
            sc.generationPrompt = requestContext.prompt;
            const sceneGenerateType = resolveSceneGenerateType(sc.id, executionVisualConfig.generateType, videoSceneIds);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_SCENE_GEN
              .replace(SecurityConstants.PLACEHOLDER_0, String(i + 1))
              .replace(SecurityConstants.PLACEHOLDER_1, String(targetScenesToGen.length)));
            try {
              const imgRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                prompt: requestContext.prompt,
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || "Standard",
                bypassCache: false,
                engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: visualConfigPayload ? { ...visualConfigPayload, referenceImages: requestContext.referenceImages, generateType: sceneGenerateType } : visualConfigPayload,
              }, requestSignal);
              const hasImageFallback = _.every([
                _.isEqual(sceneGenerateType, GenerateType.Image),
                !_.isEmpty(imgRes.data?.fallbackUrl),
              ], Boolean);
              if (_.every([imgRes.success, imgRes.data, _.some([imgRes.data?.success, hasImageFallback], Boolean)], Boolean)) {
                const base64Val = imgRes.data.base64 || _.get(imgRes.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
                const fallbackUrl = _.get(imgRes.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
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
                throw new Error(_.defaultTo(imgRes.error, _.defaultTo(imgRes.data?.warning, REFACTOR_CONSTANTS.ERR_UNKNOWN)));
              }
            } catch (error) {
              sc.assetStatus = SceneAssetStatus.Failed;
              sc.assetError = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_UNKNOWN;
              appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
            }
          }
        }
      }
      const technicallyValidScenes = _.filter(realScenes as StoryboardScene[], scene => hasSceneAsset(scene));
      const imageScenesToValidate = technicallyValidScenes;
      const validationSceneIds = new Set(_.map(imageScenesToValidate, "id"));

      for (const scene of imageScenesToValidate) {
        scene.assetStatus = SceneAssetStatus.Validating;
        const sceneReferenceContext = createSceneGenerationContext(
          scene,
          voiceUpdatedProj.visualConfig,
          { includeCharacterImages: true },
        );
        const canonicalReferenceUrl = !_.isEmpty(scene.characterIds) ? _.get(_.find(realScenes, candidate => _.every([
          candidate.id !== scene.id,
          candidate.assetStatus === SceneAssetStatus.Approved,
          candidate.assetType !== GenerateType.Video,
          !_.isEmpty(candidate.assetUrl),
          hasSameNamedCharacters(scene, candidate),
        ], Boolean)), "assetUrl") : undefined;
        const qualityReferenceUrls = _.take(_.uniq(_.compact([
          ...sceneReferenceContext.referenceImages,
          canonicalReferenceUrl,
        ])), SCENE_REFERENCE_CONFIG.MAX_IMAGES);
        try {
          const validationResult = await validateAndRepairVisualAsset({
            projectId: voiceUpdatedProj.id,
            target: scene,
            style: currentStylePreset,
            resolution: voiceUpdatedProj.visualConfig.quality || REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
            engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
            visualConfig: visualConfigPayload,
            sandboxConfig: sandboxConfigPayload,
            referenceAssetUrl: canonicalReferenceUrl,
            referenceAssetUrls: qualityReferenceUrls,
            signal: requestSignal,
          });
          if (!_.isEqual(scene.assetUrl, validationResult.assetUrl)) {
            scene.assetUrl = validationResult.assetUrl;
            scene.assetUrls = [validationResult.assetUrl];
            scene.assetType = validationResult.assetType;
            scene.generationPrompt = validationResult.generationPrompt;
            appendAssetRevision(scene, validationResult.assetUrl, SceneAssetStatus.Approved);
          }
          scene.assetStatus = SceneAssetStatus.Approved;
          scene.assetError = undefined;
          const revision = _.findLast(scene.assetRevisions);
          if (revision) {
            revision.status = SceneAssetStatus.Approved;
            revision.approvedAt = new Date().toISOString();
          }
        } catch (qualityError) {
          scene.assetStatus = SceneAssetStatus.Failed;
          scene.assetError = qualityError instanceof Error
            ? qualityError.message
            : REFACTOR_CONSTANTS.ERR_VISUAL_QUALITY_REJECTED;
          appendLog(_.replace(REFACTOR_CONSTANTS.WARN_VISUAL_QA_RESULT, SecurityConstants.PLACEHOLDER_0, scene.id));
        }
        await persistImageCheckpoint();
      }

      const approvedImageScenes = _.filter(technicallyValidScenes, scene => _.every([
        scene.assetType !== GenerateType.Video,
        scene.assetStatus === SceneAssetStatus.Approved,
      ], Boolean));
      const imageQaFailures = _.filter(imageScenesToValidate, scene => scene.assetStatus !== SceneAssetStatus.Approved);
      if (!_.isEmpty(imageQaFailures)) throw new Error(REFACTOR_CONSTANTS.ERR_VISUAL_QUALITY_REJECTED);
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

      const imageUpdatedProj = { ...voiceUpdatedProj, storyboard: realScenes as VideoProject["storyboard"] };
      await syncProject(imageUpdatedProj);

      let seoData: unknown = cachedSeoData;
      if (cachedSeoData) {
        appendLog(T.logResumeSeo);
      }

      if (!cachedSeoData) {
        const seoRes = await seoRequest;
        if (seoRes.success && seoRes.data) {
          seoData = seoRes.data;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_SUCCESS);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_FAILED);
        }
      }

      let thumbnailsList: ThumbnailItem[] = [];
      let isThumbsCached = false;
      let existingThumbs: ThumbnailItem[] = [];
      const shouldRegenerateThumbnails = Boolean(config.forceRegenerateScenes)
        || invalidationState.regenerateThumbnails;

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
                };
              });

              let completedCount = SecurityConstants.ZERO;
              let batchFailureCount = SecurityConstants.ZERO;
              let batchFailureReason: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
              let fallbackFailureCount = SecurityConstants.ZERO;

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
                createFallbackPayload: (item) => ({
                  prompt: item.prompt,
                  style: currentThumbnailStyle || currentStylePreset,
                  resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                  bypassCache: false,
                  engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
                  sandboxConfig: sandboxConfigPayload,
                  visualConfig: { ...visualConfigPayload, style: currentThumbnailStyle || currentStylePreset, referenceImages: item.referenceImages, generateType: item.generateType },
                }),
                onBatchResult: (result) => {
                  if (result.success) { applyThumbResult(result); return; }
                  batchFailureCount = _.add(batchFailureCount, SecurityConstants.DEFAULT_AMOUNT);
                  if (_.isEmpty(batchFailureReason)) {
                    batchFailureReason = result.warning || REFACTOR_CONSTANTS.UNKNOWN_WARNING;
                  }
                },
                onFallbackStart: (error) => appendLog(
                  _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_FALLBACK_START, SecurityConstants.PLACEHOLDER_0, error.message)
                ),
                onFallbackItemStart: (_item, index, total) => {
                  appendLog(
                    _.replace(
                      _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_BATCH_FALLBACK_ITEM, SecurityConstants.PLACEHOLDER_0, _.toString(index + 1)),
                      SecurityConstants.PLACEHOLDER_1,
                      _.toString(total)
                    )
                  );
                },
                onFallbackResult: (result) => {
                  if (result.success) { applyThumbResult(result); return; }
                  fallbackFailureCount = _.add(fallbackFailureCount, SecurityConstants.DEFAULT_AMOUNT);
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
      if (_.lt(completedThumbnailCount, config.thumbnailCount)) {
        await syncProject({
          ...imageUpdatedProj,
          status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
          seo: seoData as VideoProject["seo"],
          thumbnails: thumbnailsList,
        });
        throw new Error(_.replace(
          REFACTOR_CONSTANTS.THUMBNAIL_GENERATION_INCOMPLETE,
          SecurityConstants.PLACEHOLDER_0,
          _.toString(_.subtract(config.thumbnailCount, completedThumbnailCount)),
        ));
      }
      for (const thumbnail of thumbnailsList) {
        if (!isUsableGeneratedAssetUrl(thumbnail.imageUrl)) {
          thumbnail.approved = false;
          continue;
        }
        const thumbnailStyle = _.toString(_.defaultTo(thumbnail.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)));
        const thumbnailReferences = resolveThumbnailReferenceImages(imageUpdatedProj.visualConfig);
        try {
          const validationResult = await validateAndRepairVisualAsset({
            projectId: imageUpdatedProj.id,
            target: {
              id: thumbnail.id,
              script: _.toString(_.get(_.first(_.get(seoData, "titles", [])), "text", imageUpdatedProj.name)),
              prompt: thumbnail.prompt,
              generationPrompt: thumbnail.generationPrompt,
              assetUrl: thumbnail.imageUrl,
            },
            style: thumbnailStyle,
            resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
            engine: voiceUpdatedProj.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Imagen,
            visualConfig: { ...visualConfigPayload, style: thumbnailStyle },
            sandboxConfig: sandboxConfigPayload,
            referenceAssetUrls: thumbnailReferences,
            signal: requestSignal,
          });
          thumbnail.imageUrl = validationResult.assetUrl;
          thumbnail.generationPrompt = validationResult.generationPrompt;
          thumbnail.qa = evaluateThumbnail(validationResult.quality);
          thumbnail.approved = thumbnail.qa.passed;
        } catch {
          thumbnail.approved = false;
          appendLog(REFACTOR_CONSTANTS.ERR_THUMBNAIL_QA_REQUIRED);
          continue;
        }
        if (!thumbnail.qa.passed) {
          appendLog(_.replace(
            REFACTOR_CONSTANTS.WARN_THUMBNAIL_QA_RESULT,
            SecurityConstants.PLACEHOLDER_0,
            thumbnail.id,
          ));
        }
      }
      if (_.some(thumbnailsList, thumbnail => !thumbnail.approved)) throw new Error(REFACTOR_CONSTANTS.ERR_THUMBNAIL_QUALITY_REJECTED);
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(
        _.size(_.get(seoData, "titles", [])),
        _.size(thumbnailsList),
      ));

      let slicedUpdatedProj: VideoProject = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList };
      if (globalAudioBase64) {
        if (alignmentCompleted) {
          appendLog(T.logResumeAlignment);
          slicedUpdatedProj = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList, storyboard: realScenes as VideoProject["storyboard"] };
          await syncProject(slicedUpdatedProj);
        } else {
          try {
            const alignRes = await alignmentRequest;
            if (!alignRes.success || !alignRes.data || !alignRes.data.success || !_.isArray(alignRes.data.alignments)) {
              throw new Error(alignRes.error || alignRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
            }

            const alignments = alignRes.data.alignments;
            realScenes = applyVoiceAlignments(realScenes as StoryboardScene[], alignments);

            slicedUpdatedProj = {
              ...imageUpdatedProj,
              seo: seoData as VideoProject["seo"],
              thumbnails: thumbnailsList,
              storyboard: realScenes as VideoProject["storyboard"],
            };
            await syncProject(slicedUpdatedProj);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_SUCCESS);
            appendLog(T.logAlignmentResultDetail(
              _.size(alignments),
              _.max(_.map(alignments, (alignment) => _.toNumber(alignment.end))) || 0,
            ));
          } catch (audioError: unknown) {
            logger.error(T.errAudioAlignBackend, audioError);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_ERROR + (audioError instanceof Error ? audioError.message : REFACTOR_CONSTANTS.VD_EMPTY_STRING));
          }
        }
      }
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.ALIGN_DONE);

      realScenes = createSubtitleCues(realScenes as StoryboardScene[]);
      const subtitleQa = evaluateSubtitles(realScenes as StoryboardScene[]);
      if (!subtitleQa.passed) throw new Error(REFACTOR_CONSTANTS.ERR_SUBTITLE_QUALITY_REJECTED);
      const editorQa = evaluateEdit(realScenes as StoryboardScene[]);
      if (!editorQa.passed) throw new Error(REFACTOR_CONSTANTS.ERR_EDITOR_QUALITY_REJECTED);
      const actualVoiceDuration = _.max(_.map(realScenes, scene => _.toNumber(_.get(scene, "_end", 0)))) || calculateSceneDuration(realScenes as StoryboardScene[]);
      const audioQa = await validateAudioQuality(globalAudioBase64, realScript, actualVoiceDuration, parseTargetDurationSeconds(newProj.config.duration));
      if (!audioQa.passed) throw new Error(REFACTOR_CONSTANTS.ERR_AUDIO_QUALITY_REJECTED);
      slicedUpdatedProj = {
        ...slicedUpdatedProj,
        subtitleQa,
        editorQa,
        voiceConfig: { ...slicedUpdatedProj.voiceConfig, voiceArc: DEFAULT_VOICE_ARC, audioQa },
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
          imageBase64: _.get(sc, "assetUrl"),
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
      const missingAudioCueIds = validateAudioCueAssets(slicedUpdatedProj.audioCueSheet);
      if (!_.isEmpty(missingAudioCueIds)) throw new Error(REFACTOR_CONSTANTS.ERR_SOUND_ASSET_MISSING);

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
          let statusData: { success: boolean; status: string; progress?: number; url?: string };
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
            const finalMultimodalQa = await validateFinalVideo(
              statusData.url,
              realScript,
              _.toString(slicedUpdatedProj.creativeBrief?.viewerPromise),
            );
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
            if (!finalMultimodalQa.passed) {
              await syncProject({
                ...renderCandidateProj,
                finalQc: evaluateFinalQuality(renderCandidateProj),
                status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
              });
              throw new Error(REFACTOR_CONSTANTS.ERR_FINAL_QUALITY_REJECTED);
            }
            const finalQc = evaluateFinalQuality(renderCandidateProj);
            if (!finalQc.publishable) {
              await syncProject({
                ...renderCandidateProj,
                finalQc,
                status: REFACTOR_CONSTANTS.STATUS_PARTIAL,
              });
              throw new Error(REFACTOR_CONSTANTS.ERR_FINAL_QUALITY_REJECTED);
            }
            const benchmark=createPipelineBenchmark(renderCandidateProj,pipelineStartedAt);const shadowComparison=renderCandidateProj.rollout?.shadowMode?createShadowComparison(existingTargetProj,{...renderCandidateProj,benchmark}):undefined;
            const renderCompletedProj = { ...renderCandidateProj, finalQc, benchmark, shadowComparison, status: REFACTOR_CONSTANTS.STATUS_COMPLETED };
            await syncProject(renderCompletedProj);
            setRenderedVideoUrl(statusData.url);
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_SUCCESS, SecurityConstants.PLACEHOLDER_0, statusData.url));
            appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
            continue;
          }
          if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_FAILED)) throw new Error(REFACTOR_CONSTANTS.ERR_RENDER_FAILED);

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
