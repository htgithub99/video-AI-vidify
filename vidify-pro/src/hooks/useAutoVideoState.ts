import { useState, useEffect } from "react";
import _ from "lodash";
import {
  VideoProject,
  ProjectInputType,
  ProjectLanguage,
  ImageGenerationMode,
  ImageGeneratorEngine,
  GenerateType,
  BatchDelayOption,
  GeminiChatSpeed,
  PromptInputMethod,
  AspectRatio,
  BackgroundMode,
  TextInImageMode,
  ImageFocusMode,
} from "../types";
import { VideoQuality } from "../constants/enums";
import { AUTO_VIDEO_DEFAULTS, REFACTOR_CONSTANTS, DEFAULT_PROJECT_CONFIGS, MEDIA_MIX_CONFIG } from "../constants";
import { PRESET_CONSTANTS } from "../constants/texts";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { Lang } from "../lib/lang";
import { AUTO_GENERATOR_PANEL_TEXTS } from "../constants/texts";
import { getAutoVideoConfigStorageKey } from "./autoVideoPipelineUtils";

interface CachedGeneratorConfig {
  version?: number;
  inputType?: ProjectInputType;
  scriptContent?: string;
  genre?: string;
  language?: ProjectLanguage;
  duration?: string;
  splitStrategy?: string;
  voiceProvider?: string;
  voiceURI?: string;
  voiceName?: string;
  generationMode?: ImageGenerationMode;
  imageGeneratorEngine?: ImageGeneratorEngine;
  generateType?: GenerateType;
  maxVideoScenes?: number;
  aspectRatio?: AspectRatio;
  stylePreset?: string;
  styleBackgroundMode?: BackgroundMode;
  styleTextInImageMode?: TextInImageMode;
  imageFocusMode?: ImageFocusMode;
  thumbnailImageFocusMode?: ImageFocusMode;
  thumbnailCount?: number;
  thumbnailStylePreset?: string;
  thumbnailBackgroundMode?: BackgroundMode;
  thumbnailTextInImageMode?: TextInImageMode;
  projectName?: string;
  referenceImages?: string[];
  sceneReferenceImages?: string[];
  thumbnailReferenceImages?: string[];
  resumeMode?: boolean;
  chromeHeadless?: boolean;
}

export interface AutoVideoFormState {
  inputType: ProjectInputType;
  scriptContent: string;
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
  isVoiceDialogOpen: boolean;
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
  thumbnailImageFocusMode: ImageFocusMode;
  referenceImages: string[];
  sceneReferenceImages: string[];
  characterImages: string[];
  thumbnailCount: number;
  thumbnailStylePreset: string;
  thumbnailBackgroundMode: BackgroundMode;
  thumbnailTextInImageMode: TextInImageMode;
  thumbnailReferenceImages: string[];
  projectName: string;
  resumeMode: boolean;
  showAdvancedImageSettings: boolean;
  ffmpegQuality: VideoQuality;
  isConfigLoaded: boolean;
}

export interface AutoVideoFormActions {
  setInputType: (v: ProjectInputType) => void;
  setScriptContent: (v: string) => void;
  setGenre: (v: string) => void;
  setLanguage: (v: ProjectLanguage) => void;
  setDuration: (v: string) => void;
  setSplitStrategy: (v: string) => void;
  setVoiceProvider: (v: string) => void;
  setVoiceURI: (v: string) => void;
  setVoiceName: (v: string) => void;
  setIsVoiceDialogOpen: (v: boolean) => void;
  setGenerationMode: (v: ImageGenerationMode) => void;
  setImageGeneratorEngine: (v: ImageGeneratorEngine) => void;
  setGenerateType: (v: GenerateType) => void;
  setMaxVideoScenes: (v: number) => void;
  setAspectRatio: (v: AspectRatio) => void;
  setChromeHeadless: (v: boolean) => void;
  setStylePreset: (v: string) => void;
  setStyleBackgroundMode: (v: BackgroundMode) => void;
  setStyleTextInImageMode: (v: TextInImageMode) => void;
  setImageFocusMode: (v: ImageFocusMode) => void;
  setThumbnailImageFocusMode: (v: ImageFocusMode) => void;
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSceneReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setThumbnailCount: (v: number) => void;
  setThumbnailStylePreset: (v: string) => void;
  setThumbnailBackgroundMode: (v: BackgroundMode) => void;
  setThumbnailTextInImageMode: (v: TextInImageMode) => void;
  setThumbnailReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setProjectName: (v: string) => void;
  setResumeMode: (v: boolean) => void;
  setShowAdvancedImageSettings: (v: boolean) => void;
}

