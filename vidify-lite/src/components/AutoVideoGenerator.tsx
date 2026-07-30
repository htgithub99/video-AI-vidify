import { useState, useEffect, useRef } from "react";
import _ from "lodash";
import { usePresets } from "../hooks/usePresets";
import { VideoProject, ProjectInputType, ProjectLanguage, Gender, AgeGroup, AspectRatio, ImageGenerationMode, ImageGeneratorEngine, GenerateType, BatchDelayOption, GeminiChatSpeed, PromptInputMethod, VoiceConfig, ThumbnailItem } from "../types";
import { VideoQuality } from "../constants/enums";
import { GENRE_OPTIONS, DURATION_OPTIONS, PROJECT_LANGUAGE_OPTIONS, SPLIT_STRATEGY_OPTIONS, API_ROUTES, HTTP_METHODS, CONTENT_TYPES, CONTENT_TYPE_HEADER, DEFAULT_PROJECT_CONFIGS, genreLabels, REFACTOR_CONSTANTS, SecurityConstants, STORAGE_KEYS, API_HEADERS } from "../constants";
import { AUTO_GENERATOR_PANEL_TEXTS, PRESET_CONSTANTS } from "../constants/texts";
import { Lang } from "../lib/lang";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { VoiceSelectionDialog } from "./VoiceSelectionDialog";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { formatTimeHelper } from "../utils/helpers";
import { AUTO_GENERATOR_CONSTANTS, FFMPEG_RENDER_CONSTANTS } from "../constants/config";
import { safeSystemFetch, safeSystemFetchStream, readFilesAsDataURL } from "../lib/shared-utils";
import {
  Zap,
  Sparkles,
  Mic,
  Video,
  Download,
  ChevronDown,
  Save,
  Trash,
  Sliders,
  Terminal,
  Eye,
  FileText,
  Layers,
  Check,
  Clock,
  Layout,
  Wand2,
  Globe,
  Film,
  Upload,
  X,
  ImageIcon,
  Target,
  Copy,
  RefreshCw,
} from "lucide-react";

interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<void> | void;
  theme?: "dark" | "light";
}

const getEngineOptions = (genMode: ImageGenerationMode, genType: GenerateType): { value: ImageGeneratorEngine; label: string }[] => {
  if (_.isEqual(genMode, ImageGenerationMode.GeminiChat)) {
    return [
      { value: ImageGeneratorEngine.Imagen, label: REFACTOR_CONSTANTS.ENGINE_IMAGEN },
      { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_VEO3 },
      { value: ImageGeneratorEngine.LabsSandbox, label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX },
    ];
  }
  if (_.isEqual(genType, GenerateType.Video)) {
    return [
      { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_OMNI_FLASH },
      { value: ImageGeneratorEngine.Veo3Lite, label: REFACTOR_CONSTANTS.ENGINE_VEO3_LITE },
      { value: ImageGeneratorEngine.Veo3Fast, label: REFACTOR_CONSTANTS.ENGINE_VEO3_FAST },
      { value: ImageGeneratorEngine.Veo3Quality, label: REFACTOR_CONSTANTS.ENGINE_VEO3_QUALITY },
    ];
  }
  return [
    { value: ImageGeneratorEngine.Imagen, label: REFACTOR_CONSTANTS.ENGINE_IMAGEN_3_BATCH },
    { value: ImageGeneratorEngine.Veo3, label: REFACTOR_CONSTANTS.ENGINE_VEO_3_0_FLUID },
    { value: ImageGeneratorEngine.LabsSandbox, label: REFACTOR_CONSTANTS.ENGINE_LABS_SANDBOX_STILL },
  ];
};

