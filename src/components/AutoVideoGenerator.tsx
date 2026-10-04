import { SOURCE_TEMPLATE_SYMBOL, SOURCE_TEMPLATE_SYMBOL_4, SOURCE_TEXT_AUTO, SOURCE_TEXT_CONFIG, SOURCE_TEXT_CONTINUE, SOURCE_TEXT_MESSAGE, SOURCE_TEXT_NEW, SOURCE_TEXT_PHIM_AI, SOURCE_TEXT_RENDER_ONLY, SOURCE_TEXT_VALUE } from "../constants/sourceText";
import { cn } from "../lib/utils";
import { readBlobAsDataUrl } from "../lib/fileUtils";
import { useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { toast } from "sonner";
import { usePresets } from "../hooks/usePresets";
import { useAutoVideoState } from "../hooks/useAutoVideoState";
import { useAutoVideoPipeline } from "../hooks/useAutoVideoPipeline";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, VideoProject, ProjectInputType, ProjectKind, ProjectLanguage, ImageGenerationMode, ImageGeneratorEngine, GenerateType, BackgroundMode, TextInImageMode, SubtitleMode } from "../types";
import { type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { AppTheme, AppLanguage, VideoGenre } from "../constants/enums";
import { API_ROUTES, HTTP_METHODS, CONTENT_TYPES, CONTENT_TYPE_HEADER, COMMON_STRINGS, REFACTOR_CONSTANTS } from "../constants";
import { MEDIA_MIX_TEXTS } from "../constants/texts";
import { REGENERATION_TARGET, REGENERATION_TEXTS, CINEMATIC_CONFIG, FLOW_DIRECT_VIDEO_CONFIG } from "../constants/config";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../constants/cinematicConstants";
import { deleteProjectRegenerationAssets, applyProjectRegenerationReset } from "../services/projectRegenerationService";
import { Lang } from "../lib/lang";
import { getAutoVideoTexts, getImageEngineOptions, getSplitLabels, truncateWords, buildPresetPayload, applyPresetConfigToState } from "./auto-video/autoVideoGeneratorUtils";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { ActionPanelSection } from "./auto-video/ActionPanelSection";
import { AdvancedImageSettingsSection } from "./auto-video/AdvancedImageSettingsSection";
import { GenerationSettingsSection } from "./auto-video/GenerationSettingsSection";
import { StylePresetSelector } from "./auto-video/StylePresetSelector";
import { LogPanelSection } from "./auto-video/LogPanelSection";
import { PresetSection } from "./auto-video/PresetSection";
import { PreviewPanelSection } from "./auto-video/PreviewPanelSection";
import { ProjectInputSection } from "./auto-video/ProjectInputSection";
import { ScriptSettingsCard } from "./auto-video/ScriptSettingsCard";
import { ProjectSettingsSection } from "./auto-video/ProjectSettingsSection";
import { SeoPanelSection } from "./auto-video/SeoPanelSection";
import { ThumbnailsPreviewSection } from "./auto-video/ThumbnailsPreviewSection";
import { VoiceSelectionSection } from "./auto-video/VoiceSelectionSection";
import CinematicFilmSetupSection from "./cinematic/CinematicFilmSetupSection";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { CINEMATIC_FILM_STYLE_PRESET_IDS } from "../constants/stylePresets";
import { genreLabels } from "../constants/data";
import { AutoVideoStudioSkeleton } from "./ui/Skeleton";
import { ProgressLogContext } from "../constants/progressLog";
import { normalizeVideoModelSettings } from "../services/videoModelCapabilityService";
interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  selectedProjectId?: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void;
  theme?: AppTheme;
  cinematicMode?: boolean;
}
export default function AutoVideoGenerator({ currentLang, projects, selectedProjectId, onSelectProject: _onSelectProject, onUpdateProject, theme = AppTheme.DARK, cinematicMode = false }: AutoVideoGeneratorProps) {
  const T = useMemo(() => getAutoVideoTexts(currentLang), [currentLang]);
  const mediaMixTexts = useMemo(() => _.get(MEDIA_MIX_TEXTS, currentLang, MEDIA_MIX_TEXTS.vi), [currentLang]);
  const splitLabelMap = useMemo(() => getSplitLabels(T), [T]);
  const stateScope = cinematicMode ? CINEMATIC_CONFIG.STATE_SCOPE : SOURCE_TEXT_AUTO;
  const selectedWorkspaceProject = useMemo(() => _.find(projects, { id: selectedProjectId }), [projects, selectedProjectId]);
  const selectedProjectIsCinematic = Boolean(_.isEqual(selectedWorkspaceProject?.projectKind, ProjectKind.Cinematic) || _.endsWith(_.toString(selectedWorkspaceProject?.name), COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX));
  const selectedProjectIsAuto = Boolean(_.isEqual(selectedWorkspaceProject?.projectKind, ProjectKind.Auto) || _.endsWith(_.toString(selectedWorkspaceProject?.name), COMMON_STRINGS.AUTO_CHILD_SUFFIX));
  const scopedSelectedProjectId = selectedWorkspaceProject && (cinematicMode ? selectedProjectIsCinematic : selectedProjectIsAuto) ? selectedWorkspaceProject.id : null;
  const { state, actions } = useAutoVideoState(scopedSelectedProjectId, projects, currentLang, stateScope);
  const { pipelineState, pipelineActions, syncSelectedProject } = useAutoVideoPipeline(projects, onUpdateProject, currentLang, stateScope);
  const selectedProjectStorageKey = cinematicMode ? REFACTOR_CONSTANTS.KEY_SELECTED_CINEMATIC_PROJECT : REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT;
  const currentLogsStorageKey = cinematicMode ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_CURRENT_LOGS : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS;
  const projectLogsStoragePrefix = cinematicMode ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_PROJECT_LOGS_PREFIX : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX;
  const {
    inputType,
    scriptContent,
    genre,
    language,
    duration,
    splitStrategy,
    voiceProvider,
    voiceURI,
    voiceName,
    isVoiceDialogOpen,
    generationMode,
    imageGeneratorEngine,
    generateType,
    maxVideoScenes,
    aspectRatio,
    chromeHeadless,
    stylePreset,
    styleBackgroundMode,
    styleTextInImageMode,
    imageFocusMode,
    referenceImages,
    sceneReferenceImages,
    characterImages,
    thumbnailCount,
    thumbnailStylePreset,
    thumbnailBackgroundMode,
    thumbnailTextInImageMode,
    thumbnailImageFocusMode,
    thumbnailReferenceImages,
    thumbnailSceneReferenceImages,
    projectName,
    resumeMode,
    showAdvancedImageSettings,
    rewriteLevel,
    similarityReduction,
    creativityLevel,
    factCheck,
    audience,
    writingStyle,
    hookStrategy,
    hookDuration,
    hookPosition,
    voiceSpeed,
    voicePitch,
    voiceVolume,
    promptInputMethod,
    sampleCount,
    videoDuration,
    videoResolution,
    geminiChatSpeed,
    batchDelay,
    ffmpegQuality,
    isConfigLoaded,
    musicAssetUrl,
  } = state;
  const {
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
    setThumbnailCount,
    setThumbnailStylePreset,
    setThumbnailBackgroundMode,
    setThumbnailTextInImageMode,
    setThumbnailImageFocusMode,
    setProjectName,
    setResumeMode,
    setShowAdvancedImageSettings,
    setMusicAssetUrl,
  } = actions;
  const { isProcessing, isCancelling, currentStepIndex, stepProgress, logs, renderedVideoUrl, activeCreatedProject } = pipelineState;
  const presentationProject = activeCreatedProject;
  const canRegenerate = Boolean(scopedSelectedProjectId && presentationProject?.id && _.some(projects, (project) => _.isEqual(project.id, presentationProject.id)) && _.isEqual(scopedSelectedProjectId, presentationProject.id) && ((presentationProject?.storyboard?.length || 0) > 0 || !_.isEmpty(renderedVideoUrl)));
  const canContinueProject = useMemo(() => Boolean(presentationProject && !_.isEqual(presentationProject.status, REFACTOR_CONSTANTS.STATUS_COMPLETED) && (presentationProject.generationCheckpoint || !_.isEmpty(presentationProject.storyboard))), [presentationProject]);
  const { startPipeline, cancelPipeline, setActiveCreatedProject, setRenderedVideoUrl, setLogs } = pipelineActions;
  const [planningFallbackProvider, setPlanningFallbackProvider] = useState<AiPlanningFallbackProvider>(AiPlanningFallbackProvider.GeminiChat);
  const [planningChatModel, setPlanningChatModel] = useState<AiPlanningChatModel>(AiPlanningChatModel.GeminiFlash);
  const [planningExecutionMode, setPlanningExecutionMode] = useState<AiPlanningExecutionMode>(AiPlanningExecutionMode.RoomOnly);
  const [planningChromeHeadless, setPlanningChromeHeadless] = useState<boolean>(CINEMATIC_CONFIG.GENERATION_DEFAULTS.CHROME_HEADLESS);
  const [cinematicSubtitleMode, setCinematicSubtitleMode] = useState<SubtitleMode>(SubtitleMode.None);
  const cinematicEstimate = useMemo(() => {
    const estimateDuration = canContinueProject ? _.defaultTo(presentationProject?.config?.duration, duration) : duration;
    const estimateClipDuration = canContinueProject ? _.defaultTo(presentationProject?.visualConfig?.videoDuration, videoDuration) : videoDuration;
    const minutes = Math.max(1, Number.parseInt(estimateDuration, 10) || 1);
    const clipSeconds = Math.max(1, Number.parseInt(estimateClipDuration, 10) || 10);
    const clips = Math.ceil((minutes * 60) / clipSeconds);
    return { clips, batches: Math.ceil(clips / FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH) };
  }, [canContinueProject, duration, presentationProject, videoDuration]);
  useEffect(() => {
    syncSelectedProject(scopedSelectedProjectId);
  }, [scopedSelectedProjectId, projects, syncSelectedProject]);
  useEffect(() => {
    if (!scopedSelectedProjectId) return;
    const savedProvider = _.find(projects, { id: scopedSelectedProjectId })?.visualConfig?.planningFallbackProvider;
    const savedModel = _.find(projects, { id: scopedSelectedProjectId })?.visualConfig?.planningChatModel;
    const savedMode = _.find(projects, { id: scopedSelectedProjectId })?.visualConfig?.planningExecutionMode;
    const savedHeadless = _.find(projects, { id: scopedSelectedProjectId })?.visualConfig?.planningChromeHeadless;
    const savedSubtitleMode = _.find(projects, { id: scopedSelectedProjectId })?.config?.subtitleMode;
    if (savedProvider && !_.isEqual(savedProvider, AiPlanningFallbackProvider.Disabled) && _.includes(_.values(AiPlanningFallbackProvider), savedProvider)) {
      setPlanningFallbackProvider(savedProvider);
    } else {
      setPlanningFallbackProvider(AiPlanningFallbackProvider.GeminiChat);
    }
    if (savedModel && _.includes(_.values(AiPlanningChatModel), savedModel)) setPlanningChatModel(savedModel);
    if (savedMode && _.includes(_.values(AiPlanningExecutionMode), savedMode)) setPlanningExecutionMode(savedMode);
    else setPlanningExecutionMode(_.isEqual(savedProvider, AiPlanningFallbackProvider.Disabled) ? AiPlanningExecutionMode.ApiOnly : AiPlanningExecutionMode.RoomOnly);
    setPlanningChromeHeadless(_.isBoolean(savedHeadless) ? savedHeadless : CINEMATIC_CONFIG.GENERATION_DEFAULTS.CHROME_HEADLESS);
    setCinematicSubtitleMode(savedSubtitleMode || SubtitleMode.None);
  }, [cinematicMode, projects, scopedSelectedProjectId]);
  useEffect(() => {
    const availableModels = CINEMATIC_CHAT_MODEL_OPTIONS[planningFallbackProvider];
    if (!_.some(availableModels, { value: planningChatModel }) && !_.isEmpty(availableModels)) setPlanningChatModel(availableModels[0].value);
  }, [planningChatModel, planningFallbackProvider]);
  useEffect(() => {
    if (!cinematicMode) {
      if (_.isEqual(genre, VideoGenre.CINEMATIC_EPISODE)) {
        setGenre(VideoGenre.STORY_DRIVEN_VIDEO_ESSAY);
      }
      return;
    }
    if (!_.isEqual(genre, VideoGenre.CINEMATIC_EPISODE)) {
      setGenre(VideoGenre.CINEMATIC_EPISODE);
    }
    if (!_.isEqual(inputType, ProjectInputType.Idea)) {
      setInputType(ProjectInputType.Idea);
    }
    if (!_.isEqual(generateType, GenerateType.Video)) {
      setGenerateType(GenerateType.Video);
    }
    if (!_.isEqual(generationMode, ImageGenerationMode.LabsFlow)) {
      setGenerationMode(ImageGenerationMode.LabsFlow);
    }
    if (!_.includes(CINEMATIC_CONFIG.DURATIONS, duration)) {
      setDuration(CINEMATIC_CONFIG.DEFAULT_DURATION);
    }
    if (!_.includes(CINEMATIC_FILM_STYLE_PRESET_IDS, stylePreset as (typeof CINEMATIC_FILM_STYLE_PRESET_IDS)[number])) {
      setStylePreset(CINEMATIC_FILM_STYLE_PRESET_IDS[0]);
    }
    if (!_.includes(CINEMATIC_FILM_STYLE_PRESET_IDS, thumbnailStylePreset as (typeof CINEMATIC_FILM_STYLE_PRESET_IDS)[number])) {
      setThumbnailStylePreset(CINEMATIC_FILM_STYLE_PRESET_IDS[0]);
    }
    const videoEngines = getImageEngineOptions(generationMode, GenerateType.Video);
    if (!_.some(videoEngines, (option) => _.isEqual(option.value, imageGeneratorEngine))) {
      setImageGeneratorEngine(_.get(_.first(videoEngines), SOURCE_TEXT_VALUE, ImageGeneratorEngine.Veo3));
    }
    const normalizedVideoSettings = normalizeVideoModelSettings(imageGeneratorEngine, {
      duration: videoDuration,
      resolution: videoResolution,
      aspectRatio,
    });
    if (!_.isEqual(videoDuration, normalizedVideoSettings.duration)) setVideoDuration(normalizedVideoSettings.duration);
    if (!_.isEqual(videoResolution, normalizedVideoSettings.resolution)) setVideoResolution(normalizedVideoSettings.resolution);
    if (!_.isEqual(aspectRatio, normalizedVideoSettings.aspectRatio)) setAspectRatio(normalizedVideoSettings.aspectRatio);
  }, [cinematicMode, duration, genre, generationMode, generateType, imageGeneratorEngine, aspectRatio, inputType, stylePreset, thumbnailStylePreset, videoDuration, videoResolution, setDuration, setGenre, setInputType, setGenerateType, setGenerationMode, setImageGeneratorEngine, setVideoDuration, setVideoResolution, setAspectRatio, setStylePreset, setThumbnailStylePreset]);
  useEffect(() => {
    if (cinematicMode) {
      if (!_.isEqual(generationMode, ImageGenerationMode.LabsFlow)) setGenerationMode(ImageGenerationMode.LabsFlow);
      if (!_.isEqual(generateType, GenerateType.Video)) setGenerateType(GenerateType.Video);
      if (_.isEqual(imageGeneratorEngine, ImageGeneratorEngine.GrokImagine)) setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
      return;
    }
    if (_.includes([GenerateType.Video, GenerateType.Mixed], generateType) && !_.isEqual(generationMode, ImageGenerationMode.GeminiChat)) {
      setGenerationMode(ImageGenerationMode.GeminiChat);
    }
  }, [cinematicMode, generateType, generationMode, imageGeneratorEngine, setGenerateType, setGenerationMode, setImageGeneratorEngine]);
  useEffect(() => {
    if (!scopedSelectedProjectId || !isConfigLoaded || isProcessing) return;
    const foundProj = _.find(projects, { id: scopedSelectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(selectedProjectStorageKey, scopedSelectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const cachedLogsStr = storageUtils.get(`${projectLogsStoragePrefix}${foundProj.id}`);
      const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
      const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
      setLogs(projectLogs || []);
    }
  }, [scopedSelectedProjectId, projects, isConfigLoaded, isProcessing, setActiveCreatedProject, setRenderedVideoUrl, setLogs]);
  const { data: presetsData, refetch: refetchPresets } = usePresets();
  const presets = presetsData || [];
  const [presetNameInputState, setPresetNameInputState] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = SOURCE_TEMPLATE_SYMBOL_4(`${timestamp}`, `${msg}`);
    pipelineActions.setLogs((prev) => {
      const updated = [...prev, formatted];
      storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify(updated));
      return updated;
    });
  };
  const handleSavePreset = async () => {
    const trimmedName = _.trim(presetNameInputState);
    if (_.isEmpty(trimmedName)) return;
    const newPresetData = buildPresetPayload(state, trimmedName);
    try {
      const res = await fetch(API_ROUTES.PRESETS, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(newPresetData),
      });
      const saved = await res.json();
      if (saved && saved.id) {
        refetchPresets();
        setPresetNameInputState(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        addLog(T.logSavedPreset(saved.name));
      }
    } catch (err) {
      logger.error(REFACTOR_CONSTANTS.VD_EMPTY_STRING, err);
    }
  };
  const handleApplyPreset = (presetId: string) => {
    const preset = _.find(presets, { id: presetId });
    if (!preset) return;
    const config = _.get(preset, SOURCE_TEXT_CONFIG, {});
    applyPresetConfigToState(config, actions);
    setSelectedPresetId(presetId);
    addLog(T.logAppliedPreset(preset.name));
  };
  const handleDeletePreset = async (id: string) => {
    try {
      const res = await fetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PRESETS}`, `${id}`), {
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
  const handleMusicUpload = (files: FileList) => {
    const file = _.first(Array.from(files));
    if (!file) return;
    void readBlobAsDataUrl(file)
      .then(setMusicAssetUrl)
      .catch(() => toast.error(T.musicUploadError));
  };
  const handleStartAutoGenerate = (
    overrides: {
      forceRegenerateVoice?: boolean;
      forceRegenerateScenes?: boolean;
      resumeMode?: boolean;
      runIntent?: "new" | "continue" | "render_only";
      targetSceneIds?: string[];
    } = {},
  ): Promise<void> =>
    startPipeline({
      scriptContent,
      inputType: cinematicMode ? ProjectInputType.Idea : inputType,
      genre: cinematicMode ? VideoGenre.CINEMATIC_EPISODE : genre,
      language,
      duration,
      rewriteLevel: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.REWRITE_LEVEL : rewriteLevel,
      similarityReduction: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.SIMILARITY_REDUCTION : similarityReduction,
      creativityLevel: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.CREATIVITY_LEVEL : creativityLevel,
      factCheck: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.FACT_CHECK : factCheck,
      audience: cinematicMode ? (_.isEqual(language, ProjectLanguage.VI) ? CINEMATIC_CONFIG.PIPELINE_PROFILE.AUDIENCE_VI : CINEMATIC_CONFIG.PIPELINE_PROFILE.AUDIENCE_EN) : audience,
      writingStyle: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.WRITING_STYLE : writingStyle,
      splitStrategy: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.SPLIT_STRATEGY : splitStrategy,
      hookStrategy: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : hookStrategy,
      hookDuration: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : hookDuration,
      hookPosition: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_POSITION : hookPosition,
      voiceProvider: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.VOICE_PROVIDER : voiceProvider,
      voiceSpeed,
      voicePitch,
      voiceVolume,
      voiceURI: cinematicMode ? REFACTOR_CONSTANTS.VD_EMPTY_STRING : voiceURI,
      voiceName: cinematicMode ? REFACTOR_CONSTANTS.VD_EMPTY_STRING : voiceName,
      generationMode: cinematicMode ? ImageGenerationMode.LabsFlow : generationMode,
      imageGeneratorEngine,
      generateType: cinematicMode ? GenerateType.Video : generateType,
      maxVideoScenes: cinematicMode ? CINEMATIC_CONFIG.UNLIMITED_VIDEO_SCENES : maxVideoScenes,
      aspectRatio,
      promptInputMethod,
      sampleCount: cinematicMode ? 1 : sampleCount,
      videoDuration,
      videoResolution,
      chromeHeadless,
      geminiChatSpeed,
      batchDelay,
      stylePreset,
      styleBackgroundMode: cinematicMode ? BackgroundMode.Contextual : styleBackgroundMode,
      styleTextInImageMode: cinematicMode ? TextInImageMode.NoText : styleTextInImageMode,
      imageFocusMode,
      referenceImages: cinematicMode ? [] : referenceImages,
      sceneReferenceImages: cinematicMode ? [] : sceneReferenceImages,
      characterImages: cinematicMode ? [] : characterImages,
      thumbnailCount,
      thumbnailStylePreset,
      thumbnailBackgroundMode,
      thumbnailTextInImageMode,
      thumbnailImageFocusMode,
      thumbnailReferenceImages: cinematicMode ? [] : thumbnailReferenceImages,
      thumbnailSceneReferenceImages: cinematicMode ? [] : thumbnailSceneReferenceImages,
      projectName,
      resumeMode: overrides.resumeMode ?? resumeMode,
      runIntent: overrides.runIntent,
      ffmpegQuality,
      selectedProjectId: scopedSelectedProjectId,
      forceRegenerateVoice: overrides.forceRegenerateVoice,
      forceRegenerateScenes: overrides.forceRegenerateScenes,
      targetSceneIds: overrides.targetSceneIds,
      musicAssetUrl,
      subtitleMode: cinematicMode ? cinematicSubtitleMode : undefined,
      cinematicMode,
      filmFormat: cinematicMode ? CINEMATIC_CONFIG.SERIES_MODE.SINGLE : undefined,
      episodeCount: cinematicMode ? CINEMATIC_CONFIG.SINGLE_EPISODE_COUNT : undefined,
      planningFallbackProvider,
      planningChatModel,
      planningExecutionMode,
      planningChromeHeadless,
    });
  const recoveredPipelineProjectIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isConfigLoaded || isProcessing || !activeCreatedProject) return;
    const activeProjectIsCinematic = _.isEqual(activeCreatedProject.projectKind, ProjectKind.Cinematic) || _.endsWith(_.toString(activeCreatedProject.name), SOURCE_TEXT_PHIM_AI);
    if (!_.isEqual(cinematicMode, activeProjectIsCinematic)) return;
    if (!_.isEqual(activeCreatedProject.status, REFACTOR_CONSTANTS.STATUS_GENERATING)) return;
    if (_.isEmpty(activeCreatedProject.activeRunId)) return;
    if (recoveredPipelineProjectIdsRef.current.has(activeCreatedProject.id)) return;
    if (!_.isEqual(scopedSelectedProjectId, activeCreatedProject.id)) return;
    if (_.isEmpty(_.trim(scriptContent))) return;
    recoveredPipelineProjectIdsRef.current.add(activeCreatedProject.id);
    void handleStartAutoGenerate({ resumeMode: true });
  }, [activeCreatedProject, cinematicMode, isConfigLoaded, isProcessing, scriptContent, scopedSelectedProjectId]);
  const [regeneratingTarget, setRegeneratingTarget] = useState<string | null>(null);
  const regenerationTexts = useMemo(() => _.get(REGENERATION_TEXTS, currentLang, REGENERATION_TEXTS.vi), [currentLang]);
  const handleRegenerate = async (target: string, sceneId?: string) => {
    const project = activeCreatedProject;
    if (!project || isProcessing) return;
    if (cinematicMode && _.isEqual(target, REGENERATION_TARGET.IMAGES) && _.isEmpty(sceneId)) {
      toast.error(regenerationTexts.sceneRequired);
      return;
    }
    setRegeneratingTarget(target);
    try {
      const isRenderOnly = _.isEqual(target, REGENERATION_TARGET.RENDER);
      const isDeleteSuccess = isRenderOnly || (await deleteProjectRegenerationAssets(project.id, target, sceneId));
      if (!isDeleteSuccess) {
        toast.error(regenerationTexts.failed);
        return;
      }
      if (!isRenderOnly) pipelineActions.setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const { updatedProject, changed } = isRenderOnly ? { updatedProject: project, changed: false } : applyProjectRegenerationReset(project, target, sceneId);
      if (changed) {
        setActiveCreatedProject(updatedProject);
        await onUpdateProject(updatedProject, true);
      }
      if (_.isEqual(target, REGENERATION_TARGET.VOICE)) {
        await handleStartAutoGenerate({ forceRegenerateVoice: true, resumeMode: true });
      } else if (_.isEqual(target, REGENERATION_TARGET.IMAGES)) {
        await handleStartAutoGenerate({
          forceRegenerateScenes: _.isEmpty(sceneId),
          resumeMode: true,
          targetSceneIds: sceneId ? [sceneId] : undefined,
        });
      } else if (_.isEqual(target, REGENERATION_TARGET.RENDER)) {
        await handleStartAutoGenerate({ resumeMode: true, runIntent: SOURCE_TEXT_RENDER_ONLY });
      }
    } catch (err: unknown) {
      const errorMessage = _.get(err, SOURCE_TEXT_MESSAGE, regenerationTexts.failed);
      toast.error(errorMessage);
    } finally {
      setRegeneratingTarget(null);
    }
  };
  const handleVoiceSelectAndClose = (v: CatalogVoice) => {
    setVoiceURI(v.voice_id);
    setVoiceName(v.name);
    setVoiceProvider(v.provider || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    setIsVoiceDialogOpen(false);
  };
  const lockedGenreLabel = useMemo(() => (cinematicMode ? genreLabels[VideoGenre.CINEMATIC_EPISODE] : undefined), [cinematicMode]);
  if (!isConfigLoaded) {
    return <AutoVideoStudioSkeleton />;
  }
  return (
    <div className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full")}>
        {!cinematicMode && <PresetSection presets={presets} selectedPresetId={selectedPresetId} presetNameInputState={presetNameInputState} setPresetNameInputState={setPresetNameInputState} handleSavePreset={handleSavePreset} handleApplyPreset={handleApplyPreset} handleDeletePreset={handleDeletePreset} T={T} truncateWords={truncateWords} />}
        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6")}>
          <div className={cn("lg:col-span-2 flex flex-col gap-5 h-full justify-stretch min-w-0")}>
            {cinematicMode ? (
              <CinematicFilmSetupSection
                idea={scriptContent}
                setIdea={setScriptContent}
                language={language}
                setLanguage={setLanguage}
                duration={duration}
                setDuration={setDuration}
                planningFallbackProvider={planningFallbackProvider}
                setPlanningFallbackProvider={setPlanningFallbackProvider}
                planningChatModel={planningChatModel}
                setPlanningChatModel={setPlanningChatModel}
                planningExecutionMode={planningExecutionMode}
                setPlanningExecutionMode={setPlanningExecutionMode}
                planningChromeHeadless={planningChromeHeadless}
                setPlanningChromeHeadless={setPlanningChromeHeadless}
                currentLang={currentLang}
              />
            ) : (
              <ProjectInputSection inputType={inputType} setInputType={setInputType} scriptContent={scriptContent} setScriptContent={setScriptContent} T={T} />
            )}
            {!cinematicMode && (
              <ChatPlanningSettingsBlock provider={planningFallbackProvider} model={planningChatModel} onProviderChange={setPlanningFallbackProvider} onModelChange={setPlanningChatModel} executionMode={planningExecutionMode} onExecutionModeChange={setPlanningExecutionMode} chromeHeadless={planningChromeHeadless} onChromeHeadlessChange={setPlanningChromeHeadless} currentLang={currentLang} />
            )}
            {!cinematicMode && <VoiceSelectionSection voiceName={voiceName} voiceURI={voiceURI} voiceProvider={voiceProvider} isVoiceDialogOpen={isVoiceDialogOpen} setIsVoiceDialogOpen={setIsVoiceDialogOpen} voiceDialogPersistenceScope={CINEMATIC_CONFIG.PERSISTENCE_SCOPE} currentLang={currentLang} handleVoiceSelect={handleVoiceSelectAndClose} truncateWords={truncateWords} T={T} />}
            <div className={cn("bg-slate-955/50 rounded-xl p-5 space-y-5 shadow-inner w-full")}>
              <GenerationSettingsSection
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
                imageGeneratorEngine={imageGeneratorEngine}
                setImageGeneratorEngine={setImageGeneratorEngine}
                generateType={generateType}
                setGenerateType={setGenerateType}
                maxVideoScenes={maxVideoScenes}
                setMaxVideoScenes={setMaxVideoScenes}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                T={T}
                getImageEngineOptions={getImageEngineOptions}
                mediaMixTexts={mediaMixTexts}
                forceVideoOnly={cinematicMode}
                chromeHeadless={chromeHeadless}
                setChromeHeadless={setChromeHeadless}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                videoResolution={videoResolution}
                setVideoResolution={setVideoResolution}
                currentLang={currentLang}
              />
              {!cinematicMode && (
                <AdvancedImageSettingsSection
                  showAdvancedImageSettings={showAdvancedImageSettings}
                  setShowAdvancedImageSettings={setShowAdvancedImageSettings}
                  chromeHeadless={chromeHeadless}
                  setChromeHeadless={setChromeHeadless}
                  resumeMode={resumeMode}
                  setResumeMode={setResumeMode}
                  backgroundMode={styleBackgroundMode}
                  setBackgroundMode={setStyleBackgroundMode}
                  textMode={styleTextInImageMode}
                  setTextMode={setStyleTextInImageMode}
                  imageFocusMode={imageFocusMode}
                  setImageFocusMode={setImageFocusMode}
                  language={currentLang as AppLanguage}
                  T={T}
                />
              )}
              <div className={cn("pt-2 border-t border-slate-800/80")}>
                <StylePresetSelector selectedStyle={stylePreset} onSelectStyle={setStylePreset} language={currentLang} accentColor={CINEMATIC_CONFIG.ACCENT_COLOR_BLUE} genre={genre} allowedPresetIds={cinematicMode ? CINEMATIC_FILM_STYLE_PRESET_IDS : undefined} />
              </div>
            </div>
            <ProjectSettingsSection
              genre={genre}
              projectName={projectName}
              setProjectName={setProjectName}
              thumbnailCount={thumbnailCount}
              setThumbnailCount={setThumbnailCount}
              thumbnailStylePreset={thumbnailStylePreset}
              setThumbnailStylePreset={setThumbnailStylePreset}
              backgroundMode={thumbnailBackgroundMode}
              setBackgroundMode={setThumbnailBackgroundMode}
              textInImageMode={thumbnailTextInImageMode}
              setTextInImageMode={setThumbnailTextInImageMode}
              imageFocusMode={thumbnailImageFocusMode}
              setImageFocusMode={setThumbnailImageFocusMode}
              language={currentLang as AppLanguage}
              T={T}
              musicAssetUrl={musicAssetUrl}
              subtitleMode={cinematicMode ? cinematicSubtitleMode : undefined}
              setSubtitleMode={cinematicMode ? setCinematicSubtitleMode : undefined}
              onMusicUpload={handleMusicUpload}
              onRemoveMusic={() => setMusicAssetUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
              allowedStylePresetIds={cinematicMode ? CINEMATIC_FILM_STYLE_PRESET_IDS : undefined}
            />
          </div>
          <div className={cn("space-y-6 flex flex-col min-w-0")}>
            <ActionPanelSection
              scriptContent={scriptContent}
              isProcessing={isProcessing}
              isCancelling={isCancelling}
              currentStepIndex={currentStepIndex}
              stepProgress={stepProgress}
              handleStartAutoGenerate={() => handleStartAutoGenerate({ resumeMode: false, runIntent: SOURCE_TEXT_NEW })}
              handleContinueAutoGenerate={() => handleStartAutoGenerate({ resumeMode: true, runIntent: SOURCE_TEXT_CONTINUE })}
              canContinue={canContinueProject}
              cancelPipeline={cancelPipeline}
              T={T}
              cinematicMode={cinematicMode}
              currentLang={currentLang}
              estimatedClipCount={cinematicEstimate.clips}
              estimatedBatchCount={cinematicEstimate.batches}
            />
            {!cinematicMode && <ScriptSettingsCard genre={genre} setGenre={setGenre} language={language} setLanguage={setLanguage} duration={duration} setDuration={setDuration} splitStrategy={splitStrategy} setSplitStrategy={setSplitStrategy} splitLabelMap={splitLabelMap} T={T} lockedGenreLabel={lockedGenreLabel} currentLang={currentLang} />}
            <LogPanelSection logs={logs} theme={theme} T={T} language={currentLang} context={cinematicMode ? ProgressLogContext.Cinematic : ProgressLogContext.Automatic} />
            <PreviewPanelSection renderedVideoUrl={renderedVideoUrl} projectName={projectName} activeCreatedProject={presentationProject} isProcessing={isProcessing} regeneratingTarget={regeneratingTarget} handleRegenerate={handleRegenerate} T={T} regenerationTexts={regenerationTexts} showVoiceRegeneration={!cinematicMode} regenerateVideoClips={cinematicMode} canRegenerate={canRegenerate} />
            <ThumbnailsPreviewSection activeCreatedProject={presentationProject} currentLang={currentLang} />
            <SeoPanelSection activeCreatedProject={presentationProject} />
          </div>
        </div>
      </div>
    </div>
  );
}