const buildInitialProjectName = () =>
  _.join(
    [PRESET_CONSTANTS.PROJECT_NAME_PREFIX, new Date().toISOString().slice(REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_0, REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_10)],
    REFACTOR_CONSTANTS.VD_EMPTY_STRING,
  );

const applyProjectToState = (
  proj: VideoProject,
  actions: Pick<AutoVideoFormActions,
    | "setScriptContent" | "setGenre" | "setLanguage" | "setDuration" | "setSplitStrategy"
    | "setVoiceProvider" | "setVoiceURI" | "setVoiceName"
    | "setGenerationMode" | "setImageGeneratorEngine" | "setGenerateType"
    | "setMaxVideoScenes" | "setAspectRatio" | "setStylePreset" | "setStyleBackgroundMode" | "setStyleTextInImageMode" | "setImageFocusMode" | "setThumbnailImageFocusMode"
    | "setThumbnailCount" | "setThumbnailStylePreset" | "setThumbnailBackgroundMode" | "setThumbnailTextInImageMode"
    | "setReferenceImages" | "setSceneReferenceImages" | "setProjectName"
  >,
) => {
  if (proj.input?.content) actions.setScriptContent(proj.input.content);
  if (proj.config) {
    if (proj.config.genre) actions.setGenre(proj.config.genre);
    if (proj.config.language) actions.setLanguage(proj.config.language);
    if (proj.config.duration) actions.setDuration(proj.config.duration);
    if (proj.config.splitStrategy) actions.setSplitStrategy(proj.config.splitStrategy);
  }
  if (proj.voiceConfig) {
    if (proj.voiceConfig.provider) actions.setVoiceProvider(proj.voiceConfig.provider);
    if (proj.voiceConfig.voiceURI) actions.setVoiceURI(proj.voiceConfig.voiceURI);
    if (proj.voiceConfig.voiceName) actions.setVoiceName(proj.voiceConfig.voiceName);
  }
  if (proj.visualConfig) {
    if (proj.visualConfig.generationMode) actions.setGenerationMode(proj.visualConfig.generationMode);
    if (proj.visualConfig.imageGeneratorEngine) actions.setImageGeneratorEngine(proj.visualConfig.imageGeneratorEngine);
    if (proj.visualConfig.generateType) actions.setGenerateType(proj.visualConfig.generateType);
    if (!_.isUndefined(proj.visualConfig.maxVideoScenes)) actions.setMaxVideoScenes(proj.visualConfig.maxVideoScenes);
    if (proj.visualConfig.aspectRatio) actions.setAspectRatio(proj.visualConfig.aspectRatio as AspectRatio);
    if (proj.visualConfig.stylePreset) actions.setStylePreset(proj.visualConfig.stylePreset);
    if (proj.visualConfig.styleBackgroundMode) actions.setStyleBackgroundMode(proj.visualConfig.styleBackgroundMode);
    if (proj.visualConfig.styleTextInImageMode) actions.setStyleTextInImageMode(proj.visualConfig.styleTextInImageMode);
    if (proj.visualConfig.imageFocusMode) actions.setImageFocusMode(proj.visualConfig.imageFocusMode);
    if (proj.visualConfig.thumbnailImageFocusMode) actions.setThumbnailImageFocusMode(proj.visualConfig.thumbnailImageFocusMode);
    if (!_.isUndefined(proj.visualConfig.thumbnailCount)) actions.setThumbnailCount(proj.visualConfig.thumbnailCount);
    if (proj.visualConfig.thumbnailReferencePrompt) actions.setThumbnailStylePreset(proj.visualConfig.thumbnailReferencePrompt);
    if (proj.visualConfig.thumbnailBackgroundMode) actions.setThumbnailBackgroundMode(proj.visualConfig.thumbnailBackgroundMode);
    if (proj.visualConfig.thumbnailTextInImageMode) actions.setThumbnailTextInImageMode(proj.visualConfig.thumbnailTextInImageMode);
    actions.setReferenceImages(
      _.defaultTo(proj.visualConfig.styleReferenceImages, (
        _.isEmpty(proj.visualConfig.sceneReferenceImages)
          ? _.defaultTo(proj.visualConfig.referenceImages, [])
          : []
      )),
    );
    actions.setSceneReferenceImages(_.defaultTo(proj.visualConfig.sceneReferenceImages, []));
  }
};