export default function AutoVideoGenerator({
  currentLang,
  projects,
  onSelectProject,
  onUpdateProject,
}: AutoVideoGeneratorProps) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const processingRef = useRef(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

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
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.NineSixteen);
  const [promptInputMethod] = useState<PromptInputMethod>(PromptInputMethod.Paste);
  const [sampleCount] = useState<number>(1);
  const [videoDuration] = useState<string>(REFACTOR_CONSTANTS.AVG_DEFAULT_DURATION);
  const [chromeHeadless, setChromeHeadless] = useState<boolean>(true);
  const [geminiChatSpeed] = useState<GeminiChatSpeed>(GeminiChatSpeed.Normal);
  const [batchDelay] = useState<BatchDelayOption>(BatchDelayOption.Random123);

  const [stylePreset, setStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_STYLE_PRESET);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const [characterImages] = useState<string[]>([]);

  const [thumbnailCount, setThumbnailCount] = useState<number>(2);
  const [thumbnailStylePreset, setThumbnailStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_THUMB_STYLE_PRESET);
  const [thumbnailReferenceImages, setThumbnailReferenceImages] = useState<string[]>([]);

  const [projectName, setProjectName] = useState<string>(() => _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, new Date().toISOString().slice(REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_0, REFACTOR_CONSTANTS.AVG_DATE_FORMAT_SLICE_10)], REFACTOR_CONSTANTS.VD_EMPTY_STRING));
  const [resumeMode, setResumeMode] = useState<boolean>(true);
  const [showAdvancedImageSettings, setShowAdvancedImageSettings] = useState<boolean>(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const saved = await storageUtils.getAsync(STORAGE_KEYS.AUTO_GENERATOR_CONFIG);
        const parsed = jsonUtils.safeParse<any>(saved, null);
        if (parsed) {
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
          if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
          if (parsed.stylePreset) setStylePreset(parsed.stylePreset);
          if (parsed.thumbnailCount !== undefined) setThumbnailCount(parsed.thumbnailCount);
          if (parsed.thumbnailStylePreset) setThumbnailStylePreset(parsed.thumbnailStylePreset);
          if (parsed.projectName) setProjectName(parsed.projectName);
          if (parsed.referenceImages) setReferenceImages(parsed.referenceImages);
          if (parsed.thumbnailReferenceImages) setThumbnailReferenceImages(parsed.thumbnailReferenceImages);
          if (parsed.resumeMode !== undefined) setResumeMode(parsed.resumeMode);
          if (parsed.chromeHeadless !== undefined) setChromeHeadless(parsed.chromeHeadless);
        }
      } catch (e) {
        logger.error(T.errLoadConfig, e);
      } finally {
        setIsConfigLoaded(true);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!isConfigLoaded) return;
    const config = {
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
      aspectRatio,
      stylePreset,
      thumbnailCount,
      thumbnailStylePreset,
      projectName,
      referenceImages,
      thumbnailReferenceImages,
      resumeMode,
      chromeHeadless,
    };
    storageUtils.setAsync(STORAGE_KEYS.AUTO_GENERATOR_CONFIG, jsonUtils.safeStringify(config));
  }, [
    isConfigLoaded,
    inputType, scriptContent, genre, language, duration, splitStrategy,
    voiceProvider, voiceURI, voiceName, generationMode, imageGeneratorEngine,
    generateType, aspectRatio, stylePreset, thumbnailCount, thumbnailStylePreset,
    projectName, referenceImages, thumbnailReferenceImages, resumeMode, chromeHeadless
  ]);
  const [ffmpegQuality] = useState<VideoQuality>(VideoQuality.HIGH);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [activeCreatedProject, setActiveCreatedProject] = useState<VideoProject | null>(null);

  useEffect(() => {
    const restoreAutoProject = async () => {
      try {
        const savedId = await storageUtils.getAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT);
        if (savedId && !activeCreatedProject) {
          const foundProj = _.find(projects, { id: savedId });
          if (foundProj) {
            setActiveCreatedProject(foundProj);
            if (foundProj.renderedVideoUrl) {
              setRenderedVideoUrl(foundProj.renderedVideoUrl);
            }
            if (foundProj.generationLogs) {
              setLogs(foundProj.generationLogs);
            }
            if (foundProj.input?.content) {
              setScriptContent(foundProj.input.content);
            }
            if (foundProj.config) {
              if (foundProj.config.genre) setGenre(foundProj.config.genre);
              if (foundProj.config.language) setLanguage(foundProj.config.language);
              if (foundProj.config.duration) setDuration(foundProj.config.duration);
              if (foundProj.config.splitStrategy) setSplitStrategy(foundProj.config.splitStrategy);
            }
            if (foundProj.voiceConfig) {
              if (foundProj.voiceConfig.provider) setVoiceProvider(foundProj.voiceConfig.provider);
              if (foundProj.voiceConfig.voiceURI) setVoiceURI(foundProj.voiceConfig.voiceURI);
              if (foundProj.voiceConfig.voiceName) setVoiceName(foundProj.voiceConfig.voiceName);
            }
            if (foundProj.visualConfig) {
              if (foundProj.visualConfig.generationMode) setGenerationMode(foundProj.visualConfig.generationMode);
              if (foundProj.visualConfig.imageGeneratorEngine) setImageGeneratorEngine(foundProj.visualConfig.imageGeneratorEngine);
              if (foundProj.visualConfig.generateType) setGenerateType(foundProj.visualConfig.generateType);
              if (foundProj.visualConfig.aspectRatio) setAspectRatio(foundProj.visualConfig.aspectRatio as AspectRatio);
              if (foundProj.visualConfig.stylePreset) setStylePreset(foundProj.visualConfig.stylePreset);
              if (!_.isUndefined(foundProj.visualConfig.thumbnailCount)) setThumbnailCount(foundProj.visualConfig.thumbnailCount);
              if (foundProj.visualConfig.thumbnailReferencePrompt) setThumbnailStylePreset(foundProj.visualConfig.thumbnailReferencePrompt);
            }
          }
        }
      } catch (e) {
        logger.error(REFACTOR_CONSTANTS.ERR_RESTORE, e);
      }
    };
    restoreAutoProject();
  }, [projects, activeCreatedProject]);

  const { data: presetsData, refetch: refetchPresets } = usePresets();
  const presets = presetsData || [];
  const [presetNameInput, setPresetNameInput] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, _.join([`[${timestamp}]`, msg], REFACTOR_CONSTANTS.AVG_BLANK)]);
  };

  const handleSavePreset = async () => {
    const trimmedName = _.trim(presetNameInput);
    if (_.isEmpty(trimmedName)) return;
    const newPresetData: any = {
      id: _.join([PRESET_CONSTANTS.ID_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
      name: trimmedName,
      config: {
        [REFACTOR_CONSTANTS.AVG_INPUT_TYPE_KEY]: inputType,
        [REFACTOR_CONSTANTS.AVG_GENRE_KEY]: genre,
        [REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY]: language,
        [REFACTOR_CONSTANTS.AVG_DURATION_KEY]: duration,
        [REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY]: splitStrategy,
        [REFACTOR_CONSTANTS.AVG_VOICE_PROVIDER_KEY]: voiceProvider,
        [REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY]: voiceURI,
        [REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY]: voiceName,
        [REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY]: generationMode,
        [REFACTOR_CONSTANTS.AVG_GENERATE_TYPE_KEY]: generateType,
        [REFACTOR_CONSTANTS.AVG_IMAGE_GENERATOR_ENGINE_KEY]: imageGeneratorEngine,
        [REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY]: aspectRatio,
        [REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY]: stylePreset,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY]: thumbnailCount,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY]: thumbnailStylePreset,
      },
    };
    try {
      const res = await fetch(API_ROUTES.PRESETS, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(newPresetData),
      });
      const saved = await res.json();
      if (saved && saved.id) {
        refetchPresets();
        setPresetNameInput(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        addLog(T.logSavedPreset(saved.name));
      }
    } catch (err) {
      logger.error(REFACTOR_CONSTANTS.VD_EMPTY_STRING, err);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = _.find(presets, { id: presetId });
    if (!preset) return;
    const c = _.get(preset, "config", {});
    const genreVal = _.get(c, REFACTOR_CONSTANTS.AVG_GENRE_KEY);
    if (genreVal) setGenre(genreVal);
    const langVal = _.get(c, REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY);
    if (langVal) setLanguage(langVal);
    const durationVal = _.get(c, REFACTOR_CONSTANTS.AVG_DURATION_KEY);
    if (durationVal) setDuration(durationVal);
    const splitStrategyVal = _.get(c, REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY);
    if (splitStrategyVal) setSplitStrategy(splitStrategyVal);
    const voiceURIVal = _.get(c, REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY);
    if (voiceURIVal) setVoiceURI(voiceURIVal);
    const voiceNameVal = _.get(c, REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY);
    if (voiceNameVal) setVoiceName(voiceNameVal);
    const aspectRatioVal = _.get(c, REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY);
    if (aspectRatioVal) setAspectRatio(aspectRatioVal);
    const genModeVal = _.get(c, REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY);
    if (genModeVal) setGenerationMode(genModeVal);
    const stylePresetVal = _.get(c, REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY);
    if (stylePresetVal) setStylePreset(stylePresetVal);
    const thumbCountVal = _.get(c, REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY);
    if (thumbCountVal) setThumbnailCount(thumbCountVal);
    const thumbStylePresetVal = _.get(c, REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY);
    if (thumbStylePresetVal) setThumbnailStylePreset(thumbStylePresetVal);
    setSelectedPresetId(presetId);
    addLog(T.logAppliedPreset(preset.name));
  };

  const handleDeletePreset = async (id: string) => {
    try {
      const res = await fetch(_.join([API_ROUTES.PRESETS, id], REFACTOR_CONSTANTS.VD_SLASH), {
        method: HTTP_METHODS.DELETE,
      });
      const json = await res.json();
      if (json.success) {
        refetchPresets();
        if (_.isEqual(selectedPresetId, id)) setSelectedPresetId(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      }
    } catch (err) {
      logger.error(REFACTOR_CONSTANTS.VD_EMPTY_STRING, err);
    }
  };

  const handleStyleFilesUpload = (files: FileList) => {
    readFilesAsDataURL(files, (result) => {
      setReferenceImages((prev) => [...prev, result]);
    });
    addLog(T.logStyleUploaded(files.length));
  };

  const handleThumbnailStyleFilesUpload = (files: FileList) => {
    readFilesAsDataURL(files, (result) => {
      setThumbnailReferenceImages((prev) => [...prev, result]);
    });
    addLog(T.logThumbUploaded(files.length));
  };


  const handleStartAutoGenerate = async () => {
    if (processingRef.current) return;
    if (_.isEmpty(_.trim(scriptContent))) {
      alert(T.alertEmptyScript);
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setStepProgress(5);
    setCurrentStepIndex(1);
    setLogs([]);
    setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

    let currentLogs: string[] = [];
    const appendLog = (msg: string) => {
      const timestamp = new Date().toLocaleTimeString();
      const formatted = `[${timestamp}] ${msg}`;
      currentLogs.push(formatted);
      setLogs([...currentLogs]);
    };

    appendLog(T.logPipelineStart);

    try {
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_INIT);
      let newProjectId = "";
      let newProj: VideoProject;

      if (resumeMode && activeCreatedProject) {
        newProjectId = activeCreatedProject.id;
        newProj = {
          ...activeCreatedProject,
          status: REFACTOR_CONSTANTS.STATUS_GENERATING,
        };
        appendLog(T.logResumeProject(newProj.name));
      } else {
        newProjectId = _.join([REFACTOR_CONSTANTS.AVG_PROJECT_ID_PREFIX, Math.random().toString(REFACTOR_CONSTANTS.RADIX_36).substring(REFACTOR_CONSTANTS.RANDOM_STRING_START, REFACTOR_CONSTANTS.RANDOM_STRING_END)], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        newProj = {
          id: newProjectId,
          name: _.trim(projectName) || _.join([PRESET_CONSTANTS.PROJECT_NAME_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          description: _.join([REFACTOR_CONSTANTS.AVG_AUTO_DESC_PREFIX, new Date().toLocaleString()], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: REFACTOR_CONSTANTS.STATUS_GENERATING,
          input: {
            type: inputType,
            content: scriptContent,
          },
          config: {
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
          },
          hookConfig: {
            type: hookStrategy,
            duration: hookDuration,
            count: 3,
            positions: hookPosition as any,
            versions: [],
          },
          voiceConfig: {
            provider: voiceProvider,
            audioType: REFACTOR_CONSTANTS.AVG_AUDIO_TYPE_TTS as any,
            gender: Gender.Male,
            age: AgeGroup.Adult,
            emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL,
            speed: voiceSpeed,
            pitch: voicePitch,
            volume: voiceVolume,
            voiceURI,
            voiceName,
          },
          visualConfig: {
            source: REFACTOR_CONSTANTS.AVG_VISUAL_SOURCE_AUTO,
            style: stylePreset,
            quality: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
            density: 5,
            characterConsistency: true,
            assetsMode: REFACTOR_CONSTANTS.AVG_ASSETS_MODE_MIXED as any,
            imageGeneratorEngine,
            generateType,
            aspectRatio,
            promptInputMethod,
            generateCount: sampleCount,
            chromeHeadless,
            generationMode,
            geminiChatSpeed,
            batchDelay,
            videoDuration,
            thumbnailCount,
            thumbnailReferenceImages,
            thumbnailReferencePrompt: thumbnailStylePreset,
            referenceImages,
            referencePrompt: stylePreset,
            characters: [
              {
                id: REFACTOR_CONSTANTS.AVG_CHARACTER_ID_DEFAULT,
                name: PRESET_CONSTANTS.CHARACTER_NAME,
                description: PRESET_CONSTANTS.CHARACTER_BIO,
                images: characterImages,
              },
            ],
          },
          seoConfig: {
            numTitles: 3,
            numDescriptions: 1,
            numHashtags: 5,
            numTags: 10,
          },
          creditsUsed: 0,
        };
      }

      await storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, newProjectId);
      setActiveCreatedProject(newProj);

      const syncProject = async (proj: VideoProject) => {
        const currentLogs = _.clone(logs);
        const finalProj = {
          ...proj,
          generationLogs: currentLogs,
          updatedAt: new Date().toISOString()
        };
        setActiveCreatedProject(finalProj);
        await onUpdateProject(finalProj, true);
      };

      await syncProject(newProj);
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROJECT_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, _.get(newProj, REFACTOR_CONSTANTS.AVG_NAME_KEY)));
      setStepProgress(10);

      let realScript = "";
      let chapters = [];
      let factCheckNotes = "";
      let realScenes = [];
      let isScriptCached = false;

      if (resumeMode && !_.isEmpty(newProj.scriptRewritten) && !_.isEmpty(newProj.storyboard)) {
        realScript = newProj.scriptRewritten;
        chapters = newProj.chapters || [];
        factCheckNotes = newProj.factCheckNotes || "";
        realScenes = _.cloneDeep(newProj.storyboard);
        isScriptCached = true;
        appendLog(T.logResumeScript);
        setStepProgress(30);
      }

      if (!isScriptCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_WRITE);
        const scriptPayload = {
          originalInput: scriptContent,
          inputType: inputType,
          config: {
            ...newProj.config,
            hookConfig: newProj.hookConfig,
          },
          selectedHookText: "",
          bypassCache: true,
        };

        const scriptRes = await safeSystemFetch(API_ROUTES.PIPELINE_SCRIPT, scriptPayload);
        if (!scriptRes.success || !scriptRes.data || scriptRes.data.error) {
          throw new Error(scriptRes.error || scriptRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_SCRIPT_REWRITE);
        }

        realScript = scriptRes.data.rewrittenScript || scriptContent;
        chapters = scriptRes.data.chapters || [];
        factCheckNotes = scriptRes.data.factCheckNotes || "";
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SCRIPT_REWRITE_SUCCESS);
        setStepProgress(20);

        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SPLIT);
        const storyboardPayload = {
          rewrittenScript: realScript,
          chapters: chapters,
          config: {
            ...newProj.config,
            ...newProj.voiceConfig,
            visualStylePreset: newProj.visualConfig.style,
            aspectRatio: newProj.visualConfig.aspectRatio,
            imageQuality: newProj.visualConfig.quality,
          },
          visualStyle: newProj.visualConfig.style || "Cinematic",
          referenceImages: newProj.visualConfig.referenceImages || [],
          referenceStyle: newProj.visualConfig.referencePrompt,
          visualDensity: 5,
          bypassCache: true,
        };

        const storyboardRes = await safeSystemFetch(API_ROUTES.PIPELINE_STORYBOARD, storyboardPayload);
        if (!storyboardRes.success || !storyboardRes.data || storyboardRes.data.error) {
          throw new Error(storyboardRes.error || storyboardRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_STORYBOARD_SPLIT);
        }

        realScenes = storyboardRes.data.scenes || [];
        if (_.isEmpty(realScenes)) {
          throw new Error(AUTO_GENERATOR_CONSTANTS.ERR_NO_SCENES_CREATED);
        }
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STORYBOARD_SUCCESS.replace(SecurityConstants.PLACEHOLDER_0, String(realScenes.length)));
        setStepProgress(30);

        const scriptUpdatedProj = {
          ...newProj,
          scriptRewritten: realScript,
          factCheckNotes,
          chapters,
          storyboard: realScenes
        };
        await syncProject(scriptUpdatedProj);
        newProj = scriptUpdatedProj;
      }

      let globalAudioBase64 = "";
      let globalAudioUrl = "";
      let isVoiceCached = false;

      if (resumeMode && newProj.voiceConfig?.audioBase64) {
        globalAudioBase64 = newProj.voiceConfig.audioBase64;
        globalAudioUrl = newProj.voiceConfig.audioUrl || "";
        isVoiceCached = true;
        appendLog(T.logResumeVoice);
        setStepProgress(50);
      }

      let voiceUpdatedProj = newProj;
      if (!isVoiceCached) {
        setStepProgress(35);
        setCurrentStepIndex(2);

        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_GEN_TTS.replace(SecurityConstants.PLACEHOLDER_0, voiceName || "Mặc định"));
        const voicePayload = {
          text: realScript,
          voiceURI: voiceURI,
          voice_id: voiceURI,
          provider: voiceProvider,
          speed: voiceSpeed,
          pitch: voicePitch,
          volume: voiceVolume,
          gender: Gender.Male,
          age: AgeGroup.Adult,
          emotion: REFACTOR_CONSTANTS.AVG_EMOTION_NORMAL,
        };

        const ttsRes = await safeSystemFetch(API_ROUTES.PIPELINE_VOICE, voicePayload);
        if (!ttsRes.success || !ttsRes.data || !ttsRes.data.success || !ttsRes.data.audioBase64) {
          throw new Error(ttsRes.error || ttsRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_TTS_FAILED);
        }

        globalAudioBase64 = ttsRes.data.audioBase64;
        globalAudioUrl = ttsRes.data.audioUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING;
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_VOICE_TTS_SUCCESS);
        setStepProgress(50);

        voiceUpdatedProj = {
          ...newProj,
          storyboard: realScenes,
          voiceConfig: {
            ...(newProj.voiceConfig || {} as any),
            audioType: AUTO_GENERATOR_CONSTANTS.AUDIO_TYPE_TTS as any,
            provider: voiceProvider,
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl
          } as VoiceConfig
        };
        await syncProject(voiceUpdatedProj);
      } else {
        voiceUpdatedProj = {
          ...newProj,
          storyboard: realScenes,
          voiceConfig: {
            ...(newProj.voiceConfig || {} as any),
            audioBase64: globalAudioBase64,
            audioUrl: globalAudioUrl
          } as VoiceConfig
        };
      }

      let currentStylePreset = stylePreset;
      let currentThumbnailStyle = thumbnailStylePreset;

      if (!isScriptCached) {
        if (!_.isEmpty(referenceImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT);
          const extractStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images: referenceImages });
          if (extractStyleRes.success && extractStyleRes.data?.style) {
            const extractedStyle = extractStyleRes.data.style;
            currentStylePreset = extractedStyle;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_EXTRACT_SUCCESS.replace(
              SecurityConstants.PLACEHOLDER_0,
              _.join([
                REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE,
                _.truncate(extractedStyle, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }),
                REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE
              ], REFACTOR_CONSTANTS.VD_EMPTY_STRING)
            ));
            setStylePreset(extractedStyle);

            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_APPLY);
            const rewriteStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS, {
              storyboard: realScenes,
              newStyle: extractedStyle,
              aspectRatio: aspectRatio,
            });
            if (rewriteStyleRes.success && rewriteStyleRes.data?.storyboard) {
              realScenes = rewriteStyleRes.data.storyboard;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_STYLE_APPLY_SUCCESS);
            }
          }
        }

        if (!_.isEmpty(thumbnailReferenceImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT);
          const extractThumbStyleRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images: thumbnailReferenceImages });
          if (extractThumbStyleRes.success && extractThumbStyleRes.data?.style) {
            currentThumbnailStyle = extractThumbStyleRes.data.style;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_EXTRACT_SUCCESS.replace(
              SecurityConstants.PLACEHOLDER_0,
              _.join([
                REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE,
                _.truncate(currentThumbnailStyle, { length: 60, omission: REFACTOR_CONSTANTS.AVG_ELLIPSIS }),
                REFACTOR_CONSTANTS.AVG_DOUBLE_QUOTE
              ], REFACTOR_CONSTANTS.VD_EMPTY_STRING)
            ));
            setThumbnailStylePreset(currentThumbnailStyle);
          }
        }

        voiceUpdatedProj = {
          ...voiceUpdatedProj,
          visualConfig: {
            ...(voiceUpdatedProj.visualConfig || {} as any),
            style: currentStylePreset,
            referencePrompt: currentStylePreset,
            thumbnailReferencePrompt: currentThumbnailStyle,
          }
        };
        await syncProject(voiceUpdatedProj);

        if (!_.isEmpty(characterImages)) {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_EXTRACT);
          const extractCharRes = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_CHARACTER, {
            images: characterImages,
            characterDescription: PRESET_CONSTANTS.CHARACTER_BIO,
          });
          if (extractCharRes.success && extractCharRes.data?.characterPrompt) {
            const characterPrompt = extractCharRes.data.characterPrompt;
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_EXTRACT_SUCCESS);

            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_CHAR_REWRITE);
            const rewriteCharRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS_CHARACTER, {
              storyboard: realScenes,
              characters: [{ name: PRESET_CONSTANTS.CHARACTER_NAME, prompt: characterPrompt }],
              aspectRatio: aspectRatio,
            });
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
          aspectRatio: aspectRatio,
          language: language,
        });
        if (optimizeRes.success && optimizeRes.data?.storyboard) {
          realScenes = optimizeRes.data.storyboard;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_PROMPT_OPTIMIZE_SUCCESS);
        }
      } else {
        currentStylePreset = voiceUpdatedProj.visualConfig?.style || stylePreset;
        currentThumbnailStyle = voiceUpdatedProj.visualConfig?.thumbnailReferencePrompt || thumbnailStylePreset;
      }
      setStepProgress(60);

      setStepProgress(65);
      setCurrentStepIndex(3);
      const modeName = _.isEqual(generationMode, ImageGenerationMode.GeminiChat) ? AUTO_GENERATOR_CONSTANTS.MODE_NAME_GEMINI_ROOM : AUTO_GENERATOR_CONSTANTS.MODE_NAME_FLOW_VEO3;
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_GEN.replace(SecurityConstants.PLACEHOLDER_0, modeName));

      const visualConfigPayload = {
        ...(voiceUpdatedProj.visualConfig || {}),
        generationMode,
        imageGeneratorEngine,
        aspectRatio,
        generateType,
        chromeHeadless,
        geminiChatSpeed,
        style: currentStylePreset,
      };
      const sandboxConfigPayload = {
        projectId: voiceUpdatedProj.id
      };

      const targetScenesToGen = _.filter(realScenes, (sc) => {
        if (resumeMode && (!_.isEmpty(sc.assetUrl) || !_.isEmpty(sc.assetUrls))) {
          return false;
        }
        return true;
      });

      if (resumeMode) {
        realScenes.forEach((sc, idx) => {
          if (!_.isEmpty(sc.assetUrl) || !_.isEmpty(sc.assetUrls)) {
            appendLog(T.logResumeSceneSkip(idx + 1, realScenes.length));
          }
        });
      }

      if (targetScenesToGen.length > 0) {

        if (_.isEqual(generationMode, ImageGenerationMode.GeminiChat)) {
          appendLog(T.logBatchImageStreamStart);
          try {
            const batchItems = _.map(targetScenesToGen, (s) => ({
              sceneId: s.id,
              prompt: _.get(s, REFACTOR_CONSTANTS.AVG_PROMPT_KEY) || _.get(s, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
            }));

            let completedCount = 0;
            await safeSystemFetchStream(
              API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES,
              {
                items: batchItems,
                visualConfig: visualConfigPayload,
                style: currentStylePreset,
                sandboxConfig: sandboxConfigPayload
              },
              (result) => {
                if (result && result.success && result.base64) {
                  const imageUrl = `${REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX}${result.base64}`;
                  const sc = _.find(realScenes, (s) => _.eq(s.id, result.sceneId));
                  if (sc) {
                    sc.assetUrl = imageUrl;
                    sc.assetUrls = [imageUrl];
                    completedCount++;
                    appendLog(T.logBatchImageSceneSuccess(result.sceneId, completedCount, targetScenesToGen.length));
                  }
                } else {
                  appendLog(T.logBatchImageSceneError(result?.sceneId || "unknown", result?.warning || "Unknown warning"));
                }
              }
            );
          } catch (e: any) {
            appendLog(T.logBatchStreamErrorFallback(e.message));
            for (let i = 0; i < targetScenesToGen.length; i++) {
              const sc = targetScenesToGen[i];
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_SCENE_GEN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)).replace(SecurityConstants.PLACEHOLDER_1, String(targetScenesToGen.length)));
              try {
                const imgRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                  prompt: _.get(sc, REFACTOR_CONSTANTS.AVG_PROMPT_KEY) || _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
                  style: currentStylePreset,
                  resolution: voiceUpdatedProj.visualConfig?.quality || "Standard",
                  bypassCache: false,
                  engine: imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                  sandboxConfig: sandboxConfigPayload,
                  visualConfig: visualConfigPayload
                });
                if (imgRes.success && imgRes.data) {
                  const base64Val = imgRes.data.base64 || _.get(imgRes.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
                  if (base64Val) {
                    const dataUrl = `${REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX}${base64Val}`;
                    sc.assetUrl = dataUrl;
                    sc.assetUrls = [dataUrl];
                  }
                }
              } catch (err) {
                appendLog(T.logFallbackSceneError(sc.id));
              }
            }
          } finally {
            fetch(`${window.location.origin}${API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES}`, {
              method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
              headers: {
                [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING
              }
            }).catch(() => {});
          }
        } else {
          for (let i = 0; i < targetScenesToGen.length; i++) {
            const sc = targetScenesToGen[i];
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_IMAGE_SCENE_GEN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)).replace(SecurityConstants.PLACEHOLDER_1, String(targetScenesToGen.length)));
            try {
              const imgRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
                prompt: _.get(sc, REFACTOR_CONSTANTS.AVG_PROMPT_KEY) || _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY),
                style: currentStylePreset,
                resolution: voiceUpdatedProj.visualConfig?.quality || "Standard",
                bypassCache: false,
                engine: imageGeneratorEngine || ImageGeneratorEngine.Veo3,
                sandboxConfig: sandboxConfigPayload,
                visualConfig: visualConfigPayload
              });
              if (imgRes.success && imgRes.data) {
                const base64Val = imgRes.data.base64 || _.get(imgRes.data, REFACTOR_CONSTANTS.AVG_IMAGE_BASE64_KEY);
                const fallbackUrl = _.get(imgRes.data, REFACTOR_CONSTANTS.AVG_FALLBACK_URL_KEY);
                if (base64Val) {
                  const dataUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, base64Val], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                  sc.assetUrl = dataUrl;
                  sc.assetUrls = [dataUrl];
                } else if (fallbackUrl) {
                  sc.assetUrl = fallbackUrl;
                  sc.assetUrls = [fallbackUrl];
                }
              }
            } catch (e) {
              appendLog(AUTO_GENERATOR_CONSTANTS.API_GEN_FALLBACK_WARN.replace(SecurityConstants.PLACEHOLDER_0, String(i + 1)));
            }
          }
        }
      }
      appendLog(AUTO_GENERATOR_CONSTANTS.API_IMAGE_SUCCESS);
      setStepProgress(75);

      const imageUpdatedProj = {
        ...voiceUpdatedProj,
        storyboard: realScenes
      };
      await syncProject(imageUpdatedProj);

      let seoData = null;
      let isSeoCached = false;
      if (resumeMode && newProj.seo) {
        seoData = newProj.seo;
        isSeoCached = true;
        appendLog(T.logResumeSeo);
      }

      if (!isSeoCached) {
        appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_OPTIMIZE);
        const seoPayload = {
          originalInput: scriptContent,
          config: imageUpdatedProj.config,
          seoConfig: imageUpdatedProj.seoConfig,
          rewrittenScript: realScript,
          bypassCache: true,
        };
        const seoRes = await safeSystemFetch(API_ROUTES.PIPELINE_SEO, seoPayload);
        if (seoRes.success && seoRes.data) {
          seoData = seoRes.data;
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_SUCCESS);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_SEO_FAILED);
        }
      }

      let thumbnailsList: ThumbnailItem[] = [];
      let isThumbsCached = false;
      if (resumeMode && !_.isEmpty(newProj.thumbnails)) {
        const cachedThumbs = newProj.thumbnails;
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
          visualConfig: {
            ...imageUpdatedProj.visualConfig,
            thumbnailReferencePrompt: currentThumbnailStyle,
          },
          bypassCache: true,
        };
        const thumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_THUMBNAILS, thumbPayload);
        if (thumbRes.success && thumbRes.data?.thumbnails) {
          let parsedThumbs = thumbRes.data.thumbnails;

          if (currentThumbnailStyle) {
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_APPLY);
            const rewriteThumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_THUMBNAILS, {
              thumbnails: parsedThumbs,
              newStyle: currentThumbnailStyle,
              aspectRatio: aspectRatio,
            });
            if (rewriteThumbRes.success && rewriteThumbRes.data?.thumbnails) {
              parsedThumbs = rewriteThumbRes.data.thumbnails;
              appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMB_STYLE_APPLY_SUCCESS);
            }
          }

          appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_IDEAS_CREATED, SecurityConstants.PLACEHOLDER_0, _.toString(parsedThumbs.length)));
          for (let tIdx = 0; tIdx < parsedThumbs.length; tIdx++) {
            const thumb = parsedThumbs[tIdx];
            appendLog(_.replace(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SCENE_GEN, SecurityConstants.PLACEHOLDER_0, _.toString(tIdx + 1)), SecurityConstants.PLACEHOLDER_1, _.toString(parsedThumbs.length)));
            let cleanPromptText = _.replace(_.defaultTo(thumb.prompt, REFACTOR_CONSTANTS.VD_EMPTY_STRING), REFACTOR_CONSTANTS.AVG_AR_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
            const thumbPrompt = _.replace(
              _.replace(REFACTOR_CONSTANTS.AVG_THUMB_PROMPT_TEMPLATE, SecurityConstants.PLACEHOLDER_0, cleanPromptText),
              SecurityConstants.PLACEHOLDER_1,
              _.toString(_.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)))
            );
            const finalThumbPrompt = _.join([thumbPrompt, REFACTOR_CONSTANTS.AVG_AR_SUFFIX, aspectRatio], REFACTOR_CONSTANTS.VD_EMPTY_STRING);

            const renderThumbRes = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
              prompt: finalThumbPrompt,
              style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)),
              resolution: REFACTOR_CONSTANTS.AVG_VISUAL_QUALITY_STANDARD,
              bypassCache: true,
              engine: _.defaultTo(imageGeneratorEngine, ImageGeneratorEngine.Veo3),
              sandboxConfig: sandboxConfigPayload,
              visualConfig: {
                ...visualConfigPayload,
                style: _.defaultTo(thumb.style, _.defaultTo(currentThumbnailStyle, currentStylePreset)),
              }
            });
            let imgUrl: string = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
            if (renderThumbRes.success && renderThumbRes.data?.base64) {
              imgUrl = _.join([REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX, renderThumbRes.data.base64], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
            } else if (renderThumbRes.data?.fallbackUrl) {
              imgUrl = renderThumbRes.data.fallbackUrl;
            }
            thumbnailsList.push({
              ...thumb,
              imageUrl: imgUrl,
            });
          }
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_SUCCESS);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_THUMBNAILS_FAILED);
        }
      }
      setStepProgress(85);

      let slicedUpdatedProj: VideoProject = {
        ...imageUpdatedProj,
        seo: seoData,
        thumbnails: thumbnailsList,
      };
      if (globalAudioBase64) {
        const isAligned = resumeMode && _.every(realScenes, (sc) => !_.isEmpty(sc.startTime) && !_.isEmpty(sc.endTime) && !_.isUndefined(sc.duration));
        if (isAligned) {
          appendLog(T.logResumeAlignment);
          slicedUpdatedProj = {
            ...imageUpdatedProj,
            seo: seoData,
            thumbnails: thumbnailsList,
            storyboard: realScenes
          };
          await syncProject(slicedUpdatedProj);
        } else {
          appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_START);
          try {
            const alignPayload = {
              audioBase64: globalAudioBase64,
              scenes: _.map(realScenes, (sc) => ({
                id: sc.id,
                script: sc.script || sc.subtitle || REFACTOR_CONSTANTS.VD_EMPTY_STRING
              })),
              segment: true,
              projectId: newProj?.id,
              projectName: newProj?.name
            };

            const alignRes = await safeSystemFetch(API_ROUTES.PIPELINE_ALIGN_VOICE, alignPayload);
            if (!alignRes.success || !alignRes.data || !alignRes.data.success || !_.isArray(alignRes.data.alignments)) {
              throw new Error(alignRes.error || alignRes.data?.error || AUTO_GENERATOR_CONSTANTS.ERR_VOICE_ALIGN_FAILED);
            }

            const alignments = alignRes.data.alignments;
            realScenes = _.map(realScenes, (sc) => {
              const align = _.find(alignments, (a) => a.id === sc.id);
              if (align) {
                return {
                  ...sc,
                  duration: align.duration,
                  startTime: formatTimeHelper(align.start),
                  endTime: formatTimeHelper(align.end),
                  _start: align.start,
                  _end: align.end,
                  audioBase64: align.audioBase64,
                  audioUrl: align.audioUrl
                };
              }
              return sc;
            });

            slicedUpdatedProj = {
              ...imageUpdatedProj,
              seo: seoData,
              thumbnails: thumbnailsList,
              storyboard: realScenes
            };
            await syncProject(slicedUpdatedProj);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_SUCCESS);
          } catch (audioErr: any) {
            logger.error(T.errAudioAlignBackend, audioErr);
            appendLog(AUTO_GENERATOR_CONSTANTS.LOG_ALIGN_BACKEND_ERROR + (audioErr.message || REFACTOR_CONSTANTS.VD_EMPTY_STRING));
          }
        }
      }
      setStepProgress(90);

      setCurrentStepIndex(4);
      appendLog(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_GEN);

      const renderPayload = {
        scenes: _.map(realScenes, (sc) => ({
          id: _.get(sc, REFACTOR_CONSTANTS.AVG_ID_KEY),
          duration: _.get(sc, "duration") || AUTO_GENERATOR_CONSTANTS.DEFAULT_SCENE_DURATION,
          imageBase64: _.get(sc, "assetUrl"),
          imageUrl: _.get(sc, "assetUrl"),
          audioBase64: _.get(sc, "audioBase64"),
          text: _.get(sc, REFACTOR_CONSTANTS.AVG_SCRIPT_KEY)
        })),
        quality: ffmpegQuality,
        globalAudioUrl: globalAudioUrl || undefined,
        aspectRatio: _.isEqual(aspectRatio, AspectRatio.NineSixteen) ? FFMPEG_RENDER_CONSTANTS.ASPECT_RATIO_9_16 : REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_16_9
      };

      const renderRes = await fetch(API_ROUTES.PIPELINE_FFMPEG_RENDER, {
        method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
        headers: {
          [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON,
          [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING
        },
        body: jsonUtils.safeStringify(renderPayload)
      });

      const renderText = await renderRes.text();
      const renderData = jsonUtils.safeParse<{ success: boolean; jobId?: string; error?: string }>(renderText, { success: false });

      if (renderData.success && renderData.jobId) {
        const jobId = renderData.jobId;
        await new Promise<void>((resolve, reject) => {
          let lastLoggedProgress: number | null = null;
          const checkStatus = setInterval(async () => {
            try {
              const statusRes = await fetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER}${REFACTOR_CONSTANTS.PATH_STATUS}${jobId}`, {
                headers: {
                  [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING
                }
              });
              const statusData = await statusRes.json();
              if (statusData.success) {
                if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_COMPLETED)) {
                  clearInterval(checkStatus);
                  setRenderedVideoUrl(statusData.url);
                  appendLog(_.replace(AUTO_GENERATOR_CONSTANTS.LOG_RENDER_SUCCESS, SecurityConstants.PLACEHOLDER_0, statusData.url));

                  const renderCompletedProj = {
                    ...slicedUpdatedProj,
                    seo: _.defaultTo(seoData, undefined),
                    thumbnails: _.defaultTo(thumbnailsList, undefined),
                    renderedVideoUrl: statusData.url,
                    status: REFACTOR_CONSTANTS.STATUS_COMPLETED
                  };
                  syncProject(renderCompletedProj).then(() => resolve()).catch(reject);
                } else if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_FAILED)) {
                  clearInterval(checkStatus);
                  reject(new Error(REFACTOR_CONSTANTS.ERR_RENDER_FAILED));
                } else {
                  const currentProgress = _.defaultTo(statusData.progress, 0);
                  if (!_.isEqual(currentProgress, lastLoggedProgress)) {
                    lastLoggedProgress = currentProgress;
                    appendLog(`${REFACTOR_CONSTANTS.MSG_RENDER_PREFIX}${currentProgress}${REFACTOR_CONSTANTS.MSG_PERCENT}`);
                  }
                }
              } else {
                clearInterval(checkStatus);
                reject(new Error(REFACTOR_CONSTANTS.ERR_STATUS_FAILED));
              }
            } catch (err: any) {
              clearInterval(checkStatus);
              reject(new Error(REFACTOR_CONSTANTS.ERR_RENDER_FAILED));
            }
          }, REFACTOR_CONSTANTS.POLLING_INTERVAL_MS);
        });
      } else {
        throw new Error(renderData.error || REFACTOR_CONSTANTS.ERR_RENDER_QUEUE);
      }

      setStepProgress(100);
    } catch (err: any) {
      appendLog(AUTO_GENERATOR_CONSTANTS.ERR_AUTO_GEN_FAILED.replace(SecurityConstants.PLACEHOLDER_0, err.message || REFACTOR_CONSTANTS.ERR_RENDER_FAILED));
      const failedProj = {
        ...(activeCreatedProject || {}),
        id: activeCreatedProject ? activeCreatedProject.id : REFACTOR_CONSTANTS.STATUS_FAILED,
        status: REFACTOR_CONSTANTS.STATUS_FAILED,
      } as VideoProject;
      await onUpdateProject(failedProj, true);
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-slate-955 text-slate-100 flex flex-col min-h-0 overflow-hidden font-sans select-none">
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <Zap className="w-5 h-5 fill-rose-500/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2" title={T.bannerTitleTooltip}>
              {T.bannerTitle}
              <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                {T.bannerBadge}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{T.bannerSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">{T.presetLabel}</span>
          <div className="relative flex items-center bg-slate-955/80 border border-slate-800/80 rounded-lg px-2.5 py-1">
            <select
              value={selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-5 appearance-none"
            >
              <option value={REFACTOR_CONSTANTS.VD_EMPTY_STRING} className="bg-slate-955 text-slate-300">{T.presetDefaultOption}</option>
              {_.map(presets, (p) => {
                const formattedName = (() => {
                  const words = _.words(p.name);
                  if (words.length > 4) {
                    return _.join(_.take(words, 4), ' ') + '...';
                  }
                  return p.name;
                })();
                return (
                  <option key={p.id} value={p.id} className="bg-slate-955 text-slate-300" title={p.name}>
                    {formattedName}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1">
            <input
              type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
              placeholder={T.presetNamePlaceholder}
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-rose-500"
            />
            <Button variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} size={REFACTOR_CONSTANTS.SIZE_XS} onClick={handleSavePreset} title={T.savePresetTooltip}>
              <Save className="w-3.5 h-3.5 text-rose-400" /> {T.savePresetBtn}
            </Button>
            {selectedPresetId && (
              <Button variant={REFACTOR_CONSTANTS.VARIANT_GHOST} size={REFACTOR_CONSTANTS.SIZE_XS} onClick={() => handleDeletePreset(selectedPresetId)} title={T.deletePresetTooltip}>
                <Trash className="w-3.5 h-3.5 text-slate-500 hover:text-rose-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden scrollbar-none">
        <div className="lg:col-span-7 h-auto lg:h-full overflow-hidden p-5 flex flex-col">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4 p-6 relative lg:h-full flex flex-col justify-start overflow-y-auto scrollbar-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
                  <Sliders className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2 font-mono" title={T.panelTitleTooltip}>
                    {T.panelTitle}
                    <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      {T.panelBadge}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{T.panelSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                  1
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec1TitleTooltip}>
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> {T.sec1Title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                  variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                  onClick={() => setInputType(ProjectInputType.Script)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between",
                    _.isEqual(inputType, ProjectInputType.Script)
                      ? "bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/20 font-bold"
                      : "bg-slate-955/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                  title={T.inputTypeScriptTooltip}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span className="text-xs">{T.inputTypeScript}</span>
                  </div>
                  {_.isEqual(inputType, ProjectInputType.Script) && <Check className="w-4 h-4 text-rose-500" />}
                </Button>

                <Button
                  type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                  variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                  onClick={() => setInputType(ProjectInputType.Idea)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between",
                    _.isEqual(inputType, ProjectInputType.Idea)
                      ? "bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/20 font-bold"
                      : "bg-slate-955/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                  title={T.inputTypeIdeaTooltip}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span className="text-xs">{T.inputTypeIdea}</span>
                  </div>
                  {_.isEqual(inputType, ProjectInputType.Idea) && <Check className="w-4 h-4 text-rose-500" />}
                </Button>
              </div>

              <textarea
                rows={4}
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea}
                className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-3 rounded-xl text-xs leading-relaxed outline-none resize-none shadow-inner"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenre}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                    <Layers className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(GENRE_OPTIONS, (g) => (
                        <option key={g} value={g} className="bg-slate-955 text-slate-300">
                          {genreLabels[g as keyof typeof genreLabels] || g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblLanguage}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                    <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(PROJECT_LANGUAGE_OPTIONS, (l) => (
                        <option key={l.value} value={l.value} className="bg-slate-955 text-slate-300">
                          {_.isEqual(l.value, "vi") ? T.langVi : T.langEn}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblDuration}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(DURATION_OPTIONS, (d) => (
                        <option key={d.val} value={d.val} className="bg-slate-955 text-slate-300">
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblSplitStrategy}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                    <Sliders className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={splitStrategy}
                      onChange={(e) => setSplitStrategy(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(SPLIT_STRATEGY_OPTIONS, (s: any) => {
                        const val = s.value;
                        const SPLIT_LABEL_MAP: Record<string, string> = {
                          word: T.splitWord,
                          short_sentence: T.splitShort,
                          long_sentence: T.splitLong,
                          mixed_sentences: T.splitMixed,
                          paragraph: T.splitParagraph,
                        };
                        const displayLabel = _.get(SPLIT_LABEL_MAP, val, val);
                        return (
                          <option key={val} value={val} className="bg-slate-955 text-slate-300">
                            {displayLabel}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
                  2
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec2TitleTooltip}>
                  <Mic className="w-3.5 h-3.5 text-rose-500" /> {T.sec2Title}
                </h3>
              </div>

              <div>
                <Button
                  type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                  variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                  onClick={() => setIsVoiceDialogOpen(true)}
                  className="w-full bg-slate-955/80 border border-slate-800 hover:border-rose-500/50 rounded-xl p-3 text-left flex items-center justify-between transition-all group h-auto"
                  title={T.voiceBtnTooltip}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const rawName = voiceName || voiceURI;
                        const words = _.words(rawName);
                        const displayVoiceName = words.length > 4 ? _.join(_.take(words, 4), ' ') + '...' : rawName;
                        return (
                          <Tooltip content={rawName} position="top">
                            <span className="font-bold text-slate-100 text-xs group-hover:text-rose-400 transition-colors">
                              {displayVoiceName}
                            </span>
                          </Tooltip>
                        );
                      })()}
                      <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">{voiceProvider}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                </Button>
              </div>

              <VoiceSelectionDialog
                isOpen={isVoiceDialogOpen}
                onClose={() => setIsVoiceDialogOpen(false)}
                currentLang={currentLang}
                selectedVoiceId={voiceURI}
                favoriteVoices={[]}
                onToggleFavoriteVoice={() => { }}
                onSelectVoice={(v: any) => {
                  setVoiceURI(v.voice_id || v.voiceURI || v.id);
                  setVoiceName(v.name);
                  if (v.provider) setVoiceProvider(v.provider);
                  setIsVoiceDialogOpen(false);
                }}
              />
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                  3
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec3TitleTooltip}>
                  <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {T.sec3Title}
                </h3>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenMode}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Wand2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={generationMode}
                        onChange={(e) => {
                          const mode = e.target.value as any;
                          setGenerationMode(mode);
                          if (mode === ImageGenerationMode.GeminiChat) {
                            setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                          } else {
                            setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                          }
                        }}
                        className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                      >
                        <option value={ImageGenerationMode.LabsFlow} className="bg-slate-955 text-slate-300">{REFACTOR_CONSTANTS.MODE_LABS_FLOW}</option>
                        <option value={ImageGenerationMode.GeminiChat} className="bg-slate-955 text-slate-300">{REFACTOR_CONSTANTS.MODE_GEMINI_ROOM}</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblEngine}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={imageGeneratorEngine}
                        onChange={(e) => setImageGeneratorEngine(e.target.value as any)}
                        className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                      >
                        {_.map(getEngineOptions(generationMode, generateType), (opt) => (
                          <option key={opt.value + opt.label} value={opt.value} className="bg-slate-955 text-slate-300">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblAspectRatio}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                        {_.map(_.values(AspectRatio), (r) => (
                          <option key={r} value={r} className="bg-slate-955 text-slate-300">
                            {r} {_.isEqual(r, AspectRatio.NineSixteen) ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX : _.isEqual(r, AspectRatio.SixteenNine) ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenType}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={generateType}
                        onChange={(e) => {
                          const type = e.target.value as any;
                          setGenerateType(type);
                          if (generationMode !== ImageGenerationMode.GeminiChat) {
                            setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                          }
                        }}
                        className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                      >
                        <option value={GenerateType.Image} className="bg-slate-955 text-slate-300">{T.optionImage}</option>
                        <option value={GenerateType.Video} className="bg-slate-955 text-slate-300">{T.optionVideo}</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-955/45">
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => setShowAdvancedImageSettings(!showAdvancedImageSettings)}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors h-auto p-0"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      {T.advancedConfig}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-250", showAdvancedImageSettings && "rotate-180")} />
                  </Button>
                  {showAdvancedImageSettings && (
                    <div className="px-3.5 pb-3.5 pt-1.5 grid grid-cols-2 gap-3.5 border-t border-slate-800/60 animate-fadeIn">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={T.lblChromeHeadlessTooltip}>{T.lblChromeHeadless}</span>
                        <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={T.lblChromeHeadlessTooltip}>
                          <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <select
                            value={chromeHeadless ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED}
                            onChange={(e) => setChromeHeadless(e.target.value === REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS)}
                            className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                          >
                            <option value={REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS} className="bg-slate-955 text-slate-300">{T.optionHeadless}</option>
                            <option value={REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED} className="bg-slate-955 text-slate-300">{T.optionWindowed}</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={T.lblResumeModeTooltip}>{T.lblResumeMode}</span>
                        <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={T.lblResumeModeTooltip}>
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <select
                            value={resumeMode ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME : REFACTOR_CONSTANTS.RESUME_MODE_NEW}
                            onChange={(e) => setResumeMode(e.target.value === REFACTOR_CONSTANTS.RESUME_MODE_RESUME)}
                            className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                          >
                            <option value={REFACTOR_CONSTANTS.RESUME_MODE_RESUME} className="bg-slate-955 text-slate-300">{T.optionResume}</option>
                            <option value={REFACTOR_CONSTANTS.RESUME_MODE_NEW} className="bg-slate-955 text-slate-300">{T.optionNew}</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div
                  className="bg-slate-950/20 !border-2 !border-dashed !border-slate-700/80 hover:!border-emerald-500/80 hover:bg-slate-900/30 rounded-xl transition-all duration-200 relative group cursor-pointer w-full aspect-square overflow-hidden"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleStyleFilesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
                    accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL}
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleStyleFilesUpload(e.target.files);
                        e.target.value = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <div className="p-2 bg-slate-955 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-300 mb-1.5 shadow-lg">
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 block mb-0.5 truncate max-w-full group-hover:text-emerald-400 transition-colors">
                      {T.styleUploadTitle}
                    </span>
                    <span className="text-[8px] text-slate-505 leading-tight block truncate max-w-full">
                      {T.styleUploadSub}
                    </span>
                  </div>
                </div>

                {_.map(referenceImages, (imgBase64, idx) => (
                  <div key={idx} className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-rose-500/30 transition-colors">
                    <img src={imgBase64} alt={`${REFACTOR_CONSTANTS.STYLE_REF_PREFIX}${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                        variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                        onClick={() => setReferenceImages((prev) => _.filter(prev, (_val: string, i: number) => !_.isEqual(i, idx)))}
                        className="w-7 h-7 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 transform scale-75 group-hover:scale-100 p-0"
                        title={T.deleteStyleImgTooltip}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                  4
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec4TitleTooltip}>
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> {T.sec4Title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblProjectName}</span>
                  <input
                    type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      <option value={1} className="bg-slate-955 text-slate-300">{T.thumbCountOption(1)}</option>
                      <option value={2} className="bg-slate-955 text-slate-300">{T.thumbCountOption(2)}</option>
                      <option value={3} className="bg-slate-955 text-slate-300">{T.thumbCountOption(3)}</option>
                      <option value={4} className="bg-slate-955 text-slate-300">{T.thumbCountOption(4)}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <div
                  className="bg-slate-955/20 !border-2 !border-dashed !border-slate-700/80 hover:!border-purple-500/80 hover:bg-slate-900/30 rounded-xl transition-all duration-200 relative group cursor-pointer w-full aspect-square overflow-hidden"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleThumbnailStyleFilesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
                    accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL}
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleThumbnailStyleFilesUpload(e.target.files);
                        e.target.value = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <div className="p-2 bg-slate-955 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-purple-500/30 transition-all duration-300 mb-1.5 shadow-lg">
                      <Upload className="w-4 h-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-200 block mb-0.5 truncate max-w-full group-hover:text-purple-400 transition-colors">
                      {T.thumbUploadTitle}
                    </span>
                    <span className="text-[8px] text-slate-505 leading-tight block truncate max-w-full">
                      {T.thumbUploadSub}
                    </span>
                  </div>
                </div>

                {_.map(thumbnailReferenceImages, (imgBase64, idx) => (
                  <div key={idx} className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-rose-500/30 transition-colors">
                    <img src={imgBase64} alt={`${REFACTOR_CONSTANTS.THUMB_REF_PREFIX}${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                        variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                        onClick={() => setThumbnailReferenceImages((prev) => _.filter(prev, (_val: string, i: number) => !_.isEqual(i, idx)))}
                        className="w-7 h-7 bg-rose-600 hover:bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-200 transform scale-75 group-hover:scale-100 p-0"
                        title={T.deleteThumbImgTooltip}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 bg-slate-955 space-y-5 flex flex-col justify-between scrollbar-none">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2" title={T.rightActionTitleTooltip}>
                <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                {T.rightActionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">{T.rightActionSub}</p>
            </div>

            <Button
              variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
              size={REFACTOR_CONSTANTS.SIZE_LG}
              onClick={handleStartAutoGenerate}
              disabled={isProcessing || _.isEmpty(_.trim(scriptContent))}
              isLoading={isProcessing}
              className="w-full py-4 text-sm font-extrabold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30 text-white rounded-xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
              title={T.startBtnTooltip}
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
            </Button>

            {isProcessing || _.gt(stepProgress, 0) ? (
              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="text-rose-400">{T.progressNodeLabel} [{currentStepIndex}/4]</span>
                  <span className="text-slate-200">{stepProgress}%</span>
                </div>
                <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-300" style={{ width: `${stepProgress}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 flex-1 flex flex-col min-h-[200px] shadow-xl font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-200 font-bold flex items-center gap-2 uppercase text-xs" title={T.logHeaderTooltip}>
                <Terminal className="w-4 h-4 text-amber-400" /> {T.logHeaderTitle}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{T.logEventsCount(logs.length)}</span>
            </div>

            <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-1 text-slate-300 leading-relaxed scrollbar-none flex flex-col min-h-[140px]">
              {_.isEmpty(logs) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-center text-xs p-6 w-full h-full my-auto gap-2">
                  <Terminal className="w-8 h-8 text-slate-700/80 mb-1" />
                  <span>{T.logEmpty}</span>
                </div>
              ) : (
                _.map(logs, (log, idx) => (
                  <div key={idx} className={cn("py-0.5", _.includes(log, REFACTOR_CONSTANTS.SYMBOL_SUCCESS) ? "text-emerald-400" : _.includes(log, REFACTOR_CONSTANTS.SYMBOL_STEP) ? "text-rose-400" : _.includes(log, REFACTOR_CONSTANTS.SYMBOL_FINISH) ? "text-amber-300 font-bold" : "text-slate-300")}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={T.previewHeaderTooltip}>
              <Eye className="w-4 h-4 text-amber-400" /> {T.previewHeaderTitle}
            </h3>

            <div className="flex-1 min-h-[260px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden relative p-4 shadow-inner">
              {!_.isEmpty(renderedVideoUrl) ? (
                <div className="absolute inset-4 flex items-center justify-center">
                  <video src={renderedVideoUrl} controls className="max-w-full max-h-full object-contain rounded-xl" autoPlay />
                </div>
              ) : (
                <div className="absolute inset-0 text-center p-6 text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
                  <Video className="w-10 h-10 text-slate-600" />
                  <span className="text-slate-400 leading-relaxed max-w-xs block">
                    {T.previewEmpty}
                  </span>
                </div>
              )}
            </div>

            {!_.isEmpty(renderedVideoUrl) && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                  size={REFACTOR_CONSTANTS.SIZE_SM}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = renderedVideoUrl;
                    a.download = _.join([projectName, REFACTOR_CONSTANTS.AVG_MP4_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                    a.click();
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white font-bold text-xs"
                  title={T.downloadVideoTooltip}
                >
                  <Download className="w-4 h-4" /> {T.downloadVideoBtn}
                </Button>

                {activeCreatedProject && (
                  <Button
                    variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
                    size={REFACTOR_CONSTANTS.SIZE_SM}
                    onClick={() => onSelectProject(activeCreatedProject.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    title={T.openStudioTooltip}
                  >
                    <Sliders className="w-4 h-4 text-rose-400" /> {T.openStudioBtn}
                  </Button>
                )}
              </div>
            )}
          </div>

          {activeCreatedProject?.seo && (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_TOOLTIP}>
                <Target className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SHORT}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION_TOOLTIP}>
                    {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION}
                  </span>
                  <div className="space-y-3">
                    {_.map(activeCreatedProject.seo.titles || [], (title, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-100 text-xs leading-snug">{title.text}</p>
                          <Button
                            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                            onClick={() => {
                              navigator.clipboard.writeText(title.text);
                              alert(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE);
                            }}
                            className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                            title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TITLE_TOOLTIP}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[9px] font-mono">
                          <div>
                            <div className="flex justify-between mb-0.5 text-slate-400">
                              <span>{AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEARCH}</span>
                              <span className="text-rose-450 font-bold">{title.searchScore}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full" style={{ width: `${title.searchScore}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-0.5 text-slate-400">
                              <span>{AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_CTR}</span>
                              <span className="text-rose-450 font-bold">{title.ctrScore}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full" style={{ width: `${title.ctrScore}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-0.5 text-slate-400">
                              <span>{AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_COMPET}</span>
                              <span className="text-rose-450 font-bold">{title.compScore}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full" style={{ width: `${title.compScore}%` }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-0.5 text-slate-400">
                              <span>{AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEO}</span>
                              <span className="text-rose-450 font-bold">{title.seoScore}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full" style={{ width: `${title.seoScore}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION_TOOLTIP}>
                    {AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION}
                  </span>
                  <div className="space-y-2">
                    {_.map(activeCreatedProject.seo.descriptions || [], (desc, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-start justify-between gap-3">
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{desc.text}</p>
                        <Button
                          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                          variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                          onClick={() => {
                            navigator.clipboard.writeText(desc.text);
                            alert(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC);
                          }}
                          className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                          title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_DESC_TOOLTIP}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">{AUTO_GENERATOR_CONSTANTS.UI_SEO_HASHTAGS}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {_.map(activeCreatedProject.seo.hashtags || [], (tag, i) => (
                        <span key={i} className="bg-slate-950/60 border border-slate-800 text-rose-400 font-mono text-[10px] px-2 py-1 rounded-lg">
                          #{tag.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">{AUTO_GENERATOR_CONSTANTS.UI_SEO_TAGS}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {_.map(activeCreatedProject.seo.tags || [], (tag, i) => (
                        <span key={i} className="bg-slate-950/60 border border-slate-800 text-slate-300 font-sans text-[10px] px-2 py-1 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeCreatedProject?.thumbnails && activeCreatedProject.thumbnails.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE_TOOLTIP}>
                <ImageIcon className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {_.map(activeCreatedProject.thumbnails, (thumb) => (
                  <div key={thumb.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3">
                    <div className="sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800">
                      {thumb.imageUrl ? (
                        <img src={thumb.imageUrl} alt="Thumbnail Idea" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                          <span>{AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_UNRENDERED}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {thumb.style} Look
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        {thumb.hasText && thumb.textText && (
                          <h4 className="text-amber-400 font-black text-xs uppercase mb-1 line-clamp-1">
                            "{thumb.textText}"
                          </h4>
                        )}
                        <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{thumb.prompt}"</p>
                      </div>
                      {thumb.imageUrl && (
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                            size={REFACTOR_CONSTANTS.SIZE_SM}
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = thumb.imageUrl!;
                              a.download = `${AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_FILE_PREFIX}${thumb.id || AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK}${REFACTOR_CONSTANTS.CACHE_EXT_PNG}`;
                              a.click();
                            }}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 h-auto"
                            title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD_TOOLTIP}
                          >
                            <Download className="w-3.5 h-3.5" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
