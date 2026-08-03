import { useState, useRef, useEffect } from "react";
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
  AudioType,
  AssetsMode,
  Chapter,
  StoryboardScene,
  BackgroundMode,
  TextInImageMode,
  ImageFocusMode,
} from "../types";
import { VideoQuality } from "../constants/enums";
import {
  API_ROUTES, CONTENT_TYPES, CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS,
  API_HEADERS, getGeneratedMediaLanguageDirective,
} from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import { AUTO_GENERATOR_CONSTANTS, AUTO_VIDEO_PIPELINE_PROGRESS, FFMPEG_RENDER_CONSTANTS } from "../constants/config";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { formatTimeHelper } from "../utils/helpers";
import { safeSystemFetch, generateRandomString } from "../lib/shared-utils";
import {
  createProjectImageUrl,
  generateProjectImages,
  hasSceneAsset,
  resolveSceneGenerateType,
  selectVideoSceneIds,
  type ProjectImageResult,
} from "../services/projectImageGenerationService";
import { Lang } from "../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../constants/texts";
import {
  applyGeneratedMediaLanguage,
  applyBackgroundMode,
  applyTextInImageMode,
  applyImageFocusMode,
  calculateSceneDuration,
  fetchCachedVoiceAudio,
  getReferenceChangeState,
  getPipelineInvalidationState,
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

export function useAutoVideoPipeline(
  projects: VideoProject[],
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<void> | void,
  currentLang: Lang,
) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const processingRef = useRef(false);
  const cancellationRef = useRef(false);
  const requestAbortControllerRef = useRef<AbortController | null>(null);
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
      toast.error(T.alertEmptyScript);
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

      const { selectedAutoProject: selectedAutoProj, existingTargetProject: existingTargetProj } = resolveTargetProject(
        projects,
        config.selectedProjectId,
        activeCreatedProject,
        config.projectName,
        config.scriptContent,
      );
      const referenceChangeState = getReferenceChangeState(
        existingTargetProj,
        config.referenceImages,
        config.sceneReferenceImages,
        config.thumbnailReferenceImages,
        config.characterImages,
      );
      const invalidationState = getPipelineInvalidationState(existingTargetProj, config, referenceChangeState);
      const { hasVisualOverrides } = referenceChangeState;
      const shouldRegenerateSceneAssets = invalidationState.regenerateSceneAssets;

      if (config.resumeMode && existingTargetProj) {
        newProjectId = existingTargetProj.id;
        newProj = {
          ...existingTargetProj,
          status: REFACTOR_CONSTANTS.STATUS_GENERATING,
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
        const selectedProj = selectedAutoProj;
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
            characterConsistency: true,
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
            referenceImages: config.sceneReferenceImages,
            referencePrompt: config.stylePreset,
            characters: [
              {
                id: REFACTOR_CONSTANTS.AVG_CHARACTER_ID_DEFAULT,
                name: PRESET_CONSTANTS.CHARACTER_NAME,
                description: PRESET_CONSTANTS.CHARACTER_BIO,
                images: config.characterImages,
              },
            ],
          },
          seoConfig: { numTitles: 3, numDescriptions: 1, numHashtags: 5, numTags: 10 },
          creditsUsed: 0,
        };
      }

      await storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, newProjectId);
      setActiveCreatedProject(newProj);
      currentProject = newProj;

      const syncProject = async (proj: VideoProject) => {
        const finalProj = { ...proj, generationLogs: _.clone(currentLogs), updatedAt: new Date().toISOString() };
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
          bypassCache: true,
        };

        const scriptRes = await safeSystemFetch(API_ROUTES.PIPELINE_SCRIPT, scriptPayload, requestSignal);
        throwIfCancelled();
        if (!scriptRes.success || !scriptRes.data || scriptRes.data.error) {
          throw new Error(scriptRes.error || scriptRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_SCRIPT_REWRITE);
        }

        realScript = scriptRes.data.rewrittenScript || config.scriptContent;
        chapters = (scriptRes.data.chapters || []) as Chapter[];
        factCheckNotes = scriptRes.data.factCheckNotes || "";
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_REWRITE_SUCCESS);
        appendLog(T.logScriptResultDetail(
          _.size(_.words(realScript)),
          _.size(chapters),
        ));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SCRIPT_DONE);

        const scriptUpdatedProj = { ...newProj, scriptRewritten: realScript, factCheckNotes, chapters };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
      }

      if (!isStoryboardCached) {
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
          visualStyle: newProj.visualConfig.style || "Cinematic",
          referenceImages: _.defaultTo(newProj.visualConfig.styleReferenceImages, config.referenceImages),
          referenceStyle: newProj.visualConfig.referencePrompt,
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
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, String(realScenes.length)));
        appendLog(T.logStoryboardResultDetail(_.size(realScenes)));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.STORYBOARD_DONE);

        const storyboardUpdatedProj = { ...newProj, scriptRewritten: realScript, factCheckNotes, chapters, storyboard: realScenes as VideoProject["storyboard"] };
        await syncProject(storyboardUpdatedProj);
        newProj = storyboardUpdatedProj;
      }

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

        const ttsRes = await safeSystemFetch(API_ROUTES.PIPELINE_VOICE, voicePayload, requestSignal);
        throwIfCancelled();
        if (!ttsRes.success || !ttsRes.data || !ttsRes.data.success || !ttsRes.data.audioBase64) {
          throw new Error(ttsRes.error || ttsRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_TTS_FAILED);
        }

        globalAudioBase64 = ttsRes.data.audioBase64;
        globalAudioUrl = ttsRes.data.audioUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_TTS_SUCCESS);
        appendLog(T.logVoiceResultDetail(!_.isEmpty(globalAudioUrl) ? "audio URL" : "base64"));
        setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.VOICE_DONE);

        voiceUpdatedProj = {
          ...newProj,
          storyboard: realScenes as VideoProject["storyboard"],
          voiceConfig: {
            ...newProj.voiceConfig,
            audioType: AudioType.TTS,
            provider: config.voiceProvider,
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl,
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

      let currentStylePreset = config.stylePreset;
      let currentThumbnailStyle = config.thumbnailStylePreset;
      appendLog(T.logReferenceSummary(
        _.size(config.referenceImages),
        _.size(config.sceneReferenceImages),
        _.size(config.characterImages),
      ));

      if (!isStoryboardCached || hasVisualOverrides || config.forceRegenerateScenes) {
        if (!_.isEmpty(config.referenceImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT);
          const extractStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images: config.referenceImages, backgroundMode: config.styleBackgroundMode }, requestSignal);
          if (extractStyleRes.success && extractStyleRes.data?.style) {
            const extractedStyle = extractStyleRes.data.style;
            currentStylePreset = extractedStyle;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT_SUCCESS.replace(
              SecurityConstants.PLACEHOLDER_0,
              _.join([REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE, _.truncate(extractedStyle, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }), REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
            ));

            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_APPLY);
            const rewriteStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS, {
              storyboard: realScenes,
              newStyle: extractedStyle,
              aspectRatio: config.aspectRatio,
              language: config.language,
              visualConfig: {
                styleBackgroundMode: config.styleBackgroundMode,
                styleTextInImageMode: config.styleTextInImageMode,
                imageFocusMode: config.imageFocusMode,
              },
            }, requestSignal);
            if (rewriteStyleRes.success && rewriteStyleRes.data?.storyboard) {
              realScenes = rewriteStyleRes.data.storyboard;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_APPLY_SUCCESS);
            }
          }
        }

        if (!_.isEmpty(config.thumbnailReferenceImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT);
          const extractThumbStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images: config.thumbnailReferenceImages, backgroundMode: config.thumbnailBackgroundMode }, requestSignal);
          if (extractThumbStyleRes.success && extractThumbStyleRes.data?.style) {
            currentThumbnailStyle = extractThumbStyleRes.data.style;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT_SUCCESS.replace(
              SecurityConstants.PLACEHOLDER_0,
              _.join([REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE, _.truncate(currentThumbnailStyle, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }), REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
            ));
          }
        }

        voiceUpdatedProj = {
          ...voiceUpdatedProj,
          visualConfig: {
            ...voiceUpdatedProj.visualConfig,
            style: currentStylePreset,
            styleReferenceImages: config.referenceImages,
            sceneReferenceImages: config.sceneReferenceImages,
            referenceImages: config.sceneReferenceImages,
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

        if (!_.isEmpty(config.characterImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_EXTRACT);
          const extractCharRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_CHARACTER, {
            images: config.characterImages,
            characterDescription: PRESET_CONSTANTS.CHARACTER_BIO,
          }, requestSignal);
          if (extractCharRes.success && extractCharRes.data?.characterPrompt) {
            const characterPrompt = extractCharRes.data.characterPrompt;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_EXTRACT_SUCCESS);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_REWRITE);
            const rewriteCharRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS_CHARACTER, {
              storyboard: realScenes,
              characters: [{ name: PRESET_CONSTANTS.CHARACTER_NAME, prompt: characterPrompt }],
              aspectRatio: config.aspectRatio,
              visualConfig: voiceUpdatedProj.visualConfig,
            }, requestSignal);
            if (rewriteCharRes.success && rewriteCharRes.data?.storyboard) {
              realScenes = rewriteCharRes.data.storyboard;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_REWRITE_SUCCESS);
            }
          }
        }

        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE);
        const optimizeRes = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, {
          storyboard: realScenes,
          visualConfig: voiceUpdatedProj.visualConfig,
          aspectRatio: config.aspectRatio,
          language: config.language,
        }, requestSignal);
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE_SUCCESS);
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || config.stylePreset;
        currentThumbnailStyle = voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || config.thumbnailStylePreset;
      }
      setStepProgress(60);

      setStepProgress(65);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)
        ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM
        : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_GEN.replace(SecurityConstants.PLACEHOLDER_0, modeName));

      const visualConfigPayload = {
        ...(voiceUpdatedProj.visualConfig || {}),
        generationMode: config.generationMode,
        imageGeneratorEngine: config.imageGeneratorEngine,
        aspectRatio: config.aspectRatio,
        generateType: config.generateType,
        maxVideoScenes: config.maxVideoScenes,
        chromeHeadless: config.chromeHeadless,
        geminiChatSpeed: config.geminiChatSpeed,
        style: currentStylePreset,
        sceneReferenceImages: config.sceneReferenceImages,
        referenceImages: config.sceneReferenceImages,
        contentLanguage: config.language,
      };

      const generatedMediaLanguageDirective = getGeneratedMediaLanguageDirective(_.isEqual(config.language, ProjectLanguage.VI));

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

      const targetScenesToGen = _.filter(realScenes as VideoProject["storyboard"], (sc) => {
        if (config.forceRegenerateScenes) return true;
        if (config.resumeMode && !shouldRegenerateSceneAssets && hasSceneAsset(sc)) return false;
        return true;
      });
      appendLog(T.logMediaPlan(
        _.size(targetScenesToGen),
        _.subtract(_.size(realScenes), _.size(targetScenesToGen)),
        config.generateType,
      ));
      const existingVideoCount = _.size(_.filter(
        realScenes as VideoProject["storyboard"],
        (scene) => _.isEqual(scene.assetType, GenerateType.Video) && hasSceneAsset(scene),
      ));
      const remainingVideoSlots = _.max([_.subtract(config.maxVideoScenes, existingVideoCount), SecurityConstants.ZERO])!;
      const videoSceneIds = await selectVideoSceneIds(targetScenesToGen, config.generateType, remainingVideoSlots);

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

      if (targetScenesToGen && targetScenesToGen.length > 0) {
        if (_.isEqual(config.generationMode, ImageGenerationMode.GeminiChat)) {
          appendLog(T.logBatchImageStreamStart);
          const batchItems = _.map(targetScenesToGen, (scene) => ({
            sceneId: scene.id,
            prompt: applyImageFocusMode(applyTextInImageMode(applyBackgroundMode(applyGeneratedMediaLanguage(_.get(scene, REFACTOR_CONSTANTS.AVG_PROMPT_KEY) || _.get(scene, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY), generatedMediaLanguageDirective), config.styleBackgroundMode), config.styleTextInImageMode), config.imageFocusMode, config.styleBackgroundMode),
            generateType: resolveSceneGenerateType(scene.id, config.generateType, videoSceneIds),
          }));
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
            await generateProjectImages({
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
                engine: config.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: { ...visualConfigPayload, generateType: item.generateType },
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
              },
            });
            appendLog(T.logImageGenerationSummary(completedCount, fallbackFailureCount, _.size(targetScenesToGen)));
          } finally {
            await imageCheckpointQueue;
          }
        } else {
          for (let i = 0; i < targetScenesToGen.length; i++) {
            const sc = targetScenesToGen[i];
            const sceneGenerateType = resolveSceneGenerateType(sc.id, config.generateType, videoSceneIds);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_SCENE_GEN
              .replace(SecurityConstants.PLACEHOLDER_0, String(i + 1))
              .replace(SecurityConstants.PLACEHOLDER_1, String(targetScenesToGen.length)));
            try {
              const imgRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                prompt: applyImageFocusMode(applyTextInImageMode(applyBackgroundMode(applyGeneratedMediaLanguage(_.get(sc, REFACTOR_CONSTANTS.AVG_PROMPT_KEY) || _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY), generatedMediaLanguageDirective), config.styleBackgroundMode), config.styleTextInImageMode), config.imageFocusMode, config.styleBackgroundMode),
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || "Standard",
                bypassCache: false,
                engine: config.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: visualConfigPayload ? { ...visualConfigPayload, generateType: sceneGenerateType } : visualConfigPayload,
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
                await persistImageCheckpoint();
              } else {
                throw new Error(_.defaultTo(imgRes.error, _.defaultTo(imgRes.data?.warning, REFACTOR_CONSTANTS.ERR_UNKNOWN)));
              }
            } catch {
              appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
            }
          }
        }
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
      if (config.resumeMode && !invalidationState.regenerateThumbnails && !_.isEmpty(newProj.thumbnails)) {
        const cachedThumbs = newProj.thumbnails!;
        if (_.every(cachedThumbs, (t) => !_.isEmpty(t.imageUrl))) {
          thumbnailsList = cachedThumbs;
          isThumbsCached = true;
          appendLog(T.logResumeThumbnails);
        }
      }

      if (!isThumbsCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_GEN);
        const thumbPayload = {
          rewrittenScript: realScript,
          config: imageUpdatedProj.config,
          visualConfig: { ...imageUpdatedProj.visualConfig, thumbnailReferencePrompt: currentThumbnailStyle },
          bypassCache: true,
        };
        const thumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_THUMBNAILS, thumbPayload, requestSignal);
        if (thumbRes.success && thumbRes.data?.thumbnails) {
          let parsedThumbs = thumbRes.data.thumbnails as ThumbnailItem[];

          if (currentThumbnailStyle) {
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_APPLY);
            const rewriteThumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_THUMBNAILS, {
              thumbnails: parsedThumbs,
              newStyle: currentThumbnailStyle,
              aspectRatio: config.aspectRatio,
              language: config.language,
              visualConfig: imageUpdatedProj.visualConfig,
            }, requestSignal);
            if (rewriteThumbRes.success && rewriteThumbRes.data?.thumbnails) {
              parsedThumbs = rewriteThumbRes.data.thumbnails;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_APPLY_SUCCESS);
            }
          }

          const targetThumbsToGen = _.filter(parsedThumbs, (thumb) => {
            if (config.resumeMode && !invalidationState.regenerateThumbnails && !_.isEmpty(thumb.imageUrl)) return false;
            return true;
          });

          if (config.resumeMode && !invalidationState.regenerateThumbnails) {
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
                const cleanPromptText = _.replace(_.defaultTo(thumb.prompt, REFACTOR_CONSTANTS.VD_EMPTY_STRING), REFACTOR_CONSTANTS.AVG_AR_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                const thumbPrompt = _.replace(
                  _.replace(REFACTOR_CONSTANTS.AVG_THUMB_PROMPT_TEMPLATE, SecurityConstants.PLACEHOLDER_0, cleanPromptText),
                  SecurityConstants.PLACEHOLDER_1,
                  _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset))),
                );
                return {
                  sceneId: thumb.id,
                  prompt: applyImageFocusMode(applyTextInImageMode(applyBackgroundMode(_.join([thumbPrompt, REFACTOR_CONSTANTS.AVG_AR_SUFFIX, config.aspectRatio], REFACTOR_CONSTANTS.VD_EMPTY_STRING), config.thumbnailBackgroundMode), config.thumbnailTextInImageMode), config.thumbnailImageFocusMode, config.thumbnailBackgroundMode),
                  generateType: GenerateType.Image,
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

              await generateProjectImages({
                items: batchThumbItems,
                visualConfig: { ...visualConfigPayload, style: currentThumbnailStyle || currentStylePreset },
                style: currentThumbnailStyle || currentStylePreset,
                sandboxConfig: sandboxConfigPayload,
                cancelRef: cancellationRef,
                createFallbackPayload: (item) => ({
                  prompt: item.prompt,
                  style: currentThumbnailStyle || currentStylePreset,
                  resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                  bypassCache: false,
                  engine: config.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                  sandboxConfig: sandboxConfigPayload,
                  visualConfig: { ...visualConfigPayload, style: currentThumbnailStyle || currentStylePreset, generateType: item.generateType },
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
            } else {
              for (let i = 0; i < targetThumbsToGen.length; i++) {
                const thumb = targetThumbsToGen[i];
                appendLog(_.replace(
                  _.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SCENE_GEN, SecurityConstants.PLACEHOLDER_0, _.toString(i + 1)),
                  SecurityConstants.PLACEHOLDER_1,
                  _.toString(targetThumbsToGen.length),
                ));
                const cleanPromptText = _.replace(_.defaultTo(thumb.prompt, REFACTOR_CONSTANTS.VD_EMPTY_STRING), REFACTOR_CONSTANTS.AVG_AR_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                const thumbPrompt = _.replace(
                  _.replace(REFACTOR_CONSTANTS.AVG_THUMB_PROMPT_TEMPLATE, SecurityConstants.PLACEHOLDER_0, cleanPromptText),
                  SecurityConstants.PLACEHOLDER_1,
                  _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset))),
                );
                const finalThumbPrompt = applyImageFocusMode(applyTextInImageMode(applyBackgroundMode(_.join([thumbPrompt, REFACTOR_CONSTANTS.AVG_AR_SUFFIX, config.aspectRatio], REFACTOR_CONSTANTS.VD_EMPTY_STRING), config.thumbnailBackgroundMode), config.thumbnailTextInImageMode), config.thumbnailImageFocusMode, config.thumbnailBackgroundMode);

                try {
                  const renderThumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                    prompt: finalThumbPrompt,
                    style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)),
                    resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
                    bypassCache: true,
                    engine: _.defaultTo(config.imageGeneratorEngine, ImageGeneratorEngine.Veo3),
                    sandboxConfig: sandboxConfigPayload,
                    visualConfig: { ...visualConfigPayload, style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)) },
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
      setStepProgress(AUTO_VIDEO_PIPELINE_PROGRESS.SEO_THUMB_DONE);
      appendLog(T.logSeoResultDetail(
        _.size(_.get(seoData, "titles", [])),
        _.size(thumbnailsList),
      ));

      let slicedUpdatedProj: VideoProject = { ...imageUpdatedProj, seo: seoData as VideoProject["seo"], thumbnails: thumbnailsList };
      if (globalAudioBase64) {
        if (hasCachedAlignment) {
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
            realScenes = _.map(realScenes as VideoProject["storyboard"], (sc) => {
              const align = _.find(alignments, (a) => _.isEqual(a.id, sc.id));
              if (align) {
                return {
                  ...sc,
                  duration: align.duration,
                  startTime: formatTimeHelper(align.start),
                  endTime: formatTimeHelper(align.end),
                  _start: align.start,
                  _end: align.end,
                  audioBase64: align.audioBase64,
                  audioUrl: align.audioUrl,
                };
              }
              return sc;
            });

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
        appendLog(T.logRenderJob(jobId));
        let lastLoggedProgress: number | null = null;
        let renderPending = true;
        while (renderPending) {
          throwIfCancelled();
          const statusRes = await fetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER_STATUS}${jobId}`, {
            headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING },
            signal: requestSignal,
          });
          const statusData = await statusRes.json();
          if (!statusData.success) throw new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED);

          if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_COMPLETED)) {
            renderPending = false;
            setRenderedVideoUrl(statusData.url);
            appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_SUCCESS, SecurityConstants.PLACEHOLDER_0, statusData.url));
            appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
            const renderCompletedProj = {
              ...slicedUpdatedProj,
              seo: _.defaultTo(seoData as VideoProject["seo"], undefined),
              thumbnails: _.defaultTo(thumbnailsList, undefined),
              renderedVideoUrl: statusData.url,
              status: REFACTOR_CONSTANTS.STATUS_COMPLETED,
            };
            await syncProject(renderCompletedProj);
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
        appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
        setStepProgress(0);
        setCurrentStepIndex(0);
        return;
      }
      const errorMessage = error instanceof Error ? error.message : REFACTOR_CONSTANTS.ERR_RENDER_FAILED;
      appendLog(AUTO_GENERATOR_CONSTANTS.ERR_AUTO_GEN_FAILED.replace(SecurityConstants.PLACEHOLDER_0, errorMessage));
      appendLog(T.logPipelineElapsed((Date.now() - pipelineStartedAt) / 1000));
      const failedProj = {
        ...(currentProject || {}),
        id: currentProject?.id || REFACTOR_CONSTANTS.STATUS_FAILED,
        status: REFACTOR_CONSTANTS.STATUS_FAILED,
        generationLogs: _.clone(currentLogs),
        updatedAt: new Date().toISOString(),
      } as VideoProject;
      setActiveCreatedProject(failedProj);
      await onUpdateProject(failedProj, true);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
      requestAbortControllerRef.current = null;
      setIsCancelling(false);
    }
  };

  const cancelPipeline = () => {
    if (!processingRef.current || cancellationRef.current) return;
    cancellationRef.current = true;
    setIsCancelling(true);
    requestAbortControllerRef.current?.abort();
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