export function useAutoVideoState(
  selectedProjectId: string | null | undefined,
  projects: VideoProject[],
  currentLang: Lang,
) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const [inputType, setInputType] = useState<ProjectInputType>(ProjectInputType.Script);
  const [scriptContent, setScriptContent] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [genre, setGenre] = useState<string>(DEFAULT_PROJECT_CONFIGS.GENRE);
  const [language, setLanguage] = useState<ProjectLanguage>(ProjectLanguage.VI);
  const [duration, setDuration] = useState<string>(DEFAULT_PROJECT_CONFIGS.DURATION);
  const [rewriteLevel] = useState<number>(3);
  const [similarityReduction] = useState<number>(3);
  const [creativityLevel] = useState<number>(3);
  const [factCheck] = useState<boolean>(true);
  const [audience] = useState<string>(DEFAULT_PROJECT_CONFIGS.AUDIENCE);
  const [writingStyle] = useState<string>(DEFAULT_PROJECT_CONFIGS.WRITING_STYLE);
  const [splitStrategy, setSplitStrategy] = useState<string>(REFACTOR_CONSTANTS.AVG_SPLIT_MIXED);

  const [hookStrategy] = useState<string>(DEFAULT_PROJECT_CONFIGS.HOOK_TYPE);
  const [hookDuration] = useState<number>(10);
  const [hookPosition] = useState<string>(REFACTOR_CONSTANTS.AVG_START_POS);

  const [voiceProvider, setVoiceProvider] = useState<string>(DEFAULT_PROJECT_CONFIGS.VOICE_PROVIDER);
  const [voiceSpeed] = useState<number>(1.0);
  const [voicePitch] = useState<number>(1.0);
  const [voiceVolume] = useState<number>(1.0);
  const [voiceURI, setVoiceURI] = useState<string>(DEFAULT_PROJECT_CONFIGS.VOICE_URI);
  const [voiceName, setVoiceName] = useState<string>(PRESET_CONSTANTS.DEFAULT_VOICE_NAME);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState<boolean>(false);

  const [generationMode, setGenerationMode] = useState<ImageGenerationMode>(ImageGenerationMode.LabsFlow);
  const [imageGeneratorEngine, setImageGeneratorEngine] = useState<ImageGeneratorEngine>(ImageGeneratorEngine.Veo3);
  const [generateType, setGenerateType] = useState<GenerateType>(GenerateType.Image);
  const [maxVideoScenes, setMaxVideoScenes] = useState<number>(MEDIA_MIX_CONFIG.DEFAULT_MAX_VIDEOS);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.NineSixteen);
  const [promptInputMethod] = useState<PromptInputMethod>(PromptInputMethod.Paste);
  const [sampleCount] = useState<number>(1);
  const [videoDuration] = useState<string>(REFACTOR_CONSTANTS.AVG_DEFAULT_DURATION);
  const [chromeHeadless, setChromeHeadless] = useState<boolean>(AUTO_VIDEO_DEFAULTS.CHROME_HEADLESS);
  const [geminiChatSpeed] = useState<GeminiChatSpeed>(GeminiChatSpeed.Fast);
  const [batchDelay] = useState<BatchDelayOption>(BatchDelayOption.Random123);

  const [stylePreset, setStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_STYLE_PRESET);
  const [styleBackgroundMode, setStyleBackgroundMode] = useState<BackgroundMode>(BackgroundMode.Auto);
  const [styleTextInImageMode, setStyleTextInImageMode] = useState<TextInImageMode>(TextInImageMode.Auto);
  const [imageFocusMode, setImageFocusMode] = useState<ImageFocusMode>(ImageFocusMode.Default);
  const [thumbnailImageFocusMode, setThumbnailImageFocusMode] = useState<ImageFocusMode>(ImageFocusMode.Default);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [sceneReferenceImages, setSceneReferenceImages] = useState<string[]>([]);
  const [characterImages] = useState<string[]>([]);

  const [thumbnailCount, setThumbnailCount] = useState<number>(2);
  const [thumbnailStylePreset, setThumbnailStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_THUMB_STYLE_PRESET);
  const [thumbnailBackgroundMode, setThumbnailBackgroundMode] = useState<BackgroundMode>(BackgroundMode.Auto);
  const [thumbnailTextInImageMode, setThumbnailTextInImageMode] = useState<TextInImageMode>(TextInImageMode.Auto);
  const [thumbnailReferenceImages, setThumbnailReferenceImages] = useState<string[]>([]);

  const [projectName, setProjectName] = useState<string>(buildInitialProjectName);
  const [resumeMode, setResumeMode] = useState<boolean>(AUTO_VIDEO_DEFAULTS.RESUME_MODE);
  const [showAdvancedImageSettings, setShowAdvancedImageSettings] = useState<boolean>(false);
  const [ffmpegQuality] = useState<VideoQuality>(VideoQuality.HIGHEST);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const actions: AutoVideoFormActions = {
    setInputType,
    setScriptContent,
    setGenre,
    setLanguage,
    setDuration,
    setSplitStrategy,
    setVoiceProvider,
    setVoiceURI,
    setVoiceName,
    setIsVoiceDialogOpen,
    setGenerationMode,
    setImageGeneratorEngine,
    setGenerateType,
    setMaxVideoScenes,
    setAspectRatio,
    setChromeHeadless,
    setStylePreset,
    setStyleBackgroundMode,
    setStyleTextInImageMode,
    setImageFocusMode,
    setThumbnailImageFocusMode,
    setReferenceImages,
    setSceneReferenceImages,
    setThumbnailCount,
    setThumbnailStylePreset,
    setThumbnailBackgroundMode,
    setThumbnailTextInImageMode,
    setThumbnailReferenceImages,
    setProjectName,
    setResumeMode,
    setShowAdvancedImageSettings,
  };

  const loadConfig = async (projectId?: string | null) => {
    try {
      const saved = await storageUtils.getAsync(getAutoVideoConfigStorageKey(projectId));
      const parsed = jsonUtils.safeParse<CachedGeneratorConfig | null>(saved, null);
      if (parsed) {
        const usesCurrentDefaults = _.isEqual(parsed.version, AUTO_VIDEO_DEFAULTS.CONFIG_VERSION);
        if (parsed.inputType) setInputType(parsed.inputType);
        if (parsed.scriptContent) setScriptContent(parsed.scriptContent);
        if (parsed.genre) setGenre(parsed.genre);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.duration) setDuration(parsed.duration);
        if (parsed.splitStrategy) setSplitStrategy(parsed.splitStrategy);
        if (parsed.voiceProvider) setVoiceProvider(parsed.voiceProvider);
        if (parsed.voiceURI) setVoiceURI(parsed.voiceURI);
        if (parsed.voiceName) setVoiceName(parsed.voiceName);
        if (parsed.generationMode) setGenerationMode(parsed.generationMode);
        if (parsed.imageGeneratorEngine) setImageGeneratorEngine(parsed.imageGeneratorEngine);
        if (parsed.generateType) setGenerateType(parsed.generateType);
        if (!_.isUndefined(parsed.maxVideoScenes)) setMaxVideoScenes(parsed.maxVideoScenes);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
        if (parsed.stylePreset) setStylePreset(parsed.stylePreset);
        if (parsed.styleBackgroundMode) setStyleBackgroundMode(parsed.styleBackgroundMode);
        if (parsed.styleTextInImageMode) setStyleTextInImageMode(parsed.styleTextInImageMode);
        if (parsed.imageFocusMode) setImageFocusMode(parsed.imageFocusMode);
        if (parsed.thumbnailImageFocusMode) setThumbnailImageFocusMode(parsed.thumbnailImageFocusMode);
        if (parsed.thumbnailCount !== undefined) setThumbnailCount(parsed.thumbnailCount);
        if (parsed.thumbnailStylePreset) setThumbnailStylePreset(parsed.thumbnailStylePreset);
        if (parsed.thumbnailBackgroundMode) setThumbnailBackgroundMode(parsed.thumbnailBackgroundMode);
        if (parsed.thumbnailTextInImageMode) setThumbnailTextInImageMode(parsed.thumbnailTextInImageMode);
        if (parsed.projectName) setProjectName(parsed.projectName);
        if (parsed.referenceImages) setReferenceImages(parsed.referenceImages);
        if (parsed.sceneReferenceImages) setSceneReferenceImages(parsed.sceneReferenceImages);
        if (parsed.thumbnailReferenceImages) setThumbnailReferenceImages(parsed.thumbnailReferenceImages);
        setResumeMode(usesCurrentDefaults && !_.isUndefined(parsed.resumeMode)
          ? parsed.resumeMode
          : AUTO_VIDEO_DEFAULTS.RESUME_MODE);
        setChromeHeadless(usesCurrentDefaults && !_.isUndefined(parsed.chromeHeadless)
          ? parsed.chromeHeadless
          : AUTO_VIDEO_DEFAULTS.CHROME_HEADLESS);
      } else {
        const foundProj = projectId ? _.find(projects, { id: projectId }) : undefined;
        if (foundProj) {
          applyProjectToState(foundProj, actions);
          setProjectName(foundProj.name);
        }
      }
    } catch (e) {
      logger.error(T.errLoadConfig, e);
    }
  };

  useEffect(() => {
    const loadSelectedConfig = async () => {
      setIsConfigLoaded(false);
      await loadConfig(selectedProjectId);
      setIsConfigLoaded(true);
    };
    loadSelectedConfig();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!isConfigLoaded) return;
    const config: CachedGeneratorConfig = {
      version: AUTO_VIDEO_DEFAULTS.CONFIG_VERSION,
      inputType,
      scriptContent,
      genre,
      language,
      duration,
      splitStrategy,
      voiceProvider,
      voiceURI,
      voiceName,
      generationMode,
      imageGeneratorEngine,
      generateType,
      maxVideoScenes,
      aspectRatio,
      stylePreset,
      styleBackgroundMode,
      styleTextInImageMode,
      imageFocusMode,
      thumbnailImageFocusMode,
      thumbnailCount,
      thumbnailStylePreset,
      thumbnailBackgroundMode,
      thumbnailTextInImageMode,
      projectName,
      referenceImages,
      sceneReferenceImages,
      thumbnailReferenceImages,
      resumeMode,
      chromeHeadless,
    };
    storageUtils.setAsync(
      getAutoVideoConfigStorageKey(selectedProjectId),
      jsonUtils.safeStringify(config),
    );
  }, [
    isConfigLoaded, selectedProjectId,
    inputType, scriptContent, genre, language, duration, splitStrategy,
    voiceProvider, voiceURI, voiceName, generationMode, imageGeneratorEngine,
    generateType, maxVideoScenes, aspectRatio, stylePreset, styleBackgroundMode, styleTextInImageMode, imageFocusMode, thumbnailImageFocusMode, thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode,
    projectName, referenceImages, sceneReferenceImages, thumbnailReferenceImages, resumeMode, chromeHeadless,
  ]);

  const state: AutoVideoFormState = {
    inputType, scriptContent, genre, language, duration, rewriteLevel,
    similarityReduction, creativityLevel, factCheck, audience, writingStyle,
    splitStrategy, hookStrategy, hookDuration, hookPosition,
    voiceProvider, voiceSpeed, voicePitch, voiceVolume, voiceURI, voiceName,
    isVoiceDialogOpen, generationMode, imageGeneratorEngine, generateType,
    maxVideoScenes, aspectRatio, promptInputMethod, sampleCount, videoDuration,
    chromeHeadless, geminiChatSpeed, batchDelay, stylePreset, styleBackgroundMode, styleTextInImageMode, imageFocusMode, thumbnailImageFocusMode,
    referenceImages, sceneReferenceImages, characterImages,
    thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode, thumbnailReferenceImages,
    projectName, resumeMode, showAdvancedImageSettings, ffmpegQuality, isConfigLoaded,
  };

  return { state, actions };
}
