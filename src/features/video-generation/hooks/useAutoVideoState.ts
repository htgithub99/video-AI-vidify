import { SOURCE_TEXT_1, SOURCE_TEXT_AUTO } from "../../../constants/sourceText";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import _ from "lodash";
import { VideoProject, ProjectInputType, ProjectLanguage, ImageGenerationMode, ImageGeneratorEngine, GenerateType, BatchDelayOption, GeminiChatSpeed, PromptInputMethod, AspectRatio, BackgroundMode, TextInImageMode, ThumbnailTextMode, ImageFocusMode } from "../../../types";
import { VideoQuality } from "../../../constants/enums";
import { AUTO_VIDEO_DEFAULTS, CINEMATIC_CONFIG, REFACTOR_CONSTANTS, DEFAULT_PROJECT_CONFIGS, MEDIA_MIX_CONFIG, normalizeGenreValue } from "../../../constants";
import { PRESET_CONSTANTS, AUTO_GENERATOR_PANEL_TEXTS } from "../../../constants/texts";
import { jsonUtils } from "../../../lib/json";
import { storageUtils } from "../../../lib/storage";
import { logger } from "../../../utils/logger";
import { Lang } from "../../../lib/lang";
import { getAutoVideoConfigStorageKey } from "./autoVideoPipelineUtils";
import { normalizeBackgroundMode, normalizeThumbnailTextMode, SCENE_TEXT_MODE } from "../../../services/visualConfigModeService";
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
  thumbnailTextInImageMode?: ThumbnailTextMode;
  projectName?: string;
  referenceImages?: string[];
  sceneReferenceImages?: string[];
  thumbnailReferenceImages?: string[];
  thumbnailSceneReferenceImages?: string[];
  resumeMode?: boolean;
  chromeHeadless?: boolean;
  geminiChatSpeed?: GeminiChatSpeed;
  videoDuration?: string;
  videoResolution?: string;
  musicAssetUrl?: string;
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
  videoResolution: string;
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
  thumbnailTextInImageMode: ThumbnailTextMode;
  thumbnailReferenceImages: string[];
  thumbnailSceneReferenceImages: string[];
  projectName: string;
  resumeMode: boolean;
  showAdvancedImageSettings: boolean;
  ffmpegQuality: VideoQuality;
  isConfigLoaded: boolean;
  musicAssetUrl: string;
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
  setVideoDuration: (value: string) => void;
  setVideoResolution: (value: string) => void;
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
  setThumbnailTextInImageMode: (v: ThumbnailTextMode) => void;
  setThumbnailReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setThumbnailSceneReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  setProjectName: (v: string) => void;
  setResumeMode: (v: boolean) => void;
  setShowAdvancedImageSettings: (v: boolean) => void;
  setMusicAssetUrl: (v: string) => void;
}
const buildInitialProjectName = (): string => `${PRESET_CONSTANTS.PROJECT_NAME_PREFIX}${new Date().toISOString().slice(REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_0, REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_10)}`;
const readSynchronousCache = (projectId?: string | null, scope: string = SOURCE_TEXT_AUTO): CachedGeneratorConfig | null => {
  try {
    const key = getAutoVideoConfigStorageKey(projectId, scope);
    const raw = storageUtils.get(key);
    if (raw) return jsonUtils.safeParse<CachedGeneratorConfig>(raw, null);
    const globalRaw = storageUtils.get(getAutoVideoConfigStorageKey(undefined, scope));
    if (globalRaw) return jsonUtils.safeParse<CachedGeneratorConfig>(globalRaw, null);
  } catch {}
  return null;
};
const applyProjectToState = (proj: VideoProject, actions: AutoVideoFormActions) => {
  if (proj.input) {
    if (proj.input.type) actions.setInputType(proj.input.type);
    actions.setScriptContent(_.defaultTo(proj.input.content, REFACTOR_CONSTANTS.VD_EMPTY_STRING));
  }
  if (proj.config) {
    if (proj.config.genre) actions.setGenre(normalizeGenreValue(proj.config.genre));
    if (proj.config.language) actions.setLanguage(proj.config.language);
    if (proj.config.duration) actions.setDuration(proj.config.duration);
    if (proj.config.splitStrategy) actions.setSplitStrategy(proj.config.splitStrategy);
    actions.setMusicAssetUrl(_.defaultTo(proj.config.musicAssetUrl, REFACTOR_CONSTANTS.VD_EMPTY_STRING));
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
    if (proj.visualConfig.videoDuration) actions.setVideoDuration(proj.visualConfig.videoDuration);
    if (proj.visualConfig.videoResolution) actions.setVideoResolution(proj.visualConfig.videoResolution);
    if (!_.isUndefined(proj.visualConfig.chromeHeadless)) actions.setChromeHeadless(proj.visualConfig.chromeHeadless);
    if (proj.visualConfig.stylePreset) actions.setStylePreset(proj.visualConfig.stylePreset);
    if (proj.visualConfig.styleBackgroundMode) actions.setStyleBackgroundMode(normalizeBackgroundMode(proj.visualConfig.styleBackgroundMode));
    actions.setStyleTextInImageMode(SCENE_TEXT_MODE);
    if (proj.visualConfig.imageFocusMode) actions.setImageFocusMode(proj.visualConfig.imageFocusMode);
    if (proj.visualConfig.thumbnailImageFocusMode) actions.setThumbnailImageFocusMode(proj.visualConfig.thumbnailImageFocusMode);
    if (!_.isUndefined(proj.visualConfig.thumbnailCount)) actions.setThumbnailCount(proj.visualConfig.thumbnailCount);
    if (proj.visualConfig.thumbnailReferencePrompt) actions.setThumbnailStylePreset(proj.visualConfig.thumbnailReferencePrompt);
    if (proj.visualConfig.thumbnailBackgroundMode) actions.setThumbnailBackgroundMode(normalizeBackgroundMode(proj.visualConfig.thumbnailBackgroundMode));
    actions.setThumbnailTextInImageMode(normalizeThumbnailTextMode(proj.visualConfig.thumbnailTextInImageMode));
    actions.setReferenceImages(_.defaultTo(proj.visualConfig.styleReferenceImages, _.isEmpty(proj.visualConfig.sceneReferenceImages) ? _.defaultTo(proj.visualConfig.referenceImages, []) : []));
    actions.setSceneReferenceImages(_.defaultTo(proj.visualConfig.sceneReferenceImages, []));
    actions.setThumbnailReferenceImages(_.defaultTo(proj.visualConfig.thumbnailReferenceImages, []));
    actions.setThumbnailSceneReferenceImages(_.defaultTo(proj.visualConfig.thumbnailSceneReferenceImages, []));
  }
};
export function useAutoVideoState(selectedProjectId: string | null | undefined, projects: VideoProject[], currentLang: Lang, scope: string = SOURCE_TEXT_AUTO) {
  const T = _.get(AUTO_GENERATOR_PANEL_TEXTS, currentLang, AUTO_GENERATOR_PANEL_TEXTS.vi);
  const usesCinematicDefaults = _.isEqual(scope, CINEMATIC_CONFIG.STATE_SCOPE);
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  const initialCachedConfig = useMemo(() => readSynchronousCache(selectedProjectId, scope), [scope]);
  const [inputType, setInputType] = useState<ProjectInputType>(initialCachedConfig?.inputType || ProjectInputType.Script);
  const [scriptContent, setScriptContent] = useState<string>(initialCachedConfig?.scriptContent ?? REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [genre, setGenre] = useState<string>(initialCachedConfig?.genre ? normalizeGenreValue(initialCachedConfig.genre) : DEFAULT_PROJECT_CONFIGS.GENRE);
  const [language, setLanguage] = useState<ProjectLanguage>(initialCachedConfig?.language || ProjectLanguage.VI);
  const [duration, setDuration] = useState<string>(initialCachedConfig?.duration || DEFAULT_PROJECT_CONFIGS.DURATION);
  const [rewriteLevel] = useState<number>(3);
  const [similarityReduction] = useState<number>(3);
  const [creativityLevel] = useState<number>(3);
  const [factCheck] = useState<boolean>(true);
  const [audience] = useState<string>(DEFAULT_PROJECT_CONFIGS.AUDIENCE);
  const [writingStyle] = useState<string>(DEFAULT_PROJECT_CONFIGS.WRITING_STYLE);
  const [splitStrategy, setSplitStrategy] = useState<string>(initialCachedConfig?.splitStrategy || REFACTOR_CONSTANTS.AVG_SPLIT_MIXED);
  const [hookStrategy] = useState<string>(DEFAULT_PROJECT_CONFIGS.HOOK_TYPE);
  const [hookDuration] = useState<number>(10);
  const [hookPosition] = useState<string>(REFACTOR_CONSTANTS.AVG_START_POS);
  const [voiceProvider, setVoiceProvider] = useState<string>(initialCachedConfig?.voiceProvider || DEFAULT_PROJECT_CONFIGS.VOICE_PROVIDER);
  const [voiceSpeed] = useState<number>(1.0);
  const [voicePitch] = useState<number>(1.0);
  const [voiceVolume] = useState<number>(1.0);
  const [voiceURI, setVoiceURI] = useState<string>(initialCachedConfig?.voiceURI || DEFAULT_PROJECT_CONFIGS.VOICE_URI);
  const [voiceName, setVoiceName] = useState<string>(initialCachedConfig?.voiceName || PRESET_CONSTANTS.DEFAULT_VOICE_NAME);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState<boolean>(false);
  const [generationMode, setGenerationMode] = useState<ImageGenerationMode>(initialCachedConfig?.generationMode || (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.MODE : ImageGenerationMode.GeminiChat));
  const [imageGeneratorEngine, setImageGeneratorEngine] = useState<ImageGeneratorEngine>(initialCachedConfig?.imageGeneratorEngine || (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.ENGINE : ImageGeneratorEngine.LabsSandbox));
  const [generateType, setGenerateType] = useState<GenerateType>(initialCachedConfig?.generateType || (usesCinematicDefaults ? GenerateType.Video : GenerateType.Image));
  const [maxVideoScenes, setMaxVideoScenes] = useState<number>(initialCachedConfig?.maxVideoScenes ?? MEDIA_MIX_CONFIG.DEFAULT_MAX_VIDEOS);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialCachedConfig?.aspectRatio || (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.ASPECT_RATIO : AspectRatio.SixteenNine));
  const [promptInputMethod] = useState<PromptInputMethod>(PromptInputMethod.Paste);
  const [sampleCount] = useState<number>(1);
  const [videoDuration, setVideoDuration] = useState<string>(initialCachedConfig?.videoDuration || (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.CLIP_DURATION : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_DURATION));
  const [videoResolution, setVideoResolution] = useState<string>(initialCachedConfig?.videoResolution || (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.RESOLUTION : REFACTOR_CONSTANTS.GROK_FREE_VIDEO_RESOLUTION));
  const [chromeHeadless, setChromeHeadless] = useState<boolean>(initialCachedConfig?.chromeHeadless ?? (usesCinematicDefaults ? CINEMATIC_CONFIG.GENERATION_DEFAULTS.CHROME_HEADLESS : AUTO_VIDEO_DEFAULTS.CHROME_HEADLESS));
  const [geminiChatSpeed] = useState<GeminiChatSpeed>(_.isEqual(_.toString(initialCachedConfig?.geminiChatSpeed), SOURCE_TEXT_1) ? GeminiChatSpeed.Slow : initialCachedConfig?.geminiChatSpeed || GeminiChatSpeed.Fast);
  const [batchDelay] = useState<BatchDelayOption>(BatchDelayOption.Random123);
  const [stylePreset, setStylePreset] = useState<string>(initialCachedConfig?.stylePreset || PRESET_CONSTANTS.DEFAULT_STYLE_PRESET);
  const [styleBackgroundMode, setStyleBackgroundMode] = useState<BackgroundMode>(initialCachedConfig?.styleBackgroundMode ? normalizeBackgroundMode(initialCachedConfig.styleBackgroundMode) : BackgroundMode.Contextual);
  const [styleTextInImageMode, setStyleTextInImageMode] = useState<TextInImageMode>(SCENE_TEXT_MODE);
  const [imageFocusMode, setImageFocusMode] = useState<ImageFocusMode>(initialCachedConfig?.imageFocusMode || ImageFocusMode.Default);
  const [thumbnailImageFocusMode, setThumbnailImageFocusMode] = useState<ImageFocusMode>(initialCachedConfig?.thumbnailImageFocusMode || ImageFocusMode.Default);
  const [referenceImages, setReferenceImages] = useState<string[]>(initialCachedConfig?.referenceImages || []);
  const [sceneReferenceImages, setSceneReferenceImages] = useState<string[]>(initialCachedConfig?.sceneReferenceImages || []);
  const [characterImages] = useState<string[]>([]);
  const [thumbnailCount, setThumbnailCount] = useState<number>(initialCachedConfig?.thumbnailCount ?? 2);
  const [thumbnailStylePreset, setThumbnailStylePreset] = useState<string>(initialCachedConfig?.thumbnailStylePreset || PRESET_CONSTANTS.DEFAULT_THUMB_STYLE_PRESET);
  const [thumbnailBackgroundMode, setThumbnailBackgroundMode] = useState<BackgroundMode>(initialCachedConfig?.thumbnailBackgroundMode ? normalizeBackgroundMode(initialCachedConfig.thumbnailBackgroundMode) : BackgroundMode.Auto);
  const [thumbnailTextInImageMode, setThumbnailTextInImageMode] = useState<ThumbnailTextMode>(initialCachedConfig?.thumbnailTextInImageMode ? normalizeThumbnailTextMode(initialCachedConfig.thumbnailTextInImageMode) : ThumbnailTextMode.Headline);
  const [thumbnailReferenceImages, setThumbnailReferenceImages] = useState<string[]>(initialCachedConfig?.thumbnailReferenceImages || []);
  const [thumbnailSceneReferenceImages, setThumbnailSceneReferenceImages] = useState<string[]>(initialCachedConfig?.thumbnailSceneReferenceImages || []);
  const [projectName, setProjectName] = useState<string>(initialCachedConfig?.projectName || buildInitialProjectName);
  const [resumeMode, setResumeMode] = useState<boolean>(initialCachedConfig?.resumeMode ?? AUTO_VIDEO_DEFAULTS.RESUME_MODE);
  const [showAdvancedImageSettings, setShowAdvancedImageSettings] = useState<boolean>(false);
  const [ffmpegQuality] = useState<VideoQuality>(VideoQuality.HIGHEST);
  const [musicAssetUrl, setMusicAssetUrl] = useState<string>(initialCachedConfig?.musicAssetUrl ?? REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [isConfigLoaded, setIsConfigLoaded] = useState(!selectedProjectId);
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
    setVideoDuration,
    setVideoResolution,
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
    setThumbnailSceneReferenceImages,
    setProjectName,
    setResumeMode,
    setShowAdvancedImageSettings,
    setMusicAssetUrl,
  };
  const loadConfig = useCallback(
    async (projectId?: string | null) => {
      setIsConfigLoaded(false);
      try {
        const parsed = (await jsonUtils.getAsyncItem<CachedGeneratorConfig | null>(getAutoVideoConfigStorageKey(projectId, scope), null)) || readSynchronousCache(projectId, scope);
        const foundProj = projectId ? _.find(projectsRef.current, { id: projectId }) : undefined;
        if (foundProj) {
          applyProjectToState(foundProj, actions);
          setProjectName(foundProj.name);
        } else if (parsed) {
          const usesCurrentDefaults = _.isEqual(parsed.version, AUTO_VIDEO_DEFAULTS.CONFIG_VERSION);
          if (parsed.inputType) setInputType(parsed.inputType);
          if (!_.isUndefined(parsed.scriptContent)) setScriptContent(parsed.scriptContent);
          if (parsed.genre) setGenre(normalizeGenreValue(parsed.genre));
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
          if (parsed.videoDuration) setVideoDuration(parsed.videoDuration);
          if (parsed.videoResolution) setVideoResolution(parsed.videoResolution);
          if (parsed.stylePreset) setStylePreset(parsed.stylePreset);
          if (parsed.styleBackgroundMode) setStyleBackgroundMode(normalizeBackgroundMode(parsed.styleBackgroundMode));
          setStyleTextInImageMode(SCENE_TEXT_MODE);
          if (parsed.imageFocusMode) setImageFocusMode(parsed.imageFocusMode);
          if (parsed.thumbnailImageFocusMode) setThumbnailImageFocusMode(parsed.thumbnailImageFocusMode);
          if (!_.isUndefined(parsed.thumbnailCount)) setThumbnailCount(parsed.thumbnailCount);
          if (parsed.thumbnailStylePreset) setThumbnailStylePreset(parsed.thumbnailStylePreset);
          if (parsed.thumbnailBackgroundMode) setThumbnailBackgroundMode(normalizeBackgroundMode(parsed.thumbnailBackgroundMode));
          setThumbnailTextInImageMode(normalizeThumbnailTextMode(parsed.thumbnailTextInImageMode));
          if (parsed.projectName) setProjectName(parsed.projectName);
          if (!_.isUndefined(parsed.musicAssetUrl)) setMusicAssetUrl(parsed.musicAssetUrl);
          setReferenceImages(_.defaultTo(parsed.referenceImages, []));
          setSceneReferenceImages(_.defaultTo(parsed.sceneReferenceImages, []));
          setThumbnailReferenceImages(_.defaultTo(parsed.thumbnailReferenceImages, []));
          setThumbnailSceneReferenceImages(_.defaultTo(parsed.thumbnailSceneReferenceImages, []));
          setResumeMode(usesCurrentDefaults && !_.isUndefined(parsed.resumeMode) ? parsed.resumeMode : AUTO_VIDEO_DEFAULTS.RESUME_MODE);
          setChromeHeadless(usesCurrentDefaults && !_.isUndefined(parsed.chromeHeadless) ? parsed.chromeHeadless : AUTO_VIDEO_DEFAULTS.CHROME_HEADLESS);
        }
      } catch (error) {
        logger.error(T.errLoadConfig, error);
      } finally {
        setIsConfigLoaded(true);
      }
    },
    [T.errLoadConfig],
  );
  useEffect(() => {
    if (selectedProjectId) void loadConfig(selectedProjectId);
  }, [selectedProjectId, loadConfig]);
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
      videoDuration,
      videoResolution,
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
      thumbnailSceneReferenceImages,
      resumeMode,
      chromeHeadless,
      musicAssetUrl,
    };
    const targetKey = getAutoVideoConfigStorageKey(selectedProjectId, scope);
    const serialized = jsonUtils.safeStringify(config);
    storageUtils.set(targetKey, serialized);
    storageUtils.set(getAutoVideoConfigStorageKey(undefined, scope), serialized);
    void storageUtils.setAsync(targetKey, serialized);
  }, [
    isConfigLoaded,
    selectedProjectId,
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
    videoDuration,
    videoResolution,
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
    thumbnailSceneReferenceImages,
    resumeMode,
    chromeHeadless,
    musicAssetUrl,
  ]);
  const state: AutoVideoFormState = {
    inputType,
    scriptContent,
    genre,
    language,
    duration,
    rewriteLevel,
    similarityReduction,
    creativityLevel,
    factCheck,
    audience,
    writingStyle,
    splitStrategy,
    hookStrategy,
    hookDuration,
    hookPosition,
    voiceProvider,
    voiceSpeed,
    voicePitch,
    voiceVolume,
    voiceURI,
    voiceName,
    isVoiceDialogOpen,
    generationMode,
    imageGeneratorEngine,
    generateType,
    maxVideoScenes,
    aspectRatio,
    promptInputMethod,
    sampleCount,
    videoDuration,
    videoResolution,
    chromeHeadless,
    geminiChatSpeed,
    batchDelay,
    stylePreset,
    styleBackgroundMode,
    styleTextInImageMode,
    imageFocusMode,
    thumbnailImageFocusMode,
    referenceImages,
    sceneReferenceImages,
    characterImages,
    thumbnailCount,
    thumbnailStylePreset,
    thumbnailBackgroundMode,
    thumbnailTextInImageMode,
    thumbnailReferenceImages,
    thumbnailSceneReferenceImages,
    projectName,
    resumeMode,
    showAdvancedImageSettings,
    ffmpegQuality,
    isConfigLoaded,
    musicAssetUrl,
  };
  return { state, actions };
}
